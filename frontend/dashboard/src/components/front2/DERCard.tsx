import React from 'react';

export interface DERCardProps {
  id: string;
  name: string;
  type: 'EV' | 'BATTERY' | 'HVAC' | 'LOAD' | 'PV';
  capacity: number; // en kW
  available: number; // capacidad disponible en kW
  status: 'AVAILABLE' | 'ALLOCATED' | 'ACTIVE' | 'UNAVAILABLE';
  responseTime?: number; // en segundos
  cost?: number; // precio por kWh
}

const STATUS_COLORS = {
  AVAILABLE: 'bg-green-600 text-white',
  ALLOCATED: 'bg-amber-600 text-white',
  ACTIVE: 'bg-blue-600 text-white',
  UNAVAILABLE: 'bg-red-600 text-white',
};

const TYPE_ICONS = {
  EV: '🔋',
  BATTERY: '⚡',
  HVAC: '❄️',
  LOAD: '📊',
  PV: '☀️',
};

export const DERCard: React.FC<DERCardProps> = ({
  id,
  name,
  type,
  capacity,
  available,
  status,
  responseTime,
  cost,
}) => {
  const utilizationPercent = ((capacity - available) / capacity) * 100;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{TYPE_ICONS[type]}</span>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">{name}</h4>
            <p className="text-xs text-slate-400">{id}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
          {status}
        </span>
      </div>

      {/* Capacity Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-400">Capacity</span>
          <span className="text-xs font-semibold text-slate-200">
            {capacity - available} / {capacity} kW
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              utilizationPercent > 80 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-400">Type</span>
          <p className="text-slate-200 font-semibold">{type}</p>
        </div>
        <div>
          <span className="text-slate-400">Available</span>
          <p className="text-slate-200 font-semibold text-green-400">{available} kW</p>
        </div>
        {responseTime !== undefined && (
          <div>
            <span className="text-slate-400">Response</span>
            <p className="text-slate-200 font-semibold">{responseTime}s</p>
          </div>
        )}
        {cost !== undefined && (
          <div>
            <span className="text-slate-400">Cost</span>
            <p className="text-slate-200 font-semibold">${cost}/kWh</p>
          </div>
        )}
      </div>

      {/* Quick Actions (optional) */}
      {status === 'AVAILABLE' && (
        <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded font-semibold transition-colors">
          Allocate
        </button>
      )}
    </div>
  );
};
