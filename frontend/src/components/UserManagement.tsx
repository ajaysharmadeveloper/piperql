'use client';

import { useState, useEffect, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

interface User { id: string; username: string; email: string; role: string; created_at: string; }
interface UserManagementProps { onClose: () => void; }

export default function UserManagement({ onClose }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { apiFetch('/api/users/').then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : [])); }, []);

  function resetForm() { setUsername(''); setEmail(''); setPassword(''); setError(''); setShowForm(false); setEditingUser(null); }

  function startEdit(user: User) {
    setEditingUser(user); setUsername(user.username); setEmail(user.email); setPassword(''); setShowForm(true); setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (editingUser) {
        const body: Record<string, string> = {};
        if (username !== editingUser.username) body.username = username;
        if (email !== editingUser.email) body.email = email;
        if (password) body.password = password;
        const res = await apiFetch(`/api/users/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(body) });
        const data = await res.json(); setLoading(false);
        if (!res.ok) { setError(data.detail || 'Failed'); return; }
        setUsers((prev) => prev.map((u) => u.id === editingUser.id ? data : u));
      } else {
        const res = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
        const data = await res.json(); setLoading(false);
        if (!res.ok) { setError(data.detail || 'Failed'); return; }
        setUsers((prev) => [data, ...prev]);
      }
      resetForm();
    } catch { setLoading(false); setError('Failed'); }
  }

  async function handleDelete(userId: string) {
    await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  const staffUsers = users.filter((u) => u.role !== 'admin');

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">User Management</h1>
          <p className="text-sm text-text-muted mt-0.5">{staffUsers.length} staff user{staffUsers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add User
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 bg-bg-tertiary hover:bg-bg-active text-text-secondary rounded-xl text-sm font-medium transition-all">
            Back to Chat
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-5 bg-bg-secondary border border-border-primary rounded-2xl space-y-3">
          <h3 className="text-sm font-medium text-text-primary mb-1">{editingUser ? 'Edit User' : 'Create New User'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"
              className="px-3 py-2.5 bg-bg-input border border-border-primary rounded-xl text-sm text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-blue-500/30" required />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="px-3 py-2.5 bg-bg-input border border-border-primary rounded-xl text-sm text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-blue-500/30" required />
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={editingUser ? 'New password (leave blank to keep)' : 'Password'}
            className="w-full px-3 py-2.5 bg-bg-input border border-border-primary rounded-xl text-sm text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            required={!editingUser} />
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><p className="text-red-500 text-xs">{error}</p></div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all">
              {loading ? 'Saving...' : editingUser ? 'Save Changes' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 bg-bg-tertiary hover:bg-bg-active text-text-secondary rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {staffUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 bg-bg-secondary border border-border-primary rounded-xl group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-border-primary flex items-center justify-center">
                <span className="text-sm font-semibold text-text-primary">{user.username[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm text-text-primary font-medium">{user.username}</p>
                <p className="text-xs text-text-muted">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-muted mr-1">
                {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
              </p>
              <button onClick={() => startEdit(user)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-blue-500 hover:bg-bg-hover transition-all opacity-0 group-hover:opacity-100" title="Edit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                </svg>
              </button>
              <button onClick={() => handleDelete(user.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-red-500 hover:bg-bg-hover transition-all opacity-0 group-hover:opacity-100" title="Delete">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {staffUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-sm text-text-muted">No staff users yet</p>
            <p className="text-xs text-text-muted mt-1">Click "Add User" to create one</p>
          </div>
        )}
      </div>
    </div>
  );
}
