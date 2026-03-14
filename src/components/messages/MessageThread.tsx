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
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a1628]">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f5a623]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg mb-1">Your Messages</p>
          <p className="text-sm text-gray-500 max-w-xs">Select a conversation from the sidebar or start a new one</p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-xs text-gray-600">End-to-end encrypted with XMTP</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 bg-[#0a1628]">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-600 mt-3">Loading messages...</p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#1a2a3a] flex items-center justify-center">
            <svg className="w-7 h-7 text-[#f5a623]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-300">No messages yet</p>
          <p className="text-xs text-gray-600 mt-1">Say hello to start the conversation</p>
        </div>
      ) : (
        <>
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showDate = shouldShowDate(msg, prev);
            const isConsecutive = prev &&
              prev.senderInboxId === msg.senderInboxId &&
              !showDate &&
              (msg.sentAt.getTime() - prev.sentAt.getTime()) < 5 * 60 * 1000;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-4 py-4 my-2">
                    <div className="flex-1 border-t border-gray-800/60" />
                    <span className="text-[11px] text-gray-500 font-medium px-2">{formatDate(msg.sentAt)}</span>
                    <div className="flex-1 border-t border-gray-800/60" />
                  </div>
                )}
                <div className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-4'}`}>
                  {/* Sender avatar */}
                  {!msg.isFromMe && !isConsecutive && (
                    <div className="w-8 h-8 flex-shrink-0 mr-2.5 mt-0.5">
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a2a3a] to-[#0d1b2a] border border-gray-700/50 flex items-center justify-center">
                          <span className="text-xs text-[#f5a623]/70 font-semibold">
                            {(msg.senderDisplayName || '?')[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Spacer for consecutive messages */}
                  {!msg.isFromMe && isConsecutive && (
                    <div className="w-8 flex-shrink-0 mr-2.5" />
                  )}
                  <div className="max-w-[80%] sm:max-w-[70%]">
                    {/* Sender name */}
                    {!msg.isFromMe && !isConsecutive && (
                      <p className="text-[11px] font-semibold text-[#f5a623]/80 mb-1 ml-1">
                        {msg.senderDisplayName || 'Unknown'}
                      </p>
                    )}
                    <div
                      className={`px-3.5 py-2 ${
                        msg.isFromMe
                          ? isConsecutive
                            ? 'rounded-2xl rounded-br-md'
                            : 'rounded-2xl rounded-br-md'
                          : isConsecutive
                          ? 'rounded-2xl rounded-bl-md'
                          : 'rounded-2xl rounded-tl-md'
                      } ${
                        msg.isFromMe
                          ? 'bg-[#f5a623] text-black'
                          : 'bg-[#1a2a3a] text-gray-100 border border-gray-800/30'
                      }`}
                    >
                      <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className={`text-[10px] mt-1 ${msg.isFromMe ? 'text-right mr-1' : 'ml-1'} text-gray-600`}>
                      {formatTime(msg.sentAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} className="h-2" />
        </>
      )}
    </div>
  );
}
