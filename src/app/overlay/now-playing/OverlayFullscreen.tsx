'use client';

import { ProgressBar } from './ProgressBar';
import { PlatformBadge } from './PlatformBadge';
import type { NowPlayingData } from './page';

interface Props {
  data: NowPlayingData;
  theme: string;
  size: string;
  transitioning: boolean;
}

export function OverlayFullscreen({ data, transitioning }: Props) {
  if (!data.playing) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 40,
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'scale(0.95)' : 'scale(1)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {data.artworkUrl && (
        <img
          src={data.artworkUrl}
          alt="Album art"
          width={300}
          height={300}
          style={{
            borderRadius: 20,
            objectFit: 'cover',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            marginBottom: 32,
          }}
        />
      )}
      <div
        style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: 32,
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: 500,
        }}
      >
        {data.trackName}
      </div>
      <div
        style={{
          color: '#9ca3af',
          fontSize: 20,
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        {data.artistName}
      </div>
      <div style={{ width: '100%', maxWidth: 400, marginTop: 24 }}>
        <ProgressBar position={data.position ?? 0} duration={data.duration ?? 0} />
      </div>
      {data.platform && (
        <div style={{ marginTop: 16 }}>
          <PlatformBadge platform={data.platform} />
        </div>
      )}
    </div>
  );
}
