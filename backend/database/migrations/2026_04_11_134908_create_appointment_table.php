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
        Schema::create('appointment', function (Blueprint $table) {
            $table->id('appointment_id');
            $table->foreignId('client_id')->constrained('client','client_id')->restrictOnDelete();
            $table->dateTime('appointment_date');
            $table->decimal('total_amount',12,2)->unsigned();
            $table->foreignId('promotion_id')->nullable()->constrained('promotion','promotion_id')->nullOnDelete();
            $table->decimal('final_amount',12,2)->unsigned();
            $table->enum('payment_method', ['cash','card'])->nullable();
            $table->enum('payment_status',['pay', 'unpay'])->default('unpay');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
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
