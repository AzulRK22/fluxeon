type Props = {
  state: number; // 0=normal, 1=alert, 2=critical
};

const LABELS: Record<number, string> = {
  0: "Normal",
  1: "Alert",
  2: "Critical",
};

const COLORS: Record<number, string> = {
  0: "bg-emerald-500/15 text-emerald-300 border-emerald-500/60",
  1: "bg-amber-500/15 text-amber-300 border-amber-500/60",
  2: "bg-red-500/15 text-red-300 border-red-500/60",
};

export default function StatusChip({ state }: Props) {
  const label = LABELS[state] ?? "Unknown";
  const colorClasses = COLORS[state] ?? "bg-slate-700 text-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${colorClasses}`}
    >
      {label}
    </span>
  );
}
