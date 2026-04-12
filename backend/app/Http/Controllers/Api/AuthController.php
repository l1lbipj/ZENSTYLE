<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $client = Client::where('email', $request->validated('email'))->first();
        if (! $client || ! Hash::check($request->validated('password'), $client->password)) {
            return ApiResponse::error('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
        }

        $token = $client->createToken('client-token')->plainTextToken;

        return ApiResponse::success(
            [
                'access_token' => $token,
                'token_type' => 'Bearer',
            ],
            'Login successful.',
            200,
        );
    }

    public function profile(Request $request)
    {
        return ApiResponse::success(
            $request->user(),
            'Profile retrieved.',
        );
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return ApiResponse::success(null, 'Logged out successfully.');
    }
}
