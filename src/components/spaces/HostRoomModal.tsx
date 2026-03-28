'use client';

import { useState } from 'react';

export type RoomTheme = 'default' | 'music' | 'podcast' | 'ama' | 'chill';

interface ThemeOption {
  id: RoomTheme;
  label: string;
  description: string;
  dot: string;
  active: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Navy/gold ZAO theme',
    dot: 'bg-[#f5a623]',
    active: 'border-[#f5a623]/60 bg-[#f5a623]/10 text-[#f5a623]',
  },
  {
    id: 'music',
    label: 'Music',
    description: 'Purple gradient',
    dot: 'bg-purple-500',
    active: 'border-purple-500/60 bg-purple-500/10 text-purple-300',
  },
  {
    id: 'podcast',
    label: 'Podcast',
    description: 'Warm conversation',
    dot: 'bg-amber-500',
    active: 'border-amber-500/60 bg-amber-500/10 text-amber-300',
  },
  {
    id: 'ama',
    label: 'AMA',
    description: 'Q&A style',
    dot: 'bg-yellow-400',
    active: 'border-yellow-400/60 bg-yellow-400/10 text-yellow-300',
  },
  {
    id: 'chill',
    label: 'Chill',
    description: 'Relaxed vibes',
    dot: 'bg-teal-500',
    active: 'border-teal-500/60 bg-teal-500/10 text-teal-300',
  },
];

interface HostRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (title: string, description: string, theme: RoomTheme) => Promise<void>;
}

export function HostRoomModal({ isOpen, onClose, onCreateRoom }: HostRoomModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<RoomTheme>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onCreateRoom(title.trim(), description.trim(), theme);
      setTitle('');
      setDescription('');
      setTheme('default');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0d1b2a] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-white text-xl font-bold mb-4">Create a Stage</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Theme selector */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Theme</label>
            <div className="grid grid-cols-5 gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  disabled={loading}
                  title={t.description}
                  className={`flex flex-col items-center gap-1.5 px-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    theme === t.id
                      ? t.active
                      : 'bg-[#0a1628] border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="What's this stage about?"
              className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors"
              disabled={loading}
            />
            <div className="text-gray-600 text-xs mt-1 text-right">{title.length}/100</div>
          </div>

          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Optional description..."
              className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors resize-none"
              disabled={loading}
            />
            <div className="text-gray-600 text-xs mt-1 text-right">{description.length}/500</div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2.5 bg-[#f5a623] text-[#0a1628] rounded-lg text-sm font-semibold hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Go Live'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
