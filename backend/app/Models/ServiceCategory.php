<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceCategory extends Model
{
    protected $table = 'service_categories';
    protected $primaryKey = 'category_id';
    public $timestamps = true;
    protected $fillable = [
        'category_name',
    ];

    public function services()
    {
        return $this->hasMany(Service::class, 'category_id', 'category_id');
    }
}
