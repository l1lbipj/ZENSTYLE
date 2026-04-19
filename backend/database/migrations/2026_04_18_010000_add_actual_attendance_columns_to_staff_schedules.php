<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_schedules', function (Blueprint $table) {
            if (! Schema::hasColumn('staff_schedules', 'actual_check_in')) {
                $table->dateTime('actual_check_in')->nullable()->after('check_out');
            }
            if (! Schema::hasColumn('staff_schedules', 'actual_check_out')) {
                $table->dateTime('actual_check_out')->nullable()->after('actual_check_in');
            }
        });
    }

    public function down(): void
    {
        Schema::table('staff_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('staff_schedules', 'actual_check_out')) {
                $table->dropColumn('actual_check_out');
            }
            if (Schema::hasColumn('staff_schedules', 'actual_check_in')) {
                $table->dropColumn('actual_check_in');
            }
        });
    }
};
