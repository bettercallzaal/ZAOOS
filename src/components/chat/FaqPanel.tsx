'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'What is THE ZAO?',
    a: 'THE ZAO is a gated music community on Farcaster. It\'s a private space for music lovers, producers, DJs, and curators to share and discover music together.',
  },
  {
    q: 'How do I get access?',
    a: 'Access is by invite only. If you\'re seeing this, you\'re already on the allowlist. You need a Farcaster account and to sign in with your connected wallet.',
  },
  {
    q: 'What are the channels?',
    a: '#zao is the main community channel. #zabal is for general vibes and off-topic. #cocconcertz is for live music events and concert talk.',
  },
  {
    q: 'How do I post messages?',
    a: 'You need to connect a Farcaster signer first (the purple "Connect to post" banner). Once connected, type in the compose bar at the bottom and hit Post. Your messages are posted as casts on Farcaster.',
  },
  {
    q: 'What is cross-posting?',
    a: 'When composing a message, click the share icon to cross-post to multiple channels at once. Your message will appear in each selected channel.',
  },
  {
    q: 'How does the music player work?',
    a: 'Share a link to Spotify, SoundCloud, YouTube, or other music platforms in chat. The player will automatically detect the music and let you play it inline. Click the music note icon to open the queue sidebar.',
  },
  {
    q: 'What are Private DMs & Groups?',
    a: 'End-to-end encrypted messaging powered by XMTP. You can send private DMs to other ZAO members or create group chats. This is completely separate from the public Farcaster channels.',
  },
  {
    q: 'What is Respect?',
    a: 'Respect is the community\'s reputation system. You earn Respect by sharing great music, being active, and contributing to the community. Check the Respect page for the leaderboard.',
  },
  {
    q: 'Can I schedule posts?',
    a: 'Yes! Click the clock icon in the compose bar to schedule a post for later. You can view and manage scheduled posts from the clock icon in the header.',
  },
  {
    q: 'How do I search messages?',
    a: 'Click the search icon in the header or press Cmd+K (Ctrl+K on Windows). You can search through all messages in the current channel.',
  },
  {
    q: 'Is this also a Farcaster Mini App?',
    a: 'Yes! ZAO OS works as a standalone web app and as a Farcaster Mini App inside Warpcast. The experience is the same either way.',
  },
];

interface FaqPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FaqPanel({ isOpen, onClose }: FaqPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0d1b2a] border-l border-gray-800 z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">FAQ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* FAQ items */}
        <div className="flex-1 overflow-y-auto">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-gray-800/50">
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-gray-200 pr-4">{item.q}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${expandedIndex === i ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {expandedIndex === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
