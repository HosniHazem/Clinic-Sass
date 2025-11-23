"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      setMessage('If this email exists, a reset link was sent.');
      setTimeout(() => router.push('/auth/login'), 1800);
    } catch (err: any) {
      setMessage(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Request Password Reset</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email address</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <button type="submit" disabled={loading} className="w-full bg-yellow-600 text-white py-2 rounded">{loading ? 'Sending…' : 'Send reset link'}</button>
        </div>
        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
}
