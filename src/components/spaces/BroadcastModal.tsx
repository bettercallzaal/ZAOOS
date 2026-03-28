'use client';

import { useState } from 'react';

interface BroadcastTarget {
  id: string;
  platform: 'youtube' | 'twitch' | 'custom';
  name: string;
  rtmpUrl: string;
  streamKey: string;
}

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBroadcast: (targets: BroadcastTarget[]) => Promise<void>;
  onStopBroadcast: () => Promise<void>;
  isBroadcasting: boolean;
}

const PLATFORM_PRESETS = {
  youtube: { name: 'YouTube Live', rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2', icon: '📺', color: 'text-red-400' },
  twitch: { name: 'Twitch', rtmpUrl: 'rtmp://live.twitch.tv/app', icon: '🟣', color: 'text-purple-400' },
  custom: { name: 'Custom RTMP', rtmpUrl: '', icon: '📡', color: 'text-gray-400' },
};

export function BroadcastModal({ isOpen, onClose, onStartBroadcast, onStopBroadcast, isBroadcasting }: BroadcastModalProps) {
  const [targets, setTargets] = useState<BroadcastTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const addTarget = (platform: 'youtube' | 'twitch' | 'custom') => {
    const preset = PLATFORM_PRESETS[platform];
    setTargets([...targets, {
      id: `${platform}-${Date.now()}`,
      platform,
      name: preset.name,
      rtmpUrl: preset.rtmpUrl,
      streamKey: '',
    }]);
  };

  const removeTarget = (id: string) => {
    setTargets(targets.filter(t => t.id !== id));
  };

  const updateTarget = (id: string, field: 'rtmpUrl' | 'streamKey', value: string) => {
    setTargets(targets.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleStart = async () => {
    const valid = targets.filter(t => t.streamKey.trim());
    if (valid.length === 0) {
      setError('Add at least one destination with a stream key');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onStartBroadcast(valid);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0d1b2a] border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
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
            {/* Add destination buttons */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">Add Destination</label>
              <div className="flex gap-2">
                {(Object.keys(PLATFORM_PRESETS) as Array<keyof typeof PLATFORM_PRESETS>).map((platform) => {
                  const preset = PLATFORM_PRESETS[platform];
                  return (
                    <button
                      key={platform}
                      onClick={() => addTarget(platform)}
                      disabled={targets.length >= 3}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2a3a] border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-[#f5a623]/50 transition-colors disabled:opacity-40"
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-gray-600 text-xs mt-1">Up to 3 destinations</p>
            </div>

            {/* Target list */}
            {targets.map((target) => {
              const preset = PLATFORM_PRESETS[target.platform];
              return (
                <div key={target.id} className="bg-[#0a1628] border border-gray-700 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-medium text-sm ${preset.color}`}>
                      {preset.icon} {preset.name}
                    </span>
                    <button
                      onClick={() => removeTarget(target.id)}
                      className="text-gray-500 hover:text-red-400 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  {target.platform === 'custom' && (
                    <input
                      type="text"
                      value={target.rtmpUrl}
                      onChange={(e) => updateTarget(target.id, 'rtmpUrl', e.target.value)}
                      placeholder="rtmp://your-server/live"
                      className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:border-[#f5a623] focus:outline-none"
                    />
                  )}
                  <input
                    type="password"
                    value={target.streamKey}
                    onChange={(e) => updateTarget(target.id, 'streamKey', e.target.value)}
                    placeholder="Stream key"
                    className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#f5a623] focus:outline-none"
                  />
                </div>
              );
            })}

            {targets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-2xl mb-2">📡</p>
                <p className="text-sm">Add a destination to start broadcasting</p>
                <p className="text-xs mt-1">Your room audio will stream to YouTube, Twitch, or any RTMP endpoint</p>
              </div>
            )}
          </>
        )}

        {isBroadcasting && (
          <div className="text-center py-4">
            <p className="text-green-400 text-sm mb-2">Broadcasting to {targets.length} destination{targets.length !== 1 ? 's' : ''}</p>
            {targets.map(t => (
              <div key={t.id} className="text-gray-400 text-xs">{PLATFORM_PRESETS[t.platform].icon} {PLATFORM_PRESETS[t.platform].name}</div>
            ))}
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
              disabled={loading || targets.length === 0}
              className="flex-1 px-4 py-2.5 bg-[#f5a623] text-[#0a1628] rounded-lg text-sm font-semibold hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Go Live'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type { BroadcastTarget };
