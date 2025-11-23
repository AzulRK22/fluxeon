import React from "react";

export interface DERCardProps {
  id: string;
  name: string;
  type: "EV" | "BATTERY" | "HVAC" | "LOAD" | "PV";
  capacity: number; // kW total
  available: number; // kW still available
  status: "AVAILABLE" | "ALLOCATED" | "ACTIVE" | "UNAVAILABLE";
  responseTime?: number; // seconds
  cost?: number; // price per kWh
}

const STATUS_STYLES: Record<DERCardProps["status"], string> = {
  AVAILABLE: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/60",
  ALLOCATED: "bg-amber-500/15 text-amber-300 border border-amber-500/60",
  ACTIVE: "bg-sky-500/15 text-sky-300 border border-sky-500/60",
  UNAVAILABLE: "bg-red-500/15 text-red-300 border border-red-500/60",
};

const TYPE_ICONS: Record<DERCardProps["type"], string> = {
  EV: "🔋",
  BATTERY: "⚡",
  HVAC: "❄️",
  LOAD: "📊",
  PV: "☀️",
};

export const DERCard: React.FC<DERCardProps> = ({
  id,
  name,
  type,
  capacity,
  available,
  status,
  responseTime,
  cost,
}) => {
  const utilization =
    capacity > 0 ? ((capacity - available) / capacity) * 100 : 0;
  const utilizationPercent = Math.min(100, Math.max(0, utilization));

  const utilizationColor =
    utilizationPercent >= 80
      ? "bg-red-500"
      : utilizationPercent >= 50
      ? "bg-amber-400"
      : "bg-emerald-400";

  const usedKw = Math.max(0, capacity - available);

  return (
    <div className="border border-slate-800 rounded-xl bg-[#02091F] px-3.5 py-3 shadow-sm hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">
            {TYPE_ICONS[type] ?? "⚡"}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 leading-snug">
              {name}
            </h4>
            <p className="text-[11px] text-slate-500">{id}</p>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
        >
          {status.toLowerCase()}
        </span>
      </div>

      {/* Capacity / Utilization */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-slate-400">Utilisation</span>
          <span className="text-[11px] font-medium text-slate-200">
            {usedKw} / {capacity} kW ·{" "}
            {Number.isFinite(utilizationPercent)
              ? `${Math.round(utilizationPercent)}%`
              : "–"}
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full ${utilizationColor} transition-all duration-300`}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-slate-400">Type</span>
          <p className="text-slate-100 font-medium mt-0.5">{type}</p>
        </div>
        <div>
          <span className="text-slate-400">Available</span>
          <p className="text-emerald-300 font-medium mt-0.5">{available} kW</p>
        </div>
        {responseTime !== undefined && (
          <div>
            <span className="text-slate-400">Response time</span>
            <p className="text-slate-100 font-medium mt-0.5">
              {responseTime.toFixed(1)} s
            </p>
          </div>
        )}
        {cost !== undefined && (
          <div>
            <span className="text-slate-400">Cost</span>
            <p className="text-slate-100 font-medium mt-0.5">
              ${cost.toFixed(2)}/kWh
            </p>
          </div>
        )}
      </div>

      {/* Quick action */}
      {status === "AVAILABLE" && (
        <button className="w-full mt-3 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 text-xs font-semibold py-2 transition-colors">
          Allocate flexibility
        </button>
      )}
    </div>
  );
};
