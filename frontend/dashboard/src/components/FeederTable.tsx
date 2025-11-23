import StatusChip from "./StatusChip";

type Feeder = {
  id: string;
  name: string;
  state: number;
  load_kw: number;
};

type Props = {
  feeders: Feeder[];
  selectedFeederId: string | null;
  onSelect: (feeder: Feeder) => void;
};

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
}: Props) {
  return (
    <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/70 shadow-lg shadow-[#00E6980F]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Feeders overview
        </h2>
        <span className="text-[11px] text-slate-500">
          0 = normal · 1 = alert · 2 = critical
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-slate-400 text-xs uppercase tracking-wide">
          <tr className="border-b border-slate-800/80">
            <th className="text-left py-2">Feeder</th>
            <th className="text-left py-2">Load (kW)</th>
            <th className="text-left py-2">State</th>
            <th className="text-left py-2">Risk</th>
          </tr>
        </thead>
        <tbody>
          {feeders.map((f) => {
            const isSelected = f.id === selectedFeederId;
            return (
              <tr
                key={f.id}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "bg-slate-900" : "hover:bg-slate-900/70"
                }`}
                onClick={() => onSelect(f)}
              >
                <td className="py-2">{f.name}</td>
                <td className="py-2">{f.load_kw.toFixed(1)}</td>
                <td className="py-2">
                  <StatusChip state={f.state} />
                </td>
                <td className="py-2 text-xs text-slate-300">
                  {getRiskScore(f.state)}
                </td>
              </tr>
            );
          })}
          {feeders.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="py-4 text-center text-xs text-slate-500"
              >
                Waiting for feeders from backend…
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
