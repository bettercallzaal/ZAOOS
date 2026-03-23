'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useRadioContext as useRadio } from '@/providers/audio/RadioProvider';
import { useMobile } from '@/hooks/useMobile';
import { PersistentPlayer } from './PersistentPlayer';

const MusicSidebar = dynamic(
  () => import('./MusicSidebar').then((m) => ({ default: m.MusicSidebar })),
  { ssr: false },
);

/**
 * Global music control wrapper rendered in (auth)/layout.tsx.
 * Connects PersistentPlayer to radio context and manages MusicSidebar state.
 */
export function PersistentPlayerWithRadio() {
  const radio = useRadio();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useMobile();

  // Determine active channel from path for sidebar header
  const channelMatch = pathname.match(/^\/chat\/?(.*)/);
  const activeChannel = channelMatch?.[1] || 'zao';

  return (
    <>
      <PersistentPlayer
        onPrev={radio.isRadioMode ? radio.prevRadioTrack : undefined}
        onNext={radio.isRadioMode ? radio.nextRadioTrack : undefined}
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
