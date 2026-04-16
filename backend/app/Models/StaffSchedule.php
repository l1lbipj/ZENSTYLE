<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffSchedule extends Model
{
    protected $table = 'staff_schedule';
    protected $primaryKey = 'staff_schedule_id';
    public $timestamps = true;
    protected $fillable = [
        'staff_id',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_schedule', 'staff_id', 'staff_id');
    }
}
