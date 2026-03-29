'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken } from '@/lib/api';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.detail || 'Login failed'); return; }
      setToken(data.access_token);
      router.push('/');
    } catch {
      setLoading(false);
      setError('Unable to connect to server');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1.5">Username or Email</label>
        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full px-4 py-2.5 bg-bg-input border border-border-primary rounded-xl text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" required />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-4 py-2.5 bg-bg-input border border-border-primary rounded-xl text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" required />
      </div>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:shadow-none">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in...
          </span>
        ) : 'Sign In'}
      </button>
    </form>
  );
}
