'use client';

interface LayoutToggleProps {
  layout: 'content-first' | 'speakers-first';
  onToggle: () => void;
}

export function LayoutToggle({ layout, onToggle }: LayoutToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      title={layout === 'content-first' ? 'Switch to speakers view' : 'Switch to content view'}
    >
      {layout === 'content-first' ? '👥' : '🖥️'}
    </button>
  );
}
