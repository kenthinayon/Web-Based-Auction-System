import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Countdown from "./Countdown";
import StatusPill from "./StatusPill";
import { formatMoney } from "../lib/time";

export default function SellerDashboard() {
    const navigate = useNavigate();

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [items, setItems] = useState([]);
    const [actingId, setActingId] = useState(null);
    const [tab, setTab] = useState("active");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            if (!user?.id) {
                setError("Your profile data is missing an id. Please logout and login again.");
                setItems([]);
                return;
            }

            // Pull from the public auctions list, then filter to this seller.
            // (Small MVP; later we can add a dedicated endpoint for better performance.)
            const res = await api.get("/auctions");
            const payload = res?.data;
            const list = Array.isArray(payload)
                ? payload
                : (Array.isArray(payload?.data) ? payload.data : []);

            const mine = list.filter((a) => String(a.seller_id) === String(user?.id));
            mine.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setItems(mine);
        } catch {
            setError("Couldn’t load your auctions.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isHistoryItem = (a) => {
        const label = String(a.status_label || a.status || "").toLowerCase();
        const status = String(a.status || "").toLowerCase();
        return Boolean(
            a.seller_deleted ||
            status === "cancelled" ||
            status === "terminated" ||
            status === "ended" ||
            label === "ended" ||
            label === "cancelled" ||
            label === "terminated"
        );
    };

    const activeItems = useMemo(() => items.filter((a) => !isHistoryItem(a)), [items]);
    const historyItems = useMemo(() => items.filter((a) => isHistoryItem(a)), [items]);

    useEffect(() => {
        // Keep tab state sensible if the seller has no active items.
        if (tab === "active" && !loading && activeItems.length === 0 && historyItems.length > 0) {
            setTab("history");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, activeItems.length, historyItems.length]);

    const terminateAuction = async (auctionId) => {
        const ok = window.confirm("Terminate this listing? It will be removed from Browse and moved to Sales History.");
        if (!ok) return;
        setActingId(auctionId);
        setError("");
        try {
            await api.post(`/auctions/${auctionId}/terminate`);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to terminate auction.");
        } finally {
            setActingId(null);
        }
    };

    const deleteAuction = async (auctionId) => {
        const ok = window.confirm("Delete this listing? It will be moved to Sales History.");
        if (!ok) return;
        setActingId(auctionId);
        setError("");
        try {
            await api.delete(`/auctions/${auctionId}`);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete auction.");
        } finally {
            setActingId(null);
        }
    };

    if (!user) {
        return (
            <div className="auctify-page">
                <div className="auctify-container">
                    <div className="panel">
                        <h2>Please login</h2>
                        <div className="small-muted">You need an account to access seller tools.</div>
                        <div style={{ height: 12 }} />
                        <Link className="auctify-btn auctify-btn--primary" to="/login">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (user.role !== "seller") {
        return (
            <div className="auctify-page">
                <div className="auctify-container">
                    <div className="panel">
                        <h2>Not allowed</h2>
                        <div className="small-muted">Seller tools are only available to seller accounts.</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auctify-page">
            <div className="auctify-container">
                <div className="panel" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                        <h2 style={{ marginBottom: 6 }}>{tab === "active" ? "My Sales" : "Sales History"}</h2>
                        <div className="small-muted">
                            {tab === "active"
                                ? "Manage your listings and track time left."
                                : "Ended, cancelled, terminated, or deleted listings."}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className="auctify-btn" type="button" onClick={load} disabled={loading}>Refresh</button>
                        <button
                            className="auctify-btn"
                            type="button"
                            onClick={() => setTab((t) => (t === "active" ? "history" : "active"))}
                            disabled={loading}
                        >
                            {tab === "active" ? "History" : "Back to My Sales"}
                        </button>
                        <Link className="auctify-btn auctify-btn--primary" to="/sell">Create auction</Link>
                    </div>
                </div>

                <div className="auctify-spacer" />

                {error ? <div className="alert alert--error">{error}</div> : null}
                {loading ? <div className="alert">Loading…</div> : null}

                {!loading && items.length === 0 ? (
                    <div className="panel">You don’t have any auctions yet.</div>
                ) : null}

                {!loading && tab === "active" && activeItems.length > 0 ? (
                    <>
                        <div style={{ display: "grid", gap: 12 }}>
                        {activeItems.map((a) => (
                            <div key={a.id} className="panel" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center" }}>
                                <img
                                    src={a?.images?.[0]?.path ? `/storage/${a.images[0].path}` : "https://via.placeholder.com/240x180?text=Item"}
                                    alt={a.title}
                                    style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 10, border: "1px solid var(--auctify-border)" }}
                                />

                                <div style={{ display: "grid", gap: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{a.title}</div>
                                            <div className="small-muted">Category: {a.category?.name || "—"}</div>
                                        </div>
                                        <StatusPill label={a.status_label || a.status} />
                                    </div>

                                    <div className="auction-card__meta" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                                        <div>
                                            <div className="meta-label">Current Bid</div>
                                            <div className="meta-value">{formatMoney(a.current_bid ?? a.starting_price)}</div>
                                        </div>
                                        <div>
                                            <div className="meta-label">Bids</div>
                                            <div className="meta-value">{a.bids_count ?? 0}</div>
                                        </div>
                                        <div>
                                            <div className="meta-label">Time Left</div>
                                            <Countdown endTime={a.end_time} />
                                        </div>
                                        <div>
                                            <div className="meta-label">Min Inc</div>
                                            <div className="meta-value">{formatMoney(a.bid_increment)}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        <Link className="auctify-btn" to={`/auctions/${a.id}`}>View</Link>
                                        <Link className="auctify-btn" to={`/seller/auctions/${a.id}/edit`}>Edit</Link>
                                        <button
                                            className="auctify-btn"
                                            type="button"
                                            disabled={loading || actingId === a.id}
                                            onClick={() => terminateAuction(a.id)}
                                        >
                                            {actingId === a.id ? "Working…" : "Terminate"}
                                        </button>
                                        <button
                                            className="auctify-btn"
                                            type="button"
                                            disabled={loading || actingId === a.id}
                                            onClick={() => deleteAuction(a.id)}
                                        >
                                            {actingId === a.id ? "Working…" : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    </>
                ) : (!loading && tab === "active" && items.length > 0 ? (
                    <div className="panel">No active listings.</div>
                ) : null)}

                <div className="auctify-spacer" />

                {!loading && tab === "history" && historyItems.length > 0 ? (
                    <>
                        <div style={{ display: "grid", gap: 12 }}>
                            {historyItems.map((a) => (
                                <div key={a.id} className="panel" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center", opacity: 0.95 }}>
                                    <img
                                        src={a?.images?.[0]?.path ? `/storage/${a.images[0].path}` : "https://via.placeholder.com/240x180?text=Item"}
                                        alt={a.title}
                                        style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 10, border: "1px solid var(--auctify-border)" }}
                                    />

                                    <div style={{ display: "grid", gap: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{a.title}</div>
                                                <div className="small-muted">Category: {a.category?.name || "—"}</div>
                                            </div>
                                            <StatusPill label={a.seller_deleted ? "Deleted" : (a.status_label || a.status)} />
                                        </div>

                                        <div className="auction-card__meta" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                                            <div>
                                                <div className="meta-label">Final Bid</div>
                                                <div className="meta-value">{formatMoney(a.current_bid ?? a.starting_price)}</div>
                                            </div>
                                            <div>
                                                <div className="meta-label">Bids</div>
                                                <div className="meta-value">{a.bids_count ?? 0}</div>
                                            </div>
                                            <div>
                                                <div className="meta-label">Time Left</div>
                                                <Countdown endTime={a.end_time} />
                                            </div>
                                            <div>
                                                <div className="meta-label">Min Inc</div>
                                                <div className="meta-value">{formatMoney(a.bid_increment)}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <Link className="auctify-btn" to={`/auctions/${a.id}`}>View</Link>
                                            <Link className="auctify-btn" to={`/seller/auctions/${a.id}/edit`}>Edit</Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (!loading && tab === "history" ? (
                    <div className="panel">No sales history yet.</div>
                ) : null)}

                <div className="auctify-spacer" />
            </div>
        </div>
    );
}
