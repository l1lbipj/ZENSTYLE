<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Allergy extends Model
{
    protected $table = 'allergy';
    protected $primaryKey = 'allergy_id';
    public $timestamps = true;
    protected $fillable = [
        'allergy_name',
    ];

    public function clients()
    {
        return $this->belongsToMany(ClientAllergy::class, 'client_allergy', 'allergy_id', 'client_allergy_id');
    }
}
