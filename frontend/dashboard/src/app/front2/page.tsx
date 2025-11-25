// frontend/dashboard/src/app/front2/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BecknTimeline,
  type BecknStep,
} from "@/components/front2/BecknTimeline";
import { EventsList, type FlexEvent } from "@/components/front2/EventsList";
import { DERCard, type DERCardProps } from "@/components/front2/DERCard";
import { AuditView } from "@/components/front2/AuditView";
import { ToastProvider, useToast } from "@/components/front2/ToastProvider";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useFlexEvents,
  useBecknProgress,
  useAuditTrail,
  useRecentAuditLogs,
} from "@/hooks/useFront2Hooks";

const MOCK_DERS: DERCardProps[] = [
  {
    id: "DER-001",
    name: "Downtown EV Charger",
    type: "EV",
    capacity: 50,
    available: 15,
    status: "ACTIVE",
    responseTime: 2.1,
    cost: 0.35,
  },
  {
    id: "DER-003",
    name: "Industrial Battery Bank",
    type: "BATTERY",
    capacity: 100,
    available: 45,
    status: "ALLOCATED",
    responseTime: 1.5,
    cost: 0.28,
  },
  {
    id: "DER-005",
    name: "Commercial HVAC System",
    type: "HVAC",
    capacity: 35,
    available: 35,
    status: "AVAILABLE",
    responseTime: 3.0,
    cost: 0.22,
  },
  {
    id: "DER-002",
    name: "Residential Solar",
    type: "PV",
    capacity: 10,
    available: 10,
    status: "AVAILABLE",
    responseTime: 5.0,
    cost: 0.15,
  },
  {
    id: "DER-004",
    name: "EV Fleet Station",
    type: "EV",
    capacity: 75,
    available: 30,
    status: "ACTIVE",
    responseTime: 2.8,
    cost: 0.32,
  },
  {
    id: "DER-006",
    name: "Community Battery",
    type: "BATTERY",
    capacity: 80,
    available: 60,
    status: "AVAILABLE",
    responseTime: 1.8,
    cost: 0.3,
  },
];

const ORDERED_BECKN_STEPS: BecknStep[] = [
  "DISCOVER",
  "SELECT",
  "INIT",
  "CONFIRM",
  "STATUS",
  "COMPLETE",
];

export default function Front2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFeederId = searchParams.get("feeder") ?? undefined;

  const [selectedEvent, setSelectedEvent] = useState<FlexEvent | null>(null);

  // 🔌 Datos reales desde backend
  const { events, isLoading: eventsLoading } = useFlexEvents();

  // 🔁 Progreso Beckn simulado (UI-only)
  const {
    currentStep: simulatedStep,
    timestamps,
    advanceStep,
    reset,
  } = useBecknProgress();

  // 🧠 Step “efectivo”: si el backend trae becknStep, usamos ese; si no, el simulado
  const effectiveStep: BecknStep = useMemo(() => {
    if (selectedEvent?.becknStep) {
      return selectedEvent.becknStep;
    }
    const fromEvents = events.find((e) => e.becknStep);
    if (fromEvents?.becknStep) {
      return fromEvents.becknStep;
    }
    return simulatedStep;
  }, [selectedEvent, events, simulatedStep]);

  // 🧾 Audit trail real por OBP ID (cuando hay evento seleccionado)
  const { log: auditLog, isLoading: auditLoading } = useAuditTrail(
    selectedEvent?.obpId
  );

  // 📋 Todos los audit logs recientes (vista agregada)
  const { logs: recentAuditLogs, isLoading: recentAuditLoading } =
    useRecentAuditLogs();

  // 🎯 Si viene ?feeder=F1 en la URL, auto-seleccionamos un evento de ese feeder
  useEffect(() => {
    if (!urlFeederId || events.length === 0) return;

    const candidate: FlexEvent | null = (() => {
      if (selectedEvent && selectedEvent.feederId === urlFeederId) {
        return selectedEvent;
      }

      const match = events.find((e) => e.feederId === urlFeederId);
      if (match) return match;

      return selectedEvent ?? events[0];
    })();

    const timeout = setTimeout(() => {
      setSelectedEvent(candidate);
    }, 0);

    return () => clearTimeout(timeout);
  }, [urlFeederId, events, selectedEvent]);

  // 🔍 Remaining steps para el evento seleccionado
  let remainingSteps: number | null = null;
  if (selectedEvent?.becknStep) {
    const idx = ORDERED_BECKN_STEPS.indexOf(selectedEvent.becknStep);
    if (idx !== -1) {
      remainingSteps = Math.max(0, ORDERED_BECKN_STEPS.length - 1 - idx);
    }
  }

  // Toast hook inside component so provider must wrap output below
  const PageContent = () => {
    const { addToast } = useToast();

    const handlePlan = (derId: string) => {
      addToast(`Flexibility plan initiated for ${derId}`, "success");
    };
    const handleMute = (derId: string) => {
      addToast(`Alerts muted for ${derId} (15m)`, "info");
    };

    return (
      <div className="space-y-6">
      {/* Main Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column: Beckn Timeline + Events */}
        <div className="xl:col-span-2 space-y-4">
          {/* Beckn Timeline */}
          <div className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4 min-h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Beckn workflow
                </h3>
                <p className="text-[11px] text-slate-400">
                  From DISCOVER to COMPLETE · End-to-end orchestration under 5s
                  SLA (simulated).
                </p>
              </div>
              <span className="text-[11px] text-slate-500">
                OBP-based orchestration
              </span>
            </div>
            <BecknTimeline
              currentStep={effectiveStep}
              timestamps={timestamps}
              showControls
              onAdvance={advanceStep}
              onReset={reset}
            />
          </div>

          {/* Active Events */}
          <div className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Flexibility events
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click an event to inspect its dispatch and audit trail.
                </p>
              </div>
              <span className="text-[11px] text-slate-500">
                {events.length} active from backend
              </span>
            </div>
            <EventsList
              events={events}
              isLoading={eventsLoading}
              onEventClick={setSelectedEvent}
              filterFeederId={urlFeederId}
            />
          </div>

          {/* Event Detail (below Flexibility events) */}
          {selectedEvent && (
            <div className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Event detail
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedEvent.feederName} • {selectedEvent.id}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Backend audit: Beckn calls logged for {selectedEvent.obpId}.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() =>
                      router.push(
                        `/?feeder=${encodeURIComponent(selectedEvent.feederId)}`
                      )
                    }
                    className="text-[11px] text-sky-300 hover:text-sky-200 underline underline-offset-2"
                  >
                    Open in overview
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* KPIs del evento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-[11px] text-slate-400">Status</span>
                  <p className="text-base font-semibold text-blue-400 mt-1">
                    {selectedEvent.status}
                  </p>
                  {selectedEvent.becknStep && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Beckn step:{" "}
                      <span className="font-medium text-slate-100">
                        {selectedEvent.becknStep}
                      </span>
                      {remainingSteps !== null && (
                        <>
                          {" "}
                          · est. remaining: {remainingSteps} step
                          {remainingSteps === 1 ? "" : "s"}
                        </>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Flex requested</span>
                  <p className="text-base font-semibold text-slate-100 mt-1">
                    {selectedEvent.flexRequested} kW
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Flex delivered</span>
                  <p className="text-base font-semibold text-emerald-400 mt-1">
                    {selectedEvent.flexDelivered} kW
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">OBP ID</span>
                  <p className="text-base font-semibold text-slate-100 mt-1">
                    {selectedEvent.obpId}
                  </p>
                </div>
              </div>

              <div className="mt-1 p-3 bg-slate-900/70 rounded-lg border border-slate-800">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-100">Summary:</span>{" "}
                  {selectedEvent.derCount} DERs allocated to support{" "}
                  {selectedEvent.flexRequested} kW demand on feeder{" "}
                  {selectedEvent.feederId}. Delivered {selectedEvent.flexDelivered}{" "}
                  kW (
                  {Math.round(
                    (selectedEvent.flexDelivered / selectedEvent.flexRequested) *
                      100
                  )}
                  % success).
                </p>
              </div>

              {/* Mini audit trail real por OBP */}
              {selectedEvent.obpId && (
                <div className="mt-4 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-200 mb-1.5">
                    OBP workflow (backend audit)
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Backend audit: Beckn calls logged for {selectedEvent.obpId}.
                  </p>
                  {auditLoading && (
                    <p className="text-[11px] text-slate-400">Loading audit…</p>
                  )}
                  {!auditLoading && auditLog && (
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {auditLog.entries.map((entry) => (
                        <li
                          key={entry.ts}
                          className="flex gap-2 items-baseline text-xs"
                        >
                          <span className="text-slate-500 w-28 shrink-0">
                            {new Date(entry.ts).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                          <span>{entry.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Audit Trail (below Event detail) */}
          <div className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">
              Audit trail (aggregated view)
            </h3>
            <AuditView
              logsFromBackend={recentAuditLogs}
              isLoading={recentAuditLoading}
            />
          </div>
        </div>

        {/* Right Column: DER Grid */}
        <div className="xl:col-span-1">
          <div className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4 h-full flex flex-col min-h-[500px]">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">
              Available DERs
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Sorted by response time and cost. Mock data for demo; ready to
              plug real Beckn catalog.
            </p>
            <div className="space-y-3">
              {MOCK_DERS.map((der) => (
                <DERCard
                  key={der.id}
                  {...der}
                  onPlan={() => handlePlan(der.id)}
                  onMute={() => handleMute(der.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="border border-slate-800 rounded-xl bg-slate-900 px-4 py-3 text-[11px] text-slate-300">
        <p>
          🔴 <span className="font-semibold">Real-time dashboard:</span> data
          refreshes every 2–3 seconds. All timestamps in UTC. OBP IDs enable
          regulatory-grade audit trails for flexibility dispatch.
        </p>
      </section>
      </div>
    );
  };

  return (
    <ToastProvider>
      <PageContent />
    </ToastProvider>
  );
}
