<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\AppointmentReminderService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('appointments:send-reminders', function () {
    $summary = app(AppointmentReminderService::class)->sendDueReminders();

    $this->comment($summary['message']);
})->purpose('Send appointment reminders for appointments starting in two hours');

Schedule::command('appointments:send-reminders')
    ->everyFiveMinutes()
    ->withoutOverlapping();
