<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuctionImage extends Model
{
    use HasFactory;

    protected $fillable = ['auction_id', 'path', 'sort_order'];

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }
}
