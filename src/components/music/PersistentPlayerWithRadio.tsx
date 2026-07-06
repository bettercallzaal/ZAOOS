'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueue } from '@/contexts/QueueContext';
import { useMobile } from '@/hooks/useMobile';
import { usePlayer } from '@/providers/audio';
import { useRadioContext as useRadio } from '@/providers/audio/RadioProvider';
import { PersistentPlayer } from './PersistentPlayer';

const MusicSidebar = dynamic(
  () => import('./MusicSidebar').then((m) => ({ default: m.MusicSidebar })),
  { ssr: false },
);

/**
 * Global music control wrapper rendered in (auth)/layout.tsx.
 * Connects PersistentPlayer to radio context and manages MusicSidebar state.
 * Also wires queue auto-advance when not in radio mode.
 */
export function PersistentPlayerWithRadio() {
  const radio = useRadio();
  const queue = useQueue();
  const player = usePlayer();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useMobile();

  // Auto-advance from user queue when not in radio mode
  const queuePlayNextRef = useRef(queue.playNext);
  queuePlayNextRef.current = queue.playNext;

  const handleQueueNext = useCallback(() => {
    const nextMeta = queuePlayNextRef.current();
    if (nextMeta) {
      player.play(nextMeta);
    }
  }, [player]);

  useEffect(() => {
    if (!radio.isRadioMode && queue.hasNext) {
      player.setOnEnded(handleQueueNext);
      return () => {
        player.setOnEnded(null);
      };
    }
  }, [radio.isRadioMode, queue.hasNext, player, handleQueueNext]);

  // Determine active channel from path for sidebar header
  const channelMatch = pathname.match(/^\/chat\/?(.*)/);
  const activeChannel = channelMatch?.[1] || 'zao';

  return (
    <>
      <PersistentPlayer
        onPrev={
          radio.isRadioMode
            ? radio.prevRadioTrack
            : queue.hasPrev
              ? () => {
                  const m = queue.playPrev();
                  if (m) player.play(m);
                }
              : undefined
        }
        onNext={
          radio.isRadioMode ? radio.nextRadioTrack : queue.hasNext ? handleQueueNext : undefined
        }
        isRadioMode={radio.isRadioMode}
        radioLoading={radio.radioLoading}
        onRadioStart={radio.startRadio}
        onRadioStop={radio.stopRadio}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />

      <MusicSidebar
        activeChannel={activeChannel}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
        isRadioMode={radio.isRadioMode}
        radioLoading={radio.radioLoading}
        onRadioStart={radio.startRadio}
        onRadioStop={radio.stopRadio}
        radioPlaylistName={radio.radioPlaylist?.name}
        availableStations={radio.availableStations}
        currentStationIndex={radio.currentStationIndex}
        onSwitchStation={radio.switchStation}
      />
    </>
  );
}
