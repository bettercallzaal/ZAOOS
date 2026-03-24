'use client';

import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';

const SONGJAM_URL = 'https://www.songjam.space/zabal';

export default function SpacesPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-gray-300">Spaces</h2>
            <span className="text-[10px] text-gray-600">powered by SongJam</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={SONGJAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] transition-colors"
            >
              Open in new tab
            </a>
            <div className="md:hidden"><NotificationBell /></div>
            <Link href="/home" className="text-xs text-gray-500 hover:text-white md:hidden">Back</Link>
          </div>
        </div>
      </header>

      <div className="flex-1 relative pb-14 min-h-[400px]">
        <iframe
          src={SONGJAM_URL}
          title="SongJam — ZABAL Audio Spaces"
          className="absolute inset-0 w-full h-full border-0"
          allow="microphone; camera; clipboard-write; autoplay"
          loading="lazy"
        />
      </div>
    </div>
  );
}
