<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Supplier extends Model
{
    use HasFactory;

    protected $table = 'suppliers';
    protected $primaryKey = 'supplier_id';
    public $timestamps = true;
    protected $fillable = [
        'supplier_name',
        'email',
        'phone',
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'supplier_id', 'supplier_id');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_id', 'supplier_id');
    }

}
