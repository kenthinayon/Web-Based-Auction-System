<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;

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

        // Default auction categories
        $defaultCategories = [
            'Electronics',
            'Fashion & Apparel',
            'Collectibles',
            'Home & Living',
            'Vehicles',
            'Jewelry & Watches',
            'Art',
            'Books & Media',
        ];

        foreach ($defaultCategories as $name) {
            Category::updateOrCreate(['name' => $name]);
        }
    }
}
//     public function logout(Request $request)