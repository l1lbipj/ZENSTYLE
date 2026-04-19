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
        Schema::create('shop_orders', function (Blueprint $table) {
            $table->id('shop_order_id');
            $table->foreignId('client_id')->constrained('clients', 'client_id')->restrictOnDelete();

            $table->string('customer_name', 120);
            $table->string('customer_phone', 20);
            $table->string('shipping_address', 255);
            $table->string('note', 500)->nullable();

            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending');
            $table->enum('payment_method', ['cod'])->default('cod');
            $table->string('currency', 3)->default('USD');

            $table->decimal('subtotal', 12, 2)->unsigned();
            $table->decimal('shipping_fee', 12, 2)->unsigned()->default(0);
            $table->decimal('discount_amount', 12, 2)->unsigned()->default(0);
            $table->decimal('total_amount', 12, 2)->unsigned();

            $table->string('promo_code', 30)->nullable();

            $table->timestamps();

            $table->index(['client_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_orders');
    }
};

