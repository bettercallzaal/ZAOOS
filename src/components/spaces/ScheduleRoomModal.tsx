'use client';

import { useState } from 'react';

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'music', label: 'Music' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'ama', label: 'AMA' },
  { id: 'chill', label: 'Chill' },
  { id: 'dj-set', label: 'DJ Set' },
];

interface ScheduleRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ScheduleRoomModal({ isOpen, onClose, onCreated }: ScheduleRoomModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/spaces/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to schedule');
      }

      setTitle('');
      setDescription('');
      setScheduledAt('');
      setCategory('general');
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule room');
    } finally {
      setLoading(false);
    }
  };

  // Min datetime: now + 5 min
  const minDate = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4" onKeyDown={(e) => e.key === 'Escape' && onClose()} onClick={onClose}>
      <div className="bg-[#0d1b2a] border border-gray-800 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-bold">Schedule a Space</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2.5 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="What's this space about?" className="w-full bg-[#0a1628] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors" disabled={loading} />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} placeholder="Tell people what to expect..." className="w-full bg-[#0a1628] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors resize-none" disabled={loading} />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block">When *</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} min={minDate} className="w-full bg-[#0a1628] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors [color-scheme:dark]" disabled={loading} />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${category === c.id ? 'border-[#f5a623]/60 bg-[#f5a623]/10 text-[#f5a623]' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`} disabled={loading}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-800/50 text-gray-300 rounded-xl text-sm hover:bg-gray-800 transition-colors border border-gray-700/50" disabled={loading}>Cancel</button>
            <button type="submit" disabled={!title.trim() || !scheduledAt || loading} className="flex-1 px-4 py-2.5 bg-[#f5a623] text-[#0a1628] rounded-xl text-sm font-bold hover:bg-[#ffd700] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#f5a623]/20">
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
