<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Client extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'client';
    protected $primaryKey = 'client_id';
    //public $incrementing = true;
    //protected $keyType = 'int';
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
}
