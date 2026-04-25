<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\ProductCategoryService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductCategoryController extends Controller
{
    public function __construct(private readonly ProductCategoryService $productCategoryService)
    {
    }

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

        $counts = $this->productCategoryService->counts();

        $items = ProductCategory::query()
            ->orderBy('product_category_name')
            ->get(['product_category_id', 'product_category_name'])
            ->map(function (ProductCategory $category) use ($counts): array {
                return [
                    'id' => $category->product_category_id,
                    'name' => $category->product_category_name,
                    'product_count' => $counts[$category->product_category_id] ?? 0,
                ];
            })
            ->values()
            ->all();

        return ApiResponse::success($items, 'Product categories retrieved.');
    }

    public function store(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        if ($this->productCategoryService->existsName($validated['name'])) {
            return ApiResponse::error('Category already exists.', 422, 'CATEGORY_EXISTS');
        }

        $category = $this->productCategoryService->create($validated['name']);

        return ApiResponse::success([
            'id' => $category->product_category_id,
            'name' => $category->product_category_name,
            'product_count' => 0,
        ], 'Product category created.', 201);
    }

    public function update(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $category = ProductCategory::find($id);
        if (! $category) {
            return ApiResponse::error('Category not found.', 404, 'NOT_FOUND');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        if ($this->productCategoryService->existsName($validated['name'], $category->product_category_id)) {
            return ApiResponse::error('Category already exists.', 422, 'CATEGORY_EXISTS');
        }

        $category = $this->productCategoryService->rename($category->product_category_id, $validated['name']);
        $counts = $this->productCategoryService->counts();

        return ApiResponse::success([
            'id' => $category->product_category_id,
            'name' => $category->product_category_name,
            'product_count' => $counts[$category->product_category_id] ?? 0,
        ], 'Product category updated.');
    }

    public function destroy(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $category = ProductCategory::find($id);
        if (! $category) {
            return ApiResponse::error('Category not found.', 404, 'NOT_FOUND');
        }

        $usage = (int) Product::query()->where('product_category_id', $category->product_category_id)->count();
        if ($usage > 0) {
            return ApiResponse::error('Category is used by existing products and cannot be deleted.', 422, 'CATEGORY_IN_USE', [
                'references' => $usage,
            ]);
        }

        $this->productCategoryService->delete($category->product_category_id);

        return ApiResponse::success(null, 'Product category deleted.');
    }
}
