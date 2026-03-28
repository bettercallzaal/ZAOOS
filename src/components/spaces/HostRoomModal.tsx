'use client';

import { useState } from 'react';

export type RoomProvider = 'stream' | '100ms';

interface HostRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (title: string, description: string, provider: RoomProvider) => Promise<void>;
}

export function HostRoomModal({ isOpen, onClose, onCreateRoom }: HostRoomModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState<RoomProvider>('stream');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onCreateRoom(title.trim(), description.trim(), provider);
      setTitle('');
      setDescription('');
      setProvider('stream');
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
        <h2 className="text-white text-xl font-bold mb-4">Host a Room</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Provider selector */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('stream')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  provider === 'stream'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-[#0a1628] border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
                disabled={loading}
              >
                <span className="block text-xs opacity-70 mb-0.5">Audio</span>
                Stream.io
              </button>
              <button
                type="button"
                onClick={() => setProvider('100ms')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  provider === '100ms'
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                    : 'bg-[#0a1628] border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
                disabled={loading}
              >
                <span className="block text-xs opacity-70 mb-0.5">Audio</span>
                100ms
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="What's this room about?"
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
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
