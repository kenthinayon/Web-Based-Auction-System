<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();

            // pending, placed, cancelled, completed
            $table->string('status')->default('pending');

            // meetup or delivery (future)
            $table->string('delivery_method')->default('meetup');
            $table->text('meeting_location')->nullable();
            $table->dateTime('meeting_at')->nullable();

            // cod, bank_transfer, gcash
            $table->string('payment_method')->default('cod');
            $table->string('payment_reference')->nullable();

            $table->text('notes')->nullable();
            $table->decimal('total_amount', 12, 2)->default(0);

            $table->timestamps();

            $table->index(['buyer_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('orders');
    }
};
