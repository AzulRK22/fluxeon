// frontend/dashboard/src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import FeederTable, { Feeder } from "@/components/FeederTable";
import LoadChart from "@/components/LoadChart";
import FeederDetailDrawer from "@/components/FeederDetailDrawer";
import { useSearchParams } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function CommandCentrePage() {
  const searchParams = useSearchParams();

  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [selectedFeeder, setSelectedFeeder] = useState<Feeder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🔁 Polling de feeders
  useEffect(() => {
    let isMounted = true;

    const fetchFeeders = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/feeders`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch feeders (${res.status})`);
        }

        const data = (await res.json()) as Feeder[];
        if (!isMounted) return;

        setFeeders(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching feeders", err);
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unexpected error while loading feeders."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFeeders();
    const interval = setInterval(fetchFeeders, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 🎯 Selección inteligente + respetar ?feeder=F1
  useEffect(() => {
    const urlFeederId = searchParams.get("feeder");

    setSelectedFeeder((prev) => {
      if (feeders.length === 0) return null;

      // Si la URL pide un feeder concreto, intentamos usarlo
      if (urlFeederId) {
        const fromUrl = feeders.find((f) => f.id === urlFeederId);
        if (fromUrl) return fromUrl;
      }

      // Si ya había uno seleccionado y sigue existiendo, lo conservamos
      if (prev) {
        const updated = feeders.find((f) => f.id === prev.id);
        if (updated) return updated;
      }

      // Fallback: primer feeder
      return feeders[0];
    });
  }, [feeders, searchParams]);

  const kpis = useMemo(() => {
    const total = feeders.length;
    const alerts = feeders.filter((f) => f.state === 1).length;
    const critical = feeders.filter((f) => f.state === 2).length;
    const avgLoad =
      total > 0
        ? Math.round(feeders.reduce((sum, f) => sum + f.load_kw, 0) / total)
        : 0;

    return { total, alerts, critical, avgLoad };
  }, [feeders]);

  return (
    <>
      {/* Header info strip */}
      <section className="mb-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <p className="text-[11px] text-slate-400">
          Live LV feeder snapshot · AI-powered risk classification for each
          feeder.
        </p>
        <p className="text-[11px] text-slate-500">
          Data refresh every{" "}
          <span className="font-semibold text-slate-200">2.5s</span> · All
          timestamps in <span className="font-mono">UTC</span>.
        </p>
      </section>

      {/* KPI strip */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-[#02091F] px-4 py-3 flex flex-col justify-between">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Feeders monitored
          </p>
          <p className="text-3xl font-semibold mt-1 text-slate-100">
            {kpis.total}
            <span className="text-sm text-slate-500 ml-1">total</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#02081A] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            In alert (risk = 1)
          </p>
          <p className="text-2xl font-semibold mt-1 text-amber-400">
            {kpis.alerts}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#22040F] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Critical (risk = 2)
          </p>
          <p className="text-2xl font-semibold mt-1 text-red-400">
            {kpis.critical}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#02091F] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Avg feeder load
          </p>
          <p className="text-2xl font-semibold mt-1 text-sky-300">
            {kpis.avgLoad}
            <span className="text-sm text-slate-500 ml-1">kW</span>
          </p>
        </div>
      </section>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200">
          <p className="font-semibold">Backend connection issue</p>
          <p className="mt-1">
            {error} · Check that <code className="font-mono">uvicorn</code> is
            running on <code className="font-mono">8000</code> and that CORS is
            enabled.
          </p>
        </div>
      )}

      {/* Main grid */}
      <section className="grid grid-cols-12 gap-4 mt-4 items-stretch">
        {/* Columna izquierda */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
          <FeederTable
            feeders={feeders}
            selectedFeederId={selectedFeeder?.id ?? null}
            onSelect={(feeder) => setSelectedFeeder(feeder)}
            isLoading={isLoading}
          />

          {selectedFeeder && (
            <FeederDetailDrawer
              feeder={selectedFeeder}
              onClose={() => setSelectedFeeder(null)}
            />
          )}
        </div>

        {/* Columna derecha */}
        <div className="col-span-12 lg:col-span-7">
          {selectedFeeder ? (
            <LoadChart feederId={selectedFeeder.id} />
          ) : (
            <div className="border border-slate-800 rounded-2xl bg-[#02081A] px-4 py-6 text-sm text-slate-400 h-full flex items-center">
              Select a feeder on the left to inspect its AI-predicted risk and
              load forecast.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
