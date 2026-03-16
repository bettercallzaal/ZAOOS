'use client';

import { useState } from 'react';
import Image from 'next/image';
import { XMTPConversation } from '@/types/xmtp';

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

interface ConversationListProps {
  conversations: XMTPConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewDm: () => void;
  onNewGroup: () => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewDm,
  onNewGroup,
}: ConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'dms' | 'groups'>('all');

  const filtered = conversations.filter((c) => {
    if (filter === 'dms') return c.type === 'dm';
    if (filter === 'groups') return c.type === 'group';
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Messages</h2>
          <div className="flex gap-1">
            <button
              onClick={onNewDm}
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="New DM"
              aria-label="New direct message"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </button>
            <button
              onClick={onNewGroup}
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="New Group"
              aria-label="New group chat"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-[#0a1628] rounded-lg p-0.5">
          {(['all', 'dms', 'groups'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-colors capitalize ${
                filter === f
                  ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f === 'dms' ? 'DMs' : f === 'groups' ? 'Groups' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 016 21c-1.282 0-2.47-.402-3.445-1.087.81.22 1.668.337 2.555.337C9.97 20.25 14 16.556 14 12S9.97 3.75 5.11 3.75c-.887 0-1.745.117-2.555.337A5.972 5.972 0 016 3c1.282 0 2.47.402 3.445 1.087A9.764 9.764 0 0112 3.75c4.97 0 9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No conversations yet</p>
            <p className="text-xs text-gray-600 mt-1">Start a DM or create a group</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeId === conv.id
                  ? 'bg-[#f5a623]/10 border-l-2 border-[#f5a623]'
                  : 'hover:bg-white/[0.03] border-l-2 border-transparent'
              }`}
            >
              {/* Avatar */}
              {conv.imageUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                  <Image src={conv.imageUrl} alt={`${conv.peerDisplayName || conv.name || 'Conversation'} avatar`} fill className="object-cover" unoptimized />
                </div>
              ) : conv.peerPfpUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                  <Image src={conv.peerPfpUrl} alt={`${conv.peerDisplayName || conv.name || 'Conversation'} avatar`} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {conv.type === 'group' ? (
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  ) : (
                    <span className="text-sm text-gray-400 font-medium">
                      {(conv.peerDisplayName || conv.name || '?')[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {conv.type === 'group' && <span className="text-gray-500 mr-1">#</span>}
                    {conv.peerDisplayName || conv.name}
                  </p>
                  {conv.lastMessageAt && (
                    <span className="text-xs text-gray-600 flex-shrink-0">
                      {timeAgo(conv.lastMessageAt)}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                )}
              </div>

              {/* Unread badge */}
              {conv.unreadCount > 0 && (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#f5a623] text-black text-xs font-bold flex items-center justify-center">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
