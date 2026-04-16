<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $table = 'appointment';
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
        return $this->belongsTo(Client::class, 'appointment', 'client_id', 'client_id');
    }

    public function appointmentDetails()
    {
        return $this->hasMany(AppointmentDetail::class, 'appointment', 'appointment_detail_id', 'appointment_id');
    }
}
