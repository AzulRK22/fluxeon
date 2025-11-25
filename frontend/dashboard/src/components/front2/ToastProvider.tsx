"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: string;
  msg: string;
  type?: "info" | "success" | "error";
}

interface ToastContextValue {
  addToast: (msg: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((msg: string, type: Toast["type"] = "info") => {
    setToasts((prev) => {
      const next: Toast[] = [...prev, { id: crypto.randomUUID(), msg, type }];
      // Auto-trim if too many
      return next.slice(-6);
    });
    // Auto dismiss last added after 4s
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-3 right-3 z-50 space-y-2 w-[240px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "text-xs px-3 py-2 rounded-md shadow border animate-fade-in",
              t.type === "success" && "bg-emerald-600/90 border-emerald-400 text-white",
              t.type === "error" && "bg-red-600/90 border-red-400 text-white",
              t.type === "info" && "bg-slate-800/90 border-slate-600 text-slate-100",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
