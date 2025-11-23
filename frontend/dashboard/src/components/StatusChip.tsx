// frontend/dashboard/src/components/StatusChip.tsx

export type FeederRiskState = 0 | 1 | 2;

type Props = {
  /** 0 = normal, 1 = alert, 2 = critical */
  state: FeederRiskState | number;
};

const LABELS: Record<FeederRiskState, string> = {
  0: "Normal",
  1: "Alert",
  2: "Critical",
};

const COLORS: Record<FeederRiskState, string> = {
  0: "bg-emerald-500/15 text-emerald-300 border-emerald-500/60",
  1: "bg-amber-500/15 text-amber-300 border-amber-500/60",
  2: "bg-red-500/15 text-red-300 border-red-500/60",
};

const DOT_COLORS: Record<FeederRiskState, string> = {
  0: "bg-emerald-400",
  1: "bg-amber-400",
  2: "bg-red-400",
};

export default function StatusChip({ state }: Props) {
  const typedState = (state ?? 0) as FeederRiskState;

  const label = LABELS[typedState] ?? "Unknown";
  const colorClasses =
    COLORS[typedState] ?? "bg-slate-700 text-slate-200 border-slate-500";
  const dotClass = DOT_COLORS[typedState] ?? "bg-slate-300";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border ${colorClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
