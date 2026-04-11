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
        Schema::create('purchase_order', function (Blueprint $table) {
            $table->id('order_id');
            $table->BigInteger('supplier_id')->unsigned();
            $table->date('order_date');
            $table->decimal('total_amount', 19,4);
            $table->enum('status', ['active', 'inactive']);
            $table->timestamps();
            $table->foreign('supplier_id')->references('supplier_id')->on('supplier')->restrictOnDelete();
        });
        DB::statement('ALTER TABLE purchase_order ADD CONSTRAINT check_total_amount CHECK (total_amount > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_order');
    }
};
