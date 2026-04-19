<?php

namespace App\Http\Controllers\Api;

use App\Mail\PasswordResetOtpMail;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\StoreClientRequest;
use App\Http\Requests\Api\StoreStaffRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Admin;
use App\Models\Client;
use App\Models\PasswordResetOtp;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    private function resolveUserByEmail(string $email): Client|Staff|Admin|null
    {
        return Client::where('email', $email)->first()
            ?? Staff::where('email', $email)->first()
            ?? Admin::where('email', $email)->first();
    }

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
        $credential = trim($validated['credential']);
        if ($credential === '') {
            return ApiResponse::error('Invalid Google credential.', 401, 'INVALID_GOOGLE_CREDENTIAL');
        }

        $httpClient = Http::acceptJson()->timeout(10);
        if (app()->environment('local')) {
            // Local Windows setups may fail CA verification when calling Google.
            $httpClient = $httpClient->withoutVerifying();
        }

        try {
            $googleResponse = $httpClient->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $credential,
            ]);
        } catch (Throwable $exception) {
            return ApiResponse::error(
                'Unable to verify Google credential at the moment. Please try again.',
                502,
                'GOOGLE_VERIFY_FAILED'
            );
        }

        if (! $googleResponse->ok()) {
            return ApiResponse::error('Invalid Google credential.', 401, 'INVALID_GOOGLE_CREDENTIAL');
        }

        $googleUser = $googleResponse->json();
        $email = strtolower(trim((string) ($googleUser['email'] ?? '')));
        $name = trim((string) ($googleUser['name'] ?? $googleUser['given_name'] ?? ''));
        if ($name === '' && $email !== '') {
            $name = Str::before($email, '@');
        }
        $audience = $googleUser['aud'] ?? null;
        $issuer = $googleUser['iss'] ?? null;
        $emailVerified = filter_var($googleUser['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $configuredClientId = trim((string) config('services.google.client_id'));

        if ($email === '' || $name === '' || ! $emailVerified) {
            return ApiResponse::error('Google account data is invalid.', 422, 'INVALID_GOOGLE_ACCOUNT');
        }

        if ($issuer !== null && ! in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true)) {
            return ApiResponse::error('Google token issuer is invalid.', 401, 'INVALID_GOOGLE_ISSUER');
        }

        if (app()->environment('production') && $configuredClientId === '') {
            return ApiResponse::error(
                'Google login is not configured. Please contact support.',
                500,
                'GOOGLE_CLIENT_NOT_CONFIGURED'
            );
        }

        if ($configuredClientId !== '' && $audience !== $configuredClientId) {
            return ApiResponse::error('Google client mismatch.', 401, 'GOOGLE_CLIENT_MISMATCH');
        }

        $staffExists = Staff::where('email', $email)->exists();
        $adminExists = Admin::where('email', $email)->exists();
        if ($staffExists || $adminExists) {
            return ApiResponse::error(
                'This email is already linked to a non-client account.',
                409,
                'EMAIL_ALREADY_USED_BY_STAFF_OR_ADMIN'
            );
        }

        $client = Client::withTrashed()->where('email', $email)->first();

        if (! $client) {
            $client = Client::create([
                'client_name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'status' => 'active',
                'membership_point' => 0,
                'membership_tier' => 'bronze',
            ]);
        } else {
            if ($client->trashed()) {
                $client->restore();
            }

            $client->fill([
                'client_name' => $client->client_name ?: $name,
                'status' => 'active',
            ]);
            $client->save();
        }

        $tokenName = $client->email . '-' . now()->timestamp;
        $token = $client->createToken($tokenName, ['client'], now()->addHours(24))->plainTextToken;

        return ApiResponse::success(
            [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user_type' => 'client',
                'user' => $client,
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

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:100'],
        ]);

        $email = strtolower(trim($validated['email']));
        $user = $this->resolveUserByEmail($email);

        if (! $user) {
            return ApiResponse::error('Email is not registered.', 404, 'EMAIL_NOT_FOUND');
        }

        PasswordResetOtp::where('email', $email)->delete();

        $otp = str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(5);

        PasswordResetOtp::create([
            'email' => $email,
            'otp_hash' => Hash::make($otp),
            'expires_at' => $expiresAt,
        ]);

        $displayExpiry = $expiresAt->copy()->timezone(config('app.timezone'));
        $displayExpiryText = $displayExpiry->format('d/m/Y H:i') . ' (UTC' . $displayExpiry->format('P') . ')';

        Mail::to($email)->send(new PasswordResetOtpMail($otp, $displayExpiryText));

        return ApiResponse::success(
            [
                'email' => $email,
                'expires_at' => $expiresAt->toISOString(),
            ],
            'OTP sent to your email.'
        );
    }

    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:100'],
            'otp' => ['required', 'digits:5'],
        ]);

        $email = strtolower(trim($validated['email']));
        $otp = $validated['otp'];

        $otpRecord = PasswordResetOtp::where('email', $email)->latest('id')->first();

        if (! $otpRecord) {
            return ApiResponse::error('OTP not found. Please request a new one.', 404, 'OTP_NOT_FOUND');
        }

        if ($otpRecord->expires_at->isPast()) {
            $otpRecord->delete();
            return ApiResponse::error('OTP has expired. Please request a new one.', 422, 'OTP_EXPIRED');
        }

        if (! Hash::check($otp, $otpRecord->otp_hash)) {
            return ApiResponse::error('Invalid OTP.', 422, 'INVALID_OTP');
        }

        return ApiResponse::success(
            [
                'email' => $email,
                'verified' => true,
            ],
            'OTP verified successfully.'
        );
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:100'],
            'otp' => ['required', 'digits:5'],
            'password' => [
                'required',
                'string',
                'confirmed',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/',
            ],
        ]);

        $email = strtolower(trim($validated['email']));
        $otp = $validated['otp'];
        $otpRecord = PasswordResetOtp::where('email', $email)->latest('id')->first();

        if (! $otpRecord) {
            return ApiResponse::error('OTP not found. Please request a new one.', 404, 'OTP_NOT_FOUND');
        }

        if ($otpRecord->expires_at->isPast()) {
            $otpRecord->delete();
            return ApiResponse::error('OTP has expired. Please request a new one.', 422, 'OTP_EXPIRED');
        }

        if (! Hash::check($otp, $otpRecord->otp_hash)) {
            return ApiResponse::error('Invalid OTP.', 422, 'INVALID_OTP');
        }

        $user = $this->resolveUserByEmail($email);

        if (! $user) {
            return ApiResponse::error('Email is not registered.', 404, 'EMAIL_NOT_FOUND');
        }

        if (Hash::check($validated['password'], $user->password)) {
            return ApiResponse::error(
                'New password must be different from your current password.',
                422,
                'PASSWORD_REUSED'
            );
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        PasswordResetOtp::where('email', $email)->delete();

        return ApiResponse::success(null, 'Password reset successful. Please login again.');
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
