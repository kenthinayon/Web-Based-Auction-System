<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    use HasFactory;

    protected $fillable = ['auction_id', 'bidder_id', 'amount'];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function bidder()
    {
        return $this->belongsTo(User::class, 'bidder_id');
    }
}
