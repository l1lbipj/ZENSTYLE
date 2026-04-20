<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feedback extends Model
{
    protected $table = 'feedback';
    protected $primaryKey = 'feedback_id';
    public $timestamps = true;
    protected $fillable = [
        'appointment_id',
        'customer_id',
        'staff_id',
        'rating',
        'comment',
        'notes',
        'reply',
        'manager_reply',
        'replied_at',
    ];

    protected $casts = [
        'replied_at' => 'datetime',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'customer_id', 'client_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    public function getCommentAttribute($value): ?string
    {
        return $value ?? $this->attributes['notes'] ?? null;
    }

    public function setCommentAttribute($value): void
    {
        $this->attributes['comment'] = $value;
        $this->attributes['notes'] = $value;
    }

    public function getReplyAttribute($value): ?string
    {
        return $value ?? $this->attributes['manager_reply'] ?? null;
    }

    public function setReplyAttribute($value): void
    {
        $this->attributes['reply'] = $value;
        $this->attributes['manager_reply'] = $value;
    }
}
