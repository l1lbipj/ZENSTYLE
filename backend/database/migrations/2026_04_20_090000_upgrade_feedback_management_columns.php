<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            if (! Schema::hasColumn('feedback', 'customer_id')) {
                $table->foreignId('customer_id')
                    ->nullable()
                    ->after('appointment_id')
                    ->constrained('clients', 'client_id')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('feedback', 'staff_id')) {
                $table->foreignId('staff_id')
                    ->nullable()
                    ->after('customer_id')
                    ->constrained('staff', 'staff_id')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('feedback', 'comment')) {
                $table->text('comment')->nullable()->after('rating');
            }

            if (! Schema::hasColumn('feedback', 'reply')) {
                $table->text('reply')->nullable()->after('manager_reply');
            }

            if (! Schema::hasColumn('feedback', 'replied_at')) {
                $table->timestamp('replied_at')->nullable()->after('reply');
            }
        });

        $feedbackRows = DB::table('feedback')
            ->select('feedback_id', 'appointment_id', 'comment', 'notes', 'reply', 'manager_reply', 'customer_id', 'staff_id')
            ->get();

        foreach ($feedbackRows as $row) {
            $updates = [];

            if (Schema::hasColumn('feedback', 'comment') && empty($row->comment) && ! empty($row->notes)) {
                $updates['comment'] = $row->notes;
            }

            if (Schema::hasColumn('feedback', 'reply') && empty($row->reply) && ! empty($row->manager_reply)) {
                $updates['reply'] = $row->manager_reply;
            }

            if (Schema::hasColumn('feedback', 'customer_id') && empty($row->customer_id)) {
                $appointment = DB::table('appointments')
                    ->select('client_id')
                    ->where('appointment_id', $row->appointment_id)
                    ->first();

                if ($appointment?->client_id) {
                    $updates['customer_id'] = (int) $appointment->client_id;
                }
            }

            if (Schema::hasColumn('feedback', 'staff_id') && empty($row->staff_id)) {
                $staff = DB::table('appointment_details')
                    ->select('staff_id')
                    ->where('appointment_id', $row->appointment_id)
                    ->whereNotNull('staff_id')
                    ->where(function ($query) {
                        $query->where('item_type', 'service')
                            ->orWhereNotNull('service_id');
                    })
                    ->orderBy('detail_id')
                    ->first();

                if ($staff?->staff_id) {
                    $updates['staff_id'] = (int) $staff->staff_id;
                }
            }

            if ($updates !== []) {
                DB::table('feedback')
                    ->where('feedback_id', $row->feedback_id)
                    ->update($updates);
            }
        }
    }

    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            if (Schema::hasColumn('feedback', 'staff_id')) {
                $table->dropConstrainedForeignId('staff_id');
            }

            if (Schema::hasColumn('feedback', 'customer_id')) {
                $table->dropConstrainedForeignId('customer_id');
            }

            if (Schema::hasColumn('feedback', 'reply')) {
                $table->dropColumn('reply');
            }

            if (Schema::hasColumn('feedback', 'comment')) {
                $table->dropColumn('comment');
            }
        });
    }
};
