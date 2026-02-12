<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMessagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();

            $table->text('body')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_type')->nullable(); // image, file

            $table->timestamp('read_at')->nullable();

            $table->boolean('is_flagged')->default(false);
            $table->string('flag_reason')->nullable();
            $table->timestamps();

            $table->index(['chat_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('messages');
    }
}
