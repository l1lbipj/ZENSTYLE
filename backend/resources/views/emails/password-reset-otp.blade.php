<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZENSTYLE Password Reset OTP</title>
</head>
@php
    $logoCid = null;
    if (!empty($logoPath) && file_exists($logoPath)) {
        $logoCid = $message->embed($logoPath);
    }
@endphp
<body style="margin:0;padding:0;background:#f3f6ff;font-family:Arial,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6ff;padding:24px 0;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,.12);">
                <tr>
                    <td style="background:linear-gradient(135deg,#111827,#1f2937);padding:28px 24px;color:#fff;">
                        @if ($logoCid)
                            <img src="{{ $logoCid }}" alt="ZENSTYLE Logo" style="height:42px;display:block;margin-bottom:12px;">
                        @endif
                        <div style="font-size:24px;font-weight:700;letter-spacing:.5px;color:#f8e7b8;">ZENSTYLE</div>
                        <div style="margin-top:6px;font-size:14px;opacity:.9;">Password reset verification</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding:28px 24px;">
                        <h2 style="margin:0 0 10px 0;font-size:24px;line-height:1.3;color:#111827;">Your OTP code is ready</h2>
                        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#4b5563;">
                            Use the verification code below to reset your password.
                            This code is valid for <strong>5 minutes</strong>.
                        </p>
                        <div style="margin:0 0 18px 0;padding:14px 16px;border:1px dashed #d4af37;border-radius:12px;background:#fff8e1;text-align:center;">
                            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#b8860b;">{{ $otp }}</span>
                        </div>
                        <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;">Expires at: <strong>{{ $expiresAt }}</strong></p>
                        <p style="margin:0;font-size:13px;color:#6b7280;">
                            If you did not request this, you can safely ignore this email.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">
                            © {{ date('Y') }} ZENSTYLE. All rights reserved.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
