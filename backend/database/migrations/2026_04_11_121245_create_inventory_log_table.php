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
        Schema::create('inventory_log', function (Blueprint $table) {
            $table->id('log_id');
            $table->foreignId('product_id')->constrained('product','product_id')->restrictOnDelete();
            $table->integer('change_amount');
            $table->string('reason',250);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_log');
    }
};
