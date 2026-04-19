<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Service;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ManagementController extends Controller
{
    private function isAdmin(Request $request): bool
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];
        return in_array('admin', $abilities, true);
    }

    public function services(Request $request)
    {
        if (! $this->isAdmin($request) && $request->isMethod('GET') === false) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $query = Service::query()->with('category:category_id,category_name')->orderByDesc('service_id');
        if ($search = $request->query('search')) {
            $query->where('service_name', 'like', '%'.$search.'%');
        }
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        return ApiResponse::success($query->paginate((int) $request->query('per_page', 10)), 'Services retrieved.');
    }

    public function storeService(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'service_name' => ['required', 'string', 'max:100', 'unique:services,service_name'],
            'price' => ['required', 'numeric', 'gt:0'],
            'duration' => ['required', 'integer', 'min:5'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'integer', Rule::exists('service_categories', 'category_id')],
        ]);

        $service = Service::create($validated);

        return ApiResponse::success($service->fresh(), 'Service created.', 201);
    }

    public function updateService(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $service = Service::find($id);
        if (! $service) {
            return ApiResponse::error('Service not found.', 404, 'NOT_FOUND');
        }

        $validated = $request->validate([
            'service_name' => ['sometimes', 'string', 'max:100', Rule::unique('services', 'service_name')->ignore($service->service_id, 'service_id')],
            'price' => ['sometimes', 'numeric', 'gt:0'],
            'duration' => ['sometimes', 'integer', 'min:5'],
            'description' => ['nullable', 'string'],
            'category_id' => ['sometimes', 'integer', Rule::exists('service_categories', 'category_id')],
        ]);

        $service->update($validated);

        return ApiResponse::success($service->fresh(), 'Service updated.');
    }

    public function deleteService(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $service = Service::find($id);
        if (! $service) {
            return ApiResponse::error('Service not found.', 404, 'NOT_FOUND');
        }
        $service->delete();

        return ApiResponse::success(null, 'Service deleted.');
    }

    public function promotions(Request $request)
    {
        $query = Promotion::query()->with('service:service_id,service_name')->orderByDesc('promotion_id');
        if ($request->query('active') === '1') {
            $query->whereDate('expiration_date', '>=', now()->toDateString());
        }
        if ($search = $request->query('search')) {
            $query->where('promotion_code', 'like', '%'.$search.'%');
        }

        return ApiResponse::success($query->paginate((int) $request->query('per_page', 10)), 'Promotions retrieved.');
    }

    public function storePromotion(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $validated = $request->validate([
            'apply_type' => ['required', 'string', 'max:100'],
            'service_id' => ['nullable', 'integer', Rule::exists('services', 'service_id')],
            'percent' => ['required', 'integer', 'min:1', 'max:100'],
            'promotion_code' => ['required', 'string', 'max:20', 'unique:promotions,promotion_code'],
            'expiration_date' => ['required', 'date'],
            'usage_limit' => ['required', 'integer', 'min:1'],
        ]);
        $promotion = Promotion::create($validated);

        return ApiResponse::success($promotion->fresh(), 'Promotion created.', 201);
    }

    public function updatePromotion(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $promotion = Promotion::find($id);
        if (! $promotion) {
            return ApiResponse::error('Promotion not found.', 404, 'NOT_FOUND');
        }
        $validated = $request->validate([
            'apply_type' => ['sometimes', 'string', 'max:100'],
            'service_id' => ['nullable', 'integer', Rule::exists('services', 'service_id')],
            'percent' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'promotion_code' => ['sometimes', 'string', 'max:20', Rule::unique('promotions', 'promotion_code')->ignore($promotion->promotion_id, 'promotion_id')],
            'expiration_date' => ['sometimes', 'date'],
            'usage_limit' => ['sometimes', 'integer', 'min:1'],
        ]);
        $promotion->update($validated);

        return ApiResponse::success($promotion->fresh(), 'Promotion updated.');
    }

    public function deletePromotion(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $promotion = Promotion::find($id);
        if (! $promotion) {
            return ApiResponse::error('Promotion not found.', 404, 'NOT_FOUND');
        }
        $promotion->delete();

        return ApiResponse::success(null, 'Promotion deleted.');
    }

    public function products(Request $request)
    {
        if (! $this->isAdmin($request) && $request->isMethod('GET') === false) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $query = Product::query()->orderByDesc('product_id');
        if ($search = $request->query('search')) {
            $query->where('product_name', 'like', '%'.$search.'%');
        }
        if ($request->query('low_stock') === '1') {
            $query->whereColumn('stock_quantity', '<=', 'reorder_level');
        }

        $data = $query->paginate((int) $request->query('per_page', 10));

        return ApiResponse::success($data, 'Products retrieved.');
    }

    public function storeProduct(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $validated = $request->validate([
            'product_name' => ['required', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'in:hair,skin'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:255'],
            'stock_quantity' => ['required', 'integer', 'min:1'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'unit_price' => ['required', 'numeric', 'gt:0'],
            'min_stock_level' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = Product::create([
            ...$validated,
            'category' => $validated['category'] ?? 'hair',
            'reorder_level' => $validated['reorder_level'] ?? 0,
            'min_stock_level' => $validated['min_stock_level'] ?? 0,
        ]);

        return ApiResponse::success($product->fresh(), 'Product created.', 201);
    }

    public function updateProduct(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $product = Product::find($id);
        if (! $product) {
            return ApiResponse::error('Product not found.', 404, 'NOT_FOUND');
        }

        $validated = $request->validate([
            'product_name' => ['sometimes', 'string', 'max:50'],
            'category' => ['sometimes', 'string', 'in:hair,skin'],
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

    public function deleteProduct(Request $request, string $id)
    {
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

    public function suppliers(Request $request)
    {
        if (! $this->isAdmin($request) && $request->isMethod('GET') === false) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $query = Supplier::query()->orderByDesc('supplier_id');
        if ($search = $request->query('search')) {
            $query->where('supplier_name', 'like', '%'.$search.'%');
        }

        return ApiResponse::success($query->paginate((int) $request->query('per_page', 10)), 'Suppliers retrieved.');
    }

    public function storeSupplier(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $validated = $request->validate([
            'supplier_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', 'unique:suppliers,email'],
            'phone' => ['nullable', 'string', 'max:15', 'unique:suppliers,phone'],
        ]);
        $supplier = Supplier::create($validated);

        return ApiResponse::success($supplier->fresh(), 'Supplier created.', 201);
    }

    public function updateSupplier(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $supplier = Supplier::find($id);
        if (! $supplier) {
            return ApiResponse::error('Supplier not found.', 404, 'NOT_FOUND');
        }
        $validated = $request->validate([
            'supplier_name' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', 'max:100', Rule::unique('suppliers', 'email')->ignore($supplier->supplier_id, 'supplier_id')],
            'phone' => ['nullable', 'string', 'max:15', Rule::unique('suppliers', 'phone')->ignore($supplier->supplier_id, 'supplier_id')],
        ]);
        $supplier->update($validated);

        return ApiResponse::success($supplier->fresh(), 'Supplier updated.');
    }

    public function deleteSupplier(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $supplier = Supplier::find($id);
        if (! $supplier) {
            return ApiResponse::error('Supplier not found.', 404, 'NOT_FOUND');
        }
        $supplier->delete();

        return ApiResponse::success(null, 'Supplier deleted.');
    }

    public function reports(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $monthStart = now()->copy()->startOfMonth();
        $yearStart = now()->copy()->startOfYear();

        $monthlyRevenue = DB::table('appointments')
            ->selectRaw('DATE_FORMAT(appointment_date, "%Y-%m") as month, SUM(final_amount) as total')
            ->where('payment_status', 'pay')
            ->whereDate('appointment_date', '>=', $yearStart)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $inventoryConsumption = DB::table('inventory_logs')
            ->join('products', 'products.product_id', '=', 'inventory_logs.product_id')
            ->select('products.product_name', DB::raw('SUM(CASE WHEN change_amount < 0 THEN ABS(change_amount) ELSE 0 END) as consumed'))
            ->whereDate('inventory_logs.created_at', '>=', $monthStart)
            ->groupBy('products.product_name')
            ->orderByDesc('consumed')
            ->limit(10)
            ->get();

        $wastage = DB::table('inventory_logs')
            ->where('reason', 'like', '%wastage%')
            ->whereDate('created_at', '>=', $monthStart)
            ->sum(DB::raw('ABS(change_amount)'));

        return ApiResponse::success([
            'monthly_revenue' => $monthlyRevenue,
            'inventory_consumption' => $inventoryConsumption,
            'monthly_wastage_units' => (int) $wastage,
        ], 'Reports retrieved.');
    }
}
