<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Admin extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'admins';
    protected $primaryKey = 'admin_id';
    public $timestamps = true;
    protected $fillable = [
        'admin_name',
        'email',
        'phone',
        'dob',
        'password',
        'status',
    ];
    protected $casts = [
        'dob' => 'date',
    ];
    protected $hidden = [
        'password',
    ];
}
