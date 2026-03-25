'use client';

import { AudioProviders } from '@/providers/audio';
import { RadioProvider } from '@/providers/audio/RadioProvider';
import { QueueProvider } from '@/contexts/QueueContext';

/**
 * Audio + Radio providers — only loaded for authenticated routes.
 * Keeps the landing page and login flow lightweight.
 */
export function AuthAudioProviders({ children }: { children: React.ReactNode }) {
  return (
    <AudioProviders>
      <QueueProvider>
        <RadioProvider>{children}</RadioProvider>
      </QueueProvider>
    </AudioProviders>
  );
}
