<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\AuctionImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AuctionController extends Controller
{
    public function index(Request $request)
    {
        $query = Auction::query()
            ->with(['images', 'category'])
            ->withCount('bids');

        // By default, don't show terminated/cancelled auctions in the public browse feed.
        // (Sellers can still see them in My Sales; admins can see via admin endpoints.)
        $query->whereNotIn('status', ['cancelled', 'terminated']);

        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('status')) {
            // If caller explicitly requests a status, allow it (including terminated).
            $query->where('status', $request->string('status'));
        }

        // ending soon
        if ($request->boolean('ending_soon')) {
            $query->orderBy('end_time', 'asc');
        } else {
            $query->latest();
        }

        $auctions = $query->paginate(12);

        // add computed attributes
        $auctions->getCollection()->transform(function (Auction $auction) {
            $auction->current_bid = $auction->current_bid;
            $auction->status_label = $auction->status_label;
            return $auction;
        });

        return response()->json($auctions);
    }

    public function show(Auction $auction)
    {
        $auction->load([
            'images',
            'category',
            'seller:id,name',
            'bids' => function ($q) {
                $q->with('bidder:id,name')->latest();
            },
        ]);

        $auction->current_bid = $auction->current_bid;
        $auction->status_label = $auction->status_label;

        return response()->json($auction);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'seller') {
            return response()->json(['message' => 'Only sellers can create auctions'], 403);
        }

        if (!$user->seller_verified) {
            return response()->json(['message' => 'Seller account pending admin approval'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'starting_price' => ['required', 'numeric', 'min:0'],
            'bid_increment' => ['required', 'numeric', 'min:0.01'],
            'buy_now_price' => ['nullable', 'numeric', 'gt:0'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'images' => ['nullable'],
            'images.*' => ['image', 'max:4096'],
        ]);

        return DB::transaction(function () use ($validated, $request, $user) {
            $auction = Auction::create([
                'seller_id' => $user->id,
                'category_id' => $validated['category_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'starting_price' => $validated['starting_price'],
                'bid_increment' => $validated['bid_increment'],
                'buy_now_price' => $validated['buy_now_price'] ?? null,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'status' => 'upcoming',
            ]);

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $i => $file) {
                    $path = $file->store('auctions', 'public');
                    AuctionImage::create([
                        'auction_id' => $auction->id,
                        'path' => $path,
                        'sort_order' => $i,
                    ]);
                }
            }

            $auction->load(['images', 'category']);
            $auction->current_bid = $auction->current_bid;
            $auction->status_label = $auction->status_label;

            return response()->json($auction, 201);
        });
    }

    public function update(Request $request, Auction $auction)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'seller' || $auction->seller_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // If any bids exist, disallow edits (keeps bid history consistent)
        if ($auction->bids()->exists()) {
            return response()->json(['message' => 'Cannot edit or relist after bidding starts'], 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'starting_price' => ['required', 'numeric', 'min:0'],
            'bid_increment' => ['required', 'numeric', 'min:0.01'],
            'buy_now_price' => ['nullable', 'numeric', 'gt:0'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'images' => ['sometimes', 'array'],
            'images.*' => ['image', 'max:5120'],
        ]);

        $auction->fill([
            'title' => $validated['title'],
            'category_id' => $validated['category_id'],
            'description' => $validated['description'] ?? null,
            'starting_price' => $validated['starting_price'],
            'bid_increment' => $validated['bid_increment'],
            'buy_now_price' => $validated['buy_now_price'] ?? null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);

        // If the auction was previously ended/terminated/cancelled, treat this update as a "relist".
        // This makes it show again in Browse once start_time/end_time are updated.
        if (in_array($auction->status, ['ended', 'terminated', 'cancelled'], true)) {
            $auction->status = 'upcoming';
            $auction->winning_bid_id = null;
        }
        $auction->save();

        // If new images were uploaded, append them.
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $i => $file) {
                $path = $file->store('auctions', 'public');
                AuctionImage::create([
                    'auction_id' => $auction->id,
                    'path' => $path,
                    'sort_order' => $i,
                ]);
            }
        }

        $auction->load(['images', 'category']);
        $auction->current_bid = $auction->current_bid;
        $auction->status_label = $auction->status_label;

        return response()->json($auction);
    }

    public function cancel(Request $request, Auction $auction)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'seller' || $auction->seller_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($auction->bids()->exists()) {
            return response()->json(['message' => 'Cannot cancel after bidding starts'], 422);
        }

        $auction->status = 'cancelled';
        $auction->save();

        return response()->json(['message' => 'Auction cancelled']);
    }

    /**
     * Seller terminate: immediately stop the auction and hide it from public browse.
     * We only allow this when there are no bids (same rule as cancel/delete) to keep history consistent.
     */
    public function terminate(Request $request, Auction $auction)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'seller' || $auction->seller_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($auction->bids()->exists() || $auction->winning_bid_id) {
            return response()->json(['message' => 'Cannot terminate an auction that has bids or is sold'], 422);
        }

        $auction->status = 'terminated';
        $auction->save();

        return response()->json(['message' => 'Auction terminated']);
    }

    /**
     * Seller delete: soft-delete listing so it disappears from My Sales and public browse,
     * but remains in seller history/admin records.
     */
    public function destroy(Request $request, Auction $auction)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'seller' || $auction->seller_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // If any bids exist, disallow deletes (keeps bid/order history consistent)
        if ($auction->bids()->exists() || $auction->winning_bid_id) {
            return response()->json(['message' => 'Cannot delete an auction that has bids or is sold'], 422);
        }

        $auction->seller_deleted = true;
        $auction->seller_deleted_at = now();
        $auction->save();

        return response()->json(['message' => 'Auction moved to history']);
    }

    
}
