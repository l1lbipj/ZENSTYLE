<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Allergy extends Model
{
    protected $table = 'allergies';
    protected $primaryKey = 'allergy_id';
    public $timestamps = true;
    protected $fillable = [
        'allergy_name',
    ];

    public function clientAllergies()
    {
        return $this->hasMany(ClientAllergy::class, 'allergy_id', 'allergy_id');
    }

    public function clients()
    {
        return $this->belongsToMany(
            Client::class,
            'client_allergies',
            'allergy_id',
            'client_id',
            'allergy_id',
            'client_id'
        )->withTimestamps();
    }
}
