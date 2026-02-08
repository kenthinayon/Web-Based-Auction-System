import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function CreateAuction() {
    const navigate = useNavigate();

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const [categories, setCategories] = useState([]);

    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [description, setDescription] = useState("");
    const [startingPrice, setStartingPrice] = useState("1.00");
    const [bidIncrement, setBidIncrement] = useState("1.00");

    // simple datetime-local helper
    const defaultStart = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 10);
        return d.toISOString().slice(0, 16);
    };

    const defaultEnd = () => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().slice(0, 16);
    };

    const [startTime, setStartTime] = useState(defaultStart);
    const [endTime, setEndTime] = useState(defaultEnd);
    const [images, setImages] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/categories");
                const data = res?.data;
                const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                setCategories(list);
            } catch {
                setCategories([]);
            }
        })();
    }, []);

    if (!user) {
        return (
            <div className="auctify-page">
                <div className="auctify-container">
                    <div className="panel">
                        <h2>Please login</h2>
                        <div className="small-muted">You need an account to create an auction.</div>
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
                        <div className="small-muted">Only seller accounts can create auctions.</div>
                    </div>
                </div>
            </div>
        );
    }

    // Seller approval gate (mirrors backend rule). Note: user data is stored in localStorage,
    // so if an admin approved you just now, you may need to logout/login to refresh it.
    if (!user.seller_verified) {
        return (
            <div className="auctify-page">
                <div className="auctify-container">
                    <div className="panel">
                        <h2>Pending approval</h2>
                        <div className="small-muted">
                            Your seller account is pending admin approval. If you were just approved,
                            please logout and login again to refresh your account status.
                        </div>
                        <div style={{ height: 12 }} />
                        <button className="auctify-btn" type="button" onClick={() => navigate("/dashboard")}>Back</button>
                    </div>
                </div>
            </div>
        );
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const form = new FormData();
            form.append("title", title);
            if (categoryId) form.append("category_id", categoryId);
            if (description) form.append("description", description);
            form.append("starting_price", startingPrice);
            form.append("bid_increment", bidIncrement);
            form.append("start_time", new Date(startTime).toISOString());
            form.append("end_time", new Date(endTime).toISOString());

            images.forEach((f) => form.append("images[]", f));

            const res = await api.post("/auctions", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            navigate(`/auction/${res.data.id}`);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                (err.response?.data?.errors ? "Please check the form fields." : null) ||
                "Failed to create auction.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auctify-page">
            <div className="auctify-container">
                <div className="panel" style={{ maxWidth: 860, margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                        <h2 style={{ margin: 0 }}>Create auction</h2>
                        <Link className="auctify-btn" to="/dashboard">Back</Link>
                    </div>

                    <div className="small-muted" style={{ marginTop: 8 }}>
                        Add your item, upload photos, and set starting bid, increment, and schedule.
                    </div>

                    {error && (
                        <div className="alert alert--error" style={{ marginTop: 12 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
                        <div style={{ display: "grid", gap: 10 }}>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />

                            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                                <option value="">Category (optional)</option>
                                {(Array.isArray(categories) ? categories : []).map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description (optional)"
                                rows={4}
                            />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <input
                                    value={startingPrice}
                                    onChange={(e) => setStartingPrice(e.target.value)}
                                    placeholder="Starting bid"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                <input
                                    value={bidIncrement}
                                    onChange={(e) => setBidIncrement(e.target.value)}
                                    placeholder="Bid increment"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <label style={{ display: "grid", gap: 6 }}>
                                    <span className="small-muted">Start time</span>
                                    <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                                </label>
                                <label style={{ display: "grid", gap: 6 }}>
                                    <span className="small-muted">End time</span>
                                    <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                                </label>
                            </div>

                            <label style={{ display: "grid", gap: 6 }}>
                                <span className="small-muted">Photos (optional, multiple allowed)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setImages(Array.from(e.target.files || []))}
                                />
                            </label>

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button className="auctify-btn auctify-btn--primary" disabled={loading} type="submit">
                                    {loading ? "Creating…" : "Create auction"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="auctify-spacer" />
            </div>
        </div>
    );
}
