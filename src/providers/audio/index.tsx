'use client';

import type { ReactNode } from 'react';
import { AppleMusicProvider } from './AppleMusicProvider';
import { BandcampProvider } from './BandcampProvider';
import { HTMLAudioProvider } from './HTMLAudioProvider';
import { PlayerProvider } from './PlayerProvider';
import { SoundcloudProvider } from './SoundcloudProvider';
import { SpotifyProvider } from './SpotifyProvider';
import { TidalProvider } from './TidalProvider';
import { YoutubeProvider } from './YoutubeProvider';

export type { RepeatMode } from './PlayerProvider';
export { PlayerProvider, usePlayer, usePlayerContext } from './PlayerProvider';

export function AudioProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <HTMLAudioProvider>
        <SoundcloudProvider>
          <YoutubeProvider>
            <SpotifyProvider>
              <TidalProvider>
                <BandcampProvider>
                  <AppleMusicProvider>{children}</AppleMusicProvider>
                </BandcampProvider>
              </TidalProvider>
            </SpotifyProvider>
          </YoutubeProvider>
        </SoundcloudProvider>
      </HTMLAudioProvider>
    </PlayerProvider>
  );
}
