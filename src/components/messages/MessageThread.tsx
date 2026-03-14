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
}

export function MessageThread({ conversation, messages, loading }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!conversation) {
    return null;
  }

  return (
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
                      {msg.senderDisplayName || (msg.senderAddress ? `${msg.senderAddress.slice(0, 6)}...${msg.senderAddress.slice(-4)}` : 'Unknown')}
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
