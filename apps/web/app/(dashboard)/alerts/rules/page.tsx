'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';

export default function AlertRulesPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ deviceId: '', portKey: '', name: '', condition: 'GREATER_THAN', thresholdValue: '', severity: 'MEDIUM' });

  const { data: rules } = useQuery({
    queryKey: ['alert-rules', activeWorkspace?.id],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/alert-rules`),
    enabled: !!activeWorkspace,
  });

  const { data: devices } = useQuery({
    queryKey: ['devices', activeWorkspace?.id],
    queryFn: () => api.get<any[]>(`/v1/workspaces/${activeWorkspace?.id}/devices`),
    enabled: !!activeWorkspace,
  });

  const createRule = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeWorkspace?.id}/alert-rules`, { ...form, thresholdValue: parseFloat(form.thresholdValue) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alert-rules'] }); setShowForm(false); },
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/workspaces/${activeWorkspace?.id}/alert-rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-rules'] }),
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      api.patch(`/v1/workspaces/${activeWorkspace?.id}/alert-rules/${id}`, { isEnabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-rules'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alert Rules</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          + New Rule
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="font-medium">New Alert Rule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">Device</label>
              <select value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2 text-sm">
                <option value="">Select device</option>
                {devices?.map((d: any) => <option key={d.id} value={d.id}>{d.name ?? d.imei}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Port Key</label>
              <input value={form.portKey} onChange={(e) => setForm({ ...form, portKey: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2 text-sm" placeholder="e.g. AI_1" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Rule Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2 text-sm" placeholder="e.g. High Temperature" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Condition</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2 text-sm">
                <option value="GREATER_THAN">Greater Than</option>
                <option value="LESS_THAN">Less Than</option>
                <option value="EQUAL">Equal</option>
                <option value="NOT_EQUAL">Not Equal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Threshold Value</label>
              <input type="number" value={form.thresholdValue} onChange={(e) => setForm({ ...form, thresholdValue: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Severity</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2 text-sm">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => createRule.mutate()} disabled={createRule.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">
              {createRule.isPending ? 'Creating...' : 'Create Rule'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device / Port</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enabled</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rules?.map((rule: any) => (
              <tr key={rule.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{rule.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{rule.device?.name ?? rule.deviceId} / <span className="font-mono">{rule.portKey}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{rule.condition.replace('_', ' ')} {Number(rule.thresholdValue).toFixed(2)}</td>
                <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{rule.severity}</span></td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleRule.mutate({ id: rule.id, isEnabled: !rule.isEnabled })} className={`text-xs px-2 py-1 rounded ${rule.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {rule.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => deleteRule.mutate(rule.id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rules?.length && <p className="text-center py-8 text-gray-500">No alert rules yet</p>}
      </div>
    </div>
  );
}
