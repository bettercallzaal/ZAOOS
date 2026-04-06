'use client';

import { useState } from 'react';

interface EditRoomModalProps {
  roomId: string;
  currentTitle: string;
  currentDescription: string;
  currentTheme: string;
  onClose: () => void;
  onSaved: (updated: { title: string; description: string; theme: string }) => void;
}

const THEMES = [
  { id: 'default', label: 'Default', color: '#f5a623' },
  { id: 'music', label: 'Music', color: '#a855f7' },
  { id: 'podcast', label: 'Podcast', color: '#ef4444' },
  { id: 'ama', label: 'AMA', color: '#eab308' },
  { id: 'chill', label: 'Chill', color: '#22c55e' },
];

export function EditRoomModal({ roomId, currentTitle, currentDescription, currentTheme, onClose, onSaved }: EditRoomModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [theme, setTheme] = useState(currentTheme || 'default');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/stream/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          title: title.trim(),
          description: description.trim(),
          theme,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      onSaved({ title: title.trim(), description: description.trim(), theme });
      onClose();
    } catch {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="bg-[#0d1b2a] rounded-2xl border border-white/[0.08] w-full max-w-md mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Edit Room</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}

        {/* Theme */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Theme</label>
          <div className="flex gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-colors ${
                  theme === t.id ? 'border-[#f5a623] bg-[#f5a623]/5' : 'border-white/[0.08] hover:border-gray-600'
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-[10px] text-gray-400">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:border-[#f5a623]/50 focus:outline-none"
          />
          <p className="text-[10px] text-gray-600 text-right mt-1">{title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:border-[#f5a623]/50 focus:outline-none resize-none"
          />
          <p className="text-[10px] text-gray-600 text-right mt-1">{description.length}/500</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#f5a623] text-black text-sm font-medium hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
