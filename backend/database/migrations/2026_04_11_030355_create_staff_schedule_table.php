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
        Schema::create('staff_schedule', function (Blueprint $table) {
            $table->id('schedule_id');
            $table->BigInteger('staff_id')->unsigned();
            $table->date('date');
            $table->time('check_in');
            $table->time('check_out');
            $table->BigInteger('shift_id')->unsigned();
            $table->timestamps();
            $table->foreign('staff_id')->references('staff_id')->on('staff')->cascadeOnDelete();
            $table->foreign('shift_id')->references('shift_id')->on('work_shift')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_schedule');
    }
};
