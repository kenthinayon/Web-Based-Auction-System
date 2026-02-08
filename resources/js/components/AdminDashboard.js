import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

function formatMoney(value) {
    const n = Number(value || 0);
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function timeAgo(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    if (diffM < 1) return "just now";
    if (diffM < 60) return `${diffM} min ago`;
    const diffH = Math.floor(diffM / 60);
    if (diffH < 24) return `${diffH} hr ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} day${diffD === 1 ? "" : "s"} ago`;
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

function FeedCard({ title, meta, children, actions }) {
    return (
        <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 14,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>{title}</div>
                    {meta ? <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12, marginTop: 4 }}>{meta}</div> : null}
                </div>
                {actions ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div> : null}
            </div>
            <div style={{ marginTop: 10 }}>{children}</div>
        </div>
    );
}

export default function AdminDashboard() {
    const user = useMemo(() => getUser(), []);
    const isAdmin = Boolean(user && (user.role === "admin" || user.role === "super_admin"));

    const [tab, setTab] = useState("feed");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [auctions, setAuctions] = useState([]);

    const refresh = async () => {
        setError("");
        setLoading(true);
        try {
            const [statsRes, usersRes, auctionsRes] = await Promise.all([
                api.get("/admin/stats"),
                api.get("/admin/users"),
                api.get("/admin/auctions"),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data?.data || []);
            setAuctions(auctionsRes.data?.data || []);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Failed to load admin dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    const verifySeller = async (u, value) => {
        setError("");
        try {
            await api.put(`/admin/users/${u.id}/verify-seller`, { seller_verified: value });
            await refresh();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Action failed");
        }
    };

    const setActive = async (u, value) => {
        setError("");
        try {
            await api.put(`/admin/users/${u.id}/active`, { is_active: value });
            await refresh();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Action failed");
        }
    };

    const ban = async (u) => {
        setError("");
        try {
            await api.post(`/admin/users/${u.id}/ban`);
            await refresh();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Action failed");
        }
    };

    const unban = async (u) => {
        setError("");
        try {
            await api.post(`/admin/users/${u.id}/unban`);
            await refresh();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Action failed");
        }
    };

    const removeAuction = async (a) => {
        setError("");
        if (!window.confirm(`Remove auction: ${a.title}?`)) return;
        try {
            await api.delete(`/admin/auctions/${a.id}`);
            await refresh();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Action failed");
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ padding: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Admin Dashboard</h1>
                <p style={{ color: "#6b7280", fontWeight: 700 }}>Admin access only.</p>
            </div>
        );
    }

    const latestUsers = users.slice(0, 6);
    const latestAuctions = auctions.slice(0, 6);

    const sellers = users.filter((u) => u.role === "seller");
    const pendingSellerList = sellers.filter((u) => !u.seller_verified);
    const verifiedSellerList = sellers.filter((u) => u.seller_verified);

    const verifiedSellers = users.filter((u) => u.role === "seller" && u.seller_verified).length;
    const pendingSellers = users.filter((u) => u.role === "seller" && !u.seller_verified).length;

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 1000, marginBottom: 6 }}>Admin Dashboard</h1>
                    <div style={{ color: "#6b7280", fontWeight: 800 }}>News feed-style view of what’s new + what needs action.</div>
                </div>
                <button className="auctify-btn" style={{ padding: "10px 14px" }} onClick={refresh} type="button">Refresh</button>
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className={`auctify-btn ${tab === "feed" ? "auctify-btn--primary" : ""}`} type="button" onClick={() => setTab("feed")}>
                    News Feed
                </button>
                <button className={`auctify-btn ${tab === "sellers" ? "auctify-btn--primary" : ""}`} type="button" onClick={() => setTab("sellers")}>
                    Sellers
                </button>
                <button className={`auctify-btn ${tab === "users" ? "auctify-btn--primary" : ""}`} type="button" onClick={() => setTab("users")}>
                    Users
                </button>
                <button className={`auctify-btn ${tab === "auctions" ? "auctify-btn--primary" : ""}`} type="button" onClick={() => setTab("auctions")}>
                    Auctions
                </button>
            </div>

            {error ? (
                <div style={{
                    marginTop: 12,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: 12,
                    borderRadius: 12,
                    fontWeight: 800,
                }}>
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div style={{ marginTop: 16, color: "#6b7280", fontWeight: 800 }}>Loading dashboard…</div>
            ) : null}

            {!loading && tab === "feed" ? (
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <FeedCard
                        title="Today’s snapshot"
                        meta="Quick platform pulse"
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                            <div className="auctify-chip">Total users: {stats?.total_users ?? 0}</div>
                            <div className="auctify-chip">Verified sellers: {verifiedSellers}</div>
                            <div className="auctify-chip">Pending sellers: {pendingSellers}</div>
                            <div className="auctify-chip">Active auctions: {stats?.active_auctions ?? 0}</div>
                        </div>
                    </FeedCard>

                    <FeedCard
                        title="Seller approvals"
                        meta="New sellers waiting for approval"
                        actions={(
                            <button className="auctify-btn" type="button" onClick={() => setTab("users")}>Open users</button>
                        )}
                    >
                        {users.filter((u) => u.role === "seller" && !u.seller_verified).slice(0, 5).map((u) => (
                            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid #f1f5f9" }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 900 }}>{u.name} <span style={{ color: "#6b7280", fontWeight: 800 }}>({u.email})</span></div>
                                    <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>Registered {timeAgo(u.created_at)}</div>
                                </div>
                                <button className="auctify-btn auctify-btn--primary" type="button" onClick={() => verifySeller(u, true)}>Verify</button>
                            </div>
                        ))}
                        {users.filter((u) => u.role === "seller" && !u.seller_verified).length === 0 ? (
                            <div style={{ color: "#6b7280", fontWeight: 800 }}>No pending sellers right now.</div>
                        ) : null}
                    </FeedCard>

                    <FeedCard
                        title="New listings (advertisement-style)"
                        meta="Newest auctions posted"
                        actions={(
                            <button className="auctify-btn" type="button" onClick={() => setTab("auctions")}>Open auctions</button>
                        )}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {latestAuctions.map((a) => (
                                <div key={a.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#f8fafc" }}>
                                    <div style={{ fontWeight: 1000, marginBottom: 6 }}>{a.title}</div>
                                    <div style={{ color: "#6b7280", fontWeight: 800, fontSize: 12, marginBottom: 8 }}>
                                        Seller: {a.seller?.name || `#${a.seller_id || "?"}`} • {timeAgo(a.created_at)}
                                    </div>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                        <span className="auctify-chip" style={{ padding: "6px 10px" }}>Status: {a.status}</span>
                                        <span className="auctify-chip" style={{ padding: "6px 10px" }}>Start: {formatMoney(a.starting_price)}</span>
                                    </div>
                                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <button className="auctify-btn" type="button" onClick={() => removeAuction(a)}>Remove</button>
                                    </div>
                                </div>
                            ))}
                            {latestAuctions.length === 0 ? (
                                <div style={{ color: "#6b7280", fontWeight: 800 }}>No auctions yet.</div>
                            ) : null}
                        </div>
                    </FeedCard>

                    <FeedCard title="New users" meta="Recently registered accounts">
                        {latestUsers.map((u) => (
                            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid #f1f5f9" }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 900 }}>{u.name} <span style={{ color: "#6b7280", fontWeight: 800 }}>({u.role})</span></div>
                                    <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>{u.email} • {timeAgo(u.created_at)}</div>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {u.role === "seller" ? (
                                        u.seller_verified ? (
                                            <button className="auctify-btn" type="button" onClick={() => verifySeller(u, false)}>Unverify</button>
                                        ) : (
                                            <button className="auctify-btn auctify-btn--primary" type="button" onClick={() => verifySeller(u, true)}>Verify</button>
                                        )
                                    ) : null}
                                    {u.banned_at ? (
                                        <button className="auctify-btn" type="button" onClick={() => unban(u)}>Unban</button>
                                    ) : (
                                        <button className="auctify-btn" type="button" onClick={() => ban(u)}>Ban</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </FeedCard>
                </div>
            ) : null}

            {!loading && tab === "sellers" ? (
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <FeedCard
                        title="Seller accounts"
                        meta="Approve sellers so they can start selling, or monitor/suspend/ban for violations"
                        actions={(
                            <>
                                <div className="auctify-chip">Total: {sellers.length}</div>
                                <div className="auctify-chip">Pending: {pendingSellerList.length}</div>
                                <div className="auctify-chip">Verified: {verifiedSellerList.length}</div>
                            </>
                        )}
                    >
                        {pendingSellerList.length > 0 ? (
                            <div style={{
                                background: "#fffbeb",
                                border: "1px solid #fde68a",
                                color: "#92400e",
                                padding: 12,
                                borderRadius: 12,
                                fontWeight: 800,
                                marginBottom: 12,
                            }}>
                                {pendingSellerList.length} seller(s) waiting for approval.
                            </div>
                        ) : null}

                        <div style={{ display: "grid", gap: 10 }}>
                            {sellers.map((u) => (
                                <div
                                    key={u.id}
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 14,
                                        padding: 12,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div style={{ minWidth: 280 }}>
                                        <div style={{ fontWeight: 1000 }}>
                                            {u.name} <span style={{ color: "#6b7280", fontWeight: 800 }}>({u.email})</span>
                                        </div>
                                        <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>
                                            Seller • Registered {timeAgo(u.created_at)}
                                        </div>

                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                                            <span className="auctify-chip" style={{ padding: "6px 10px" }}>
                                                Verified: {u.seller_verified ? "Yes" : "No"}
                                            </span>
                                            <span className="auctify-chip" style={{ padding: "6px 10px" }}>
                                                Active: {u.is_active ? "Yes" : "No"}
                                            </span>
                                            <span className="auctify-chip" style={{ padding: "6px 10px" }}>
                                                Banned: {u.banned_at ? "Yes" : "No"}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {u.seller_verified ? (
                                            <button className="auctify-btn" type="button" onClick={() => verifySeller(u, false)}>
                                                Unapprove
                                            </button>
                                        ) : (
                                            <button className="auctify-btn auctify-btn--primary" type="button" onClick={() => verifySeller(u, true)}>
                                                Approve seller
                                            </button>
                                        )}

                                        {u.is_active ? (
                                            <button className="auctify-btn" type="button" onClick={() => setActive(u, false)}>
                                                Suspend
                                            </button>
                                        ) : (
                                            <button className="auctify-btn auctify-btn--primary" type="button" onClick={() => setActive(u, true)}>
                                                Reactivate
                                            </button>
                                        )}

                                        {u.banned_at ? (
                                            <button className="auctify-btn" type="button" onClick={() => unban(u)}>
                                                Unban
                                            </button>
                                        ) : (
                                            <button className="auctify-btn" type="button" onClick={() => ban(u)}>
                                                Ban
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {sellers.length === 0 ? (
                                <div style={{ color: "#6b7280", fontWeight: 800 }}>No sellers found.</div>
                            ) : null}
                        </div>
                    </FeedCard>
                </div>
            ) : null}

            {!loading && tab === "users" ? (
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <FeedCard title="User management" meta="Activate, suspend, verify sellers, ban users">
                        <div style={{ display: "grid", gap: 8 }}>
                            {users.map((u) => (
                                <div key={u.id} style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 14,
                                    padding: 12,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                }}>
                                    <div style={{ minWidth: 260 }}>
                                        <div style={{ fontWeight: 1000 }}>{u.name} <span style={{ color: "#6b7280", fontWeight: 800 }}>({u.role})</span></div>
                                        <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>{u.email} • {timeAgo(u.created_at)}</div>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                                            {u.role === "seller" ? (
                                                <span className="auctify-chip" style={{ padding: "6px 10px" }}>
                                                    Seller verified: {u.seller_verified ? "Yes" : "No"}
                                                </span>
                                            ) : null}
                                            <span className="auctify-chip" style={{ padding: "6px 10px" }}>
                                                Active: {u.is_active ? "Yes" : "No"}
                                            </span>
                                            <span className="auctify-chip" style={{ padding: "6px 10px" }}>
                                                Banned: {u.banned_at ? "Yes" : "No"}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {u.role === "seller" ? (
                                            u.seller_verified ? (
                                                <button className="auctify-btn" type="button" onClick={() => verifySeller(u, false)}>Unverify seller</button>
                                            ) : (
                                                <button className="auctify-btn auctify-btn--primary" type="button" onClick={() => verifySeller(u, true)}>Verify seller</button>
                                            )
                                        ) : null}

                                        {u.is_active ? (
                                            <button className="auctify-btn" type="button" onClick={() => setActive(u, false)}>Suspend</button>
                                        ) : (
                                            <button className="auctify-btn auctify-btn--primary" type="button" onClick={() => setActive(u, true)}>Activate</button>
                                        )}

                                        {u.banned_at ? (
                                            <button className="auctify-btn" type="button" onClick={() => unban(u)}>Unban</button>
                                        ) : (
                                            <button className="auctify-btn" type="button" onClick={() => ban(u)}>Ban</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FeedCard>
                </div>
            ) : null}

            {!loading && tab === "auctions" ? (
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <FeedCard title="Auction listings" meta="Newest auctions (admin can remove prohibited listings)">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                            {auctions.map((a) => (
                                <div key={a.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}>
                                    <div style={{ fontWeight: 1000, marginBottom: 6 }}>{a.title}</div>
                                    <div style={{ color: "#6b7280", fontWeight: 800, fontSize: 12 }}>
                                        Seller: {a.seller?.name || `#${a.seller_id || "?"}`}
                                    </div>
                                    <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                                        Created {timeAgo(a.created_at)} • Status: {a.status}
                                    </div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                        <span className="auctify-chip" style={{ padding: "6px 10px" }}>Start {formatMoney(a.starting_price)}</span>
                                        <span className="auctify-chip" style={{ padding: "6px 10px" }}>Inc {formatMoney(a.bid_increment)}</span>
                                    </div>
                                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <button className="auctify-btn" type="button" onClick={() => removeAuction(a)}>Remove</button>
                                    </div>
                                </div>
                            ))}
                            {auctions.length === 0 ? (
                                <div style={{ color: "#6b7280", fontWeight: 800 }}>No auctions found.</div>
                            ) : null}
                        </div>
                    </FeedCard>
                </div>
            ) : null}
        </div>
    );
}
