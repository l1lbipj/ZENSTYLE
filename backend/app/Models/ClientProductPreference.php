<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientProductPreference extends Model
{
    protected $table = 'client_product_preferences';
    protected $primaryKey = 'preference_id';
    public $timestamps = true;
    protected $fillable = [
        'client_id',
        'product_id',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
