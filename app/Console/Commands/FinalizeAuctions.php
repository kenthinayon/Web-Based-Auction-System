<?php

namespace App\Console\Commands;

use App\Models\Auction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FinalizeAuctions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * Options:
     *  --dry-run : don't modify data, just report counts
     */
    protected $signature = 'auctions:finalize {--dry-run : Do not modify data}';

    /**
     * The console command description.
     */
    protected $description = 'Finalize ended auctions: pick winning bid, mark ended, and terminate no-bid auctions.';

    public function handle(): int
    {
        $now = now();
        $dry = (bool) $this->option('dry-run');

        $endedQuery = Auction::query()
            ->where('status', '!=', 'cancelled')
            ->where('end_time', '<=', $now)
            ->where(function ($q) {
                // finalize anything not already ended/terminated
                $q->whereNull('status')
                    ->orWhereNotIn('status', ['ended', 'terminated']);
            });

        $endedCount = (clone $endedQuery)->count();
        if ($endedCount === 0) {
            $this->info('No auctions to finalize.');
            return self::SUCCESS;
        }

        $terminated = 0;
        $ended = 0;

        $endedQuery->orderBy('id')->chunkById(200, function ($auctions) use ($dry, &$terminated, &$ended) {
            foreach ($auctions as $auction) {
                DB::transaction(function () use ($auction, $dry, &$terminated, &$ended) {
                    $locked = Auction::whereKey($auction->id)->lockForUpdate()->first();

                    if ($locked->status === 'cancelled' || $locked->status === 'ended' || $locked->status === 'terminated') {
                        return;
                    }

                    $topBid = $locked->bids()->orderByDesc('amount')->orderBy('id')->first();

                    if (!$topBid) {
                        if ($dry) {
                            $terminated++;
                            return;
                        }
                        $locked->status = 'terminated';
                        $locked->winning_bid_id = null;
                        $locked->save();
                        $terminated++;
                        return;
                    }

                    if ($dry) {
                        $ended++;
                        return;
                    }

                    $locked->status = 'ended';
                    $locked->winning_bid_id = $topBid->id;
                    $locked->save();
                    $ended++;
                });
            }
        });

        $this->info("Finalized {$endedCount} auctions. ended={$ended}, terminated(no bids)={$terminated}" . ($dry ? ' (dry-run)' : ''));
        return self::SUCCESS;
    }
}
