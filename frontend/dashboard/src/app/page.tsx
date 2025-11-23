// frontend/dashboard/src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import FeederTable, { Feeder } from "@/components/FeederTable";
import LoadChart from "@/components/LoadChart";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function CommandCentrePage() {
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [selectedFeeder, setSelectedFeeder] = useState<Feeder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

        // selección inteligente
        if (!selectedFeeder && data.length > 0) {
          setSelectedFeeder(data[0]);
        } else if (selectedFeeder) {
          const updated = data.find((f) => f.id === selectedFeeder.id);
          if (updated) setSelectedFeeder(updated);
        }
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

    // Primera carga
    fetchFeeders();
    // Polling cada 2.5s
    const interval = setInterval(fetchFeeders, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeeder?.id]);

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
      <section className="grid grid-cols-12 gap-4 mt-4">
        <div className="col-span-12 lg:col-span-5">
          <FeederTable
            feeders={feeders}
            selectedFeederId={selectedFeeder?.id ?? null}
            onSelect={(feeder) => setSelectedFeeder(feeder)}
            isLoading={isLoading}
          />
        </div>

        <div className="col-span-12 lg:col-span-7">
          {selectedFeeder ? (
            <LoadChart feederId={selectedFeeder.id} />
          ) : (
            <div className="border border-slate-800 rounded-2xl bg-[#02081A] px-4 py-6 text-sm text-slate-400">
              Select a feeder on the left to inspect its AI-predicted risk and
              load forecast.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
