<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Product;
use App\Models\ShopOrder;
use App\Models\ShopOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShopOrderController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function ensureClient(Request $request)
    {
        if (! in_array('client', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }
        return null;
    }

    public function index(Request $request)
    {
        if ($resp = $this->ensureClient($request)) {
            return $resp;
        }

        $orders = ShopOrder::query()
            ->with(['items.product:product_id,product_name,image_url,unit_price'])
            ->where('client_id', $request->user()->getKey())
            ->orderByDesc('shop_order_id')
            ->limit(50)
            ->get();

        return ApiResponse::success($orders, 'Orders retrieved.');
    }

    public function show(Request $request, int $id)
    {
        if ($resp = $this->ensureClient($request)) {
            return $resp;
        }

        $order = ShopOrder::query()
            ->with(['items.product:product_id,product_name,image_url,unit_price'])
            ->where('client_id', $request->user()->getKey())
            ->where('shop_order_id', $id)
            ->first();

        if (! $order) {
            return ApiResponse::error('Order not found.', 404, 'NOT_FOUND');
        }

        return ApiResponse::success($order, 'Order retrieved.');
    }

    public function checkout(Request $request)
    {
        if ($resp = $this->ensureClient($request)) {
            return $resp;
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],

            'promo_code' => ['nullable', 'string', 'max:30'],
            'payment_method' => ['nullable', 'in:cod'],

            'shipping' => ['required', 'array'],
            'shipping.name' => ['required', 'string', 'max:120'],
            'shipping.phone' => ['required', 'string', 'max:20'],
            'shipping.address' => ['required', 'string', 'max:255'],
            'shipping.note' => ['nullable', 'string', 'max:500'],
        ]);

        $items = $validated['items'];
        $promoCode = isset($validated['promo_code']) ? strtolower(trim($validated['promo_code'])) : null;
        $paymentMethod = $validated['payment_method'] ?? 'cod';
        $shipping = $validated['shipping'];

        // Promo rules must be server-side (prevent tampering).
        $discountRate = 0.0;
        if ($promoCode === 'zen10') $discountRate = 0.10;
        if ($promoCode === 'zen20') $discountRate = 0.20;

        $shippingFee = 5.00; // keep in sync with frontend (CartPage)

        $clientId = $request->user()->getKey();

        $result = DB::transaction(function () use ($items, $clientId, $shipping, $promoCode, $discountRate, $shippingFee, $paymentMethod) {
            // Aggregate quantities by product_id.
            $qtyByProduct = [];
            foreach ($items as $row) {
                $pid = (int) $row['product_id'];
                $qtyByProduct[$pid] = ($qtyByProduct[$pid] ?? 0) + (int) $row['quantity'];
            }

            $productIds = array_keys($qtyByProduct);

            /** @var \Illuminate\Support\Collection<int, Product> $products */
            $products = Product::query()
                ->whereIn('product_id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            if ($products->count() !== count($productIds)) {
                return ApiResponse::error('Some products are invalid.', 422, 'INVALID_PRODUCTS');
            }

            $subtotal = 0.0;
            foreach ($qtyByProduct as $productId => $qty) {
                $product = $products->get($productId);
                if (! $product) {
                    return ApiResponse::error('Some products are invalid.', 422, 'INVALID_PRODUCTS');
                }
                if ((int) $product->stock_quantity < $qty) {
                    return ApiResponse::error('Insufficient stock for one or more items.', 409, 'OUT_OF_STOCK', [
                        'product_id' => $productId,
                        'available' => (int) $product->stock_quantity,
                        'requested' => $qty,
                    ]);
                }
                $subtotal += ((float) $product->unit_price) * $qty;
            }

            $discountAmount = round($subtotal * $discountRate, 2);
            $total = max(0.0, round($subtotal + $shippingFee - $discountAmount, 2));

            $order = ShopOrder::create([
                'client_id' => $clientId,
                'customer_name' => $shipping['name'],
                'customer_phone' => $shipping['phone'],
                'shipping_address' => $shipping['address'],
                'note' => $shipping['note'] ?? null,
                'status' => 'pending',
                'payment_method' => $paymentMethod,
                'currency' => 'USD',
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'discount_amount' => $discountAmount,
                'total_amount' => $total,
                'promo_code' => $promoCode ?: null,
            ]);

            // Create order items + decrement stock.
            foreach ($qtyByProduct as $productId => $qty) {
                $product = $products->get($productId);
                $unitPrice = (float) $product->unit_price;
                $lineTotal = round($unitPrice * $qty, 2);

                ShopOrderItem::create([
                    'shop_order_id' => $order->getKey(),
                    'product_id' => $productId,
                    'unit_price' => $unitPrice,
                    'quantity' => $qty,
                    'line_total' => $lineTotal,
                ]);

                $product->stock_quantity = (int) $product->stock_quantity - $qty;
                $product->save();
            }

            $order->load(['items.product:product_id,product_name,image_url,unit_price']);

            return ApiResponse::success($order, 'Checkout successful.', 201);
        });

        return $result;
    }
}

