<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAppointmentRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\AppointmentDetail;
use App\Models\Service;
use App\Models\StaffSchedule;
use App\Services\AppointmentAttendanceService;
use App\Services\ClientNotificationService;
use Carbon\Carbon;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AppointmentController extends Controller
{
    private const BUSINESS_START = '07:00';
    private const BUSINESS_END = '22:00';

    public function __construct(private readonly ClientNotificationService $notificationService)
    {
    }

    private function usesMixedItemSchema(): bool
    {
        return Schema::hasColumn('appointment_details', 'item_id');
    }

    private function constrainServiceDetails($query, bool $usesMixedItemSchema, bool $usesLegacyItemTypeValues): void
    {
        $query->whereNotNull('service_id');
    }

    private function timeToMinutes(string $time): int
    {
        [$hour, $minute] = array_pad(explode(':', $time, 2), 2, '0');

        return ((int) $hour * 60) + (int) $minute;
    }

    private function assertBusinessHours(string $startTime, string $endTime, int $itemNumber = 0): void
    {
        $startMinutes = $this->timeToMinutes($startTime);
        $endMinutes = $this->timeToMinutes($endTime);
        $minMinutes = $this->timeToMinutes(self::BUSINESS_START);
        $maxMinutes = $this->timeToMinutes(self::BUSINESS_END);

        if ($startMinutes < $minMinutes || $endMinutes > $maxMinutes) {
            $prefix = $itemNumber > 0 ? "Item #{$itemNumber} " : '';
            throw new HttpResponseException(ApiResponse::error(
                $prefix.'must be scheduled between 07:00 and 22:00.',
                422,
                'BUSINESS_HOURS_VIOLATION',
            ));
        }

        if ($startMinutes >= $endMinutes) {
            $prefix = $itemNumber > 0 ? "Item #{$itemNumber} " : '';
            throw new HttpResponseException(ApiResponse::error(
                $prefix.'has invalid time range.',
                422,
                'INVALID_TIME_RANGE',
            ));
        }
    }

    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function canAccessAppointment(Request $request, Appointment $appointment): bool
    {
        $abilities = $this->abilities($request);
        $usesMixedItemSchema = $this->usesMixedItemSchema();

        if (in_array('admin', $abilities, true)) {
            return true;
        }

        if (in_array('client', $abilities, true)) {
            return (int) $appointment->client_id === (int) $request->user()->getKey();
        }

        if (in_array('staff', $abilities, true)) {
            return AppointmentDetail::query()
                ->where('appointment_id', $appointment->appointment_id)
                ->where('staff_id', $request->user()->getKey())
                ->where(function ($query) use ($usesMixedItemSchema) {
                    $this->constrainServiceDetails($query, $usesMixedItemSchema, false);
                })
                ->exists();
        }

        return false;
    }

    public function index(Request $request)
    {
        $query = Appointment::query()
            ->with(array_merge([
                'client:client_id,client_name,email,phone',
                'client.allergies:allergies.allergy_id,allergy_name',
                'appointmentDetails.staff:staff_id,staff_name',
                'appointmentDetails.service:service_id,service_name,price,duration',
                'feedback:feedback_id,appointment_id,customer_id,staff_id,rating,comment,notes,reply,manager_reply,replied_at',
            ]))
            ->orderByDesc('appointment_date');

        $abilities = $this->abilities($request);
        if (in_array('client', $abilities, true)) {
            $query->where('client_id', $request->user()->getKey());
        } elseif (in_array('staff', $abilities, true)) {
            $staffId = $request->user()->getKey();
            $query->whereHas('appointmentDetails', function ($q) use ($staffId) {
                $q->where('staff_id', $staffId);
                $this->constrainServiceDetails($q, $this->usesMixedItemSchema(), false);
            });
        } elseif (! in_array('admin', $abilities, true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $status = $request->query('status');
        if ($status !== null) {
            $query->where('status', $status);
        }

        if ($staffId = $request->query('staff_id')) {
            $query->whereHas('appointmentDetails', function ($q) use ($staffId) {
                $q->where('staff_id', $staffId);
                $this->constrainServiceDetails($q, $this->usesMixedItemSchema(), false);
            });
        }

        if ($date = $request->query('date')) {
            $query->whereDate('appointment_date', $date);
        } elseif ($from = $request->query('from')) {
            $to = $request->query('to', $from);
            $query->whereBetween('appointment_date', [
                Carbon::parse($from)->startOfDay(),
                Carbon::parse($to)->endOfDay(),
            ]);
        }

        $appointments = $query->paginate((int) $request->query('per_page', 10));

        return ApiResponse::success($appointments, 'Appointments retrieved.');
    }

    public function store(StoreAppointmentRequest $request)
    {
        $abilities = $this->abilities($request);
        $validated = $request->validated();

        $clientId = $validated['client_id'] ?? $request->user()->getKey();
        if (in_array('client', $abilities, true)) {
            $clientId = $request->user()->getKey();
        }

        $items = $validated['items'];
        $serviceIds = [];

        foreach ($items as $item) {
            if (($item['item_type'] ?? null) !== 'service') {
                throw new HttpResponseException(ApiResponse::error('Only service items are allowed in appointments.', 422, 'INVALID_ITEM_TYPE'));
            }

            $serviceIds[] = (int) $item['item_id'];
        }

        if (empty($validated['appointment_date'])) {
            return ApiResponse::error('appointment_date is required for service items.', 422, 'VALIDATION_ERROR');
        }

        $appointmentDate = \Carbon\Carbon::parse($validated['appointment_date'])->startOfDay();

        $appointment = DB::transaction(function () use ($appointmentDate, $clientId, $items, $serviceIds, $validated) {
            $services = Service::query()
                ->whereIn('service_id', array_values(array_unique($serviceIds)))
                ->with('category:category_id,category_name')
                ->get()
                ->keyBy('service_id');

            $detailsToCreate = [];
            $totalAmount = 0.0;
            $intervalsByStaff = [];
            $earliestStart = null;

            foreach ($items as $idx => $item) {
                $itemId = (int) $item['item_id'];
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
                $this->assertBusinessHours($startTime, $endTime, $idx + 1);

                $intervalsByStaff[$staffId][] = [$startTime, $endTime, $idx + 1];
                $earliestStart = $earliestStart === null ? $startTime : min($earliestStart, $startTime);

                $lineTotal = (float) $service->price;
                $totalAmount += $lineTotal;

                $detailsToCreate[] = [
                    'staff_id' => $staffId,
                    'item_id' => $itemId,
                    'service_id' => $itemId,
                    'price' => $lineTotal,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'status' => 'active',
                ];
            }

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

            $appointmentDateTime = $earliestStart
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
                ...(Schema::hasColumn('appointments', 'attendance_status') ? ['attendance_status' => 'Pending'] : []),
                ...(Schema::hasColumn('appointments', 'check_in_time') ? ['check_in_time' => null] : []),
                ...(Schema::hasColumn('appointments', 'check_out_time') ? ['check_out_time' => null] : []),
                ...(Schema::hasColumn('appointments', 'reminder_sent') ? ['reminder_sent' => false] : []),
                ...(
                    Schema::hasColumn('appointments', 'notification_preference')
                        ? ['notification_preference' => $validated['notification_preference'] ?? 'both']
                        : []
                ),
            ]);

            foreach ($detailsToCreate as $detail) {
                $this->ensureNoOverlap(
                    $appointmentDate,
                    (int) $detail['staff_id'],
                    (string) $detail['start_time'],
                    (string) $detail['end_time'],
                    true,
                    true,
                );

                AppointmentDetail::create([
                    'appointment_id' => $appointment->appointment_id,
                    ...$detail,
                ]);
            }

            return $appointment->load([
                'client:client_id,client_name,email,phone',
                'client.allergies:allergies.allergy_id,allergy_name',
                'appointmentDetails.staff:staff_id,staff_name',
                'appointmentDetails.service:service_id,service_name,price,duration',
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

        if (in_array($appointment->attendance_status, ['Checked-In', 'Completed'], true)) {
            return ApiResponse::error('Checked-in or completed appointments cannot be cancelled.', 422, 'INVALID_APPOINTMENT_STATE');
        }

        $appointment->status = 'inactive';
        if (Schema::hasColumn('appointments', 'attendance_status')) {
            $appointment->attendance_status = 'Cancelled';
        }
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
        $abilities = $this->abilities($request);
        if (! in_array('admin', $abilities, true) && ! in_array('staff', $abilities, true) && ! in_array('client', $abilities, true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment = app(AppointmentAttendanceService::class)->checkIn($request, $appointment);

        return ApiResponse::success($appointment, 'Appointment checked in.');
    }

    public function checkOut(Request $request, string $id)
    {
        $appointment = Appointment::find($id);
        if (! $appointment) {
            return ApiResponse::error('Appointment not found.', 404, 'NOT_FOUND');
        }
        $abilities = $this->abilities($request);
        if (! in_array('admin', $abilities, true) && ! in_array('staff', $abilities, true) && ! in_array('client', $abilities, true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment = app(AppointmentAttendanceService::class)->checkOut($request, $appointment);

        AppointmentDetail::where('appointment_id', $appointment->appointment_id)->update(['status' => 'inactive']);

        return ApiResponse::success($appointment, 'Appointment checked out.');
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

        DB::transaction(function () use ($appointment, $newDateTime, $includesExplicitTime) {
            $serviceDetails = $appointment->appointmentDetails->filter(function ($detail) {
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

                $this->assertBusinessHours($newStartTime, $newEndTime);

                $this->ensureNoOverlap(
                    $newDateTime->copy()->startOfDay(),
                    (int) $detail->staff_id,
                    $newStartTime,
                    $newEndTime,
                    true,
                    true,
                    (int) $appointment->appointment_id,
                );

                if ($includesExplicitTime) {
                    $detail->start_time = $newStartTime;
                    $detail->end_time = $newEndTime;
                    $detail->save();
                }
            }

            $appointment->appointment_date = $newDateTime;
            if (Schema::hasColumn('appointments', 'reminder_sent')) {
                $appointment->reminder_sent = false;
            }
            if (Schema::hasColumn('appointments', 'reminder_sent_at')) {
                $appointment->reminder_sent_at = null;
            }
            $appointment->save();
        });

        $this->notificationService->forgetReadState((int) $appointment->client_id, (int) $appointment->appointment_id);

        return ApiResponse::success($appointment->fresh(), 'Appointment rescheduled successfully.');
    }

    public function completeDetail(Request $request, string $detailId)
    {
        $detail = AppointmentDetail::find($detailId);
        if (! $detail) {
            return ApiResponse::error('Task not found.', 404, 'NOT_FOUND');
        }
        if (empty($detail->service_id)) {
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

    public function startService(Request $request, string $id)
    {
        $appointment = Appointment::find($id);
        if (! $appointment) {
            return ApiResponse::error('Appointment not found.', 404, 'NOT_FOUND');
        }

        if (! in_array('admin', $this->abilities($request), true) && ! in_array('staff', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        if ($appointment->status !== 'active') {
            return ApiResponse::error('Appointment is not active.', 422, 'INVALID_APPOINTMENT_STATE');
        }

        $appointment->service_started_at = $appointment->service_started_at ?: now();
        $appointment->assigned_staff_id = $appointment->assigned_staff_id ?: $request->user()->getKey();
        $appointment->save();

        AppointmentDetail::where('appointment_id', $appointment->appointment_id)->update([
            'started_at' => now(),
        ]);

        return ApiResponse::success($appointment->fresh(), 'Service started.');
    }

    public function endService(Request $request, string $id)
    {
        $appointment = Appointment::find($id);
        if (! $appointment) {
            return ApiResponse::error('Appointment not found.', 404, 'NOT_FOUND');
        }

        if (! in_array('admin', $this->abilities($request), true) && ! in_array('staff', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $appointment->service_completed_at = now();
        $appointment->save();

        AppointmentDetail::where('appointment_id', $appointment->appointment_id)->update([
            'completed_at' => now(),
        ]);

        return ApiResponse::success($appointment->fresh(), 'Service completed.');
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

        $query->whereNotNull('appointment_details.service_id');

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
