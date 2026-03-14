'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SessionData } from '@/types';
import { XMTPConversation } from '@/types/xmtp';
import type { ZaoMember } from '@/contexts/XMTPContext';

const CHANNELS = [
  { id: 'zao', label: '# zao' },
  { id: 'zabal', label: '# zabal' },
  { id: 'cocconcertz', label: '# cocconcertz' },
];

function timeAgo(date?: Date): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface SidebarProps {
  user: SessionData;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  activeChannel: string;
  onChannelSelect: (channel: string) => void;
  onOpenFaq?: () => void;
  onOpenTutorial?: () => void;
  onOpenRespect?: () => void;
  // XMTP
  xmtpConnected: boolean;
  xmtpConnecting: boolean;
  xmtpConversations: XMTPConversation[];
  activeConversationId: string | null;
  onXmtpConnect: () => void;
  onConversationSelect: (id: string) => void;
  onNewDm: () => void;
  onNewGroup: () => void;
  // ZAO members
  zaoMembers: ZaoMember[];
  loadingMembers: boolean;
  onStartDmWithMember: (member: ZaoMember) => void;
}

export function Sidebar({
  user, isOpen, onClose, onLogout, activeChannel, onChannelSelect, onOpenFaq, onOpenTutorial, onOpenRespect,
  xmtpConnected, xmtpConnecting, xmtpConversations, activeConversationId,
  onXmtpConnect, onConversationSelect, onNewDm, onNewGroup,
  zaoMembers, loadingMembers, onStartDmWithMember,
}: SidebarProps) {
  const onlineMembers = zaoMembers.filter((m) => m.reachable);
  const [onlineCollapsed, setOnlineCollapsed] = useState(false);
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

        {/* Farcaster Posts */}
        <div className="p-3 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Farcaster Posts</p>
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onChannelSelect(ch.id)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activeChannel === ch.id && !activeConversationId
                  ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Private Messages */}
        <div className="px-3 mt-4 space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Private Messages</p>
            {xmtpConnected && (
              <div className="flex gap-1">
                <button
                  onClick={onNewDm}
                  className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                  title="New DM"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                <button
                  onClick={onNewGroup}
                  className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                  title="New Group"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {!xmtpConnected ? (
            <button
              onClick={onXmtpConnect}
              disabled={xmtpConnecting}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-[#f5a623]/5 border border-[#f5a623]/20 text-sm transition-colors hover:bg-[#f5a623]/10 disabled:opacity-50"
            >
              {xmtpConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-xs text-gray-400">Setting up...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-[#f5a623] font-medium">Enable Messaging</p>
                    <p className="text-[10px] text-gray-500">Encrypted DMs & groups</p>
                  </div>
                </>
              )}
            </button>
          ) : xmtpConversations.length === 0 ? (
            <p className="px-3 text-xs text-gray-600">No conversations yet</p>
          ) : (
            <div className="space-y-0.5 max-h-60 overflow-y-auto">
              {xmtpConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onConversationSelect(conv.id)}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeConversationId === conv.id
                      ? 'bg-[#f5a623]/10 text-[#f5a623]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {conv.peerPfpUrl ? (
                    <div className="w-7 h-7 relative flex-shrink-0">
                      <Image src={conv.peerPfpUrl} alt="" fill className="rounded-full object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {conv.type === 'group' ? (
                        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
                        </svg>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {(conv.peerDisplayName || conv.name || '?')[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-medium truncate ${conv.unreadCount > 0 ? 'text-white' : ''}`}>
                        {conv.peerDisplayName || conv.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#f5a623] text-[10px] font-bold text-black flex items-center justify-center">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-gray-600">{timeAgo(conv.lastMessageAt)}</span>
                        )}
                      </div>
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-[10px] truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Online Members — only show reachable XMTP members */}
        {xmtpConnected && (
          <div className="px-3 mt-4 space-y-1">
            <button
              onClick={() => setOnlineCollapsed(!onlineCollapsed)}
              className="flex items-center justify-between px-3 mb-2 w-full text-left"
            >
              <div className="flex items-center gap-1.5">
                <svg className={`w-3 h-3 text-gray-600 transition-transform ${onlineCollapsed ? '-rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Online</p>
              </div>
              {onlineMembers.length > 0 && (
                <span className="text-[10px] text-green-400 font-medium">{onlineMembers.length}</span>
              )}
            </button>

            {onlineCollapsed ? null : loadingMembers ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-3.5 h-3.5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Checking...</span>
              </div>
            ) : onlineMembers.length === 0 ? (
              <p className="px-3 text-xs text-gray-600">No members online</p>
            ) : (
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {onlineMembers.map((member) => (
                  <button
                    key={member.fid ?? member.displayName}
                    onClick={() => onStartDmWithMember(member)}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-1.5 rounded-md transition-colors text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <div className="relative flex-shrink-0">
                      {member.pfpUrl ? (
                        <div className="w-6 h-6 relative">
                          <Image
                            src={member.pfpUrl}
                            alt={member.displayName}
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-[9px] text-gray-400 font-medium">
                            {member.displayName[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d1b2a] bg-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{member.displayName}</p>
                      {member.username && (
                        <p className="text-[10px] text-gray-500 truncate">@{member.username}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pages */}
        <div className="px-3 mt-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Pages</p>
          <a href="/social" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Followers & Following
          </a>
          <button
            onClick={() => { onOpenRespect?.(); onClose(); }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            Respect
          </button>
          {user.isAdmin && (
            <a
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-[#f5a623] hover:bg-[#f5a623]/10 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Dashboard
            </a>
          )}
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
          <div className="mt-3 flex justify-end">
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
