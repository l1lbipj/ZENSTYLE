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
        Schema::create('clients', function (Blueprint $table) {
            $table->id('client_id');
            $table->string('client_name',100);
            $table->string('phone',15)->unique()->nullable();
            $table->string('email',100)->unique()->nullable();
            $table->string('password',255);
            $table->date('dob')->nullable();
            $table->enum('status',['active', 'inactive'])->default('active');
            $table->unsignedInteger('membership_point')->default(0);
            $table->enum('membership_tier',['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
            $table->json('allergy_preferences')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
