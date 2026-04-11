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
            $table->string('service_name',100);
            $table->decimal('price',19,4);
            $table->integer('duration');
            $table->text('description')->NULLABLE();
            $table->timestamps();
            $table->BigInteger('category_id')->unsigned();
            $table->foreign('category_id')->references('category_id')->on('service_category')->restrictOnDelete();
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
