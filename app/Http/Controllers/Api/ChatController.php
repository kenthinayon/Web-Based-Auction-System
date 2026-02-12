<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /**
     * List chats for the logged-in user.
     * Supports ?auction_id= to narrow.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $query = Chat::query()
            ->with([
                'auction:id,title,status,start_time,end_time,seller_id',
                'buyer:id,name',
                'seller:id,name',
            ])
            ->withCount('messages')
            ->orderByDesc('last_message_at');

        if ($request->filled('auction_id')) {
            $query->where('auction_id', $request->integer('auction_id'));
        }

        $query->where(function ($q) use ($user) {
            $q->where('buyer_id', $user->id)->orWhere('seller_id', $user->id);
        });

        $chats = $query->get();

        return response()->json($chats);
    }

    /**
     * Create or fetch a chat for an auction between buyer and seller.
     * Only available while auction is active.
     */
    public function start(Request $request, Auction $auction)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Only allow for active auctions.
        if (($auction->status ?? '') !== 'active') {
            return response()->json(['message' => 'Chat is only available while the auction is active.'], 422);
        }

        // Buyer must not be the seller.
        if ((int) $auction->seller_id === (int) $user->id) {
            return response()->json(['message' => 'Sellers cannot start a buyer chat on their own item.'], 422);
        }

        $buyerId = $user->id;
        $sellerId = $auction->seller_id;

        $chat = Chat::firstOrCreate([
            'auction_id' => $auction->id,
            'buyer_id' => $buyerId,
            'seller_id' => $sellerId,
        ]);

        $chat->load(['auction', 'buyer:id,name', 'seller:id,name']);

        return response()->json($chat, 201);
    }

    /**
     * Fetch messages for a chat.
     */
    public function messages(Request $request, Chat $chat)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ((int) $chat->buyer_id !== (int) $user->id && (int) $chat->seller_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $messages = Message::query()
            ->where('chat_id', $chat->id)
            ->with('sender:id,name')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'chat' => $chat->load(['auction:id,title,status', 'buyer:id,name', 'seller:id,name']),
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message (text and/or optional image attachment).
     */
    public function send(Request $request, Chat $chat)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ((int) $chat->buyer_id !== (int) $user->id && (int) $chat->seller_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Enforce "only while active" based on auction status.
        $auction = Auction::find($chat->auction_id);
        if (!$auction || ($auction->status ?? '') !== 'active') {
            return response()->json(['message' => 'Chat is only available while the auction is active.'], 422);
        }

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'max:4096'],
        ]);

        if (empty($validated['body']) && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'Message is empty.'], 422);
        }

        return DB::transaction(function () use ($request, $chat, $user, $validated) {
            $path = null;
            $type = null;

            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $path = $file->store('chat', 'public');
                $type = str_starts_with($file->getMimeType(), 'image/') ? 'image' : 'file';
            }

            $msg = Message::create([
                'chat_id' => $chat->id,
                'sender_id' => $user->id,
                'body' => $validated['body'] ?? null,
                'attachment_path' => $path,
                'attachment_type' => $type,
            ]);

            $chat->last_message_at = now();
            $chat->save();

            $msg->load('sender:id,name');

            return response()->json($msg, 201);
        });
    }

    /**
     * Mark messages as read (simple read receipt).
     */
    public function markRead(Request $request, Chat $chat)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ((int) $chat->buyer_id !== (int) $user->id && (int) $chat->seller_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        Message::query()
            ->where('chat_id', $chat->id)
            ->whereNull('read_at')
            ->where('sender_id', '!=', $user->id)
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read']);
    }
}
