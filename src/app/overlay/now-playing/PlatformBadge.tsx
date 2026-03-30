'use client';

const platformColors: Record<string, string> = {
  spotify: '#1DB954',
  audius: '#CC0FE0',
  soundcloud: '#FF5500',
  youtube: '#FF0000',
  applemusic: '#FC3C44',
  tidal: '#000',
  bandcamp: '#1DA0C3',
  soundxyz: '#000',
  audio: '#6b7280',
};

const platformLabels: Record<string, string> = {
  spotify: 'Spotify',
  audius: 'Audius',
  soundcloud: 'SoundCloud',
  youtube: 'YouTube',
  applemusic: 'Apple Music',
  tidal: 'TIDAL',
  bandcamp: 'Bandcamp',
  soundxyz: 'Sound.xyz',
  audio: 'Audio',
};

export function PlatformBadge({ platform }: { platform: string }) {
  const color = platformColors[platform] || '#6b7280';
  const label = platformLabels[platform] || platform;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        background: color,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        opacity: 0.9,
      }}
    >
      {label}
    </span>
  );
}
