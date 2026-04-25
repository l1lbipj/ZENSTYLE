@php
    use Illuminate\Support\Carbon;
    $formattedTime = $appointmentTime instanceof Carbon ? $appointmentTime->format('F j, Y - h:i A') : (string) $appointmentTime;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Reminder</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 24px; background: #f8fafc;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb;">
        <p>Dear {{ $clientName }},</p>
        <p>This is a reminder that your appointment is scheduled in 2 hours.</p>
        <p>
            <strong>Service:</strong> {{ $serviceName }}<br>
            <strong>Time:</strong> {{ $formattedTime }}<br>
            <strong>Staff:</strong> {{ $staffName }}
        </p>
        <p>Please arrive on time.</p>
        <p>Thank you,<br>ZENSTYLE Team</p>
    </div>
</body>
</html>
