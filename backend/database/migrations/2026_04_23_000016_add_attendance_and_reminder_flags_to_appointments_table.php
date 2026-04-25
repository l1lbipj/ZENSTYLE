<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (! Schema::hasColumn('appointments', 'attendance_status')) {
                $table->enum('attendance_status', ['Pending', 'Checked-In', 'Completed', 'Missed', 'Cancelled'])
                    ->default('Pending')
                    ->after('status');
            }
            if (! Schema::hasColumn('appointments', 'check_in_time')) {
                $table->timestamp('check_in_time')->nullable()->after('attendance_status');
            }
            if (! Schema::hasColumn('appointments', 'check_out_time')) {
                $table->timestamp('check_out_time')->nullable()->after('check_in_time');
            }
            if (! Schema::hasColumn('appointments', 'reminder_sent')) {
                $table->boolean('reminder_sent')->default(false)->after('notification_preference');
            }
        });

        if (Schema::hasColumn('appointments', 'reminder_sent') && Schema::hasColumn('appointments', 'reminder_sent_at')) {
            DB::table('appointments')
                ->whereNotNull('reminder_sent_at')
                ->update(['reminder_sent' => true]);
        }

        if (Schema::hasColumn('appointments', 'attendance_status')) {
            DB::statement("
                UPDATE appointments
                SET attendance_status = CASE
                    WHEN check_out_time IS NOT NULL OR service_completed_at IS NOT NULL THEN 'Completed'
                    WHEN check_in_time IS NOT NULL OR checked_in_at IS NOT NULL THEN 'Checked-In'
                    WHEN status = 'inactive' THEN 'Cancelled'
                    ELSE 'Pending'
                END
            ");
        }
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            foreach (['check_out_time', 'check_in_time', 'attendance_status', 'reminder_sent'] as $column) {
                if (Schema::hasColumn('appointments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
