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
        'dob',
        'status',
    ];
    protected $hidden = [
        'password',
    ];
}
