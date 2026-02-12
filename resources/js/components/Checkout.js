import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api";
import { formatMoney } from "../lib/time";

export default function Checkout() {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [meetingLocation, setMeetingLocation] = useState("");
    const [meetingAt, setMeetingAt] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [paymentReference, setPaymentReference] = useState("");
    const [notes, setNotes] = useState("");

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const load = async () => {
        // Simple implementation: load all user orders and pick the one.
        // If you want faster, we can add GET /orders/{id} later.
        const res = await api.get("/orders");
        const found = (res.data || []).find((o) => String(o.id) === String(orderId));
        if (!found) throw new Error("Order not found");
        setOrder(found);

        // Pre-fill if values exist
        setMeetingLocation(found.meeting_location || "");
        setMeetingAt(found.meeting_at ? new Date(found.meeting_at).toISOString().slice(0, 16) : "");
        setPaymentMethod(found.payment_method || "cod");
        setPaymentReference(found.payment_reference || "");
        setNotes(found.notes || "");
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError("");
            setNotice("");
            try {
                await load();
            } catch (e) {
                if (alive) setError(e.message || "Couldn’t load checkout.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const placeOrder = async () => {
        setError("");
        setNotice("");

        if (!user) {
            setError("Please login.");
            return;
        }

        if (!meetingLocation.trim()) {
            setError("Meeting location is required.");
            return;
        }
        if (!meetingAt) {
            setError("Meeting date/time is required.");
            return;
        }

        try {
            const payload = {
                delivery_method: "meetup",
                meeting_location: meetingLocation,
                meeting_at: new Date(meetingAt).toISOString(),
                payment_method: paymentMethod,
                payment_reference: paymentReference || null,
                notes: notes || null,
            };
            const res = await api.post(`/orders/${orderId}/place`, payload);
            setOrder(res.data.order);
            setNotice("Order placed! Seller will contact you for meetup details.");
        } catch (err) {
            setError(err.response?.data?.message || "Place order failed.");
        }
    };

    if (loading) {
        return <div className="panel">Loading checkout…</div>;
    }

    if (error) {
        return (
            <div className="panel">
                <div className="alert alert--error">{error}</div>
                <div style={{ height: 10 }} />
                <Link to="/browse" className="auctify-btn">Back to Browse</Link>
            </div>
        );
    }

    const items = order?.items || [];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0 }}>Checkout</h2>
                <Link to="/browse" className="auctify-btn">Continue shopping</Link>
            </div>

            <div style={{ height: 12 }} />

            {notice ? <div className="alert">{notice}</div> : null}
            {order?.status !== "pending" ? (
                <div className="alert" style={{ marginTop: 10 }}>
                    Status: <b>{order.status}</b>
                </div>
            ) : null}

            <div className="panel" style={{ marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Items</h3>
                {items.length === 0 ? (
                    <div className="small-muted">No items in this order.</div>
                ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                        {items.map((it) => (
                            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{it.auction?.title || "Item"}</div>
                                    <div className="small-muted">Type: {it.purchase_type}</div>
                                </div>
                                <div style={{ fontWeight: 800 }}>{formatMoney(it.unit_price)}</div>
                            </div>
                        ))}
                        <div style={{ borderTop: "1px solid var(--auctify-border)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                            <div style={{ fontWeight: 800 }}>Total</div>
                            <div style={{ fontWeight: 900 }}>{formatMoney(order.total_amount || 0)}</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Meetup details</h3>

                <div className="form-grid">
                    <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                        <label>Meeting location</label>
                        <input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="e.g. SM City Cebu, Entrance A" />
                    </div>

                    <div className="form-field">
                        <label>Meeting date & time</label>
                        <input type="datetime-local" value={meetingAt} onChange={(e) => setMeetingAt(e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Payment method</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option value="cod">Cash on delivery (COD)</option>
                            <option value="bank_transfer">Bank transfer</option>
                            <option value="gcash">GCash</option>
                        </select>
                    </div>

                    {(paymentMethod === "bank_transfer" || paymentMethod === "gcash") ? (
                        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                            <label>Payment reference (optional)</label>
                            <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction ID / reference" />
                        </div>
                    ) : null}

                    <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                        <label>Notes (optional)</label>
                        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the seller" />
                    </div>
                </div>

                <div style={{ height: 10 }} />

                <button className="auctify-btn auctify-btn--primary" type="button" onClick={placeOrder} disabled={order?.status !== "pending"}>
                    Place order
                </button>
            </div>
        </div>
    );
}
