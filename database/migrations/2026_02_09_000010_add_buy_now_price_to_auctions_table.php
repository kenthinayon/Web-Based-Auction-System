<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('auctions', function (Blueprint $table) {
            if (!Schema::hasColumn('auctions', 'buy_now_price')) {
                $table->decimal('buy_now_price', 12, 2)->nullable()->after('bid_increment');
            }
        });
    }

    public function down()
    {
        Schema::table('auctions', function (Blueprint $table) {
            if (Schema::hasColumn('auctions', 'buy_now_price')) {
                $table->dropColumn('buy_now_price');
            }
        });
    }
};
