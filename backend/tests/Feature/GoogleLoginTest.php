<?php

use App\Models\Client;
use App\Models\Staff;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    Schema::dropIfExists('personal_access_tokens');
    Schema::dropIfExists('clients');
    Schema::dropIfExists('staff');
    Schema::dropIfExists('admins');

    Schema::create('clients', function (Blueprint $table) {
        $table->id('client_id');
        $table->string('client_name', 100);
        $table->string('phone', 15)->unique()->nullable();
        $table->string('email', 100)->unique()->nullable();
        $table->string('password', 255);
        $table->date('dob')->nullable();
        $table->string('status')->default('active');
        $table->unsignedInteger('membership_point')->default(0);
        $table->string('membership_tier')->default('bronze');
        $table->timestamps();
        $table->softDeletes();
    });

    Schema::create('staff', function (Blueprint $table) {
        $table->id('staff_id');
        $table->string('staff_name', 100);
        $table->string('specialization', 100);
        $table->string('phone', 15)->unique();
        $table->string('email', 100)->unique();
        $table->string('password', 255);
        $table->string('status')->default('active');
        $table->timestamps();
        $table->softDeletes();
    });

    Schema::create('admins', function (Blueprint $table) {
        $table->id('admin_id');
        $table->string('admin_name');
        $table->string('email')->unique();
        $table->string('password');
        $table->string('status')->default('active');
        $table->timestamps();
    });

    Schema::create('personal_access_tokens', function (Blueprint $table) {
        $table->id();
        $table->morphs('tokenable');
        $table->string('name');
        $table->string('token', 64)->unique();
        $table->text('abilities')->nullable();
        $table->timestamp('last_used_at')->nullable();
        $table->timestamp('expires_at')->nullable();
        $table->timestamps();
    });
});

it('creates a client and returns token when google credential is valid', function () {
    config(['services.google.client_id' => 'test-google-client-id.apps.googleusercontent.com']);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'email' => 'new.client@example.com',
            'name' => 'New Client',
            'aud' => 'test-google-client-id.apps.googleusercontent.com',
            'iss' => 'https://accounts.google.com',
            'email_verified' => 'true',
        ], 200),
    ]);

    $response = $this->postJson('/api/v1/auth/google', [
        'credential' => 'valid-google-id-token',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user_type', 'client')
        ->assertJsonPath('data.token_type', 'Bearer');

    $this->assertDatabaseHas('clients', [
        'email' => 'new.client@example.com',
        'client_name' => 'New Client',
        'status' => 'active',
    ]);
});

it('restores a soft deleted client and allows google login', function () {
    config(['services.google.client_id' => 'test-google-client-id.apps.googleusercontent.com']);

    $client = Client::create([
        'client_name' => 'Legacy Client',
        'email' => 'legacy.client@example.com',
        'password' => Hash::make('Secret123!'),
        'status' => 'inactive',
        'membership_point' => 0,
        'membership_tier' => 'bronze',
    ]);
    $client->delete();

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'email' => 'legacy.client@example.com',
            'aud' => 'test-google-client-id.apps.googleusercontent.com',
            'iss' => 'accounts.google.com',
            'email_verified' => 'true',
        ], 200),
    ]);

    $response = $this->postJson('/api/v1/auth/google', [
        'credential' => 'valid-google-id-token',
    ]);

    $response->assertOk();

    $restoredClient = Client::withTrashed()->where('email', 'legacy.client@example.com')->first();
    expect($restoredClient)->not->toBeNull();
    expect($restoredClient->trashed())->toBeFalse();
    expect($restoredClient->status)->toBe('active');
});

it('rejects google login when email belongs to staff', function () {
    config(['services.google.client_id' => 'test-google-client-id.apps.googleusercontent.com']);

    Staff::create([
        'staff_name' => 'Staff User',
        'specialization' => 'Hair',
        'phone' => '0987654321',
        'email' => 'staff.account@example.com',
        'password' => Hash::make('Secret123!'),
        'status' => 'active',
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'email' => 'staff.account@example.com',
            'name' => 'Staff User',
            'aud' => 'test-google-client-id.apps.googleusercontent.com',
            'iss' => 'https://accounts.google.com',
            'email_verified' => 'true',
        ], 200),
    ]);

    $response = $this->postJson('/api/v1/auth/google', [
        'credential' => 'valid-google-id-token',
    ]);

    $response
        ->assertStatus(409)
        ->assertJsonPath('code', 'EMAIL_ALREADY_USED_BY_STAFF_OR_ADMIN');
});
