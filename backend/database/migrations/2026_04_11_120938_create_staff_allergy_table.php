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
        Schema::create('staff_allergy', function (Blueprint $table) {
            $table->id('staff_allergy_id');
            $table->BigInteger('staff_id')->unsigned();
            $table->BigInteger('allergy_id')->unsigned();
            $table->timestamps();
            $table->foreign('staff_id')->references('staff_id')->on('staff')->cascadeOnDelete();
            $table->foreign('allergy_id')->references('allergy_id')->on('allergy')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_allergy');
    }
};
