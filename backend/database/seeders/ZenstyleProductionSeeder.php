<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ZenstyleProductionSeeder extends Seeder
{
    public function run(): void
    {
        $tables = [
            'inventory_logs',
            'staff_schedules',
            'appointment_details',
            'feedback',
            'appointments',
            'customer_order_items',
            'customer_orders',
            'order_details',
            'purchase_orders',
            'promotions',
            'services',
            'service_categories',
            'product_categories',
            'work_shifts',
            'client_product_preferences',
            'client_staff_preferences',
            'client_allergies',
            'products',
            'suppliers',
            'allergies',
            'password_reset_otps',
            'password_reset_tokens',
            'personal_access_tokens',
            'admins',
            'staff',
            'clients',
            'users',
        ];

        Schema::disableForeignKeyConstraints();
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }
        Schema::enableForeignKeyConstraints();

        $this->call([
            ZenstyleAuthSeeder::class,
            ZenstyleCatalogSeeder::class,
            ZenstyleAllergySeeder::class,
            ZenstyleClientPreferenceSeeder::class,
            ZenstyleAppointmentSeeder::class,
            ZenstyleCustomerOrderSeeder::class,
            ZenstylePurchaseOrderSeeder::class,
        ]);
    }
}
