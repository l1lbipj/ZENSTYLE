<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $table = 'feedback';
    protected $primaryKey = 'feedback_id';
    public $timestamps = true;
    protected $fillable = [
        'appointment_id',
        'rating',
        'notes',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'feedback', 'appointment_id', 'appointment_id');
    }
}
