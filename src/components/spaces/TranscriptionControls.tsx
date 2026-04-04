'use client';

import { useState } from 'react';
import { HMSRoomProvider, useHMSActions, useHMSStore, selectIsPeerAudioEnabled } from '@100mslive/react-sdk';

interface TranscriptionControlsProps {
  fishbowlRoomId: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function TranscriptionControlsInner({ enabled, onToggle }: TranscriptionControlsProps) {
  const hmsActions = useHMSActions();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      if (enabled) {
        // TODO: stop HMS transcription
        onToggle(false);
      } else {
        // TODO: start HMS transcription
        onToggle(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-2.5 rounded-xl text-sm transition-colors border ${
        enabled
          ? 'bg-[#f5a623]/15 border-[#f5a623]/30 text-[#f5a623]'
          : 'bg-[#1a2a3a] text-gray-400 hover:text-white border-gray-700/50 hover:border-gray-600'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={enabled ? 'Stop live captions' : 'Start live captions & transcription'}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    </button>
  );
}

export function TranscriptionControls(props: TranscriptionControlsProps) {
  return (
    <HMSRoomProvider>
      <TranscriptionControlsInner {...props} />
    </HMSRoomProvider>
  );
}
