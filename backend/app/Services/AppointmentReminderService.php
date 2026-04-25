<?php

namespace App\Services;

use App\Mail\AppointmentReminderMail;
use App\Models\Appointment;
use App\Services\ClientNotificationService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class AppointmentReminderService
{
    public function __construct(private readonly ClientNotificationService $notificationService)
    {
    }

    public function dueAppointments(?Carbon $now = null): Collection
    {
        $now ??= now();
        $reminderMinutes = (int) config('appointments.reminder_minutes_before', 120);
        $windowMinutes = max(1, (int) config('appointments.reminder_window_minutes', 10));
        $halfWindow = (int) ceil($windowMinutes / 2);

        $windowStart = $now->copy()->addMinutes($reminderMinutes - $halfWindow);
        $windowEnd = $now->copy()->addMinutes($reminderMinutes + $halfWindow);

        return Appointment::query()
            ->with([
                'client:client_id,client_name,email',
                'appointmentDetails.staff:staff_id,staff_name',
                'appointmentDetails.service:service_id,service_name',
            ])
            ->where('status', 'active')
            ->whereBetween('appointment_date', [$windowStart, $windowEnd])
            ->get()
            ->filter(function (Appointment $appointment) {
                if ((string) ($appointment->reminder_sent_at ?? '') !== '') {
                    return false;
                }

                if (Schema::hasColumn('appointments', 'reminder_sent') && $appointment->reminder_sent) {
                    return false;
                }

                if ($appointment->attendance_status !== 'Pending') {
                    return false;
                }

                if (! empty($appointment->check_in_time) || ! empty($appointment->checked_in_at)) {
                    return false;
                }

                return $appointment->appointmentDetails->contains(function ($detail) {
                    return ! empty($detail->service_id);
                });
            })
            ->values();
    }

    public function sendDueReminders(?Carbon $now = null): array
    {
        $now ??= now();
        $sent = 0;
        $skipped = 0;

        foreach ($this->dueAppointments($now) as $appointment) {
            if (! $appointment->client?->email) {
                $skipped++;
                continue;
            }

            DB::transaction(function () use ($appointment, $now, &$sent): void {
                $locked = Appointment::query()
                    ->whereKey($appointment->getKey())
                    ->lockForUpdate()
                    ->first();

                if (! $locked) {
                    return;
                }

                if ((string) ($locked->reminder_sent_at ?? '') !== '') {
                    return;
                }

                if (Schema::hasColumn('appointments', 'reminder_sent') && $locked->reminder_sent) {
                    return;
                }

                if (Schema::hasColumn('appointments', 'reminder_sent')) {
                    $locked->reminder_sent = true;
                }
                if (Schema::hasColumn('appointments', 'reminder_sent_at')) {
                    $locked->reminder_sent_at = $now;
                }
                $locked->save();

                $this->notificationService->forgetReadState((int) $locked->client_id, (int) $locked->getKey());
                $sent++;
            });

            Mail::to($appointment->client->email)->queue(new AppointmentReminderMail($appointment));
        }

        return [
            'sent' => $sent,
            'skipped' => $skipped,
            'message' => "Appointment reminder run complete. Sent {$sent}, skipped {$skipped}.",
        ];
    }
}
