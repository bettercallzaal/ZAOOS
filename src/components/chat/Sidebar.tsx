'use client';

import { SessionData } from '@/types';

interface SidebarProps {
  user: SessionData;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ user, isOpen, onClose, onLogout }: SidebarProps) {
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

        {/* Channel */}
        <div className="p-3">
          <div className="px-3 py-2 rounded-md bg-[#f5a623]/10 text-[#f5a623] font-medium text-sm">
            # zao
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            {user.pfpUrl ? (
              <img
                src={user.pfpUrl}
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700" />
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
