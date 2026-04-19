<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_favorite_products', function (Blueprint $table) {
            $table->id('favorite_id');
            $table->foreignId('client_id')->constrained('clients', 'client_id')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products', 'product_id')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['client_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_favorite_products');
    }
};
