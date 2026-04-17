'use client';

import { useRouter } from 'next/navigation';

interface DockProps {
  onOpenDrawer: () => void;
}

const DOCK_ITEMS = [
  { id: 'chat', icon: '💬', label: 'Chat', route: '/chat' },
  { id: 'music', icon: '🎵', label: 'Music', route: '/music' },
  { id: 'messages', icon: '✉️', label: 'DMs', route: '/messages' },
  { id: 'spaces', icon: '🎙️', label: 'Spaces', route: '/calls' },
];

export function Dock({ onOpenDrawer }: DockProps) {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-[#0a1628]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {DOCK_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => router.push(item.route)}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors active:bg-white/10"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] text-white/50">{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors active:bg-white/10"
        >
          <span className="text-xl">⊞</span>
          <span className="text-[10px] text-white/50">Apps</span>
        </button>
      </div>
      {/* Home indicator */}
      <div className="flex justify-center pb-1">
        <div className="h-1 w-28 rounded-full bg-white/15" />
      </div>
    </div>
  );
}
