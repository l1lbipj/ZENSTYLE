<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientAllergy extends Model
{
    protected $table = 'client_allergy';
    protected $primaryKey = 'client_allergy_id';
    public $timestamps = true;
    protected $fillable = [
        'client_id',
        'allergy_id',
    ];
    
    public function client()
    {
        return $this->belongsTo(Client::class, 'client_allergy', 'client_id', 'client_id');
    }

    public function allergy()
    {
        return $this->belongsTo(Allergy::class, 'client_allergy', 'allergy_id', 'allergy_id');
    }

}
