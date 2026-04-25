<?php

namespace App\Services;

use App\Models\Allergy;
use App\Models\Client;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AllergyService
{
    public function catalog(): Collection
    {
        return Allergy::query()
            ->select('allergy_id', 'allergy_name', 'created_at', 'updated_at')
            ->orderBy('allergy_name')
            ->get();
    }

    /**
     * @return array{selected: Collection, orphaned: Collection, selected_ids: array<int, int>}
     */
    public function resolveSelections(Client $client): array
    {
        $selectedIds = $this->selectedIds($client);
        $catalog = $this->catalog()->keyBy(fn ($item) => (int) $item->allergy_id);

        $selected = collect($selectedIds)
            ->map(fn (int $id) => $catalog->get($id))
            ->filter()
            ->values()
            ->map(fn ($item) => [
                'allergy_id' => (int) $item->allergy_id,
                'allergy_name' => $item->allergy_name,
            ]);

        $orphaned = collect($selectedIds)
            ->filter(fn (int $id) => ! $catalog->has($id))
            ->values()
            ->map(fn (int $id) => [
                'allergy_id' => $id,
                'allergy_name' => 'Archived allergy #'.$id,
            ]);

        return [
            'selected' => $selected,
            'orphaned' => $orphaned,
            'selected_ids' => $selected->pluck('allergy_id')->all(),
        ];
    }

    /**
     * @param array<int, int|string> $allergyIds
     * @return array<int, int>
     */
    public function normalizeSelection(array $allergyIds): array
    {
        $requestedIds = collect($allergyIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        if ($requestedIds->isEmpty()) {
            return [];
        }

        return Allergy::query()
            ->whereIn('allergy_id', $requestedIds->all())
            ->orderBy('allergy_name')
            ->pluck('allergy_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param array<int, int|string> $allergyIds
     */
    public function syncClientSelections(Client $client, array $allergyIds = []): void
    {
        $normalizedIds = $this->normalizeSelection($allergyIds);

        try {
            DB::table('clients')
                ->where('client_id', $client->getKey())
                ->update([
                    'allergy_preferences' => json_encode(array_values($normalizedIds)),
                    'updated_at' => now(),
                ]);
        } catch (\Throwable) {
            // Older deployments may not have the JSON column yet.
        }

        if (Schema::hasTable('client_allergies')) {
            $client->allergies()->sync($normalizedIds);
        }
    }

    public function removeAllergyReferences(int $allergyId): void
    {
        try {
            Client::query()
                ->select('client_id', 'allergy_preferences')
                ->chunkById(100, function ($clients) use ($allergyId): void {
                    foreach ($clients as $client) {
                        $preferences = collect($client->allergy_preferences ?? [])
                            ->map(fn ($id) => (int) $id)
                            ->filter(fn (int $id) => $id > 0 && $id !== $allergyId)
                            ->values()
                            ->all();

                        DB::table('clients')
                            ->where('client_id', $client->client_id)
                            ->update([
                                'allergy_preferences' => empty($preferences) ? null : json_encode($preferences),
                                'updated_at' => now(),
                            ]);
                    }
                }, 'client_id');
        } catch (\Throwable) {
            // Ignore if the JSON column is absent on a legacy database.
        }

        if (Schema::hasTable('client_allergies')) {
            DB::table('client_allergies')->where('allergy_id', $allergyId)->delete();
        }
    }

    /**
     * @return array<int, int>
     */
    public function selectedIds(Client $client): array
    {
        try {
            return collect($client->allergy_preferences ?? [])
                ->map(fn ($id) => (int) $id)
                ->filter(fn (int $id) => $id > 0)
                ->unique()
                ->values()
                ->all();
        } catch (\Throwable) {
            // Fall through to pivot-backed legacy storage.
        }

        if (Schema::hasTable('client_allergies')) {
            return DB::table('client_allergies')
                ->where('client_id', $client->getKey())
                ->pluck('allergy_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();
        }

        return [];
    }
}
