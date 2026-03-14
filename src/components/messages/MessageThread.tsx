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

// Skeleton loading for messages (instead of spinner)
function MessageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse px-3 sm:px-6 py-4">
      {[...Array(6)].map((_, i) => {
        const isRight = i % 3 === 1;
        return (
          <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
            {!isRight && <div className="w-8 h-8 rounded-full bg-gray-800/60 flex-shrink-0 mr-2.5" />}
            <div className={`${isRight ? 'max-w-[60%]' : 'max-w-[65%]'}`}>
              {!isRight && <div className="w-20 h-2.5 bg-gray-800/40 rounded mb-2 ml-1" />}
              <div className={`rounded-2xl px-4 py-3 ${isRight ? 'bg-[#f5a623]/10' : 'bg-gray-800/30'}`}>
                <div className="space-y-1.5">
                  <div className={`h-3 rounded ${isRight ? 'bg-[#f5a623]/15' : 'bg-gray-700/40'}`} style={{ width: `${70 + (i * 13) % 30}%` }} />
                  {i % 2 === 0 && <div className={`h-3 rounded ${isRight ? 'bg-[#f5a623]/10' : 'bg-gray-700/30'}`} style={{ width: `${40 + (i * 17) % 35}%` }} />}
                </div>
              </div>
              <div className={`w-10 h-2 bg-gray-800/20 rounded mt-1.5 ${isRight ? 'ml-auto mr-1' : 'ml-1'}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MessageThreadProps {
  conversation: XMTPConversation | null;
  messages: XMTPMessage[];
  loading: boolean;
  xmtpState?: 'idle' | 'connecting' | 'error' | 'connected';
  xmtpError?: string | null;
  onNewDm?: () => void;
  onNewGroup?: () => void;
  onRetryConnect?: () => void;
}

export function MessageThread({ conversation, messages, loading, xmtpState = 'connected', xmtpError, onNewDm, onNewGroup, onRetryConnect }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // State machine: show different UI based on XMTP connection state
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a1628]">
        <div className="text-center px-6 max-w-sm">

          {/* Idle — not connected yet */}
          {xmtpState === 'idle' && (
            <>
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#f5a623]/15 to-[#f5a623]/5 flex items-center justify-center border border-[#f5a623]/10">
                <svg className="w-10 h-10 text-[#f5a623]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg mb-2">Private Messages</p>
              <p className="text-sm text-gray-400 leading-relaxed">Enable messaging in the sidebar to start encrypted conversations with ZAO members</p>
            </>
          )}

          {/* Connecting — signing / syncing */}
          {xmtpState === 'connecting' && (
            <>
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#f5a623]/15 to-[#f5a623]/5 flex items-center justify-center border border-[#f5a623]/10">
                <div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-white font-semibold text-lg mb-2">Connecting to XMTP</p>
              <p className="text-sm text-gray-400 leading-relaxed">Setting up your encrypted inbox... This may take a moment on first use.</p>
            </>
          )}

          {/* Error — connection failed */}
          {xmtpState === 'error' && (
            <>
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg mb-2">Connection Failed</p>
              <p className="text-sm text-red-400/80 leading-relaxed mb-4">{xmtpError || 'Unable to connect to XMTP. Please try again.'}</p>
              {onRetryConnect && (
                <button
                  onClick={onRetryConnect}
                  className="px-5 py-2.5 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#ffd700] transition-colors"
                >
                  Retry Connection
                </button>
              )}
            </>
          )}

          {/* Connected — no conversation selected */}
          {xmtpState === 'connected' && (
            <>
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#f5a623]/15 to-[#f5a623]/5 flex items-center justify-center border border-[#f5a623]/10">
                <svg className="w-10 h-10 text-[#f5a623]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg mb-2">No Conversation Selected</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">Select a conversation from the sidebar to view messages</p>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 border-t border-gray-800/60" />
                <span className="text-[11px] text-gray-600 font-medium">or</span>
                <div className="flex-1 border-t border-gray-800/60" />
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-2.5">
                {onNewDm && (
                  <button
                    onClick={onNewDm}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#ffd700] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Direct Message
                  </button>
                )}
                {onNewGroup && (
                  <button
                    onClick={onNewGroup}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-white/5 hover:border-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
                    </svg>
                    Create Group Chat
                  </button>
                )}
              </div>
            </>
          )}

          {/* Encryption pill — show for all states except error */}
          {xmtpState !== 'error' && (
            <div className="flex items-center justify-center gap-1.5 mt-5 px-4 py-2 rounded-full bg-green-500/5 border border-green-500/10 mx-auto w-fit">
              <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-xs text-green-500/80">End-to-end encrypted with XMTP</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a1628]">
      {/* Encryption banner at top of conversation */}
      <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500/5 border-b border-green-500/10">
        <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span className="text-[11px] text-green-500/80 font-medium">End-to-end encrypted</span>
        {conversation.type === 'dm' && (
          <span className="text-[11px] text-gray-600 ml-1">· Only you and {conversation.peerDisplayName || 'this person'} can read these messages</span>
        )}
      </div>

      <div className="px-3 sm:px-6 py-4">
      {loading ? (
        <MessageSkeleton />
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1a2a3a] to-[#0d1b2a] border border-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#f5a623]/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-white mb-1">No messages yet</p>
          <p className="text-sm text-gray-500">Say hello to start the conversation</p>
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
    </div>
  );
}
