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
        'status',
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
}
