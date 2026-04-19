<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\ClientAllergy;
use App\Models\ClientStaffReference;
use App\Models\Product;
use App\Models\Staff;
use App\Support\ImageData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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
            $data['summary'] = [
                'history_count' => Appointment::where('client_id', $user->getKey())->count(),
                'membership_point' => (int) $user->membership_point,
                'membership_tier' => $user->membership_tier,
            ];
        }

        return ApiResponse::success($data, 'Profile retrieved.');
    }

    public function updateMe(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isClient = in_array('client', $abilities, true);
        $isStaff = in_array('staff', $abilities, true);

        $rules = [
            'phone' => ['nullable', 'string', 'max:15', 'regex:/^[\+]?[0-9\-\(\)\s]+$/'],
            'email' => ['sometimes', 'email:rfc,dns', 'max:100'],
            'dob' => ['nullable', 'date', 'before:today', 'after:1900-01-01'],
            'image_data' => ['sometimes', ...ImageData::rules()],
            // Keep password rules aligned with frontend (min length + confirmation).
            'password' => ['nullable', 'string', 'confirmed', 'min:8'],
        ];

        if ($isClient) {
            // Support generic `name` from frontend.
            $rules['name'] = ['required_without:client_name', 'string', 'min:2', 'max:100'];
            $rules['client_name'] = ['required_without:name', 'string', 'min:2', 'max:100'];
        } elseif ($isStaff) {
            $rules['name'] = ['required_without:staff_name', 'string', 'min:2', 'max:100'];
            $rules['staff_name'] = ['required_without:name', 'string', 'min:2', 'max:100'];
            $rules['specialization'] = ['sometimes', 'string', 'max:100'];
        } else {
            $rules['name'] = ['required_without:admin_name', 'string', 'min:2', 'max:100'];
            $rules['admin_name'] = ['required_without:name', 'string', 'min:2', 'max:100'];
        }

        $validated = $request->validate($rules);

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
            $email = strtolower(trim($validated['email']));
            $emailExistsInClients = DB::table('clients')
                ->where('email', $email)
                ->where('client_id', '!=', $isClient ? $user->getKey() : 0)
                ->exists();
            $emailExistsInStaff = DB::table('staff')
                ->where('email', $email)
                ->where('staff_id', '!=', $isStaff ? $user->getKey() : 0)
                ->exists();
            $emailExistsInAdmins = DB::table('admins')
                ->where('email', $email)
                ->where('admin_id', '!=', (! $isClient && ! $isStaff) ? $user->getKey() : 0)
                ->exists();

            if ($emailExistsInClients || $emailExistsInStaff || $emailExistsInAdmins) {
                return ApiResponse::error('The email has already been taken.', 422, 'VALIDATION_ERROR');
            }

            $validated['email'] = $email;
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->fill($validated);
        $user->save();

        return ApiResponse::success($user->fresh(), 'Profile updated.');
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
                'feedback:feedback_id,appointment_id,rating,notes,manager_reply,replied_at',
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
            'preferred_staff' => $preferredStaff,
            'favorite_products' => $favoriteProducts,
        ], 'Client preferences retrieved.');
    }

    public function updateClientPreferences(Request $request)
    {
        if (! in_array('client', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'allergy_ids' => ['nullable', 'array'],
            'allergy_ids.*' => ['integer', Rule::exists('allergies', 'allergy_id')],
            'preferred_staff' => ['nullable', 'array'],
            'preferred_staff.*.staff_id' => ['required', 'integer', Rule::exists('staff', 'staff_id')],
            'preferred_staff.*.note' => ['nullable', 'string'],
            'favorite_product_ids' => ['nullable', 'array'],
            'favorite_product_ids.*' => ['integer', Rule::exists('products', 'product_id')],
        ]);

        $clientId = $request->user()->getKey();

        DB::transaction(function () use ($validated, $clientId) {
            ClientAllergy::where('client_id', $clientId)->delete();
            foreach ($validated['allergy_ids'] ?? [] as $allergyId) {
                ClientAllergy::create([
                    'client_id' => $clientId,
                    'allergy_id' => $allergyId,
                ]);
            }

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
}
