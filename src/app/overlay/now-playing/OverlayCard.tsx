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

export function OverlayCard({ data, size, transitioning }: Props) {
  if (!data.playing) return null;

  const artSize = size === 'large' ? 200 : size === 'small' ? 100 : 150;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        background: 'rgba(10, 22, 40, 0.85)',
        borderRadius: 16,
        border: '1px solid rgba(245, 166, 35, 0.3)',
        backdropFilter: 'blur(12px)',
        maxWidth: artSize + 320,
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {data.artworkUrl && (
        <img
          src={data.artworkUrl}
          alt="Album art"
          width={artSize}
          height={artSize}
          style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: size === 'large' ? 22 : 16,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.trackName}
        </div>
        <div
          style={{
            color: '#9ca3af',
            fontSize: size === 'large' ? 16 : 13,
            marginTop: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.artistName}
        </div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar position={data.position ?? 0} duration={data.duration ?? 0} />
        </div>
        {data.platform && (
          <div style={{ marginTop: 8 }}>
            <PlatformBadge platform={data.platform} />
          </div>
        )}
      </div>
    </div>
  );
}
