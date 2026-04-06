'use client';

import { useState } from 'react';
import { useCallStateHooks, useCall, OwnCapability } from '@stream-io/video-react-sdk';

export function CameraButton() {
  const call = useCall();
  const { useLocalParticipant, useCameraState, useHasPermissions } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const { camera, isMute: isCameraOff } = useCameraState();
  const canSendVideo = useHasPermissions(OwnCapability.SEND_VIDEO);
  const [requesting, setRequesting] = useState(false);

  if (!localParticipant) return null;

  if (!canSendVideo) {
    return (
      <button
        onClick={async () => {
          setRequesting(true);
          try {
            await call?.requestPermissions({ permissions: [OwnCapability.SEND_VIDEO] });
          } catch {
            setRequesting(false);
          }
        }}
        disabled={requesting}
        className="px-4 py-2.5 bg-[#1a2a3a] text-gray-300 border border-white/[0.08] rounded-xl text-sm transition-colors hover:text-white disabled:opacity-50"
      >
        {requesting ? 'Requesting...' : 'Camera'}
      </button>
    );
  }

  return (
    <button
      onClick={() => camera.toggle()}
      className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5 ${
        isCameraOff
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          : 'bg-blue-600 text-white hover:bg-blue-500'
      }`}
    >
      <CameraIcon on={!isCameraOff} />
      {isCameraOff ? 'Camera' : 'Camera On'}
    </button>
  );
}

function CameraIcon({ on }: { on: boolean }) {
  if (on) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8" />
      <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
