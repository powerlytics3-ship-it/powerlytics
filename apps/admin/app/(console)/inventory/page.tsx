'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ imei: '', serialNumber: '', deviceModelId: '', name: '' });

  const { data } = useQuery({
    queryKey: ['unclaimed-devices'],
    queryFn: () => api.get<{ data: any[]; total: number }>('/v1/admin/devices/unclaimed'),
  });

  const { data: models } = useQuery({
    queryKey: ['device-models'],
    queryFn: () => api.get<any[]>('/v1/device-models?status=PUBLISHED'),
  });

  const manufacture = useMutation({
    mutationFn: () => api.post('/v1/devices/manufacture', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['unclaimed-devices'] }); setShowForm(false); setForm({ imei: '', serialNumber: '', deviceModelId: '', name: '' }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Device Inventory</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">+ Manufacture Device</button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="font-medium">Manufacture New Device</h2>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="IMEI (15 digits)" />
            <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="Serial Number" />
            <select value={form.deviceModelId} onChange={(e) => setForm({ ...form, deviceModelId: e.target.value })} className="border rounded px-3 py-2 text-sm">
              <option value="">Select device model</option>
              {models?.map((m: any) => <option key={m.id} value={m.id}>{m.name} v{m.version}</option>)}
            </select>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="Device name (optional)" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => manufacture.mutate()} disabled={manufacture.isPending} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm disabled:opacity-50">
              {manufacture.isPending ? 'Creating...' : 'Manufacture'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufactured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data?.map((device: any) => (
              <tr key={device.id}>
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{device.imei}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-500">{device.serialNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{device.deviceModel?.name}</td>
                <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{device.lifecycleStatus}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(device.manufacturedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">Total unclaimed: {data?.total ?? 0}</div>
      </div>
    </div>
  );
}
