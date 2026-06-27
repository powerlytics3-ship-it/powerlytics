'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function WorkspaceDetailPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);

  const { data: ws, isLoading } = useQuery({
    queryKey: ['admin-workspace', workspaceId],
    queryFn: () => api.get<any>(`/v1/admin/workspaces/${workspaceId}`),
  });

  if (isLoading) return <div className="text-gray-500">Loading...</div>;
  if (!ws) return <div className="text-red-500">Workspace not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/workspaces" className="text-gray-400 hover:text-gray-600">← Workspaces</Link>
        <h1 className="text-2xl font-bold">{ws.name}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${ws.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{ws.isActive ? 'Active' : 'Inactive'}</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6 space-y-3">
          <h2 className="font-semibold">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">ID</dt><dd className="font-mono text-xs">{ws.id}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Slug</dt><dd className="font-mono">{ws.slug}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Type</dt><dd>{ws.type}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Legal Name</dt><dd>{ws.legalName ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Billing Email</dt><dd>{ws.billingEmail ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd>{new Date(ws.createdAt).toLocaleString()}</dd></div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="font-semibold mb-3">Members ({ws.memberships?.length ?? 0})</h2>
          <ul className="space-y-2">
            {ws.memberships?.map((m: any) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{m.user?.name}</span>
                  <span className="text-gray-400 ml-2">{m.user?.email}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${m.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>{m.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="font-semibold mb-3">Devices ({ws.devices?.length ?? 0})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-2">IMEI</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Model</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ws.devices?.map((d: any) => (
                <tr key={d.id}>
                  <td className="py-2 font-mono text-xs">{d.imei}</td>
                  <td className="py-2">{d.name ?? '—'}</td>
                  <td className="py-2 text-gray-500">{d.deviceModel?.name}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${d.connectivityStatus === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{d.connectivityStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!ws.devices?.length && <p className="text-gray-400 text-sm py-4">No devices in this workspace</p>}
        </div>
      </div>
    </div>
  );
}
