<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointment_details', function (Blueprint $table) {
            if (! Schema::hasColumn('appointment_details', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('status');
            }
            if (! Schema::hasColumn('appointment_details', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('started_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointment_details', function (Blueprint $table) {
            foreach (['completed_at', 'started_at'] as $column) {
                if (Schema::hasColumn('appointment_details', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
