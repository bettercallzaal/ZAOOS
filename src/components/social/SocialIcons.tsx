'use client';

interface SocialIconsProps {
  x?: string | null;
  instagram?: string | null;
  soundcloud?: string | null;
  spotify?: string | null;
  audius?: string | null;
  bluesky?: string | null;
  website?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  apple_music?: string | null;
  twitch?: string | null;
  size?: 'sm' | 'md';
}

type PlatformKey = Exclude<keyof SocialIconsProps, 'size'>;

const PLATFORMS: { key: PlatformKey; label: string; abbr: string; urlFn: (v: string) => string; color: string }[] = [
  { key: 'x', label: 'X', abbr: 'X', urlFn: v => `https://x.com/${v}`, color: 'hover:bg-blue-500/20 hover:text-blue-400' },
  { key: 'instagram', label: 'Instagram', abbr: 'IG', urlFn: v => `https://instagram.com/${v}`, color: 'hover:bg-pink-500/20 hover:text-pink-400' },
  { key: 'spotify', label: 'Spotify', abbr: 'SP', urlFn: v => v.startsWith('http') ? v : `https://open.spotify.com/artist/${v}`, color: 'hover:bg-green-500/20 hover:text-green-400' },
  { key: 'soundcloud', label: 'SoundCloud', abbr: 'SC', urlFn: v => v.startsWith('http') ? v : `https://soundcloud.com/${v}`, color: 'hover:bg-orange-500/20 hover:text-orange-400' },
  { key: 'audius', label: 'Audius', abbr: 'AU', urlFn: v => `https://audius.co/${v}`, color: 'hover:bg-purple-500/20 hover:text-purple-400' },
  { key: 'youtube', label: 'YouTube', abbr: 'YT', urlFn: v => v.startsWith('http') ? v : `https://youtube.com/${v}`, color: 'hover:bg-red-500/20 hover:text-red-400' },
  { key: 'bluesky', label: 'Bluesky', abbr: 'BS', urlFn: v => `https://bsky.app/profile/${v}`, color: 'hover:bg-blue-400/20 hover:text-blue-300' },
  { key: 'tiktok', label: 'TikTok', abbr: 'TT', urlFn: v => v.startsWith('http') ? v : `https://tiktok.com/@${v}`, color: 'hover:bg-gray-500/20 hover:text-gray-300' },
  { key: 'apple_music', label: 'Apple Music', abbr: 'AM', urlFn: v => v, color: 'hover:bg-pink-400/20 hover:text-pink-300' },
  { key: 'twitch', label: 'Twitch', abbr: 'TW', urlFn: v => v.startsWith('http') ? v : `https://twitch.tv/${v}`, color: 'hover:bg-purple-400/20 hover:text-purple-300' },
  { key: 'website', label: 'Website', abbr: 'WB', urlFn: v => v.startsWith('http') ? v : `https://${v}`, color: 'hover:bg-[#f5a623]/20 hover:text-[#f5a623]' },
];

export function SocialIcons({ size = 'sm', ...props }: SocialIconsProps) {
  const iconSize = size === 'sm' ? 'w-5 h-5 text-[8px]' : 'w-6 h-6 text-[9px]';

  const active = PLATFORMS.filter(p => {
    const val = props[p.key];
    return val && typeof val === 'string' && val.length > 0;
  });

  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {active.map(p => {
        const val = props[p.key] as string;
        return (
          <a
            key={p.key}
            href={p.urlFn(val)}
            target="_blank"
            rel="noopener noreferrer"
            title={p.label}
            className={`${iconSize} rounded flex items-center justify-center bg-gray-800 text-gray-500 font-bold transition-colors ${p.color}`}
          >
            {p.abbr}
          </a>
        );
      })}
    </div>
  );
}
