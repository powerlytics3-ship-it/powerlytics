'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const [name, setName] = useState(activeWorkspace?.name ?? '');
  const [saved, setSaved] = useState(false);

  const update = useMutation({
    mutationFn: () => api.patch<any>(`/v1/workspaces/${activeWorkspace?.id}`, { name }),
    onSuccess: (data) => {
      setActiveWorkspace({ ...activeWorkspace!, name: data.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Workspace Settings</h1>
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Workspace Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Workspace ID</label>
          <input readOnly value={activeWorkspace?.id ?? ''} className="mt-1 block w-full border rounded px-3 py-2 text-sm bg-gray-50 font-mono" />
        </div>
        {saved && <p className="text-green-600 text-sm">Saved!</p>}
        <button onClick={() => update.mutate()} disabled={update.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
          {update.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
