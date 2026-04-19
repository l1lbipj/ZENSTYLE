<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreStaffRequest;
use App\Http\Requests\Api\UpdateStaffRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    public function index(Request $request){
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $validated = $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|in:active,inactive',
        ]);

        $perPage = (int) ($validated['per_page'] ?? 10);
        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        $query = Staff::query()->orderByDesc('staff_id');
        if (! $isAdmin) {
            // Client booking page needs staff options; expose only active staff with safe fields.
            $query->select(['staff_id', 'staff_name', 'specialization', 'status']);
            $query->where('status', 'active');
        } else {
            if (! empty($validated['status'])) {
                $query->where('status', $validated['status']);
            }
        }

        if (! empty($validated['search'])) {
            $query->where('staff_name', 'like', '%'.$validated['search'].'%');
        }

        return ApiResponse::success(
            $query->paginate($perPage),
            'Staffs retrieved',
        );
    }

    public function show(Request $request, string $id){
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        // If not admin, only allow viewing their own record
        if (!$isAdmin && (int) $id !== (int) $request->user()->getKey()){
            return ApiResponse::error(
                'You are not allowed to view this staff record.',
                403,
                'FORBIDDEN',
            );
        }

        $staff = Staff::find($id);
        if(!$staff){
            return ApiResponse::error('Staff not found.', 404, 'NOT_FOUND');
        };
        return ApiResponse::success($staff, 'Staff retrieved.');
    }

    public function store(StoreStaffRequest $request){
        // Only admin can create staff
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        if (! in_array('admin', $abilities, true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $data = $request->validated();
        $staff = Staff::create([
            'staff_name' => $data['staff_name'],
            'specialization' => $data['specialization'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'image_data' => $data['image_data'] ?? null,
            'dob' => $data['dob'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);
        return ApiResponse::success($staff, 'Staff created.', 201);

    }

    public function update(UpdateStaffRequest $request, string $id){
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);

        // If not admin, only allow updating their own record
        if (!$isAdmin && (int) $id !== (int) $request->user()->getKey()) {
            return ApiResponse::error(
                'You are not allowed to update this staff record.',
                403,
                'FORBIDDEN',
            );
        }

        $staff = Staff::find($id);

        if(!$staff) {
            return ApiResponse::error('Staff not found.', 404, 'NOT_FOUND');
        }
        $data = $request->validated();

        if (array_key_exists('password', $data) && $data['password'] !== null) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $staff->update($data);
         return ApiResponse::success($staff->fresh(), 'Staff updated.');
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

        $staff = Staff::withTrashed()->find($id);
        if (! $staff) {
            return ApiResponse::error('Staff not found.', 404, 'NOT_FOUND');
        }

        // Nếu đã bị xóa mềm, không cho xóa lại
        if ($staff->trashed()) {
            return ApiResponse::error('Staff already deleted.', 410, 'GONE');
        }

        $staff->delete();

        return ApiResponse::success(null, 'Staff deleted successfully.');
    }
}
