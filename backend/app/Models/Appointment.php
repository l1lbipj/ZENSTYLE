<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $table = 'appointments';
    protected $primaryKey = 'appointment_id';
    public $timestamps = true;
    protected $fillable = [
        'client_id',
        'appointment_date',
        'total_amount',
        'promotion_id',
        'final_amount',
        'payment_method',
        'payment_status',
        'notification_preference',
        'reminder_sent',
        'reminder_sent_at',
        'status',
        'attendance_status',
        'check_in_time',
        'check_out_time',
        'checked_in_at',
        'checked_in_by',
        'assigned_staff_id',
        'service_started_at',
        'service_completed_at',
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
        'reminder_sent' => 'boolean',
        'reminder_sent_at' => 'datetime',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'checked_in_at' => 'datetime',
        'service_started_at' => 'datetime',
        'service_completed_at' => 'datetime',
    ];

    protected $appends = [
        'attendance_status',
        'can_check_in',
        'can_check_out',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function appointmentDetails()
    {
        return $this->hasMany(AppointmentDetail::class, 'appointment_id', 'appointment_id');
    }

    public function feedback()
    {
        return $this->hasOne(Feedback::class, 'appointment_id', 'appointment_id');
    }

    public function getAttendanceStatusAttribute($value): string
    {
        $stored = trim((string) $value);
        if ($stored !== '') {
            return $stored;
        }

        if (! empty($this->check_out_time) || ! empty($this->service_completed_at)) {
            return 'Completed';
        }

        if (! empty($this->check_in_time) || ! empty($this->checked_in_at)) {
            return 'Checked-In';
        }

        if ((string) $this->status === 'inactive') {
            return 'Cancelled';
        }

        if ($this->appointment_date) {
            $graceMinutes = (int) config('appointments.late_check_in_grace_minutes', 15);
            if (now()->greaterThan($this->appointment_date->copy()->addMinutes($graceMinutes))) {
                return 'Missed';
            }
        }

        return 'Pending';
    }

    public function getCanCheckInAttribute(): bool
    {
        if ((string) $this->status !== 'active') {
            return false;
        }

        if ($this->attendance_status !== 'Pending' || ! $this->appointment_date) {
            return false;
        }

        $openMinutes = (int) config('appointments.check_in_window_open_minutes_before', 60);
        $closeMinutes = (int) config('appointments.check_in_window_close_minutes_before', 30);
        $windowOpen = $this->appointment_date->copy()->subMinutes($openMinutes);
        $windowClose = $this->appointment_date->copy()->subMinutes($closeMinutes);

        return now()->betweenIncluded($windowOpen, $windowClose);
    }

    public function getCanCheckOutAttribute(): bool
    {
        return $this->attendance_status === 'Checked-In';
    }
}
