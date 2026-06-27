'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';

export default function MembersPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');

  const { data } = useQuery({
    queryKey: ['members', activeWorkspace?.id],
    queryFn: () => api.get<{ data: any[] }>(`/v1/workspaces/${activeWorkspace?.id}/members`),
    enabled: !!activeWorkspace,
  });

  const invite = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeWorkspace?.id}/members/invite`, { email, role }),
    onSuccess: () => { setShowInvite(false); setEmail(''); qc.invalidateQueries({ queryKey: ['members'] }); },
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) =>
      api.patch(`/v1/workspaces/${activeWorkspace?.id}/members/${userId}`, { role: newRole }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => api.delete(`/v1/workspaces/${activeWorkspace?.id}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Members</h1>
        <button onClick={() => setShowInvite(!showInvite)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          + Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="font-medium">Invite Member</h2>
          <div className="flex gap-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 border rounded px-3 py-2 text-sm" placeholder="colleague@example.com" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="VIEWER">Viewer</option>
              <option value="OPERATOR">Operator</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button onClick={() => invite.mutate()} disabled={invite.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">
              {invite.isPending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data?.map((m: any) => (
              <tr key={m.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-xs font-bold">
                    {m.user?.name?.[0]?.toUpperCase()}
                  </div>
                  {m.user?.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.user?.email}</td>
                <td className="px-6 py-4">
                  {m.role === 'OWNER' ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">OWNER</span>
                  ) : (
                    <select value={m.role} onChange={(e) => changeRole.mutate({ userId: m.userId, newRole: e.target.value })} className="text-xs border rounded px-2 py-1">
                      <option value="VIEWER">Viewer</option>
                      <option value="OPERATOR">Operator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  )}
                </td>
                <td className="px-6 py-4">
                  {m.role !== 'OWNER' && (
                    <button onClick={() => removeMember.mutate(m.userId)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
