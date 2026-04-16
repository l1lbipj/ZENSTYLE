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
        Schema::create('services', function (Blueprint $table) {
            $table->id('service_id');
            $table->string('service_name',100)->unique();
            $table->decimal('price',12,2)->unsigned();
            $table->integer('duration');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->foreignId('category_id')->constrained('service_categories','category_id')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
