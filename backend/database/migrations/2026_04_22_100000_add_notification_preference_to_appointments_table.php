<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (! Schema::hasColumn('appointments', 'notification_preference')) {
                $table->enum('notification_preference', ['sms', 'email', 'both'])
                    ->default('both')
                    ->after('reminder_sent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'notification_preference')) {
                $table->dropColumn('notification_preference');
            }
        });
    }
};
