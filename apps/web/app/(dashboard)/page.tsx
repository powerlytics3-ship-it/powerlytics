'use client';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspaceStore();

  const { data: devices } = useQuery({
    queryKey: ['devices', activeWorkspace?.id],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/devices`),
    enabled: !!activeWorkspace,
  });

  const { data: alerts } = useQuery({
    queryKey: ['alert-events', activeWorkspace?.id],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/alert-events?status=NEW&limit=5`),
    enabled: !!activeWorkspace,
  });

  const onlineDevices = devices?.filter((d: any) => d.connectivityStatus === 'ONLINE').length ?? 0;
  const totalDevices = devices?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500">{activeWorkspace?.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Total Devices</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{totalDevices}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <p className="text-sm font-medium text-gray-500">Online Devices</p>
            <p className="mt-1 text-3xl font-semibold text-green-600">{onlineDevices}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <p className="text-sm font-medium text-gray-500">Active Alerts</p>
            <p className="mt-1 text-3xl font-semibold text-red-600">{alerts?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {(alerts?.length ?? 0) > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Alerts</h2>
            <Link href="/alerts" className="text-sm text-blue-600">View all</Link>
          </div>
          <ul className="space-y-3">
            {alerts?.map((ev: any) => (
              <li key={ev.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-gray-700">{ev.message ?? ev.alertRule?.name}</span>
                <span className="ml-auto text-xs text-gray-500">{new Date(ev.triggeredAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Devices</h2>
          <Link href="/devices" className="text-sm text-blue-600">View all</Link>
        </div>
        <div className="space-y-2">
          {devices?.slice(0, 5).map((d: any) => (
            <Link key={d.id} href={`/devices/${d.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{d.name ?? d.imei}</p>
                <p className="text-xs text-gray-500">{d.deviceModel?.name}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${d.connectivityStatus === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {d.connectivityStatus}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
