<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('promotion', function (Blueprint $table) {
            $table->id('promotion_id');
            $table->string('apply_type',100);
            $table->foreignId('service_id')->nullable()->constrained('services','service_id')->nullOnDelete();
            $table->unsignedTinyInteger('percent');
            $table->string('promotion_code',20)->unique();
            $table->date('expiration_date');
            $table->unsignedInteger('usage_limit')->default(1);
            $table->timestamps();
        });
        DB::statement('ALTER TABLE promotion ADD CONSTRAINT check_usage_limit CHECK (usage_limit > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotion');
    }
};
