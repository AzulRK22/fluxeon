"use client";

import { useState, useEffect } from "react";

export default function GlobalStatusIndicator() {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for global update events
    const handleUpdateStart = () => setIsUpdating(true);
    const handleUpdateEnd = () => setIsUpdating(false);

    window.addEventListener("fluxeon:update-start", handleUpdateStart);
    window.addEventListener("fluxeon:update-end", handleUpdateEnd);

    return () => {
      window.removeEventListener("fluxeon:update-start", handleUpdateStart);
      window.removeEventListener("fluxeon:update-end", handleUpdateEnd);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full transition-all duration-300 ${
          isUpdating
            ? "bg-sky-400 shadow-lg shadow-sky-400/50 animate-pulse"
            : "bg-slate-700"
        }`}
      />
      <span
        className={`text-[10px] font-medium transition-colors duration-300 ${
          isUpdating ? "text-sky-300" : "text-slate-600"
        }`}
      >
        {isUpdating ? "Updating" : "Idle"}
      </span>
    </div>
  );
}
