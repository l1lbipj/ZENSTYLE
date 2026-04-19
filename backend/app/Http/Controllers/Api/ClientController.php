<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreClientRequest;
use App\Http\Requests\Api\UpdateClientRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ClientController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    public function index(Request $request)
    {
        // Only admin can view all clients
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        if (! in_array('admin', $abilities, true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $validated['per_page'] ?? 10;

        $clients = Client::paginate($perPage);

        return ApiResponse::success(
            $clients,
            'Clients retrieved.',
        );
    }

    public function show(Request $request, string $id)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        // If not admin, only allow viewing their own record
        if (!$isAdmin && (int) $id !== (int) $request->user()->getKey()) {
            return ApiResponse::error(
                'You are not allowed to view this client record.',
                403,
                'FORBIDDEN',
            );
        }

        $client = Client::find($id);

        if (! $client) {
            return ApiResponse::error('Client not found.', 404, 'NOT_FOUND');
        }

        return ApiResponse::success($client, 'Client retrieved.');
    }

    public function store(StoreClientRequest $request)
    {
        // Only admin can create clients
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        if (! in_array('admin', $abilities, true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $data = $request->validated();
        $client = Client::create([
            'client_name' => $data['client_name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'image_data' => $data['image_data'] ?? null,
            'dob' => $data['dob'] ?? null,
            'status' => $data['status'] ?? 'active',
            'membership_point' => 0,
            'membership_tier' => 'bronze',
        ]);

        return ApiResponse::success($client, 'Client created.', 201);
    }

    public function update(UpdateClientRequest $request, string $id)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        // If not admin, only allow updating their own record
        if (!$isAdmin && (int) $id !== (int) $request->user()->getKey()) {
            return ApiResponse::error(
                'You are not allowed to update this client record.',
                403,
                'FORBIDDEN',
            );
        }

        $client = Client::find($id);

        if (! $client) {
            return ApiResponse::error('Client not found.', 404, 'NOT_FOUND');
        }

        $data = $request->validated();

        if (array_key_exists('password', $data) && $data['password'] !== null) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $client->update($data);

        return ApiResponse::success($client->fresh(), 'Client updated.');
    }

    public function destroy(Request $request, string $id)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        // If not admin, only allow deleting their own account
        if (!$isAdmin && (int) $id !== (int) $request->user()->getKey()) {
            return ApiResponse::error(
                'You can only delete your own account.',
                403,
                'FORBIDDEN',
            );
        }

        $client = Client::withTrashed()->find($id);
        if (! $client) {
            return ApiResponse::error('Client not found.', 404, 'NOT_FOUND');
        }

        // Nếu đã bị xóa mềm, không cho xóa lại
        if ($client->trashed()) {
            return ApiResponse::error('Client already deleted.', 410, 'GONE');
        }

        $client->delete();

        return ApiResponse::success(null, 'Client deleted successfully.');
    }
}
