'use client';

import { useRef, useEffect, useState } from 'react';
import { useWavesurfer } from '@wavesurfer/react';

interface WaveformPlayerProps {
  url: string;
  isPlaying: boolean;
  progress: number;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  onSeek?: (position: number) => void;
}

export default function WaveformPlayer(props: WaveformPlayerProps) {
  const { url, progress, height = 32, waveColor = '#4a5568', progressColor = '#f5a623', onSeek } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const seekingRef = useRef(false);

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    url,
    height,
    waveColor,
    progressColor,
    barWidth: 2,
    barGap: 1,
    barRadius: 1,
    cursorWidth: 0,
    interact: true,
    normalize: true,
    backend: 'WebAudio',
  });

  // Mute wavesurfer — playback is handled by the app's audio system
  useEffect(() => {
    if (wavesurfer) wavesurfer.setVolume(0);
  }, [wavesurfer]);

  // Mark ready once decoded
  useEffect(() => {
    if (!wavesurfer) return;

    const onReady = () => setIsReady(true);
    wavesurfer.on('ready', onReady);

    return () => {
      wavesurfer.un('ready', onReady);
    };
  }, [wavesurfer]);

  // Sync visual progress from external player (skip if user is seeking)
  useEffect(() => {
    if (!wavesurfer || !isReady || seekingRef.current) return;
    const duration = wavesurfer.getDuration();
    if (duration > 0) {
      wavesurfer.setTime(progress * duration);
    }
  }, [wavesurfer, isReady, progress]);

  // Handle user click-to-seek
  useEffect(() => {
    if (!wavesurfer || !onSeek) return;

    const handleSeeking = (currentTime: number) => {
      seekingRef.current = true;
      const duration = wavesurfer.getDuration();
      if (duration > 0) {
        onSeek(currentTime / duration);
      }
      // Reset seeking flag after a brief delay
      setTimeout(() => {
        seekingRef.current = false;
      }, 100);
    };

    wavesurfer.on('seeking', handleSeeking);
    return () => {
      wavesurfer.un('seeking', handleSeeking);
    };
  }, [wavesurfer, onSeek]);

  // Prevent wavesurfer from playing its own audio
  useEffect(() => {
    if (!wavesurfer) return;

    const preventPlay = () => {
      wavesurfer.pause();
    };

    wavesurfer.on('play', preventPlay);
    return () => {
      wavesurfer.un('play', preventPlay);
    };
  }, [wavesurfer]);

  return (
    <div className="relative w-full">
      {/* Loading placeholder */}
      {!isReady && (
        <div
          className="absolute inset-0 flex items-center"
          style={{ height }}
        >
          <div className="w-full h-1 bg-gray-700 rounded animate-pulse" />
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full transition-opacity duration-300 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
