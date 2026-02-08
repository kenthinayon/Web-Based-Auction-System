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
            'category_id' => ['nullable', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'starting_price' => ['required', 'numeric', 'min:0'],
            'bid_increment' => ['required', 'numeric', 'min:0.01'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'images' => ['nullable'],
            'images.*' => ['image', 'max:4096'],
        ]);

        return DB::transaction(function () use ($validated, $request, $user) {
            $auction = Auction::create([
                'seller_id' => $user->id,
                'category_id' => $validated['category_id'] ?? null,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'starting_price' => $validated['starting_price'],
                'bid_increment' => $validated['bid_increment'],
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

        // If any bids exist OR auction is active/ended, disallow edits (MVP rule)
        if ($auction->bids()->exists()) {
            return response()->json(['message' => 'Cannot edit after bidding starts'], 422);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['sometimes', 'nullable', 'exists:categories,id'],
            'description' => ['sometimes', 'nullable', 'string'],
            'starting_price' => ['sometimes', 'numeric', 'min:0'],
            'bid_increment' => ['sometimes', 'numeric', 'min:0.01'],
            'start_time' => ['sometimes', 'date'],
            'end_time' => ['sometimes', 'date', 'after:start_time'],
        ]);

        $auction->fill($validated);
        $auction->save();

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
}
