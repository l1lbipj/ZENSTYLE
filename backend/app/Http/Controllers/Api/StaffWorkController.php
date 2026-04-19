<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\StaffSchedule;
use App\Models\WorkShift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class StaffWorkController extends Controller
{
    private function isStaff(Request $request): bool
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];

        return in_array('staff', $abilities, true);
    }

    public function schedules(Request $request)
    {
        if (! $this->isStaff($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $staffId = (int) $request->user()->getKey();
        $query = StaffSchedule::query()
            ->with('shift:shift_id,shift_name')
            ->where('staff_id', $staffId)
            ->orderBy('date');

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->query('to'));
        }

        $items = $query->paginate((int) $request->query('per_page', 30));

        return ApiResponse::success($items, 'Staff schedules retrieved.');
    }

    public function appointments(Request $request)
    {
        if (! $this->isStaff($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $staffId = (int) $request->user()->getKey();
        $query = Appointment::query()
            ->with([
                'client:client_id,client_name,phone,email',
                'appointmentDetails' => function ($q) use ($staffId) {
                    $q->where('staff_id', $staffId)->where('item_type', 'service');
                },
                'appointmentDetails.item',
                'appointmentDetails.staff:staff_id,staff_name',
            ])
            ->whereHas('appointmentDetails', function ($q) use ($staffId) {
                $q->where('staff_id', $staffId)->where('item_type', 'service');
            })
            ->orderByDesc('appointment_date');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $appointments = $query->paginate((int) $request->query('per_page', 20));

        return ApiResponse::success($appointments, 'Staff appointments retrieved.');
    }

    public function todayAttendance(Request $request)
    {
        if (! $this->isStaff($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $schedule = StaffSchedule::query()
            ->where('staff_id', $request->user()->getKey())
            ->whereDate('date', now()->toDateString())
            ->orderBy('schedule_id')
            ->first();

        if (! $schedule) {
            return ApiResponse::success([
                'status' => 'not_checked_in',
                'check_in' => null,
                'check_out' => null,
                'schedule_id' => null,
            ], 'Today attendance retrieved.');
        }

        $actualCheckIn = $schedule->actual_check_in ?? null;
        $actualCheckOut = $schedule->actual_check_out ?? null;

        $status = 'not_checked_in';
        if ($actualCheckIn !== null) {
            $status = $actualCheckOut !== null ? 'checked_out' : 'checked_in';
        }

        return ApiResponse::success([
            'status' => $status,
            'check_in' => $actualCheckIn,
            'check_out' => $actualCheckOut,
            'schedule_id' => (int) $schedule->schedule_id,
            'date' => $schedule->date,
        ], 'Today attendance retrieved.');
    }

    public function attendanceHistory(Request $request)
    {
        if (! $this->isStaff($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $hasActualColumns = Schema::hasColumn('staff_schedules', 'actual_check_in')
            && Schema::hasColumn('staff_schedules', 'actual_check_out');

        $query = StaffSchedule::query()
            ->where('staff_id', $request->user()->getKey())
            ->orderByDesc('date');

        $result = $query->paginate((int) $request->query('per_page', 30));
        $result->getCollection()->transform(function (StaffSchedule $item) use ($hasActualColumns) {
            $checkIn = $hasActualColumns ? $item->actual_check_in : null;
            $checkOut = $hasActualColumns ? $item->actual_check_out : null;
            $attendanceStatus = $checkOut ? 'present' : ($checkIn ? 'late' : 'absent');

            return [
                'schedule_id' => (int) $item->schedule_id,
                'date' => $item->date,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'attendance_status' => $attendanceStatus,
            ];
        });

        return ApiResponse::success($result, 'Attendance history retrieved.');
    }

    public function checkIn(Request $request)
    {
        if (! $this->isStaff($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $schedule = $this->resolveTodaySchedule((int) $request->user()->getKey(), true);
        if (! $schedule) {
            return ApiResponse::error('Cannot check in because no shift configuration exists yet.', 422, 'NO_SHIFT_CONFIGURED');
        }

        if (! empty($schedule->actual_check_in)) {
            return ApiResponse::error('Already checked in today.', 422, 'ALREADY_CHECKED_IN');
        }

        $schedule->actual_check_in = now();
        $schedule->save();

        return ApiResponse::success([
            'status' => 'checked_in',
            'check_in' => $schedule->actual_check_in,
            'check_out' => $schedule->actual_check_out,
            'schedule_id' => (int) $schedule->schedule_id,
        ], 'Check-in successful.');
    }

    public function checkOut(Request $request)
    {
        if (! $this->isStaff($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $schedule = $this->resolveTodaySchedule((int) $request->user()->getKey(), false);

        if (! $schedule) {
            return ApiResponse::error('No schedule found for today.', 422, 'NO_SCHEDULE_TODAY');
        }
        if (empty($schedule->actual_check_in)) {
            return ApiResponse::error('Cannot check out before check in.', 422, 'CHECK_IN_REQUIRED');
        }
        if (! empty($schedule->actual_check_out)) {
            return ApiResponse::error('Already checked out today.', 422, 'ALREADY_CHECKED_OUT');
        }
        if (now()->lessThanOrEqualTo($schedule->actual_check_in)) {
            return ApiResponse::error('Check-out must be after check-in.', 422, 'INVALID_CHECK_OUT_TIME');
        }

        $schedule->actual_check_out = now();
        $schedule->save();

        return ApiResponse::success([
            'status' => 'checked_out',
            'check_in' => $schedule->actual_check_in,
            'check_out' => $schedule->actual_check_out,
            'schedule_id' => (int) $schedule->schedule_id,
        ], 'Check-out successful.');
    }

    private function resolveTodaySchedule(int $staffId, bool $createIfMissing): ?StaffSchedule
    {
        $schedule = StaffSchedule::query()
            ->where('staff_id', $staffId)
            ->whereDate('date', now()->toDateString())
            ->orderBy('schedule_id')
            ->first();

        if ($schedule || ! $createIfMissing) {
            return $schedule;
        }

        $defaultShift = WorkShift::query()->orderBy('shift_id')->first();
        if (! $defaultShift) {
            return null;
        }

        return StaffSchedule::create([
            'staff_id' => $staffId,
            'date' => now()->toDateString(),
            'check_in' => '09:00:00',
            'check_out' => '18:00:00',
            'shift_id' => $defaultShift->shift_id,
            'actual_check_in' => null,
            'actual_check_out' => null,
        ]);
    }
}
