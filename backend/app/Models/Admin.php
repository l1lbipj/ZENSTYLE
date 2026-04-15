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
        'password',
        'status',
    ];
    protected $hidden = [
        'password',
    ];
}
