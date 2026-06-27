'use client';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DevicesPage() {
  const { activeWorkspace } = useWorkspaceStore();

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices', activeWorkspace?.id],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/devices`),
    enabled: !!activeWorkspace,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Devices</h1>
        <Link href="/devices/claim" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          + Claim Device
        </Link>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {devices?.map((device: any) => (
              <li key={device.id}>
                <Link href={`/devices/${device.id}`} className="block hover:bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{device.name ?? device.imei}</p>
                      <p className="text-sm text-gray-500">IMEI: {device.imei} · Model: {device.deviceModel?.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {device.location?.address ?? 'No location set'} · Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${device.connectivityStatus === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {device.connectivityStatus}
                      </span>
                      <span className="text-xs text-gray-400">{device.lifecycleStatus}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {!devices?.length && (
              <li className="px-6 py-8 text-center text-gray-500">
                No devices yet. <Link href="/devices/claim" className="text-blue-600">Claim your first device.</Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
