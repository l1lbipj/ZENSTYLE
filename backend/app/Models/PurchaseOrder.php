<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $table = 'purchase_orders';
    protected $primaryKey = 'order_id';
    public $timestamps = true;
    protected $fillable = [
        'supplier_id',
        'order_date',
        'total_amount',
        'status',
        'reference_code',
        'workflow_status',
        'received_at',
        'notes',
    ];

    protected $casts = [
        'order_date' => 'date',
        'received_at' => 'datetime',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class, 'order_id', 'order_id');
    }
}
