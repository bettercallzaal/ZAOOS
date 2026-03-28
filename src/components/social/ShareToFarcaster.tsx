'use client';

import { useState, useCallback } from 'react';
import { useMiniApp } from '@/hooks/useMiniApp';
import { publishCast } from '@/lib/farcaster/neynarActions';

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
  const { isMiniApp, composeCast } = useMiniApp();

  const handleShare = useCallback(async () => {
    // In miniapp context, use SDK composeCast for native experience
    if (isMiniApp) {
      setSharing(true);
      try {
        const success = await composeCast({
          text: template.text,
          embeds: template.embeds,
        });
        if (success) {
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        } else {
          // SDK compose failed — fall back to compose URL
          openComposeUrl(template);
        }
      } catch {
        openComposeUrl(template);
      }
      setSharing(false);
      return;
    }

    if (useSigner) {
      // Post directly via /api/neynar/cast
      setSharing(true);
      try {
        await publishCast(template.text, template.embeds ?? []);
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      } catch {
        // Fall back to compose URL
        openComposeUrl(template);
      }
      setSharing(false);
    } else {
      openComposeUrl(template);
    }
  }, [template, useSigner, isMiniApp, composeCast]);

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
    text: `Vibing to "${trackName}" by ${artistName}\n\nDiscovered on @thezao — where music artists build onchain\n\nWhat are you listening to?`,
    embeds: url ? [url] : ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share your respect rank */
  respectRank: (rank: number, respect: number): ShareTemplate => ({
    text: `Ranked #${rank} with ${respect.toLocaleString()} Respect in The ZAO\n\nRespect is earned through community participation — fractals, governance, and curation\n\nHow much Respect do you have?`,
    embeds: ['https://zaoos.com/governance'],
    channel: 'zao',
  }),

  /** Share a proposal */
  proposal: (title: string, action: 'created' | 'voted'): ShareTemplate => ({
    text: action === 'created'
      ? `New proposal in The ZAO: "${title}"\n\nCommunity-driven governance — your Respect tokens = your voting power\n\nVote now on ZAO OS`
      : `Just voted on "${title}" in The ZAO\n\nOn-chain governance by the community, for the community\n\nHave your say`,
    embeds: ['https://zaoos.com/governance'],
    channel: 'zao',
  }),

  /** Share your ZID profile */
  profile: (zid: number | null, displayName: string): ShareTemplate => ({
    text: zid
      ? `ZID #${zid} — ${displayName} in The ZAO\n\nMusic artists building onchain together. Governance, respect, collaboration.\n\nJoin The ZAO`
      : `${displayName} in The ZAO\n\nMusic artists building onchain together. Governance, respect, collaboration.\n\nJoin The ZAO`,
    embeds: ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share ZOUNZ auction */
  zounzAuction: (tokenId: string, currentBid: string): ShareTemplate => ({
    text: `ZOUNZ #${tokenId} auction is live!\n\nCurrent bid: ${currentBid} ETH\nZABAL Nouns DAO on Base\n\n1 NFT = 1 governance vote. 100% to treasury.\n\nPlace your bid`,
    embeds: [`https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883/${tokenId}`],
    channel: 'zabal',
  }),

  /** Invite to ZAO */
  invite: (): ShareTemplate => ({
    text: `The ZAO — where music artists build onchain\n\nA gated community for creators who govern, collaborate, and grow together\n\nOn-chain governance with Respect tokens\n8-platform music player\nCross-post to Farcaster + Bluesky\nEncrypted messaging\n\nJoin us`,
    embeds: ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share a song submission */
  songSubmission: (trackName: string, note?: string): ShareTemplate => ({
    text: note
      ? `Just submitted "${trackName}" to The ZAO\n\n"${note}"\n\nCommunity-curated music. Listen and discover on ZAO OS`
      : `Just submitted "${trackName}" to The ZAO\n\nCommunity-curated music. Listen and discover on ZAO OS`,
    embeds: ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share a new member welcome */
  welcomeMember: (username: string): ShareTemplate => ({
    text: `Welcome @${username} to The ZAO!\n\nAnother music artist joining the onchain movement\n\nGovernance. Respect. Collaboration. Music.\n\nThe ZAO is growing`,
    embeds: ['https://zaoos.com'],
    channel: 'zao',
  }),

  /** Share a published governance post */
  publishedProposal: (title: string): ShareTemplate => ({
    text: `The ZAO community has spoken!\n\n"${title}"\n\nApproved by governance — powered by Respect-weighted voting\n\nThis is how decentralized music communities make decisions`,
    embeds: ['https://zaoos.com/governance'],
    channel: 'zao',
  }),

  /** Share the ecosystem */
  ecosystem: (): ShareTemplate => ({
    text: `The ZAO Ecosystem\n\nZOUNZ DAO • SongJam • Empire Builder • MAGNETIQ • Incented • Clanker\n\nAll accessible from one app. Music artists building onchain.\n\nExplore the ecosystem`,
    embeds: ['https://zaoos.com'],
    channel: 'zabal',
  }),

  /** Share a fractal call */
  fractalCall: (weekNumber?: number): ShareTemplate => ({
    text: weekNumber
      ? `Fractal Call Week ${weekNumber} happening in The ZAO\n\nPeer-ranked contributions. Fibonacci scoring. Earn Respect.\n\nJoin the call on ZAO OS`
      : `Fractal calls are how The ZAO distributes Respect\n\nPeer-ranked contributions. Fibonacci scoring. Community governance.\n\nJoin on ZAO OS`,
    embeds: ['https://zaoos.com/governance'],
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
