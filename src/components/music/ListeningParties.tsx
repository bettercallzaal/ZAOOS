'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Party {
  id: string;
  title: string;
  description: string | null;
  host_fid: number;
  host_name: string | null;
  track_urls: string[];
  scheduled_at: string | null;
  started_at: string | null;
  state: 'scheduled' | 'live' | 'ended';
  current_track_index: number;
  participant_count: number;
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function ListeningParties() {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [trackInput, setTrackInput] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchParties = useCallback(() => {
    fetch('/api/music/listening-party')
      .then((r) => (r.ok ? r.json() : { parties: [] }))
      .then((d) => setParties(d.parties || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchParties(); }, [fetchParties]);

  const handleCreate = async () => {
    if (!title.trim() || !trackInput.trim()) return;
    setCreating(true);
    const trackUrls = trackInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'));
    if (trackUrls.length === 0) { setCreating(false); return; }

    try {
      const res = await fetch('/api/music/listening-party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), trackUrls }),
      });
      if (res.ok) {
        setTitle('');
        setTrackInput('');
        setShowForm(false);
        fetchParties();
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const liveParties = parties.filter((p) => p.state === 'live');
  const upcoming = parties.filter((p) => p.state === 'scheduled');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Listening Parties</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-medium hover:bg-[#f5a623]/90 transition-colors"
        >
          {showForm ? 'Cancel' : 'Host a Party'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-4 p-4 rounded-xl bg-white/5 border border-gray-800 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Party title..."
            maxLength={200}
            className="w-full px-3 py-2 rounded-lg bg-white/10 text-white placeholder-gray-500 text-sm border border-gray-700 focus:border-[#f5a623] focus:outline-none"
          />
          <textarea
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
            placeholder="Paste track URLs (one per line)..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/10 text-white placeholder-gray-500 text-sm border border-gray-700 focus:border-[#f5a623] focus:outline-none resize-none"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !trackInput.trim()}
            className="w-full py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold disabled:opacity-50 hover:bg-[#f5a623]/90 transition-colors"
          >
            {creating ? 'Creating...' : 'Start Party'}
          </button>
        </div>
      )}

      {loading && (
        <div className="text-gray-500 text-sm py-6 text-center">Loading parties...</div>
      )}

      {!loading && parties.length === 0 && !showForm && (
        <div className="text-gray-500 text-sm py-6 text-center">
          No listening parties yet. Be the first to host one!
        </div>
      )}

      {/* Live parties */}
      {liveParties.map((party) => (
        <div
          key={party.id}
          className="mb-3 p-4 rounded-xl bg-white/5 border border-[#f5a623]/30 hover:border-[#f5a623]/60 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold animate-pulse">
              LIVE NOW
            </span>
            <span className="text-gray-400 text-xs">
              Track {party.current_track_index + 1}/{party.track_urls.length}
            </span>
          </div>
          <h3 className="text-white font-semibold text-sm">{party.title}</h3>
          <p className="text-gray-400 text-xs mt-1">
            Hosted by {party.host_name || `FID ${party.host_fid}`}
            {party.participant_count > 0 && ` \u00b7 ${party.participant_count} listening`}
          </p>
          <button
            onClick={() => router.push(`/music?party=${party.id}`)}
            className="mt-3 w-full py-2 rounded-lg bg-[#f5a623]/20 text-[#f5a623] text-sm font-medium hover:bg-[#f5a623]/30 transition-colors"
          >
            Join Party
          </button>
        </div>
      ))}

      {/* Upcoming parties */}
      {upcoming.map((party) => (
        <div
          key={party.id}
          className="mb-3 p-4 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-sm">{party.title}</h3>
            <span className="text-[#f5a623] text-xs font-medium">
              {party.scheduled_at ? timeUntil(party.scheduled_at) : 'TBD'}
            </span>
          </div>
          {party.description && (
            <p className="text-gray-400 text-xs mb-2 line-clamp-2">{party.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Hosted by {party.host_name || `FID ${party.host_fid}`}</span>
            <span>{party.track_urls.length} tracks</span>
          </div>
        </div>
      ))}
    </div>
  );
}
