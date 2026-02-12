import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";

function formatTs(ts) {
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return "";
    }
}

export default function ChatWidget({ auction }) {
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [error, setError] = useState("");

    const listRef = useRef(null);

    const canChat = Boolean(user && auction && auction.status === "active" && user.role === "buyer");

    const ensureChat = async () => {
        if (!auction?.id) return;
        setLoading(true);
        setError("");
        try {
            const res = await api.post(`/auctions/${auction.id}/chat`);
            setChat(res.data);
            return res.data;
        } catch (e) {
            setError(e.response?.data?.message || "Couldn’t start chat.");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (chatId) => {
        if (!chatId) return;
        try {
            const res = await api.get(`/chats/${chatId}/messages`);
            setMessages(res.data?.messages || []);

            // Mark read
            await api.post(`/chats/${chatId}/read`);
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (!open) return;
        if (!canChat) return;

        let poll;
        (async () => {
            const c = chat || (await ensureChat());
            if (c?.id) {
                await loadMessages(c.id);
                poll = setInterval(() => loadMessages(c.id), 4000);
            }
        })();

        return () => {
            if (poll) clearInterval(poll);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, auction?.id]);

    useEffect(() => {
        if (!open) return;
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [open, messages.length]);

    const send = async () => {
        if (!chat?.id) return;
        setError("");

        const body = text.trim();
        if (!body) return;

        setText("");
        try {
            const res = await api.post(`/chats/${chat.id}/messages`, { body });
            setMessages((prev) => [...prev, res.data]);
        } catch (e) {
            setError(e.response?.data?.message || "Send failed.");
            setText(body);
        }
    };

    if (!auction) return null;

    // Hide when auction not active (requirement) or user isn't a buyer
    if (!canChat) return null;

    return (
        <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 50 }}>
            {!open ? (
                <button
                    type="button"
                    className="auctify-btn auctify-btn--primary"
                    onClick={() => setOpen(true)}
                    title="Chat with seller"
                >
                    Chat
                </button>
            ) : (
                <div
                    className="panel"
                    style={{ width: 320, height: 420, display: "flex", flexDirection: "column", gap: 10 }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>Chat about: {auction.title}</div>
                        <button type="button" className="auctify-btn" onClick={() => setOpen(false)}>Close</button>
                    </div>

                    {error ? <div className="alert alert--error">{error}</div> : null}
                    {loading && !chat ? <div className="alert">Starting chat…</div> : null}

                    <div
                        ref={listRef}
                        style={{
                            flex: 1,
                            overflow: "auto",
                            border: "1px solid var(--auctify-border)",
                            borderRadius: 10,
                            padding: 10,
                            background: "#fff",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {messages.map((m) => {
                            const mine = String(m.sender_id) === String(user?.id);
                            return (
                                <div
                                    key={m.id}
                                    style={{
                                        alignSelf: mine ? "flex-end" : "flex-start",
                                        maxWidth: "85%",
                                    }}
                                >
                                    <div
                                        style={{
                                            background: mine ? "#e8f1ff" : "#f5f6f8",
                                            border: "1px solid var(--auctify-border)",
                                            padding: "8px 10px",
                                            borderRadius: 10,
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                                            {m.sender?.name || (mine ? "You" : "User")}
                                        </div>
                                        {m.body}
                                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
                                            {formatTs(m.created_at)}{m.read_at && mine ? " · Read" : ""}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {messages.length === 0 ? (
                            <div className="small-muted">No messages yet. Ask the seller about this item.</div>
                        ) : null}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type a message…"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                        />
                        <button type="button" className="auctify-btn auctify-btn--primary" onClick={send} disabled={!chat?.id}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
