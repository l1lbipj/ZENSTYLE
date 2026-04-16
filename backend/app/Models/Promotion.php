<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $table = 'promotion';
    protected $primaryKey = 'promotion_id';
    public $timestamps = true;
    protected $fillable = [
        'promotion_name',
        'description',
        'discount_percentage',
        'start_date',
        'end_date',
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'promotion', 'promotion_id', 'promotion_id');
    }
}
