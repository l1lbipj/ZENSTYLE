<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductManagementService
{
    public function __construct(private readonly ProductCategoryService $productCategoryService)
    {
    }

    public function present(Product $product): array
    {
        $product->loadMissing('productCategory');
        $data = $product->toArray();
        $categoryLabel = $product->productCategory?->product_category_name
            ?? $this->productCategoryService->labelFor($product->product_category_id)
            ?? ucwords(str_replace(['-', '_'], ' ', (string) ($product->category ?? '')));
        $data['category_label'] = $categoryLabel;
        $data['product_category_id'] = $product->product_category_id;
        $data['status'] = ((int) $product->stock_quantity > 0) ? 'active' : 'inactive';

        return $data;
    }

    public function referenceCount(Product $product): int
    {
        $favoriteCount = 0;
        if (Schema::hasTable('client_product_preferences') && Schema::hasColumn('client_product_preferences', 'product_id')) {
            $favoriteCount = DB::table('client_product_preferences')->where('product_id', $product->getKey())->count();
        } elseif (Schema::hasTable('client_favorite_products')) {
            $favoriteCount = DB::table('client_favorite_products')->where('product_id', $product->getKey())->count();
        }

        $counts = [
            Schema::hasTable('order_details') ? DB::table('order_details')->where('product_id', $product->getKey())->count() : 0,
            Schema::hasTable('inventory_logs') ? DB::table('inventory_logs')->where('product_id', $product->getKey())->count() : 0,
            $favoriteCount,
        ];

        return (int) array_sum($counts);
    }

    public function canDelete(Product $product): bool
    {
        return $this->referenceCount($product) === 0;
    }
}
