'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { organization, useSession } from '@/lib/auth-client';
import Link from 'next/link';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? params.get('invitationId') ?? '';
  const { data: session } = useSession();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    if (!session?.user) return;

    async function accept() {
      setStatus('loading');
      try {
        await organization.acceptInvitation({ invitationId: token });
        setStatus('success');
        setTimeout(() => router.push('/'), 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message ?? 'Failed to accept invitation');
      }
    }

    accept();
  }, [token, session, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Invalid invitation link.</p>
          <Link href="/sign-in" className="text-blue-600 mt-2 block">Go to sign in</Link>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow text-center space-y-4">
          <h2 className="text-xl font-bold">You've been invited to Powerlytic</h2>
          <p className="text-gray-600">Sign in or create an account to accept this invitation.</p>
          <div className="flex gap-3 justify-center">
            <Link href={`/sign-in?callbackURL=/accept-invitation?token=${token}`} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Sign In</Link>
            <Link href={`/sign-up?callbackURL=/accept-invitation?token=${token}`} className="px-4 py-2 border rounded-md text-sm">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600">Accepting invitation...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-700">Invitation accepted!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 font-medium">Failed to accept invitation</p>
            <p className="text-gray-500 text-sm">{message}</p>
            <Link href="/" className="text-blue-600 text-sm">Go to dashboard</Link>
          </>
        )}
      </div>
    </div>
  );
}
