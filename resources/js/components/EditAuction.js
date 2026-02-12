import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";

export default function EditAuction() {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);

    const [categories, setCategories] = useState([]);

    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [description, setDescription] = useState("");
    const [startingPrice, setStartingPrice] = useState("1.00");
    const [bidIncrement, setBidIncrement] = useState("1.00");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // Optional: allow adding more images. (No delete in this MVP.)
    const [images, setImages] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/categories");
                setCategories(Array.isArray(res?.data) ? res.data : []);
            } catch {
                setCategories([]);
            }
        })();
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError("");
            try {
                const res = await api.get(`/auctions/${id}`);
                const a = res?.data;

                if (!alive) return;

                // Basic ownership check on client. Backend enforces on update.
                const sellerId = String(a?.seller_id ?? a?.seller?.id ?? "");
                if (user?.role !== "seller" || String(user?.id ?? "") !== sellerId) {
                    setError("You can only edit your own auctions.");
                    setLoading(false);
                    return;
                }

                setTitle(a?.title || "");
                setCategoryId(String(a?.category_id ?? ""));
                setDescription(a?.description || "");
                setStartingPrice(String(a?.starting_price ?? "1.00"));
                setBidIncrement(String(a?.bid_increment ?? "1.00"));

                // Convert ISO to datetime-local
                const toLocal = (iso) => {
                    if (!iso) return "";
                    const d = new Date(iso);
                    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                };

                setStartTime(toLocal(a?.start_time));
                setEndTime(toLocal(a?.end_time));
            } catch {
                if (alive) setError("Couldn’t load auction.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!user) {
        return (
            <div className="auctify-page">
                <div className="auctify-container">
                    <div className="panel">
                        <h2>Please login</h2>
                        <div className="small-muted">You need an account to edit an auction.</div>
                        <div style={{ height: 12 }} />
                        <Link className="auctify-btn auctify-btn--primary" to="/login">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auctify-page">
            <div className="auctify-container">
                <div className="panel" style={{ maxWidth: 860, margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                        <h2 style={{ margin: 0 }}>Edit auction</h2>
                        <Link className="auctify-btn" to="/seller">Back</Link>
                    </div>

                    {loading ? <div className="alert" style={{ marginTop: 12 }}>Loading…</div> : null}
                    {error ? <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div> : null}

                    {!loading && !error ? (
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setSaving(true);
                                setError("");

                                try {
                                    const form = new FormData();
                                    form.append("title", title);
                                    form.append("category_id", categoryId);
                                    if (description) form.append("description", description);
                                    form.append("starting_price", startingPrice);
                                    form.append("bid_increment", bidIncrement);
                                    form.append("start_time", new Date(startTime).toISOString());
                                    form.append("end_time", new Date(endTime).toISOString());

                                    // Only append images if seller selected new ones.
                                    images.forEach((f) => form.append("images[]", f));

                                    await api.post(`/auctions/${id}?_method=PUT`, form, {
                                        headers: { "Content-Type": "multipart/form-data" },
                                    });

                                    navigate("/seller");
                                } catch (err) {
                                    const msg =
                                        err.response?.data?.message ||
                                        (err.response?.data?.errors ? "Please check the form fields." : null) ||
                                        "Failed to update auction.";
                                    setError(msg);
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            style={{ marginTop: 12 }}
                        >
                            <div style={{ display: "grid", gap: 10 }}>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />

                                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                                    <option value="">Select category</option>
                                    {(Array.isArray(categories) ? categories : []).map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
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
                                    <span className="small-muted">Add more photos (optional, multiple allowed)</span>
                                    <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} />
                                </label>

                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        <button
                                            className="auctify-btn"
                                            type="button"
                                            disabled={saving || deleting}
                                            onClick={async () => {
                                                const ok = window.confirm(
                                                    "Delete this listing? It will be moved to your sales history and removed from browse."
                                                );
                                                if (!ok) return;

                                                setDeleting(true);
                                                setError("");
                                                try {
                                                    await api.delete(`/auctions/${id}`);
                                                    navigate("/seller");
                                                } catch (err) {
                                                    setError(err.response?.data?.message || "Failed to delete auction.");
                                                } finally {
                                                    setDeleting(false);
                                                }
                                            }}
                                        >
                                            {deleting ? "Deleting…" : "Delete"}
                                        </button>

                                        <button className="auctify-btn auctify-btn--primary" disabled={saving || deleting} type="submit">
                                            {saving ? "Saving…" : "Save changes"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : null}
                </div>

                <div className="auctify-spacer" />
            </div>
        </div>
    );
}
