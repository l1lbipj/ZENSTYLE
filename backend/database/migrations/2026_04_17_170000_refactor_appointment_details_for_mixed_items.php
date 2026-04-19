<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function dropCheckConstraint(string $table, string $constraint): void
    {
        foreach ([
            "ALTER TABLE {$table} DROP CHECK {$constraint}",
            "ALTER TABLE {$table} DROP CONSTRAINT {$constraint}",
        ] as $sql) {
            try {
                DB::statement($sql);
                return;
            } catch (\Throwable $e) {
                // Try next syntax (MySQL vs MariaDB compatibility).
            }
        }
    }

    public function up(): void
    {
        // Add new columns first (nullable), then backfill, then enforce NOT NULL.
        Schema::table('appointment_details', function ($table) {
            /** @var \Illuminate\Database\Schema\Blueprint $table */
            if (! Schema::hasColumn('appointment_details', 'item_id')) {
                $table->unsignedBigInteger('item_id')->nullable()->after('item_type');
            }
        });

        // Drop constraints that no longer fit "product items can have no time/staff".
        foreach ([
            'check_total_price',
            'check_time_range',
            'check_item_reference',
        ] as $checkName) {
            $this->dropCheckConstraint('appointment_details', $checkName);
        }

        // Make columns flexible for mixed items, and rename total_price -> price.
        // Use raw SQL to avoid requiring doctrine/dbal.
        try {
            DB::statement("ALTER TABLE appointment_details MODIFY staff_id BIGINT UNSIGNED NULL");
        } catch (\Throwable $e) {
            // ignore
        }
        try {
            DB::statement("ALTER TABLE appointment_details MODIFY start_time TIME NULL");
            DB::statement("ALTER TABLE appointment_details MODIFY end_time TIME NULL");
        } catch (\Throwable $e) {
            // ignore
        }

        // Convert legacy enum('skin','hair') into a string, then backfill to 'service'/'product'.
        try {
            DB::statement("ALTER TABLE appointment_details MODIFY item_type VARCHAR(10) NOT NULL");
        } catch (\Throwable $e) {
            // ignore
        }

        // Rename total_price -> price (line total) and keep it required.
        try {
            DB::statement("ALTER TABLE appointment_details CHANGE total_price price DECIMAL(12,2) UNSIGNED NOT NULL");
        } catch (\Throwable $e) {
            // If already renamed, ignore.
        }

        // Backfill item_type + item_id for existing rows.
        // Prefer service if present.
        DB::table('appointment_details')
            ->whereNotNull('service_id')
            ->update([
                'item_type' => 'service',
                'item_id' => DB::raw('service_id'),
            ]);

        DB::table('appointment_details')
            ->whereNull('service_id')
            ->whereNotNull('product_id')
            ->update([
                'item_type' => 'product',
                'item_id' => DB::raw('product_id'),
            ]);

        // Enforce item_id not null once backfilled.
        try {
            DB::statement("ALTER TABLE appointment_details MODIFY item_id BIGINT UNSIGNED NOT NULL");
        } catch (\Throwable $e) {
            // ignore
        }

        // Re-add relaxed checks for price and time.
        try {
            DB::statement("ALTER TABLE appointment_details ADD CONSTRAINT check_price CHECK (price > 0)");
        } catch (\Throwable $e) {
            // ignore
        }
        try {
            DB::statement("ALTER TABLE appointment_details ADD CONSTRAINT check_time_range_nullable CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time)");
        } catch (\Throwable $e) {
            // ignore
        }
    }

    public function down(): void
    {
        // Best-effort rollback: convert back to old column name and drop new column.
        foreach ([
            'check_price',
            'check_time_range_nullable',
        ] as $checkName) {
            $this->dropCheckConstraint('appointment_details', $checkName);
        }

        try {
            DB::statement("ALTER TABLE appointment_details CHANGE price total_price DECIMAL(12,2) UNSIGNED NOT NULL");
        } catch (\Throwable $e) {
            // ignore
        }

        Schema::table('appointment_details', function ($table) {
            /** @var \Illuminate\Database\Schema\Blueprint $table */
            if (Schema::hasColumn('appointment_details', 'item_id')) {
                $table->dropColumn('item_id');
            }
        });
    }
};

