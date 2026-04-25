<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_orders', function (Blueprint $table) {
            $table->id('customer_order_id');
            $table->foreignId('client_id')->constrained('clients', 'client_id')->restrictOnDelete();
            $table->foreignId('promotion_id')->nullable()->constrained('promotions', 'promotion_id')->nullOnDelete();
            $table->string('order_number', 30)->unique();
            $table->decimal('subtotal', 12, 2)->unsigned();
            $table->decimal('discount_amount', 12, 2)->unsigned()->default(0);
            $table->decimal('final_amount', 12, 2)->unsigned();
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer'])->default('cash');
            $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending');
            $table->enum('order_status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('pending');
            $table->string('notes', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_orders');
    }
};
