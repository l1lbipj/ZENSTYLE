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
        Schema::create('client_allergies', function (Blueprint $table) {
            $table->id('client_allergy_id');
            $table->foreignId('client_id')->constrained('clients','client_id')->cascadeOnDelete();
            $table->foreignId('allergy_id')->constrained('allergies','allergy_id')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['client_id', 'allergy_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_allergies');
    }
};
