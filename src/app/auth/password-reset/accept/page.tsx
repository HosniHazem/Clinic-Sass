"use client";

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PasswordResetAcceptPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams?.get('token') ?? '';
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/password-reset/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Reset failed');
      setMessage('Password updated — redirecting to login...');
      setTimeout(() => router.push('/auth/login'), 1400);
    } catch (err: any) {
      setMessage(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Reset Password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Reset Token</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded">{loading ? 'Saving…' : 'Update Password'}</button>
        </div>
        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
}
