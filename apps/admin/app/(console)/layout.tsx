'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) router.push('/sign-in');
    if (!isPending && session?.user && !(session.user as any).platformRole) {
      router.push('/sign-in');
    }
  }, [session, isPending, router]);

  if (isPending) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  if (!session?.user) return null;

  const nav = [
    { href: '/', label: 'Overview' },
    { href: '/workspaces', label: 'Workspaces' },
    { href: '/device-models', label: 'Device Models' },
    { href: '/port-types', label: 'Port Types' },
    { href: '/inventory', label: 'Inventory' },
    { href: '/users', label: 'Users' },
    { href: '/audit-log', label: 'Audit Log' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="text-purple-400 font-bold text-lg">Admin Console</span>
              <div className="flex gap-6">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className="text-sm text-gray-300 hover:text-white">{item.label}</Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{session.user.name} · {(session.user as any).platformRole}</span>
              <button onClick={() => signOut()} className="text-sm text-gray-400 hover:text-white">Sign out</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
