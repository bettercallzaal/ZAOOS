/**
 * Community Configuration
 *
 * Fork this repo and change these values to create your own community OS.
 * All hardcoded community-specific values live here.
 */

export const communityConfig = {
  // ── Branding ──────────────────────────────────────────────────
  name: 'THE ZAO',
  tagline: 'Community on Farcaster',
  colors: {
    primary: '#f5a623',
    primaryHover: '#ffd700',
    background: '#0a1628',
    surface: '#0d1b2a',
    surfaceLight: '#1a2a3a',
  },

  // ── Farcaster ─────────────────────────────────────────────────
  farcaster: {
    appFid: 19640,
    channels: ['zao', 'zabal', 'cocconcertz'],
    defaultChannel: 'zao',
  },

  // ── Admin ─────────────────────────────────────────────────────
  adminFids: [19640],
  adminWallets: ['0x0000000000000000000000000000000000000000'],

  // ── Respect Contracts (Optimism) ──────────────────────────────
  respect: {
    ogContract: '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957' as `0x${string}`,
    zorContract: '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as `0x${string}`,
    zorTokenId: BigInt(0),
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
    chain: 'optimism' as const,
  },

  // ── Navigation Pillars ────────────────────────────────────────
  pillars: {
    social: { label: 'Social', icon: 'chat' },
    governance: { label: 'Governance', icon: 'star' },
    tools: { label: 'Tools', icon: 'wrench' },
    contribute: { label: 'Contribute', icon: 'code' },
  },
} as const;

export type CommunityConfig = typeof communityConfig;
