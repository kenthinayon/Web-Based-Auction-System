<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    private function requireAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'super_admin'], true)) {
            abort(403, 'Admin only');
        }
        return $user;
    }

    public function stats(Request $request)
    {
        $this->requireAdmin($request);

        return response()->json([
            'total_auctions' => Auction::count(),
            'active_auctions' => Auction::where('status', 'active')->count(),
            'completed_auctions' => Auction::where('status', 'ended')->count(),
            'total_users' => User::count(),
        ]);
    }

    public function users(Request $request)
    {
        $this->requireAdmin($request);

        return response()->json(
            User::query()
                ->select('id', 'name', 'email', 'role', 'seller_verified', 'is_active', 'banned_at', 'created_at')
                ->latest()
                ->paginate(20)
        );
    }

    public function updateUserRole(Request $request, User $user)
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'role' => ['required', 'in:buyer,seller,admin,super_admin'],
        ]);

        $user->role = $validated['role'];
        $user->save();

        return response()->json(['user' => $user]);
    }

    public function setUserActive(Request $request, User $user)
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $user->is_active = (bool) $validated['is_active'];
        $user->save();

        return response()->json(['user' => $user]);
    }

    public function banUser(Request $request, User $user)
    {
        $this->requireAdmin($request);
        $user->banned_at = now();
        $user->is_active = false;
        $user->save();

        return response()->json(['user' => $user]);
    }

    public function unbanUser(Request $request, User $user)
    {
        $this->requireAdmin($request);
        $user->banned_at = null;
        $user->is_active = true;
        $user->save();

        return response()->json(['user' => $user]);
    }

    public function verifySeller(Request $request, User $user)
    {
        $this->requireAdmin($request);

        if ($user->role !== 'seller') {
            return response()->json(['message' => 'User is not a seller'], 422);
        }

        $validated = $request->validate([
            'seller_verified' => ['required', 'boolean'],
        ]);

        $user->seller_verified = (bool) $validated['seller_verified'];
        $user->save();

        return response()->json(['user' => $user]);
    }

    public function auctions(Request $request)
    {
        $this->requireAdmin($request);

        $auctions = Auction::query()
            ->with(['seller:id,name', 'category:id,name'])
            ->latest()
            ->paginate(20);

        return response()->json($auctions);
    }

    public function removeAuction(Request $request, Auction $auction)
    {
        $this->requireAdmin($request);

        $auction->delete();
        return response()->json(['message' => 'Auction removed']);
    }
}
