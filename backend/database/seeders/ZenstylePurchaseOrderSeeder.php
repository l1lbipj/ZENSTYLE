<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ZenstylePurchaseOrderSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('purchase_orders') || ! Schema::hasTable('order_details')) {
            return;
        }

        $now = now();
        $supplierIds = DB::table('suppliers')->orderBy('supplier_id')->pluck('supplier_id')->all();
        $productRows = DB::table('products')
            ->orderBy('product_id')
            ->get(['product_id', 'product_name', 'stock_quantity', 'reorder_level', 'unit_price'])
            ->values();

        if ($supplierIds === [] || $productRows->isEmpty()) {
            return;
        }

        $purchasePlans = [];
        $workflowStates = ['received', 'sent', 'draft', 'received', 'received', 'cancelled'];
        $notes = [
            'Monthly restock for high-turnover hair care products.',
            'Skin care replenishment before weekend client bookings.',
            'Pending shipment for color and treatment items.',
            'Draft restock for nail and makeup essentials.',
            'Tools and equipment top-up for service room maintenance.',
            'Cancelled after vendor delayed the delivery window.',
            'Emergency purchase for low-stock bestseller items.',
            'Routine replenishment for summer season products.',
            'Backorder for premium treatment kits and accessories.',
            'Scheduled restock for salon-facing retail shelf.',
            'Incoming shipment for fast-moving hair products.',
            'Inventory safety top-up for core skincare lines.',
            'Delivery pending on tools and brushes.',
            'Draft order for new premium product launch.',
            'Received order for bridal and event prep stock.',
            'Supplier confirmed shipment for daily essentials.',
            'Short lead-time restock for best sellers.',
            'Quality control hold on imported accessories.',
            'General replenishment for mixed retail products.',
            'Final quarter stocking for peak salon traffic.',
        ];

        for ($i = 0; $i < 20; $i++) {
            $workflow = $workflowStates[$i % count($workflowStates)];
            $status = $workflow === 'cancelled' ? 'inactive' : 'active';
            $items = [];
            $itemCount = $workflow === 'received' ? 3 : 2;

            for ($j = 0; $j < $itemCount; $j++) {
                $productIndex = ($i * 2 + $j) % $productRows->count();
                $quantity = 6 + (($i + $j) % 8);
                $multiplier = match (($i + $j) % 5) {
                    0 => 0.52,
                    1 => 0.55,
                    2 => 0.58,
                    3 => 0.61,
                    default => 0.64,
                };

                $items[] = [
                    'product' => $productIndex,
                    'quantity' => $quantity,
                    'import_multiplier' => $multiplier,
                ];
            }

            $purchasePlans[] = [
                'supplier' => $i % count($supplierIds),
                'day' => -30 + ($i * 2),
                'status' => $status,
                'workflow' => $workflow,
                'notes' => $notes[$i % count($notes)],
                'items' => $items,
            ];
        }

        foreach ($purchasePlans as $index => $plan) {
            $supplierId = $supplierIds[$plan['supplier'] % count($supplierIds)];
            $orderDate = $now->copy()->addDays($plan['day'])->startOfDay();

            $lineItems = [];
            $totalAmount = 0.0;

            foreach ($plan['items'] as $item) {
                $product = $productRows[$item['product'] % $productRows->count()];
                $quantity = (int) $item['quantity'];
                $importPrice = round(((float) $product->unit_price) * (float) $item['import_multiplier'], 2);
                $lineTotal = round($importPrice * $quantity, 2);
                $totalAmount += $lineTotal;

                $lineItems[] = [
                    'product_id' => (int) $product->product_id,
                    'quantity' => $quantity,
                    'import_price' => $importPrice,
                    'received_quantity' => $plan['workflow'] === 'received' ? $quantity : 0,
                ];
            }

            $orderId = DB::table('purchase_orders')->insertGetId([
                'supplier_id' => $supplierId,
                'reference_code' => sprintf('PO-%s-%03d', $orderDate->format('Ymd'), 700 + $index),
                'order_date' => $orderDate->toDateString(),
                'total_amount' => $totalAmount,
                'status' => $plan['status'] === 'cancelled' ? 'inactive' : 'active',
                'workflow_status' => $plan['workflow'],
                'received_at' => $plan['workflow'] === 'received' ? $orderDate->copy()->addDays(3) : null,
                'notes' => $plan['notes'],
                'created_at' => $orderDate->copy()->subHours(2),
                'updated_at' => $plan['workflow'] === 'received' ? $orderDate->copy()->addDays(3) : $orderDate->copy()->addHours(4),
            ], 'order_id');

            foreach ($lineItems as $lineItem) {
                DB::table('order_details')->insert([
                    'order_id' => $orderId,
                    'product_id' => $lineItem['product_id'],
                    'import_price' => $lineItem['import_price'],
                    'quantity' => $lineItem['quantity'],
                    'received_quantity' => $lineItem['received_quantity'],
                    'created_at' => $orderDate->copy()->subHour(),
                    'updated_at' => $orderDate->copy()->addHour(),
                ]);

                if ($plan['workflow'] === 'received') {
                    DB::table('products')
                        ->where('product_id', $lineItem['product_id'])
                        ->increment('stock_quantity', $lineItem['received_quantity']);

                    DB::table('inventory_logs')->insert([
                        'product_id' => $lineItem['product_id'],
                        'change_amount' => $lineItem['received_quantity'],
                        'reason' => 'Received purchase order #'.$orderId,
                        'created_at' => $orderDate->copy()->addDays(3),
                        'updated_at' => $orderDate->copy()->addDays(3),
                    ]);
                }
            }
        }
    }
}
