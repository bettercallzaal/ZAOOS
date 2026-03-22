'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { communityConfig } from '@/../community.config';
import { GeneratePostButton } from '@/components/wavewarz/GeneratePostButton';

const { wavewarz } = communityConfig;

type ActiveView = 'battles' | 'intelligence' | 'analytics';

const VIEWS: { id: ActiveView; label: string; url: string }[] = [
  { id: 'battles', label: 'Battles', url: wavewarz.mainApp },
  { id: 'intelligence', label: 'Intelligence', url: wavewarz.intelligence },
  { id: 'analytics', label: 'Analytics', url: wavewarz.analytics },
];

export default function WaveWarzPage() {
  const [activeView, setActiveView] = useState<ActiveView>('battles');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  const currentUrl = VIEWS.find(v => v.id === activeView)!.url;

  // Reset iframe state when switching views
  useEffect(() => {
    setIframeLoaded(false);
    setIframeFailed(false);
  }, [activeView]);

  // If iframe hasn't loaded after 8 seconds, show the fallback
  useEffect(() => {
    if (iframeLoaded) return;
    const timeout = setTimeout(() => {
      if (!iframeLoaded) setIframeFailed(true);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [iframeLoaded, activeView]);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/ecosystem" className="text-gray-500 hover:text-white text-xs">
            &larr;
          </Link>
          <h2 className="font-semibold text-sm text-white">WaveWarZ</h2>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-500 hover:text-white transition-colors"
          >
            Open in tab
          </a>
          <div className="md:hidden"><NotificationBell /></div>
        </div>
      </header>

      {/* Generate WaveWarZ Post */}
      <div className="px-3 py-2 bg-[#0d1b2a] border-b border-gray-800 flex-shrink-0">
        <GeneratePostButton />
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#0d1b2a] border-b border-gray-800 flex-shrink-0">
        {VIEWS.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
              activeView === view.id
                ? 'bg-[#f5a623]/10 text-[#f5a623]'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* iframe or fallback */}
      <div className="flex-1 relative">
        {iframeFailed ? (
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center max-w-sm">
              <span className="text-4xl block mb-4">&#x2694;&#xFE0F;</span>
              <h3 className="text-lg font-semibold text-white mb-2">
                {VIEWS.find(v => v.id === activeView)!.label}
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                The embedded view isn&apos;t available here — open it directly instead.
              </p>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-[#f5a623] text-black font-semibold rounded-xl hover:bg-[#ffd700] transition-colors"
              >
                Open {VIEWS.find(v => v.id === activeView)!.label}
              </a>
            </div>
          </div>
        ) : (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a1628]">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading {VIEWS.find(v => v.id === activeView)!.label}...</p>
                </div>
              </div>
            )}
            <iframe
              key={activeView}
              src={currentUrl}
              className="w-full h-full border-0"
              style={{ minHeight: 'calc(100dvh - 92px)' }}
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeFailed(true)}
              allow="clipboard-write; clipboard-read"
              title={`WaveWarZ ${VIEWS.find(v => v.id === activeView)!.label}`}
            />
          </>
        )}
      </div>
    </div>
  );
}
