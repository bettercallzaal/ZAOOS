'use client';

import { ReactNode } from 'react';
import { PlayerProvider } from './PlayerProvider';
import { HTMLAudioProvider } from './HTMLAudioProvider';
import { SoundcloudProvider } from './SoundcloudProvider';
import { YoutubeProvider } from './YoutubeProvider';
import { SpotifyProvider } from './SpotifyProvider';

export { usePlayer } from './PlayerProvider';

export function AudioProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <HTMLAudioProvider>
        <SoundcloudProvider>
          <YoutubeProvider>
            <SpotifyProvider>{children}</SpotifyProvider>
          </YoutubeProvider>
        </SoundcloudProvider>
      </HTMLAudioProvider>
    </PlayerProvider>
  );
}
