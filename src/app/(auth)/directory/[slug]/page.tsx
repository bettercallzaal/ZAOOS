'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { SocialIcons } from '@/components/social/SocialIcons';

interface ProfileData {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  thumbnail_url: string | null;
  biography: string | null;
  category: string;
  is_featured: boolean;
  is_notable: boolean;
  tags: string[];
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  tiktok: string | null;
  spotify: string | null;
  youtube: string | null;
  apple_music: string | null;
  amazon_music: string | null;
  youtube_music: string | null;
  twitch: string | null;
  soundcloud: string | null;
  audius: string | null;
  farcaster_username: string | null;
  bluesky: string | null;
}

interface ProfileResponse {
  profile: ProfileData;
  wavewarzStats: { wins: number; losses: number; total_volume_sol: number } | null;
}

export default function DirectoryProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/directory/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Member not found</p>
        <Link href="/directory" className="text-[#f5a623] text-sm hover:underline">Back to Directory</Link>
      </div>
    </div>
  );

  const { profile: p, wavewarzStats } = data;

  const socialLinks: { label: string; url: string; color: string }[] = [
    p.website && { label: 'Website', url: p.website.startsWith('http') ? p.website : `https://${p.website}`, color: 'text-[#f5a623]' },
    p.twitter && { label: 'X', url: `https://x.com/${p.twitter}`, color: 'text-blue-400' },
    p.instagram && { label: 'Instagram', url: `https://instagram.com/${p.instagram}`, color: 'text-pink-400' },
    p.spotify && { label: 'Spotify', url: p.spotify, color: 'text-green-400' },
    p.soundcloud && { label: 'SoundCloud', url: p.soundcloud, color: 'text-orange-400' },
    p.youtube && { label: 'YouTube', url: p.youtube, color: 'text-red-400' },
    p.audius && { label: 'Audius', url: `https://audius.co/${p.audius}`, color: 'text-purple-400' },
    p.apple_music && { label: 'Apple Music', url: p.apple_music, color: 'text-pink-300' },
    p.amazon_music && { label: 'Amazon Music', url: p.amazon_music, color: 'text-cyan-400' },
    p.youtube_music && { label: 'YouTube Music', url: p.youtube_music, color: 'text-red-300' },
    p.tiktok && { label: 'TikTok', url: p.tiktok, color: 'text-gray-300' },
    p.twitch && { label: 'Twitch', url: p.twitch, color: 'text-purple-300' },
    p.farcaster_username && { label: 'Farcaster', url: `https://warpcast.com/${p.farcaster_username}`, color: 'text-purple-400' },
    p.bluesky && { label: 'Bluesky', url: `https://bsky.app/profile/${p.bluesky}`, color: 'text-blue-300' },
  ].filter(Boolean) as { label: string; url: string; color: string }[];

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="flex items-center gap-3">
          <Link href="/directory" className="text-gray-500 hover:text-white text-xs">&larr;</Link>
          <h2 className="font-semibold text-sm">{p.name}</h2>
        </div>
        <div className="md:hidden"><NotificationBell /></div>
      </header>

      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-gray-800 to-gray-900">
        {p.cover_image_url && (
          <Image src={p.cover_image_url} alt={p.name} fill className="object-cover" unoptimized />
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 relative pb-8">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-[#0a1628] overflow-hidden bg-gray-700 flex-shrink-0">
            {p.thumbnail_url ? (
              <Image src={p.thumbnail_url} alt={p.name} width={96} height={96} className="object-cover w-full h-full" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                {p.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="pb-2">
            <h1 className="text-2xl font-bold text-white">{p.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-[#f5a623]/10 text-[#f5a623] capitalize">{p.category}</span>
              {p.is_featured && <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-yellow-500/10 text-yellow-400">Featured</span>}
              {p.is_notable && <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-purple-500/10 text-purple-400">Notable</span>}
              {p.tags?.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-700 text-gray-400">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {p.biography && (
          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 mb-4">
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{p.biography}</p>
          </div>
        )}

        {wavewarzStats && (
          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">WaveWarZ Stats</p>
            <div className="flex gap-6">
              <div>
                <p className="text-lg font-bold text-white">{wavewarzStats.wins}W-{wavewarzStats.losses}L</p>
                <p className="text-[10px] text-gray-500">Record</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{Number(wavewarzStats.total_volume_sol).toFixed(2)}</p>
                <p className="text-[10px] text-gray-500">SOL Volume</p>
              </div>
            </div>
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Socials</p>
            <div className="mb-3">
              <SocialIcons
                x={p.twitter}
                instagram={p.instagram}
                spotify={p.spotify}
                soundcloud={p.soundcloud}
                audius={p.audius}
                youtube={p.youtube}
                bluesky={p.bluesky}
                website={p.website}
                tiktok={p.tiktok}
                apple_music={p.apple_music}
                twitch={p.twitch}
                size="md"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.map(s => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a1628] hover:bg-gray-800 transition-colors ${s.color}`}
                >
                  <span className="text-xs font-medium">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
