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
        Schema::create('appointment_detail', function (Blueprint $table) {
            $table->id('detail_id');
            $table->foreignId('appointment_id')->constrained('appointment','appointment_id')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff','staff_id')->restrictOnDelete();
            $table->enum('item_type',['skin', 'hair']);
            $table->foreignId('service_id')->nullable()->constrained('services','service_id')->restrictOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('product','product_id')->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('total_price',12,2)->unsigned();
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('status',['active', 'inactive'])->default('active');
            $table->timestamps();
        });
        DB::statement('ALTER TABLE appointment_detail ADD CONSTRAINT check_quantity CHECK (quantity > 0)');
        DB::statement('ALTER TABLE appointment_detail ADD CONSTRAINT check_total_price CHECK (total_price > 0)');
        DB::statement('ALTER TABLE appointment_detail ADD CONSTRAINT check_time_range CHECK (start_time < end_time)');
        DB::statement('ALTER TABLE appointment_detail ADD CONSTRAINT check_item_reference CHECK (service_id IS NOT NULL OR product_id IS NOT NULL)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_detail');
    }
};
