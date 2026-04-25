<?php

namespace App\Services;

use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AppointmentAttendanceService
{
    public function checkIn(Request $request, Appointment $appointment): Appointment
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];
        $isClient = in_array('client', $abilities, true);
        $now = now();

        return DB::transaction(function () use ($appointment, $isClient, $now, $request) {
            $locked = Appointment::query()
                ->whereKey($appointment->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureCanAccess($request, $locked);

            if ($this->isCompletedOrCancelled($locked)) {
                throw new HttpResponseException(ApiResponse::error(
                    'Appointment is already completed or cancelled.',
                    422,
                    'INVALID_APPOINTMENT_STATE',
                ));
            }

            if ($this->isAlreadyCheckedIn($locked)) {
                throw new HttpResponseException(ApiResponse::error(
                    'Appointment has already been checked in.',
                    422,
                    'ALREADY_CHECKED_IN',
                ));
            }

            if ($isClient && ! $this->isWithinClientCheckInWindow($locked, $now)) {
                throw new HttpResponseException(ApiResponse::error(
                    'Check-in is only available within the allowed pre-appointment window.',
                    422,
                    'CHECK_IN_WINDOW_CLOSED',
                ));
            }

            $this->setAppointmentValue($locked, 'attendance_status', 'Checked-In');
            $this->setAppointmentValue($locked, 'check_in_time', $now);
            $this->setAppointmentValue($locked, 'checked_in_at', $now);
            $this->setAppointmentValue($locked, 'checked_in_by', (int) $request->user()->getKey());
            $this->setAppointmentValue($locked, 'status', 'active');

            if (! $locked->assigned_staff_id && in_array('staff', $abilities, true)) {
                $this->setAppointmentValue($locked, 'assigned_staff_id', (int) $request->user()->getKey());
            }

            $locked->save();

            return $locked->fresh();
        });
    }

    public function checkOut(Request $request, Appointment $appointment): Appointment
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];
        $isClient = in_array('client', $abilities, true);
        $now = now();

        return DB::transaction(function () use ($appointment, $isClient, $now, $request) {
            $locked = Appointment::query()
                ->whereKey($appointment->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureCanAccess($request, $locked);

            if ($this->isCompleted($locked)) {
                throw new HttpResponseException(ApiResponse::error(
                    'Appointment has already been checked out.',
                    422,
                    'ALREADY_CHECKED_OUT',
                ));
            }

            if ($this->isCancelled($locked)) {
                throw new HttpResponseException(ApiResponse::error(
                    'Appointment is cancelled.',
                    422,
                    'INVALID_APPOINTMENT_STATE',
                ));
            }

            if (! $this->isAlreadyCheckedIn($locked)) {
                throw new HttpResponseException(ApiResponse::error(
                    'Appointment must be checked in before check-out.',
                    422,
                    'CHECK_OUT_REQUIRES_CHECK_IN',
                ));
            }

            if ($isClient && $locked->appointment_date && $now->lessThan($locked->appointment_date)) {
                throw new HttpResponseException(ApiResponse::error(
                    'Check-out is not available before the appointment starts.',
                    422,
                    'CHECK_OUT_TOO_EARLY',
                ));
            }

            $this->setAppointmentValue($locked, 'attendance_status', 'Completed');
            $this->setAppointmentValue($locked, 'check_out_time', $now);
            $this->setAppointmentValue($locked, 'service_completed_at', $now);
            $this->setAppointmentValue($locked, 'status', 'inactive');

            if (! $isClient) {
                $this->setAppointmentValue($locked, 'payment_status', 'pay');
            }

            $locked->save();

            return $locked->fresh();
        });
    }

    public function isWithinClientCheckInWindow(Appointment $appointment, ?Carbon $now = null): bool
    {
        $now ??= now();

        if (! $appointment->appointment_date) {
            return false;
        }

        $openMinutes = (int) config('appointments.check_in_window_open_minutes_before', 60);
        $closeMinutes = (int) config('appointments.check_in_window_close_minutes_before', 30);

        $windowOpen = $appointment->appointment_date->copy()->subMinutes($openMinutes);
        $windowClose = $appointment->appointment_date->copy()->subMinutes($closeMinutes);

        return $now->betweenIncluded($windowOpen, $windowClose);
    }

    public function derivedAttendanceStatus(Appointment $appointment): string
    {
        $stored = $this->storedAttendanceStatus($appointment);
        if ($stored !== '') {
            return $stored;
        }

        if (! empty($appointment->check_out_time) || ! empty($appointment->service_completed_at)) {
            return 'Completed';
        }

        if (! empty($appointment->check_in_time) || ! empty($appointment->checked_in_at)) {
            return 'Checked-In';
        }

        if ((string) $appointment->status === 'inactive') {
            return 'Cancelled';
        }

        if ($appointment->appointment_date) {
            $lateGrace = (int) config('appointments.late_check_in_grace_minutes', 15);
            if (now()->greaterThan($appointment->appointment_date->copy()->addMinutes($lateGrace))) {
                return 'Missed';
            }
        }

        return 'Pending';
    }

    private function ensureCanAccess(Request $request, Appointment $appointment): void
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];

        if (in_array('admin', $abilities, true) || in_array('staff', $abilities, true)) {
            return;
        }

        if (in_array('client', $abilities, true) && (int) $appointment->client_id === (int) $request->user()->getKey()) {
            return;
        }

        throw new HttpResponseException(ApiResponse::error('Access denied.', 403, 'FORBIDDEN'));
    }

    private function isAlreadyCheckedIn(Appointment $appointment): bool
    {
        return in_array($this->storedAttendanceStatus($appointment), ['Checked-In', 'Completed'], true)
            || ! empty($appointment->check_in_time)
            || ! empty($appointment->checked_in_at);
    }

    private function isCompleted(Appointment $appointment): bool
    {
        return in_array($this->storedAttendanceStatus($appointment), ['Completed'], true)
            || ! empty($appointment->check_out_time)
            || ! empty($appointment->service_completed_at);
    }

    private function isCancelled(Appointment $appointment): bool
    {
        return in_array($this->storedAttendanceStatus($appointment), ['Cancelled'], true)
            || (string) $appointment->status === 'inactive' && ! $this->isCompleted($appointment);
    }

    private function isCompletedOrCancelled(Appointment $appointment): bool
    {
        return $this->isCompleted($appointment) || $this->isCancelled($appointment);
    }

    private function storedAttendanceStatus(Appointment $appointment): string
    {
        return trim((string) ($appointment->getRawOriginal('attendance_status') ?? ''));
    }

    private function setAppointmentValue(Appointment $appointment, string $column, mixed $value): void
    {
        if (Schema::hasColumn('appointments', $column)) {
            $appointment->{$column} = $value;
        }
    }
}
