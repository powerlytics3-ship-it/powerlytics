'use client';
import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';

export default function ActuationsPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();
  const [portKey, setPortKey] = useState('DO_1');
  const [value, setValue] = useState('1');

  const { data } = useQuery({
    queryKey: ['actuations', deviceId],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}/actuations`),
    enabled: !!activeWorkspace,
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}/actuations`, {
      portKey, action: 'SET', requestedValue: parseInt(value, 10), idempotencyKey: crypto.randomUUID(),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actuations', deviceId] }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Actuations</h2>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 className="font-medium">Send Command</h3>
        <div className="flex gap-3">
          <input value={portKey} onChange={(e) => setPortKey(e.target.value)} className="border rounded px-3 py-2 text-sm flex-1" placeholder="Port key (e.g. DO_1)" />
          <select value={value} onChange={(e) => setValue(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="1">ON (1)</option>
            <option value="0">OFF (0)</option>
          </select>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Port</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((cmd: any) => (
              <tr key={cmd.id}>
                <td className="px-6 py-4 text-sm font-mono">{cmd.portKey}</td>
                <td className="px-6 py-4 text-sm">{JSON.stringify(cmd.requestedValue)}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${cmd.status === 'ACKED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{cmd.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{cmd.requestedBy?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(cmd.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
