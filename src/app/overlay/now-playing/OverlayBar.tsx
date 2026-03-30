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

export function OverlayBar({ data, transitioning }: Props) {
  if (!data.playing) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        background: 'rgba(10, 22, 40, 0.9)',
        borderTop: '1px solid rgba(245, 166, 35, 0.3)',
        opacity: transitioning ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {data.artworkUrl && (
        <img
          src={data.artworkUrl}
          alt="Album art"
          width={48}
          height={48}
          style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: '0 1 auto', minWidth: 0 }}>
        <div
          style={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.trackName}
        </div>
        <div
          style={{
            color: '#9ca3af',
            fontSize: 12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.artistName}
        </div>
      </div>
      <div style={{ flex: 1, margin: '0 12px' }}>
        <ProgressBar position={data.position ?? 0} duration={data.duration ?? 0} />
      </div>
      {data.platform && <PlatformBadge platform={data.platform} />}
    </div>
  );
}
