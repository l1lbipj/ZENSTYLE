<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Admin::firstOrCreate(
            ['email' => 'admin@zenstyle.com'],
            [
                'admin_name' => 'Admin',
                'password' => Hash::make('Admin@12345'),
                'status' => 'active',
            ]
        );

        Admin::firstOrCreate(
            ['email' => 'manager@zenstyle.com'],
            [
                'admin_name' => 'Manager',
                'password' => Hash::make('Manager@12345'),
                'status' => 'active',
            ]
        );
    }
}
