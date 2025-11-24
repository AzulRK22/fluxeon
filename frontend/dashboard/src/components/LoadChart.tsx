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

const RISK_LABELS: Record<number, string> = {
  0: "Normal",
  1: "Alert",
  2: "Critical",
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function LoadChart({ feederId }: Props) {
  const [data, setData] = useState<FeederStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchState = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/feeders/${encodeURIComponent(feederId)}/state`,
          { cache: "no-store" }
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
    const interval = setInterval(fetchState, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [feederId]);

  if (error) {
    return (
      <div className="border border-slate-800 rounded-2xl bg-[#02081A] px-4 py-4 h-full flex items-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border border-slate-800 rounded-2xl bg-[#02081A] px-4 py-4 h-full flex items-center">
        <p className="text-sm text-slate-400">Loading feeder data…</p>
      </div>
    );
  }

  // --- Normalización de campos ---
  const feederLabel = data.feeder_id ?? data.id ?? feederId;

  const liveLoad = data.current_load_kw ?? data.load_kw ?? null;

  const thresholdKw = data.threshold_kw ?? 1500 * 0.85;

  // Risk (nuevo: risk_level, fallback: state antiguo)
  const rawRiskLevel =
    typeof data.risk_level === "number"
      ? data.risk_level
      : typeof data.state === "number"
      ? data.state
      : null;

  const riskLabel =
    rawRiskLevel != null ? RISK_LABELS[rawRiskLevel] ?? "Unknown" : null;

  // Historial / forecast
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
    historyPoints = [
      { idx: 0, label: "t-2", load: liveLoad - 20 },
      { idx: 1, label: "t-1", load: liveLoad - 10 },
      { idx: 2, label: "t0", load: liveLoad },
    ];
  }

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

  const lastUpdate =
    data.timestamp != null
      ? new Date(data.timestamp).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  const chartData: ChartPoint[] = [...historyPoints, ...forecastPoints];

  return (
    <div className="border border-slate-800 rounded-2xl bg-[#02091F] px-4 py-4 shadow-lg shadow-emerald-500/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            {feederLabel} — Load &amp; forecast
          </h2>
          {riskLabel != null && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Risk level:{" "}
              <span className="font-medium text-slate-100">
                {rawRiskLevel} ({riskLabel})
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-slate-300">
            Blue: actual · Cyan: forecast · Red: threshold
          </span>
          {lastUpdate && (
            <span className="text-[10px] text-slate-500">
              Last update: {lastUpdate} UTC
            </span>
          )}
        </div>
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

      {/* El chart ocupa todo el espacio vertical disponible y se alinea con el alto de la columna */}
      <div className="flex-1 min-h-80">
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

      <p className="mt-3 text-[11px] text-slate-500">
        AI model: MLP (3-class) · Trained on 60 days synthetic LV feeder history
        · Test accuracy ≈ 99%.
      </p>
    </div>
  );
}
