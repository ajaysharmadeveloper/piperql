'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface Setting {
  key: string;
  value: string;
  description: string;
}

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/settings/').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setSettings(d);
    });
  }, []);

  function startEdit(setting: Setting) {
    setEditingKey(setting.key);
    // If value is masked, start with empty so user types fresh
    setEditValue(setting.value.startsWith('•') ? '' : setting.value);
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue('');
  }

  async function handleSave(key: string) {
    if (!editValue.trim()) { cancelEdit(); return; }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/settings/', {
        method: 'PUT',
        body: JSON.stringify({ key, value: editValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Failed to update');
        setSaving(false);
        return;
      }
      setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value: data.value } : s));
      setSuccess(`${key} updated`);
      setEditingKey(null);
      setEditValue('');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update');
    }
    setSaving(false);
  }

  // Group settings by category
  const groups = [
    {
      label: 'AI Configuration',
      keys: ['OPENAI_API_KEY'],
    },
    {
      label: 'Database Connection',
      keys: ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD'],
    },
    {
      label: 'Integrations',
      keys: ['MEM0_API_KEY', 'TAVILY_API_KEY'],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
          &larr; Back to Chat
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-1">
          Configure API keys and database connections. These values are stored securely in the database.
        </p>
      </div>

      {success && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group) => {
          const groupSettings = settings.filter((s) => group.keys.includes(s.key));
          if (groupSettings.length === 0) return null;

          return (
            <div key={group.label} className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border-primary">
                <h2 className="text-sm font-semibold text-text-primary">{group.label}</h2>
              </div>
              <div className="divide-y divide-border-primary">
                {groupSettings.map((setting) => (
                  <div key={setting.key} className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary font-mono">{setting.key}</p>
                        <p className="text-xs text-text-muted mt-0.5">{setting.description}</p>
                      </div>
                      {editingKey !== setting.key && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-text-tertiary font-mono max-w-[200px] truncate">
                            {setting.value || '(not set)'}
                          </span>
                          <button
                            onClick={() => startEdit(setting)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    {editingKey === setting.key && (
                      <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type={setting.key.endsWith('_KEY') || setting.key === 'DB_PASSWORD' ? 'password' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder={`Enter ${setting.key}`}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-primary bg-bg-primary text-text-primary outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(setting.key);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button
                          onClick={() => handleSave(setting.key)}
                          disabled={saving}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs px-3 py-1.5 rounded-lg bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
