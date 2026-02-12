<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'auction_id',
        'buyer_id',
        'seller_id',
        'buyer_archived',
        'seller_archived',
        'is_flagged',
        'flag_reason',
        'last_message_at',
    ];

    protected $casts = [
        'buyer_archived' => 'boolean',
        'seller_archived' => 'boolean',
        'is_flagged' => 'boolean',
        'last_message_at' => 'datetime',
    ];

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
