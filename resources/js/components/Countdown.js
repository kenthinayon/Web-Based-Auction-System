import React, { useEffect, useState } from "react";
import { formatRemaining, msUntil } from "../lib/time";

export default function Countdown({ endTime }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const ms = msUntil(endTime) + (Date.now() - now);
    const isEnded = ms <= 0;

    return (
        <span className="meta-value" style={{ color: isEnded ? "#dc2626" : undefined }}>
            {isEnded ? "Ended" : formatRemaining(ms)}
        </span>
    );
}
