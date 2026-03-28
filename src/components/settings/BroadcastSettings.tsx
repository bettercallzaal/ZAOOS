'use client';

import { useState, useEffect } from 'react';

interface SavedTarget {
  id: string;
  platform: string;
  name: string;
  rtmp_url: string;
  stream_key: string;
  provider: string;
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube Live', icon: '📺' },
  { value: 'twitch', label: 'Twitch', icon: '🟣' },
  { value: 'tiktok', label: 'TikTok Live', icon: '🎵' },
  { value: 'facebook', label: 'Facebook Live', icon: '📘' },
  { value: 'kick', label: 'Kick', icon: '🟢' },
  { value: 'custom', label: 'Custom RTMP', icon: '📡' },
];

const RTMP_PRESETS: Record<string, string> = {
  youtube: 'rtmp://a.rtmp.youtube.com/live2',
  twitch: 'rtmp://live.twitch.tv/app',
  tiktok: 'rtmp://push.tiktok.com/live/',
  facebook: 'rtmps://live-api-s.facebook.com:443/rtmp/',
  kick: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app/',
};

export function BroadcastSettings() {
  const [targets, setTargets] = useState<SavedTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState('youtube');
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    fetch('/api/broadcast/targets')
      .then(r => r.json())
      .then(d => { setTargets(d.targets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/broadcast/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: newPlatform,
          name: newName || PLATFORMS.find(p => p.value === newPlatform)?.label || newPlatform,
          rtmpUrl: newPlatform === 'custom' ? newUrl : (RTMP_PRESETS[newPlatform] || ''),
          streamKey: newKey,
        }),
      });
      const data = await res.json();
      if (data.target) {
        setTargets([data.target, ...targets]);
        setNewKey('');
        setNewName('');
        setNewUrl('');
      }
    } catch (err) {
      console.error('Failed to add target:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/broadcast/targets?id=${id}`, { method: 'DELETE' });
    setTargets(targets.filter(t => t.id !== id));
  };

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-6">
      <h3 className="text-white text-lg font-semibold mb-1">Broadcast Destinations</h3>
      <p className="text-gray-500 text-sm mb-4">Save your stream keys so you can go live with one click</p>

      {/* Add new target */}
      <div className="bg-[#0a1628] border border-gray-700 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Platform</label>
            <select
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#f5a623] focus:outline-none"
            >
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Display Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My YouTube Channel"
              className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#f5a623] focus:outline-none"
            />
          </div>
        </div>
        {newPlatform === 'custom' && (
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">RTMP URL</label>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="rtmp://your-server/live"
              className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#f5a623] focus:outline-none"
            />
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Stream key"
            className="flex-1 bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#f5a623] focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!newKey.trim() || adding}
            className="px-4 py-2 bg-[#f5a623] text-[#0a1628] rounded-lg text-sm font-semibold hover:bg-[#ffd700] transition-colors disabled:opacity-50"
          >
            {adding ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Saved targets */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-14 bg-[#0a1628] rounded-lg animate-pulse" />)}
        </div>
      ) : targets.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No saved destinations yet</p>
      ) : (
        <div className="space-y-2">
          {targets.map(target => {
            const platform = PLATFORMS.find(p => p.value === target.platform);
            return (
              <div key={target.id} className="flex items-center justify-between bg-[#0a1628] border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{platform?.icon || '📡'}</span>
                  <div>
                    <div className="text-white text-sm font-medium">{target.name}</div>
                    <div className="text-gray-500 text-xs">{platform?.label || target.platform} · ••••{target.stream_key.slice(-4)}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(target.id)}
                  className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
