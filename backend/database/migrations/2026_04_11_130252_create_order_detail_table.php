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
        Schema::create('order_detail', function (Blueprint $table) {
            $table->id('detail_id');
            $table->BigInteger('order_id')->unsigned();
            $table->BigInteger('product_id')->unsigned();
            $table->decimal('import_price',19,4);
            $table->integer('quantity');
            $table->timestamps();
            $table->foreign('product_id')->references('product_id')->on('product');
            $table->foreign('order_id')->references('order_id')->on('purchase_order')->cascadeOnDelete();
        });
        DB::statement('ALTER TABLE order_detail ADD CONSTRAINT check_import_price CHECK (import_price > 0)');
        DB::statement('ALTER TABLE order_detail ADD CONSTRAINT check_quantity CHECK (quantity > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_detail');
    }
};
