<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $table = 'promotions';
    protected $primaryKey = 'promotion_id';
    public $timestamps = true;
    protected $fillable = [
        'apply_type',
        'service_id',
        'percent',
        'promotion_code',
        'expiration_date',
        'usage_limit',
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'promotion_id', 'promotion_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id', 'service_id');
    }
}
