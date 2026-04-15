<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\StoreClientRequest;
use App\Http\Requests\Api\StoreStaffRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Admin;
use App\Models\Client;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:client,staff',
            'client_name' => 'required_if:type,client|string|max:100|min:2',
            'staff_name' => 'required_if:type,staff|string|max:100|min:2',
            'specialization' => 'required_if:type,staff|string|max:100',
            'phone' => [
                'nullable',
                'string',
                'max:15',
                'regex:/^[\+]?[0-9\-\(\)\s]+$/',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $existsInClient = Client::where('phone', $value)->exists();
                        $existsInStaff = Staff::where('phone', $value)->exists();
                        if ($existsInClient || $existsInStaff) {
                            $fail('The phone has already been taken.');
                        }
                    }
                },
            ],
            'email' => [
                'required',
                'email:rfc,dns',
                'max:100',
                function ($attribute, $value, $fail) {
                    $existsInClient = Client::where('email', $value)->exists();
                    $existsInStaff = Staff::where('email', $value)->exists();
                    if ($existsInClient || $existsInStaff) {
                        $fail('The email has already been taken.');
                    }
                },
            ],
            'password' => [
                'required',
                'string',
                'confirmed',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/'
            ],
            'dob' => 'nullable|date|before:today|after:1900-01-01',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validated['type'] === 'client') {
            $user = Client::create([
                'client_name' => $validated['client_name'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'dob' => $validated['dob'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'membership_point' => 0,
                'membership_tier' => 'bronze',
            ]);
            $message = 'Client registered.';
        } else {
            $user = Staff::create([
                'staff_name' => $validated['staff_name'],
                'specialization' => $validated['specialization'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'dob' => $validated['dob'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);
            $message = 'Staff registered.';
        }

        return ApiResponse::success($user, $message, 201);
    }


    public function login(LoginRequest $request)
    {
        $email = $request->validated('email');
        $password = $request->validated('password');

        $user = Client::where('email', $email)->first();
        $type = 'client';

        if (! $user) {
            $user = Staff::where('email', $email)->first();
            $type = 'staff';
        }

        if (! $user) {
            $user = Admin::where('email', $email)->first();
            $type = 'admin';
        }

        if (! $user || ! Hash::check($password, $user->password)) {
            return ApiResponse::error('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
        }

        $tokenName = $user->email . '-' . now()->timestamp;
        $abilities = [$type];

        $token = $user->createToken($tokenName, $abilities, now()->addHours(24))->plainTextToken;

        return ApiResponse::success(
            [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user_type' => $type,
            ],
            'Login successful.',
            200,
        );
    }

    public function googleLogin(Request $request)
    {
        $validated = $request->validate([
            'credential' => ['required', 'string'],
        ]);

        $googleResponse = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $validated['credential'],
        ]);

        if (! $googleResponse->ok()) {
            return ApiResponse::error('Invalid Google credential.', 401, 'INVALID_GOOGLE_CREDENTIAL');
        }

        $googleUser = $googleResponse->json();
        $email = $googleUser['email'] ?? null;
        $name = $googleUser['name'] ?? null;
        $audience = $googleUser['aud'] ?? null;
        $emailVerified = filter_var($googleUser['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $configuredClientId = config('services.google.client_id');

        if (! $email || ! $name || ! $emailVerified) {
            return ApiResponse::error('Google account data is invalid.', 422, 'INVALID_GOOGLE_ACCOUNT');
        }

        if ($configuredClientId && $audience !== $configuredClientId) {
            return ApiResponse::error('Google client mismatch.', 401, 'GOOGLE_CLIENT_MISMATCH');
        }

        $client = Client::where('email', $email)->first();

        if (! $client) {
            $client = Client::create([
                'client_name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'status' => 'active',
                'membership_point' => 0,
                'membership_tier' => 'bronze',
            ]);
        }

        $tokenName = $client->email . '-' . now()->timestamp;
        $token = $client->createToken($tokenName, ['client'], now()->addHours(24))->plainTextToken;

        return ApiResponse::success(
            [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user_type' => 'client',
            ],
            'Google login successful.',
            200,
        );
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $token = $user->currentAccessToken();

        if (!$token) {
            return ApiResponse::error('Invalid token.', 401, 'UNAUTHENTICATED');
        }

        $expectedAbility = $user instanceof Client ? 'client' : ($user instanceof Staff ? 'staff' : 'admin');
        if (!in_array($expectedAbility, $token->abilities)) {
            return ApiResponse::error('Insufficient permissions.', 403, 'FORBIDDEN');
        }

        return ApiResponse::success([
            'user' => $user,
            'user_type' => $expectedAbility,
        ], 'Profile retrieved.');
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        $token = $user->currentAccessToken();

        if (!$token) {
            return ApiResponse::error('Invalid token.', 401, 'UNAUTHENTICATED');
        }

        $expectedAbility = $user instanceof Client ? 'client' : ($user instanceof Staff ? 'staff' : 'admin');
        if (!in_array($expectedAbility, $token->abilities)) {
            return ApiResponse::error('Insufficient permissions.', 403, 'FORBIDDEN');
        }

        $token->delete();

        return ApiResponse::success(null, 'Logged out successfully.');
    }
}
