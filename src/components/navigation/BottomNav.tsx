'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { communityConfig } from '@/../community.config';
import { usePlayer } from '@/providers/audio';
import { NotificationBell } from './NotificationBell';

// Primary tabs shown in the bottom bar
const PRIMARY_TABS = [
  {
    id: 'home',
    label: 'Home',
    href: '/home',
    matchPaths: ['/home'],
    icon: (
      <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'Chat',
    href: '/chat',
    matchPaths: ['/chat', '/messages'],
    icon: (
      <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    id: 'music',
    label: 'Music',
    href: '/music',
    matchPaths: ['/music'],
    icon: (
      <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5A2.25 2.25 0 0016.5 2.25h0A2.25 2.25 0 0019.5 4.5v0M9 9v10.114" />
      </svg>
    ),
  },
  {
    id: 'governance',
    label: 'Governance',
    href: '/fractals',
    matchPaths: ['/fractals', '/governance', '/respect'],
    icon: (
      <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
] as const;

// Secondary pages shown in the "More" dropdown/sheet
const MORE_ITEMS = [
  { label: 'Social', href: '/social', icon: '👥' },
  { label: 'Ecosystem', href: '/ecosystem', icon: '🌐' },
  { label: 'Calls', href: '/calls', icon: '📞' },
  { label: 'WaveWarZ', href: '/wavewarz', icon: '⚔️' },
  { label: 'Tools', href: '/tools', icon: '🔧' },
  { label: 'Contribute', href: '/contribute', icon: '💻' },
  { label: 'Directory', href: '/directory', icon: '📖' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
] as const;

const MORE_MATCH_PATHS = ['/ecosystem', '/tools', '/contribute', '/settings', '/social', '/wavewarz', '/directory', '/calls'];

export function BottomNav() {
  const pathname = usePathname();
  const player = usePlayer();
  const isPlaying = player.isPlaying || player.isLoading;
  const [moreOpen, setMoreOpen] = useState(false);

  const activeTab = PRIMARY_TABS.find((tab) =>
    tab.matchPaths.some((p) => pathname.startsWith(p))
  )?.id || (MORE_MATCH_PATHS.some((p) => pathname.startsWith(p)) ? 'more' : 'home');

  return (
    <>
      {/* Desktop: top tab bar with all items visible */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-[#0d1b2a] border-b border-gray-800">
        <div className="flex items-center h-10 px-4 max-w-6xl mx-auto">
          <span
            className="text-sm font-bold mr-6 tracking-wide"
            style={{ color: communityConfig.colors.primary }}
          >
            {communityConfig.name}
          </span>
          <div className="flex items-center gap-1 flex-1">
            {PRIMARY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                  style={isActive ? { color: communityConfig.colors.primary } : undefined}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </Link>
              );
            })}
            {/* Desktop: show secondary items inline */}
            <div className="w-px h-5 bg-gray-700 mx-1" />
            {MORE_ITEMS.slice(0, 4).map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                  style={isActive ? { color: communityConfig.colors.primary } : undefined}
                >
                  <span className="text-xs">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {/* Desktop overflow dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  moreOpen ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>···</span>
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-40 bg-[#0d1b2a] border border-gray-700 rounded-xl shadow-xl py-1 min-w-[160px]">
                    {MORE_ITEMS.slice(4).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors ${
                          pathname.startsWith(item.href)
                            ? 'text-[#f5a623] bg-white/5'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Now playing indicator */}
          {isPlaying && player.metadata && (
            <div className="flex items-center gap-2 mr-2 px-2 py-1 rounded-md bg-white/5">
              <div className="flex items-end gap-px h-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-[2px] bg-[#f5a623] rounded-full animate-bounce"
                    style={{
                      height: `${4 + i * 2}px`,
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '0.6s',
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                {player.metadata.trackName}
              </span>
            </div>
          )}
          <NotificationBell />
        </div>
      </nav>

      {/* Mobile: bottom tab bar with More menu */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1b2a] border-t border-gray-800">
        {/* More menu (slides up from bottom) */}
        {moreOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMoreOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 z-50 bg-[#0d1b2a] border-t border-gray-700 rounded-t-2xl shadow-xl pb-2 animate-slide-up">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-700" />
              </div>
              <div className="grid grid-cols-4 gap-1 px-4 pb-3">
                {MORE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors ${
                      pathname.startsWith(item.href)
                        ? 'bg-[#f5a623]/10 text-[#f5a623]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-around h-14 px-2 safe-area-bottom">
          {PRIMARY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                  isActive ? '' : 'text-gray-500 active:text-gray-300'
                }`}
                style={isActive ? { color: communityConfig.colors.primary } : undefined}
              >
                {tab.icon}
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
              activeTab === 'more' || moreOpen ? '' : 'text-gray-500 active:text-gray-300'
            }`}
            style={activeTab === 'more' || moreOpen ? { color: communityConfig.colors.primary } : undefined}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25h2.25A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
