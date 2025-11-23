// frontend/dashboard/src/components/front2/AuditView.tsx
import React, { useState, useMemo } from "react";

export interface AuditLog {
  obpId: string;
  timestamp: string;
  feeder: string;
  dersActivated: string[]; // array of IDs
  requestedKw: number;
  deliveredKw: number;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  duration: number; // seconds
}

export interface AuditViewProps {
  logs?: AuditLog[]; // <- se puede inyectar desde un futuro /audit
  isLoading?: boolean;
  error?: string | null; // <- para mostrar errores de backend si los hay
}

/**
 * Mock data for hackathon demo.
 * In production this should be replaced by a real /audit endpoint
 * that aggregates multiple OBP sessions.
 */
const MOCK_LOGS: AuditLog[] = [
  {
    obpId: "OBP-12345",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    feeder: "F12",
    dersActivated: ["DER-001", "DER-003", "DER-005"],
    requestedKw: 45,
    deliveredKw: 42,
    status: "SUCCESS",
    duration: 3.2,
  },
  {
    obpId: "OBP-12346",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    feeder: "F08",
    dersActivated: ["DER-002", "DER-004", "DER-006", "DER-007", "DER-008"],
    requestedKw: 60,
    deliveredKw: 58,
    status: "SUCCESS",
    duration: 4.1,
  },
  {
    obpId: "OBP-12347",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    feeder: "F15",
    dersActivated: ["DER-010", "DER-011"],
    requestedKw: 30,
    deliveredKw: 28,
    status: "PARTIAL",
    duration: 2.8,
  },
  {
    obpId: "OBP-12348",
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    feeder: "F03",
    dersActivated: ["DER-015"],
    requestedKw: 20,
    deliveredKw: 0,
    status: "FAILED",
    duration: 0,
  },
];

const STATUS_STYLES: Record<AuditLog["status"], string> = {
  SUCCESS: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/50",
  PARTIAL: "bg-amber-500/15 text-amber-300 border border-amber-500/50",
  FAILED: "bg-red-500/15 text-red-300 border border-red-500/50",
};

export const AuditView: React.FC<AuditViewProps> = ({
  logs,
  isLoading = false,
  error = null,
}) => {
  const [searchOBP, setSearchOBP] = useState("");

  // si no nos pasan logs desde back, usamos el mock
  const effectiveLogs = logs && logs.length > 0 ? logs : MOCK_LOGS;

  const filteredLogs = useMemo(() => {
    if (!searchOBP) return effectiveLogs;
    return effectiveLogs.filter((log) =>
      log.obpId.toLowerCase().includes(searchOBP.toLowerCase())
    );
  }, [effectiveLogs, searchOBP]);

  const handleExport = () => {
    const csv = [
      [
        "OBP ID",
        "Timestamp",
        "Feeder",
        "DERs",
        "Requested (kW)",
        "Delivered (kW)",
        "Status",
        "Duration (s)",
      ].join(","),
      ...filteredLogs.map((log) =>
        [
          log.obpId,
          new Date(log.timestamp).toISOString(),
          log.feeder,
          log.dersActivated.join(";"),
          log.requestedKw,
          log.deliveredKw,
          log.status,
          log.duration,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="border border-slate-800 rounded-xl bg-[#02091F] overflow-hidden">
      {/* Header + search */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Audit logs / OBP trail
            </h3>
            <p className="text-[11px] text-slate-400">
              One row per flexibility dispatch. OBP IDs provide regulatory-grade
              traceability.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Showing{" "}
              <span className="font-semibold">{filteredLogs.length}</span>{" "}
              record(s)
            </p>
            {error && (
              <p className="text-[11px] text-red-400 mt-1">
                Backend error: {error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="self-start md:self-auto bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] py-1.5 px-3 rounded-lg font-semibold transition-colors flex items-center gap-1"
          >
            📥 Export CSV
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter by OBP ID (e.g. OBP-12345)"
          value={searchOBP}
          onChange={(e) => setSearchOBP(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-950/70 border-b border-slate-800">
              <th className="px-4 py-2 text-left font-semibold text-slate-300 uppercase tracking-wide">
                OBP ID
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300 uppercase tracking-wide">
                Timestamp
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300 uppercase tracking-wide">
                Feeder
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-300 uppercase tracking-wide">
                DERs
              </th>
              <th className="px-4 py-2 text-center font-semibold text-slate-300 uppercase tracking-wide">
                Requested
              </th>
              <th className="px-4 py-2 text-center font-semibold text-slate-300 uppercase tracking-wide">
                Delivered
              </th>
              <th className="px-4 py-2 text-center font-semibold text-slate-300 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-2 text-center font-semibold text-slate-300 uppercase tracking-wide">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-4 text-center text-slate-400"
                >
                  Loading logs…
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-4 text-center text-slate-400"
                >
                  No logs found for this filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={`${log.obpId}-${log.timestamp}`}
                  className="hover:bg-slate-900/70 transition-colors"
                >
                  <td className="px-4 py-2 text-slate-100 font-semibold">
                    {log.obpId}
                  </td>
                  <td className="px-4 py-2 text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-slate-300">{log.feeder}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {log.dersActivated.slice(0, 2).map((der) => (
                        <span
                          key={der}
                          className="px-2 py-0.5 bg-slate-900 text-slate-200 rounded-full text-[10px]"
                        >
                          {der}
                        </span>
                      ))}
                      {log.dersActivated.length > 2 && (
                        <span className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full text-[10px]">
                          +{log.dersActivated.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center text-slate-200">
                    {log.requestedKw} kW
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-emerald-300">
                    {log.deliveredKw} kW
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        STATUS_STYLES[log.status]
                      }`}
                    >
                      {log.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-slate-400">
                    {log.duration.toFixed(2)} s
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
