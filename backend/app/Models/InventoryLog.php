<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    protected $table = 'inventory_logs';
    protected $primaryKey = 'log_id';
    public $timestamps = true;
    protected $fillable = [
        'product_id',
        'change_amount',
        'reason',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
