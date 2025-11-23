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

export default function FeederTable({
  feeders,
  selectedFeederId,
  onSelect,
}: Props) {
  return (
    <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/40">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">
        Feeders overview
      </h2>
      <table className="w-full text-sm">
        <thead className="text-slate-400">
          <tr className="border-b border-slate-800/80">
            <th className="text-left py-2">Feeder</th>
            <th className="text-left py-2">Load (kW)</th>
            <th className="text-left py-2">State</th>
          </tr>
        </thead>
        <tbody>
          {feeders.map((f) => {
            const isSelected = f.id === selectedFeederId;
            return (
              <tr
                key={f.id}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "bg-slate-800/70" : "hover:bg-slate-900/60"
                }`}
                onClick={() => onSelect(f)}
              >
                <td className="py-2">{f.name}</td>
                <td className="py-2">{f.load_kw.toFixed(1)}</td>
                <td className="py-2">
                  <StatusChip state={f.state} />
                </td>
              </tr>
            );
          })}
          {feeders.length === 0 && (
            <tr>
              <td
                colSpan={3}
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
