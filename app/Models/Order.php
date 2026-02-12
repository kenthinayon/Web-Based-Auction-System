<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'buyer_id',
        'status',
        'delivery_method',
        'meeting_location',
        'meeting_at',
        'payment_method',
        'payment_reference',
        'notes',
        'total_amount',
    ];

    protected $casts = [
        'meeting_at' => 'datetime',
        'total_amount' => 'decimal:2',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
