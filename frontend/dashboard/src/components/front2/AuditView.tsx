// frontend/dashboard/src/components/front2/AuditView.tsx
"use client";

import React from "react";
import type { SimpleAuditLog } from "@/hooks/useFront2Hooks";

interface AuditViewProps {
  /** Logs reales agregados por OBP (si vienen del backend) */
  logsFromBackend?: SimpleAuditLog[];
  /** Para botón "Refetch from backend" */
  onRefetch?: () => void;
  isLoading?: boolean;
}

/** Mock de ejemplo para cuando no hay backend conectado */
const MOCK_LOGS: SimpleAuditLog[] = [
  {
    obpId: "OBP-12345",
    entries: [
      {
        ts: "2025-11-22T10:00:00Z",
        message: "DISCOVER -> Found 3 DERs",
      },
      {
        ts: "2025-11-22T10:00:01Z",
        message: "SELECT -> Allocated 2 DERs for dispatch",
      },
    ],
  },
  {
    obpId: "OBP-12346",
    entries: [
      {
        ts: "2025-11-22T10:05:10Z",
        message: "INIT -> Contract terms confirmed",
      },
      {
        ts: "2025-11-22T10:05:12Z",
        message: "CONFIRM -> Flexibility order dispatched",
      },
    ],
  },
];

export const AuditView: React.FC<AuditViewProps> = ({
  logsFromBackend,
  onRefetch,
  isLoading = false,
}) => {
  const logs =
    logsFromBackend && logsFromBackend.length > 0 ? logsFromBackend : MOCK_LOGS;

  const rows = logs.flatMap((log) =>
    log.entries.map((entry) => ({
      obpId: log.obpId,
      ts: entry.ts,
      message: entry.message,
      latency_ms: entry.latency_ms,
    }))
  );

  const handleExportCsv = () => {
    const header = "obpId,timestamp,message";
    const body = rows
      .map((r) => {
        const safeMessage = `"${String(r.message).replace(/"/g, '""')}"`;
        return `${r.obpId},${r.ts},${safeMessage}`;
      })
      .join("\n");

    const csvContent = `${header}\n${body}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fluxeon_audit_events.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-400">
          Aggregated OBP audit trail · Each row is a Beckn call logged by the
          backend or mock.
        </p>
        <div className="flex items-center gap-2">
          {onRefetch && (
            <button
              type="button"
              onClick={onRefetch}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md border border-sky-500/60 bg-sky-500/10 text-[11px] text-sky-200 hover:bg-sky-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Refetching…" : "Refetch from backend"}
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2.5 py-1 rounded-md border border-slate-600 bg-slate-800/80 text-[11px] text-slate-100 hover:bg-slate-700"
          >
            Export events CSV
          </button>
        </div>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full text-[11px] text-left">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2 font-semibold">OBP ID</th>
              <th className="px-3 py-2 font-semibold">Timestamp</th>
              <th className="px-3 py-2 font-semibold">Message</th>
              <th className="px-3 py-2 font-semibold text-right">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-[#02091F]">
            {rows.map((row) => (
              <tr key={`${row.obpId}-${row.ts}-${row.message.slice(0, 16)}`}>
                {/* TODO: DEMO METRICS - OBP ID displayed here comes from backend on_confirm callback */}
                {/* This is the critical P444 audit trail identifier */}
                <td className="px-3 py-2 text-slate-100 font-mono text-[10px]">
                  {row.message.includes("FAILURE_EXTERNAL") ? (
                    <span className="text-red-400 font-bold">FALLA EXTERNA</span>
                  ) : (
                    row.obpId || <span className="text-slate-600">PENDING</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-400">
                  {new Date(row.ts).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}{" "}
                  UTC
                </td>
                <td className="px-3 py-2 text-slate-200">
                  {row.message.includes("FAILURE_EXTERNAL") ? (
                     <span className="text-red-300">{row.message}</span>
                  ) : (
                    row.message
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[10px]">
                  {row.latency_ms ? (
                    <span className={row.latency_ms > 1000 ? "text-red-400" : "text-emerald-400"}>
                      {row.latency_ms.toFixed(0)}ms
                    </span>
                  ) : (
                    <span className="text-slate-700">-</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-slate-500"
                >
                  No audit entries available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!logsFromBackend && (
        <p className="text-[10px] text-slate-500">
          Currently showing mock audit data. When backend audit logs are wired,
          pass{" "}
          <span className="font-mono text-[10px]">
            logsFromBackend: SimpleAuditLog[]
          </span>{" "}
          to this component.
        </p>
      )}
    </div>
  );
};
