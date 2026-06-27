'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function DeviceModelsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', microControllerType: '', ports: '' });

  const { data: models } = useQuery({
    queryKey: ['device-models'],
    queryFn: () => api.get<any[]>('/v1/device-models'),
  });

  const createModel = useMutation({
    mutationFn: () => api.post('/v1/device-models', {
      name: form.name,
      description: form.description,
      microControllerType: form.microControllerType,
      ports: [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['device-models'] }); setShowForm(false); },
  });

  const publish = useMutation({
    mutationFn: (id: string) => api.post(`/v1/device-models/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device-models'] }),
  });

  const newVersion = useMutation({
    mutationFn: (id: string) => api.post(`/v1/device-models/${id}/new-version`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device-models'] }),
  });

  const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    DEPRECATED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Device Models</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">+ New Model</button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="font-medium">New Device Model (Draft)</h2>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="Model name" />
            <input value={form.microControllerType} onChange={(e) => setForm({ ...form, microControllerType: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="MCU type (e.g. ESP32)" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded px-3 py-2 text-sm col-span-2" rows={2} placeholder="Description" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => createModel.mutate()} disabled={createModel.isPending} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm disabled:opacity-50">Create Draft</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MCU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ports</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {models?.map((model: any) => (
              <tr key={model.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{model.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{model.microControllerType ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{model.ports?.length ?? 0} ports</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[model.status] ?? ''}`}>{model.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">v{model.version}</td>
                <td className="px-6 py-4 flex gap-2">
                  {model.status === 'DRAFT' && (
                    <button onClick={() => publish.mutate(model.id)} className="text-xs text-green-600 hover:text-green-800">Publish</button>
                  )}
                  {model.status === 'PUBLISHED' && (
                    <button onClick={() => newVersion.mutate(model.id)} className="text-xs text-blue-600 hover:text-blue-800">New Version</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!models?.length && <p className="text-center py-8 text-gray-500">No device models yet</p>}
      </div>
    </div>
  );
}
