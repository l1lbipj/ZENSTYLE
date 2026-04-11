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
        Schema::create('appointment', function (Blueprint $table) {
            $table->id('appointment_id');
            $table->BigInteger('client_id')->unsigned();
            $table->datetime('appointment_date');
            $table->decimal('total_amount',19,4);
            $table->BigInteger('promotion_id')->unsigned()->nullable();
            $table->decimal('final_amount',19,4);
            $table->enum('payment_method', ['cash','card'])->NULLABLE();
            $table->enum('payment_status',['pay', 'unpay']);
            $table->enum('status', ['active', 'inactive']);
            $table->timestamps();
            $table->foreign('client_id')->references('client_id')->on('client');
            $table->foreign('promotion_id')->references('promotion_id')->on('promotion');
        });
        DB::statement('ALTER TABLE appointment ADD CONSTRAINT check_total_amount CHECK (total_amount > 0)');
        DB::statement('ALTER TABLE appointment ADD CONSTRAINT check_final_amount CHECK (final_amount > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment');
    }
};
