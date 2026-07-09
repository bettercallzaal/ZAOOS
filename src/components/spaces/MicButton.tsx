'use client';

import { OwnCapability, useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useState } from 'react';

export function MicButton() {
  const call = useCall();
  const { useLocalParticipant, useMicrophoneState, useHasPermissions } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const { microphone, isMute } = useMicrophoneState();
  const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);
  const [requesting, setRequesting] = useState(false);

  if (!localParticipant) return null;

  if (!canSendAudio) {
    return (
      <button
        onClick={async () => {
          setRequesting(true);
          try {
            await call?.requestPermissions({ permissions: [OwnCapability.SEND_AUDIO] });
          } catch {
            setRequesting(false);
          }
        }}
        disabled={requesting}
        aria-label={requesting ? 'Requesting permission to speak' : 'Request to speak'}
        className="px-6 py-2.5 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628]"
      >
        {requesting ? 'Requesting...' : 'Request to Speak'}
      </button>
    );
  }

  return (
    <button
      onClick={() => microphone.toggle()}
      aria-pressed={!isMute}
      aria-label={isMute ? 'Unmute microphone (Space)' : 'Mute microphone (Space)'}
      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628] ${
        isMute
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          : 'bg-green-600 text-white hover:bg-green-500'
      }`}
    >
      {isMute ? 'Unmute' : 'Mute'}
    </button>
  );
}
