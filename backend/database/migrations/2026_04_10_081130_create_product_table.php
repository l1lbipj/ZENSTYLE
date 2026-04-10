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
        Schema::create('product', function (Blueprint $table) {
            $table->id();
            $table->string('product_name',50);
            $table->integer('stock_quantity')->CHECK('stock_quantity > 0');
            $table->integer('recoder_level');
            $table->decimal('unit_price', 19,4);
            $table->integer('min_stock_level');
            $table->timestamps();
        });
        DB::statement('ALTER TABLE product ADD CONSTRAINT check_stock_quantity CHECK (stock_quantity > 0)');
        DB::statement('ALTER TABLE product ADD CONSTRAINT check_unit_price CHECK (unit_price > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('porduct');
    }
};
