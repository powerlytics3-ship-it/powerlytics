'use client';
import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TelemetryPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const { activeWorkspace } = useWorkspaceStore();
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [from, setFrom] = useState(() => new Date(Date.now() - 3_600_000).toISOString().slice(0, 16));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 16));

  const { data: latest } = useQuery({
    queryKey: ['telemetry-latest', deviceId],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}/telemetry/latest`),
    enabled: !!activeWorkspace,
  });

  const ports = [...new Set(latest?.map((r: any) => r.portKey) ?? [])];

  const { data: chartData } = useQuery({
    queryKey: ['telemetry-ts', deviceId, selectedPort, from, to],
    queryFn: () => api.get<{ data: any[]; stats: any }>(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}/telemetry/timeseries/${selectedPort}?from=${from}&to=${to}`),
    enabled: !!activeWorkspace && !!selectedPort,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Telemetry</h2>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="font-medium mb-3">Latest Values</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {latest?.map((row: any) => (
            <div key={row.portKey} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50" onClick={() => setSelectedPort(row.portKey)}>
              <p className="text-xs text-gray-500 font-mono">{row.portKey}</p>
              <p className="text-lg font-bold mt-1">{Number(row.calibratedValue).toFixed(2)}</p>
              <p className="text-xs text-gray-400">{row.unit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex gap-4 mb-4">
          <select value={selectedPort} onChange={(e) => setSelectedPort(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">Select port</option>
            {ports.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <span className="self-center text-gray-500">to</span>
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        </div>

        {chartData?.data && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.data.map((r: any) => ({ ts: new Date(r.ts).toLocaleTimeString(), value: Number(r.calibratedValue) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ts" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartData?.stats && (
          <div className="mt-4 grid grid-cols-4 gap-4 text-center">
            <div><p className="text-xs text-gray-500">Min</p><p className="font-bold">{chartData.stats.min?.toFixed(2)}</p></div>
            <div><p className="text-xs text-gray-500">Max</p><p className="font-bold">{chartData.stats.max?.toFixed(2)}</p></div>
            <div><p className="text-xs text-gray-500">Avg</p><p className="font-bold">{chartData.stats.avg?.toFixed(2)}</p></div>
            <div><p className="text-xs text-gray-500">Count</p><p className="font-bold">{chartData.stats.count}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
