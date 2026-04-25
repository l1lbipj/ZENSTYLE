<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceCategoryController extends Controller
{
    private function isAdmin(Request $request): bool
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];

        return in_array('admin', $abilities, true) || $request->user() instanceof \App\Models\Admin;
    }

    public function index(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $counts = Service::query()
            ->selectRaw('category_id, COUNT(*) as service_count')
            ->groupBy('category_id')
            ->pluck('service_count', 'category_id')
            ->map(fn ($count) => (int) $count)
            ->all();

        $items = ServiceCategory::query()
            ->orderBy('category_name')
            ->get(['category_id', 'category_name'])
            ->map(function (ServiceCategory $category) use ($counts): array {
                return [
                    'category_id' => $category->category_id,
                    'category_name' => $category->category_name,
                    'service_count' => $counts[$category->category_id] ?? 0,
                ];
            })
            ->values()
            ->all();

        return ApiResponse::success($items, 'Service categories retrieved.');
    }

    public function store(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'category_name' => ['required', 'string', 'min:2', 'max:100', 'unique:service_categories,category_name'],
        ]);

        $category = ServiceCategory::create([
            'category_name' => trim($validated['category_name']),
        ]);

        return ApiResponse::success([
            'category_id' => $category->category_id,
            'category_name' => $category->category_name,
            'service_count' => 0,
        ], 'Service category created.', 201);
    }

    public function update(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $category = ServiceCategory::find($id);
        if (! $category) {
            return ApiResponse::error('Service category not found.', 404, 'NOT_FOUND');
        }

        $validated = $request->validate([
            'category_name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                Rule::unique('service_categories', 'category_name')->ignore($category->category_id, 'category_id'),
            ],
        ]);

        $category->update([
            'category_name' => trim($validated['category_name']),
        ]);

        return ApiResponse::success([
            'category_id' => $category->category_id,
            'category_name' => $category->category_name,
            'service_count' => $category->services()->count(),
        ], 'Service category updated.');
    }

    public function destroy(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $category = ServiceCategory::find($id);
        if (! $category) {
            return ApiResponse::error('Service category not found.', 404, 'NOT_FOUND');
        }

        $usage = $category->services()->count();
        if ($usage > 0) {
            return ApiResponse::error('Service category is used by existing services and cannot be deleted.', 422, 'CATEGORY_IN_USE', [
                'references' => $usage,
            ]);
        }

        $category->delete();

        return ApiResponse::success(null, 'Service category deleted.');
    }
}
