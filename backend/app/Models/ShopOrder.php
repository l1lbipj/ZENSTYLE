<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShopOrder extends Model
{
    protected $table = 'shop_orders';
    protected $primaryKey = 'shop_order_id';
    public $timestamps = true;

    protected $fillable = [
        'client_id',
        'customer_name',
        'customer_phone',
        'shipping_address',
        'note',
        'status',
        'payment_method',
        'currency',
        'subtotal',
        'shipping_fee',
        'discount_amount',
        'total_amount',
        'promo_code',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id', 'client_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ShopOrderItem::class, 'shop_order_id', 'shop_order_id');
    }
}

