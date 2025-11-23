"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type BackendStatus = "checking" | "online" | "offline";

export default function BackendStatusBadge() {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const checkBackend = async () => {
      try {
        // ping rápido: feeders es suficiente
        const res = await fetch(`${API_BASE}/feeders`, { cache: "no-store" });
        if (!cancelled) {
          setStatus(res.ok ? "online" : "offline");
        }
      } catch {
        if (!cancelled) {
          setStatus("offline");
        }
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000); // cada 15s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const commonClasses =
    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border";

  if (status === "checking") {
    return (
      <div
        className={`${commonClasses} border-slate-600 bg-slate-900 text-slate-300`}
      >
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
        Checking backend…
      </div>
    );
  }

  if (status === "online") {
    return (
      <div
        className={`${commonClasses} border-emerald-500/60 bg-emerald-500/10 text-emerald-200`}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Backend: online
      </div>
    );
  }

  return (
    <div
      className={`${commonClasses} border-red-500/60 bg-red-500/10 text-red-200`}
      title="Frontend could not reach FastAPI on port 8000."
    >
      <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
      Backend: offline
    </div>
  );
}
