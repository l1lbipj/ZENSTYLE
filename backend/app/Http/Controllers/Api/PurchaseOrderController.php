<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\InventoryLog;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    private function isAdmin(Request $request): bool
    {
        return in_array('admin', $request->user()?->currentAccessToken()?->abilities ?? [], true);
    }

    public function index(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $orders = PurchaseOrder::query()
            ->with(['supplier', 'orderDetails.product'])
            ->orderByDesc('order_id')
            ->paginate((int) $request->query('per_page', 20));

        return ApiResponse::success($orders, 'Purchase orders retrieved.');
    }

    public function store(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'supplier_id' => ['required', 'integer', 'exists:suppliers,supplier_id'],
            'order_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],
            'workflow_status' => ['nullable', 'in:draft,sent,received,cancelled'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,product_id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.import_price' => ['required', 'numeric', 'gt:0'],
        ]);

        $result = DB::transaction(function () use ($validated) {
            $total = collect($validated['items'])->sum(fn ($item) => (float) $item['import_price'] * (int) $item['quantity']);
            $order = PurchaseOrder::create([
                'supplier_id' => $validated['supplier_id'],
                'order_date' => $validated['order_date'],
                'total_amount' => $total,
                'status' => 'active',
                'reference_code' => 'PO-'.now()->format('YmdHis').'-'.random_int(100, 999),
                'workflow_status' => $validated['workflow_status'] ?? 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $row) {
                OrderDetail::create([
                    'order_id' => $order->getKey(),
                    'product_id' => $row['product_id'],
                    'quantity' => $row['quantity'],
                    'import_price' => $row['import_price'],
                    'received_quantity' => 0,
                ]);
            }

            return $order->fresh(['supplier', 'orderDetails.product']);
        });

        return ApiResponse::success($result, 'Purchase order created.', 201);
    }

    public function update(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $order = PurchaseOrder::find($id);
        if (! $order) {
            return ApiResponse::error('Purchase order not found.', 404, 'NOT_FOUND');
        }

        $validated = $request->validate([
            'supplier_id' => ['sometimes', 'integer', 'exists:suppliers,supplier_id'],
            'order_date' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],
            'workflow_status' => ['sometimes', 'in:draft,sent,received,cancelled'],
        ]);

        $order->update($validated);

        return ApiResponse::success($order->fresh(['supplier', 'orderDetails.product']), 'Purchase order updated.');
    }

    public function send(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $order = PurchaseOrder::find($id);
        if (! $order) {
            return ApiResponse::error('Purchase order not found.', 404, 'NOT_FOUND');
        }

        $order->workflow_status = 'sent';
        $order->status = 'active';
        $order->save();

        return ApiResponse::success($order->fresh(['supplier', 'orderDetails.product']), 'Purchase order marked as sent.');
    }

    public function receive(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $order = PurchaseOrder::find($id);
        if (! $order) {
            return ApiResponse::error('Purchase order not found.', 404, 'NOT_FOUND');
        }

        $updatedOrder = DB::transaction(function () use ($order) {
            $order->load('orderDetails.product');

            foreach ($order->orderDetails as $detail) {
                $receivedQuantity = (int) $detail->quantity;
                $detail->received_quantity = $receivedQuantity;
                $detail->save();

                $product = Product::query()->lockForUpdate()->find($detail->product_id);
                if ($product) {
                    $product->stock_quantity = (int) $product->stock_quantity + $receivedQuantity;
                    $product->save();

                    InventoryLog::create([
                        'product_id' => (int) $product->product_id,
                        'change_amount' => $receivedQuantity,
                        'reason' => 'Received purchase order #'.$order->order_id,
                    ]);
                }
            }

            $order->workflow_status = 'received';
            $order->status = 'inactive';
            $order->received_at = now();
            $order->save();

            return $order->fresh(['supplier', 'orderDetails.product']);
        });

        return ApiResponse::success($updatedOrder, 'Purchase order received.');
    }

    public function destroy(Request $request, string $id)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $order = PurchaseOrder::find($id);
        if (! $order) {
            return ApiResponse::error('Purchase order not found.', 404, 'NOT_FOUND');
        }

        $order->delete();

        return ApiResponse::success(null, 'Purchase order deleted.');
    }
}
