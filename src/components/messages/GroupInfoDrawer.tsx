'use client';

import { useState } from 'react';
import Image from 'next/image';
import { XMTPConversation } from '@/types/xmtp';

interface GroupMember {
  inboxId: string;
  displayName: string;
  pfpUrl: string;
  username?: string;
}

interface GroupInfoDrawerProps {
  conversation: XMTPConversation;
  members: GroupMember[];
  loading: boolean;
  onClose: () => void;
  onRemove: () => void;
}

export function GroupInfoDrawer({ conversation, members, loading, onClose, onRemove }: GroupInfoDrawerProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0d1b2a] border-l border-gray-800 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Group Info</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Group name + description */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#f5a623]/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">{conversation.name}</p>
              {conversation.description && (
                <p className="text-xs text-gray-500 mt-0.5">{conversation.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Members {!loading && `(${members.length})`}
            </p>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-800" />
                    <div className="h-3 bg-gray-800 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {members.map((m) => (
                  <div key={m.inboxId} className="flex items-center gap-3 py-2 px-1 rounded-md">
                    {m.pfpUrl ? (
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <Image src={m.pfpUrl} alt={m.displayName} fill className="rounded-full object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-400 font-medium">{m.displayName[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{m.displayName}</p>
                      {m.username && <p className="text-[10px] text-gray-500">@{m.username}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leave/Hide */}
        <div className="px-4 py-4 border-t border-gray-800">
          {confirmRemove ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Remove this group from your list? You can rejoin later.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onRemove(); onClose(); }}
                  className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRemove(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-red-400/80 hover:bg-red-500/10 transition-colors text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Hide Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
