<?php

namespace App\Support;

use App\Models\Allergy;
use App\Models\Client;

class ClientAllergySync
{
    /**
     * @param array<int, int|string> $allergyIds
     * @param array<int, string> $customAllergies
     */
    public function sync(Client $client, array $allergyIds = [], array $customAllergies = []): void
    {
        $resolvedIds = collect($allergyIds)
            ->map(static fn ($id) => (int) $id)
            ->filter(static fn ($id) => $id > 0)
            ->values();

        $normalizedNames = collect($customAllergies)
            ->map(static fn ($name) => trim((string) $name))
            ->filter(static fn ($name) => $name !== '')
            ->unique(static fn ($name) => mb_strtolower($name));

        foreach ($normalizedNames as $name) {
            $allergy = Allergy::query()
                ->whereRaw('LOWER(allergy_name) = ?', [mb_strtolower($name)])
                ->first();

            if (! $allergy) {
                $allergy = Allergy::create(['allergy_name' => $name]);
            }

            $resolvedIds->push((int) $allergy->allergy_id);
        }

        $client->allergies()->sync($resolvedIds->unique()->values()->all());
    }
}
