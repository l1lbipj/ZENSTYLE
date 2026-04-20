<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Client extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $table = 'clients';
    protected $primaryKey = 'client_id';
    public $timestamps = true;
    protected $fillable = [
        'client_name',
        'phone',
        'email',
        'password',
        'image_data',
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
        return $this->hasMany(Appointment::class, 'client_id', 'client_id');
    }

    public function clientAllergies()
    {
        return $this->hasMany(ClientAllergy::class, 'client_id', 'client_id');
    }

    public function allergies()
    {
        return $this->belongsToMany(
            Allergy::class,
            'client_allergies',
            'client_id',
            'allergy_id',
            'client_id',
            'allergy_id'
        )->withTimestamps();
    }

    public function clientProductPreferences()
    {
        return $this->hasMany(ClientProductReference::class, 'client_id', 'client_id');
    }

    public function clientStaffPreferences()
    {
        return $this->hasMany(ClientStaffReference::class, 'client_id', 'client_id');
    }

    public function feedbacks()
    {
        return $this->hasManyThrough(
            Feedback::class,
            Appointment::class,
            'client_id',
            'appointment_id',
            'client_id',
            'appointment_id'
        );
    }
}
