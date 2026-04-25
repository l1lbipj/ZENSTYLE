<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function dropUniqueIndexIfExists(string $table, array $columns): void
    {
        $indexes = DB::table('information_schema.STATISTICS')
            ->select('INDEX_NAME')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', $table)
            ->where('NON_UNIQUE', 0)
            ->groupBy('INDEX_NAME')
            ->get()
            ->pluck('INDEX_NAME')
            ->all();

        foreach ($indexes as $indexName) {
            $indexColumns = DB::table('information_schema.STATISTICS')
                ->select('COLUMN_NAME')
                ->where('TABLE_SCHEMA', DB::getDatabaseName())
                ->where('TABLE_NAME', $table)
                ->where('INDEX_NAME', $indexName)
                ->orderBy('SEQ_IN_INDEX')
                ->pluck('COLUMN_NAME')
                ->all();

            if ($indexColumns === $columns) {
                try {
                    DB::statement("ALTER TABLE {$table} DROP INDEX `{$indexName}`");
                } catch (\Throwable) {
                    // Ignore if the index was already removed in a previous attempt.
                }

                return;
            }
        }
    }

    private function dropForeignKeyIfExists(string $table, string $column): void
    {
        $constraints = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->select('CONSTRAINT_NAME')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', $table)
            ->where('COLUMN_NAME', $column)
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->pluck('CONSTRAINT_NAME')
            ->all();

        foreach ($constraints as $constraint) {
            try {
                DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY `{$constraint}`");
            } catch (\Throwable) {
                // Ignore if the constraint was already removed.
            }
        }
    }

    public function up(): void
    {
        if (! Schema::hasTable('client_product_preferences')) {
            return;
        }

        Schema::table('client_product_preferences', function (Blueprint $table): void {
            if (Schema::hasColumn('client_product_preferences', 'allergy_id')) {
                // Keep a dedicated index on client_id so MySQL doesn't block
                // dropping the old composite unique index later.
                try {
                    $table->index('client_id', 'client_product_preferences_client_id_idx');
                } catch (\Throwable) {
                    // Ignore if the index already exists.
                }
            }
        });

        $this->dropForeignKeyIfExists('client_product_preferences', 'allergy_id');

        Schema::table('client_product_preferences', function (Blueprint $table): void {
            if (Schema::hasColumn('client_product_preferences', 'allergy_id')) {
                $this->dropUniqueIndexIfExists('client_product_preferences', ['client_id', 'allergy_id']);
                $table->dropColumn('allergy_id');
            }

            if (! Schema::hasColumn('client_product_preferences', 'product_id')) {
                $table->foreignId('product_id')
                    ->nullable()
                    ->after('client_id')
                    ->constrained('products', 'product_id')
                    ->cascadeOnDelete();
            }
        });

        Schema::table('client_product_preferences', function (Blueprint $table): void {
            if (! Schema::hasColumn('client_product_preferences', 'product_id')) {
                return;
            }

            $this->dropUniqueIndexIfExists('client_product_preferences', ['client_id', 'product_id']);

            $table->unique(['client_id', 'product_id']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('client_product_preferences')) {
            return;
        }

        $this->dropForeignKeyIfExists('client_product_preferences', 'product_id');

        Schema::table('client_product_preferences', function (Blueprint $table): void {
            if (Schema::hasColumn('client_product_preferences', 'product_id')) {
                $this->dropUniqueIndexIfExists('client_product_preferences', ['client_id', 'product_id']);
                $table->dropColumn('product_id');
            }

            if (! Schema::hasColumn('client_product_preferences', 'allergy_id')) {
                $table->foreignId('allergy_id')
                    ->nullable()
                    ->after('client_id')
                    ->constrained('allergies', 'allergy_id')
                    ->cascadeOnDelete();
            }
        });

        Schema::table('client_product_preferences', function (Blueprint $table): void {
            if (! Schema::hasColumn('client_product_preferences', 'allergy_id')) {
                return;
            }

            $this->dropUniqueIndexIfExists('client_product_preferences', ['client_id', 'allergy_id']);

            $table->unique(['client_id', 'allergy_id']);
        });
    }
};
