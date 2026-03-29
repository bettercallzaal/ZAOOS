'use client';

import { useState } from 'react';

interface Profile {
  x_handle: string | null;
  instagram_handle: string | null;
  soundcloud_url: string | null;
  spotify_url: string | null;
  audius_handle: string | null;
}

export function SocialsSection({ profile }: { profile: Profile }) {
  const [xHandle, setXHandle] = useState(profile.x_handle || '');
  const [instagram, setInstagram] = useState(profile.instagram_handle || '');
  const [soundcloud, setSoundcloud] = useState(profile.soundcloud_url || '');
  const [spotify, setSpotify] = useState(profile.spotify_url || '');
  const [audius, setAudius] = useState(profile.audius_handle || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveSocials = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/users/socials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x_handle: xHandle || null,
          instagram_handle: instagram || null,
          soundcloud_url: soundcloud || null,
          spotify_url: spotify || null,
          audius_handle: audius || null,
        }),
      });
      if (res.ok) setSaved(true);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const fields = [
    { label: 'X (Twitter)', value: xHandle, set: setXHandle, placeholder: 'username (no @)', prefix: '@', link: xHandle ? `https://x.com/${xHandle}` : null },
    { label: 'Instagram', value: instagram, set: setInstagram, placeholder: 'username', prefix: '@', link: instagram ? `https://instagram.com/${instagram}` : null },
    { label: 'SoundCloud', value: soundcloud, set: setSoundcloud, placeholder: 'https://soundcloud.com/...', prefix: null, link: soundcloud || null },
    { label: 'Spotify', value: spotify, set: setSpotify, placeholder: 'https://open.spotify.com/artist/...', prefix: null, link: spotify || null },
    { label: 'Audius', value: audius, set: setAudius, placeholder: 'username', prefix: '@', link: audius ? `https://audius.co/${audius}` : null },
  ];

  const connectedCount = fields.filter(f => !!f.value).length;

  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Socials</p>
        <span className="text-[10px] text-gray-600">{connectedCount} of {fields.length} linked</span>
      </div>
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 space-y-3">
        {profile.x_handle && (
          <p className="text-[10px] text-emerald-400">X handle auto-imported from your Farcaster profile</p>
        )}
        {fields.map((f) => (
          <div key={f.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">{f.label}</label>
              {f.link && (
                <a href={f.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#f5a623] hover:text-[#ffd700]">
                  View
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              {f.prefix && <span className="text-xs text-gray-600">{f.prefix}</span>}
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="flex-1 bg-[#0a1628] text-sm text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-[#f5a623] outline-none placeholder:text-gray-600"
              />
            </div>
          </div>
        ))}
        <button
          onClick={saveSocials}
          disabled={saving}
          className="w-full text-xs font-medium py-2 rounded-lg bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Socials'}
        </button>
      </div>
    </section>
  );
}
