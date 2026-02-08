import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("/login", { email, password });
            const token = res?.data?.token;
            const user = res?.data?.user;

            if (token) localStorage.setItem("authToken", token);
            if (user) localStorage.setItem("user", JSON.stringify(user));

            navigate("/dashboard");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                (err?.response?.data?.errors ? "Please check your email/password." : null) ||
                "Login failed";
            setError(msg);
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
                        <h2 className="sgw-login__panelTitle">Sign In</h2>

                        <div className="sgw-login__panelSub">
                            New buyer? <Link to="/register">Create an account</Link>
                        </div>

                        {error ? (
                            <div className="sgw-login__alert" role="alert">
                                {error}
                            </div>
                        ) : null}

                        <form onSubmit={onSubmit} className="sgw-login__form">
                            <div className="sgw-login__reqNote">Required fields (*)</div>

                            <label className="sgw-login__label">
                                <div className="sgw-login__labelRow">
                                    <span>Username/Email</span>
                                    <span className="sgw-login__req">*</span>
                                </div>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="Enter Email"
                                    autoComplete="email"
                                    required
                                />
                            </label>

                            <label className="sgw-login__label">
                                <div className="sgw-login__labelRow">
                                    <span>Password</span>
                                    <span className="sgw-login__req">*</span>
                                </div>
                                <div className="sgw-login__password">
                                    <input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        placeholder="Enter Password"
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>
                            </label>

                            <label className="sgw-login__remember">
                                <input type="checkbox" />
                                <span>Remember Me</span>
                            </label>

                            <button className="sgw-login__submit" type="submit" disabled={loading}>
                                {loading ? "Signing in…" : "Sign In"}
                            </button>

                            <div className="sgw-login__links">
                                <a href="#" onClick={(e) => e.preventDefault()}>
                                    Forgot Username?
                                </a>
                                <span className="sgw-login__sep">|</span>
                                <a href="#" onClick={(e) => e.preventDefault()}>
                                    Forgot Password?
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

}