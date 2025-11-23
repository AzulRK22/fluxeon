import React, { useState, useMemo } from 'react';

interface AuditLog {
  obpId: string;
  timestamp: string;
  feeder: string;
  dersActivated: string[]; // array de IDs
  requestedKw: number;
  deliveredKw: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  duration: number; // segundos
}

interface AuditViewProps {
  logs?: AuditLog[];
  isLoading?: boolean;
}

const MOCK_LOGS: AuditLog[] = [
  {
    obpId: 'OBP-12345',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    feeder: 'F12',
    dersActivated: ['DER-001', 'DER-003', 'DER-005'],
    requestedKw: 45,
    deliveredKw: 42,
    status: 'SUCCESS',
    duration: 3.2,
  },
  {
    obpId: 'OBP-12346',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    feeder: 'F08',
    dersActivated: ['DER-002', 'DER-004', 'DER-006', 'DER-007', 'DER-008'],
    requestedKw: 60,
    deliveredKw: 58,
    status: 'SUCCESS',
    duration: 4.1,
  },
  {
    obpId: 'OBP-12347',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    feeder: 'F15',
    dersActivated: ['DER-010', 'DER-011'],
    requestedKw: 30,
    deliveredKw: 28,
    status: 'PARTIAL',
    duration: 2.8,
  },
  {
    obpId: 'OBP-12348',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    feeder: 'F03',
    dersActivated: ['DER-015'],
    requestedKw: 20,
    deliveredKw: 0,
    status: 'FAILED',
    duration: 0,
  },
];

const STATUS_COLORS = {
  SUCCESS: 'bg-green-900 text-green-200',
  PARTIAL: 'bg-amber-900 text-amber-200',
  FAILED: 'bg-red-900 text-red-200',
};

export const AuditView: React.FC<AuditViewProps> = ({
  logs = MOCK_LOGS,
  isLoading = false,
}) => {
  const [searchOBP, setSearchOBP] = useState('');

  const filteredLogs = useMemo(() => {
    if (!searchOBP) return logs;
    return logs.filter((log) =>
      log.obpId.toLowerCase().includes(searchOBP.toLowerCase())
    );
  }, [logs, searchOBP]);

  const handleExport = () => {
    const csv = [
      ['OBP ID', 'Timestamp', 'Feeder', 'DERs', 'Requested (kW)', 'Delivered (kW)', 'Status', 'Duration (s)'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.obpId,
          new Date(log.timestamp).toLocaleString(),
          log.feeder,
          log.dersActivated.join(';'),
          log.requestedKw,
          log.deliveredKw,
          log.status,
          log.duration,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Audit Logs / OBP Trail
          </h3>
          <button
            onClick={handleExport}
            className="bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs py-2 px-3 rounded font-semibold transition-colors flex items-center gap-1"
          >
            📥 Export CSV
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by OBP ID (e.g., OBP-12345)"
          value={searchOBP}
          onChange={(e) => setSearchOBP(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                OBP ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                Feeder
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                DERs Activated
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                Requested
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                Delivered
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-slate-400">
                  Loading logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-slate-400">
                  No logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.obpId}
                  className="hover:bg-slate-800 transition-colors border-slate-700"
                >
                  <td className="px-4 py-3 text-slate-200 font-semibold">{log.obpId}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(log.timestamp).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{log.feeder}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {log.dersActivated.slice(0, 2).map((der) => (
                        <span
                          key={der}
                          className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs"
                        >
                          {der}
                        </span>
                      ))}
                      {log.dersActivated.length > 2 && (
                        <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">
                          +{log.dersActivated.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-300">
                    {log.requestedKw} kW
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-green-400">
                    {log.deliveredKw} kW
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        STATUS_COLORS[log.status]
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">
                    {log.duration.toFixed(2)}s
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
