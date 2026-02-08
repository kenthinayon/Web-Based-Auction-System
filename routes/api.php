<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuctionController;
use App\Http\Controllers\Api\BidController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
// Public catalog
Route::get('/categories', [CategoryController::class, 'index']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->get('/me', [AuthController::class, 'me']);

// Auctions (public)
Route::get('/auctions', [AuctionController::class, 'index']);
Route::get('/auctions/{auction}', [AuctionController::class, 'show']);

// Auctions (seller)
Route::middleware('auth:sanctum')->post('/auctions', [AuctionController::class, 'store']);
Route::middleware('auth:sanctum')->put('/auctions/{auction}', [AuctionController::class, 'update']);
Route::middleware('auth:sanctum')->post('/auctions/{auction}/cancel', [AuctionController::class, 'cancel']);

// Bids (bidder)
Route::middleware('auth:sanctum')->post('/auctions/{auction}/bids', [BidController::class, 'store']);

// Admin
Route::middleware('auth:sanctum')->get('/admin/stats', [AdminController::class, 'stats']);
Route::middleware('auth:sanctum')->get('/admin/users', [AdminController::class, 'users']);
Route::middleware('auth:sanctum')->put('/admin/users/{user}/role', [AdminController::class, 'updateUserRole']);
Route::middleware('auth:sanctum')->put('/admin/users/{user}/active', [AdminController::class, 'setUserActive']);
Route::middleware('auth:sanctum')->post('/admin/users/{user}/ban', [AdminController::class, 'banUser']);
Route::middleware('auth:sanctum')->post('/admin/users/{user}/unban', [AdminController::class, 'unbanUser']);
Route::middleware('auth:sanctum')->put('/admin/users/{user}/verify-seller', [AdminController::class, 'verifySeller']);
Route::middleware('auth:sanctum')->get('/admin/auctions', [AdminController::class, 'auctions']);
Route::middleware('auth:sanctum')->delete('/admin/auctions/{auction}', [AdminController::class, 'removeAuction']);
