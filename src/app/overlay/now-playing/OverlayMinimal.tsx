'use client';

import { PlatformBadge } from './PlatformBadge';
import type { NowPlayingData } from './page';

interface Props {
  data: NowPlayingData;
  theme: string;
  size: string;
  transitioning: boolean;
}

export function OverlayMinimal({ data, transitioning }: Props) {
  if (!data.playing) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        background: 'rgba(10, 22, 40, 0.8)',
        borderRadius: 8,
        opacity: transitioning ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#f5a623',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
        {data.trackName}
      </span>
      <span style={{ color: '#6b7280', fontSize: 14 }}>
        {data.artistName}
      </span>
      {data.platform && <PlatformBadge platform={data.platform} />}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
