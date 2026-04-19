<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffSchedule extends Model
{
    protected $table = 'staff_schedules';
    protected $primaryKey = 'schedule_id';
    public $timestamps = true;
    protected $fillable = [
        'staff_id',
        'date',
        'check_in',
        'check_out',
        'actual_check_in',
        'actual_check_out',
        'shift_id',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    public function shift()
    {
        return $this->belongsTo(WorkShift::class, 'shift_id', 'shift_id');
    }
}
