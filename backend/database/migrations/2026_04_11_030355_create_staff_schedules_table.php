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
        Schema::create('staff_schedules', function (Blueprint $table) {
            $table->id('schedule_id');
            $table->foreignId('staff_id')->constrained('staff','staff_id')->cascadeOnDelete();
            $table->date('date');
            $table->time('check_in');
            $table->time('check_out');
            $table->foreignId('shift_id')->constrained('work_shifts','shift_id')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['staff_id', 'date', 'shift_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_schedules');
    }
};
