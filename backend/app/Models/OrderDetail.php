<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDetail extends Model
{
    protected $table = 'order_detail';
    protected $primaryKey = 'order_detail_id';
    public $timestamps = true;
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'import_price',
    ];

    public function order()
    {
        return $this->belongsTo(PurchaseOrder::class, 'order_detail', 'order_id', 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'order_detail', 'product_id', 'product_id');
    }
}
