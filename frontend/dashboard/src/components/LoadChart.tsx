"use client";

import { useEffect, useState } from "react";

type FeederState = {
  id: string;
  state: number;
  load_kw: number;
  threshold_kw: number;
  forecast_kw: number[];
};

type Props = {
  feederId: string;
};

export default function LoadChart({ feederId }: Props) {
  const [data, setData] = useState<FeederState | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/feeders/${feederId}/state`
        );
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching feeder state", error);
      }
    };

    fetchState();
  }, [feederId]);

  if (!data) {
    return (
      <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/40">
        <p className="text-sm text-slate-400">Loading feeder data…</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/40">
      <h2 className="text-sm font-semibold text-slate-300 mb-2">
        {data.id} — Load &amp; risk
      </h2>
      <p className="text-xs text-slate-400 mb-3">
        Live load:{" "}
        <span className="text-slate-100 font-medium">{data.load_kw} kW</span> ·
        Threshold:{" "}
        <span className="text-amber-300 font-medium">
          {data.threshold_kw} kW
        </span>
      </p>
      <div className="h-40 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500">
        Chart placeholder — plug Recharts here
      </div>
    </div>
  );
}
