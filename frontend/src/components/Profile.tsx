'use client';

import { useState, useEffect, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

interface ProfileProps { onClose: () => void; }

export default function Profile({ onClose }: ProfileProps) {
  const [user, setUser] = useState<{ id: string; username: string; email: string; role: string; created_at: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/auth/me').then((r) => {
      if (!r.ok) return;
      return r.json();
    }).then((d) => {
      if (!d?.username) return;
      setUser(d);
      setUsername(d.username);
      setEmail(d.email);
    });
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (username !== user?.username) body.username = username;
      if (email !== user?.email) body.email = email;
      if (password) body.password = password;

      if (Object.keys(body).length === 0) { setLoading(false); setEditing(false); return; }

      const res = await apiFetch(`/api/users/${user?.id}`, { method: 'PUT', body: JSON.stringify(body) });
      const data = await res.json(); setLoading(false);
      if (!res.ok) { setError(data.detail || 'Failed to update'); return; }
      setUser(data); setSuccess('Profile updated'); setEditing(false); setPassword('');
    } catch { setLoading(false); setError('Failed to update'); }
  }

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Profile</h1>
        <button onClick={onClose} className="px-4 py-2 bg-bg-tertiary hover:bg-bg-active text-text-secondary rounded-xl text-sm font-medium transition-all">
          Back to Chat
        </button>
      </div>

      <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6">
        {/* Avatar + Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-border-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-text-primary">{user.username[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{user.username}</p>
            <p className="text-sm text-text-muted">{user.email}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg mt-1 inline-block ${user.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-bg-badge text-text-tertiary'}`}>{user.role}</span>
          </div>
        </div>

        <div className="border-t border-border-primary pt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-text-muted">
              Member since {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
            </p>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-sm text-blue-500 hover:text-blue-400 font-medium transition-all">
                Edit Profile
              </button>
            )}
          </div>

          {success && <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-4"><p className="text-green-500 text-xs">{success}</p></div>}

          {editing && (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-input border border-border-primary rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30" required />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-input border border-border-primary rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30" required />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">New Password <span className="text-text-placeholder">(leave blank to keep current)</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-input border border-border-primary rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><p className="text-red-500 text-xs">{error}</p></div>}
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setEditing(false); setUsername(user.username); setEmail(user.email); setPassword(''); setError(''); }}
                  className="px-4 py-2 bg-bg-tertiary hover:bg-bg-active text-text-secondary rounded-xl text-sm transition-all">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
