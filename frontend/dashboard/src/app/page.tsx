"use client";

import { useEffect, useMemo, useState } from "react";
import FeederTable from "@/components/FeederTable";
import LoadChart from "@/components/LoadChart";

type Feeder = {
  id: string;
  name: string;
  state: number; // 0,1,2
  load_kw: number;
};

export default function CommandCentrePage() {
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [selectedFeeder, setSelectedFeeder] = useState<Feeder | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeeders = async () => {
      try {
        const res = await fetch("http://localhost:8000/feeders");
        const data = await res.json();
        if (!isMounted) return;

        setFeeders(data);
        if (!selectedFeeder && data.length > 0) {
          setSelectedFeeder(data[0]);
        } else if (selectedFeeder) {
          const updated = data.find((f: Feeder) => f.id === selectedFeeder.id);
          if (updated) setSelectedFeeder(updated);
        }
      } catch (error) {
        console.error("Error fetching feeders", error);
      }
    };

    fetchFeeders();
    const interval = setInterval(fetchFeeders, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedFeeder]);

  const kpis = useMemo(() => {
    const total = feeders.length;
    const alerts = feeders.filter((f) => f.state === 1).length;
    const critical = feeders.filter((f) => f.state === 2).length;
    return { total, alerts, critical };
  }, [feeders]);

  return (
    <>
      {/* KPI strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            In alert
          </p>
          <p className="text-2xl font-semibold mt-1 text-amber-400">
            {kpis.alerts}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#02081A] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Critical
          </p>
          <p className="text-2xl font-semibold mt-1 text-red-400">
            {kpis.critical}
          </p>
        </div>
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5">
          <FeederTable
            feeders={feeders}
            selectedFeederId={selectedFeeder?.id ?? null}
            onSelect={setSelectedFeeder}
          />
        </div>
        <div className="col-span-12 lg:col-span-7">
          {selectedFeeder ? (
            <LoadChart feederId={selectedFeeder.id} />
          ) : (
            <div className="border border-slate-800 rounded-2xl bg-[#02081A] px-4 py-6 text-sm text-slate-400">
              Select a feeder on the left to inspect its load profile and risk.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
