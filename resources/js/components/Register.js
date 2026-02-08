import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Register() {
    const navigate = useNavigate();

    const COUNTRIES = [
        "Philippines",
        "United States",
        "Canada",
        "United Kingdom",
        "Australia",
        "India",
        "Japan",
        "South Korea",
        "Singapore",
        "Malaysia",
        "Indonesia",
        "Vietnam",
        "Thailand",
        "United Arab Emirates",
    ];

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("buyer");
    const [country, setCountry] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [street, setStreet] = useState("");
    const [phone, setPhone] = useState("");
    const [captchaAck, setCaptchaAck] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const getCsrf = async () => {
        try {
            // sanctum cookie endpoint is not under /api
            await api.get("/sanctum/csrf-cookie", { baseURL: "/" });
        } catch {
            // ignore
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await getCsrf();
            const res = await api.post("/register", {
                name,
                email,
                role,
                country,
                state,
                city,
                street,
                phone,
                captcha_ack: captchaAck,
                password,
                password_confirmation: passwordConfirmation,
            });

            localStorage.setItem("authToken", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            navigate("/dashboard");
        } catch (err) {
            const resp = err?.response?.data;
            const firstFieldError = resp?.errors ? Object.values(resp.errors)?.flat()?.[0] : null;
            setError(firstFieldError || resp?.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sgw-login">
            <div className="sgw-login__inner">
                <div className="sgw-login__left">
                    <div className="sgw-login__brand" aria-label="ShopGoodwill style header">
                        <img
                            className="sgw-login__logo"
                            src="/images/primefinds-logo.svg"
                            alt="PrimeFinds"
                            onError={(e) => {
                                e.currentTarget.src = "/images/logo.png";
                            }}
                        />
                    </div>

                    <h2 className="sgw-login__title">Shop on PrimeFinds</h2>
                    <p className="sgw-login__copy">
                        Browse auctions and place bids on items you love. Create an account to bid, and if you're a seller,
                        list items for auction.
                    </p>

                    <div className="sgw-login__imageWrap" aria-hidden="true">
                        <img
                            className="sgw-login__image"
                            src="https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=60"
                            alt=""
                        />
                    </div>
                </div>

                <div className="sgw-login__right">
                    <div className="sgw-login__panel">
                        <h2 className="sgw-login__panelTitle">Create New Account</h2>

                        <div className="sgw-login__panelSub">
                            Already have an account? <Link to="/login">Sign in</Link>
                        </div>

                        {error ? (
                            <div className="sgw-login__alert" role="alert">
                                {error}
                            </div>
                        ) : null}

                        <form onSubmit={onSubmit} className={`sgw-login__form ${loading ? "is-loading" : ""}`}>
                            <div className="sgw-login__reqNote">Required fields (*)</div>

                            <label className="sgw-login__label">
                                <div className="sgw-login__labelRow">
                                    <span>Full name</span>
                                    <span className="sgw-login__req">*</span>
                                </div>
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Full Name" required />
                            </label>

                            <label className="sgw-login__label">
                                <div className="sgw-login__labelRow">
                                    <span>Email address</span>
                                    <span className="sgw-login__req">*</span>
                                </div>
                                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Email address" type="email" required />
                            </label>

                            <label className="sgw-login__label">
                                <div className="sgw-login__labelRow">
                                    <span>Account type</span>
                                    <span className="sgw-login__req">*</span>
                                </div>
                                <select className="sgw-login__select" value={role} onChange={(e) => setRole(e.target.value)} required>
                                    <option value="buyer">Buyer (place bids)</option>
                                    <option value="seller">Seller (list items)</option>
                                </select>
                            </label>

                            <div className="sgw-login__grid2">
                                <label className="sgw-login__label">
                                    <div className="sgw-login__labelRow">
                                        <span>Country</span>
                                        <span className="sgw-login__req">*</span>
                                    </div>
                                    <select
                                        className="sgw-login__select"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>
                                            Select country
                                        </option>
                                        {COUNTRIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="sgw-login__label">
                                    <div className="sgw-login__labelRow">
                                        <span>State</span>
                                        <span className="sgw-login__req">*</span>
                                    </div>
                                    <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Enter State" required />
                                </label>
                            </div>

                            <div className="sgw-login__grid2">
                                <label className="sgw-login__label">
                                    <div className="sgw-login__labelRow">
                                        <span>City</span>
                                        <span className="sgw-login__req">*</span>
                                    </div>
                                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter City" required />
                                </label>
                                <label className="sgw-login__label">
                                    <div className="sgw-login__labelRow">
                                        <span>Phone number</span>
                                        <span className="sgw-login__req">*</span>
                                    </div>
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter Phone" required />
                                </label>
                            </div>

                            <label className="sgw-login__label">
                                <div className="sgw-login__labelRow">
                                    <span>Street</span>
                                    <span className="sgw-login__req">*</span>
                                </div>
                                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Enter Street" required />
                            </label>

                            <div className="sgw-login__grid2">
                                <label className="sgw-login__label">
                                    <div className="sgw-login__labelRow">
                                        <span>Password</span>
                                        <span className="sgw-login__req">*</span>
                                    </div>
                                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Password" type="password" required />
                                    <div className="sgw-login__hint">
                                        Must be 8+ characters and include a letter, a number, and a special character.
                                    </div>
                                </label>

                                <label className="sgw-login__label">
                                    <div className="sgw-login__labelRow">
                                        <span>Confirm Password</span>
                                        <span className="sgw-login__req">*</span>
                                    </div>
                                    <input value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Enter Confirm Password" type="password" required />
                                </label>
                            </div>

                            <label className="sgw-login__remember" style={{ justifyContent: "flex-start" }}>
                                <input checked={captchaAck} onChange={(e) => setCaptchaAck(e.target.checked)} type="checkbox" />
                                <span>I'm not a robot</span>
                                <span className="sgw-login__req">*</span>
                            </label>

                            <button className="sgw-login__submit" type="submit" disabled={loading}>
                                {loading ? "Creating…" : "Create Account"}
                            </button>

                            {loading ? <div className="sgw-login__loadingOverlay" aria-hidden="true" /> : null}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
