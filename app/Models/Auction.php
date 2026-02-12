<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Auction extends Model
{
    use HasFactory;

    protected $fillable = [
        'seller_id',
        'category_id',
        'title',
        'description',
        'starting_price',
        'bid_increment',
        'buy_now_price',
        'start_time',
        'end_time',
        'status',
        'winning_bid_id',
        'seller_deleted',
        'seller_deleted_at',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'starting_price' => 'decimal:2',
        'bid_increment' => 'decimal:2',
        'buy_now_price' => 'decimal:2',
        'seller_deleted' => 'bool',
        'seller_deleted_at' => 'datetime',
    ];

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(AuctionImage::class);
    }

    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    public function winningBid()
    {
        return $this->belongsTo(Bid::class, 'winning_bid_id');
    }

    public function getCurrentBidAttribute()
    {
        // current highest bid, or starting price if no bids
        $highest = $this->bids()->max('amount');
        return $highest ?? $this->starting_price;
    }

    public function getStatusLabelAttribute()
    {
        $now = now();
        if ($this->status === 'cancelled') return 'Cancelled';
        if ($now->lt($this->start_time)) return 'Upcoming';
        if ($now->between($this->start_time, $this->end_time) && $this->status !== 'ended') return 'Active';
        return 'Ended';
    }
}
