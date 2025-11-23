// ============================================================================
// EJEMPLOS AVANZADOS - Front 2 Customization & Extension
// ============================================================================

/**
 * Ejemplo 1: Agregar notificaciones toast cuando hay eventos críticos
 */
import { useEffect } from 'react';

export const useEventNotifications = () => {
  const { events } = useFlexEvents();

  useEffect(() => {
    events.forEach((event) => {
      // Si hay evento CRITICAL, mostrar notificación
      if (event.status === 'CRITICAL') {
        console.log(`🚨 CRITICAL: Feeder ${event.feederId} needs ${event.flexRequested} kW`);
        
        // Aquí irían notificaciones tipo:
        // toast.error(`Critical event on ${event.feederName}`);
        
        // O reproducir sonido
        // playAlertSound();
      }
    });
  }, [events]);
};

/**
 * Ejemplo 2: Custom hook para analytics
 */
export const useEventMetrics = (events: any[]) => {
  const metrics = {
    totalEvents: events.length,
    activeEvents: events.filter((e) => e.status === 'ACTIVE').length,
    successRate: events.length > 0
      ? Math.round(
          (events.filter((e) => e.flexDelivered >= e.flexRequested * 0.9).length /
            events.length) *
            100
        )
      : 0,
    totalFlexRequested: events.reduce((sum, e) => sum + e.flexRequested, 0),
    totalFlexDelivered: events.reduce((sum, e) => sum + e.flexDelivered, 0),
    averageResponseTime: events.length > 0
      ? (events.reduce((sum, e) => sum + (e.duration || 0), 0) / events.length).toFixed(2)
      : 0,
  };

  return metrics;
};

// Usage:
// const metrics = useEventMetrics(events);
// console.log(`Success Rate: ${metrics.successRate}%`);

/**
 * Ejemplo 3: Extender DERCard con modal de detalles
 */
import React, { useState } from 'react';

export const DERCardWithModal = (props: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer hover:ring-2 ring-blue-500 transition-all"
      >
        {/* DERCard component aquí */}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-lg font-bold text-slate-100 mb-4">{props.name}</h2>

            <div className="space-y-3 mb-6">
              <div>
                <span className="text-xs text-slate-400">Type</span>
                <p className="text-sm font-semibold text-slate-200">{props.type}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Total Capacity</span>
                <p className="text-sm font-semibold text-slate-200">{props.capacity} kW</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Historical Performance</span>
                <p className="text-sm font-semibold text-green-400">95.2% uptime</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Last Activation</span>
                <p className="text-sm font-semibold text-slate-200">2 minutes ago</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded font-semibold transition-colors">
                Allocate
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Ejemplo 4: Agregar gráfica de tendencias con Recharts
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const EventTrendsChart = ({ events }: { events: any[] }) => {
  // Agrupar eventos por hora
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const eventsInHour = events.filter((e) => {
      const eventHour = new Date(e.timestamp).getHours();
      return eventHour === hour;
    });

    return {
      hour: `${hour}:00`,
      flexRequested: eventsInHour.reduce((sum, e) => sum + e.flexRequested, 0),
      flexDelivered: eventsInHour.reduce((sum, e) => sum + e.flexDelivered, 0),
    };
  });

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
        Flex Delivery Trend (24h)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={hourlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="hour" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Line
            type="monotone"
            dataKey="flexRequested"
            stroke="#fbbf24"
            strokeWidth={2}
            dot={false}
            name="Requested"
          />
          <Line
            type="monotone"
            dataKey="flexDelivered"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Delivered"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Ejemplo 5: Filtrado avanzado en AuditView
 */
export const AuditViewWithFilters = () => {
  const [filters, setFilters] = React.useState({
    obpId: '',
    status: 'ALL', // ALL, SUCCESS, PARTIAL, FAILED
    feeder: '',
    dateFrom: '',
    dateTo: '',
  });

  const { logs } = useAuditLogs();

  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      if (filters.obpId && !log.obpId.includes(filters.obpId)) return false;
      if (filters.status !== 'ALL' && log.status !== filters.status) return false;
      if (filters.feeder && !log.feeder.includes(filters.feeder)) return false;

      const logDate = new Date(log.timestamp);
      if (filters.dateFrom && logDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && logDate > new Date(filters.dateTo)) return false;

      return true;
    });
  }, [logs, filters]);

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <input
          type="text"
          placeholder="OBP ID"
          value={filters.obpId}
          onChange={(e) => setFilters({ ...filters, obpId: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100"
        >
          <option value="ALL">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="PARTIAL">Partial</option>
          <option value="FAILED">Failed</option>
        </select>
        <input
          type="text"
          placeholder="Feeder"
          value={filters.feeder}
          onChange={(e) => setFilters({ ...filters, feeder: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100"
        />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100"
        />
      </div>

      {/* Mostrar logs filtrados */}
      <p className="text-sm text-slate-400 mb-3">
        Showing {filteredLogs.length} of {logs.length} logs
      </p>

      {/* AuditView con logs filtrados aquí */}
    </div>
  );
};

/**
 * Ejemplo 6: Export avanzado (JSON + CSV)
 */
export const exportLogs = (logs: any[], format: 'csv' | 'json' = 'csv') => {
  if (format === 'json') {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } else {
    // CSV export (ya implementado en AuditView)
  }
};

// Usage:
// <button onClick={() => exportLogs(logs, 'json')}>Export JSON</button>

/**
 * Ejemplo 7: Real-time status indicator
 */
export const StatusIndicator = ({ isConnected }: { isConnected: boolean }) => {
  return (
    <div className="fixed top-4 right-4 flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        } animate-pulse`}
      />
      <span className="text-xs text-slate-400">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

/**
 * Ejemplo 8: Custom hook para sincronización
 */
export const useSyncStatus = () => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<Date | null>(null);

  const sync = React.useCallback(async () => {
    setIsSyncing(true);
    try {
      // Llamar múltiples endpoints en paralelo
      await Promise.all([
        fetch('http://localhost:8000/events/active'),
        fetch('http://localhost:8000/ders'),
        fetch('http://localhost:8000/feeders'),
      ]);
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { sync, isSyncing, lastSync };
};

/**
 * Ejemplo 9: Animación personalizada para Beckn Timeline
 */
export const AnimatedBecknStep = ({ step, isActive }: { step: string; isActive: boolean }) => {
  return (
    <div className="relative">
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-500 ease-out
          ${isActive ? 'scale-125 bg-green-500 shadow-lg shadow-green-500/50' : 'bg-slate-700'}
        `}
      >
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse opacity-50" />
        )}
        <span className="relative z-10 font-bold text-white">{step[0]}</span>
      </div>
    </div>
  );
};

/**
 * Ejemplo 10: Integration con localStorage (opcional)
 * NOTA: Solo usa esto si NO es en un iframe (Claude artifacts no soportan localStorage)
 */
export const usePersistentFilters = (key: string, initialValue: any) => {
  const [filters, setFilters] = React.useState(() => {
    try {
      const stored = localStorage?.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    try {
      localStorage?.setItem(key, JSON.stringify(filters));
    } catch {
      console.warn('localStorage not available');
    }
  }, [filters]);

  return [filters, setFilters];
};

// Usage:
// const [filters, setFilters] = usePersistentFilters('auditFilters', {});

/**
 * ============================================================================
 * CÓMO USAR ESTOS EJEMPLOS:
 * 
 * 1. Copialos a componentes nuevos en src/components/Front2/
 * 2. Impórtalos en page.tsx
 * 3. Úsalos donde necesites
 * 
 * Ejemplo:
 * import { EventTrendsChart } from '@/components/Front2/EventTrendsChart';
 * 
 * <EventTrendsChart events={events} />
 * ============================================================================
 */
