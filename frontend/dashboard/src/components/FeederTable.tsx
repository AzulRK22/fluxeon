// frontend/dashboard/src/components/FeederTable.tsx
import StatusChip from "./StatusChip";

export interface Feeder {
  id: string;
  name: string;
  state: number; // 0 = normal, 1 = warning, 2 = critical (risk_label)
  load_kw: number;
  temperature?: number; // opcional, viene del backend
}

interface Props {
  feeders: Feeder[];
  selectedFeederId: string | null;
  onSelect: (feeder: Feeder) => void;
  isLoading?: boolean;
}

function getRiskScore(state: number): string {
  switch (state) {
    case 0:
      return "Low";
    case 1:
      return "Medium";
    case 2:
      return "High";
    default:
      return "-";
  }
}

export default function FeederTable({
  feeders,
  selectedFeederId,
  onSelect,
  isLoading = false,
}: Props) {
  const hasFeeders = feeders.length > 0;

  return (
    <div className="border border-slate-800 rounded-2xl bg-[#02091F] px-4 py-4 shadow-lg shadow-emerald-500/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Feeders overview
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Live risk from AI model · {feeders.length} feeder(s)
          </p>
        </div>
        <span className="text-[11px] text-slate-500">
          0 = normal · 1 = warning · 2 = critical
        </span>
      </div>

      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/70 text-[11px] text-slate-400 uppercase tracking-wide">
            <tr>
              <th className="text-left py-2 px-3">Feeder</th>
              <th className="text-left py-2 px-3">Load (kW)</th>
              <th className="text-left py-2 px-3">State</th>
              <th className="text-left py-2 px-3">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {isLoading && (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 px-3 text-center text-xs text-slate-500"
                >
                  Pulling live feeders from backend…
                </td>
              </tr>
            )}

            {!isLoading &&
              hasFeeders &&
              feeders.map((f) => {
                const isSelected = f.id === selectedFeederId;
                const loadText = Number.isFinite(f.load_kw)
                  ? f.load_kw.toFixed(1)
                  : "–";

                return (
                  <tr
                    key={f.id}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-slate-900"
                        : "hover:bg-slate-900/70 focus-visible:bg-slate-900/80"
                    }`}
                    onClick={() => onSelect(f)}
                  >
                    <td className="py-2.5 px-3 text-slate-100">{f.name}</td>
                    <td className="py-2.5 px-3 text-slate-100">{loadText}</td>
                    <td className="py-2.5 px-3">
                      <StatusChip state={f.state} />
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-200">
                      {getRiskScore(f.state)}
                    </td>
                  </tr>
                );
              })}

            {!isLoading && !hasFeeders && (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 px-3 text-center text-xs text-slate-500"
                >
                  Waiting for feeders from backend…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
