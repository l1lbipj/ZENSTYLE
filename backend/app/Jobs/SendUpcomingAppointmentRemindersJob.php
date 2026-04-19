<?php

namespace App\Jobs;

use App\Mail\AppointmentReminderMail;
use App\Models\Appointment;
use Illuminate\Support\Facades\Mail;

class SendUpcomingAppointmentRemindersJob
{
    public function handle(): void
    {
        $from = now();
        $to = now()->copy()->addMinutes(60);

        Appointment::query()
            ->with('client:client_id,client_name,email')
            ->where('status', 'active')
            ->whereNull('reminder_sent_at')
            ->whereBetween('appointment_date', [$from, $to])
            ->orderBy('appointment_date')
            ->chunkById(50, function ($appointments) {
                foreach ($appointments as $appointment) {
                    $email = $appointment->client?->email;
                    if (! $email) {
                        continue;
                    }

                    Mail::to($email)->send(new AppointmentReminderMail($appointment));
                    $appointment->reminder_sent_at = now();
                    $appointment->save();
                }
            }, 'appointment_id');
    }
}
