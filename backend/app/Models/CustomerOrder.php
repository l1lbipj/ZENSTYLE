<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerOrder extends Model
{
    protected $table = 'customer_orders';
    protected $primaryKey = 'customer_order_id';

    protected $fillable = [
        'client_id',
        'promotion_id',
        'order_number',
        'subtotal',
        'discount_amount',
        'final_amount',
        'payment_method',
        'payment_status',
        'order_status',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function items()
    {
        return $this->hasMany(CustomerOrderItem::class, 'customer_order_id', 'customer_order_id');
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class, 'promotion_id', 'promotion_id');
    }
}
