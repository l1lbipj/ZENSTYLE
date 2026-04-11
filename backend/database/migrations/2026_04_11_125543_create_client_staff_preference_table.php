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
        Schema::create('client_staff_preference', function (Blueprint $table) {
            $table->id('preference_id');
            $table->BigInteger('client_id')->unsigned();
            $table->BigInteger('staff_id')->unsigned();
            $table->text('note');
            $table->timestamps();
            $table->foreign('client_id')->references('client_id')->on('client')->cascadeOnDelete();
            $table->foreign('staff_id')->references('staff_id')->on('staff')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_staff_preference');
    }
};
