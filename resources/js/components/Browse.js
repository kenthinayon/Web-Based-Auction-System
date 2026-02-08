import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../lib/api";
import AuctionCard from "./AuctionCard";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Browse() {
    const query = useQuery();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [categoryId, setCategoryId] = useState(query.get("category_id") || "");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState(query.get("sort") || "ending");

    const q = query.get("q") || "";
    const endingSoon = query.get("ending_soon") === "1";

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const params = new URLSearchParams();
                if (q) params.set("q", q);
                if (endingSoon) params.set("ending_soon", "1");
                if (categoryId) params.set("category_id", categoryId);

                // MVP: backend doesn’t yet support min/max/sort; we do client-side for now.
                // api.js already uses baseURL '/api', so call '/auctions' (not '/api/auctions')
                const res = await api.get(`/auctions?${params.toString()}`);
                const payload = res?.data;
                let data = Array.isArray(payload) ? payload : (payload?.data || []);

                if (minPrice) data = data.filter((x) => Number(x.current_bid ?? x.starting_price) >= Number(minPrice));
                if (maxPrice) data = data.filter((x) => Number(x.current_bid ?? x.starting_price) <= Number(maxPrice));

                if (sort === "ending") {
                    data = [...data].sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
                } else if (sort === "new") {
                    data = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                } else if (sort === "low") {
                    data = [...data].sort((a, b) => Number(a.current_bid) - Number(b.current_bid));
                } else if (sort === "high") {
                    data = [...data].sort((a, b) => Number(b.current_bid) - Number(a.current_bid));
                }

                setItems(data);
            } catch {
                setError("Couldn’t load auctions.");
            } finally {
                setLoading(false);
            }
        })();
    }, [q, endingSoon, categoryId, minPrice, maxPrice, sort]);

    return (
        <div className="auctify-page">
            <div className="auctify-container">
                <div className="panel">
                    <h2>Browse Auctions</h2>
                    <div className="small-muted">Search results are optimized for fast bidding and quick scanning.</div>

                    <div className="browse-toolbar">
                        <div className="filters">
                            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min price" inputMode="decimal" />
                            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" inputMode="decimal" />
                            <input value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="Category ID" />
                        </div>

                        <div className="filters">
                            <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                <option value="ending">Ending soon</option>
                                <option value="new">Newly listed</option>
                                <option value="low">Lowest price</option>
                                <option value="high">Highest price</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="auctify-spacer" />

                {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}
                {loading && <div className="alert" style={{ marginBottom: 16 }}>Loading…</div>}

                {!loading && items.length === 0 ? (
                    <div className="panel">No matching auctions.</div>
                ) : (
                    <div className="auction-grid">
                        {items.map((a) => (
                            <AuctionCard key={a.id} auction={a} />
                        ))}
                    </div>
                )}

                <div className="auctify-spacer" />
            </div>
        </div>
    );
}
