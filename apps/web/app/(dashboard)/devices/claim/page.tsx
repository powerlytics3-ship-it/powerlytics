'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';

export default function ClaimDevicePage() {
  const router = useRouter();
  const { activeWorkspace } = useWorkspaceStore();
  const [claimCode, setClaimCode] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (code: string) =>
      api.post(`/v1/workspaces/${activeWorkspace?.id}/devices/claim`, { claimCode: code }),
    onSuccess: () => router.push('/devices'),
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Claim Device</h1>
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <p className="text-sm text-gray-600">Enter the claim code from your device packaging or provided by your device administrator.</p>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Claim Code</label>
          <input
            type="text"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono tracking-widest"
            placeholder="XXXXXXXXXXXXXXXX"
          />
        </div>
        <button
          onClick={() => mutation.mutate(claimCode)}
          disabled={mutation.isPending || !claimCode}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Claiming...' : 'Claim Device'}
        </button>
      </div>
    </div>
  );
}
