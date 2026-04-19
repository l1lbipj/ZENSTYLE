<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentDetail extends Model
{
    protected $table = 'appointment_details';
    protected $primaryKey = 'detail_id';
    public $timestamps = true;
    protected $fillable = [
        'appointment_id',
        'staff_id',
        'item_type',
        // New schema (mixed items)
        'item_id',
        'quantity',
        'price',
        // Legacy schema (service_id/product_id + total_price)
        'service_id',
        'product_id',
        'total_price',
        'start_time',
        'end_time',
        'status'
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    // Backward-compatible relationships for old schema (service_id/product_id).
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id', 'service_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function item(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'item_type', 'item_id');
    }
}
