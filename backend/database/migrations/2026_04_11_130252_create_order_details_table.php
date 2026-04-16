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
        Schema::create('order_details', function (Blueprint $table) {
            $table->id('detail_id');
            $table->foreignId('order_id')->constrained('purchase_orders','order_id')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products','product_id')->restrictOnDelete();
            $table->decimal('import_price',12,2)->unsigned();
            $table->unsignedInteger('quantity');
            $table->timestamps();
            $table->unique(['order_id', 'product_id']);
        });
        DB::statement('ALTER TABLE order_details ADD CONSTRAINT check_import_price CHECK (import_price > 0)');
        DB::statement('ALTER TABLE order_details ADD CONSTRAINT check_quantity CHECK (quantity > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_details');
    }
};
