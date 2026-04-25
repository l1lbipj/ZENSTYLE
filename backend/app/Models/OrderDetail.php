<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDetail extends Model
{
    protected $table = 'order_details';
    protected $primaryKey = 'detail_id';
    public $timestamps = true;
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'import_price',
        'received_quantity',
    ];

    public function order()
    {
        return $this->belongsTo(PurchaseOrder::class, 'order_id', 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
