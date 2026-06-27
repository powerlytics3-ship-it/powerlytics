'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function WorkspacesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-workspaces-list'],
    queryFn: () => api.get<{ data: any[]; total: number }>('/v1/admin/workspaces'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Workspaces</h1>
      {isLoading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Devices</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data?.map((ws: any) => (
                <tr key={ws.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/workspaces/${ws.id}`} className="text-sm font-medium text-purple-600 hover:text-purple-800">{ws.name}</Link>
                    <p className="text-xs text-gray-400 font-mono">{ws.slug}</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-gray-100">{ws.type}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ws._count?.memberships ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ws._count?.devices ?? 0}</td>
                  <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${ws.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{ws.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(ws.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">Total: {data?.total ?? 0} workspaces</div>
        </div>
      )}
    </div>
  );
}
