<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\CustomerOrder;
use App\Models\CustomerOrderItem;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CustomerOrderController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function isClient(Request $request): bool
    {
        return in_array('client', $this->abilities($request), true);
    }

    private function mapOrder(CustomerOrder $order): array
    {
        $items = $order->items ?? collect();

        return [
            'id' => (int) $order->customer_order_id,
            'order_number' => $order->order_number,
            'client_id' => (int) $order->client_id,
            'client' => $order->client ? [
                'id' => (int) $order->client->client_id,
                'client_name' => $order->client->client_name,
                'email' => $order->client->email,
                'phone' => $order->client->phone,
            ] : null,
            'subtotal' => (float) $order->subtotal,
            'discount_amount' => (float) $order->discount_amount,
            'final_amount' => (float) $order->final_amount,
            'payment_method' => ucfirst(str_replace('_', ' ', (string) $order->payment_method)),
            'payment_status' => ucfirst((string) $order->payment_status),
            'order_status' => ucfirst((string) $order->order_status),
            'notes' => $order->notes,
            'order_date' => optional($order->created_at)?->toISOString(),
            'created_at' => optional($order->created_at)?->toISOString(),
            'updated_at' => optional($order->updated_at)?->toISOString(),
            'items' => $items->map(function (CustomerOrderItem $item) {
                $quantity = (int) $item->quantity;
                $lineTotal = (float) $item->line_total;

                return [
                    'id' => (int) $item->customer_order_item_id,
                    'product_id' => (int) $item->product_id,
                    'product_name' => $item->product?->product_name ?? 'Product',
                    'quantity' => $quantity,
                    'unit_price' => $quantity > 0 ? round($lineTotal / $quantity, 2) : 0.0,
                    'line_total' => $lineTotal,
                    'image_url' => $item->product?->image_url,
                ];
            })->values(),
        ];
    }

    public function index(Request $request)
    {
        if (! $this->isClient($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $orders = CustomerOrder::query()
            ->with(['client:client_id,client_name,email,phone', 'items.product:product_id,product_name,image_url', 'promotion:promotion_id,promotion_code,percent'])
            ->where('client_id', $request->user()->getKey())
            ->orderByDesc('customer_order_id')
            ->paginate((int) $request->query('per_page', 20));

        $orders->setCollection($orders->getCollection()->map(fn (CustomerOrder $order) => $this->mapOrder($order)));

        return ApiResponse::success($orders, 'Customer orders retrieved.');
    }

    public function store(Request $request)
    {
        if (! $this->isClient($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_type' => ['nullable', 'in:product'],
            'items.*.item_id' => ['required', 'integer', 'exists:products,product_id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'promotion_id' => ['nullable', 'integer', Rule::exists('promotions', 'promotion_id')],
            'payment_method' => ['nullable', 'in:cash,card,bank_transfer'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $clientId = (int) $request->user()->getKey();

        $result = DB::transaction(function () use ($clientId, $validated) {
            $promotion = null;
            if (! empty($validated['promotion_id'])) {
                $promotion = Promotion::query()
                    ->where('promotion_id', $validated['promotion_id'])
                    ->where(function ($query) {
                $query->where('apply_type', 'order')->orWhere('apply_type', 'all');
                    })
                    ->first();
            }

            $productIds = collect($validated['items'])->pluck('item_id')->map(fn ($id) => (int) $id)->values()->all();
            $products = Product::query()
                ->whereIn('product_id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            $subtotal = 0.0;
            $items = [];

            foreach ($validated['items'] as $index => $line) {
                if (($line['item_type'] ?? 'product') !== 'product') {
                    throw new HttpResponseException(ApiResponse::error('Only product items are allowed in customer orders.', 422, 'INVALID_ORDER_ITEM'));
                }

                $productId = (int) $line['item_id'];
                $quantity = (int) $line['quantity'];
                $product = $products->get($productId);

                if (! $product) {
                    throw new HttpResponseException(ApiResponse::error("Product not found.", 422, 'INVALID_PRODUCT'));
                }

                if ((int) $product->stock_quantity < $quantity) {
                    throw new HttpResponseException(ApiResponse::error('One or more items are out of stock.', 422, 'OUT_OF_STOCK'));
                }

                $unitPrice = (float) $product->unit_price;
                $lineTotal = round($unitPrice * $quantity, 2);
                $subtotal += $lineTotal;

                $items[] = [
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'line_total' => $lineTotal,
                ];
            }

            $discountAmount = 0.0;
            if ($promotion) {
                $discountAmount = round($subtotal * ((int) $promotion->percent / 100), 2);
            }

            $finalAmount = max(0, round($subtotal - $discountAmount, 2));
            $order = CustomerOrder::create([
                'client_id' => $clientId,
                'promotion_id' => $promotion?->promotion_id,
                'order_number' => 'CO-'.now()->format('YmdHis').'-'.random_int(100, 999),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'final_amount' => $finalAmount,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'payment_status' => 'pending',
                'order_status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($items as $line) {
                CustomerOrderItem::create([
                    'customer_order_id' => $order->customer_order_id,
                    ...$line,
                ]);

                Product::query()
                    ->where('product_id', $line['product_id'])
                    ->decrement('stock_quantity', $line['quantity']);
            }

            return $order->fresh(['client:client_id,client_name,email,phone', 'items.product:product_id,product_name,image_url', 'promotion:promotion_id,promotion_code,percent']);
        });

        return ApiResponse::success($this->mapOrder($result), 'Customer order created.', 201);
    }

    public function show(Request $request, string $id)
    {
        if (! $this->isClient($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $order = CustomerOrder::query()
            ->with(['client:client_id,client_name,email,phone', 'items.product:product_id,product_name,image_url', 'promotion:promotion_id,promotion_code,percent'])
            ->where('client_id', $request->user()->getKey())
            ->find($id);

        if (! $order) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        return ApiResponse::success($this->mapOrder($order), 'Customer order retrieved.');
    }

    public function cancel(Request $request, string $id)
    {
        if (! $this->isClient($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $order = CustomerOrder::query()
            ->with(['client:client_id,client_name,email,phone', 'items.product'])
            ->where('client_id', $request->user()->getKey())
            ->find($id);

        if (! $order) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        if ($order->order_status !== 'pending') {
            return ApiResponse::error('Only pending orders can be cancelled.', 422, 'ORDER_NOT_CANCELLABLE');
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                Product::query()
                    ->where('product_id', $item->product_id)
                    ->increment('stock_quantity', (int) $item->quantity);
            }

            $order->order_status = 'cancelled';
            $order->payment_status = 'failed';
            $order->save();
        });

        return ApiResponse::success($this->mapOrder($order->fresh(['client:client_id,client_name,email,phone', 'items.product'])), 'Order cancelled.');
    }
}
