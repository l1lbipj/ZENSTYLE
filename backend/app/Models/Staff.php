<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Staff extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $table = 'staff';
    protected $primaryKey = 'staff_id';
    public $timestamps = true;
    protected $fillable = [
        'staff_name',
        'specialization',
        'phone',
        'email',
        'password',
        'image_data',
        'dob',
        'status',
    ];
    protected $hidden = [
        'password',
    ];

    public function clientStaffReferences()
    {
        return $this->hasMany(ClientStaffReference::class, 'staff_id', 'staff_id');
    }

    public function appointmentDetails()
    {
        return $this->hasMany(AppointmentDetail::class, 'staff_id', 'staff_id');
    }

    public function staffSchedules()
    {
        return $this->hasMany(StaffSchedule::class, 'staff_id', 'staff_id');
    }
}
