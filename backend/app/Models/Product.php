<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Product extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'product_id';
    public $timestamps = true;
    protected $fillable = [
        'product_name',
        'category',
        'description',
        'image_url',
        'stock_quantity',
        'unit_price',
        'reorder_level',
        'min_stock_level'
    ];

    public function inventoryLogs()
    {
        return $this->hasMany(InventoryLog::class, 'product_id', 'product_id');
    }

    public function appointmentDetails(): MorphMany
    {
        return $this->morphMany(AppointmentDetail::class, 'item', 'item_type', 'item_id');
    }
}
