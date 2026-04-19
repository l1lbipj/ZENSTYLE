<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopOrderItem extends Model
{
    protected $table = 'shop_order_items';
    protected $primaryKey = 'shop_order_item_id';
    public $timestamps = true;

    protected $fillable = [
        'shop_order_id',
        'product_id',
        'unit_price',
        'quantity',
        'line_total',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(ShopOrder::class, 'shop_order_id', 'shop_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}

