"use client";

import { useState } from "react";
import { BecknTimeline } from "@/components/front2/BecknTimeline";
import { EventsList, type FlexEvent } from "@/components/front2/EventsList";
import { DERCard, type DERCardProps } from "@/components/front2/DERCard";
import { AuditView } from "@/components/front2/AuditView";

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

type BecknStep =
  | "DISCOVER"
  | "SELECT"
  | "INIT"
  | "CONFIRM"
  | "STATUS"
  | "COMPLETE";

export default function Front2Page() {
  const [selectedEvent, setSelectedEvent] = useState<FlexEvent | null>(null);
  const [currentBecknStep] = useState<BecknStep>("SELECT");

  const becknTimestamps: Partial<Record<BecknStep, string>> = {
    DISCOVER: "14:23:01",
    SELECT: "14:23:02",
    INIT: "14:23:03",
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <section>
        <h2 className="text-sm font-semibold text-slate-100">
          Flexibility orchestration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Beckn workflow, DER allocation grid and audit trail for the selected
          flexibility events.
        </p>
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column: Beckn Timeline + Events */}
        <div className="xl:col-span-2 space-y-4">
          {/* Beckn Timeline */}
          <div className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100">
                Beckn workflow
              </h3>
              <span className="text-[11px] text-slate-400">
                From DISCOVER to COMPLETE
              </span>
            </div>
            <BecknTimeline
              currentStep={currentBecknStep}
              timestamps={becknTimestamps}
            />
          </div>

          {/* Active Events */}
          <div className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100">
                Flexibility events
              </h3>
              <span className="text-[11px] text-slate-400">
                Click an event to inspect its dispatch
              </span>
            </div>
            <EventsList onEventClick={setSelectedEvent} />
          </div>
        </div>

        {/* Right Column: DER Grid */}
        <div className="xl:col-span-1">
          <div className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">
              Available DERs
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Sorted by response time and cost. Mock data for demo; ready to
              plug real Beckn catalog.
            </p>
            <div className="space-y-3 overflow-y-auto pr-1 max-h-[540px]">
              {MOCK_DERS.map((der) => (
                <DERCard key={der.id} {...der} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Selected Event Detail (Conditional) */}
      {selectedEvent && (
        <section className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Event detail
              </h3>
              <p className="text-xs text-slate-400">
                {selectedEvent.feederName} • {selectedEvent.id}
              </p>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <span className="text-[11px] text-slate-400">Status</span>
              <p className="text-base font-semibold text-blue-400 mt-1">
                {selectedEvent.status}
              </p>
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
        </section>
      )}

      {/* Audit View */}
      <section className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">
          Audit trail
        </h3>
        <AuditView />
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
}
