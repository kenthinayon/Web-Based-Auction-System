<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'sender_id',
        'body',
        'attachment_path',
        'attachment_type',
        'read_at',
        'is_flagged',
        'flag_reason',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'is_flagged' => 'boolean',
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
