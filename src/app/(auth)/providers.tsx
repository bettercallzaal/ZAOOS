'use client';

import { AudioProviders } from '@/providers/audio';
import { RadioProvider } from '@/providers/audio/RadioProvider';

/**
 * Audio + Radio providers — only loaded for authenticated routes.
 * Keeps the landing page and login flow lightweight.
 */
export function AuthAudioProviders({ children }: { children: React.ReactNode }) {
  return (
    <AudioProviders>
      <RadioProvider>{children}</RadioProvider>
    </AudioProviders>
  );
}
