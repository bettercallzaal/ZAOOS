'use client';

import { useState, useEffect, ReactNode } from 'react';
import Image from 'next/image';

type Track = { id: string; title: string; artist: string | null; artwork_url: string | null; play_count: number | null };
type Submission = { id: string; title: string | null; artist: string | null; submitted_by_username: string | null };
type Listener = { fid: number; username: string; plays: number };
type TotdWinner = { id: string; track_title: string; track_artist: string; artwork_url: string | null; selected_date: string };

type DigestData = {
  topTracks: Track[];
  newSubmissions: Submission[];
  topListeners: Listener[];
  trackOfDayWinners: TotdWinner[];
  period: 'week' | 'month';
};

function Thumb({ src, fallback }: { src: string | null; fallback: string }) {
  return src ? (
    <Image src={src || '/default-track.png'} alt="" width={40} height={40} className="w-10 h-10 rounded object-cover" unoptimized />
  ) : (
    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-gray-500 text-xs">{fallback}</div>
  );
}

function Row({ left, title, subtitle, right }: { left: ReactNode; title: string; subtitle: string; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
      {left}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{title}</p>
        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#f5a623] uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function WeeklyDigest() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/music/digest?period=${period}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const handleShare = () => {
    if (!data) return;
    const lines = [`This ${period} in ZAO music:\n`];
    if (data.topTracks.length > 0) {
      lines.push('Top tracks:');
      data.topTracks.slice(0, 5).forEach((t, i) => lines.push(`${i + 1}. ${t.title} — ${t.artist || 'Unknown'}`));
    }
    if (data.trackOfDayWinners.length > 0) lines.push(`\nTrack of the Day winners: ${data.trackOfDayWinners.length}`);
    window.open(`https://farcaster.xyz/~/compose?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">
          {period === 'week' ? 'This Week' : 'This Month'} in ZAO Music
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-white/5 p-0.5">
            {(['week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  period === p ? 'bg-[#f5a623] text-[#0a1628]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          <button
            onClick={handleShare}
            disabled={!data}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
          >
            Share to Farcaster
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded bg-white/10" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-2 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !data ? (
        <p className="text-gray-500 text-sm">Failed to load digest.</p>
      ) : (
        <div className="space-y-6">
          {data.topTracks.length > 0 && (
            <Section title="Top Tracks">
              <div className="space-y-1">
                {data.topTracks.map((t, i) => (
                  <Row
                    key={t.id}
                    left={<><span className="text-xs text-gray-500 w-5 text-right">{i + 1}</span><Thumb src={t.artwork_url} fallback="&#9835;" /></>}
                    title={t.title}
                    subtitle={t.artist || 'Unknown'}
                    right={<span className="text-xs text-gray-500">{t.play_count ?? 0} plays</span>}
                  />
                ))}
              </div>
            </Section>
          )}

          {data.newSubmissions.length > 0 && (
            <Section title="New This Week">
              <div className="space-y-1">
                {data.newSubmissions.slice(0, 8).map((s) => (
                  <Row
                    key={s.id}
                    left={<div className="w-8 h-8 rounded bg-[#f5a623]/10 flex items-center justify-center text-[#f5a623] text-xs font-bold">NEW</div>}
                    title={s.title || 'Untitled'}
                    subtitle={`${s.artist || 'Unknown'} \u00b7 by @${s.submitted_by_username || 'anon'}`}
                  />
                ))}
              </div>
            </Section>
          )}

          {data.trackOfDayWinners.length > 0 && (
            <Section title="Track of the Day Winners">
              <div className="space-y-1">
                {data.trackOfDayWinners.map((w) => (
                  <Row
                    key={w.id}
                    left={<Thumb src={w.artwork_url} fallback="&#9733;" />}
                    title={w.track_title}
                    subtitle={w.track_artist}
                    right={<span className="text-xs text-gray-500">{w.selected_date}</span>}
                  />
                ))}
              </div>
            </Section>
          )}

          {data.topListeners.length > 0 && (
            <Section title="Most Active Contributors">
              <div className="grid grid-cols-2 gap-2">
                {data.topListeners.map((l, i) => (
                  <div key={l.fid} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <span className="text-xs text-[#f5a623] font-bold w-4">{i + 1}</span>
                    <p className="text-sm text-white truncate flex-1">@{l.username}</p>
                    <span className="text-xs text-gray-400">{l.plays}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {data.topTracks.length === 0 && data.newSubmissions.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No music activity this {period} yet. Start listening!</p>
          )}
        </div>
      )}
    </div>
  );
}
