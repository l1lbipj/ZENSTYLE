<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZenstyleCustomerOrderSeeder extends Seeder
{
    public function run(): void
    {
        if (! DB::getSchemaBuilder()->hasTable('customer_orders') || ! DB::getSchemaBuilder()->hasTable('customer_order_items')) {
            return;
        }

        $now = now();
        $clientIds = DB::table('clients')->orderBy('client_id')->pluck('client_id')->all();
        $productRows = DB::table('products')
            ->orderBy('product_id')
            ->get(['product_id', 'product_name', 'unit_price', 'stock_quantity'])
            ->values();

        if ($clientIds === [] || $productRows->isEmpty()) {
            return;
        }

        $plans = [];
        $statusCycle = ['pending', 'confirmed', 'completed', 'pending', 'completed', 'cancelled'];

        for ($i = 0; $i < 20; $i++) {
            $status = $statusCycle[$i % count($statusCycle)];
            $paymentStatus = $status === 'completed' ? 'paid' : ($status === 'cancelled' ? 'failed' : 'pending');
            $items = [];
            $itemCount = 2 + ($i % 2);

            for ($j = 0; $j < $itemCount; $j++) {
                $product = $productRows[($i + $j) % $productRows->count()];
                $quantity = 1 + (($i + $j) % 3);
                $unitPrice = (float) $product->unit_price;
                $items[] = [
                    'product_id' => (int) $product->product_id,
                    'quantity' => $quantity,
                    'line_total' => round($unitPrice * $quantity, 2),
                ];
            }

            $plans[] = [
                'client_id' => $clientIds[$i % count($clientIds)],
                'status' => $status,
                'payment_status' => $paymentStatus,
                'days_ago' => 20 - $i,
                'items' => $items,
                'payment_method' => match ($i % 3) {
                    0 => 'cash',
                    1 => 'card',
                    default => 'bank_transfer',
                },
                'notes' => match ($status) {
                    'cancelled' => 'Customer cancelled before fulfillment.',
                    'completed' => 'Delivered and closed successfully.',
                    'confirmed' => 'Confirmed by customer support and scheduled for packing.',
                    default => 'Awaiting payment confirmation.',
                },
            ];
        }

        foreach ($plans as $index => $plan) {
            $orderDate = $now->copy()->subDays((int) $plan['days_ago'])->setTime(10 + ($index % 8), 30);
            $subtotal = 0.0;

            foreach ($plan['items'] as $item) {
                $subtotal += (float) $item['line_total'];
            }

            $discount = $index % 4 === 0 ? round($subtotal * 0.1, 2) : 0.0;
            $finalAmount = max(0, round($subtotal - $discount, 2));
            $orderId = DB::table('customer_orders')->insertGetId([
                'client_id' => $plan['client_id'],
                'promotion_id' => null,
                'order_number' => 'CO-'.$orderDate->format('Ymd').'-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'final_amount' => $finalAmount,
                'payment_method' => $plan['payment_method'],
                'payment_status' => $plan['payment_status'],
                'order_status' => $plan['status'],
                'notes' => $plan['notes'],
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ], 'customer_order_id');

            foreach ($plan['items'] as $item) {
                DB::table('customer_order_items')->insert([
                    'customer_order_id' => $orderId,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'line_total' => $item['line_total'],
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);

                if ($plan['status'] === 'completed') {
                    DB::table('products')
                        ->where('product_id', $item['product_id'])
                        ->decrement('stock_quantity', $item['quantity']);
                }
            }
        }
    }
}
