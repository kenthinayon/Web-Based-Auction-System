<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController; // Adjust to your controller

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

Route::post('/login', [AuthController::class, 'login']);


Route::get('/dashboard', function () {
    return response()->json([
        'user' => 'Bronny',
        'totalStudents' => 2847,
        'totalFaculty' => 178,
        'activeCourses' => 294,
        'programs' => 9,
        'facultyPerDept' => 19,
        'programOverview' => [
            [
                'name' => 'Computer Studies Program (CSP)',
                'progress' => 88,
            ],
            [
                'name' => 'Nursing Program',
                'progress' => 92,
            ],
        ],
    ]);
});
