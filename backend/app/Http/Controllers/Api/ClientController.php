<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Client;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ClientController extends Controller
{
    // GET all clients
    public function index()
    {
        $clients = Client::paginate(10);

        return response()->json([
            'status' => true,
            'data' => $clients,
        ]);
    }

    // GET client by id
    public function show($id)
    {
        $client = Client::find($id);

        if (! $client) {
            return response()->json([
                'status' => false,
                'message' => 'Client not found!',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $client,
        ], 200);
    }
    //POST api/client
    public function store(Request $request){
        $request->validate([
            'client_name' => 'required',
            'phone' => 'nullable|unique:client',
            'email' => 'required|email|unique:client',
            'password' =>[
                'required',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols()
            ],
            'dob' => 'nullable|date',
            'status' => 'nullable|in:active,inactive',
        ]);
        $client = Client::create([
            'client_name' => $request->client_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'dob' => $request->dob,
            'status' => $request->status ?? 'active',
            'membership_point' => $request->membership_point ?? 0,
            'membership_tier' => $request->membership_tier ?? 'bronze',
        ]);
        return response()->json([
            'status' => true,
            'data' => $client,
        ], 201);
    }
}
