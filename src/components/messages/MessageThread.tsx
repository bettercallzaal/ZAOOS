'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
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
}

export function MessageThread({ conversation, messages, loading }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!conversation) {
    // Empty state when XMTP is connected but no conversation selected
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f5a623]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-white font-medium mb-1">End-to-end encrypted</p>
          <p className="text-sm text-gray-500">Select a conversation or start a new one</p>
          <p className="text-xs text-gray-600 mt-3">Messages are encrypted with XMTP protocol</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#f5a623]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.25 15c-1.774 0-3.382.772-4.5 2.005A8.178 8.178 0 01.75 12C.75 7.444 4.78 3.75 9.75 3.75S18.75 7.444 18.75 12z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">No messages yet</p>
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
                {/* Sender avatar — only for others, first in a group */}
                {!msg.isFromMe && !isConsecutive && (
                  <div className="w-8 h-8 flex-shrink-0 mr-2 mt-1">
                    {msg.senderPfpUrl ? (
                      <Image
                        src={msg.senderPfpUrl}
                        alt={msg.senderDisplayName || ''}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-xs text-gray-400 font-medium">
                          {(msg.senderDisplayName || '?')[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {/* Spacer for consecutive messages (aligns with avatar) */}
                {!msg.isFromMe && isConsecutive && (
                  <div className="w-8 flex-shrink-0 mr-2" />
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                    msg.isFromMe
                      ? 'bg-[#f5a623] text-black rounded-br-md'
                      : 'bg-[#1a2a3a] text-gray-200 rounded-bl-md'
                  }`}
                >
                  {!msg.isFromMe && !isConsecutive && (
                    <p className="text-xs font-medium text-[#f5a623] mb-0.5">
                      {msg.senderDisplayName || 'Unknown'}
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
  );
}
