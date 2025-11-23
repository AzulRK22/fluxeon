// frontend/dashboard/src/components/StatusChip.tsx

export type FeederRiskState = 0 | 1 | 2;

type Props = {
  /** 0 = normal, 1 = alert, 2 = critical */
  state: FeederRiskState | number | null | undefined;
  /** Si quieres mostrar también el código (0/1/2) al lado del label */
  showCode?: boolean;
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

const TOOLTIP: Record<FeederRiskState, string> = {
  0: "Operating below 85% capacity",
  1: "Above 85% capacity, close to thermal limits",
  2: "Above 95% capacity – overload risk",
};

export default function StatusChip({ state, showCode = false }: Props) {
  // Si viene fuera de rango o null/undefined, lo tratamos como “Unknown” (gris)
  const isValid =
    typeof state === "number" &&
    state >= 0 &&
    state <= 2 &&
    Number.isFinite(state);

  const typedState = isValid ? (state as FeederRiskState) : null;

  const label = typedState !== null ? LABELS[typedState] : "Unknown";
  const colorClasses =
    typedState !== null
      ? COLORS[typedState]
      : "bg-slate-700 text-slate-200 border-slate-500";
  const dotClass =
    typedState !== null ? DOT_COLORS[typedState] : "bg-slate-300";
  const tooltip =
    typedState !== null ? TOOLTIP[typedState] : "Risk state not available";

  const ariaLabel = `Feeder risk: ${label}${
    showCode && typedState !== null ? ` (level ${typedState})` : ""
  }`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border ${colorClasses}`}
      title={tooltip}
      aria-label={ariaLabel}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="whitespace-nowrap">
        {label}
        {showCode && typedState !== null && (
          <span className="ml-1 text-[10px] text-slate-400">
            ({typedState})
          </span>
        )}
      </span>
    </span>
  );
}
