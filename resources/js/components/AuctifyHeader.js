import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function AuctifyHeader() {
    const navigate = useNavigate();
    const location = useLocation();

    const [q, setQ] = useState("");
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState("");
    const [profileOpen, setProfileOpen] = useState(false);

    // Profile edit fields (client-side only; persists to localStorage)
    const [profileName, setProfileName] = useState("");
    const [profileCountry, setProfileCountry] = useState("");
    const [profileState, setProfileState] = useState("");
    const [profileCity, setProfileCity] = useState("");
    const [profileStreet, setProfileStreet] = useState("");
    const [profilePhone, setProfilePhone] = useState("");

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!user) return;
        setProfileName(user?.name || "");
        setProfileCountry(user?.country || "");
        setProfileState(user?.state || "");
        setProfileCity(user?.city || "");
        setProfileStreet(user?.street || "");
        setProfilePhone(user?.phone || "");
    }, [user]);

    useEffect(() => {
        (async () => {
            try {
                // api.js is already configured with baseURL '/api', so request '/categories'
                const res = await api.get("/categories");

                // Accept either:
                // - array: [{id,name}]
                // - paginator-ish: { data: [...] }
                const data = res?.data;
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : [];

                setCategories(list);
            } catch {
                setCategories([]);
            }
        })();
    }, []);

    useEffect(() => {
        if (!profileOpen) return;

        const onDocClick = (e) => {
            if (!e.target.closest(".auctify-profile")) {
                setProfileOpen(false);
            }
        };

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setProfileOpen(false);
            }
        };

        document.addEventListener("click", onDocClick);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("click", onDocClick);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [profileOpen]);

    const onSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (categoryId) params.set("category_id", categoryId);
        navigate(`/browse?${params.toString()}`);
    };

    const onLogout = async () => {
        try {
            await api.post("/logout");
        } catch {
            // ignore
        }
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const onSaveProfile = (e) => {
        e.preventDefault();
        if (!user) return;

        // For now, keep this local-only to avoid needing an API endpoint.
        // If you want this persisted to DB, we can add a /api/profile update route.
        const nextUser = {
            ...user,
            name: profileName,
            country: profileCountry,
            state: profileState,
            city: profileCity,
            street: profileStreet,
            phone: profilePhone,
        };
        localStorage.setItem("user", JSON.stringify(nextUser));
        setProfileOpen(false);
        // Soft refresh so other components pick up the change.
        navigate(location.pathname);
    };

    return (
        <header className="auctify-header">
            <div className="auctify-header__top">
                <div className="auctify-header__left">
                    {user ? (
                        <div className={`auctify-profile ${profileOpen ? "is-open" : ""}`}>
                            <button
                                type="button"
                                className="auctify-profile__btn"
                                aria-haspopup="dialog"
                                aria-expanded={profileOpen ? "true" : "false"}
                                onClick={() => setProfileOpen((v) => !v)}
                                title="Profile"
                            >
                                <span className="auctify-profile__avatar" aria-hidden="true">
                                    {String(user?.name || "U").slice(0, 1).toUpperCase()}
                                </span>
                                <span className="auctify-profile__label">Profile</span>
                            </button>

                            {profileOpen ? (
                                <div className="auctify-profile__panel" role="dialog" aria-label="User profile">
                                    <div className="auctify-profile__title">{user.name}</div>
                                    <div className="auctify-profile__meta">Role: {user.role}</div>

                                    <form className="auctify-profile__form" onSubmit={onSaveProfile}>
                                        <label>
                                            <span>Name</span>
                                            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                                        </label>
                                        <div className="auctify-profile__grid2">
                                            <label>
                                                <span>Country</span>
                                                <input value={profileCountry} onChange={(e) => setProfileCountry(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>State</span>
                                                <input value={profileState} onChange={(e) => setProfileState(e.target.value)} />
                                            </label>
                                        </div>
                                        <div className="auctify-profile__grid2">
                                            <label>
                                                <span>City</span>
                                                <input value={profileCity} onChange={(e) => setProfileCity(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Phone</span>
                                                <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                                            </label>
                                        </div>
                                        <label>
                                            <span>Street</span>
                                            <input value={profileStreet} onChange={(e) => setProfileStreet(e.target.value)} />
                                        </label>

                                        <div className="auctify-profile__actions">
                                            <button className="auctify-btn auctify-btn--primary" type="submit">Save</button>
                                            <button className="auctify-btn" type="button" onClick={() => setProfileOpen(false)}>Close</button>
                                            <button className="auctify-btn" type="button" onClick={onLogout}>Logout</button>
                                        </div>
                                    </form>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="auctify-header__guest">
                            <Link className="auctify-btn" to="/login">Login</Link>
                            <Link className="auctify-btn auctify-btn--primary" to="/register">Register</Link>
                        </div>
                    )}
                </div>

                <Link to="/" className="auctify-brand auctify-brand--center" aria-label="PrimeFinds home">
                    <img
                        className="auctify-brand__logo"
                        src="/images/primefinds-logo.svg"
                        alt="PrimeFinds"
                        onError={(e) => {
                            // Fallback if SVG can't be loaded for any reason
                            e.currentTarget.src = "/images/logo.png";
                        }}
                    />
                    <span className="auctify-brand__name">PrimeFinds</span>
                </Link>

                <div className="auctify-header__right">
                    <Link className="auctify-btn" to="/browse?ending_soon=1">Ending Soon</Link>
                    {(user?.role === "admin" || user?.role === "super_admin") ? (
                        <Link className="auctify-btn" to="/admin">Admin</Link>
                    ) : null}
                    {user?.role === "seller" ? (
                        <>
                            <Link className="auctify-btn" to="/seller">My Sales</Link>
                            <Link className="auctify-btn" to="/seller/messages">Messages</Link>
                        </>
                    ) : null}
                </div>
            </div>

            <nav className="auctify-nav" aria-label="Secondary">
                <div className="auctify-nav__row">
                    <Link className={location.pathname === "/" ? "is-active" : ""} to="/">Home</Link>
                    <Link className={location.pathname === "/browse" ? "is-active" : ""} to="/browse">Browse</Link>
                    <Link to="/browse?sort=featured">Featured</Link>
                    <Link to="/browse?sort=new">Newly Listed</Link>
                    <Link to="/aboutus">Stories</Link>
                </div>
            </nav>

            <div className="auctify-searchRow">
                <form className="auctify-search" onSubmit={onSearch}>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Category">
                        <option value="">All Categories</option>
                        {(Array.isArray(categories) ? categories : []).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search auctions"
                        aria-label="Search"
                    />
                    <button className="auctify-btn auctify-btn--primary" type="submit">Search</button>
                </form>
            </div>
        </header>
    );
}
