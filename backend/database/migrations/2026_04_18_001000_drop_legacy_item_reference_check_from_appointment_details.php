<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function dropLegacyCheck(): void
    {
        foreach ([
            'ALTER TABLE appointment_details DROP CHECK check_item_reference',
            'ALTER TABLE appointment_details DROP CONSTRAINT check_item_reference',
        ] as $sql) {
            try {
                DB::statement($sql);
                return;
            } catch (\Throwable $e) {
                // Keep trying because syntax differs between MySQL and MariaDB.
            }
        }
    }

    public function up(): void
    {
        $this->dropLegacyCheck();
    }

    public function down(): void
    {
        try {
            DB::statement('ALTER TABLE appointment_details ADD CONSTRAINT check_item_reference CHECK (service_id IS NOT NULL OR product_id IS NOT NULL)');
        } catch (\Throwable $e) {
            // Ignore when old columns/check no longer exist.
        }
    }
};
