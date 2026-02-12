<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            $table->decimal('starting_price', 12, 2);
            $table->decimal('bid_increment', 12, 2)->default(1);

            // Optional: direct claim / buy-now amount
            $table->decimal('buy_now_price', 12, 2)->nullable();

            $table->dateTime('start_time');
            $table->dateTime('end_time');

            // status: upcoming, active, ended, cancelled, terminated
            $table->string('status')->default('upcoming');

            // Seller deletion / history: keep record but hide from public + active seller lists
            $table->boolean('seller_deleted')->default(false);
            $table->timestamp('seller_deleted_at')->nullable();

            // Set after auction ends; foreign key is added in a later migration.
            $table->unsignedBigInteger('winning_bid_id')->nullable();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('auctions');
    }
};
