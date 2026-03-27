'use client';

import { MicButton } from './MicButton';
import { LiveButton } from './LiveButton';

export function ControlsPanel({ isHost }: { isHost: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4 px-6 py-4">
      <MicButton />
      {isHost && <LiveButton />}
    </div>
  );
}
