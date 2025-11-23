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
      <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/70">
        <p className="text-sm text-slate-400">Loading feeder data…</p>
      </div>
    );
  }

  const history = data.history_kw ?? [
    data.load_kw - 30,
    data.load_kw - 10,
    data.load_kw,
  ];
  const forecast = data.forecast_kw ?? [data.load_kw + 5, data.load_kw + 10];

  const chartData: ChartPoint[] = [
    ...history.map((v, i) => ({ idx: i, load: v })),
    ...forecast.map((v, i) => ({ idx: history.length + i, forecast: v })),
  ];

  return (
    <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/70 shadow-lg shadow-cyan-500/10">
      <h2 className="text-sm font-semibold text-slate-200 mb-1">
        {data.id} — Load &amp; forecast
      </h2>
      <p className="text-[11px] text-slate-500 mb-3">
        Live load:{" "}
        <span className="text-slate-100 font-medium">
          {data.load_kw.toFixed(1)} kW
        </span>{" "}
        · Threshold:{" "}
        <span className="text-[#FF3B30] font-medium">
          {data.threshold_kw.toFixed(1)} kW
        </span>
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="idx"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #1e293b",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            {/* línea roja: umbral */}
            <ReferenceLine
              y={data.threshold_kw}
              stroke="#FF3B30"
              strokeDasharray="4 4"
            />
            {/* azul: carga real */}
            <Line
              type="monotone"
              dataKey="load"
              stroke="#38BDF8"
              strokeWidth={2}
              dot={false}
            />
            {/* cyan punteada: forecast */}
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
