<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'product';
    protected $primaryKey = 'product_id';
    public $timestamps = true;
    protected $fillable = [
        'product_name',
        'stock_quantity',
        'unit_price',
        'reorder_level',
        'min_stock_level'
    ];

    public function inventoryLogs()
    {
        return $this->hasMany(InventoryLog::class, 'inventory_log', 'product_id', 'product_id');    
    }
}
