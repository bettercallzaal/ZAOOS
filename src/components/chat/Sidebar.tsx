'use client';

import { useState, ReactNode } from 'react';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SessionData } from '@/types';
import { XMTPConversation } from '@/types/xmtp';
import type { ZaoMember } from '@/contexts/XMTPContext';
import { communityConfig } from '@/../community.config';
import { useEscapeClose } from '@/hooks/useEscapeClose';

const CHANNELS = communityConfig.farcaster.channels.map((id) => ({ id, label: `# ${id}` }));

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

function lastSeen(isoDate: string | null): string {
  if (!isoDate) return '';
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 300) return 'Active now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Collapsible section ──────────────────────────────────────────────────────

function SidebarSection({
  title,
  badge,
  actions,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="px-3 mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 group"
      >
        <div className="flex items-center gap-1.5">
          <svg
            className={`w-2.5 h-2.5 text-gray-600 transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
          <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
            {title}
          </span>
          {badge}
        </div>
        {actions && (
          <div onClick={(e) => e.stopPropagation()} className="flex gap-1">
            {actions}
          </div>
        )}
      </button>
      {open && <div className="space-y-0.5 pb-1">{children}</div>}
    </div>
  );
}

// ── Main sidebar ─────────────────────────────────────────────────────────────

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
  xmtpConnected: boolean;
  xmtpConnecting: boolean;
  xmtpError?: string | null;
  xmtpConversations: XMTPConversation[];
  activeConversationId: string | null;
  onXmtpConnect: () => void;
  onConversationSelect: (id: string) => void;
  onNewDm: () => void;
  onNewGroup: () => void;
  zaoMembers: ZaoMember[];
  loadingMembers: boolean;
  onStartDmWithMember: (member: ZaoMember) => void;
  onGroupInfo?: (id: string) => void;
}

export function Sidebar({
  user, isOpen, onClose, onLogout, activeChannel, onChannelSelect, onOpenFaq, onOpenTutorial, onOpenRespect,
  xmtpConnected, xmtpConnecting, xmtpError, xmtpConversations, activeConversationId,
  onXmtpConnect, onConversationSelect, onNewDm, onNewGroup,
  zaoMembers, loadingMembers, onStartDmWithMember, onGroupInfo,
}: SidebarProps) {
  const onlineMembers = zaoMembers.filter((m) => m.reachable && m.lastLoginAt);
  const offlineMembers = zaoMembers.filter((m) => !m.reachable && m.username);
  const dmConversations = xmtpConversations.filter((c) => c.type === 'dm');
  const groupConversations = xmtpConversations.filter((c) => c.type === 'group');
  const dmUnread = dmConversations.reduce((n, c) => n + c.unreadCount, 0);
  const groupUnread = groupConversations.reduce((n, c) => n + c.unreadCount, 0);
  const { isConnected: hasWallet } = useAccount();
  useEscapeClose(onClose, isOpen);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0d1b2a] border-r border-gray-800 z-50
          flex flex-col transition-transform duration-200 overflow-y-auto overflow-x-hidden
          md:translate-x-0 md:static md:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <h1 className="text-xl font-bold text-[#f5a623] tracking-wide">THE ZAO</h1>
          <p className="text-xs text-gray-500 mt-1">Community on Farcaster</p>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-y-auto py-1">

          {/* ── Channels ──────────────────────────────────────────────── */}
          <SidebarSection title="Farcaster Channels">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onChannelSelect(ch.id)}
                className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeChannel === ch.id && !activeConversationId
                    ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </SidebarSection>

          {/* ── XMTP Connection State (shown before connected) ─────────── */}
          {!xmtpConnected && !xmtpConnecting && (
            <SidebarSection title="Messages">
              {xmtpError && (
                <div className="px-3 py-2 mb-1">
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <p className="text-xs text-red-400 font-medium">Connection failed</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{xmtpError}</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={onXmtpConnect}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-[#f5a623]/5 border border-[#f5a623]/20 text-sm transition-colors hover:bg-[#f5a623]/10"
              >
                <svg className="w-4 h-4 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs text-[#f5a623] font-medium">{xmtpError ? 'Retry Connection' : 'Enable Messaging'}</p>
                  <p className="text-[10px] text-gray-500">Encrypted DMs & groups</p>
                </div>
              </button>
            </SidebarSection>
          )}
          {xmtpConnecting && (
            <SidebarSection title="Messages">
              <div className="space-y-2 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-800/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="h-3 bg-gray-800/50 rounded w-24" />
                      <div className="h-2.5 bg-gray-800/30 rounded" style={{ width: `${50 + i * 12}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-3 pt-1">
                  <div className="w-3.5 h-3.5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-gray-500">Setting up encrypted inbox...</span>
                </div>
              </div>
            </SidebarSection>
          )}
          {xmtpConnected && xmtpError && (
            <SidebarSection title="Messages">
              <div className="px-3 py-2">
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-xs text-red-400 font-medium">Connection issue</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{xmtpError}</p>
                    <button onClick={onXmtpConnect} className="text-[10px] text-[#f5a623] font-medium mt-1.5 hover:text-[#ffd700]">
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </SidebarSection>
          )}

          {/* ── Direct Messages ────────────────────────────────────────── */}
          {xmtpConnected && !xmtpError && (
            <SidebarSection
              title="Direct Messages"
              badge={dmUnread > 0 ? (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#f5a623] text-[9px] font-bold text-black flex items-center justify-center ml-1">
                  {dmUnread > 99 ? '99+' : dmUnread}
                </span>
              ) : undefined}
              actions={
                <button
                  onClick={onNewDm}
                  className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                  title="New DM"
                  aria-label="New direct message"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              }
            >
              {dmConversations.length === 0 ? (
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-600">No direct messages yet</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {dmConversations.map((conv) => {
                    const isActive = activeConversationId === conv.id;
                    const hasUnread = conv.unreadCount > 0;
                    const initial = (conv.peerDisplayName || '?')[0]?.toUpperCase();
                    return (
                      <div key={conv.id} className="relative group">
                        <button
                          onClick={() => onConversationSelect(conv.id)}
                          className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-[#f5a623]/10 text-[#f5a623]'
                              : hasUnread
                              ? 'text-white hover:bg-white/5'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {conv.peerPfpUrl ? (
                            <div className="w-8 h-8 relative flex-shrink-0">
                              <Image src={conv.peerPfpUrl} alt={`${conv.peerDisplayName || 'DM'} avatar`} fill className="rounded-full object-cover" unoptimized />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center flex-shrink-0 border border-[#f5a623]/10">
                              <span className="text-xs text-[#f5a623]/80 font-semibold">{initial}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-white' : 'font-medium'}`}>
                                {conv.peerDisplayName || 'Unknown'}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {hasUnread && (
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
                              <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-300' : 'text-gray-600'}`}>
                                {conv.lastMessage}
                              </p>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </SidebarSection>
          )}

          {/* ── Groups ─────────────────────────────────────────────────── */}
          {xmtpConnected && !xmtpError && (
            <SidebarSection
              title="Groups"
              badge={groupUnread > 0 ? (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#f5a623] text-[9px] font-bold text-black flex items-center justify-center ml-1">
                  {groupUnread > 99 ? '99+' : groupUnread}
                </span>
              ) : undefined}
              actions={
                <button
                  onClick={onNewGroup}
                  className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                  title="New Group"
                  aria-label="New group chat"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              }
            >
              {groupConversations.length === 0 ? (
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-600">No groups yet</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {groupConversations.map((conv) => {
                    const isActive = activeConversationId === conv.id;
                    const hasUnread = conv.unreadCount > 0;
                    return (
                      <div key={conv.id} className="relative group">
                        <button
                          onClick={() => onConversationSelect(conv.id)}
                          className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-[#f5a623]/10 text-[#f5a623]'
                              : hasUnread
                              ? 'text-white hover:bg-white/5'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-white' : 'font-medium'}`}>
                                {conv.name || 'Group'}
                                {conv.memberCount && (
                                  <span className="ml-1.5 text-[10px] text-gray-500 font-normal">
                                    {conv.memberCount}
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {hasUnread && (
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
                              <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-300' : 'text-gray-600'}`}>
                                {conv.lastMessage}
                              </p>
                            )}
                          </div>
                        </button>
                        {onGroupInfo && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onGroupInfo(conv.id); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-white transition-all"
                            aria-label="Group info"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Wallet connect */}
              {!hasWallet && (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors mt-1"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                      </svg>
                      <span className="text-xs">Connect Wallet</span>
                    </button>
                  )}
                </ConnectButton.Custom>
              )}
            </SidebarSection>
          )}

          {/* ── Messageable Members ──────────────────────────────────────── */}
          {xmtpConnected && (
            <SidebarSection
              title="Messageable"
              badge={onlineMembers.length > 0 ? (
                <span className="text-[10px] text-green-400 font-medium ml-1">{onlineMembers.length}</span>
              ) : undefined}
              defaultOpen={true}
            >
              {loadingMembers ? (
                <div className="space-y-1.5 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-gray-800/60 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2.5 bg-gray-800/50 rounded" style={{ width: `${40 + i * 10}%` }} />
                        <div className="h-2 bg-gray-800/30 rounded w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : onlineMembers.length === 0 ? (
                <p className="px-3 py-1 text-xs text-gray-600">No members messageable</p>
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
                            <Image src={member.pfpUrl} alt={member.displayName} fill className="rounded-full object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-[9px] text-gray-400 font-medium">{member.displayName[0]?.toUpperCase()}</span>
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d1b2a] bg-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{member.displayName}</p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {member.lastLoginAt ? lastSeen(member.lastLoginAt) : (member.username ? `@${member.username}` : '')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </SidebarSection>
          )}

          {/* ── Not on XMTP (invite via Farcaster) ────────────────────── */}
          {xmtpConnected && offlineMembers.length > 0 && (
            <SidebarSection
              title="Not on XMTP"
              badge={<span className="text-[10px] text-gray-500 font-medium ml-1">{offlineMembers.length}</span>}
              defaultOpen={false}
            >
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {offlineMembers.map((member) => (
                  <div
                    key={member.fid ?? member.displayName}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-1.5 rounded-md text-gray-500"
                  >
                    <div className="relative flex-shrink-0">
                      {member.pfpUrl ? (
                        <div className="w-6 h-6 relative opacity-50">
                          <Image src={member.pfpUrl} alt={member.displayName} fill className="rounded-full object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                          <span className="text-[9px] text-gray-600 font-medium">{member.displayName[0]?.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-gray-500">{member.displayName}</p>
                      {member.username && (
                        <a
                          href={`https://farcaster.xyz/${member.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] truncate block transition-colors"
                          title={`Tag @${member.username} on Farcaster to enable XMTP`}
                        >
                          @{member.username}
                        </a>
                      )}
                    </div>
                    <a
                      href={`https://farcaster.xyz/~/compose?text=${encodeURIComponent(`@${member.username} enable XMTP messages on ZAO OS so I can ping you! 🎵`)}&channelKey=zao`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-gray-600 hover:text-[#f5a623] hover:bg-[#f5a623]/10 transition-colors flex-shrink-0"
                      title={`Cast to @${member.username} in /zao`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* ── Pages ──────────────────────────────────────────────────── */}
          <SidebarSection title="Pages">
            <a href="/social" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Followers & Following
            </a>
            <button
              onClick={() => { onOpenRespect?.(); onClose(); }}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              Respect
            </button>
            {user.isAdmin && (
              <a
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[#f5a623] hover:bg-[#f5a623]/10 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Dashboard
              </a>
            )}
          </SidebarSection>

          {/* ── Help ────────────────────────────────────────────────────── */}
          <SidebarSection title="Help" defaultOpen={false}>
            <button
              onClick={onOpenTutorial}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
              Getting Started
            </button>
            <button
              onClick={onOpenFaq}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              FAQ
            </button>
          </SidebarSection>

        </div>

        {/* ── User footer ──────────────────────────────────────────────── */}
        <div className="p-3 border-t border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {user.pfpUrl ? (
              <div className="w-8 h-8 relative flex-shrink-0">
                <Image src={user.pfpUrl} alt={user.displayName} fill className="rounded-full object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-400 font-medium">{user.displayName?.[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                {hasWallet && (
                  <span className="flex items-center gap-0.5 text-[9px] text-green-500/70">
                    <span className="w-1 h-1 rounded-full bg-green-500/70" />
                    wallet
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-white transition-colors flex-shrink-0"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
