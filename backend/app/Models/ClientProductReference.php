<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientProductReference extends Model
{
    protected $table = 'client_product_preferences';
    protected $primaryKey = 'preference_id';
    public $timestamps = true;
    protected $fillable = [
        'client_id',
        'allergy_id',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function allergy()
    {
        return $this->belongsTo(Allergy::class, 'allergy_id', 'allergy_id');
    }
}
