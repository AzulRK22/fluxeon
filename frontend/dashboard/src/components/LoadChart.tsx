"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type FeederState = {
  id: string;
  state: number;
  load_kw: number;
  threshold_kw: number;
  history_kw?: number[];
  forecast_kw?: number[];
};

type Props = {
  feederId: string;
};

type ChartPoint = {
  idx: number;
  load?: number;
  forecast?: number;
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
      <div className="border border-slate-800 rounded-2xl bg-[#02081A] px-4 py-4">
        <p className="text-sm text-slate-400">Loading feeder data…</p>
      </div>
    );
  }

  const history = data.history_kw ?? [
    data.load_kw - 20,
    data.load_kw - 10,
    data.load_kw,
  ];
  const forecast = data.forecast_kw ?? [
    data.load_kw + 5,
    data.load_kw + 10,
    data.load_kw + 15,
  ];

  const chartData: ChartPoint[] = [
    ...history.map((v, i) => ({ idx: i, load: v })),
    ...forecast.map((v, i) => ({
      idx: history.length + i,
      forecast: v,
    })),
  ];

  return (
    <div className="border border-slate-800 rounded-2xl bg-[#02091F] px-4 py-4 shadow-lg shadow-emerald-500/5">
      {" "}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-100">
          {data.id} — Load &amp; forecast
        </h2>
        <span className="text-[11px] text-slate-300">
          Blue: actual · Cyan: forecast · Red: threshold
        </span>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">
        Live load:{" "}
        <span className="text-slate-100 font-medium">
          {data.load_kw.toFixed(1)} kW
        </span>{" "}
        · Threshold:{" "}
        <span className="text-red-400 font-medium">
          {data.threshold_kw.toFixed(1)} kW
        </span>
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="idx"
              tick={{ fontSize: 10, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #1E293B",
                borderRadius: 8,
                fontSize: 12,
                color: "#E5E7EB",
              }}
            />
            <ReferenceLine
              y={data.threshold_kw}
              stroke="#EF4444"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="load"
              stroke="#38BDF8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#22D3EE"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
