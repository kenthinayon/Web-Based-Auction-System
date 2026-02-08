<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BidController extends Controller
{
    public function store(Request $request, Auction $auction)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['buyer', 'seller'], true)) {
            return response()->json(['message' => 'Only buyers/sellers can place bids'], 403);
        }

        // Sellers can't bid on their own auctions.
        if ($user->role === 'seller' && (int) $auction->seller_id === (int) $user->id) {
            return response()->json(['message' => 'Sellers cannot bid on their own auctions'], 403);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $now = now();
        if ($auction->status === 'cancelled') {
            return response()->json(['message' => 'Auction cancelled'], 422);
        }

        if ($now->lt($auction->start_time)) {
            return response()->json(['message' => 'Auction not started'], 422);
        }

        if ($now->gte($auction->end_time) || $auction->status === 'ended') {
            return response()->json(['message' => 'Auction ended'], 422);
        }

        return DB::transaction(function () use ($auction, $user, $validated) {
            // Lock bids for integrity
            $lockedAuction = Auction::whereKey($auction->id)->lockForUpdate()->first();
            $current = $lockedAuction->bids()->max('amount') ?? $lockedAuction->starting_price;
            $minAllowed = $current + $lockedAuction->bid_increment;

            if ((float)$validated['amount'] < (float)$minAllowed) {
                return response()->json([
                    'message' => 'Bid too low',
                    'min_allowed' => $minAllowed,
                    'current_bid' => $current,
                ], 422);
            }

            // Prevent consecutive duplicate bid amounts by same bidder (simple MVP anti-spam)
            $lastBid = $lockedAuction->bids()->where('bidder_id', $user->id)->latest()->first();
            if ($lastBid && (float)$lastBid->amount === (float)$validated['amount']) {
                return response()->json(['message' => 'Duplicate bid amount'], 422);
            }

            $bid = Bid::create([
                'auction_id' => $lockedAuction->id,
                'bidder_id' => $user->id,
                'amount' => $validated['amount'],
            ]);

            return response()->json([
                'bid' => $bid,
                'current_bid' => $lockedAuction->bids()->max('amount'),
            ], 201);
        });
    }
}
