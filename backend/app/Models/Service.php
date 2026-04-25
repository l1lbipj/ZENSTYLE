<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $table = 'services';
    protected $primaryKey = 'service_id';
    public $timestamps = true;
    protected $fillable = [
        'service_name',
        'price',
        'duration',
        'description',
        'category_id'
    ];

    public function appointmentDetails(): HasMany
    {
        return $this->hasMany(AppointmentDetail::class, 'service_id', 'service_id');
    }

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id', 'category_id');
    }
}
