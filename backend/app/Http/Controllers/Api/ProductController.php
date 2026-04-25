<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Product;
use App\Services\ProductCategoryService;
use App\Services\ProductManagementService;
use App\Support\ImageData;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductManagementService $productManagementService,
        private readonly ProductCategoryService $productCategoryService,
    ) {
    }

    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function isAdmin(Request $request): bool
    {
        return in_array('admin', $this->abilities($request), true);
    }

    private function resolveCategoryId(?string $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value) && $this->productCategoryService->existsId((int) $value)) {
            return (int) $value;
        }

        return $this->productCategoryService->resolveIdFromName($value);
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
            'product_category_id' => ['nullable', 'integer', Rule::exists('product_categories', 'product_category_id')],
            'category' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'low_stock' => ['nullable', Rule::in(['0', '1'])],
            'sort' => ['nullable', Rule::in(['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'])],
        ]);

        $query = Product::query()->with('productCategory:product_category_id,product_category_name');

        if (! empty($validated['search'])) {
            $query->where('product_name', 'like', '%'.$validated['search'].'%');
        }

        $categoryId = $validated['product_category_id'] ?? $this->resolveCategoryId($validated['category'] ?? null);
        if (! empty($categoryId)) {
            $query->where('product_category_id', $categoryId);
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
        $paginator = $query->paginate($perPage);
        $paginator->getCollection()->transform(function (Product $product) {
            return $this->productManagementService->present($product);
        });

        return ApiResponse::success(
            $paginator,
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

        $product->loadMissing('productCategory:product_category_id,product_category_name');

        return ApiResponse::success($this->productManagementService->present($product), 'Product retrieved.');
    }

    public function categories()
    {
        return ApiResponse::success($this->productCategoryService->options(), 'Product categories retrieved.');
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
            'product_category_id' => ['required', 'integer', Rule::exists('product_categories', 'product_category_id')],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:255'],
            'image_data' => ImageData::rules(),
            'stock_quantity' => ['required', 'integer', 'min:1'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'unit_price' => ['required', 'numeric', 'gt:0'],
            'min_stock_level' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = Product::create([
            ...$validated,
            'category' => $this->productCategoryService->labelFor((int) $validated['product_category_id']) ?? null,
            'reorder_level' => $validated['reorder_level'] ?? 0,
            'min_stock_level' => $validated['min_stock_level'] ?? 0,
        ]);

        return ApiResponse::success($this->productManagementService->present($product->fresh(['productCategory'])), 'Product created.', 201);
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
            'product_category_id' => ['sometimes', 'integer', Rule::exists('product_categories', 'product_category_id')],
            'description' => ['sometimes', 'nullable', 'string'],
            'image_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'image_data' => ['sometimes', ...ImageData::rules()],
            'stock_quantity' => ['sometimes', 'integer', 'min:1'],
            'reorder_level' => ['sometimes', 'integer', 'min:0'],
            'unit_price' => ['sometimes', 'numeric', 'gt:0'],
            'min_stock_level' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (array_key_exists('product_category_id', $validated)) {
            $validated['category'] = $this->productCategoryService->labelFor((int) $validated['product_category_id']) ?? $product->category;
        }

        $product->update($validated);

        return ApiResponse::success($this->productManagementService->present($product->fresh(['productCategory'])), 'Product updated.');
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

        if (! $this->productManagementService->canDelete($product)) {
            return ApiResponse::error('Product is used in existing records and cannot be deleted.', 422, 'PRODUCT_IN_USE', [
                'references' => $this->productManagementService->referenceCount($product),
            ]);
        }

        $product->delete();

        return ApiResponse::success(null, 'Product deleted.');
    }
}
