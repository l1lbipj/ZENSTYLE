<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ZenstyleClientPreferenceSeeder extends Seeder
{
    private function favoriteProductsTable(): string
    {
        if (Schema::hasTable('client_product_preferences') && Schema::hasColumn('client_product_preferences', 'product_id')) {
            return 'client_product_preferences';
        }

        return Schema::hasTable('client_favorite_products') ? 'client_favorite_products' : 'client_product_preferences';
    }

    public function run(): void
    {
        if (! Schema::hasTable('client_allergies') || ! Schema::hasTable('products')) {
            return;
        }

        $now = now();
        $clientIds = DB::table('clients')->orderBy('client_id')->pluck('client_id')->all();
        $allergyIds = DB::table('allergies')->orderBy('allergy_id')->pluck('allergy_id')->all();
        $productIds = DB::table('products')->orderBy('product_id')->pluck('product_id')->all();
        $favoritesTable = $this->favoriteProductsTable();

        if ($clientIds === [] || $allergyIds === [] || $productIds === []) {
            return;
        }

        foreach ($clientIds as $index => $clientId) {
            $allergyId = $allergyIds[$index % count($allergyIds)];
            $productId = $productIds[$index % count($productIds)];
            $allergySet = [$allergyId];

            DB::table($favoritesTable)->updateOrInsert(
                ['client_id' => $clientId, 'product_id' => $productId],
                [
                    'client_id' => $clientId,
                    'product_id' => $productId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('client_allergies')->updateOrInsert(
                ['client_id' => $clientId, 'allergy_id' => $allergyId],
                [
                    'client_id' => $clientId,
                    'allergy_id' => $allergyId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('clients')
                ->where('client_id', $clientId)
                ->update([
                    'allergy_preferences' => json_encode($allergySet),
                    'updated_at' => $now,
                ]);
        }
    }
}
