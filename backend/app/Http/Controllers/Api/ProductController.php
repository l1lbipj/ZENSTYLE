<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function isAdmin(Request $request): bool
    {
        return in_array('admin', $this->abilities($request), true);
    }

    /**
     * GET /products
     * Public catalog endpoint: pagination + filter + search.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::in(['hair', 'skin'])],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'low_stock' => ['nullable', Rule::in(['0', '1'])],
            'sort' => ['nullable', Rule::in(['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'])],
        ]);

        $query = Product::query();

        if (! empty($validated['search'])) {
            $query->where('product_name', 'like', '%'.$validated['search'].'%');
        }

        if (! empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        if (array_key_exists('min_price', $validated) && $validated['min_price'] !== null) {
            $query->where('unit_price', '>=', $validated['min_price']);
        }

        if (array_key_exists('max_price', $validated) && $validated['max_price'] !== null) {
            $query->where('unit_price', '<=', $validated['max_price']);
        }

        if (($validated['low_stock'] ?? null) === '1') {
            $query->whereColumn('stock_quantity', '<=', 'reorder_level');
        }

        switch ($validated['sort'] ?? 'newest') {
            case 'price_asc':
                $query->orderBy('unit_price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('unit_price', 'desc');
                break;
            case 'name_asc':
                $query->orderBy('product_name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('product_name', 'desc');
                break;
            default:
                $query->orderByDesc('product_id');
                break;
        }

        $perPage = (int) ($validated['per_page'] ?? 10);

        return ApiResponse::success(
            $query->paginate($perPage),
            'Products retrieved.'
        );
    }

    /**
     * GET /products/{id}
     */
    public function show(string $id)
    {
        $product = Product::find($id);
        if (! $product) {
            return ApiResponse::error('Product not found.', 404, 'NOT_FOUND');
        }

        return ApiResponse::success($product, 'Product retrieved.');
    }

    /**
     * POST /products (admin)
     */
    public function store(Request $request)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'product_name' => ['required', 'string', 'max:50', 'unique:products,product_name'],
            'category' => ['required', Rule::in(['hair', 'skin'])],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:255'],
            'stock_quantity' => ['required', 'integer', 'min:1'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'unit_price' => ['required', 'numeric', 'gt:0'],
            'min_stock_level' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = Product::create([
            ...$validated,
            'reorder_level' => $validated['reorder_level'] ?? 0,
            'min_stock_level' => $validated['min_stock_level'] ?? 0,
        ]);

        return ApiResponse::success($product->fresh(), 'Product created.', 201);
    }

    /**
     * PUT /products/{id} (admin)
     */
    public function update(Request $request, string $id)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $product = Product::find($id);
        if (! $product) {
            return ApiResponse::error('Product not found.', 404, 'NOT_FOUND');
        }

        $validated = $request->validate([
            'product_name' => ['sometimes', 'string', 'max:50', Rule::unique('products', 'product_name')->ignore($product->product_id, 'product_id')],
            'category' => ['sometimes', Rule::in(['hair', 'skin'])],
            'description' => ['sometimes', 'nullable', 'string'],
            'image_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'stock_quantity' => ['sometimes', 'integer', 'min:1'],
            'reorder_level' => ['sometimes', 'integer', 'min:0'],
            'unit_price' => ['sometimes', 'numeric', 'gt:0'],
            'min_stock_level' => ['sometimes', 'integer', 'min:0'],
        ]);

        $product->update($validated);

        return ApiResponse::success($product->fresh(), 'Product updated.');
    }

    /**
     * DELETE /products/{id} (admin)
     */
    public function destroy(Request $request, string $id)
    {
        if (! $request->user()) {
            return ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED');
        }
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $product = Product::find($id);
        if (! $product) {
            return ApiResponse::error('Product not found.', 404, 'NOT_FOUND');
        }

        $product->delete();

        return ApiResponse::success(null, 'Product deleted.');
    }
}

