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
        Admin::create([
            'admin_name' => 'Admin',
            'email' => 'admin@zenstyle.com',
            'password' => Hash::make('Admin@12345'),
            'status' => 'active',
        ]);

        Admin::create([
            'admin_name' => 'Manager',
            'email' => 'manager@zenstyle.com',
            'password' => Hash::make('Manager@12345'),
            'status' => 'active',
        ]);
    }
}
