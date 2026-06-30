'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api';

export default function AdminInvitePage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    setStatus('loading');
    try {
      const { data } = await userApi.promoteAdmin(code);
      setStatus('success');
      setMsg(data.message);
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setStatus('error');
      setMsg(err?.response?.data?.error || err.friendlyMessage || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24 p-6 border rounded-xl shadow-sm">
      <h1 className="text-lg font-semibold mb-2">Admin Invite</h1>
      <p className="text-sm text-gray-500 mb-4">
        Enter the invite code to unlock admin access. You must be signed in first.
      </p>
      <input
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Secret invite code"
        className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
      />
      <button
        onClick={handleSubmit}
        disabled={status === 'loading' || !code}
        className="w-full bg-civic-teal text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {status === 'loading' ? 'Verifying...' : 'Unlock Admin'}
      </button>
      {msg && (
        <p className={`mt-3 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
