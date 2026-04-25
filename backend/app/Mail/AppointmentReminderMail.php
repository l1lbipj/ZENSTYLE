<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AppointmentReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Appointment $appointment)
    {
        $this->appointment->loadMissing([
            'client:client_id,client_name,email',
            'appointmentDetails.staff:staff_id,staff_name',
            'appointmentDetails.service:service_id,service_name',
        ]);
    }

    public function build()
    {
        $serviceNames = $this->appointment->appointmentDetails
            ->map(fn ($detail) => $detail->service?->service_name)
            ->filter()
            ->values()
            ->implode(', ');

        $staffName = $this->appointment->appointmentDetails->first()?->staff?->staff_name ?? 'ZENSTYLE Team';

        return $this->subject('Appointment Reminder – ZENSTYLE')
            ->view('emails.appointment-reminder')
            ->with([
                'clientName' => $this->appointment->client?->client_name ?? 'Client',
                'serviceName' => $serviceNames !== '' ? $serviceNames : 'Appointment',
                'appointmentTime' => $this->appointment->appointment_date,
                'staffName' => $staffName,
            ]);
    }
}
