'use client';

import { useEffect, useRef } from 'react';
import { XMTPMessage, XMTPConversation } from '@/types/xmtp';

function formatTime(date: Date): string {
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function shouldShowDate(current: XMTPMessage, previous?: XMTPMessage): boolean {
  if (!previous) return true;
  return current.sentAt.toDateString() !== previous.sentAt.toDateString();
}

interface MessageThreadProps {
  conversation: XMTPConversation | null;
  messages: XMTPMessage[];
  loading: boolean;
  onBack?: () => void;
}

export function MessageThread({ conversation, messages, loading, onBack }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 016 21c-1.282 0-2.47-.402-3.445-1.087.81.22 1.668.337 2.555.337C9.97 20.25 14 16.556 14 12S9.97 3.75 5.11 3.75c-.887 0-1.745.117-2.555.337A5.972 5.972 0 016 3c1.282 0 2.47.402 3.445 1.087A9.764 9.764 0 0112 3.75c4.97 0 9 3.694 9 8.25z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-400">Select a conversation</h3>
        <p className="text-sm text-gray-600 mt-1">Choose a DM or group to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-white md:hidden">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            {conversation.type === 'group' && <span className="text-gray-500 mr-1">#</span>}
            {conversation.peerDisplayName || conversation.name}
          </h3>
          {conversation.type === 'group' && conversation.memberCount && (
            <p className="text-xs text-gray-500">{conversation.memberCount} members</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-600 mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showDate = shouldShowDate(msg, prev);
            const isConsecutive = prev &&
              prev.senderInboxId === msg.senderInboxId &&
              !showDate &&
              (msg.sentAt.getTime() - prev.sentAt.getTime()) < 5 * 60 * 1000;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1 border-t border-gray-800" />
                    <span className="text-xs text-gray-600 font-medium">{formatDate(msg.sentAt)}</span>
                    <div className="flex-1 border-t border-gray-800" />
                  </div>
                )}
                <div className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? '' : 'mt-3'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                      msg.isFromMe
                        ? 'bg-[#f5a623] text-black rounded-br-md'
                        : 'bg-[#1a2a3a] text-gray-200 rounded-bl-md'
                    }`}
                  >
                    {!msg.isFromMe && !isConsecutive && (
                      <p className="text-xs font-medium text-[#f5a623] mb-0.5">
                        {msg.senderDisplayName || msg.senderInboxId.slice(0, 8)}
                      </p>
                    )}
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 ${msg.isFromMe ? 'text-black/50' : 'text-gray-600'}`}>
                      {formatTime(msg.sentAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
