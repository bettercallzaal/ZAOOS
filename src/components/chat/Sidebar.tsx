'use client';

import Image from 'next/image';
import { SessionData } from '@/types';

const CHANNELS = [
  { id: 'zao', label: '# zao' },
  { id: 'zabal', label: '# zabal' },
  { id: 'cocconcertz', label: '# cocconcertz' },
];

interface SidebarProps {
  user: SessionData;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  activeChannel: string;
  onChannelSelect: (channel: string) => void;
  onOpenFaq?: () => void;
  onOpenTutorial?: () => void;
}

export function Sidebar({ user, isOpen, onClose, onLogout, activeChannel, onChannelSelect, onOpenFaq, onOpenTutorial }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0d1b2a] border-r border-gray-800 z-50
          flex flex-col transition-transform duration-200
          md:translate-x-0 md:static md:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-[#f5a623] tracking-wide">THE ZAO</h1>
          <p className="text-xs text-gray-500 mt-1">Community on Farcaster</p>
        </div>

        {/* Channels */}
        <div className="p-3 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Channels</p>
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onChannelSelect(ch.id)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activeChannel === ch.id
                  ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="px-3 mt-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Messages</p>
          <a href="/messages" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Private DMs & Groups
          </a>
        </div>

        {/* Pages */}
        <div className="px-3 mt-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Pages</p>
          <a href="/social" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Followers & Following
          </a>
          <a href="/respect" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            Respect
          </a>
        </div>

        {/* Help */}
        <div className="px-3 mt-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Help</p>
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
            Getting Started
          </button>
          <button
            onClick={onOpenFaq}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            FAQ
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            {user.pfpUrl ? (
              <div className="w-8 h-8 relative flex-shrink-0">
                <Image
                  src={user.pfpUrl}
                  alt={user.displayName}
                  fill
                  className="rounded-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
              <p className="text-xs text-gray-400 truncate">@{user.username}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {user.isAdmin && (
              <a
                href="/admin"
                className="text-xs text-[#f5a623] hover:underline"
              >
                Admin
              </a>
            )}
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-white ml-auto"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
