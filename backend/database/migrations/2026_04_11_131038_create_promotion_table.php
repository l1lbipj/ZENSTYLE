<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
            $table->BigInteger('service_id')->unsigned()->nullable();
            $table->integer('percent');
            $table->string('promotion_code',20);
            $table->date('expiration_date');
            $table->integer('usage_limit');
            $table->timestamps();
            $table->foreign('service_id')->references('service_id')->on('services');
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
