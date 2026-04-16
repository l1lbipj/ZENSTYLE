<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $table = 'purchase_order';
    protected $primaryKey = 'order_id';
    public $timestamps = true;
    protected $fillable = [
        'supplier_id',
        'order_date',
        'total_amount',
        'status',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'purchase_order', 'supplier_id', 'supplier_id');
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class, 'order_detail', 'order_id', 'order_id');
    }
}
