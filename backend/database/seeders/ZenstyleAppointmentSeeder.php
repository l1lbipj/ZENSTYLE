<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ZenstyleAppointmentSeeder extends Seeder
{
    private function hasColumn(string $table, string $column): bool
    {
        return Schema::hasColumn($table, $column);
    }

    private function putIfColumnExists(array &$row, string $column, mixed $value, string $table = 'appointments'): void
    {
        if ($this->hasColumn($table, $column)) {
            $row[$column] = $value;
        }
    }

    private function itemKind(string $label): string
    {
        return preg_match('/(skin|face|facial|nail|spa|makeup|body|scalp|massage|care)/i', $label) ? 'skin' : 'hair';
    }

    private function pickBySeed(array $items, int $seed): mixed
    {
        if ($items === []) {
            return null;
        }

        return $items[$seed % count($items)];
    }

    private function buildAppointmentDate(Carbon $day, string $time): Carbon
    {
        return $day->copy()->setTimeFromTimeString($time);
    }

    private function resolvePromotion(string $type, array $promotions, int $seed): ?object
    {
        if ($promotions === []) {
            return null;
        }

        $eligible = array_values(array_filter($promotions, function ($promotion) use ($type) {
            return $promotion->apply_type === 'all'
                || ($type === 'service' && $promotion->apply_type === 'service')
                || ($type === 'product' && $promotion->apply_type === 'order')
                || ($type === 'mixed' && in_array($promotion->apply_type, ['all', 'service', 'order'], true));
        }));

        if ($eligible === []) {
            return null;
        }

        return $eligible[$seed % count($eligible)];
    }

    private function buildDetailRows(
        string $type,
        Carbon $appointmentDate,
        int $staffId,
        array $services,
        array $products,
        int $seed,
    ): array {
        $details = [];
        $cursor = $appointmentDate->copy();
        $subtotal = 0.0;
        $primaryLabel = '';
        $serviceCount = 0;

        $serviceCountTarget = match ($type) {
            'service' => 1 + ($seed % 2),
            'mixed' => 1,
            default => 0,
        };

        if ($serviceCountTarget > 0 && $services !== []) {
            for ($i = 0; $i < $serviceCountTarget; $i++) {
                $service = $services[($seed + $i) % count($services)];
                $duration = max(30, (int) $service->duration);
                $lineStart = $cursor->copy();
                $lineEnd = $cursor->copy()->addMinutes($duration);
                $price = round((float) $service->price, 2);

                $details[] = [
                    'staff_id' => $staffId,
                    'item_id' => (int) $service->service_id,
                    'service_id' => (int) $service->service_id,
                    'price' => $price,
                    'start_time' => $lineStart->format('H:i:s'),
                    'end_time' => $lineEnd->format('H:i:s'),
                    'status' => 'inactive',
                    'started_at' => $lineStart->toDateTimeString(),
                    'completed_at' => $lineEnd->toDateTimeString(),
                ];

                $subtotal += $price;
                $cursor = $lineEnd->copy()->addMinutes(5);
                $primaryLabel = (string) $service->service_name;
                $serviceCount++;
            }
        }

        if ($type === 'product' || $type === 'mixed') {
            $productCount = $type === 'product'
                ? min(3, max(1, 1 + ($seed % 3)))
                : 1 + ($seed % 2);

            for ($i = 0; $i < $productCount && $products !== []; $i++) {
                $product = $products[($seed * 2 + $i) % count($products)];
                $quantity = $type === 'product' ? 1 + (($seed + $i) % 3) : 1;
                $lineTotal = round((float) $product->unit_price * $quantity, 2);
                $lineStart = $cursor->copy();
                $lineEnd = $cursor->copy()->addMinutes($type === 'product' ? 10 : 8);

                $details[] = [
                    'staff_id' => $staffId,
                    'item_id' => (int) $product->product_id,
                    'service_id' => null,
                    'price' => $lineTotal,
                    'start_time' => $lineStart->format('H:i:s'),
                    'end_time' => $lineEnd->format('H:i:s'),
                    'status' => 'inactive',
                    'started_at' => $lineStart->toDateTimeString(),
                    'completed_at' => $lineEnd->toDateTimeString(),
                ];

                $subtotal += $lineTotal;
                $cursor = $lineEnd->copy()->addMinutes(3);
                $primaryLabel = $primaryLabel !== '' ? $primaryLabel : (string) $product->product_name;
            }
        }

        if ($details === [] && $services !== []) {
            $service = $services[$seed % count($services)];
            $price = round((float) $service->price, 2);
            $lineEnd = $cursor->copy()->addMinutes(max(30, (int) $service->duration));

            $details[] = [
                'staff_id' => $staffId,
                'item_id' => (int) $service->service_id,
                'service_id' => (int) $service->service_id,
                'price' => $price,
                'start_time' => $cursor->format('H:i:s'),
                'end_time' => $lineEnd->format('H:i:s'),
                'status' => 'inactive',
                'started_at' => $cursor->toDateTimeString(),
                'completed_at' => $lineEnd->toDateTimeString(),
            ];

            $subtotal += $price;
            $primaryLabel = (string) $service->service_name;
        }

        return [$details, round($subtotal, 2), $primaryLabel, $serviceCount];
    }

    private function buildAppointmentRow(
        int $clientId,
        Carbon $appointmentDate,
        string $status,
        string $attendanceStatus,
        ?string $paymentMethod,
        string $paymentStatus,
        float $totalAmount,
        float $finalAmount,
        ?int $promotionId,
        ?int $staffId,
        Carbon $checkInAt,
        Carbon $checkOutAt,
        Carbon $serviceStartedAt,
        Carbon $serviceCompletedAt,
        bool $reminderSent,
    ): array {
        $row = [
            'client_id' => $clientId,
            'appointment_date' => $appointmentDate->toDateTimeString(),
            'total_amount' => $totalAmount,
            'promotion_id' => $promotionId,
            'final_amount' => $finalAmount,
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'status' => $status,
            'created_at' => $appointmentDate->copy()->subDays(2)->toDateTimeString(),
            'updated_at' => $appointmentDate->copy()->addHours(3)->toDateTimeString(),
        ];

        $this->putIfColumnExists($row, 'attendance_status', $attendanceStatus);
        $this->putIfColumnExists($row, 'check_in_time', $attendanceStatus === 'Completed' ? $checkInAt->toDateTimeString() : null);
        $this->putIfColumnExists($row, 'check_out_time', $attendanceStatus === 'Completed' ? $checkOutAt->toDateTimeString() : null);
        $this->putIfColumnExists($row, 'reminder_sent', $reminderSent);
        $this->putIfColumnExists($row, 'reminder_sent_at', $reminderSent ? $appointmentDate->copy()->subHours(4)->toDateTimeString() : null);
        $this->putIfColumnExists($row, 'checked_in_at', $attendanceStatus === 'Completed' ? $checkInAt->toDateTimeString() : null);
        $this->putIfColumnExists($row, 'checked_in_by', $staffId);
        $this->putIfColumnExists($row, 'assigned_staff_id', $staffId);
        $this->putIfColumnExists($row, 'service_started_at', $attendanceStatus === 'Completed' ? $serviceStartedAt->toDateTimeString() : null);
        $this->putIfColumnExists($row, 'service_completed_at', $attendanceStatus === 'Completed' ? $serviceCompletedAt->toDateTimeString() : null);

        return $row;
    }

    private function insertFeedbackIfSupported(int $appointmentId, int $clientId, int $staffId, Carbon $completedAt, int $seed): void
    {
        if (! Schema::hasTable('feedback')) {
            return;
        }

        $feedback = [
            'appointment_id' => $appointmentId,
            'rating' => 4 + ($seed % 2),
            'notes' => $this->feedbackNotes()[$seed % count($this->feedbackNotes())],
            'created_at' => $completedAt->copy()->addHours(1)->toDateTimeString(),
            'updated_at' => $completedAt->copy()->addHours(1)->toDateTimeString(),
        ];

        if ($this->hasColumn('feedback', 'customer_id')) {
            $feedback['customer_id'] = $clientId;
        }

        if ($this->hasColumn('feedback', 'staff_id')) {
            $feedback['staff_id'] = $staffId;
        }

        if ($this->hasColumn('feedback', 'comment')) {
            $feedback['comment'] = $feedback['notes'];
        }

        if ($this->hasColumn('feedback', 'reply')) {
            $feedback['reply'] = 'Thank you for visiting ZenStyle. We appreciate your feedback.';
        }

        if ($this->hasColumn('feedback', 'manager_reply')) {
            $feedback['manager_reply'] = 'Thank you for visiting ZenStyle. We appreciate your feedback.';
        }

        if ($this->hasColumn('feedback', 'replied_at')) {
            $feedback['replied_at'] = $completedAt->copy()->addHours(3)->toDateTimeString();
        }

        DB::table('feedback')->insert($feedback);
    }

    private function feedbackNotes(): array
    {
        return [
            'Great atmosphere and smooth execution.',
            'The team was kind and the result looked clean.',
            'Comfortable visit with excellent attention to detail.',
            'Fast, professional, and easy to book again.',
            'Loved the finish and the aftercare advice.',
            'Everything felt organized and on time.',
            'Friendly staff and a polished final result.',
            'Very satisfied with the care and service quality.',
            'The appointment felt calm, efficient, and well managed.',
            'I left with exactly the look I wanted.',
            'Communication was clear and the service felt premium.',
            'Nice environment and very thoughtful styling suggestions.',
            'The stylist listened carefully and delivered great work.',
            'Booking, check-in, and checkout were all easy.',
            'I appreciated the detailed finish and gentle service.',
            'Clean space, friendly team, and strong attention to detail.',
            'A pleasant visit from start to finish.',
            'The final result looked polished and natural.',
            'I would happily recommend this team to friends.',
            'Excellent service, good timing, and a quality result.',
        ];
    }

    public function run(): void
    {
        $clientIds = DB::table('clients')->orderBy('client_id')->pluck('client_id')->all();
        $staffIds = DB::table('staff')->where('status', 'active')->orderBy('staff_id')->pluck('staff_id')->all();
        $services = DB::table('services')
            ->orderBy('service_id')
            ->get(['service_id', 'service_name', 'price', 'duration'])
            ->values()
            ->all();
        $products = DB::table('products')
            ->orderBy('product_id')
            ->get(['product_id', 'product_name', 'unit_price'])
            ->values()
            ->all();
        $promotions = DB::table('promotions')
            ->orderBy('promotion_id')
            ->get(['promotion_id', 'apply_type', 'percent'])
            ->values()
            ->all();

        if ($clientIds === [] || $staffIds === [] || $services === []) {
            return;
        }

        $timeSlots = [
            '07:15:00',
            '08:30:00',
            '09:45:00',
            '11:00:00',
            '12:30:00',
            '14:00:00',
            '15:15:00',
            '16:30:00',
            '17:45:00',
            '19:00:00',
            '20:15:00',
        ];

        $dailyCounts = [3, 4, 5, 6, 7, 8, 5, 4, 6, 7, 3, 8, 4, 5, 6, 7, 4, 3, 6, 8, 5, 4, 7, 6, 3, 5, 8, 4, 6, 7];
        $statusPattern = [
            'completed',
            'completed',
            'pending',
            'completed',
            'cancelled',
            'completed',
            'pending',
            'completed',
            'completed',
            'pending',
        ];
        $typePattern = [
            'service',
            'mixed',
            'product',
            'service',
            'service',
            'mixed',
            'product',
            'service',
            'mixed',
            'service',
        ];
        $paymentMethodPattern = ['cash', 'card', 'cash', 'card', 'cash', 'card'];

        $days = CarbonPeriod::create(now()->subDays(29)->startOfDay(), '1 day', now()->startOfDay());
        foreach ($days as $dayIndex => $day) {
            $count = $dailyCounts[$dayIndex % count($dailyCounts)];
            $dayTotal = 0.0;

            for ($i = 0; $i < $count; $i++) {
                $type = $typePattern[($dayIndex + $i) % count($typePattern)];
                $statusSeed = $statusPattern[($dayIndex + $i) % count($statusPattern)];
                $status = $i === 0 ? 'completed' : $statusSeed;
                $attendanceStatus = match ($status) {
                    'completed' => 'Completed',
                    'cancelled' => 'Cancelled',
                    default => 'Pending',
                };

                $staffId = (int) $staffIds[($dayIndex + $i) % count($staffIds)];
                $clientId = (int) $clientIds[($dayIndex * 3 + $i * 5) % count($clientIds)];
                $appointmentDate = $this->buildAppointmentDate($day, $timeSlots[($dayIndex + ($i * 2)) % count($timeSlots)]);

                [$details, $subtotal, $primaryLabel] = $this->buildDetailRows(
                    $type,
                    $appointmentDate,
                    $staffId,
                    $services,
                    $products,
                    $dayIndex * 13 + $i * 7,
                );

                if ($details === []) {
                    continue;
                }

                $promotion = $status === 'completed'
                    ? $this->resolvePromotion($type, $promotions, $dayIndex + $i)
                    : null;

                $discount = $promotion ? round($subtotal * ((int) $promotion->percent / 100), 2) : 0.0;
                if ($discount <= 0 && $promotion) {
                    $discount = round($subtotal * 0.1, 2);
                }

                $finalAmount = max(1, round($subtotal - $discount, 2));
                $paymentStatus = $status === 'completed' ? 'pay' : 'unpay';
                $paymentMethod = $status === 'completed' ? $paymentMethodPattern[($dayIndex + $i) % count($paymentMethodPattern)] : null;
                $checkInAt = $appointmentDate->copy()->subMinutes(10);
                $serviceStartedAt = $appointmentDate->copy();
                $serviceCompletedAt = $appointmentDate->copy()->addMinutes(max(35, count($details) * 20));
                $checkOutAt = $serviceCompletedAt->copy();
                $reminderSent = $i < 2 || $day->isToday() || $day->isPast();

                $appointmentId = DB::table('appointments')->insertGetId(
                    $this->buildAppointmentRow(
                        $clientId,
                        $appointmentDate,
                        $status === 'cancelled' ? 'inactive' : ($status === 'completed' ? 'inactive' : 'active'),
                        $attendanceStatus,
                        $paymentMethod,
                        $paymentStatus,
                        $subtotal,
                        $finalAmount,
                        $promotion?->promotion_id,
                        $staffId,
                        $checkInAt,
                        $checkOutAt,
                        $serviceStartedAt,
                        $serviceCompletedAt,
                        $reminderSent,
                    ),
                    'appointment_id'
                );

                foreach ($details as $detailIndex => $detail) {
                    $detail['appointment_id'] = $appointmentId;
                    $detail['status'] = $status === 'completed' ? 'inactive' : ($status === 'cancelled' ? 'inactive' : 'active');
                    $detail['created_at'] = $appointmentDate->copy()->subHour()->toDateTimeString();
                    $detail['updated_at'] = $serviceCompletedAt->copy()->toDateTimeString();
                    DB::table('appointment_details')->insert($detail);
                }

                if ($attendanceStatus === 'Completed') {
                    $dayTotal += $finalAmount;
                    if ($dayIndex % 2 === 0 || $i === 0) {
                        $this->insertFeedbackIfSupported($appointmentId, $clientId, $staffId, $serviceCompletedAt, $dayIndex + $i);
                    }
                }
            }

            if ($dayTotal <= 0) {
                $fallbackTime = $this->buildAppointmentDate($day, '09:00:00');
                $staffId = (int) $staffIds[$dayIndex % count($staffIds)];
                $clientId = (int) $clientIds[$dayIndex % count($clientIds)];
                [$details, $subtotal] = $this->buildDetailRows('service', $fallbackTime, $staffId, $services, $products, $dayIndex + 99);
                if ($details !== []) {
                    $appointmentId = DB::table('appointments')->insertGetId([
                        'client_id' => $clientId,
                        'appointment_date' => $fallbackTime->toDateTimeString(),
                        'total_amount' => $subtotal,
                        'promotion_id' => null,
                        'final_amount' => $subtotal,
                        'payment_method' => 'cash',
                        'payment_status' => 'pay',
                        'status' => 'inactive',
                        'attendance_status' => 'Completed',
                        'check_in_time' => $fallbackTime->copy()->subMinutes(10)->toDateTimeString(),
                        'check_out_time' => $fallbackTime->copy()->addMinutes(60)->toDateTimeString(),
                        'reminder_sent' => true,
                        'reminder_sent_at' => $fallbackTime->copy()->subHours(4)->toDateTimeString(),
                        'checked_in_at' => $fallbackTime->copy()->subMinutes(10)->toDateTimeString(),
                        'checked_in_by' => $staffId,
                        'assigned_staff_id' => $staffId,
                        'service_started_at' => $fallbackTime->toDateTimeString(),
                        'service_completed_at' => $fallbackTime->copy()->addMinutes(60)->toDateTimeString(),
                        'created_at' => $fallbackTime->copy()->subDays(2)->toDateTimeString(),
                        'updated_at' => $fallbackTime->copy()->addHours(3)->toDateTimeString(),
                    ], 'appointment_id');

                    foreach ($details as $detail) {
                        $detail['appointment_id'] = $appointmentId;
                        $detail['status'] = 'inactive';
                        $detail['created_at'] = $fallbackTime->copy()->subHour()->toDateTimeString();
                        $detail['updated_at'] = $fallbackTime->copy()->addHours(2)->toDateTimeString();
                        DB::table('appointment_details')->insert($detail);
                    }
                }
            }
        }
    }
}
