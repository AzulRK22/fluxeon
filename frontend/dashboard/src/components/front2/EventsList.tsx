import React, { useState, useEffect } from 'react';

interface FlexEvent {
  id: string;
  feederId: string;
  feederName: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  flexRequested: number; // kW
  flexDelivered: number; // kW
  timestamp: string;
  derCount: number;
  obpId: string;
}

interface EventsListProps {
  events?: FlexEvent[];
  isLoading?: boolean;
  onEventClick?: (event: FlexEvent) => void;
}

const STATUS_BADGE = {
  ACTIVE: 'bg-blue-900 text-blue-200 border border-blue-700',
  COMPLETED: 'bg-green-900 text-green-200 border border-green-700',
  FAILED: 'bg-red-900 text-red-200 border border-red-700',
};

const MOCK_EVENTS: FlexEvent[] = [
  {
    id: 'EVT-001',
    feederId: 'F12',
    feederName: 'Feeder 12 - Downtown',
    status: 'ACTIVE',
    flexRequested: 45,
    flexDelivered: 42,
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    derCount: 3,
    obpId: 'OBP-12345',
  },
  {
    id: 'EVT-002',
    feederId: 'F08',
    feederName: 'Feeder 8 - Industrial',
    status: 'COMPLETED',
    flexRequested: 60,
    flexDelivered: 58,
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    derCount: 5,
    obpId: 'OBP-12346',
  },
  {
    id: 'EVT-003',
    feederId: 'F15',
    feederName: 'Feeder 15 - Residential',
    status: 'ACTIVE',
    flexRequested: 30,
    flexDelivered: 28,
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    derCount: 2,
    obpId: 'OBP-12347',
  },
];

export const EventsList: React.FC<EventsListProps> = ({
  events = MOCK_EVENTS,
  isLoading = false,
  onEventClick,
}) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const successRate = (requested: number, delivered: number) => {
    return Math.round((delivered / requested) * 100);
  };

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
          Active Flex Events
        </h3>
        <p className="text-xs text-slate-400 mt-1">{events.length} event(s)</p>
      </div>

      {/* Events List */}
      <div className="divide-y divide-slate-700">
        {isLoading ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-400">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-400">No active events</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="p-4 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {/* Top Row: Feeder + Status */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">
                    {event.feederName}
                  </h4>
                  <p className="text-xs text-slate-400">{event.id}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_BADGE[event.status]}`}>
                  {event.status}
                </span>
              </div>

              {/* Flex Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-800 rounded p-2">
                  <span className="text-xs text-slate-400 block">Requested</span>
                  <span className="text-sm font-bold text-slate-100">
                    {event.flexRequested} kW
                  </span>
                </div>
                <div className="bg-slate-800 rounded p-2">
                  <span className="text-xs text-slate-400 block">Delivered</span>
                  <span className="text-sm font-bold text-green-400">
                    {event.flexDelivered} kW
                  </span>
                </div>
                <div className="bg-slate-800 rounded p-2">
                  <span className="text-xs text-slate-400 block">Success</span>
                  <span className="text-sm font-bold text-blue-400">
                    {successRate(event.flexRequested, event.flexDelivered)}%
                  </span>
                </div>
              </div>

              {/* Bottom Row: Metadata */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex gap-4">
                  <span>{event.derCount} DERs allocated</span>
                  <span>OBP: {event.obpId}</span>
                </div>
                <span className="text-slate-500">{formatTime(event.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
