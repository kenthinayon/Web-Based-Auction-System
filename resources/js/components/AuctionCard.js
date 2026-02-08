import React from "react";
import { Link } from "react-router-dom";
import Countdown from "./Countdown";
import StatusPill from "./StatusPill";
import { formatMoney } from "../lib/time";

export default function AuctionCard({ auction }) {
    const auctionId = auction?.id;
    const img = auction?.images?.[0]?.path
        ? `/storage/${auction.images[0].path}`
        : "https://via.placeholder.com/640x480?text=Auctify";

    return (
        <div className="auction-card">
            <Link to={auctionId ? `/auctions/${auctionId}` : `/browse`} style={{ textDecoration: "none" }}>
                <img className="auction-card__img" src={img} alt={auction.title} loading="lazy" />
            </Link>

            <div className="auction-card__body">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <h3 className="auction-card__title" title={auction.title}>
                        {auction.title}
                    </h3>
                    <StatusPill label={auction.status_label || auction.status} />
                </div>

                <div className="auction-card__meta">
                    <div>
                        <div className="meta-label">Current Bid</div>
                        <div className="meta-value">{formatMoney(auction.current_bid)}</div>
                    </div>
                    <div>
                        <div className="meta-label">Time Left</div>
                        <Countdown endTime={auction.end_time} />
                    </div>
                    <div>
                        <div className="meta-label">Bids</div>
                        <div className="meta-value">{auction.bids_count ?? auction.bids?.length ?? 0}</div>
                    </div>
                    <div>
                        <div className="meta-label">Min Increment</div>
                        <div className="meta-value">{formatMoney(auction.bid_increment)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
