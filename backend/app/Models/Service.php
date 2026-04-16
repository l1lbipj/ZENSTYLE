<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $table = 'service';
    protected $primaryKey = 'service_id';
    public $timestamps = true;
    protected $fillable = [
        'service_name',
        'price',
        'duration',
        'description',
        'category_id'
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'service_id', 'service_id');
    }

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id', 'category_id');
    }
}
