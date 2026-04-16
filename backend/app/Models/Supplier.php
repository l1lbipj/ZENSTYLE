<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;


class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'supplier';
    protected $primaryKey = 'supplier_id';
    public $timestamps = true;
    protected $fillable = [
        'name',
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

