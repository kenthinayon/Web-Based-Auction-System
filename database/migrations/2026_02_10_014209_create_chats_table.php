<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateChatsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('auction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();

            $table->boolean('buyer_archived')->default(false);
            $table->boolean('seller_archived')->default(false);

            // moderation / safety
            $table->boolean('is_flagged')->default(false);
            $table->string('flag_reason')->nullable();

            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->unique(['auction_id', 'buyer_id', 'seller_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('chats');
    }
}
