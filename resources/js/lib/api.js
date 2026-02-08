import axios from "axios";

// Axios wrapper for Auctify API calls
const api = axios.create({
    // Laravel API routes are under /api (routes/api.php)
    baseURL: "/api",
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
