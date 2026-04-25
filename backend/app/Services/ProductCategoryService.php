<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductCategoryService
{
    public function all()
    {
        return ProductCategory::query()
            ->orderBy('product_category_name')
            ->get(['product_category_id', 'product_category_name']);
    }

    public function options(): array
    {
        return $this->all()
            ->map(fn (ProductCategory $category): array => [
                'id' => $category->product_category_id,
                'name' => $category->product_category_name,
            ])
            ->values()
            ->all();
    }

    public function counts(): array
    {
        return Product::query()
            ->selectRaw('product_category_id, COUNT(*) as product_count')
            ->groupBy('product_category_id')
            ->pluck('product_count', 'product_category_id')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    public function labelFor($categoryId): ?string
    {
        if ($categoryId === null || $categoryId === '') {
            return null;
        }

        return ProductCategory::query()
            ->where('product_category_id', $categoryId)
            ->value('product_category_name');
    }

    public function existsId($categoryId): bool
    {
        if ($categoryId === null || $categoryId === '') {
            return false;
        }

        return ProductCategory::query()->where('product_category_id', $categoryId)->exists();
    }

    public function existsName(string $name, ?int $ignoreId = null): bool
    {
        $target = Str::lower(trim($name));

        return ProductCategory::query()
            ->when($ignoreId, fn ($query) => $query->where('product_category_id', '!=', $ignoreId))
            ->get(['product_category_name'])
            ->contains(function (ProductCategory $category) use ($target): bool {
                return Str::lower(trim($category->product_category_name)) === $target;
            });
    }

    public function create(string $name): ProductCategory
    {
        return ProductCategory::create([
            'product_category_name' => $this->normalizeName($name),
        ]);
    }

    public function rename(int $id, string $name): ProductCategory
    {
        $category = ProductCategory::findOrFail($id);
        $category->update([
            'product_category_name' => $this->normalizeName($name),
        ]);

        Product::query()
            ->where('product_category_id', $category->product_category_id)
            ->update(['category' => $category->product_category_name]);

        return $category->fresh();
    }

    public function delete(int $id): void
    {
        ProductCategory::where('product_category_id', $id)->delete();
    }

    public function defaultId(): ?int
    {
        return ProductCategory::query()->orderBy('product_category_name')->value('product_category_id');
    }

    public function normalizeName(string $name): string
    {
        return trim(preg_replace('/\s+/', ' ', $name) ?? $name);
    }

    public function normalizeLegacyName(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return 'Uncategorized';
        }

        $legacyMap = [
            'hair' => 'Hair Care',
            'skin' => 'Skin Care',
            'hair-coloring' => 'Hair Coloring',
            'tools-equipment' => 'Tools & Equipment',
        ];

        $normalized = Str::lower($value);
        if (isset($legacyMap[$normalized])) {
            return $legacyMap[$normalized];
        }

        return Str::of($value)
            ->replace(['_', '-'], ' ')
            ->squish()
            ->title()
            ->toString();
    }

    public function ensureFallback(): ProductCategory
    {
        return ProductCategory::firstOrCreate(
            ['product_category_name' => 'Uncategorized'],
            ['product_category_name' => 'Uncategorized'],
        );
    }

    public function resolveIdFromName(?string $name): ?int
    {
        if ($name === null) {
            return null;
        }

        return ProductCategory::query()
            ->whereRaw('LOWER(product_category_name) = ?', [Str::lower(trim($name))])
            ->value('product_category_id');
    }

    public function present(ProductCategory $category): array
    {
        return [
            'id' => $category->product_category_id,
            'name' => $category->product_category_name,
        ];
    }

    public function syncFromLegacyProducts(): void
    {
        $legacyValues = Product::query()
            ->whereNull('product_category_id')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values()
            ->all();

        if (count($legacyValues) === 0) {
            return;
        }

        $fallback = $this->ensureFallback();

        foreach ($legacyValues as $legacyValue) {
            $normalized = $this->normalizeLegacyName((string) $legacyValue);
            if ($this->resolveIdFromName($normalized)) {
                continue;
            }

            ProductCategory::create([
                'product_category_name' => $normalized,
            ]);
        }

        Product::query()
            ->whereNull('product_category_id')
            ->orderBy('product_id')
            ->chunkById(200, function ($products) use ($fallback): void {
                foreach ($products as $product) {
                    $label = $this->normalizeLegacyName($product->category);
                    $categoryId = $this->resolveIdFromName($label) ?? $fallback->product_category_id;

                    $product->forceFill([
                        'product_category_id' => $categoryId,
                        'category' => $this->labelFor($categoryId) ?? $label,
                    ])->save();
                }
            }, 'product_id', 'product_id');
    }
}
