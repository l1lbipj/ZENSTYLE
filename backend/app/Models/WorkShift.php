<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkShift extends Model
{
    protected $table = 'work_shifts';
    protected $primaryKey = 'shift_id';
    public $timestamps = true;
    protected $fillable = [
        'shift_name',
    ];

    public function staffSchedules()
    {
        return $this->hasMany(StaffSchedule::class, 'shift_id', 'shift_id');
    }
}
