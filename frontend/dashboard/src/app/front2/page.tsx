'use client';

import React, { useState } from 'react';
import { BecknTimeline } from '../../components/front2/BecknTimeline';
import { EventsList } from '../../components/front2/EventsList';
import { DERCard, type DERCardProps } from '../../components/front2/DERCard';
import { AuditView } from '../../components/front2/AuditView';

const MOCK_DERS: DERCardProps[] = [
  {
    id: 'DER-001',
    name: 'Downtown EV Charger',
    type: 'EV',
    capacity: 50,
    available: 15,
    status: 'ACTIVE',
    responseTime: 2.1,
    cost: 0.35,
  },
  {
    id: 'DER-003',
    name: 'Industrial Battery Bank',
    type: 'BATTERY',
    capacity: 100,
    available: 45,
    status: 'ALLOCATED',
    responseTime: 1.5,
    cost: 0.28,
  },
  {
    id: 'DER-005',
    name: 'Commercial HVAC System',
    type: 'HVAC',
    capacity: 35,
    available: 35,
    status: 'AVAILABLE',
    responseTime: 3.0,
    cost: 0.22,
  },
  {
    id: 'DER-002',
    name: 'Residential Solar',
    type: 'PV',
    capacity: 10,
    available: 10,
    status: 'AVAILABLE',
    responseTime: 5.0,
    cost: 0.15,
  },
  {
    id: 'DER-004',
    name: 'EV Fleet Station',
    type: 'EV',
    capacity: 75,
    available: 30,
    status: 'ACTIVE',
    responseTime: 2.8,
    cost: 0.32,
  },
  {
    id: 'DER-006',
    name: 'Community Battery',
    type: 'BATTERY',
    capacity: 80,
    available: 60,
    status: 'AVAILABLE',
    responseTime: 1.8,
    cost: 0.30,
  },
];

export default function Front2Page() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentBecknStep, setCurrentBecknStep] = useState<
    'DISCOVER' | 'SELECT' | 'INIT' | 'CONFIRM' | 'STATUS' | 'COMPLETE'
  >('SELECT');

  const becknTimestamps = {
    DISCOVER: '14:23:01',
    SELECT: '14:23:02',
    INIT: '14:23:03',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          FLUXEON Command Centre – Front 2
        </h1>
        <p className="text-slate-400 text-sm">
          Real-time flexibility orchestration • Beckn workflow • Audit trail
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Beckn Timeline + Events */}
        <div className="xl:col-span-2 space-y-6">
          {/* Beckn Timeline */}
          <BecknTimeline currentStep={currentBecknStep} timestamps={becknTimestamps} />

          {/* Active Events */}
          <EventsList onEventClick={setSelectedEvent} />
        </div>

        {/* Right Column: DER Grid */}
        <div className="xl:col-span-1">
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
              Available DERs
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {MOCK_DERS.map((der) => (
                <DERCard key={der.id} {...der} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Event Detail (Conditional) */}
      {selectedEvent && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Event Detail</h3>
              <p className="text-sm text-slate-400">
                {selectedEvent.feederName} • {selectedEvent.id}
              </p>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-400">Status</span>
              <p className="text-lg font-bold text-blue-400">{selectedEvent.status}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Flex Requested</span>
              <p className="text-lg font-bold text-slate-100">{selectedEvent.flexRequested} kW</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Flex Delivered</span>
              <p className="text-lg font-bold text-green-400">{selectedEvent.flexDelivered} kW</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">OBP ID</span>
              <p className="text-lg font-bold text-slate-100">{selectedEvent.obpId}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-800 rounded border border-slate-700">
            <p className="text-xs text-slate-400">
              <span className="font-semibold">Summary:</span> {selectedEvent.derCount} DERs
              allocated to support {selectedEvent.flexRequested} kW demand on feeder{' '}
              {selectedEvent.feederId}. Delivered {selectedEvent.flexDelivered} kW
              ({Math.round((selectedEvent.flexDelivered / selectedEvent.flexRequested) * 100)}% success).
            </p>
          </div>
        </div>
      )}

      {/* Audit View */}
      <AuditView />

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-slate-800 rounded border border-slate-700 text-xs text-slate-400">
        <p>
          🔴 <strong>Real-time Dashboard:</strong> Data refreshes every 2–3 seconds. All
          timestamps in UTC+0. OBP IDs enable regulatory-grade audit trails for P2P and
          peer-to-peer energy transactions.
        </p>
      </div>
    </div>
  );
}
