'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';

export default function AdminSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn.email({ email, password, callbackURL: '/' });
      router.push('/');
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-purple-600">Powerlytic</h2>
          <p className="text-gray-500 mt-1">Internal Admin Console</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-3 py-2 border rounded-md text-sm" placeholder="Platform admin email" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-3 py-2 border rounded-md text-sm" placeholder="Password" />
          <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in to Admin Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
