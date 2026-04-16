<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Client extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $table = 'client';
    protected $primaryKey = 'client_id';
    public $timestamps = true;
    protected $fillable = [
        'client_name',
        'phone',
        'email',
        'password',
        'dob',
        'status',
        'membership_point',
        'membership_tier',
    ];

    protected $hidden = [
        'password',
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'client', 'client_id', 'appointment_id');
    }

    public function clientAllergies()
    {
        return $this->hasMany(ClientAllergy::class, 'client_allergy', 'client_id', 'client_allergy_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class, 'client_id', 'client_id');
    }
}
