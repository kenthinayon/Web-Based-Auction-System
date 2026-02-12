import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

function formatTs(ts) {
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return "";
    }
}

export default function SellerMessages() {
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    const listRef = useRef(null);

    const loadChats = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/chats");
            setChats(res.data || []);
            if (!activeChat && (res.data || []).length) {
                setActiveChat(res.data[0]);
            }
        } catch {
            setError("Couldn’t load chats.");
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (chatId) => {
        if (!chatId) return;
        try {
            const res = await api.get(`/chats/${chatId}/messages`);
            setMessages(res.data?.messages || []);
            await api.post(`/chats/${chatId}/read`);
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (!user) return;
        loadChats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!activeChat?.id) return;
        let poll;
        (async () => {
            await loadMessages(activeChat.id);
            poll = setInterval(() => loadMessages(activeChat.id), 4000);
        })();
        return () => {
            if (poll) clearInterval(poll);
        };
    }, [activeChat?.id]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages.length]);

    const send = async () => {
        if (!activeChat?.id) return;
        const body = text.trim();
        if (!body) return;
        setText("");
        try {
            const res = await api.post(`/chats/${activeChat.id}/messages`, { body });
            setMessages((prev) => [...prev, res.data]);
            // refresh chats ordering/unread
            loadChats();
        } catch {
            setText(body);
        }
    };

    if (!user) {
        return (
            <div className="panel">
                <h2>Please login</h2>
                <Link className="auctify-btn auctify-btn--primary" to="/login">Go to Login</Link>
            </div>
        );
    }

    if (user.role !== "seller") {
        return (
            <div className="panel">
                <h2>Not allowed</h2>
                <div className="small-muted">Seller messages are only available to seller accounts.</div>
            </div>
        );
    }

    return (
        <div className="auctify-page">
            <div className="auctify-container">
                <div className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div>
                        <h2 style={{ marginBottom: 6 }}>Messages</h2>
                        <div className="small-muted">Reply to buyers while auctions are active.</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className="auctify-btn" type="button" onClick={loadChats} disabled={loading}>Refresh</button>
                        <Link className="auctify-btn" to="/seller">Back to My Sales</Link>
                    </div>
                </div>

                <div className="auctify-spacer" />

                {error ? <div className="alert alert--error">{error}</div> : null}
                {loading ? <div className="alert">Loading…</div> : null}

                {!loading && chats.length === 0 ? (
                    <div className="panel">No messages yet.</div>
                ) : null}

                {!loading && chats.length > 0 ? (
                    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: 520 }}>
                            <div style={{ borderRight: "1px solid var(--auctify-border)", background: "#fff" }}>
                                {chats.map((c) => {
                                    const active = String(activeChat?.id) === String(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setActiveChat(c)}
                                            style={{
                                                width: "100%",
                                                textAlign: "left",
                                                padding: 12,
                                                border: "none",
                                                borderBottom: "1px solid var(--auctify-border)",
                                                background: active ? "#f5f8ff" : "transparent",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <div style={{ fontWeight: 800 }}>{c.buyer?.name || "Buyer"}</div>
                                            <div className="small-muted" style={{ marginTop: 2 }}>
                                                {c.auction?.title || "Auction"}
                                            </div>
                                            <div className="small-muted" style={{ marginTop: 4, fontSize: 12 }}>
                                                Last: {c.last_message_at ? formatTs(c.last_message_at) : "—"}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ padding: 12, borderBottom: "1px solid var(--auctify-border)", background: "#fff" }}>
                                    <div style={{ fontWeight: 900 }}>
                                        {activeChat?.auction?.title || "Select a chat"}
                                    </div>
                                    <div className="small-muted">
                                        Buyer: {activeChat?.buyer?.name || "—"}
                                    </div>
                                </div>

                                <div
                                    ref={listRef}
                                    style={{ flex: 1, padding: 12, overflow: "auto", background: "#fff" }}
                                >
                                    {messages.map((m) => {
                                        const mine = String(m.sender_id) === String(user?.id);
                                        return (
                                            <div
                                                key={m.id}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: mine ? "flex-end" : "flex-start",
                                                    marginBottom: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        maxWidth: "80%",
                                                        background: mine ? "#e8f1ff" : "#f5f6f8",
                                                        border: "1px solid var(--auctify-border)",
                                                        borderRadius: 10,
                                                        padding: "8px 10px",
                                                    }}
                                                >
                                                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                                                        {m.sender?.name || (mine ? "You" : "User")}
                                                    </div>
                                                    <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                                                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
                                                        {formatTs(m.created_at)}{m.read_at && mine ? " · Read" : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {messages.length === 0 ? (
                                        <div className="small-muted">No messages in this chat.</div>
                                    ) : null}
                                </div>

                                <div style={{ padding: 12, borderTop: "1px solid var(--auctify-border)", background: "#fff" }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="Type a reply…"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    send();
                                                }
                                            }}
                                            disabled={!activeChat?.id}
                                        />
                                        <button className="auctify-btn auctify-btn--primary" type="button" onClick={send} disabled={!activeChat?.id}>
                                            Send
                                        </button>
                                    </div>
                                    <div className="small-muted" style={{ marginTop: 6 }}>
                                        Note: Chat works only while the auction is active.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="auctify-spacer" />
            </div>
        </div>
    );
}
