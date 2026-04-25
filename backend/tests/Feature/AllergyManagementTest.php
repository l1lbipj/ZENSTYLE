<?php

use App\Models\Admin;
use App\Models\Allergy;
use App\Models\Client;
use App\Support\ClientAllergySync;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    Schema::dropIfExists('client_allergies');
    Schema::dropIfExists('allergies');
    Schema::dropIfExists('clients');
    Schema::dropIfExists('admins');

    Schema::create('admins', function (Blueprint $table) {
        $table->id('admin_id');
        $table->string('admin_name');
        $table->string('email')->unique();
        $table->string('password');
        $table->string('status')->default('active');
        $table->timestamps();
    });

    Schema::create('clients', function (Blueprint $table) {
        $table->id('client_id');
        $table->string('client_name', 100);
        $table->string('phone', 15)->unique()->nullable();
        $table->string('email', 100)->unique();
        $table->string('password', 255);
        $table->date('dob')->nullable();
        $table->string('status')->default('active');
        $table->unsignedInteger('membership_point')->default(0);
        $table->string('membership_tier')->default('bronze');
        $table->json('allergy_preferences')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });

    Schema::create('allergies', function (Blueprint $table) {
        $table->id('allergy_id');
        $table->string('allergy_name', 100);
        $table->timestamps();
    });

    Schema::create('client_allergies', function (Blueprint $table) {
        $table->id('client_allergy_id');
        $table->foreignId('client_id')->constrained('clients', 'client_id')->cascadeOnDelete();
        $table->foreignId('allergy_id')->constrained('allergies', 'allergy_id')->cascadeOnDelete();
        $table->timestamps();
        $table->unique(['client_id', 'allergy_id']);
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

it('allows admins to manage allergy options and clients to persist selections in json storage', function () {
    $admin = Admin::create([
        'admin_name' => 'Admin User',
        'email' => 'admin@example.com',
        'password' => Hash::make('Secret123!'),
        'status' => 'active',
    ]);

    $adminToken = $admin->createToken('admin-token', ['admin'])->plainTextToken;

    $created = $this->withToken($adminToken)->postJson('/api/v1/admin/allergies', [
        'allergy_name' => 'Latex',
    ]);

    $created
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.allergy_name', 'Latex');

    $allergyId = (int) $created->json('data.allergy_id');

    $client = Client::create([
        'client_name' => 'Client User',
        'email' => 'client@example.com',
        'password' => Hash::make('Secret123!'),
        'status' => 'active',
        'membership_point' => 0,
        'membership_tier' => 'bronze',
    ]);

    app(ClientAllergySync::class)->sync($client, [$allergyId]);

    $client->refresh();
    expect($client->allergy_preferences)->toBe([$allergyId]);

    $this->assertDatabaseHas('client_allergies', [
        'client_id' => $client->client_id,
        'allergy_id' => $allergyId,
    ]);
});

it('rejects custom allergy input from clients', function () {
    $client = Client::create([
        'client_name' => 'Client User',
        'email' => 'client@example.com',
        'password' => Hash::make('Secret123!'),
        'status' => 'active',
        'membership_point' => 0,
        'membership_tier' => 'bronze',
    ]);

    $clientToken = $client->createToken('client-token', ['client'])->plainTextToken;

    $this->withToken($clientToken)->putJson('/api/v1/profile/me', [
        'client_name' => 'Client User',
        'custom_allergies' => ['Glitter'],
    ])->assertStatus(422)->assertJsonPath('code', 'VALIDATION_ERROR');
});

it('cleans up client allergy references when an option is deleted', function () {
    $admin = Admin::create([
        'admin_name' => 'Admin User',
        'email' => 'admin@example.com',
        'password' => Hash::make('Secret123!'),
        'status' => 'active',
    ]);

    $allergy = Allergy::create([
        'allergy_name' => 'Fragrance',
    ]);

    $client = Client::create([
        'client_name' => 'Client User',
        'email' => 'client@example.com',
        'password' => Hash::make('Secret123!'),
        'status' => 'active',
        'membership_point' => 0,
        'membership_tier' => 'bronze',
        'allergy_preferences' => [$allergy->allergy_id],
    ]);

    DB::table('client_allergies')->insert([
        [
            'client_id' => $client->client_id,
            'allergy_id' => $allergy->allergy_id,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    $adminToken = $admin->createToken('admin-token', ['admin'])->plainTextToken;

    $this->withToken($adminToken)->deleteJson('/api/v1/admin/allergies/'.$allergy->allergy_id)
        ->assertOk()
        ->assertJsonPath('success', true);

    expect(Allergy::find($allergy->allergy_id))->toBeNull();

    $client->refresh();
    expect($client->allergy_preferences)->toBeNull();

    $this->assertDatabaseMissing('client_allergies', [
        'client_id' => $client->client_id,
        'allergy_id' => $allergy->allergy_id,
    ]);
});
