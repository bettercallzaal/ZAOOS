'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';

export default function WaveWarzPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  // If iframe hasn't loaded after 8 seconds, show the fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!iframeLoaded) {
        setIframeFailed(true);
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, [iframeLoaded]);

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

      {/* iframe or fallback */}
      <div className="flex-1 relative">
        {iframeFailed ? (
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center max-w-sm">
              <span className="text-4xl block mb-4">&#x2694;&#xFE0F;</span>
              <h3 className="text-lg font-semibold text-white mb-2">WaveWarZ</h3>
              <p className="text-sm text-gray-400 mb-6">
                Music battles where you trade ephemeral tokens to vote for your favorite artist.
                The embedded view isn&apos;t available here — open WaveWarZ directly to start battling.
              </p>
              <a
                href="https://www.wavewarz.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-[#f5a623] text-black font-semibold rounded-xl hover:bg-[#ffd700] transition-colors"
              >
                Open WaveWarZ
              </a>
            </div>
          </div>
        ) : (
          <>
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
              onError={() => setIframeFailed(true)}
              allow="clipboard-write; clipboard-read"
              title="WaveWarZ Music Battles"
            />
          </>
        )}
      </div>
    </div>
  );
}
