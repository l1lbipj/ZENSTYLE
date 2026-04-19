<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientStaffReference extends Model
{
    protected $table = 'client_staff_preferences';
    protected $primaryKey = 'preference_id';
    public $timestamps = true;
    protected $fillable = [
        'client_id',
        'staff_id',
        'note'
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }
}
