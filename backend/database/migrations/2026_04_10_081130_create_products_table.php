<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_id');
            $table->string('product_name',50);
            $table->unsignedInteger('stock_quantity');
            $table->unsignedInteger('reorder_level')->default(0);
            $table->decimal('unit_price', 12,2)->unsigned();
            $table->unsignedInteger('min_stock_level')->default(0);
            $table->timestamps();
        });
        DB::statement('ALTER TABLE products ADD CONSTRAINT check_stock_quantity CHECK (stock_quantity > 0)');
        DB::statement('ALTER TABLE products ADD CONSTRAINT check_unit_price CHECK (unit_price > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
