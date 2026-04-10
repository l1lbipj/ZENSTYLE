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
        Schema::create('client', function (Blueprint $table) {
            $table->id();
            $table->string('client_name',100);
            $table->string('phone',15);
            $table->string('email',100);
            $table->string('password',225);
            $table->date('dob')->NULLABLE();
            $table->enum('status',['active', 'inactive'])->default('active');
            $table->integer('membership_point');
            $table->enum('membership_tier',['bronze', 'silver', 'gold', 'platinum']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client');
    }
};
