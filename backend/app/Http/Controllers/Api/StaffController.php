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
    public function index(Request $request){
        // Only admin can view all staff
        $abilities = $request->user()->currentAccessToken()->abilities ?? [];
        if (!$request->user() || !in_array('admin', $abilities)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $validated['per_page'] ?? 10;

        $staffs = Staff::paginate($perPage);

        return ApiResponse::success(
            $staffs,
            'Staffs retrieved',
        );
    }

    public function show(Request $request, string $id){
        $abilities = $request->user()->currentAccessToken()->abilities ?? [];
        $isAdmin = in_array('admin', $abilities);

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
        $abilities = $request->user()->currentAccessToken()->abilities ?? [];
        if (!$request->user() || !in_array('admin', $abilities)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $data = $request->validated();
        $staff = Staff::create([
            'staff_name' => $data['staff_name'],
            'specialization' => $data['specialization'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'dob' => $data['dob'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);
        return ApiResponse::success($staff, 'Staff created.', 201);

    }

    public function update(UpdateStaffRequest $request, string $id){
        $abilities = $request->user()->currentAccessToken()->abilities ?? [];
        $isAdmin = in_array('admin', $abilities);

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
        $abilities = $request->user()->currentAccessToken()->abilities ?? [];
        $isAdmin = in_array('admin', $abilities);

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
