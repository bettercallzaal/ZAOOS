'use client';

import { useState, useCallback } from 'react';

type ShareTemplate = {
  text: string;
  embeds?: string[];
  channel?: string;
};

interface ShareToFarcasterProps {
  /** Pre-built share template */
  template: ShareTemplate;
  /** Button style variant */
  variant?: 'icon' | 'button' | 'compact';
  /** Optional label override */
  label?: string;
  /** Optional className override */
  className?: string;
  /** Use Neynar signer (post directly) vs compose URL (open in Farcaster) */
  useSigner?: boolean;
}

/**
 * Universal "Share to Farcaster" component.
 * Can either open a Farcaster compose URL or post directly via signer.
 */
export function ShareToFarcaster({
  template,
  variant = 'icon',
  label = 'Share',
  className,
  useSigner = false,
}: ShareToFarcasterProps) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    if (useSigner) {
      // Post directly via API
      setSharing(true);
      try {
        const res = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: template.text,
            channel: template.channel || 'zao',
            embedUrls: template.embeds,
          }),
        });
        if (res.ok) {
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        }
      } catch {
        // Fall back to compose URL
        openComposeUrl(template);
      }
      setSharing(false);
    } else {
      openComposeUrl(template);
    }
  }, [template, useSigner]);

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        disabled={sharing}
        className={`text-gray-500 hover:text-[#f5a623] transition-colors p-1.5 ${className || ''}`}
        title="Share to Farcaster"
        aria-label="Share to Farcaster"
      >
        {shared ? (
          <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : sharing ? (
          <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleShare}
        disabled={sharing}
        className={`flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#f5a623] transition-colors ${className || ''}`}
        title="Share to Farcaster"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        {shared ? 'Shared!' : label}
      </button>
    );
  }

  // variant === 'button'
  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-50 ${className || ''}`}
      title="Share to Farcaster"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
      {sharing ? 'Sharing...' : shared ? 'Shared!' : label}
    </button>
  );
}

// ─── Share Templates ────────────────────────────────────────────────────────

export const shareTemplates = {
  /** Share a song you're listening to */
  song: (trackName: string, artistName: string, url?: string): ShareTemplate => ({
    text: `Listening to "${trackName}" by ${artistName} on ZAO OS\n\nMusic artists building onchain`,
    embeds: url ? [url] : ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share your respect rank */
  respectRank: (rank: number, respect: number): ShareTemplate => ({
    text: `Ranked #${rank} with ${respect.toLocaleString()} Respect in The ZAO\n\nMusic artists building onchain`,
    embeds: ['https://zaoos.com/governance'],
    channel: 'zao',
  }),

  /** Share a proposal */
  proposal: (title: string, action: 'created' | 'voted'): ShareTemplate => ({
    text: action === 'created'
      ? `New proposal in The ZAO: "${title}"\n\nVote now on ZAO OS`
      : `Just voted on "${title}" in The ZAO\n\nGovernance by the community, for the community`,
    embeds: ['https://zaoos.com/governance'],
    channel: 'zao',
  }),

  /** Share your ZID profile */
  profile: (zid: number | null, displayName: string): ShareTemplate => ({
    text: zid
      ? `ZID #${zid} in The ZAO — ${displayName}\n\nMusic artists building onchain`
      : `${displayName} in The ZAO\n\nMusic artists building onchain`,
    embeds: ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share ZOUNZ auction */
  zounzAuction: (tokenId: string, currentBid: string): ShareTemplate => ({
    text: `ZOUNZ #${tokenId} is live — current bid: ${currentBid} ETH\n\nZABAL Nouns DAO on Base`,
    embeds: [`https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883/${tokenId}`],
    channel: 'zabal',
  }),

  /** Invite to ZAO */
  invite: (): ShareTemplate => ({
    text: `Music artists building onchain\n\nThe ZAO — a gated community for creators who govern, collaborate, and grow together`,
    embeds: ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share a song submission */
  songSubmission: (trackName: string, note?: string): ShareTemplate => ({
    text: note
      ? `Submitted "${trackName}" to The ZAO\n\n"${note}"\n\nListen on ZAO OS`
      : `Submitted "${trackName}" to The ZAO\n\nListen on ZAO OS`,
    embeds: ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share a new member welcome */
  welcomeMember: (username: string): ShareTemplate => ({
    text: `Welcome @${username} to The ZAO!\n\nMusic artists building onchain`,
    embeds: ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Custom share */
  custom: (text: string, embeds?: string[], channel?: string): ShareTemplate => ({
    text,
    embeds,
    channel,
  }),
};

// ─── Compose URL helper ─────────────────────────────────────────────────────

function openComposeUrl(template: ShareTemplate) {
  const params = new URLSearchParams();
  params.set('text', template.text);

  if (template.embeds?.length) {
    template.embeds.forEach((embed) => {
      params.append('embeds[]', embed);
    });
  }

  if (template.channel) {
    params.set('channelKey', template.channel);
  }

  // Use warpcast.com compose URL (the standard Farcaster compose endpoint)
  const url = `https://warpcast.com/~/compose?${params.toString()}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
