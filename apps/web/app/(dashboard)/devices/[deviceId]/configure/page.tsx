'use client';
import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';

export default function ConfigurePage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();

  const { data: device } = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => api.get<any>(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}`),
    enabled: !!activeWorkspace,
  });

  const deployMutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}/deployments`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments', deviceId] }),
  });

  const credentialMutation = useMutation({
    mutationFn: () => api.post<{ apiKey: string; warning: string }>(`/v1/workspaces/${activeWorkspace?.id}/devices/${deviceId}/credential`),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Configure</h2>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 className="font-medium">Ports</h3>
        <div className="space-y-3">
          {device?.ports?.map((port: any) => (
            <div key={port.portKey} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-mono text-sm font-medium">{port.portKey}</span>
                  <span className="ml-2 text-xs text-gray-500">{port.portType?.valueFormat}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${port.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{port.status}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-gray-600">
                <span>Unit: {port.unit ?? '—'}</span>
                <span>Scaling: {port.scaling}</span>
                <span>Offset: {port.offset}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 className="font-medium">Device API Key</h3>
        <p className="text-sm text-gray-600">Generate a new API key for this device to authenticate telemetry requests.</p>
        {credentialMutation.data && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800">Save this key — it won't be shown again!</p>
            <code className="block mt-2 text-xs font-mono break-all">{credentialMutation.data.apiKey}</code>
          </div>
        )}
        <button onClick={() => credentialMutation.mutate()} disabled={credentialMutation.isPending} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50">
          {credentialMutation.isPending ? 'Generating...' : 'Generate API Key'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 className="font-medium">Deploy Configuration</h3>
        <p className="text-sm text-gray-600">Push the current port and Modbus configuration to the device.</p>
        {deployMutation.isSuccess && <p className="text-sm text-green-600">Configuration deployed successfully!</p>}
        {deployMutation.isError && <p className="text-sm text-red-600">Deploy failed. Check the deployments tab.</p>}
        <button onClick={() => deployMutation.mutate()} disabled={deployMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
          {deployMutation.isPending ? 'Deploying...' : 'Deploy Now'}
        </button>
      </div>
    </div>
  );
}
