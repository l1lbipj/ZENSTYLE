<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Keep admin accounts stable (do not overwrite).
        $this->call(AdminSeeder::class);

        // Seed the rest of the domain data with realistic English demo data.
        $this->call(ZenstyleFullSeeder::class);
    }
}
