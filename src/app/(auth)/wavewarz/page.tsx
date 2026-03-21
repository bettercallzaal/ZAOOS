'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';

export default function WaveWarzPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/ecosystem" className="text-gray-500 hover:text-white text-xs">
            &larr;
          </Link>
          <div>
            <h2 className="font-semibold text-sm text-white">WaveWarZ</h2>
            <p className="text-[10px] text-gray-500">Music battles — trade to vote</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.wavewarz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-500 hover:text-white transition-colors"
          >
            Open in tab
          </a>
          <div className="md:hidden"><NotificationBell /></div>
        </div>
      </header>

      {/* iframe */}
      <div className="flex-1 relative">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a1628]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading WaveWarZ...</p>
            </div>
          </div>
        )}
        <iframe
          src="https://www.wavewarz.com"
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100dvh - 56px)' }}
          onLoad={() => setIframeLoaded(true)}
          allow="clipboard-write; clipboard-read"
          title="WaveWarZ Music Battles"
        />
      </div>
    </div>
  );
}
