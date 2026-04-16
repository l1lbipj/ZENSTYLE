<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $otp,
        public string $expiresAt
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'ZENSTYLE Password Reset OTP',
        );
    }

    public function content(): Content
    {
        $logoPath = base_path('../frontend/src/assets/logo.png');

        return new Content(
            view: 'emails.password-reset-otp',
            with: [
                'otp' => $this->otp,
                'expiresAt' => $this->expiresAt,
                'logoPath' => file_exists($logoPath) ? $logoPath : null,
            ],
        );
    }
}
