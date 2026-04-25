<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerOrderItem extends Model
{
    protected $table = 'customer_order_items';
    protected $primaryKey = 'customer_order_item_id';

    protected $fillable = [
        'customer_order_id',
        'product_id',
        'quantity',
        'line_total',
    ];

    protected $casts = [
        'line_total' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(CustomerOrder::class, 'customer_order_id', 'customer_order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
