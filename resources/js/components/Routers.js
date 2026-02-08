import React, { useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';




import Login from "./Login";
import Register from "./Register";
import Browse from "./Browse";
import AuctionDetail from "./AuctionDetail";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import CreateAuction from "./CreateAuction";
import AuctifyHeader from "./AuctifyHeader";
import AboutUs from "./AboutUs";

function RequireAuth({ children }) {
    const location = useLocation();
    const authed = useMemo(() => {
        const token = localStorage.getItem("authToken");
        const user = localStorage.getItem("user");
        return Boolean(token && user);
    }, [location.pathname]);

    if (!authed) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return children;
}

export default function Routers() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={<Login />}
                />
                <Route
                    path="/register"
                    element={<Register />}
                />
                <Route
                    path="/*"
                    element={
                        <>
                            <AuctifyHeader />
                            <div className="page-content auctify-container">
                                <Routes>
                                    <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                                    <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
                                    <Route path="/browse" element={<RequireAuth><Browse /></RequireAuth>} />
                                    <Route path="/auction/:id" element={<RequireAuth><AuctionDetail /></RequireAuth>} />
                                    <Route path="/auctions/:id" element={<RequireAuth><AuctionDetail /></RequireAuth>} />
                                    <Route path="/aboutus" element={<RequireAuth><AboutUs /></RequireAuth>} />
                                    <Route path="/sell" element={<RequireAuth><CreateAuction /></RequireAuth>} />
                                </Routes>
                            </div>
                        </>
                    }
                />
            </Routes>
        </Router>
    );
}
