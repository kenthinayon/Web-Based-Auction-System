import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    if (!user) {
        return (
            <div className="auctify-page">
                <div className="auctify-container">
                    <div className="panel">
                        <h2>Please login</h2>
                        <div className="small-muted">You need an account to access the dashboard.</div>
                        <div style={{ height: 12 }} />
                        <Link className="auctify-btn auctify-btn--primary" to="/login">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    const logout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="auctify-page">
            <div className="auctify-container">
                <div className="panel" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                        <h2 style={{ marginBottom: 6 }}>Dashboard</h2>
                        <div className="small-muted">Signed in as {user.name} ({user.role})</div>
                    </div>
                    <button className="auctify-btn" onClick={logout} type="button">Logout</button>
                </div>

                <div className="auctify-spacer" />

                <div className="panel">
                    <h2>Quick links</h2>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Link className="auctify-btn" to="/browse">Browse auctions</Link>
                        <Link className="auctify-btn" to="/browse?ending_soon=1">Ending soon</Link>
                        {user.role === "buyer" && (
                            <span className="small-muted">Buyer account: you can place bids.</span>
                        )}
                        {user.role === "seller" && (
                            <span className="small-muted">Seller account: you can list items for auction.</span>
                        )}
                        {(user.role === "admin" || user.role === "super_admin") && (
                            <span className="small-muted">Admin tools: user & auction management.</span>
                        )}
                    </div>
                </div>

                <div className="auctify-spacer" />
            </div>
        </div>
    );
}
