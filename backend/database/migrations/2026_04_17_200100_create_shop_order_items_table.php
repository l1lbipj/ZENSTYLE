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
        Schema::create('shop_order_items', function (Blueprint $table) {
            $table->id('shop_order_item_id');
            $table->foreignId('shop_order_id')->constrained('shop_orders', 'shop_order_id')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products', 'product_id')->restrictOnDelete();

            $table->decimal('unit_price', 12, 2)->unsigned();
            $table->unsignedInteger('quantity');
            $table->decimal('line_total', 12, 2)->unsigned();

            $table->timestamps();

            $table->unique(['shop_order_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_order_items');
    }
};

