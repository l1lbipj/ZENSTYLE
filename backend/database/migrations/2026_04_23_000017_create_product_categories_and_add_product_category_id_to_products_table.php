<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private function normalizeLegacyName(?string $value): string
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

        $key = Str::lower($value);
        if (isset($legacyMap[$key])) {
            return $legacyMap[$key];
        }

        return Str::of($value)
            ->replace(['_', '-'], ' ')
            ->squish()
            ->title()
            ->toString();
    }

    public function up(): void
    {
        if (! Schema::hasTable('product_categories')) {
            Schema::create('product_categories', function (Blueprint $table): void {
                $table->id('product_category_id');
                $table->string('product_category_name', 100)->unique();
                $table->timestamps();
            });
        }

        if (! Schema::hasColumn('products', 'product_category_id')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->unsignedBigInteger('product_category_id')->nullable()->after('category');
            });
        }

        DB::transaction(function (): void {
            $legacyValues = DB::table('products')
                ->whereNotNull('category')
                ->distinct()
                ->pluck('category')
                ->filter()
                ->values()
                ->all();

            $normalizedNames = [];
            foreach ($legacyValues as $legacyValue) {
                $normalized = $this->normalizeLegacyName((string) $legacyValue);
                $normalizedNames[Str::lower($normalized)] = $normalized;
            }

            if (count($normalizedNames) === 0) {
                $normalizedNames['uncategorized'] = 'Uncategorized';
            }

            foreach ($normalizedNames as $name) {
                DB::table('product_categories')->updateOrInsert(
                    ['product_category_name' => $name],
                    ['product_category_name' => $name, 'created_at' => now(), 'updated_at' => now()]
                );
            }

            $categoryLookup = DB::table('product_categories')
                ->select('product_category_id', 'product_category_name')
                ->get()
                ->mapWithKeys(fn ($row) => [Str::lower(trim($row->product_category_name)) => (int) $row->product_category_id])
                ->all();

            DB::table('products')
                ->orderBy('product_id')
                ->chunkById(200, function ($products) use ($categoryLookup): void {
                    foreach ($products as $product) {
                        $label = $this->normalizeLegacyName($product->category);
                        $key = Str::lower(trim($label));
                        $categoryId = $categoryLookup[$key] ?? null;

                        if ($categoryId === null) {
                            DB::table('product_categories')->updateOrInsert(
                                ['product_category_name' => $label],
                                ['product_category_name' => $label, 'created_at' => now(), 'updated_at' => now()]
                            );

                            $categoryId = (int) DB::table('product_categories')
                                ->whereRaw('LOWER(product_category_name) = ?', [$key])
                                ->value('product_category_id');
                        }

                        DB::table('products')
                            ->where('product_id', $product->product_id)
                            ->update([
                                'product_category_id' => $categoryId,
                                'category' => $label,
                            ]);
                    }
                }, 'product_id', 'product_id');
        });

        if (Schema::hasColumn('products', 'product_category_id')) {
            DB::statement('ALTER TABLE products MODIFY product_category_id BIGINT UNSIGNED NOT NULL');
            DB::statement('CREATE INDEX products_product_category_id_index ON products (product_category_id)');
            DB::statement('ALTER TABLE products ADD CONSTRAINT products_product_category_id_foreign FOREIGN KEY (product_category_id) REFERENCES product_categories(product_category_id) ON UPDATE CASCADE ON DELETE RESTRICT');
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'product_category_id')) {
            try {
                DB::statement('ALTER TABLE products DROP FOREIGN KEY products_product_category_id_foreign');
            } catch (\Throwable $e) {
                // Ignore if the constraint does not exist.
            }

            try {
                DB::statement('DROP INDEX products_product_category_id_index ON products');
            } catch (\Throwable $e) {
                // Ignore if the index does not exist.
            }

            Schema::table('products', function (Blueprint $table): void {
                $table->dropColumn('product_category_id');
            });
        }

        if (Schema::hasTable('product_categories')) {
            Schema::dropIfExists('product_categories');
        }
    }
};
