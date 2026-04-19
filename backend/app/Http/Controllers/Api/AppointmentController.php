<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\AppointmentDetail;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\Service;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function canAccessAppointment(Request $request, Appointment $appointment): bool
    {
        $abilities = $this->abilities($request);

        if (in_array('admin', $abilities, true)) {
            return true;
        }

        if (in_array('client', $abilities, true)) {
            return (int) $appointment->client_id === (int) $request->user()->getKey();
        }

        if (in_array('staff', $abilities, true)) {
            return AppointmentDetail::where('appointment_id', $appointment->appointment_id)
                ->where('staff_id', $request->user()->getKey())
                ->where('item_type', 'service')
                ->exists();
        }

        return false;
    }

    public function index(Request $request)
    {
        $detailItemRelations = Schema::hasColumn('appointment_details', 'item_id')
            ? ['appointmentDetails.item']
            : ['appointmentDetails.service', 'appointmentDetails.product'];

        $query = Appointment::query()
            ->with(array_merge([
                'client:client_id,client_name,email,phone',
                'appointmentDetails.staff:staff_id,staff_name',
                'feedback:feedback_id,appointment_id,rating,notes,manager_reply,replied_at',
            ], $detailItemRelations))
            ->orderByDesc('appointment_date');

        $abilities = $this->abilities($request);
        if (in_array('client', $abilities, true)) {
            $query->where('client_id', $request->user()->getKey());
        } elseif (in_array('staff', $abilities, true)) {
            $staffId = $request->user()->getKey();
            $query->whereHas('appointmentDetails', function ($q) use ($staffId) {
                $q->where('staff_id', $staffId);
                $q->where('item_type', 'service');
            });
        } elseif (! in_array('admin', $abilities, true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $status = $request->query('status');
        if ($status !== null) {
            $query->where('status', $status);
        }

        $appointments = $query->paginate((int) $request->query('per_page', 10));

        return ApiResponse::success($appointments, 'Appointments retrieved.');
    }

    public function store(Request $request)
    {
        $abilities = $this->abilities($request);
        if (! array_intersect(['admin', 'staff', 'client'], $abilities)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'client_id' => ['nullable', 'integer', Rule::exists('clients', 'client_id')],
            // Required only when there is at least one "service" item.
            'appointment_date' => ['nullable', 'date', 'after_or_equal:today'],
            'promotion_id' => ['nullable', 'integer', Rule::exists('promotions', 'promotion_id')],
            'payment_method' => ['nullable', Rule::in(['cash', 'card'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_type' => ['required', Rule::in(['service', 'product'])],
            'items.*.item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            // Service-only fields (validated again in loop for stricter rules).
            'items.*.staff_id' => ['nullable', 'integer', Rule::exists('staff', 'staff_id')],
            'items.*.start_time' => ['nullable', 'date_format:H:i'],
            'items.*.end_time' => ['nullable', 'date_format:H:i'],
        ]);

        $clientId = $validated['client_id'] ?? $request->user()->getKey();
        if (in_array('client', $abilities, true)) {
            $clientId = $request->user()->getKey();
        }

        $items = $validated['items'];
        $hasServiceItem = false;
        $serviceIds = [];
        $productIds = [];

        foreach ($items as $item) {
            if (($item['item_type'] ?? null) === 'service') {
                $hasServiceItem = true;
                $serviceIds[] = (int) $item['item_id'];
            } else {
                $productIds[] = (int) $item['item_id'];
            }
        }

        if ($hasServiceItem && empty($validated['appointment_date'])) {
            return ApiResponse::error('appointment_date is required for service items.', 422, 'VALIDATION_ERROR');
        }

        $appointmentDate = $hasServiceItem
            ? \Carbon\Carbon::parse($validated['appointment_date'])->startOfDay()
            : now()->startOfDay();

        $usesMixedItemSchema = Schema::hasColumn('appointment_details', 'item_id');

        $appointment = DB::transaction(function () use ($usesMixedItemSchema, $appointmentDate, $clientId, $hasServiceItem, $items, $productIds, $serviceIds, $validated) {
            $services = Service::query()
                ->whereIn('service_id', array_values(array_unique($serviceIds)))
                ->get()
                ->keyBy('service_id');

            $products = Product::query()
                ->whereIn('product_id', array_values(array_unique($productIds)))
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            $detailsToCreate = [];
            $totalAmount = 0.0;
            $intervalsByStaff = [];
            $earliestStart = null;

            foreach ($items as $idx => $item) {
                $itemType = $item['item_type'];
                $itemId = (int) $item['item_id'];
                $qty = (int) $item['quantity'];

                if ($itemType === 'service') {
                    $service = $services->get($itemId);
                    if (! $service) {
                        throw new HttpResponseException(ApiResponse::error("Item #".($idx + 1)." service not found.", 422, 'INVALID_SERVICE'));
                    }

                    $staffId = (int) ($item['staff_id'] ?? 0);
                    $startTime = (string) ($item['start_time'] ?? '');
                    $endTime = (string) ($item['end_time'] ?? '');
                    if ($staffId <= 0 || $startTime === '' || $endTime === '') {
                        throw new HttpResponseException(ApiResponse::error("Item #".($idx + 1)." must include staff_id, start_time, end_time for service.", 422, 'VALIDATION_ERROR'));
                    }
                    if ($startTime >= $endTime) {
                        throw new HttpResponseException(ApiResponse::error("Item #".($idx + 1)." has invalid time range.", 422, 'INVALID_TIME_RANGE'));
                    }

                    $intervalsByStaff[$staffId][] = [$startTime, $endTime, $idx + 1];
                    $earliestStart = $earliestStart === null ? $startTime : min($earliestStart, $startTime);

                    $lineTotal = (float) $service->price * $qty;
                    $totalAmount += $lineTotal;

                    if ($usesMixedItemSchema) {
                        $detailsToCreate[] = [
                            'staff_id' => $staffId,
                            'item_type' => 'service',
                            'item_id' => $itemId,
                            'quantity' => $qty,
                            'price' => $lineTotal,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'status' => 'active',
                        ];
                    } else {
                        // Old schema fallback: service_id + legacy item_type skin/hair (we don't have category here → default 'hair').
                        $detailsToCreate[] = [
                            'staff_id' => $staffId,
                            'item_type' => 'hair',
                            'service_id' => $itemId,
                            'product_id' => null,
                            'quantity' => $qty,
                            'total_price' => $lineTotal,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'status' => 'active',
                        ];
                    }
                } else {
                    $product = $products->get($itemId);
                    if (! $product) {
                        throw new HttpResponseException(ApiResponse::error("Item #".($idx + 1)." product not found.", 422, 'INVALID_PRODUCT'));
                    }
                    if ((int) $product->stock_quantity < $qty) {
                        throw new HttpResponseException(ApiResponse::error("Item #".($idx + 1)." is out of stock.", 422, 'OUT_OF_STOCK'));
                    }

                    $lineTotal = (float) $product->unit_price * $qty;
                    $totalAmount += $lineTotal;

                    if ($usesMixedItemSchema) {
                        $detailsToCreate[] = [
                            'staff_id' => null,
                            'item_type' => 'product',
                            'item_id' => $itemId,
                            'quantity' => $qty,
                            'price' => $lineTotal,
                            'start_time' => null,
                            'end_time' => null,
                            'status' => 'active',
                        ];
                    } else {
                        // Old schema fallback
                        $detailsToCreate[] = [
                            'staff_id' => null,
                            'item_type' => 'hair',
                            'service_id' => null,
                            'product_id' => $itemId,
                            'quantity' => $qty,
                            'total_price' => $lineTotal,
                            'start_time' => '00:00',
                            'end_time' => '00:01',
                            'status' => 'active',
                        ];
                    }
                }
            }

            // Prevent overlaps within the same request (service-only).
            foreach ($intervalsByStaff as $staffId => $intervals) {
                usort($intervals, fn ($a, $b) => strcmp($a[0], $b[0]));
                for ($i = 1; $i < count($intervals); $i++) {
                    [$prevStart, $prevEnd, $prevIdx] = $intervals[$i - 1];
                    [$currStart, $currEnd, $currIdx] = $intervals[$i];
                    if ($currStart < $prevEnd) {
                        throw new HttpResponseException(ApiResponse::error("Items #{$prevIdx} and #{$currIdx} overlap for the same staff.", 422, 'OVERLAP_IN_REQUEST'));
                    }
                }
            }

            $finalAmount = $totalAmount;
            if (! empty($validated['promotion_id'])) {
                $percent = (int) DB::table('promotions')
                    ->where('promotion_id', $validated['promotion_id'])
                    ->value('percent');
                $finalAmount = $totalAmount * max(0, 100 - $percent) / 100;
            }

            // Use earliest service start time for appointment_date (or now for product-only).
            $appointmentDateTime = $hasServiceItem && $earliestStart
                ? $appointmentDate->copy()->setTimeFromTimeString($earliestStart.':00')
                : now();

            $appointment = Appointment::create([
                'client_id' => $clientId,
                'appointment_date' => $appointmentDateTime,
                'total_amount' => $totalAmount,
                'promotion_id' => $validated['promotion_id'] ?? null,
                'final_amount' => $finalAmount,
                'payment_method' => $validated['payment_method'] ?? null,
                'payment_status' => 'unpay',
                'status' => 'active',
            ]);

            // Re-check overlap inside the same transaction (race-condition mitigation).
            foreach ($detailsToCreate as $detail) {
                // Only service-lines have staff/time.
                if ($usesMixedItemSchema) {
                    if (($detail['item_type'] ?? null) !== 'service') {
                        continue;
                    }
                } else {
                    if (empty($detail['service_id'])) {
                        continue;
                    }
                }

                $this->ensureNoOverlap(
                    $appointmentDate,
                    (int) $detail['staff_id'],
                    (string) $detail['start_time'],
                    (string) $detail['end_time'],
                    true,
                    $usesMixedItemSchema,
                );
            }

            foreach ($detailsToCreate as $detail) {
                AppointmentDetail::create([
                    'appointment_id' => $appointment->appointment_id,
                    ...$detail,
                ]);

                $isProductLine = $usesMixedItemSchema ? ($detail['item_type'] === 'product') : (! empty($detail['product_id']));
                $productId = $usesMixedItemSchema ? (int) ($detail['item_id'] ?? 0) : (int) ($detail['product_id'] ?? 0);

                if ($isProductLine) {
                    $product = $products->get($productId);
                    if ($product) {
                        $product->stock_quantity = (int) $product->stock_quantity - (int) $detail['quantity'];
                        $product->save();

                        InventoryLog::create([
                            'product_id' => $productId,
                            'change_amount' => -1 * (int) $detail['quantity'],
                            'reason' => 'Sold in appointment #'.$appointment->appointment_id,
                        ]);
                    }
                }
            }

            return $appointment->load([
                'client:client_id,client_name,email',
                'appointmentDetails.staff:staff_id,staff_name',
                ...($usesMixedItemSchema ? ['appointmentDetails.item'] : ['appointmentDetails.service', 'appointmentDetails.product']),
            ]);
        });

        return ApiResponse::success($appointment, 'Appointment booked successfully.', 201);
    }

    public function cancel(Request $request, string $id)
    {
        $appointment = Appointment::find($id);
        if (! $appointment) {
            return ApiResponse::error('Appointment not found.', 404, 'NOT_FOUND');
        }
        if (! $this->canAccessAppointment($request, $appointment)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment->status = 'inactive';
        $appointment->save();

        AppointmentDetail::where('appointment_id', $appointment->appointment_id)->update(['status' => 'inactive']);

        return ApiResponse::success($appointment->fresh(), 'Appointment cancelled.');
    }

    public function checkIn(Request $request, string $id)
    {
        $appointment = Appointment::find($id);
        if (! $appointment) {
            return ApiResponse::error('Appointment not found.', 404, 'NOT_FOUND');
        }
        if (! in_array('admin', $this->abilities($request), true) && ! in_array('staff', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment->status = 'active';
        $appointment->save();

        return ApiResponse::success($appointment->fresh(), 'Client checked in.');
    }

    public function checkOut(Request $request, string $id)
    {
        $appointment = Appointment::find($id);
        if (! $appointment) {
            return ApiResponse::error('Appointment not found.', 404, 'NOT_FOUND');
        }
        if (! in_array('admin', $this->abilities($request), true) && ! in_array('staff', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment->payment_status = 'pay';
        $appointment->status = 'inactive';
        $appointment->save();

        AppointmentDetail::where('appointment_id', $appointment->appointment_id)->update(['status' => 'inactive']);

        return ApiResponse::success($appointment->fresh(), 'Client checked out and payment completed.');
    }

    public function reschedule(Request $request, string $id)
    {
        $appointment = Appointment::with('appointmentDetails')->find($id);
        if (! $appointment) {
            return ApiResponse::error('Appointment not found.', 404, 'NOT_FOUND');
        }
        if (! $this->canAccessAppointment($request, $appointment)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $rawAppointmentDate = (string) $validated['appointment_date'];
        $newDateTime = \Carbon\Carbon::parse($rawAppointmentDate);
        $includesExplicitTime = preg_match('/\d{2}:\d{2}/', $rawAppointmentDate) === 1;
        $usesMixedItemSchema = Schema::hasColumn('appointment_details', 'item_id');

        DB::transaction(function () use ($appointment, $newDateTime, $usesMixedItemSchema, $includesExplicitTime) {
            $serviceDetails = $appointment->appointmentDetails->filter(function ($detail) use ($usesMixedItemSchema) {
                if ($usesMixedItemSchema) {
                    return $detail->item_type === 'service';
                }

                return ! empty($detail->service_id);
            });

            foreach ($serviceDetails as $detail) {
                $currentStart = \Carbon\Carbon::createFromFormat('H:i:s', (string) $detail->start_time);
                $currentEnd = \Carbon\Carbon::createFromFormat('H:i:s', (string) $detail->end_time);

                if ($includesExplicitTime) {
                    $durationMinutes = $currentStart->diffInMinutes($currentEnd);
                    $newStart = $newDateTime->copy();
                    $newEnd = $newStart->copy()->addMinutes($durationMinutes);
                    $newStartTime = $newStart->format('H:i');
                    $newEndTime = $newEnd->format('H:i');
                } else {
                    $newStartTime = $currentStart->format('H:i');
                    $newEndTime = $currentEnd->format('H:i');
                }

                $this->ensureNoOverlap(
                    $newDateTime->copy()->startOfDay(),
                    (int) $detail->staff_id,
                    $newStartTime,
                    $newEndTime,
                    true,
                    $usesMixedItemSchema,
                    (int) $appointment->appointment_id,
                );

                if ($includesExplicitTime) {
                    $detail->start_time = $newStartTime;
                    $detail->end_time = $newEndTime;
                    $detail->save();
                }
            }

            $appointment->appointment_date = $newDateTime;
            $appointment->save();
        });

        return ApiResponse::success($appointment->fresh(), 'Appointment rescheduled successfully.');
    }

    public function completeDetail(Request $request, string $detailId)
    {
        $detail = AppointmentDetail::find($detailId);
        if (! $detail) {
            return ApiResponse::error('Task not found.', 404, 'NOT_FOUND');
        }
        if ($detail->item_type !== 'service') {
            return ApiResponse::error('Only service tasks can be completed.', 422, 'INVALID_ITEM_TYPE');
        }

        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);
        $isAssignedStaff = in_array('staff', $abilities, true) && (int) $detail->staff_id === (int) $request->user()->getKey();

        if (! $isAdmin && ! $isAssignedStaff) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $detail->status = 'inactive';
        $detail->save();

        return ApiResponse::success($detail->fresh(), 'Task marked as completed.');
    }

    private function ensureNoOverlap(
        \Carbon\Carbon $appointmentDate,
        int $staffId,
        string $startTime,
        string $endTime,
        bool $forUpdate = false,
        bool $usesMixedItemSchema = true,
        ?int $ignoreAppointmentId = null,
    ): void
    {
        $query = AppointmentDetail::query()
            ->join('appointments', 'appointments.appointment_id', '=', 'appointment_details.appointment_id')
            ->where('appointment_details.staff_id', $staffId)
            ->where('appointments.status', 'active')
            ->whereDate('appointments.appointment_date', $appointmentDate->toDateString())
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($q2) use ($startTime, $endTime) {
                    $q2->where('appointment_details.start_time', '<', $endTime)
                        ->where('appointment_details.end_time', '>', $startTime);
                });
            })
            ->select('appointment_details.detail_id');

        if ($ignoreAppointmentId !== null) {
            $query->where('appointments.appointment_id', '!=', $ignoreAppointmentId);
        }

        // New schema stores service lines with item_type = 'service'.
        // Old schema uses item_type = 'hair'/'skin', so we must NOT filter by item_type there.
        if ($usesMixedItemSchema) {
            $query->where('appointment_details.item_type', 'service');
        }

        if ($forUpdate) {
            $query->lockForUpdate();
        }

        $conflict = $query->first();

        if ($conflict) {
            throw new HttpResponseException(
                response()->json([
                    'api_version' => 'v1',
                    'success' => false,
                    'message' => 'Selected staff already has another appointment in this time range.',
                    'code' => 'STAFF_SCHEDULE_OVERLAP',
                    'timestamp' => now()->toISOString(),
                ], 422)
            );
        }
    }
}
