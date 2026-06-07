/**
 * ZAO Nexus Ecosystem Links
 *
 * Pruned 2026-06-07: the original catalog was placeholder/seed data ported from
 * ZAO NEXUS V2. Removed dead domains (NXDOMAIN: quakeynation.com, dao.flix.fun,
 * blockchainmusicnews.com, all *.zao.gg) and fabricated placeholders
 * (generic "zaomusic" handles, billboard.com/zao-mention, basescan token/0x...).
 * Replaced surfaces that map to a real canonical URL with the value from
 * community.config.ts. Every entry below is verified live + ZAO-affiliated.
 * Audit trail: research/community/798-zao-ecosystem-master-link-index §0.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const NEXUS_LINK_TYPES = [
  'website',
  'social',
  'platform',
  'tool',
  'article',
  'document',
  'contract',
  'calendar',
  'newsletter',
  'streaming',
  'tutorial',
  'podcast',
  'playlist',
  'gallery',
  'music',
  'library',
  'video',
  'profile',
  'directory',
  'partner',
] as const;

export type NexusLinkType = (typeof NEXUS_LINK_TYPES)[number];

export interface NexusLink {
  title: string;
  url: string;
  description?: string;
  type: NexusLinkType;
  tags?: string[];
  chain?: string;
}

export interface NexusCategory {
  name: string;
  description?: string;
  links?: NexusLink[];
  subcategories?: NexusCategory[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const NEXUS_LINKS: NexusCategory[] = [
  // ── ZAO Official ───────────────────────────────────────────────────────
  {
    name: 'ZAO Official',
    description: 'Core ZAO sites and community channels',
    links: [
      {
        title: 'The ZAO',
        url: 'https://thezao.com',
        description: 'The ZAO community hub.',
        type: 'website',
        tags: ['official', 'main'],
      },
      {
        title: 'ZAO OS',
        url: 'https://zaoos.com',
        description: 'The gated Farcaster client and ZAO lab.',
        type: 'website',
        tags: ['official', 'app'],
      },
      {
        title: 'ZAO Discord',
        url: 'https://discord.gg/thezao',
        description:
          'Join the ZAO community on Discord — home of the weekly Fractal sessions.',
        type: 'social',
        tags: ['community', 'chat'],
      },
      {
        title: 'ZAO Telegram',
        url: 'https://t.me/thezao',
        description: 'The ZAO community Telegram channel.',
        type: 'social',
        tags: ['community', 'chat'],
      },
    ],
  },

  // ── ZAO OS Surfaces ────────────────────────────────────────────────────
  {
    name: 'ZAO OS Surfaces',
    description: 'Apps and agents running on ZAO OS',
    links: [
      {
        title: 'ZOE',
        url: 'https://zoe.zaoos.com',
        description: 'ZAO concierge agent surface.',
        type: 'platform',
        tags: ['agent', 'app'],
      },
      {
        title: 'Pixels',
        url: 'https://pixels.zaoos.com',
        description: 'Pixels app on ZAO OS.',
        type: 'platform',
        tags: ['app'],
      },
      {
        title: 'Paperclip',
        url: 'https://paperclip.zaoos.com',
        description: 'Paperclip app on ZAO OS.',
        type: 'platform',
        tags: ['app'],
      },
      {
        title: 'Sopha',
        url: 'https://sopha.social',
        description: 'Member-built social platform integrated into ZAO OS.',
        type: 'platform',
        tags: ['social', 'member'],
      },
    ],
  },

  // ── Ecosystem Projects ─────────────────────────────────────────────────
  {
    name: 'Ecosystem Projects',
    description: 'Projects within the ZAO ecosystem',
    links: [
      {
        title: 'WaveWarZ',
        url: 'https://www.wavewarz.com',
        description:
          'Competitive music battles (Solana-first, going multi-chain to Base).',
        type: 'platform',
        tags: ['gaming', 'music', 'competition'],
        chain: 'base',
      },
      {
        title: 'Magnetiq',
        url: 'https://app.magnetiq.xyz',
        description: 'Event/launch platform (ZAO ecosystem surface).',
        type: 'platform',
        tags: ['events', 'platform'],
      },
      {
        title: 'Empire Builder',
        url: 'https://empirebuilder.world',
        description: 'Empire Builder onchain world.',
        type: 'platform',
        tags: ['game', 'onchain'],
      },
      {
        title: 'SongJam (ZABAL)',
        url: 'https://songjam.space/zabal',
        description: 'ZABAL on SongJam.',
        type: 'platform',
        tags: ['music', 'zabal'],
      },
      {
        title: 'Incented (ZABAL)',
        url: 'https://incented.co/organizations/zabal',
        description: 'ZABAL contribution rewards on Incented.',
        type: 'platform',
        tags: ['rewards', 'zabal'],
      },
      {
        title: 'Clanker',
        url: 'https://clanker.world',
        description: 'Token launches on Clanker.',
        type: 'platform',
        tags: ['onchain', 'tokens'],
      },
    ],
  },

  // ── Governance ─────────────────────────────────────────────────────────
  {
    name: 'Governance',
    description: 'ZAO on-chain governance',
    links: [
      {
        title: 'ZAO DAO (Nouns Builder)',
        url: 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883',
        description: 'ZAO Nouns Builder DAO on Base.',
        type: 'platform',
        tags: ['dao', 'governance', 'base'],
        chain: 'base',
      },
    ],
  },

  // ── Music ──────────────────────────────────────────────────────────────
  {
    name: 'Music',
    description: 'ZAO music releases',
    links: [
      {
        title: 'Dopestilo — Ambition',
        url: 'https://audius.co/dopestilo/album/ambition',
        description: 'Album by ZAO artist Dopestilo on Audius.',
        type: 'music',
        tags: ['music', 'audius', 'artist'],
      },
    ],
  },

  // ── Artists & Collaborators ────────────────────────────────────────────
  {
    name: 'Artists & Collaborators',
    description: 'ZAO artists and collaborators',
    links: [
      {
        title: 'CannonJones',
        url: 'https://cannonjones.com',
        description:
          'CannonJones (Taji Kamikaze) — ZAO Cards lead, ZABAL mentor, and WaveWarZ artist.',
        type: 'website',
        tags: ['artist', 'collaborator'],
      },
      {
        title: 'Mumbo',
        url: 'https://mumbomusic.com',
        description: 'ZAO artist Mumbo.',
        type: 'website',
        tags: ['artist', 'collaborator'],
      },
    ],
  },

  // ── Partners ───────────────────────────────────────────────────────────
  {
    name: 'Partners',
    description: 'ZAO ecosystem partners',
    links: [
      {
        title: 'SIGEA',
        url: 'https://sigeacloud.io',
        description: 'Strategic technology partner.',
        type: 'partner',
        tags: ['tech', 'partner'],
      },
      {
        title: 'Flix.fun',
        url: 'https://flix.fun',
        description: 'WaveWarZ TV streaming partner.',
        type: 'partner',
        tags: ['streaming', 'partner'],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect every NexusLink from the category tree. */
export function flattenLinks(categories: NexusCategory[] = NEXUS_LINKS): NexusLink[] {
  const result: NexusLink[] = [];

  for (const cat of categories) {
    if (cat.links) {
      result.push(...cat.links);
    }
    if (cat.subcategories) {
      result.push(...flattenLinks(cat.subcategories));
    }
  }

  return result;
}

/** Case-insensitive search across title, description, and tags. */
export function searchNexus(query: string): NexusLink[] {
  const q = query.toLowerCase();
  return flattenLinks().filter((link) => {
    if (link.title.toLowerCase().includes(q)) return true;
    if (link.description?.toLowerCase().includes(q)) return true;
    if (link.tags?.some((t) => t.toLowerCase().includes(q))) return true;
    return false;
  });
}

/** Return all links that include the given tag (case-insensitive). */
export function getNexusByTag(tag: string): NexusLink[] {
  const t = tag.toLowerCase();
  return flattenLinks().filter((link) =>
    link.tags?.some((lt) => lt.toLowerCase() === t),
  );
}
