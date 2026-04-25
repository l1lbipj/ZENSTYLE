<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (! Schema::hasColumn('purchase_orders', 'reference_code')) {
                $table->string('reference_code', 40)->nullable()->unique()->after('order_id');
            }
            if (! Schema::hasColumn('purchase_orders', 'workflow_status')) {
                $table->enum('workflow_status', ['draft', 'sent', 'received', 'cancelled'])->default('draft')->after('status');
            }
            if (! Schema::hasColumn('purchase_orders', 'received_at')) {
                $table->timestamp('received_at')->nullable()->after('workflow_status');
            }
            if (! Schema::hasColumn('purchase_orders', 'notes')) {
                $table->string('notes', 255)->nullable()->after('received_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            foreach (['notes', 'received_at', 'workflow_status', 'reference_code'] as $column) {
                if (Schema::hasColumn('purchase_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
