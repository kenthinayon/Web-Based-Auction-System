export function formatMoney(value) {
    const n = Number(value ?? 0);
    // MVP: PHP currency formatting; change to USD later if needed
    return n.toLocaleString(undefined, { style: "currency", currency: "PHP" });
}

export function msUntil(isoOrDate) {
    const t = new Date(isoOrDate).getTime();
    return t - Date.now();
}

export function formatRemaining(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
