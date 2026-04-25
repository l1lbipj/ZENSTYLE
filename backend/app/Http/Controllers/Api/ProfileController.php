<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateClientPreferencesRequest;
use App\Http\Requests\Api\UpdateMyProfileRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\ClientStaffReference;
use App\Services\AllergyService;
use App\Support\ClientAllergySync;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class ProfileController extends Controller
{
    private function abilities(Request $request): array
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];
        if ($abilities !== []) {
            return $abilities;
        }

        if ($request->filled('allergy_ids') || $request->filled('client_name')) {
            return ['client'];
        }

        $user = $request->user();
        if ($user instanceof \App\Models\Admin) {
            return ['admin'];
        }
        if ($user instanceof \App\Models\Staff) {
            return ['staff'];
        }
        if ($user instanceof \App\Models\Client) {
            return ['client'];
        }

        return [];
    }

    private function usesMixedAppointmentItemSchema(): bool
    {
        return Schema::hasColumn('appointment_details', 'item_id');
    }

    private function usesLegacyAppointmentItemTypeValues(): bool
    {
        return false;
    }

    private function clientFavoriteStaff(int $clientId, int $limit = 3)
    {
        $query = DB::table('appointment_details as ad')
            ->join('appointments as a', 'a.appointment_id', '=', 'ad.appointment_id')
            ->join('staff as s', 's.staff_id', '=', 'ad.staff_id')
            ->where('a.client_id', $clientId)
            ->where('a.payment_status', 'pay')
            ->whereNotNull('ad.staff_id')
            ->whereNotNull('ad.service_id');

        return $query
            ->groupBy('s.staff_id', 's.staff_name', 's.specialization')
            ->select([
                's.staff_id',
                's.staff_name',
                's.specialization',
                DB::raw('COUNT(DISTINCT a.appointment_id) as usage_count'),
                DB::raw('MAX(a.appointment_date) as last_visited_at'),
            ])
            ->orderByDesc('usage_count')
            ->orderByDesc('last_visited_at')
            ->limit($limit)
            ->get();
    }

    private function clientTopProducts(int $clientId, int $limit = 3)
    {
        if (! Schema::hasTable('customer_orders') || ! Schema::hasTable('customer_order_items') || ! Schema::hasTable('products')) {
            return collect();
        }

        $query = DB::table('customer_order_items as coi')
            ->join('customer_orders as co', 'co.customer_order_id', '=', 'coi.customer_order_id')
            ->join('products as p', function ($join): void {
                $join->on('p.product_id', '=', 'coi.product_id');
            })
            ->where('co.client_id', $clientId)
            ->where('co.payment_status', 'paid');

        return $query
            ->groupBy('p.product_id', 'p.product_name', 'p.category', 'p.unit_price', 'p.image_url')
            ->select([
                'p.product_id',
                'p.product_name',
                'p.category',
                'p.unit_price',
                'p.image_url',
                DB::raw('SUM(COALESCE(coi.quantity, 1)) as usage_count'),
                DB::raw('SUM(COALESCE(coi.line_total, p.unit_price * COALESCE(coi.quantity, 1))) as spent_amount'),
            ])
            ->orderByDesc('usage_count')
            ->orderByDesc('spent_amount')
            ->limit($limit)
            ->get();
    }

    private function favoriteProductsTable(): string
    {
        if (Schema::hasTable('client_product_preferences') && Schema::hasColumn('client_product_preferences', 'product_id')) {
            return 'client_product_preferences';
        }

        return Schema::hasTable('client_favorite_products') ? 'client_favorite_products' : 'client_product_preferences';
    }

    private function clientFavoriteProducts(int $clientId, int $limit = 3)
    {
        $table = $this->favoriteProductsTable();
        $primaryKey = $table === 'client_favorite_products' ? 'favorite_id' : 'preference_id';

        return DB::table($table.' as cpp')
            ->join('products as p', 'p.product_id', '=', 'cpp.product_id')
            ->where('cpp.client_id', $clientId)
            ->orderByDesc('cpp.created_at')
            ->orderByDesc('cpp.'.$primaryKey)
            ->limit($limit)
            ->get([
                'p.product_id',
                'p.product_name',
                'p.category',
                'p.unit_price',
                'p.image_url',
            ]);
    }

    public function me(Request $request, AllergyService $allergyService)
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
            $clientId = $user->getKey();
            $preferredStaff = $this->clientFavoriteStaff($clientId);
            $favoriteProducts = $this->clientFavoriteProducts($clientId);
            $topProducts = $this->clientTopProducts($clientId);
            $allergyState = $allergyService->resolveSelections($user);

            $data['summary'] = [
                'history_count' => Appointment::where('client_id', $clientId)->count(),
                'membership_point' => (int) $user->membership_point,
                'membership_tier' => $user->membership_tier,
                'preferred_staff_count' => $preferredStaff->count(),
                'favorite_products_count' => $favoriteProducts->count(),
                'top_products_count' => $topProducts->count(),
            ];
            $data['allergies'] = $allergyState['selected'];
            $data['archived_allergies'] = $allergyState['orphaned'];
            $data['allergy_preferences'] = $allergyState['selected_ids'];
            $data['preferred_staff'] = $preferredStaff;
            $data['favorite_products'] = $favoriteProducts;
            $data['top_products'] = $topProducts;
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

        DB::transaction(function () use ($allergyIds, $clientAllergySync, $hasAllergyPayload, $isClient, $request, $user, $validated): void {
            $user->fill($validated);
            $user->save();

            if (($isClient || $request->filled('allergy_ids')) && $hasAllergyPayload) {
                $clientAllergySync->sync($user, $allergyIds);
            }
        });

        $freshUser = $isClient
            ? $user->fresh()
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
                'appointmentDetails.service:service_id,service_name',
                'feedback:feedback_id,appointment_id,customer_id,staff_id,rating,comment,notes,reply,manager_reply,replied_at',
            ])
            ->where('client_id', $request->user()->getKey())
            ->orderByDesc('appointment_date')
            ->paginate((int) $request->input('per_page', 10));

        return ApiResponse::success($appointments, 'Client service history retrieved.');
    }

    public function clientPreferences(Request $request, AllergyService $allergyService)
    {
        if (! in_array('client', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $clientId = $request->user()->getKey();

        $client = $request->user();
        $allergyState = $allergyService->resolveSelections($client);
        $allergies = $allergyState['selected'];
        $availableAllergies = $allergyService->catalog();

        $preferredStaff = $this->clientFavoriteStaff($clientId);
        $favoriteProducts = $this->clientFavoriteProducts($clientId);
        $topProducts = $this->clientTopProducts($clientId);

        return ApiResponse::success([
            'allergies' => $allergies,
            'available_allergies' => $availableAllergies,
            'archived_allergies' => $allergyState['orphaned'],
            'preferred_staff' => $preferredStaff,
            'favorite_products' => $favoriteProducts,
            'top_products' => $topProducts,
        ], 'Client preferences retrieved.');
    }

    public function clientPaymentHistory(Request $request)
    {
        if (! in_array('client', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $clientId = $request->user()->getKey();

        $appointments = Appointment::query()
            ->with([
                'appointmentDetails.staff:staff_id,staff_name',
                'appointmentDetails.service',
            ])
            ->where('client_id', $clientId)
            ->whereNotNull('payment_method')
            ->orderByDesc('updated_at')
            ->get()
            ->map(function (Appointment $appointment) {
                $detailNames = $appointment->appointmentDetails
                    ->map(function ($detail) {
                        return $detail->service?->service_name ?? null;
                    })
                    ->filter()
                    ->values();

                $status = match ($appointment->payment_status) {
                    'pay' => 'Paid',
                    'refunded' => 'Refunded',
                    'failed' => 'Failed',
                    default => 'Pending',
                };

                return [
                    'invoice_type' => 'appointment_order',
                    'invoice_id' => 'APT-'.$appointment->appointment_id,
                    'appointment_id' => $appointment->appointment_id,
                    'related_appointment' => $appointment->appointment_date,
                    'item_name' => $detailNames->isNotEmpty() ? $detailNames->implode(', ') : 'Appointment',
                    'total_amount' => (float) $appointment->final_amount,
                    'payment_status' => $status,
                    'payment_method' => $this->normalizePaymentMethod($appointment->payment_method),
                    'payment_date' => $appointment->updated_at ?? $appointment->created_at,
                ];
            });

        return ApiResponse::success(
            $appointments->sortByDesc('payment_date')->values(),
            'Payment history retrieved.'
        );
    }

    private function normalizePaymentMethod(?string $method): string
    {
        return match (strtolower((string) $method)) {
            'cash', 'cod' => 'Cash',
            'card' => 'Card',
            'bank_transfer', 'bank transfer', 'bank-transfer' => 'Bank Transfer',
            'online' => 'Online',
            default => $method ? ucwords(str_replace(['_', '-'], ' ', $method)) : 'Cash',
        };
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
            );

            ClientStaffReference::where('client_id', $clientId)->delete();
            foreach ($validated['preferred_staff'] ?? [] as $item) {
                ClientStaffReference::create([
                    'client_id' => $clientId,
                    'staff_id' => $item['staff_id'],
                    'note' => $item['note'] ?? '',
                ]);
            }

            $favoritesTable = $this->favoriteProductsTable();
            DB::table($favoritesTable)->where('client_id', $clientId)->delete();
            foreach ($validated['favorite_product_ids'] ?? [] as $productId) {
                $payload = [
                    'client_id' => $clientId,
                    'product_id' => $productId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if ($favoritesTable === 'client_favorite_products') {
                    unset($payload['updated_at']);
                    DB::table($favoritesTable)->insert([
                        'client_id' => $clientId,
                        'product_id' => $productId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    continue;
                }

                DB::table($favoritesTable)->insert($payload);
            }
        });

        return $this->clientPreferences($request);
    }

    public function allergyCatalog(Request $request, AllergyService $allergyService)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $allergies = $allergyService->catalog();

        return ApiResponse::success($allergies, 'Allergy catalog retrieved.');
    }
}
