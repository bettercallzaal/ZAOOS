'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PageHeader } from '@/components/navigation/PageHeader';

const JitsiRoom = dynamic(
  () => import('@/components/calls/JitsiRoom').then((mod) => mod.JitsiRoom),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-64 text-gray-400">Loading call room...</div> }
);

interface Room {
  id: string;
  label: string;
  description: string;
  audioOnly: boolean;
}

const PRESET_ROOMS: Room[] = [
  { id: 'fractal-call', label: 'Fractal Call', description: 'Weekly governance and coordination call', audioOnly: true },
  { id: 'open-hangout', label: 'Open Hangout', description: 'Casual voice chat — drop in anytime', audioOnly: false },
];

function generateRoomName(slug: string): string {
  const hash = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `zao-${slug}-${hash}`;
}

type ActiveRoom = { mode: 'jitsi'; jitsiName: string; label: string; audioOnly: boolean };

export default function CallsPage() {
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [customName, setCustomName] = useState('');

  const joinRoom = useCallback((room: Room) => {
    const jitsiName = generateRoomName(room.id);
    setActiveRoom({ mode: 'jitsi', jitsiName, label: room.label, audioOnly: room.audioOnly });
  }, []);

  const joinCustomRoom = useCallback(() => {
    const name = customName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setActiveRoom({
      mode: 'jitsi',
      jitsiName: generateRoomName(slug),
      label: name,
      audioOnly: false,
    });
    setCustomName('');
  }, [customName]);

  const leaveRoom = useCallback(() => {
    setActiveRoom(null);
  }, []);

  // ── Full-screen Jitsi call view ────────────────────────────────────────────
  if (activeRoom?.mode === 'jitsi') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a1628] flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0d1b2a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-semibold text-sm text-white">{activeRoom.label}</h2>
          </div>
          <button
            onClick={leaveRoom}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Leave
          </button>
        </header>
        <div className="flex-1">
          <JitsiRoom
            roomName={activeRoom.jitsiName}
            displayName="ZAO Member"
            audioOnly={activeRoom.audioOnly}
            onClose={leaveRoom}
          />
        </div>
      </div>
    );
  }

  // ── Room list view ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      <PageHeader title="Calls" backHref="/tools" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Spaces banner */}
        <Link
          href="/spaces"
          className="flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-[#0d1b2a] border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Audio Spaces are now on /spaces</p>
              <p className="text-xs text-gray-400">DJ mode, broadcasting, room themes, and more</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        {/* Preset rooms */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Rooms</p>

          {PRESET_ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => joinRoom(room)}
              className="w-full text-left bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] hover:border-[#f5a623]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    {room.audioOnly ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    )}
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-white">{room.label}</p>
                    <p className="text-xs text-gray-500">{room.description}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#f5a623] px-2 py-1 rounded-md bg-[#f5a623]/10">
                  Join
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom room */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Create a Room</p>
          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] space-y-3">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') joinCustomRoom(); }}
              placeholder="Room name..."
              maxLength={60}
              className="w-full bg-[#0a1628] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
            />
            <button
              onClick={joinCustomRoom}
              disabled={!customName.trim()}
              className="w-full py-2 text-sm font-medium rounded-lg bg-[#f5a623] text-[#0a1628] hover:bg-[#f5a623]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create &amp; Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
