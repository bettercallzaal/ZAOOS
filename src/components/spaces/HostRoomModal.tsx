'use client';

import { useState } from 'react';
import type { AudioProvider } from '@/lib/spaces/roomsDb';
import { communityConfig } from '../../../community.config';
import { type GateConfig, TokenGateSection } from './TokenGateSection';

export type RoomTheme = 'default' | 'music' | 'podcast' | 'ama' | 'chill';
export type RoomMode = 'stage' | 'voice_channel';

const ROOM_MODES: { id: RoomMode; label: string; description: string; badge: string }[] = [
  {
    id: 'stage',
    label: 'Stage',
    description: 'Audio only. Host speaks; listeners raise hand to join.',
    badge: 'MIC',
  },
  {
    id: 'voice_channel',
    label: 'Video Room',
    description: 'Everyone can mic, camera, and screen share.',
    badge: 'CAM',
  },
];

const PROVIDERS: { id: AudioProvider; label: string; description: string; badge: string }[] = [
  // Juke first - it's the default + headline surface. Order matters visually.
  {
    id: 'juke',
    label: 'Juke',
    description:
      'Farcaster-native audio. Anyone with the link listens, SIWF to speak. Best for public ZAO events.',
    badge: 'FC',
  },
  {
    id: 'stream',
    label: 'Stream.io',
    description: 'HiFi music mode, native RTMP multistream. ZAO-side video room option.',
    badge: 'MUSIC',
  },
  {
    id: '100ms',
    label: '100ms',
    description: 'Live transcription, best for fractal meetings.',
    badge: 'CALL',
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
    description: 'Deep listening',
    dot: 'bg-[#ffd700]',
    active: 'border-[#ffd700]/60 bg-[#ffd700]/10 text-[#ffd700]',
  },
  {
    id: 'podcast',
    label: 'Podcast',
    description: 'Warm conversation',
    dot: 'bg-[#f5a623]/70',
    active: 'border-[#f5a623]/40 bg-[#f5a623]/8 text-[#f5a623]/80',
  },
  {
    id: 'ama',
    label: 'AMA',
    description: 'Q&A style',
    dot: 'bg-[#ededed]',
    active: 'border-white/30 bg-white/5 text-[#ededed]',
  },
  {
    id: 'chill',
    label: 'Chill',
    description: 'Relaxed vibes',
    dot: 'bg-[#a0aec0]',
    active: 'border-[#a0aec0]/40 bg-[#a0aec0]/8 text-[#a0aec0]',
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
    provider?: AudioProvider,
    roomMode?: RoomMode,
    jukeOpts?: JukeCreateOptions,
  ) => Promise<void>;
}

/**
 * Juke-specific create-time options. Plumbed through HostRoomModal when the
 * Juke tile is selected; ignored by Stream.io + 100ms paths.
 */
export interface JukeCreateOptions {
  /** Record the room - drives /live/recordings shelf + recording.ready cast. */
  record: boolean;
  /** Let agents (e.g. ZOE) join the room via partner-scoped agent-join. */
  allowAgents: boolean;
  /** Have Juke post an announcement cast on Farcaster when the space opens. */
  announceCast?: boolean;
}

export function HostRoomModal({ isOpen, onClose, onCreateRoom }: HostRoomModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<RoomTheme>('default');
  // Juke is the default provider - "Live audio on Farcaster" is the headline
  // surface today. communityConfig.audioProvider can override if a forked
  // community wants Stream.io / 100ms as the default.
  const [provider, setProvider] = useState<AudioProvider>(communityConfig.audioProvider ?? 'juke');
  // Juke-specific defaults: record=true (every space becomes a recording
  // artifact unless host opts out), allowAgents=true (gates ZOE auto-join when
  // we flip ZAO_AUTO_AGENT_JOIN once Nicky's #190 visibility flag ships).
  const [jukeRecord, setJukeRecord] = useState<boolean>(true);
  const [jukeAllowAgents, setJukeAllowAgents] = useState<boolean>(true);
  const [jukeAnnounceCast, setJukeAnnounceCast] = useState<boolean>(false);
  const [roomMode, setRoomMode] = useState<RoomMode>('stage');
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
      await onCreateRoom(
        title.trim(),
        description.trim(),
        theme,
        gateConfig,
        provider,
        roomMode,
        provider === 'juke'
          ? {
              record: jukeRecord,
              allowAgents: jukeAllowAgents,
              announceCast: jukeAnnounceCast,
            }
          : undefined,
      );
      setTitle('');
      setDescription('');
      setTheme('default');
      setRoomMode('stage');
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
      <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-bold">
            {provider === 'juke'
              ? 'Create a Juke space'
              : roomMode === 'voice_channel'
                ? 'Create a Video Room'
                : 'Create a Stage'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2.5 rounded-lg mb-4">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Room mode selector — hidden for Juke (Juke is audio-only Clubhouse). */}
          {provider !== 'juke' && (
            <div className="mb-5">
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
                Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROOM_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRoomMode(m.id)}
                    disabled={loading}
                    className={`flex flex-col gap-1 px-3 py-3 rounded-xl border text-left text-sm transition-all ${
                      roomMode === m.id
                        ? 'border-[#f5a623] bg-[#f5a623]/10 text-white'
                        : 'border-white/[0.08] bg-[#0a1628] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-wider text-[#f5a623]">
                      {m.badge}
                    </span>
                    <span className="font-semibold text-white">{m.label}</span>
                    <span className="text-xs text-gray-500 leading-tight">{m.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Theme selector — hidden for Juke (theme is a ZAO-side rendering concept). */}
          {provider !== 'juke' && (
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
                        : 'bg-[#0a1628] border-white/[0.08] text-gray-500 hover:border-gray-600 hover:text-gray-400'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full ${t.dot} ${theme === t.id ? 'ring-2 ring-offset-1 ring-offset-[#0a1628] ring-current' : ''}`}
                    />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  : 'border-white/[0.08] focus:border-[#f5a623]'
              }`}
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-1.5">
              {titleError ? <span className="text-red-400 text-xs">{titleError}</span> : <span />}
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
              className="w-full bg-[#0a1628] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors resize-none"
              disabled={loading}
            />
            <div className="text-gray-600 text-xs mt-1 text-right">{description.length}/500</div>
          </div>

          {/* Token Gate — gating is enforced ZAO-side at room-join; Juke is
              public-listen by default so token-gating does not apply. */}
          {provider !== 'juke' && (
            <TokenGateSection value={gateConfig} onChange={setGateConfig} disabled={loading} />
          )}

          {/* Audio Provider */}
          <div className="mb-5">
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
              Audio Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  disabled={loading}
                  aria-pressed={provider === p.id}
                  className={`flex flex-col gap-1 px-3 py-3 rounded-xl border text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] ${
                    provider === p.id
                      ? 'border-[#f5a623] bg-[#f5a623]/10 text-white'
                      : 'border-white/[0.08] bg-[#0a1628] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-wider text-[#f5a623]">
                    {p.badge}
                  </span>
                  <span className="font-semibold text-white">{p.label}</span>
                  <span className="text-xs text-gray-500 leading-tight">{p.description}</span>
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-1.5">
              {provider === 'stream'
                ? 'Best for music rooms - HiFi stereo, native multistream.'
                : provider === '100ms'
                  ? 'Best for fractal meetings - live transcription included.'
                  : 'Best for public Farcaster events - lands on /live/{id} with the Juke iframe.'}
            </p>
          </div>

          {/* Broadcast info — Juke owns its own distribution (Farcaster) and
              has no ZAO-side multistream surface. */}
          {provider !== 'juke' ? (
            <div className="mb-6">
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
                Multistream
              </label>
              <p className="text-gray-500 text-xs leading-relaxed">
                After creating, use the <span className="text-[#f5a623]">Broadcast</span> button in
                the room controls to stream to Twitch, YouTube, Kick, or Facebook. Connect your
                accounts in Settings first.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
                  Juke options
                </label>
                <div className="space-y-2">
                  <JukeToggle
                    id="juke-record"
                    label="Record the space"
                    hint="Drops a Juke recording into /live/recordings + auto-casts the listen-back."
                    checked={jukeRecord}
                    disabled={loading}
                    onChange={setJukeRecord}
                  />
                  <JukeToggle
                    id="juke-allow-agents"
                    label="Allow agents (ZOE)"
                    hint="Lets ZOE join silently for note-taking. Activated when ZAO_AUTO_AGENT_JOIN flips on."
                    checked={jukeAllowAgents}
                    disabled={loading}
                    onChange={setJukeAllowAgents}
                  />
                  <JukeToggle
                    id="juke-announce-cast"
                    label="Announce on Farcaster"
                    hint="Asks Juke to post a kickoff cast when the space opens."
                    checked={jukeAnnounceCast}
                    disabled={loading}
                    onChange={setJukeAnnounceCast}
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
                  Juke notes
                </label>
                <p className="text-gray-500 text-xs leading-relaxed">
                  The room lives on Juke. After creating you land on{' '}
                  <span className="text-[#f5a623]">/live/&#123;id&#125;</span> with the keyless
                  iframe. Listening is anonymous; speaking prompts Sign In With Farcaster inside the
                  embed. To create from a non-admin account use{' '}
                  <span className="text-[#f5a623]">/live/create</span> with the team password.
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800/50 text-gray-300 rounded-xl text-sm hover:bg-gray-800 transition-colors border border-white/[0.08]"
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
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : provider === 'juke' ? (
                'Open Juke space'
              ) : roomMode === 'voice_channel' ? (
                'Start Video Room'
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

/**
 * Compact toggle row for the Juke options block. Visual style matches the
 * surrounding modal (border + bg + gold accent on checked).
 */
function JukeToggle({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
        checked
          ? 'border-[#f5a623]/40 bg-[#f5a623]/[0.06]'
          : 'border-white/[0.08] bg-[#0a1628] hover:border-white/[0.12]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#0d1b2a] text-[#f5a623] focus:ring-[#f5a623] focus:ring-offset-0"
      />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">{hint}</span>
      </span>
    </label>
  );
}
