<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreClientRequest;
use App\Http\Requests\Api\UpdateClientRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Client;
use App\Support\ClientAllergySync;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ClientController extends Controller
{
    private function abilities(Request $request): array
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];
        if ($abilities !== []) {
            return $abilities;
        }

        $user = $request->user();
        if ($user instanceof \App\Models\Admin) {
            return ['admin'];
        }
        if ($user instanceof \App\Models\Client) {
            return ['client'];
        }

        return [];
    }

    public function index(Request $request)
    {
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
        $clients = Client::with('allergies:allergies.allergy_id,allergy_name')->paginate($perPage);

        return ApiResponse::success($clients, 'Clients retrieved.');
    }

    public function show(Request $request, string $id)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        if (! $isAdmin && (int) $id !== (int) $request->user()->getKey()) {
            return ApiResponse::error(
                'You are not allowed to view this client record.',
                403,
                'FORBIDDEN',
            );
        }

        $client = Client::with('allergies:allergies.allergy_id,allergy_name')->find($id);

        if (! $client) {
            return ApiResponse::error('Client not found.', 404, 'NOT_FOUND');
        }

        return ApiResponse::success($client, 'Client retrieved.');
    }

    public function store(StoreClientRequest $request)
    {
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

    public function update(UpdateClientRequest $request, string $id, ClientAllergySync $clientAllergySync)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        if (! $isAdmin && (int) $id !== (int) $request->user()->getKey()) {
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
        $allergyIds = $data['allergy_ids'] ?? [];
        $hasAllergyPayload = $request->exists('allergy_ids') || $request->exists('custom_allergies');
        unset($data['allergy_ids'], $data['custom_allergies']);

        if (array_key_exists('password', $data) && $data['password'] !== null) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $client->update($data);

        if ($hasAllergyPayload) {
            $clientAllergySync->sync($client, $allergyIds);
        }

        return ApiResponse::success(
            $client->fresh()->load('allergies:allergies.allergy_id,allergy_name'),
            'Client updated.'
        );
    }

    public function destroy(Request $request, string $id)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        if (! $isAdmin && (int) $id !== (int) $request->user()->getKey()) {
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

        if ($client->trashed()) {
            return ApiResponse::error('Client already deleted.', 410, 'GONE');
        }

        $client->delete();

        return ApiResponse::success(null, 'Client deleted successfully.');
    }
}
