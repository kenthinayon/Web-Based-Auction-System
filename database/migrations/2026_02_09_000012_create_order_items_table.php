<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('auction_id')->constrained('auctions')->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('winning_bid_id')->nullable()->constrained('bids')->nullOnDelete();

            // bid or buy_now
            $table->string('purchase_type');

            $table->decimal('unit_price', 12, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->unique(['auction_id']);
            $table->index(['order_id', 'seller_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('order_items');
    }
};
