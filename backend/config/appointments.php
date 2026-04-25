<?php

return [
    'check_in_window_open_minutes_before' => (int) env('APPOINTMENT_CHECKIN_OPEN_MINUTES_BEFORE', 60),
    'check_in_window_close_minutes_before' => (int) env('APPOINTMENT_CHECKIN_CLOSE_MINUTES_BEFORE', 30),
    'late_check_in_grace_minutes' => (int) env('APPOINTMENT_LATE_CHECKIN_GRACE_MINUTES', 15),
    'reminder_minutes_before' => (int) env('APPOINTMENT_REMINDER_MINUTES_BEFORE', 120),
    'reminder_window_minutes' => (int) env('APPOINTMENT_REMINDER_WINDOW_MINUTES', 10),
];
