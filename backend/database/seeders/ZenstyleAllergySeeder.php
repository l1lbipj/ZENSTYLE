<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZenstyleAllergySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $allergies = [
            'Fragrance / Perfume',
            'Essential oils',
            'Alcohol-based products',
            'Parabens',
            'Sulfates (SLS/SLES)',
            'Lanolin',
            'Latex',
            'Nickel',
            'Hair dye (PPD)',
            'Acrylic (nail)',
            'Tea tree oil',
            'Coconut derivatives',
            'Silicones',
            'Aloe vera',
            'Wheat protein',
            'Retinol',
            'Salicylic acid',
            'Formaldehyde',
            'Henna dye',
            'Synthetic fragrance',
        ];

        foreach ($allergies as $name) {
            DB::table('allergies')->updateOrInsert(
                ['allergy_name' => $name],
                [
                    'allergy_name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
