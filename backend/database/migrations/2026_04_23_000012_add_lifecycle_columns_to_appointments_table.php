<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (! Schema::hasColumn('appointments', 'checked_in_at')) {
                $table->timestamp('checked_in_at')->nullable()->after('status');
            }
            if (! Schema::hasColumn('appointments', 'checked_in_by')) {
                $table->unsignedBigInteger('checked_in_by')->nullable()->after('checked_in_at');
            }
            if (! Schema::hasColumn('appointments', 'assigned_staff_id')) {
                $table->unsignedBigInteger('assigned_staff_id')->nullable()->after('checked_in_by');
            }
            if (! Schema::hasColumn('appointments', 'service_started_at')) {
                $table->timestamp('service_started_at')->nullable()->after('assigned_staff_id');
            }
            if (! Schema::hasColumn('appointments', 'service_completed_at')) {
                $table->timestamp('service_completed_at')->nullable()->after('service_started_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            foreach (['service_completed_at', 'service_started_at', 'assigned_staff_id', 'checked_in_by', 'checked_in_at'] as $column) {
                if (Schema::hasColumn('appointments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
