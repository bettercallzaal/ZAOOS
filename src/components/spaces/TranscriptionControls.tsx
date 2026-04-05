'use client';

interface TranscriptionControlsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  loading?: boolean;
}

/**
 * Simple transcription toggle button.
 * Must be rendered inside an existing HMSRoomProvider context (e.g. HMSFishbowlRoom).
 */
export function TranscriptionControls({ enabled, onToggle, loading }: TranscriptionControlsProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      disabled={loading}
      className={`p-2.5 rounded-xl text-sm transition-colors border ${
        enabled
          ? 'bg-[#f5a623]/15 border-[#f5a623]/30 text-[#f5a623]'
          : 'bg-[#1a2a3a] text-[#a0aec0] hover:text-[#ededed] border-white/[0.08] hover:border-white/[0.15]'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={enabled ? 'Stop live captions' : 'Start live captions & transcription'}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    </button>
  );
}
