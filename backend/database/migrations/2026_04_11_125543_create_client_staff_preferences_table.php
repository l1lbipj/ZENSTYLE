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
        Schema::create('client_staff_preferences', function (Blueprint $table) {
            $table->id('preference_id');
            $table->foreignId('client_id')->constrained('clients','client_id')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff','staff_id')->cascadeOnDelete();
            $table->text('note');
            $table->timestamps();
            $table->unique(['client_id', 'staff_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_staff_preferences');
    }
};
