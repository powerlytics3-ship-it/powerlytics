'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-green-100 text-green-800',
  SENT: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  TIMED_OUT: 'bg-gray-100 text-gray-600',
};

export default function DeploymentsPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const { activeWorkspace } = useWorkspaceStore();

  const { data } = useQuery({
    queryKey: ['deployments', deviceId],
    queryFn: () => api.get<{ data: any[]; total: number }>(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}/deployments`),
    enabled: !!activeWorkspace,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Deployment History</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggered By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acknowledged At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Config Hash</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data?.map((dep: any) => (
              <tr key={dep.id}>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[dep.status] ?? 'bg-gray-100'}`}>{dep.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{dep.triggeredBy?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{dep.sentAt ? new Date(dep.sentAt).toLocaleString() : '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{dep.acknowledgedAt ? new Date(dep.acknowledgedAt).toLocaleString() : '—'}</td>
                <td className="px-6 py-4 text-xs font-mono text-gray-400 truncate max-w-xs">{dep.configHash?.slice(0, 16)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.data?.length && <p className="text-center py-8 text-gray-500">No deployments yet</p>}
      </div>
    </div>
  );
}
