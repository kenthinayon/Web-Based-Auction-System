<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * List the current buyer's orders (pending + placed).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Buyers only for now.
        if ($user->role !== 'buyer' && $user->role !== 'seller') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $orders = Order::query()
            ->where('buyer_id', $user->id)
            ->with(['items.auction.images', 'items.auction.category'])
            ->latest()
            ->get();

        return response()->json($orders);
    }

    /**
     * Create (or reuse) a pending order and add an auction win into it.
     *
     * Inputs:
     * - auction_id
     * - purchase_type: bid | buy_now
     */
    public function addItem(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'auction_id' => ['required', 'exists:auctions,id'],
            'purchase_type' => ['required', 'in:bid,buy_now'],
        ]);

        $auction = Auction::with(['images', 'category'])->findOrFail($validated['auction_id']);

        // Must be ended and have a winner.
        if ($auction->status !== 'ended' || !$auction->winning_bid_id) {
            return response()->json(['message' => 'This auction is not ready for checkout yet.'], 422);
        }

        // Buyer must be the winning bidder.
        $winningBid = $auction->winningBid()->first();
        if (!$winningBid || (int) $winningBid->bidder_id !== (int) $user->id) {
            return response()->json(['message' => 'Only the winning buyer can checkout this item.'], 403);
        }

        return DB::transaction(function () use ($user, $auction, $winningBid, $validated) {
            $order = Order::firstOrCreate(
                ['buyer_id' => $user->id, 'status' => 'pending'],
                ['payment_method' => 'cod', 'delivery_method' => 'meetup']
            );

            // One auction can only exist in one order item.
            $existing = OrderItem::where('auction_id', $auction->id)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'This item is already in an order.',
                    'order_id' => $existing->order_id,
                ], 200);
            }

            $price = (float) $winningBid->amount;

            $item = OrderItem::create([
                'order_id' => $order->id,
                'auction_id' => $auction->id,
                'seller_id' => $auction->seller_id,
                'winning_bid_id' => $winningBid->id,
                'purchase_type' => $validated['purchase_type'],
                'unit_price' => $price,
                'quantity' => 1,
            ]);

            // Recompute total
            $total = (float) OrderItem::where('order_id', $order->id)->sum('unit_price');
            $order->total_amount = $total;
            $order->save();

            $order->load(['items.auction.images', 'items.auction.category']);

            return response()->json([
                'message' => 'Added to checkout.',
                'order' => $order,
                'item' => $item,
            ], 201);
        });
    }

    /**
     * Place an order: set meetup/payment details.
     */
    public function place(Request $request, Order $order)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ((int) $order->buyer_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order is not pending.'], 422);
        }

        $validated = $request->validate([
            'delivery_method' => ['required', 'in:meetup'],
            'meeting_location' => ['required', 'string', 'max:500'],
            'meeting_at' => ['required', 'date'],
            'payment_method' => ['required', 'in:cod,bank_transfer,gcash'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $order->fill([
            'delivery_method' => $validated['delivery_method'],
            'meeting_location' => $validated['meeting_location'],
            'meeting_at' => $validated['meeting_at'],
            'payment_method' => $validated['payment_method'],
            'payment_reference' => $validated['payment_reference'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => 'placed',
        ]);
        $order->save();

        $order->load(['items.auction.images', 'items.auction.category']);

        return response()->json([
            'message' => 'Order placed.',
            'order' => $order,
        ]);
    }
}
