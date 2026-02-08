import React from "react";

export default function StatusPill({ label }) {
    const normalized = String(label || "").toLowerCase();
    let cls = "status-pill";

    if (normalized.includes("active")) cls += " status-pill--active";
    else if (normalized.includes("upcoming")) cls += " status-pill--upcoming";
    else cls += " status-pill--ended";

    return <span className={cls}>{label}</span>;
}
