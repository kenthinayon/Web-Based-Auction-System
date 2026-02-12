<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'auction_id',
        'seller_id',
        'winning_bid_id',
        'purchase_type',
        'unit_price',
        'quantity',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'int',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function winningBid()
    {
        return $this->belongsTo(Bid::class, 'winning_bid_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
