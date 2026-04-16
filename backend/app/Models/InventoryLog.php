<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    protected $table = 'inventory_log';
    protected $primaryKey = 'log_id';
    public $timestamps = true;
    protected $fillable = [
        'product_id',
        'change_amount',
        'change_type',
        'notes',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'inventory_log', 'product_id', 'product_id');
    }
}
