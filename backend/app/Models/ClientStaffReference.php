<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientStaffReference extends Model
{
    protected $table = 'client_staff_reference';
    protected $primaryKey = 'client_staff_reference_id';
    public $timestamps = true;
    protected $fillable = [
        'client_id',
        'staff_id',
        'notes'
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_staff_reference', 'client_id', 'client_id');
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'client_staff_reference', 'staff_id', 'staff_id');
    }
}
