'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';
import Link from 'next/link';

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
};

export default function AlertsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['alert-events', activeWorkspace?.id],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/alert-events`),
    enabled: !!activeWorkspace,
    refetchInterval: 30_000,
  });

  const acknowledge = useMutation({
    mutationFn: (id: string) => api.post(`/v1/workspaces/${activeWorkspace?.id}/alert-events/${id}/acknowledge`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-events'] }),
  });

  const resolve = useMutation({
    mutationFn: (id: string) => api.post(`/v1/workspaces/${activeWorkspace?.id}/alert-events/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-events'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <Link href="/alerts/rules" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Manage Rules</Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {events?.map((ev: any) => (
              <tr key={ev.id}>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_COLORS[ev.alertRule?.severity] ?? 'bg-gray-100'}`}>{ev.alertRule?.severity}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{ev.alertRule?.name}</td>
                <td className="px-6 py-4 text-sm font-mono">{Number(ev.triggerValue).toFixed(2)}</td>
                <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-gray-100">{ev.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(ev.triggeredAt).toLocaleString()}</td>
                <td className="px-6 py-4 flex gap-2">
                  {ev.status === 'NEW' && (
                    <button onClick={() => acknowledge.mutate(ev.id)} className="text-xs text-blue-600 hover:text-blue-800">Acknowledge</button>
                  )}
                  {ev.status !== 'RESOLVED' && (
                    <button onClick={() => resolve.mutate(ev.id)} className="text-xs text-green-600 hover:text-green-800">Resolve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!events?.length && <p className="text-center py-8 text-gray-500">No active alerts</p>}
      </div>
    </div>
  );
}
