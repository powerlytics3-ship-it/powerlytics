'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function PortTypesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', codeName: '', category: 'INPUT', valueFormat: 'ANALOG', description: '' });

  const { data: portTypes } = useQuery({
    queryKey: ['port-types'],
    queryFn: () => api.get<any[]>('/v1/port-types'),
  });

  const create = useMutation({
    mutationFn: () => api.post('/v1/port-types', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['port-types'] }); setShowForm(false); },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Port Types</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">+ New Port Type</button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="font-medium">New Port Type</h2>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="Name (e.g. Analog Input)" />
            <input value={form.codeName} onChange={(e) => setForm({ ...form, codeName: e.target.value })} className="border rounded px-3 py-2 text-sm font-mono uppercase" placeholder="Code (e.g. AI)" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded px-3 py-2 text-sm">
              <option value="INPUT">Input</option>
              <option value="OUTPUT">Output</option>
            </select>
            <select value={form.valueFormat} onChange={(e) => setForm({ ...form, valueFormat: e.target.value })} className="border rounded px-3 py-2 text-sm">
              <option value="ANALOG">Analog</option>
              <option value="DIGITAL">Digital</option>
              <option value="MODBUS">Modbus</option>
              <option value="AC_INPUT">AC Input</option>
            </select>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded px-3 py-2 text-sm col-span-2" placeholder="Description" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => create.mutate()} disabled={create.isPending} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm disabled:opacity-50">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {portTypes?.map((pt: any) => (
              <tr key={pt.id}>
                <td className="px-6 py-4 text-sm font-mono font-bold text-purple-700">{pt.codeName}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{pt.name}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${pt.category === 'INPUT' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{pt.category}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{pt.valueFormat}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{pt.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!portTypes?.length && <p className="text-center py-8 text-gray-500">No port types yet. Create the standard ones: AI, DI, MI, DO, AC.</p>}
      </div>
    </div>
  );
}
