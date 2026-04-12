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
    public function index()
    {
        $clients = Client::paginate(10);

        return ApiResponse::success(
            $clients,
            'Clients retrieved.',
        );
    }

    public function show(Request $request, string $id)
    {
        if ((int) $id !== (int) $request->user()->getKey()) {
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
        $data = $request->validated();
        $client = Client::create([
            'client_name' => $data['client_name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'dob' => $data['dob'] ?? null,
            'status' => $data['status'] ?? 'active',
            'membership_point' => 0,
            'membership_tier' => 'bronze',
        ]);

        return ApiResponse::success($client, 'Client created.', 201);
    }

    public function update(UpdateClientRequest $request, string $id)
    {
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
        if ((int) $id !== (int) $request->user()->getKey()) {
            return ApiResponse::error(
                'You are not allowed to delete this client record.',
                403,
                'FORBIDDEN',
            );
        }

        $client = Client::find($id);
        if (! $client) {
            return ApiResponse::error('Client not found.', 404, 'NOT_FOUND');
        }

        $client->delete();

        return ApiResponse::success(null, 'Deleted successfully.');
    }
}
