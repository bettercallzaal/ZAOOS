'use client';

interface ConnectedBannerProps {
  roomName: string;
  duration: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onLeave: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ConnectedBanner({
  roomName,
  duration,
  isMuted,
  onToggleMute,
  onLeave,
}: ConnectedBannerProps) {
  return (
    <div className="md:hidden bg-[#0f2e1a] px-3 py-2 flex items-center justify-between border-b border-green-500/20">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm">🎧</span>
        <span className="text-green-300 text-xs font-medium truncate">{roomName}</span>
        <span className="text-green-400/60 text-[10px] flex-shrink-0">
          {formatDuration(duration)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <button
          onClick={onToggleMute}
          className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
            isMuted
              ? 'bg-red-500/20 text-red-400'
              : 'bg-green-500/20 text-green-400'
          }`}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button
          onClick={onLeave}
          className="text-xs px-2 py-1 rounded font-medium bg-red-500/20 text-red-400 transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
