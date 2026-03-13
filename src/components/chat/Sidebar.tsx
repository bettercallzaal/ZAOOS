'use client';

import Image from 'next/image';
import { SessionData } from '@/types';

const CHANNELS = [
  { id: 'zao', label: '# zao' },
  { id: 'zabal', label: '# zabal' },
  { id: 'coc', label: '# coc' },
];

interface SidebarProps {
  user: SessionData;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  activeChannel: string;
  onChannelSelect: (channel: string) => void;
}

export function Sidebar({ user, isOpen, onClose, onLogout, activeChannel, onChannelSelect }: SidebarProps) {
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

        {/* Pages */}
        <div className="px-3 mt-2 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Pages</p>
          <a href="/respect" className="block px-3 py-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
            Respect
          </a>
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
