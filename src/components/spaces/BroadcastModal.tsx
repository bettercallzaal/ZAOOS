'use client';

import { useState, useEffect } from 'react';
import type { BroadcastTarget } from '@/lib/spaces/rtmpManager';

interface ModalBroadcastTarget {
  id: string;
  platform: 'youtube' | 'twitch' | 'kick' | 'facebook' | 'custom';
  name: string;
  rtmpUrl: string;
  streamKey: string;
}

interface ConnectedPlatform {
  id: string;
  platform: string;
  name: string;
  connected: boolean;
  enabled: boolean;
}

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBroadcast: (targets: BroadcastTarget[], mode: 'direct' | 'relay') => Promise<void>;
  onStopBroadcast: () => Promise<void>;
  isBroadcasting: boolean;
  roomTitle?: string;
}

const PLATFORM_META: Record<string, { icon: string; color: string; label: string }> = {
  twitch: { icon: '🟣', color: 'text-purple-400', label: 'Twitch' },
  youtube: { icon: '📺', color: 'text-red-400', label: 'YouTube' },
  kick: { icon: '🟢', color: 'text-green-400', label: 'Kick' },
  facebook: { icon: '🔵', color: 'text-blue-400', label: 'Facebook' },
  custom: { icon: '📡', color: 'text-gray-400', label: 'Custom RTMP' },
};

export function BroadcastModal({ isOpen, onClose, onStartBroadcast, onStopBroadcast, isBroadcasting, roomTitle }: BroadcastModalProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);
  const [customTargets, setCustomTargets] = useState<ModalBroadcastTarget[]>([]);
  const [mode, setMode] = useState<'direct' | 'relay'>('direct');
  const [loading, setLoading] = useState(false);
  const [fetchingPlatforms, setFetchingPlatforms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setShowCustomForm] = useState(false);

  // Fetch connected platforms when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchPlatforms = async () => {
      setFetchingPlatforms(true);
      const platforms = ['twitch', 'youtube', 'kick', 'facebook'];
      const results: ConnectedPlatform[] = [];
      const fetches = platforms.map(async (p) => {
        try {
          const res = await fetch(`/api/platforms/${p}`);
          const data = await res.json();
          if (data.connected) {
            results.push({
              id: p,
              platform: p,
              name: data.displayName || data.username || p,
              connected: true,
              enabled: false,
            });
          }
        } catch {
          // Platform not connected or fetch failed — skip
        }
      });
      await Promise.allSettled(fetches);
      setConnectedPlatforms(results);
      setFetchingPlatforms(false);
    };
    fetchPlatforms();
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePlatform = (id: string) => {
    setConnectedPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const addCustomTarget = () => {
    setCustomTargets([
      ...customTargets,
      {
        id: `custom-${Date.now()}`,
        platform: 'custom',
        name: 'Custom RTMP',
        rtmpUrl: '',
        streamKey: '',
      },
    ]);
    setShowCustomForm(true);
  };

  const removeCustomTarget = (id: string) => {
    setCustomTargets(customTargets.filter((t) => t.id !== id));
  };

  const updateCustomTarget = (id: string, field: 'rtmpUrl' | 'streamKey' | 'name', value: string) => {
    setCustomTargets((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const enabledPlatformCount =
    connectedPlatforms.filter((p) => p.enabled).length +
    customTargets.filter((t) => t.streamKey.trim()).length;

  const handleStart = async () => {
    const enabledPlatforms = connectedPlatforms.filter((p) => p.enabled).map((p) => p.platform);
    const validCustom = customTargets.filter((t) => t.streamKey.trim());

    if (enabledPlatforms.length === 0 && validCustom.length === 0) {
      setError('Enable at least one destination to broadcast');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allTargets: BroadcastTarget[] = validCustom.map((t) => ({
        platform: t.platform,
        name: t.name,
        rtmpUrl: t.rtmpUrl,
        streamKey: t.streamKey,
        status: 'connecting' as const,
      }));

      // Fetch RTMP details for connected platforms via server
      if (enabledPlatforms.length > 0) {
        const res = await fetch('/api/broadcast/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platforms: enabledPlatforms,
            roomTitle: roomTitle || 'Live Broadcast',
          }),
        });
        const data = await res.json();
        if (data.destinations) {
          for (const dest of data.destinations) {
            allTargets.push({
              platform: dest.platform,
              name: dest.name,
              rtmpUrl: dest.rtmpUrl,
              streamKey: dest.streamKey,
              status: 'connecting' as const,
            });
          }
        }
      }

      if (allTargets.length === 0) {
        setError('Could not get stream credentials for selected platforms');
        return;
      }

      await onStartBroadcast(allTargets, mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start broadcast');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await onStopBroadcast();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop broadcast');
    } finally {
      setLoading(false);
    }
  };

  // Combine for broadcasting display
  const allActivePlatforms = [
    ...connectedPlatforms.filter((p) => p.enabled),
    ...customTargets.filter((t) => t.streamKey.trim()),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Broadcast</h2>
          {isBroadcasting && (
            <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              Live
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!isBroadcasting && (
          <>
            {/* Connected Platforms Section */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block font-medium">Your Platforms</label>
              {fetchingPlatforms ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <div className="h-4 w-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-500 text-sm">Loading connected platforms...</span>
                </div>
              ) : connectedPlatforms.length > 0 ? (
                <div className="space-y-2">
                  {connectedPlatforms.map((platform) => {
                    const meta = PLATFORM_META[platform.platform] || PLATFORM_META.custom;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          platform.enabled
                            ? 'bg-[#f5a623]/10 border-[#f5a623]/40'
                            : 'bg-[#0a1628] border-white/[0.08] hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{meta.icon}</span>
                          <div className="text-left">
                            <span className={`text-sm font-medium ${meta.color}`}>
                              {meta.label}
                            </span>
                            <p className="text-gray-500 text-xs">
                              Connected as {platform.name}
                            </p>
                          </div>
                        </div>
                        {/* Toggle switch */}
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            platform.enabled ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              platform.enabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 bg-[#0a1628] rounded-lg border border-white/[0.08]">
                  <p className="text-gray-500 text-sm">No platforms connected</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Connect Twitch, YouTube, Kick, or Facebook in Settings
                  </p>
                </div>
              )}
            </div>

            {/* Custom RTMP Section */}
            <div className="mb-2">
              {customTargets.map((target) => (
                <div key={target.id} className="bg-[#0a1628] border border-white/[0.08] rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm text-gray-400">
                      {PLATFORM_META.custom.icon} Custom RTMP
                    </span>
                    <button
                      onClick={() => removeCustomTarget(target.id)}
                      className="text-gray-500 hover:text-red-400 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={target.name}
                    onChange={(e) => updateCustomTarget(target.id, 'name', e.target.value)}
                    placeholder="Destination name"
                    className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm mb-2 focus:border-[#f5a623] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={target.rtmpUrl}
                    onChange={(e) => updateCustomTarget(target.id, 'rtmpUrl', e.target.value)}
                    placeholder="rtmp://your-server/live"
                    className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm mb-2 focus:border-[#f5a623] focus:outline-none"
                  />
                  <input
                    type="password"
                    value={target.streamKey}
                    onChange={(e) => updateCustomTarget(target.id, 'streamKey', e.target.value)}
                    placeholder="Stream key"
                    className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f5a623] focus:outline-none"
                  />
                </div>
              ))}

              <button
                onClick={addCustomTarget}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-white/[0.08] rounded-lg text-sm text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors"
              >
                <span>+</span>
                <span>Add Custom RTMP</span>
              </button>
            </div>

            {/* Empty state when nothing is selected */}
            {connectedPlatforms.length === 0 && customTargets.length === 0 && !fetchingPlatforms && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-2xl mb-2">📡</p>
                <p className="text-sm">Add a destination to start broadcasting</p>
                <p className="text-xs mt-1">Your room audio will stream to connected platforms or any RTMP endpoint</p>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex gap-2 mt-4 mb-1">
              <button
                onClick={() => setMode('direct')}
                className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'direct'
                    ? 'bg-[#f5a623] text-[#0a1628]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <span>Direct</span>
                <span className={`text-[10px] font-normal ${mode === 'direct' ? 'text-[#0a1628]/70' : 'text-gray-500'}`}>Lower latency</span>
              </button>
              <button
                onClick={() => setMode('relay')}
                className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'relay'
                    ? 'bg-[#f5a623] text-[#0a1628]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <span>Relay</span>
                <span className={`text-[10px] font-normal ${mode === 'relay' ? 'text-[#0a1628]/70' : 'text-gray-500'}`}>Stable for 3+</span>
              </button>
            </div>
            {mode === 'direct' && enabledPlatformCount >= 3 && (
              <p className="text-[10px] text-amber-400 mb-3">Relay mode recommended for 3+ platforms</p>
            )}
          </>
        )}

        {isBroadcasting && (
          <div className="text-center py-4">
            <p className="text-green-400 text-sm mb-2">
              Broadcasting to {allActivePlatforms.length} destination{allActivePlatforms.length !== 1 ? 's' : ''}
            </p>
            {allActivePlatforms.map((p) => {
              const meta = PLATFORM_META[('platform' in p && typeof p.platform === 'string') ? p.platform : 'custom'];
              return (
                <div key={p.id} className="text-gray-400 text-xs">
                  {meta.icon} {meta.label}{p.name ? ` — ${p.name}` : ''}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            Close
          </button>
          {isBroadcasting ? (
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Stopping...' : 'Stop Broadcasting'}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={loading || enabledPlatformCount === 0}
              className="flex-1 px-4 py-2.5 bg-[#f5a623] text-[#0a1628] rounded-lg text-sm font-semibold hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Starting...'
                : enabledPlatformCount > 0
                  ? `Go Live on ${enabledPlatformCount}`
                  : 'Go Live'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type { BroadcastTarget };
