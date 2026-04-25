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
                // Ignore and try the next syntax.
            }
        }
    }

    public function up(): void
    {
        foreach ([
            'check_item_reference',
            'chk_appointment_details_quantity',
        ] as $constraint) {
            $this->dropCheckConstraint('appointment_details', $constraint);
        }

        Schema::table('appointment_details', function ($table) {
            /** @var \Illuminate\Database\Schema\Blueprint $table */
            if (Schema::hasColumn('appointment_details', 'product_id')) {
                try {
                    $table->dropForeign(['product_id']);
                } catch (\Throwable $e) {
                    // Ignore if the foreign key was already removed.
                }
            }

            foreach (['item_type', 'product_id', 'quantity'] as $column) {
                if (Schema::hasColumn('appointment_details', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointment_details', function ($table) {
            /** @var \Illuminate\Database\Schema\Blueprint $table */
            if (! Schema::hasColumn('appointment_details', 'item_type')) {
                $table->string('item_type', 20)->nullable()->after('staff_id');
            }
            if (! Schema::hasColumn('appointment_details', 'product_id')) {
                $table->unsignedBigInteger('product_id')->nullable()->after('service_id');
            }
            if (! Schema::hasColumn('appointment_details', 'quantity')) {
                $table->unsignedInteger('quantity')->default(1)->after('product_id');
            }
        });

        if (Schema::hasColumn('appointment_details', 'product_id')) {
            try {
                Schema::table('appointment_details', function ($table) {
                    /** @var \Illuminate\Database\Schema\Blueprint $table */
                    $table->foreign('product_id')
                        ->references('product_id')
                        ->on('products')
                        ->restrictOnDelete();
                });
            } catch (\Throwable $e) {
                // Ignore if the key already exists or cannot be recreated.
            }
        }
    }
};
