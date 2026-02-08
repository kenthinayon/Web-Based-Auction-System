<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->foreign('winning_bid_id')
                ->references('id')
                ->on('bids')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->dropForeign(['winning_bid_id']);
        });
    }
};
