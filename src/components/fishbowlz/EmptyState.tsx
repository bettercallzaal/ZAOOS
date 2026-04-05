'use client';

interface EmptyStateProps {
  onCreateRoom?: () => void;
}

export function EmptyState({ onCreateRoom }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Fish bowl illustration using CSS/SVG */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-[#1a2a4a] border-2 border-[#f5a623]/30 flex items-center justify-center">
          <span className="text-4xl">🐟</span>
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#f5a623]/20 flex items-center justify-center">
          <span className="text-xs">💬</span>
        </div>
        <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="text-[10px]">🎙️</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No fishbowls yet</h3>
      <p className="text-gray-400 text-sm text-center max-w-xs mb-6">
        Start a conversation! Create a fishbowl room and invite others to the hot seat.
      </p>
      {onCreateRoom && (
        <button
          onClick={onCreateRoom}
          className="bg-[#f5a623] text-[#0a1628] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#d4941f] transition-colors"
        >
          Create First Fishbowl
        </button>
      )}
    </div>
  );
}
