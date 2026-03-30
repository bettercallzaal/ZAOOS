/**
 * Community Configuration
 *
 * Fork this repo and change these values to create your own community OS.
 * All hardcoded community-specific values live here — branding, channels,
 * contracts, admin access, partners, governance, and navigation.
 *
 * See FORK.md for the complete setup guide.
 */

export const communityConfig = {
  // ── Branding ──────────────────────────────────────────────────
  /** Community name — appears in nav, page titles, meta tags, and landing page */
  name: 'THE ZAO',
  /** Short description shown on landing page and social cards */
  tagline: 'Community on Farcaster',
  /** Theme colors used across the entire app via Tailwind classes */
  colors: {
    /** Accent color for buttons, links, active states, and highlights */
    primary: '#f5a623',
    /** Hover state for primary-colored elements */
    primaryHover: '#ffd700',
    /** Page background color (dark theme base) */
    background: '#0a1628',
    /** Card and panel backgrounds (slightly lighter than page bg) */
    surface: '#0d1b2a',
    /** Elevated surfaces like modals, dropdowns, popovers */
    surfaceLight: '#1a2a3a',
  },

  // ── Farcaster ─────────────────────────────────────────────────
  farcaster: {
    /** Your app's Farcaster ID — get this from the Neynar dashboard after creating an app */
    appFid: 19640,
    /** Farcaster channel names to display as chat rooms (e.g., ['your-community', 'general']) */
    channels: ['zao', 'zabal', 'cocconcertz', 'wavewarz'],
    /** Which channel loads first when a user opens the app */
    defaultChannel: 'zao',
  },

  // ── Admin ─────────────────────────────────────────────────────
  /** Farcaster IDs with full admin access (user management, moderation, config) */
  adminFids: [19640],
  /** Ethereum addresses with admin access — alternative to FID-based admin */
  adminWallets: [],

  // ── Spaces ─────────────────────────────────────────────────────
  /** Voice/video room definitions — appear in the Spaces section */
  voiceChannels: [
    { id: 'general-hangout', name: 'General Hangout', emoji: '💬', description: 'Casual conversation' },
    { id: 'fractal-call', name: 'Fractal Call', emoji: '📞', description: 'Monday 6pm EST weekly fractal' },
    { id: 'music-lounge', name: 'Music Lounge', emoji: '🎵', description: 'Always-on listening room' },
    { id: 'tech-talk', name: 'Tech Talk', emoji: '💻', description: 'Technical discussions' },
    { id: 'coworking', name: 'Coworking', emoji: '🏢', description: 'Silent cowork with ambient presence' },
  ],

  // ── Respect Contracts (Optimism) ──────────────────────────────
  /** On-chain reputation tokens — used for weighted voting and curation.
   *  If your community doesn't have on-chain tokens, leave these as-is;
   *  features gracefully degrade when contracts aren't found. */
  respect: {
    /** ERC-20 "OG" reputation token address on Optimism */
    ogContract: '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957' as `0x${string}`,
    /** ERC-1155 "ZOR" reputation token address on Optimism */
    zorContract: '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as `0x${string}`,
    /** Token ID for the ERC-1155 token (usually 0) */
    zorTokenId: BigInt(0),
    /** Multicall3 contract for batched reads — same on all EVM chains */
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
    /** Chain where respect tokens are deployed */
    chain: 'optimism' as const,
  },

  // ── Hats Protocol (Optimism) ─────────────────────────────────
  /** Hats Protocol for on-chain role management.
   *  Deploy your own hat tree at app.hatsprotocol.xyz */
  hats: {
    /** Hats Protocol v1 contract address on Optimism (shared across all orgs) */
    contractAddress: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137' as `0x${string}`,
    /** Your organization's tree ID in the Hats Protocol registry */
    treeId: 226,
    /** Chain where your hats tree is deployed */
    chain: 'optimism' as const,
  },

  // ── Music / Radio ────────────────────────────────────────────
  music: {
    /** Name shown in the radio player UI */
    radioName: 'ZAO Radio',
    /** Audius playlist/album URLs — each becomes a radio station.
     *  Browse audius.co to find playlists, paste the URL here. */
    radioPlaylists: [
      {
        name: 'Ambition',
        artist: 'Stilo World',
        url: 'https://audius.co/dopestilo/album/ambition',
      },
      {
        name: 'Lofi Chill',
        artist: 'Various Artists',
        url: 'https://audius.co/audius/playlist/official-audius-exclusives',
      },
      {
        name: 'Electronic',
        artist: 'Various Artists',
        url: 'https://audius.co/audius/playlist/hot-new-on-audius-%F0%9F%94%A5',
      },
    ],
  },

  // ── Cross-Posting Channels ─────────────────────────────────
  /** External platform links for cross-community presence */
  crossPosting: {
    telegram: {
      channelName: 'THE ZAO',
      channelUrl: 'https://t.me/thezao',
    },
    discord: {
      serverName: 'THE ZAO',
      inviteUrl: 'https://discord.gg/thezao',
    },
  },

  // ── Ecosystem Partners ──────────────────────────────────────
  /** Partner projects shown on the /ecosystem page.
   *  Each partner gets a card with name, description, URL, and icon.
   *  Icons: 'magnet' | 'music' | 'castle' | 'rocket' | 'coin' | 'nouns' | 'battle' */
  partners: [
    {
      name: 'MAGNETIQ',
      description: 'Proof of Meet hub — verify real-world connections and earn attestations.',
      url: 'https://app.magnetiq.xyz',
      icon: 'magnet',
    },
    {
      name: 'SongJam',
      description: 'Live audio spaces & ZABAL mention leaderboard — host rooms, earn points.',
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
    {
      name: 'WaveWarZ',
      description: 'Music battles — trade SOL on outcomes in a Solana prediction market for music.',
      url: '/wavewarz',
      icon: 'battle',
    },
  ],

  // ── WaveWarZ ──────────────────────────────────────────────────
  /** WaveWarZ music battles integration URLs — remove this section if not using WaveWarZ */
  wavewarz: {
    mainApp: 'https://www.wavewarz.com',
    intelligence: 'https://wavewarz-intelligence.vercel.app',
    analytics: 'https://analytics-wave-warz.vercel.app',
    channel: 'wavewarz',
  },

  // ── ZOUNZ / Nouns Builder DAO (Base) ───────────────────────
  /** Nouns Builder DAO integration — deploy your own at nouns.build.
   *  Used for on-chain proposals and daily NFT auctions. */
  zounz: {
    /** ERC-721 token contract deployed by Nouns Builder */
    tokenContract: '0xCB80Ef04DA68667c9a4450013BDD69269842c883' as `0x${string}`,
    /** Chain where the Nouns Builder DAO is deployed */
    chain: 'base' as const,
    /** Public URL for viewing the DAO on nouns.build */
    nounsBuilderUrl: 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883',
  },

  // ── Snapshot Governance ──────────────────────────────────────
  /** Snapshot.org gasless governance — create a space at snapshot.org.
   *  Used for weekly priority polls with approval voting. */
  snapshot: {
    /** Your Snapshot space ID (usually an ENS name) */
    space: 'zaal.eth',
    /** Snapshot hub URL — usually don't need to change this */
    hub: 'https://hub.snapshot.org',
    /** Snapshot GraphQL endpoint — usually don't need to change this */
    graphqlUrl: 'https://hub.snapshot.org/graphql',
    /** Default choices for weekly priority polls — customize for your community's workstreams */
    weeklyPollChoices: [
      'WAVEWARZ — Competitive Web3 music battles',
      'ZAO FRACTAL — Fractal governance + Respect Game',
      'ZAO FESTIVALS — IRL culture-build (ZAO-CHELLA)',
      'ZAO CARDS — Digital/physical collectibles',
      'COC CONCERTZ — Community shows with live music',
      'ZAO NEWSLETTER — Weekly updates & opportunities',
      'Student $LOANZ — Web3 education funding',
      'ZAO Calendar — Events, streams, activations',
      "Let's Talk About Web3 — Weekly live show + Q&A",
      'Midi-ZAO-NKZ — MIDI-PUNKZ collab',
    ],
  },

  // ── Navigation Pillars ────────────────────────────────────────
  /** Main navigation tabs — rename these to match your community's vocabulary.
   *  Icons: 'chat' | 'star' | 'book' | 'wrench' | 'code' */
  pillars: {
    social: { label: 'Social', icon: 'chat' },
    governance: { label: 'Governance', icon: 'star' },
    library: { label: 'Library', icon: 'book' },
    tools: { label: 'Tools', icon: 'wrench' },
    contribute: { label: 'Contribute', icon: 'code' },
  },

  // ── Arweave / ArDrive Turbo ──────────────────────────────────
  /** Permanent storage via Arweave — used for music NFTs and permanent uploads.
   *  Generate an Arweave wallet at arweave.app and set ARWEAVE_WALLET_KEY env var. */
  arweave: {
    /** Arweave gateway URL — default works for most cases */
    gateway: 'https://arweave.net',
    /** BazAR marketplace URL for discovering/buying atomic assets */
    bazarUrl: 'https://bazar.arweave.net',
    /** App name tag on Arweave transactions — use your community name */
    appName: 'ZAO-OS',
    /** App version tag on Arweave transactions */
    appVersion: '1.0.0',
    /** Default license for uploaded content: 'collectible' | 'commercial' | 'derivative' */
    defaultLicense: 'collectible' as const,
    /** Universal Data License contract transaction ID — usually don't change this */
    udlContractTx: 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8',
    /** Max audio file size in bytes (default: 50MB) */
    maxAudioSize: 50 * 1024 * 1024,
    /** Max cover image size in bytes (default: 5MB) */
    maxCoverSize: 5 * 1024 * 1024,
    /** Allowed audio MIME types for upload */
    allowedAudioTypes: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac'],
    /** Allowed image MIME types for upload */
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
} as const;

export type CommunityConfig = typeof communityConfig;
