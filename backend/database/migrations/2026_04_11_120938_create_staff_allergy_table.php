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
            $table->foreignId('staff_id')->constrained('staff','staff_id')->cascadeOnDelete();
            $table->foreignId('allergy_id')->constrained('allergy','allergy_id')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['staff_id', 'allergy_id']);
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
