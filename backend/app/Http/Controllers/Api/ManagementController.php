<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Allergy;
use App\Models\Appointment;
use App\Models\AppointmentDetail;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Service;
use App\Models\Supplier;
use App\Services\AllergyService;
use App\Services\ProductCategoryService;
use App\Services\ProductManagementService;
use App\Support\ImageData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use App\Models\CustomerOrder;
use App\Models\CustomerOrderItem;

class ManagementController extends Controller
{
    public function __construct(
        private readonly ProductManagementService $productManagementService,
        private readonly AllergyService $allergyService,
        private readonly ProductCategoryService $productCategoryService,
    ) {
    }

    private function isAdmin(Request $request): bool
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];
        return in_array('admin', $abilities, true) || $request->user() instanceof \App\Models\Admin;
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

        $perPage = $request->query('per_page', 10);
        if ($perPage === 'all' || (int) $perPage <= 0) {
            return ApiResponse::success($query->get(), 'Promotions retrieved.');
        }

        return ApiResponse::success($query->paginate((int) $perPage), 'Promotions retrieved.');
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

        $query = Product::query()->with('productCategory:product_category_id,product_category_name')->orderByDesc('product_id');
        if ($search = $request->query('search')) {
            $query->where('product_name', 'like', '%'.$search.'%');
        }
        if ($request->query('low_stock') === '1') {
            $query->whereColumn('stock_quantity', '<=', 'reorder_level');
        }

        $data = $query->paginate((int) $request->query('per_page', 10));
        $data->setCollection($data->getCollection()->map(fn (Product $product) => $this->productManagementService->present($product)));

        return ApiResponse::success($data, 'Products retrieved.');
    }

    public function storeProduct(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $validated = $request->validate([
            'product_name' => ['required', 'string', 'max:50'],
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

    public function deleteProduct(Request $request, string $id)
    {
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

    private function presentAppointmentOrder(Appointment $appointment): array
    {
        $details = $appointment->appointmentDetails ?? collect();
        $itemNames = $details->map(function (AppointmentDetail $detail) {
            return $detail->service?->service_name
                ?? null;
        })->filter()->values();

        $attendance = trim((string) ($appointment->attendance_status ?? ''));
        $isCancelled = (string) $appointment->status === 'inactive' && $attendance === 'Cancelled';
        $isPaid = (string) $appointment->payment_status === 'pay';
        $isCompleted = $attendance === 'Completed';
        $isCheckedIn = $attendance === 'Checked-In';

        return [
            'invoice_type' => 'appointment_order',
            'invoice_id' => 'APT-'.$appointment->appointment_id,
            'appointment_id' => $appointment->appointment_id,
            'customer_name' => $appointment->client?->client_name ?? 'Client',
            'customer_phone' => $appointment->client?->phone ?? '',
            'item_name' => $itemNames->isNotEmpty() ? $itemNames->implode(', ') : 'Appointment',
            'service_count' => $details->filter(fn (AppointmentDetail $detail) => ! empty($detail->service_id))->count(),
            'product_count' => 0,
            'total_amount' => (float) ($appointment->final_amount ?? $appointment->total_amount ?? 0),
            'subtotal' => (float) ($appointment->total_amount ?? 0),
            'payment_status' => $isPaid ? 'Paid' : 'Pending',
            'payment_method' => $appointment->payment_method ? ucwords(str_replace(['_', '-'], ' ', (string) $appointment->payment_method)) : 'Cash',
            'payment_date' => $appointment->updated_at ?? $appointment->created_at,
            'appointment_date' => $appointment->appointment_date,
            'attendance_status' => $attendance ?: 'Pending',
            'status' => $isCancelled ? 'Cancelled' : ($isCompleted ? 'Completed' : ($isCheckedIn ? 'In progress' : ($isPaid ? 'Paid' : 'Pending'))),
            'can_approve' => ! $isPaid && ! $isCancelled,
            'can_cancel' => ! $isCancelled && ! in_array($attendance, ['Checked-In', 'Completed'], true),
            'details' => $details->map(function (AppointmentDetail $detail) {
                $name = $detail->service?->service_name ?? 'Service';
                $lineTotal = (float) ($detail->price ?? 0);

                return [
                    'detail_id' => $detail->detail_id,
                    'item_name' => $name,
                    'quantity' => 1,
                    'unit_price' => round($lineTotal, 2),
                    'line_total' => $lineTotal,
                    'staff_name' => $detail->staff?->staff_name ?? null,
                    'start_time' => $detail->start_time,
                    'end_time' => $detail->end_time,
                    'status' => ($detail->status ?? '') === 'inactive' ? 'Completed' : 'Scheduled',
                ];
            })->values(),
        ];
    }

    public function orders(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $query = Appointment::query()
            ->with([
                'client:client_id,client_name,phone',
                'appointmentDetails.staff:staff_id,staff_name',
                'appointmentDetails.service:service_id,service_name',
            ])
            ->orderByDesc('appointment_id');

        if ($search = $request->query('search')) {
            $query->where(function ($builder) use ($search): void {
                $builder->whereHas('client', function ($clientQuery) use ($search): void {
                    $clientQuery->where('client_name', 'like', '%'.$search.'%')
                        ->orWhere('phone', 'like', '%'.$search.'%');
                })->orWhere('appointment_id', 'like', '%'.$search.'%');
            });
        }

        if ($status = $request->query('status')) {
            $normalized = strtolower((string) $status);
            if ($normalized === 'paid') {
                $query->where('payment_status', 'pay');
            } elseif (in_array($normalized, ['pending', 'unpay'], true)) {
                $query->where('payment_status', 'unpay');
            } elseif (in_array($normalized, ['completed', 'cancelled', 'checked-in', 'missed'], true)) {
                $map = [
                    'completed' => 'Completed',
                    'cancelled' => 'Cancelled',
                    'checked-in' => 'Checked-In',
                    'missed' => 'Missed',
                ];
                $query->where('attendance_status', $map[$normalized]);
            }
        }

        $data = $query->paginate((int) $request->query('per_page', 10));
        $data->setCollection($data->getCollection()->map(fn (Appointment $appointment) => $this->presentAppointmentOrder($appointment)));

        return ApiResponse::success($data, 'Orders retrieved.');
    }

    public function orderShow(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment = Appointment::query()
            ->with([
                'client:client_id,client_name,phone',
                'appointmentDetails.staff:staff_id,staff_name',
                'appointmentDetails.service:service_id,service_name',
            ])
            ->find($id);

        if (! $appointment) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        return ApiResponse::success($this->presentAppointmentOrder($appointment), 'Order retrieved.');
    }

    private function presentCustomerOrder(CustomerOrder $order): array
    {
        $items = $order->items ?? collect();
        $itemNames = $items->map(fn ($it) => $it->product?->product_name ?? 'Product')->filter()->values();

        $isCancelled = (string) $order->order_status === 'cancelled';
        $isPaid = (string) $order->payment_status === 'paid';

        return [
            'customer_order_id' => $order->customer_order_id,
            'id' => $order->customer_order_id,
            'invoice_type' => 'product_order',
            'invoice_id' => $order->order_number,
            'customer_name' => $order->client?->client_name ?? 'Client',
            'customer_phone' => $order->client?->phone ?? '',
            'item_name' => $itemNames->isNotEmpty() ? $itemNames->implode(', ') : 'Products',
            'product_count' => $items->sum(fn ($it) => (int) ($it->quantity ?? 0)),
            'total_amount' => (float) ($order->final_amount ?? 0),
            'subtotal' => (float) ($order->subtotal ?? 0),
            'payment_status' => $isPaid ? 'Paid' : ucfirst((string) $order->payment_status),
            'payment_method' => $order->payment_method ? ucwords(str_replace(['_', '-'], ' ', (string) $order->payment_method)) : 'Cash',
            'payment_date' => $order->updated_at ?? $order->created_at,
            'status' => $isCancelled ? 'Cancelled' : ($isPaid ? 'Paid' : ucfirst((string) $order->order_status)),
            'can_approve' => ! $isPaid && ! $isCancelled,
            'can_cancel' => ! $isCancelled && $order->order_status === 'pending',
            'details' => $items->map(function (CustomerOrderItem $item) {
                $quantity = (int) $item->quantity;
                $lineTotal = (float) $item->line_total;

                return [
                    'detail_id' => $item->customer_order_item_id,
                    'item_name' => $item->product?->product_name ?? 'Product',
                    'item_type' => 'product',
                    'quantity' => $quantity,
                    'unit_price' => $quantity > 0 ? round($lineTotal / $quantity, 2) : 0,
                    'line_total' => $lineTotal,
                ];
            })->values(),
        ];
    }

    public function productOrders(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $query = CustomerOrder::query()
            ->with(['client:client_id,client_name,phone', 'items.product:product_id,product_name'])
            ->orderByDesc('customer_order_id');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('client', fn ($cq) => $cq->where('client_name', 'like', '%'.$search.'%')->orWhere('phone', 'like', '%'.$search.'%'))
                  ->orWhere('order_number', 'like', '%'.$search.'%');
            });
        }

        if ($status = $request->query('status')) {
            $normalized = strtolower((string) $status);
            if ($normalized === 'paid') {
                $query->where('payment_status', 'paid');
            } elseif ($normalized === 'pending') {
                $query->where('payment_status', 'pending');
            } elseif ($normalized === 'cancelled') {
                $query->where('order_status', 'cancelled');
            }
        }

        $data = $query->paginate((int) $request->query('per_page', 10));
        $data->setCollection($data->getCollection()->map(fn (CustomerOrder $order) => $this->presentCustomerOrder($order)));

        return ApiResponse::success($data, 'Product orders retrieved.');
    }

    public function productOrderShow(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        $order = CustomerOrder::query()->with(['client:client_id,client_name,phone', 'items.product:product_id,product_name'])->find($id);
        if (! $order) {
            // Try resolving by order_number (invoice id) for backward compatibility
            $order = CustomerOrder::query()->with(['client:client_id,client_name,phone', 'items.product:product_id,product_name'])->where('order_number', $id)->first();
        }
        if (! $order) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        return ApiResponse::success($this->presentCustomerOrder($order), 'Product order retrieved.');
    }

    public function approveProductOrder(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $order = CustomerOrder::find($id);
        if (! $order) {
            $order = CustomerOrder::where('order_number', $id)->first();
        }
        if (! $order) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        if ($order->order_status === 'cancelled') {
            return ApiResponse::error('Cancelled orders cannot be approved.', 422, 'INVALID_ORDER_STATE');
        }

        if ($order->payment_status === 'paid') {
            return ApiResponse::success($this->presentCustomerOrder($order), 'Order already paid.');
        }

        $order->payment_status = 'paid';
        $order->order_status = 'completed';
        if (! $order->payment_method) {
            $order->payment_method = 'cash';
        }
        $order->save();

        return ApiResponse::success($this->presentCustomerOrder($order->fresh(['client', 'items.product'])), 'Order approved.');
    }

    public function cancelProductOrder(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $order = CustomerOrder::with('items')->find($id);
        if (! $order) {
            $order = CustomerOrder::with('items')->where('order_number', $id)->first();
        }
        if (! $order) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        if ($order->order_status !== 'pending') {
            return ApiResponse::error('Only pending orders can be cancelled.', 422, 'ORDER_NOT_CANCELLABLE');
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                Product::query()->where('product_id', $item->product_id)->increment('stock_quantity', (int) $item->quantity);
            }

            $order->order_status = 'cancelled';
            $order->payment_status = 'failed';
            $order->save();
        });

        return ApiResponse::success($this->presentCustomerOrder($order->fresh(['client', 'items.product'])), 'Order cancelled.');
    }

    public function approveOrder(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment = Appointment::find($id);
        if (! $appointment) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        if ((string) $appointment->status === 'inactive' && ($appointment->attendance_status ?? null) === 'Cancelled') {
            return ApiResponse::error('Cancelled appointments cannot be approved.', 422, 'INVALID_ORDER_STATE');
        }

        $appointment->payment_status = 'pay';
        if (! $appointment->payment_method) {
            $appointment->payment_method = 'cash';
        }
        $appointment->save();

        return ApiResponse::success($this->presentAppointmentOrder($appointment->fresh(['client', 'appointmentDetails.staff', 'appointmentDetails.service'])), 'Order approved.');
    }

    public function approveAppointment(Request $request, string $id)
    {
        return $this->approveOrder($request, $id);
    }

    public function cancelOrder(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment = Appointment::with('appointmentDetails')->find($id);
        if (! $appointment) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        if (in_array($appointment->attendance_status, ['Checked-In', 'Completed'], true)) {
            return ApiResponse::error('Checked-in or completed orders cannot be cancelled.', 422, 'INVALID_ORDER_STATE');
        }

        $appointment->status = 'inactive';
        if (Schema::hasColumn('appointments', 'attendance_status')) {
            $appointment->attendance_status = 'Cancelled';
        }
        $appointment->save();

        AppointmentDetail::where('appointment_id', $appointment->appointment_id)->update(['status' => 'inactive']);

        return ApiResponse::success($this->presentAppointmentOrder($appointment->fresh(['client', 'appointmentDetails.staff', 'appointmentDetails.service'])), 'Order cancelled.');
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

    public function allergies(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $query = Allergy::query()->orderBy('allergy_name');
        $perPage = $request->query('per_page', 10);

        if ($perPage === 'all' || (int) $perPage <= 0) {
            return ApiResponse::success($query->get(), 'Allergies retrieved.');
        }

        return ApiResponse::success($query->paginate((int) $perPage), 'Allergies retrieved.');
    }

    public function storeAllergy(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'allergy_name' => ['required', 'string', 'min:2', 'max:100', 'unique:allergies,allergy_name'],
        ]);

        $allergy = Allergy::create([
            'allergy_name' => trim($validated['allergy_name']),
        ]);

        return ApiResponse::success($allergy->fresh(), 'Allergy created.', 201);
    }

    public function updateAllergy(Request $request, string $key)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $allergy = Allergy::find($key);
        if (! $allergy) {
            return ApiResponse::error('Allergy not found.', 404, 'NOT_FOUND');
        }

        $validated = $request->validate([
            'allergy_name' => ['required', 'string', 'min:2', 'max:100', Rule::unique('allergies', 'allergy_name')->ignore($allergy->allergy_id, 'allergy_id')],
        ]);

        $allergy->update([
            'allergy_name' => trim($validated['allergy_name']),
        ]);

        return ApiResponse::success($allergy->fresh(), 'Allergy updated.');
    }

    public function deleteAllergy(Request $request, string $key)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $allergy = Allergy::find($key);
        if (! $allergy) {
            return ApiResponse::error('Allergy not found.', 404, 'NOT_FOUND');
        }

        DB::transaction(function () use ($allergy): void {
            $this->allergyService->removeAllergyReferences((int) $allergy->allergy_id);
            $allergy->delete();
        });

        return ApiResponse::success(null, 'Allergy deleted.');
    }

    public function reports(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $from = $request->query('from') ? \Carbon\Carbon::parse($request->query('from'))->startOfDay() : now()->copy()->startOfMonth();
        $to = $request->query('to') ? \Carbon\Carbon::parse($request->query('to'))->endOfDay() : now()->endOfDay();

        $monthlyRevenue = DB::table('appointments')
            ->selectRaw('DATE_FORMAT(appointment_date, "%Y-%m") as month, SUM(final_amount) as total')
            ->where('payment_status', 'pay')
            ->whereBetween('appointment_date', [$from, $to])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $inventoryConsumption = DB::table('inventory_logs')
            ->join('products', 'products.product_id', '=', 'inventory_logs.product_id')
            ->select('products.product_name', DB::raw('SUM(CASE WHEN change_amount < 0 THEN ABS(change_amount) ELSE 0 END) as consumed'))
            ->whereBetween('inventory_logs.created_at', [$from, $to])
            ->groupBy('products.product_name')
            ->orderByDesc('consumed')
            ->limit(10)
            ->get();

        $wastage = DB::table('inventory_logs')
            ->where('reason', 'like', '%wastage%')
            ->whereBetween('created_at', [$from, $to])
            ->sum(DB::raw('ABS(change_amount)'));

        return ApiResponse::success([
            'from' => $from->toISOString(),
            'to' => $to->toISOString(),
            'monthly_revenue' => $monthlyRevenue,
            'inventory_consumption' => $inventoryConsumption,
            'monthly_wastage_units' => (int) $wastage,
        ], 'Reports retrieved.');
    }
}
