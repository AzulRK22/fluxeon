// frontend/dashboard/src/app/events/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFlexEvents } from "@/hooks/useFront2Hooks";
import type { FlexEvent } from "@/components/front2/EventsList";

type StatusFilter = "ALL" | "ACTIVE" | "COMPLETED" | "FAILED";

export default function EventsCentrePage() {
  const router = useRouter();
  const { events, isLoading, error } = useFlexEvents();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [feederFilter, setFeederFilter] = useState("");
  const [obpFilter, setObpFilter] = useState("");
  const [lastSimulation, setLastSimulation] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (
        feederFilter &&
        !e.feederId.toLowerCase().includes(feederFilter.toLowerCase())
      )
        return false;
      if (obpFilter && !e.obpId.toLowerCase().includes(obpFilter.toLowerCase()))
        return false;
      return true;
    });
  }, [events, statusFilter, feederFilter, obpFilter]);

  const handleExportCsv = () => {
    const header =
      "eventId,feederId,status,flexRequested,flexDelivered,timestamp,derCount,obpId";
    const body = filteredEvents
      .map((e) =>
        [
          e.id,
          e.feederId,
          e.status,
          e.flexRequested,
          e.flexDelivered,
          e.timestamp,
          e.derCount,
          e.obpId,
        ].join(",")
      )
      .join("\n");

    const csvContent = `${header}\n${body}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fluxeon_events.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleResimulate = (event: FlexEvent) => {
    const now = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLastSimulation(
      `Re-simulated dispatch for ${event.id} (OBP ${event.obpId}) at ${now} UTC (UI-only)`
    );
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold text-slate-100">
            Events &amp; alerts centre
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            End-to-end view of flexibility events, outcomes and audit access.
          </p>
          {error && <p className="text-[11px] text-red-300 mt-1">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="self-start px-3 py-1.5 rounded-md border border-slate-600 bg-slate-800/80 text-[11px] text-slate-100 hover:bg-slate-700"
        >
          Export events CSV
        </button>
      </header>

      {/* Filtros */}
      <section className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-100"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Feeder:</span>
            <input
              value={feederFilter}
              onChange={(e) => setFeederFilter(e.target.value)}
              placeholder="F12, F08…"
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">OBP:</span>
            <input
              value={obpFilter}
              onChange={(e) => setObpFilter(e.target.value)}
              placeholder="OBP-12345…"
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <span className="ml-auto text-[11px] text-slate-500">
            {filteredEvents.length} events
          </span>
        </div>
      </section>

      {/* Tabla de eventos */}
      <section className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading events…</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-sm text-slate-400">
            No events match current filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px] text-left">
              <thead className="bg-slate-900/80 text-slate-300">
                <tr>
                  <th className="px-3 py-2 font-semibold">Event</th>
                  <th className="px-3 py-2 font-semibold">Feeder</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Requested</th>
                  <th className="px-3 py-2 font-semibold">Delivered</th>
                  <th className="px-3 py-2 font-semibold">OBP</th>
                  <th className="px-3 py-2 font-semibold">Time</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-[#02091F]">
                {filteredEvents.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 text-slate-100">{e.id}</td>
                    <td className="px-3 py-2 text-slate-200">{e.feederId}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full border border-slate-600 bg-slate-900/80 text-[10px] uppercase tracking-wide text-slate-200">
                        {e.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-100">
                      {e.flexRequested} kW
                    </td>
                    <td className="px-3 py-2 text-emerald-300">
                      {e.flexDelivered} kW
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-300">
                      {e.obpId}
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {new Date(e.timestamp).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      UTC
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleResimulate(e)}
                          className="text-[11px] text-emerald-300 hover:text-emerald-200 underline underline-offset-2 text-left"
                        >
                          Re-simulate dispatch
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/audit/${encodeURIComponent(e.obpId)}`)
                          }
                          className="text-[11px] text-sky-300 hover:text-sky-200 underline underline-offset-2 text-left"
                        >
                          Open full audit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastSimulation && (
          <p className="mt-3 text-[11px] text-slate-400">{lastSimulation}</p>
        )}
      </section>
    </div>
  );
}
