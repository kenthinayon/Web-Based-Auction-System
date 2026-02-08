<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('seller_verified');
            $table->timestamp('banned_at')->nullable()->after('is_active');
            $table->index(['is_active', 'banned_at']);
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_active', 'banned_at']);
            $table->dropColumn(['is_active', 'banned_at']);
        });
    }
};
