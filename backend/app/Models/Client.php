<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $table = 'client';
    protected $primaryKey = 'client_id';
    protected $hidden = ['password'];
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
}
