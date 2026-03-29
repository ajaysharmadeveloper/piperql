'use client';

import { useState } from 'react';

interface ConfirmationPromptProps {
  sql: string;
  isDestructive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationPrompt({ sql, isDestructive, onConfirm, onCancel }: ConfirmationPromptProps) {
  const [confirmText, setConfirmText] = useState('');
  const destructiveTarget = isDestructive
    ? sql.match(/(?:DROP|TRUNCATE|DELETE\s+FROM)\s+(?:TABLE\s+)?(?:IF\s+EXISTS\s+)?(\w+)/i)?.[1] || '' : '';
  const canConfirm = isDestructive ? confirmText === destructiveTarget : true;

  return (
    <div className={`p-3 rounded-xl border ${isDestructive ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
      <p className={`text-sm font-medium mb-2 ${isDestructive ? 'text-red-500' : 'text-yellow-600'}`}>
        {isDestructive ? 'Destructive Operation — This cannot be undone!' : 'This operation will modify your database.'}
      </p>
      <pre className="bg-bg-tertiary p-2 rounded-lg text-xs text-text-secondary overflow-x-auto mb-3 border border-border-primary">{sql}</pre>
      {isDestructive && destructiveTarget && (
        <div className="mb-3">
          <p className="text-xs text-red-500 mb-1">Type <strong>{destructiveTarget}</strong> to confirm:</p>
          <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-2 py-1 bg-bg-input border border-border-primary rounded-lg text-sm text-text-primary" placeholder={destructiveTarget} />
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onConfirm} disabled={!canConfirm}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all text-white ${
            isDestructive ? 'bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:text-red-400' : 'bg-yellow-600 hover:bg-yellow-500'
          }`}>Confirm</button>
        <button onClick={onCancel} className="px-4 py-1.5 bg-bg-active hover:bg-bg-badge rounded-lg text-sm text-text-secondary font-medium transition-all">Cancel</button>
      </div>
    </div>
  );
}
