'use client';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { use } from 'react';

export default function DeviceDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const { activeWorkspace } = useWorkspaceStore();

  const { data: device, isLoading } = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => api.get<any>(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}`),
    enabled: !!activeWorkspace,
  });

  const { data: latestTelemetry } = useQuery({
    queryKey: ['telemetry-latest', deviceId],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}/telemetry/latest`),
    enabled: !!activeWorkspace,
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="text-gray-500">Loading...</div>;
  if (!device) return <div className="text-red-500">Device not found</div>;

  const subNav = [
    { href: `/devices/${deviceId}`, label: 'Overview' },
    { href: `/devices/${deviceId}/telemetry`, label: 'Telemetry' },
    { href: `/devices/${deviceId}/configure`, label: 'Configure' },
    { href: `/devices/${deviceId}/deployments`, label: 'Deployments' },
    { href: `/devices/${deviceId}/actuations`, label: 'Actuations' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/devices" className="text-gray-400 hover:text-gray-600">← Devices</Link>
        <h1 className="text-2xl font-bold">{device.name ?? device.imei}</h1>
        <span className={`text-sm px-2 py-1 rounded-full ${device.connectivityStatus === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {device.connectivityStatus}
        </span>
      </div>

      <div className="flex gap-4 border-b">
        {subNav.map((item) => (
          <Link key={item.href} href={item.href} className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">
            {item.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Device Info</h2>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm"><dt className="text-gray-500">IMEI</dt><dd className="font-mono">{device.imei}</dd></div>
            <div className="flex justify-between text-sm"><dt className="text-gray-500">Serial</dt><dd className="font-mono">{device.serialNumber}</dd></div>
            <div className="flex justify-between text-sm"><dt className="text-gray-500">Model</dt><dd>{device.deviceModel?.name}</dd></div>
            <div className="flex justify-between text-sm"><dt className="text-gray-500">Status</dt><dd>{device.lifecycleStatus}</dd></div>
            <div className="flex justify-between text-sm"><dt className="text-gray-500">Last Seen</dt><dd>{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}</dd></div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Latest Readings</h2>
          <div className="space-y-2">
            {latestTelemetry?.map((row: any) => (
              <div key={row.portKey} className="flex justify-between text-sm">
                <span className="text-gray-500 font-mono">{row.portKey}</span>
                <span className="font-medium">{Number(row.calibratedValue).toFixed(2)} {row.unit ?? ''}</span>
              </div>
            ))}
            {!latestTelemetry?.length && <p className="text-gray-400 text-sm">No telemetry yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
