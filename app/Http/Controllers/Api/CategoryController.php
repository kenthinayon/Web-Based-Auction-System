<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        // Always return a plain array (not a paginator object) so the React header can safely map.
        $categories = Category::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }
}
