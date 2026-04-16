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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id('order_id');
            $table->foreignId('supplier_id')->constrained('suppliers','supplier_id')->restrictOnDelete();
            $table->date('order_date');
            $table->decimal('total_amount', 12,2)->unsigned();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
        DB::statement('ALTER TABLE purchase_orders ADD CONSTRAINT check_total_amount CHECK (total_amount > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
