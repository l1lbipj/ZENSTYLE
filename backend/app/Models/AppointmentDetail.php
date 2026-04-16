<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentDetail extends Model
{
    protected $table = 'appointment_detail';
    protected $primaryKey = 'appointment_detail_id';
    public $timestamps = true;
    protected $fillable = [
        'appointment_id',
        'staff_id',
        'item_type',
        'service_id',
        'product_id',
        'quantity',
        'total_price',
        'start_time',
        'end_time',
        'status'
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_detail_id', 'appointment_id');
    }


}
