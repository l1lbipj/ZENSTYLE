<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Appointment Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
    <h2 style="margin-bottom: 12px;">ZenStyle Appointment Reminder</h2>
    <p>Hello {{ $appointment->client->client_name ?? 'Valued customer' }},</p>
    <p>
        This is a reminder that your appointment is scheduled at
        <strong>{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('d/m/Y H:i') }}</strong>.
    </p>
    <p>Please arrive a few minutes early. We look forward to serving you.</p>
    <p>Thank you,<br>ZenStyle Salon</p>
</body>
</html>
