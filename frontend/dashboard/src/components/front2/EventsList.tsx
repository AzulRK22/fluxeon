// frontend/dashboard/src/components/front2/EventsList.tsx
import React from "react";

export interface FlexEvent {
  id: string;
  feederId: string;
  feederName: string;
  status: "ACTIVE" | "COMPLETED" | "FAILED";
  flexRequested: number; // kW
  flexDelivered: number; // kW
  timestamp: string; // ISO string from backend
  derCount: number;
  obpId: string;
}

export interface EventsListProps {
  events?: FlexEvent[];
  isLoading?: boolean;
  onEventClick?: (event: FlexEvent) => void;
}

const STATUS_BADGE: Record<FlexEvent["status"], string> = {
  ACTIVE: "bg-sky-500/15 text-sky-300 border border-sky-500/60",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/60",
  FAILED: "bg-red-500/15 text-red-300 border border-red-500/60",
};

// Fallback mock data if backend is not wired yet
const MOCK_EVENTS: FlexEvent[] = [
  {
    id: "EVT-001",
    feederId: "F12",
    feederName: "Feeder 12 – Downtown",
    status: "ACTIVE",
    flexRequested: 45,
    flexDelivered: 42,
    timestamp: new Date("2025-11-22T14:23:00Z").toISOString(),
    derCount: 3,
    obpId: "OBP-12345",
  },
  {
    id: "EVT-002",
    feederId: "F08",
    feederName: "Feeder 8 – Industrial",
    status: "COMPLETED",
    flexRequested: 60,
    flexDelivered: 58,
    timestamp: new Date("2025-11-22T14:00:00Z").toISOString(),
    derCount: 5,
    obpId: "OBP-12346",
  },
  {
    id: "EVT-003",
    feederId: "F15",
    feederName: "Feeder 15 – Residential",
    status: "ACTIVE",
    flexRequested: 30,
    flexDelivered: 28,
    timestamp: new Date("2025-11-22T14:15:00Z").toISOString(),
    derCount: 2,
    obpId: "OBP-12347",
  },
];

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  // Stable, no depende de "ahora" → sin problemas de hidratación
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const successRate = (requested: number, delivered: number) => {
  if (!requested) return 0;
  return Math.round((delivered / requested) * 100);
};

export const EventsList: React.FC<EventsListProps> = ({
  events = MOCK_EVENTS,
  isLoading = false,
  onEventClick,
}) => {
  if (isLoading) {
    return (
      <div className="py-6 text-center text-sm text-slate-400">
        Loading events…
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="py-6 text-center text-sm text-slate-400">
        No active events
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800">
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onEventClick?.(event)}
          className="w-full text-left px-3.5 py-3 hover:bg-slate-900/70 transition-colors cursor-pointer"
        >
          {/* Top Row: Feeder + Status */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                {event.feederName}
              </h4>
              <p className="text-[11px] text-slate-500">{event.id}</p>
            </div>
            <span
              className={[
                "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
                STATUS_BADGE[event.status],
              ].join(" ")}
            >
              {event.status.toLowerCase()}
            </span>
          </div>

          {/* Flex Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-slate-900 rounded-lg px-2.5 py-2">
              <span className="text-[11px] text-slate-400 block">
                Requested
              </span>
              <span className="text-sm font-semibold text-slate-100">
                {event.flexRequested} kW
              </span>
            </div>
            <div className="bg-slate-900 rounded-lg px-2.5 py-2">
              <span className="text-[11px] text-slate-400 block">
                Delivered
              </span>
              <span className="text-sm font-semibold text-emerald-300">
                {event.flexDelivered} kW
              </span>
            </div>
            <div className="bg-slate-900 rounded-lg px-2.5 py-2">
              <span className="text-[11px] text-slate-400 block">Success</span>
              <span className="text-sm font-semibold text-sky-300">
                {successRate(event.flexRequested, event.flexDelivered)}%
              </span>
            </div>
          </div>

          {/* Bottom Row: Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex flex-wrap gap-3">
              <span>{event.derCount} DERs allocated</span>
              <span>OBP: {event.obpId}</span>
            </div>
            <span className="text-slate-500">
              {formatTime(event.timestamp)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
