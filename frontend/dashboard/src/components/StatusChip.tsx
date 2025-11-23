type Props = {
  state: number; // 0=normal, 1=alert, 2=critical
};

const LABELS: Record<number, string> = {
  0: "Normal",
  1: "Alert",
  2: "Critical",
};

const COLORS: Record<number, string> = {
  0: "bg-[#00E6981A] text-[#00E698] border-[#00E69833]",
  1: "bg-[#FFC62E1A] text-[#FFC62E] border-[#FFC62E33]",
  2: "bg-[#FF3B301A] text-[#FF3B30] border-[#FF3B3033]",
};

export default function StatusChip({ state }: Props) {
  const label = LABELS[state] ?? "Unknown";
  const colorClasses = COLORS[state] ?? "bg-slate-700 text-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${colorClasses}`}
    >
      {label}
    </span>
  );
}
