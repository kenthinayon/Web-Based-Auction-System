import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import Countdown from "./Countdown";
import StatusPill from "./StatusPill";
import { formatMoney } from "../lib/time";
import ChatWidget from "./ChatWidget";

export default function AuctionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [auction, setAuction] = useState(null);
    const [selected, setSelected] = useState(0);
    const [bidAmount, setBidAmount] = useState("");
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const load = async () => {
        const res = await api.get(`/auctions/${id}`);
        const data = res.data;
        setAuction(data);
        setSelected(0);
        setNotice("");
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                await load();
            } catch {
                if (alive) setError("Couldn’t load auction.");
            }
        })();

        // near-real-time: polling
        const poll = setInterval(() => {
            load().catch(() => {});
        }, 4000);

        return () => {
            alive = false;
            clearInterval(poll);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!auction) {
        return (
            <div className="auctify-page">
                <div className="auctify-container">
                    {error ? <div className="alert alert--error">{error}</div> : <div className="alert">Loading…</div>}
                </div>
            </div>
        );
    }

    const imgs = auction.images?.length
        ? auction.images.map((x) => `/storage/${x.path}`)
        : ["https://via.placeholder.com/900x700?text=Auctify"];

    const currentBid = Number(auction.current_bid ?? auction.starting_price);
    const increment = Number(auction.bid_increment ?? 1);
    const minNext = currentBid + increment;
    const buyNowPrice = auction.buy_now_price != null ? Number(auction.buy_now_price) : null;

    const isSellerBiddingOwnItem =
        user?.role === "seller" &&
        String(auction?.seller_id ?? auction?.seller?.id ?? "") === String(user?.id ?? "");

    const placeBid = async () => {
        setError("");
        setNotice("");

        if (!user) {
            setError("Please login to place a bid.");
            return;
        }
        if (user.role !== "buyer" && user.role !== "seller") {
            setError("Only buyer/seller accounts can place bids.");
            return;
        }

        if (isSellerBiddingOwnItem) {
            setError("Sellers cannot bid on their own auctions.");
            return;
        }

        const amount = Number(bidAmount);
        if (!amount || Number.isNaN(amount)) {
            setError("Enter a valid bid amount.");
            return;
        }
        if (amount < minNext) {
            setError(`Your bid must be at least ${formatMoney(minNext)}.`);
            return;
        }

        setPlacing(true);
        try {
            await api.post(`/auctions/${auction.id}/bids`, { amount });
            setBidAmount("");
            setNotice("Bid placed! Refreshing...");
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Bid failed.");
        } finally {
            setPlacing(false);
        }
    };

    const buyNow = async () => {
        setError("");
        setNotice("");

        if (!user) {
            setError("Please login to buy now.");
            return;
        }
        if (user.role !== "buyer" && user.role !== "seller") {
            setError("Only buyer/seller accounts can buy now.");
            return;
        }
        if (isSellerBiddingOwnItem) {
            setError("Sellers cannot buy their own auctions.");
            return;
        }
        if (buyNowPrice == null) {
            setError("Buy now is not available for this item.");
            return;
        }

        setPlacing(true);
        try {
            const res = await api.post(`/auctions/${auction.id}/bids`, { amount: buyNowPrice });
            setBidAmount("");
            if (res?.data?.buy_now) {
                setNotice("You grabbed it! Sending you to checkout...");
                // Add to a pending order, then go to checkout.
                const orderRes = await api.post(`/orders/items`, {
                    auction_id: auction.id,
                    purchase_type: "buy_now",
                });
                const orderId = orderRes?.data?.order?.id || orderRes?.data?.order_id;
                if (orderId) {
                    navigate(`/checkout/${orderId}`);
                }
            } else {
                setNotice("Purchase submitted. Refreshing...");
            }
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Buy now failed.");
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="auctify-page">
            <div className="auctify-container">
                <div style={{ marginBottom: 12 }}>
                    <Link to="/browse" className="auctify-btn">← Back to Browse</Link>
                </div>

                <div className="auction-detail">
                    <div className="panel">
                        <img
                            src={imgs[selected]}
                            alt={auction.title}
                            style={{ width: "100%", borderRadius: 12, border: "1px solid var(--auctify-border)" }}
                        />
                        <div style={{ height: 12 }} />
                        <div className="thumb-row">
                            {imgs.map((src, idx) => (
                                <img
                                    key={src}
                                    src={src}
                                    alt="thumb"
                                    className={idx === selected ? "thumb thumb--active" : "thumb"}
                                    onClick={() => setSelected(idx)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="panel">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                            <div>
                                <h2 style={{ marginBottom: 8 }}>{auction.title}</h2>
                                <div className="small-muted">Seller: {auction.seller?.name || "—"}</div>
                            </div>
                            <StatusPill label={auction.status_label || auction.status} />
                        </div>

                        <div style={{ height: 14 }} />

                        <div className="auction-card__meta" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <div>
                                <div className="meta-label">Current Bid</div>
                                <div className="meta-value" style={{ fontSize: 20 }}>{formatMoney(currentBid)}</div>
                            </div>
                            <div>
                                <div className="meta-label">Time Remaining</div>
                                <Countdown endTime={auction.end_time} />
                            </div>
                            <div>
                                <div className="meta-label">Minimum Next Bid</div>
                                <div className="meta-value">{formatMoney(minNext)}</div>
                            </div>
                            <div>
                                <div className="meta-label">Total Bids</div>
                                <div className="meta-value">{auction.bids?.length || 0}</div>
                            </div>
                            {buyNowPrice != null ? (
                                <div>
                                    <div className="meta-label">Direct Claim (Buy Now)</div>
                                    <div className="meta-value">{formatMoney(buyNowPrice)}</div>
                                </div>
                            ) : null}
                        </div>

                        <div style={{ height: 14 }} />
                        {notice && <div className="alert" style={{ marginBottom: 10 }}>{notice}</div>}
                        {error && <div className="alert alert--error" style={{ marginBottom: 10 }}>{error}</div>}

                        {isSellerBiddingOwnItem ? (
                            <div className="alert" style={{ marginBottom: 10 }}>
                                You are the seller of this item, so bidding is disabled.
                            </div>
                        ) : null}

                        <div className="bid-box">
                            <input
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                placeholder={`Enter ${formatMoney(minNext)} or higher`}
                                inputMode="decimal"
                            />
                            <button
                                className="auctify-btn auctify-btn--primary"
                                type="button"
                                onClick={placeBid}
                                disabled={placing || isSellerBiddingOwnItem}
                            >
                                {placing ? "Placing…" : "Place Bid"}
                            </button>
                        </div>

                        {buyNowPrice != null ? (
                            <div style={{ marginTop: 10 }}>
                                <button
                                    className="auctify-btn"
                                    type="button"
                                    onClick={buyNow}
                                    disabled={placing || isSellerBiddingOwnItem}
                                    title="Buy now ends the auction immediately"
                                >
                                    {placing ? "Processing…" : `Buy Now for ${formatMoney(buyNowPrice)}`}
                                </button>
                            </div>
                        ) : null}

                        <div style={{ height: 16 }} />

                        <div>
                            <h2>Description</h2>
                            <div className="small-muted" style={{ whiteSpace: "pre-wrap" }}>
                                {auction.description || "No description provided."}
                            </div>
                        </div>

                        <div style={{ height: 16 }} />

                        <div>
                            <h2>Bid History</h2>
                            <table className="table-mini">
                                <thead>
                                    <tr>
                                        <th>Bidder</th>
                                        <th>Amount</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(auction.bids || []).slice(0, 10).map((b) => (
                                        <tr key={b.id}>
                                            <td>{b.bidder?.name || "Bidder"}</td>
                                            <td>{formatMoney(b.amount)}</td>
                                            <td>{new Date(b.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {(!auction.bids || auction.bids.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="small-muted">No bids yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="auctify-spacer" />
            </div>

            <ChatWidget auction={auction} />
        </div>
    );
}
