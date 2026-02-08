<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default management accounts.
        // NOTE: passwords are hashed; you log in with the plain-text values below.

        User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'role' => 'super_admin',
                'password' => bcrypt('password123'),
            ]
        );

        // Requested admin account
        User::updateOrCreate(
            ['email' => 'admin123@example.com'],
            [
                'name' => 'admin123',
                'role' => 'admin',
                'password' => bcrypt('qwerty123'),
            ]
        );
    }
}
//     public function logout(Request $request)