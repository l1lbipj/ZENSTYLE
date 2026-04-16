<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientProductReference extends Model
{
    protected $table = 'client_product_reference';
    protected $primaryKey = 'client_product_reference_id';
    public $timestamps = true;
    protected $fillable = [
        'client_id',
        'product_id',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_product_reference', 'client_id', 'client_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'client_product_reference', 'product_id', 'product_id');
    }
}
