'use client';

import { Suspense } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { OverlayCard } from './OverlayCard';
import { OverlayMinimal } from './OverlayMinimal';
import { OverlayBar } from './OverlayBar';
import { OverlayFullscreen } from './OverlayFullscreen';

export interface NowPlayingData {
  playing: boolean;
  trackName?: string;
  artistName?: string;
  artworkUrl?: string;
  platform?: string;
  position?: number;
  duration?: number;
  url?: string;
}

function OverlayInner() {
  const searchParams = useSearchParams();
  const fid = searchParams.get('fid');
  const style = searchParams.get('style') || 'card';
  const theme = searchParams.get('theme') || 'dark';
  const size = searchParams.get('size') || 'medium';

  const [data, setData] = useState<NowPlayingData>({ playing: false });
  const [transitioning, setTransitioning] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const fetchNowPlaying = useCallback(async () => {
    if (!fid) return;
    try {
      const res = await fetch(`/api/overlay/now-playing?fid=${fid}`);
      const json: NowPlayingData = await res.json();
      const prev = dataRef.current;

      if (json.trackName !== prev.trackName || json.playing !== prev.playing) {
        setTransitioning(true);
        setTimeout(() => {
          setData(json);
          setTransitioning(false);
        }, 300);
      } else {
        setData(json);
      }
    } catch {
      // Silently fail — overlay should never show errors
    }
  }, [fid]);

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  if (!fid) {
    return (
      <div style={{ color: '#999', padding: 20, fontFamily: 'sans-serif' }}>
        Missing ?fid= parameter
      </div>
    );
  }

  const props = { data, theme, size, transitioning };

  switch (style) {
    case 'minimal':
      return <OverlayMinimal {...props} />;
    case 'bar':
      return <OverlayBar {...props} />;
    case 'fullscreen':
      return <OverlayFullscreen {...props} />;
    default:
      return <OverlayCard {...props} />;
  }
}

export default function NowPlayingOverlay() {
  return (
    <Suspense fallback={null}>
      <OverlayInner />
    </Suspense>
  );
}
