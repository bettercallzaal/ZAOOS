'use client';

import { useState } from 'react';
import { TokenGateSection, type GateConfig } from './TokenGateSection';
import { communityConfig } from '../../../community.config';
import type { AudioProvider } from '@/lib/spaces/roomsDb';

export type RoomTheme = 'default' | 'music' | 'podcast' | 'ama' | 'chill';

const PROVIDERS: { id: AudioProvider; label: string; description: string; badge: string }[] = [
  {
    id: 'stream',
    label: 'Stream.io',
    description: 'HiFi music mode, native RTMP multistream',
    badge: '🎵',
  },
  {
    id: '100ms',
    label: '100ms',
    description: 'Live transcription, best for fractal meetings',
    badge: '🎙️',
  },
];

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
  onCreateRoom: (
    title: string,
    description: string,
    theme: RoomTheme,
    gateConfig?: GateConfig | null,
    provider?: AudioProvider
  ) => Promise<void>;
}

export function HostRoomModal({ isOpen, onClose, onCreateRoom }: HostRoomModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<RoomTheme>('default');
  const [provider, setProvider] = useState<AudioProvider>(communityConfig.audioProvider ?? 'stream');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);
  const [gateConfig, setGateConfig] = useState<GateConfig | null>(null);

  if (!isOpen) return null;

  const titleError = titleTouched && !title.trim() ? 'Title is required' : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleTouched(true);
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onCreateRoom(title.trim(), description.trim(), theme, gateConfig, provider);
      setTitle('');
      setDescription('');
      setTheme('default');
      setTitleTouched(false);
      setGateConfig(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-[#0d1b2a] border border-gray-800 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-bold">Create a Stage</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2.5 rounded-lg mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Theme selector */}
          <div className="mb-5">
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
              Theme
            </label>
            <div className="grid grid-cols-5 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  disabled={loading}
                  title={t.description}
                  className={`flex flex-col items-center gap-2 px-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${
                    theme === t.id
                      ? `${t.active} shadow-sm`
                      : 'bg-[#0a1628] border-gray-700/50 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${t.dot} ${theme === t.id ? 'ring-2 ring-offset-1 ring-offset-[#0a1628] ring-current' : ''}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleTouched(true)}
              maxLength={100}
              placeholder="What's this stage about?"
              className={`w-full bg-[#0a1628] border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-colors ${
                titleError
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-gray-700 focus:border-[#f5a623]'
              }`}
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-1.5">
              {titleError ? (
                <span className="text-red-400 text-xs">{titleError}</span>
              ) : (
                <span />
              )}
              <span className="text-gray-600 text-xs">{title.length}/100</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell people what to expect..."
              className="w-full bg-[#0a1628] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors resize-none"
              disabled={loading}
            />
            <div className="text-gray-600 text-xs mt-1 text-right">{description.length}/500</div>
          </div>

          {/* Token Gate */}
          <TokenGateSection value={gateConfig} onChange={setGateConfig} disabled={loading} />

          {/* Audio Provider */}
          <div className="mb-5">
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
              Audio Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  disabled={loading}
                  className={`flex flex-col gap-1 px-3 py-3 rounded-xl border text-left text-sm transition-all ${
                    provider === p.id
                      ? 'border-[#f5a623] bg-[#f5a623]/10 text-white'
                      : 'border-gray-700/50 bg-[#0a1628] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="text-base">{p.badge}</span>
                  <span className="font-semibold text-white">{p.label}</span>
                  <span className="text-xs text-gray-500 leading-tight">{p.description}</span>
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-1.5">
              {provider === 'stream' ? '🎵 Best for music rooms — HiFi stereo mode, native multistream' : '🎙️ Best for fractal meetings — live transcription included'}
            </p>
          </div>

          {/* Broadcast info */}
          <div className="mb-6">
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
              Multistream
            </label>
            <p className="text-gray-500 text-xs leading-relaxed">
              After creating, use the <span className="text-[#f5a623]">Broadcast</span> button in the room controls to stream to Twitch, YouTube, Kick, or Facebook. Connect your accounts in Settings first.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800/50 text-gray-300 rounded-xl text-sm hover:bg-gray-800 transition-colors border border-gray-700/50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2.5 bg-[#f5a623] text-[#0a1628] rounded-xl text-sm font-bold hover:bg-[#ffd700] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#f5a623]/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Go Live'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
