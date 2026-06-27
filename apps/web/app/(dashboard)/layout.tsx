'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { activeWorkspace, workspaces, setActiveWorkspace, setWorkspaces } = useWorkspaceStore();

  const { data: wsData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get<any[]>('/v1/workspaces'),
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (wsData) {
      setWorkspaces(wsData);
      if (!activeWorkspace && wsData.length > 0) setActiveWorkspace(wsData[0]);
    }
  }, [wsData, activeWorkspace, setActiveWorkspace, setWorkspaces]);

  useEffect(() => {
    if (!isPending && !session?.user) router.push('/sign-in');
  }, [session, isPending, router]);

  if (isPending) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!session?.user) return null;

  const nav = [
    { href: '/', label: 'Overview' },
    { href: '/devices', label: 'Devices' },
    { href: '/alerts', label: 'Alerts' },
    { href: '/members', label: 'Members' },
    { href: '/audit-log', label: 'Audit Log' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">Powerlytic</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {workspaces.length > 1 && (
                <select
                  value={activeWorkspace?.id ?? ''}
                  onChange={(e) => {
                    const ws = workspaces.find((w) => w.id === e.target.value);
                    if (ws) setActiveWorkspace(ws);
                  }}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  {workspaces.map((ws: any) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              )}
              <span className="text-sm text-gray-700">{session.user.name}</span>
              <button onClick={() => signOut()} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
