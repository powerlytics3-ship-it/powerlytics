'use client';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';

export default function AuditLogPage() {
  const { activeWorkspace } = useWorkspaceStore();

  const { data } = useQuery({
    queryKey: ['audit-log', activeWorkspace?.id],
    queryFn: () => api.get<{ data: any[]; total: number }>(`/v1/workspaces/${activeWorkspace?.id}/audit-log`),
    enabled: !!activeWorkspace,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data?.map((entry: any) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{entry.action}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{entry.actorUser?.name ?? entry.actorType}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{entry.targetType} {entry.targetId?.slice(0, 8)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(entry.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.data?.length && <p className="text-center py-8 text-gray-500">No audit entries yet</p>}
      </div>
    </div>
  );
}
