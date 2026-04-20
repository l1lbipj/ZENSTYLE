<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateClientPreferencesRequest;
use App\Http\Requests\Api\UpdateMyProfileRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Allergy;
use App\Models\Appointment;
use App\Models\ClientStaffReference;
use App\Support\ClientAllergySync;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    public function me(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $role = in_array('admin', $this->abilities($request), true)
            ? 'admin'
            : (in_array('staff', $this->abilities($request), true) ? 'staff' : 'client');

        $data = [
            'user' => $user,
            'role' => $role,
        ];

        if ($role === 'client') {
            $user->loadMissing(['allergies:allergies.allergy_id,allergy_name']);

            $data['summary'] = [
                'history_count' => Appointment::where('client_id', $user->getKey())->count(),
                'membership_point' => (int) $user->membership_point,
                'membership_tier' => $user->membership_tier,
            ];
            $data['allergies'] = $user->allergies
                ->map(fn ($allergy) => [
                    'allergy_id' => (int) $allergy->allergy_id,
                    'allergy_name' => $allergy->allergy_name,
                ])
                ->values();
        }

        return ApiResponse::success($data, 'Profile retrieved.');
    }

    public function updateMe(UpdateMyProfileRequest $request, ClientAllergySync $clientAllergySync)
    {
        $user = $request->user();
        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isClient = in_array('client', $abilities, true);
        $isStaff = in_array('staff', $abilities, true);

        $validated = $request->validated();
        $hasAllergyPayload = $request->exists('allergy_ids') || $request->exists('custom_allergies');
        $allergyIds = $validated['allergy_ids'] ?? [];
        $customAllergies = $validated['custom_allergies'] ?? [];
        unset($validated['allergy_ids'], $validated['custom_allergies']);

        if (isset($validated['name'])) {
            $name = trim((string) $validated['name']);
            if ($isClient) {
                $validated['client_name'] = $name;
            } elseif ($isStaff) {
                $validated['staff_name'] = $name;
            } else {
                $validated['admin_name'] = $name;
            }
            unset($validated['name']);
        }

        if (isset($validated['email'])) {
            $validated['email'] = strtolower(trim((string) $validated['email']));
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        DB::transaction(function () use ($allergyIds, $customAllergies, $clientAllergySync, $hasAllergyPayload, $isClient, $user, $validated): void {
            $user->fill($validated);
            $user->save();

            if ($isClient && $hasAllergyPayload) {
                $clientAllergySync->sync($user, $allergyIds, $customAllergies);
            }
        });

        $freshUser = $isClient
            ? $user->fresh()->load('allergies:allergies.allergy_id,allergy_name')
            : $user->fresh();

        return ApiResponse::success($freshUser, 'Profile updated.');
    }

    public function clientHistory(Request $request)
    {
        if (! in_array('client', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointments = Appointment::query()
            ->with([
                'appointmentDetails.staff:staff_id,staff_name',
                'appointmentDetails.item',
                'feedback:feedback_id,appointment_id,customer_id,staff_id,rating,comment,notes,reply,manager_reply,replied_at',
            ])
            ->where('client_id', $request->user()->getKey())
            ->orderByDesc('appointment_date')
            ->paginate((int) $request->input('per_page', 10));

        return ApiResponse::success($appointments, 'Client service history retrieved.');
    }

    public function clientPreferences(Request $request)
    {
        if (! in_array('client', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $clientId = $request->user()->getKey();

        $allergies = DB::table('client_allergies')
            ->join('allergies', 'allergies.allergy_id', '=', 'client_allergies.allergy_id')
            ->where('client_allergies.client_id', $clientId)
            ->select('allergies.allergy_id', 'allergies.allergy_name')
            ->orderBy('allergies.allergy_name')
            ->get();

        $availableAllergies = Allergy::query()
            ->select('allergy_id', 'allergy_name')
            ->orderBy('allergy_name')
            ->get();

        $preferredStaff = DB::table('client_staff_preferences')
            ->join('staff', 'staff.staff_id', '=', 'client_staff_preferences.staff_id')
            ->where('client_staff_preferences.client_id', $clientId)
            ->select('staff.staff_id', 'staff.staff_name', 'staff.specialization', 'client_staff_preferences.note')
            ->get();

        $favoriteProducts = DB::table('client_favorite_products')
            ->join('products', 'products.product_id', '=', 'client_favorite_products.product_id')
            ->where('client_favorite_products.client_id', $clientId)
            ->select('products.product_id', 'products.product_name')
            ->get();

        return ApiResponse::success([
            'allergies' => $allergies,
            'available_allergies' => $availableAllergies,
            'preferred_staff' => $preferredStaff,
            'favorite_products' => $favoriteProducts,
        ], 'Client preferences retrieved.');
    }

    public function updateClientPreferences(UpdateClientPreferencesRequest $request, ClientAllergySync $clientAllergySync)
    {
        $validated = $request->validated();
        $clientId = $request->user()->getKey();
        $client = $request->user();

        DB::transaction(function () use ($client, $clientAllergySync, $validated, $clientId): void {
            $clientAllergySync->sync(
                $client,
                $validated['allergy_ids'] ?? [],
                $validated['custom_allergies'] ?? [],
            );

            ClientStaffReference::where('client_id', $clientId)->delete();
            foreach ($validated['preferred_staff'] ?? [] as $item) {
                ClientStaffReference::create([
                    'client_id' => $clientId,
                    'staff_id' => $item['staff_id'],
                    'note' => $item['note'] ?? '',
                ]);
            }

            DB::table('client_favorite_products')->where('client_id', $clientId)->delete();
            foreach ($validated['favorite_product_ids'] ?? [] as $productId) {
                DB::table('client_favorite_products')->insert([
                    'client_id' => $clientId,
                    'product_id' => $productId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        return $this->clientPreferences($request);
    }

    public function allergyCatalog(Request $request)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $allergies = Allergy::query()
            ->select('allergy_id', 'allergy_name')
            ->orderBy('allergy_name')
            ->get();

        return ApiResponse::success($allergies, 'Allergy catalog retrieved.');
    }
}
