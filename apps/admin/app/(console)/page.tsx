'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const { data: workspaces } = useQuery({
    queryKey: ['admin-workspaces'],
    queryFn: () => api.get<{ total: number }>('/v1/admin/workspaces'),
  });
  const { data: devices } = useQuery({
    queryKey: ['admin-unclaimed'],
    queryFn: () => api.get<{ total: number }>('/v1/admin/devices/unclaimed'),
  });
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<{ total: number }>('/v1/admin/users'),
  });

  const stats = [
    { label: 'Total Workspaces', value: workspaces?.total ?? '—', href: '/workspaces', color: 'bg-purple-50 text-purple-700' },
    { label: 'Unclaimed Devices', value: devices?.total ?? '—', href: '/inventory', color: 'bg-blue-50 text-blue-700' },
    { label: 'Platform Users', value: users?.total ?? '—', href: '/users', color: 'bg-green-50 text-green-700' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Overview</h1>
      <div className="grid grid-cols-3 gap-6">
        {stats.map((s) => (
          <Link key={s.href} href={s.href} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color} inline-block px-3 py-1 rounded-lg`}>{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
