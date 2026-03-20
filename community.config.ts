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
    channels: ['zao', 'zabal', 'cocconcertz', 'wavewarz'],
    defaultChannel: 'zao',
  },

  // ── Admin ─────────────────────────────────────────────────────
  adminFids: [19640],
  adminWallets: [],

  // ── Respect Contracts (Optimism) ──────────────────────────────
  respect: {
    ogContract: '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957' as `0x${string}`,
    zorContract: '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as `0x${string}`,
    zorTokenId: BigInt(0),
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
    chain: 'optimism' as const,
  },

  // ── Hats Protocol (Optimism) ─────────────────────────────────
  hats: {
    contractAddress: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137' as `0x${string}`,
    treeId: 226,
    chain: 'optimism' as const,
  },

  // ── Music / Radio ────────────────────────────────────────────
  music: {
    radioName: 'ZAO Radio',
    /** Audius playlist/album URLs to use as community radio stations */
    radioPlaylists: [
      {
        name: 'Ambition',
        artist: 'Stilo World',
        url: 'https://audius.co/dopestilo/album/ambition',
      },
      {
        name: 'Lofi Chill',
        artist: 'Various Artists',
        url: 'https://audius.co/audius/playlist/lofi-beats',
      },
    ],
  },

  // ── Ecosystem Partners ──────────────────────────────────────
  partners: [
    {
      name: 'MAGNETIQ',
      description: 'Proof of Meet hub — verify real-world connections and earn attestations.',
      url: 'https://app.magnetiq.xyz',
      icon: 'magnet',
    },
    {
      name: 'SongJam',
      description: 'Mention leaderboard — track who talks about ZABAL across Farcaster.',
      url: 'https://songjam.space/zabal',
      icon: 'music',
    },
    {
      name: 'Empire Builder',
      description: 'Token empire rewards — stake and earn in the ZABAL ecosystem.',
      url: 'https://empirebuilder.world',
      icon: 'castle',
    },
    {
      name: 'Incented',
      description: 'Community campaigns — bounties and tasks that grow the ZAO.',
      url: 'https://incented.co/organizations/zabal',
      icon: 'rocket',
    },
    {
      name: 'Clanker',
      description: '$ZABAL token launcher — the origin of the community token.',
      url: 'https://clanker.world',
      icon: 'coin',
    },
    {
      name: 'ZOUNZ',
      description: 'ZABAL Nouns DAO — daily NFT auctions funding the community treasury on Base.',
      url: 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883',
      icon: 'nouns',
    },
  ],

  // ── ZOUNZ / Nouns Builder DAO (Base) ───────────────────────
  zounz: {
    tokenContract: '0xCB80Ef04DA68667c9a4450013BDD69269842c883' as `0x${string}`,
    chain: 'base' as const,
    nounsBuilderUrl: 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883',
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
