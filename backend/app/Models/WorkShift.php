<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkShift extends Model
{
    protected $table = 'work_shift';
    protected $primaryKey = 'shift_id';
    public $timestamps = true;
    protected $fillable = [
        'shift_name',
        'start_time',
        'end_time',
    ];

    public function staffSchedule()
    {
        return $this->belongsTo(StaffSchedule::class, 'work_shift', 'shift_id', 'schedule_id');
    }
}
