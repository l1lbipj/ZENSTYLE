<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table): void {
            if (! Schema::hasColumn('admins', 'phone')) {
                $table->string('phone', 15)->nullable()->unique()->after('email');
            }

            if (! Schema::hasColumn('admins', 'dob')) {
                $table->date('dob')->nullable()->after('phone');
            }
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table): void {
            if (Schema::hasColumn('admins', 'phone')) {
                $table->dropUnique('admins_phone_unique');
                $table->dropColumn('phone');
            }

            if (Schema::hasColumn('admins', 'dob')) {
                $table->dropColumn('dob');
            }
        });
    }
};
