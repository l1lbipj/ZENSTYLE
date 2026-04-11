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
        Schema::create('appointment_detail', function (Blueprint $table) {
            $table->id('detail_id');
            $table->BigInteger('appointment_id')->unsigned();
            $table->BigInteger('staff_id')->unsigned();
            $table->enum('item_type',['skin', 'hair']);
            $table->BigInteger('service_id')->unsigned()->nullable();
            $table->BigInteger('product_id')->unsigned()->nullable();
            $table->integer('quantity');
            $table->decimal('total_price',19,4);
            $table->Time('start_time');
            $table->Time('end_time');
            $table->enum('status',['active', 'inactive']);
            $table->timestamps();
            $table->foreign('appointment_id')->references('appointment_id')->on('appointment')->cascadeOnDelete();
            $table->foreign('staff_id')->references('staff_id')->on('staff')->restrictOnDelete();
            $table->foreign('service_id')->references('service_id')->on('services')->restrictOnDelete();
            $table->foreign('product_id')->references('product_id')->on('product')->restrictOnDelete();
        });
        DB::statement('ALTER TABLE appointment_detail ADD CONSTRAINT check_quantity CHECK (quantity > 0)');
        DB::statement('ALTER TABLE appointment_detail ADD CONSTRAINT check_total_price CHECK (total_price > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_detail');
    }
};
