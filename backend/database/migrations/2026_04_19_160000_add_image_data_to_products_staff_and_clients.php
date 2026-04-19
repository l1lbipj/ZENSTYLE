<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('image_url');
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('password');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('image_data');
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn('image_data');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('image_data');
        });
    }
};
