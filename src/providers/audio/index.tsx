'use client';

import { ReactNode } from 'react';
import { PlayerProvider } from './PlayerProvider';
import { HTMLAudioProvider } from './HTMLAudioProvider';
import { SoundcloudProvider } from './SoundcloudProvider';
import { YoutubeProvider } from './YoutubeProvider';
import { SpotifyProvider } from './SpotifyProvider';
import { TidalProvider } from './TidalProvider';
import { BandcampProvider } from './BandcampProvider';
import { AppleMusicProvider } from './AppleMusicProvider';

export { usePlayer } from './PlayerProvider';
export type { RepeatMode } from './PlayerProvider';

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
