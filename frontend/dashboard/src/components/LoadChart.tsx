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

type HistoryPoint = {
  timestamp: string;
  load_kw: number;
  temperature?: number;
  is_workday?: boolean;
  risk_label?: number;
};

// Unión “flexible” para soportar backend viejo y nuevo
type FeederStateResponse = {
  // nueva versión AI
  feeder_id?: string;
  timestamp?: string;
  risk_level?: number;
  current_load_kw?: number;
  forecast_load_kw?: number;
  message?: string;
  recent_history?: HistoryPoint[];

  // versión antigua simple
  id?: string;
  state?: number;
  load_kw?: number;
  threshold_kw?: number;
  critical_threshold_kw?: number;
  history_kw?: number[];
  forecast_kw?: number[];
};

type Props = {
  feederId: string;
};

type ChartPoint = {
  idx: number;
  label: string;
  load?: number;
  forecast?: number;
};

export default function LoadChart({ feederId }: Props) {
  const [data, setData] = useState<FeederStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchState = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/feeders/${feederId}/state`
        );
        if (!res.ok) throw new Error("Failed to fetch feeder state");
        const json: FeederStateResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching feeder state", err);
        if (!cancelled) {
          setError("Unable to load feeder state.");
        }
      }
    };

    fetchState();

    // Opcional: si quieres polling del estado
    const interval = setInterval(fetchState, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [feederId]);

  if (error) {
    return (
      <div className="border border-slate-800 rounded-2xl bg-[#02081A] px-4 py-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border border-slate-800 rounded-2xl bg-[#02081A] px-4 py-4">
        <p className="text-sm text-slate-400">Loading feeder data…</p>
      </div>
    );
  }

  // 🔹 Normalizamos campos para que den igual backend viejo o nuevo
  const feederLabel = data.feeder_id ?? data.id ?? feederId;

  const liveLoad =
    data.current_load_kw ?? // nuevo backend
    data.load_kw ?? // viejo backend
    null;

  // Umbral: si el backend nuevo no lo manda, usamos el de la versión vieja o un fallback
  const thresholdKw =
    data.threshold_kw ??
    // fallback aproximado: 85% de 1500 (config del simulador)
    1500 * 0.85;

  // Historial: usar recent_history (nuevo) o history_kw (viejo)
  let historyPoints: ChartPoint[] = [];

  if (data.recent_history && data.recent_history.length > 0) {
    historyPoints = data.recent_history.map((h, idx) => ({
      idx,
      label: new Date(h.timestamp).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      load: h.load_kw,
    }));
  } else if (
    data.history_kw &&
    data.history_kw.length > 0 &&
    liveLoad != null
  ) {
    historyPoints = data.history_kw.map((v, idx) => ({
      idx,
      label: `${idx}`,
      load: v,
    }));
  } else if (liveLoad != null) {
    // fallback mínimo para que el chart no esté vacío
    historyPoints = [
      { idx: 0, label: "t-2", load: liveLoad - 20 },
      { idx: 1, label: "t-1", load: liveLoad - 10 },
      { idx: 2, label: "t0", load: liveLoad },
    ];
  }

  // Forecast: usamos forecast_load_kw (nuevo) o forecast_kw (viejo) o simple extrapolación
  let forecastPoints: ChartPoint[] = [];

  if (typeof data.forecast_load_kw === "number") {
    const lastIdx = historyPoints.length;
    forecastPoints = [
      {
        idx: lastIdx,
        label: "t+1",
        forecast: data.forecast_load_kw,
      },
    ];
  } else if (data.forecast_kw && data.forecast_kw.length > 0) {
    const startIdx = historyPoints.length;
    forecastPoints = data.forecast_kw.map((v, i) => ({
      idx: startIdx + i,
      label: `t+${i + 1}`,
      forecast: v,
    }));
  } else if (historyPoints.length >= 2) {
    const last = historyPoints[historyPoints.length - 1].load ?? liveLoad ?? 0;
    const prev = historyPoints[historyPoints.length - 2].load ?? last;
    const slope = last - prev;
    forecastPoints = [
      {
        idx: historyPoints.length,
        label: "t+1",
        forecast: last + slope,
      },
    ];
  }

  const chartData: ChartPoint[] = [...historyPoints, ...forecastPoints];

  return (
    <div className="border border-slate-800 rounded-2xl bg-[#02091F] px-4 py-4 shadow-lg shadow-emerald-500/5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-100">
          {feederLabel} — Load &amp; forecast
        </h2>
        <span className="text-[11px] text-slate-300">
          Blue: actual · Cyan: forecast · Red: threshold
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">
        Live load:{" "}
        <span className="text-slate-100 font-medium">
          {liveLoad != null ? `${liveLoad.toFixed(1)} kW` : "–"}
        </span>{" "}
        · Threshold:{" "}
        <span className="text-red-400 font-medium">
          {thresholdKw.toFixed(1)} kW
        </span>
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="label"
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
              y={thresholdKw}
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
