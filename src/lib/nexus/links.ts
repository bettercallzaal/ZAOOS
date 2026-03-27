/**
 * ZAO Nexus Ecosystem Links
 * Ported from ZAO NEXUS V2 linksData.js — 100+ curated ecosystem links
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
  // ── ZAO Recommended ────────────────────────────────────────────────────
  {
    name: 'ZAO Recommended',
    description: 'Curated essential links for the ZAO community',
    links: [
      {
        title: 'ZAO Official Website',
        url: 'https://zao.gg',
        description: 'Main hub for all things ZAO',
        type: 'website',
        tags: ['official', 'main'],
      },
      {
        title: 'ZAO Discord',
        url: 'https://discord.gg/zao',
        description: 'Join the ZAO community on Discord',
        type: 'social',
        tags: ['community', 'chat'],
      },
      {
        title: 'ZAO Twitter/X',
        url: 'https://twitter.com/zaomusic',
        description: 'Follow ZAO on Twitter/X',
        type: 'social',
        tags: ['social', 'updates'],
      },
    ],
  },

  // ── ZAO Core ───────────────────────────────────────────────────────────
  {
    name: 'ZAO Core',
    description: 'Essential ZAO information and resources',
    subcategories: [
      {
        name: 'About ZAO',
        description: "Learn about ZAO's mission and vision",
        links: [
          {
            title: 'ZAO Whitepaper',
            url: 'https://zao.gg/whitepaper',
            description: 'Official ZAO whitepaper and documentation',
            type: 'document',
            tags: ['official', 'documentation'],
          },
          {
            title: 'ZAO Mission Statement',
            url: 'https://zao.gg/mission',
            description: 'Our mission to revolutionize music and blockchain',
            type: 'article',
            tags: ['about', 'mission'],
          },
        ],
      },
      {
        name: 'Onchain (Base only)',
        description: 'On-chain resources and contracts on Base',
        links: [
          {
            title: 'ZAO Token Contract',
            url: 'https://basescan.org/token/0x...',
            description: 'Official ZAO token on Base',
            type: 'contract',
            tags: ['blockchain', 'token'],
            chain: 'base',
          },
          {
            title: 'Base Bridge',
            url: 'https://bridge.base.org',
            description: 'Bridge assets to Base network',
            type: 'tool',
            tags: ['blockchain', 'bridge'],
            chain: 'base',
          },
        ],
      },
      {
        name: 'Calendars',
        description: 'ZAO event calendars and schedules',
        links: [
          {
            title: 'ZAO Events Calendar',
            url: 'https://calendar.zao.gg',
            description: 'All upcoming ZAO events and releases',
            type: 'calendar',
            tags: ['events', 'schedule'],
          },
        ],
      },
      {
        name: 'Newsletter',
        description: 'Stay updated with ZAO news',
        links: [
          {
            title: 'ZAO Newsletter Signup',
            url: 'https://zao.gg/newsletter',
            description: 'Subscribe to the ZAO newsletter',
            type: 'newsletter',
            tags: ['updates', 'news'],
          },
        ],
      },
    ],
  },

  // ── ZAO Ecosystem Projects ─────────────────────────────────────────────
  {
    name: 'ZAO Ecosystem Projects',
    description: 'Projects within the ZAO ecosystem',
    subcategories: [
      {
        name: 'WaveWarZ Hub',
        description: 'The competitive music battle platform',
        links: [
          {
            title: 'WaveWarZ Platform',
            url: 'https://wavewarz.io',
            description: 'Compete in music battles and earn rewards',
            type: 'platform',
            tags: ['gaming', 'music', 'competition'],
            chain: 'base',
          },
          {
            title: 'WaveWarZ Discord',
            url: 'https://discord.gg/wavewarz',
            description: 'Join the WaveWarZ community',
            type: 'social',
            tags: ['community', 'gaming'],
          },
          {
            title: 'WaveWarZ Twitter',
            url: 'https://twitter.com/wavewarz',
            description: 'Follow WaveWarZ updates',
            type: 'social',
            tags: ['social', 'updates'],
          },
        ],
      },
      {
        name: 'ZAO Festivals Hub',
        description: 'Virtual and physical ZAO festival experiences',
        links: [
          {
            title: 'ZAO Festivals',
            url: 'https://festivals.zao.gg',
            description: 'Explore ZAO festival events',
            type: 'platform',
            tags: ['events', 'festivals'],
          },
        ],
      },
      {
        name: 'Student Loanz Hub',
        description: 'Educational resources and student support',
        links: [
          {
            title: 'Student Loanz Platform',
            url: 'https://studentloanz.zao.gg',
            description: 'Resources for music students',
            type: 'platform',
            tags: ['education', 'students'],
          },
        ],
      },
      {
        name: 'ZABAL Hub',
        description: 'ZAO Basketball League integration',
        links: [
          {
            title: 'ZABAL Platform',
            url: 'https://zabal.zao.gg',
            description: 'ZAO Basketball League hub',
            type: 'platform',
            tags: ['sports', 'basketball'],
          },
        ],
      },
    ],
  },

  // ── Core Platforms ─────────────────────────────────────────────────────
  {
    name: 'Core Platforms',
    description: 'Primary ZAO platforms and tools',
    subcategories: [
      {
        name: 'Socials',
        description: 'ZAO social media presence',
        links: [
          {
            title: 'ZAO Twitter/X',
            url: 'https://twitter.com/zaomusic',
            description: 'Official ZAO Twitter/X account',
            type: 'social',
            tags: ['social', 'twitter'],
          },
          {
            title: 'ZAO Instagram',
            url: 'https://instagram.com/zaomusic',
            description: 'Follow ZAO on Instagram',
            type: 'social',
            tags: ['social', 'instagram'],
          },
          {
            title: 'ZAO TikTok',
            url: 'https://tiktok.com/@zaomusic',
            description: 'ZAO on TikTok',
            type: 'social',
            tags: ['social', 'tiktok'],
          },
          {
            title: 'ZAO LinkedIn',
            url: 'https://linkedin.com/company/zao',
            description: 'Connect with ZAO on LinkedIn',
            type: 'social',
            tags: ['social', 'professional'],
          },
        ],
      },
      {
        name: 'Streaming',
        description: 'ZAO music on streaming platforms',
        links: [
          {
            title: 'ZAO on Spotify',
            url: 'https://open.spotify.com/artist/zao',
            description: 'Listen to ZAO on Spotify',
            type: 'streaming',
            tags: ['music', 'streaming'],
          },
          {
            title: 'ZAO on Apple Music',
            url: 'https://music.apple.com/artist/zao',
            description: 'Stream ZAO on Apple Music',
            type: 'streaming',
            tags: ['music', 'streaming'],
          },
          {
            title: 'ZAO on YouTube Music',
            url: 'https://music.youtube.com/channel/zao',
            description: 'ZAO on YouTube Music',
            type: 'streaming',
            tags: ['music', 'streaming'],
          },
          {
            title: 'ZAO on SoundCloud',
            url: 'https://soundcloud.com/zaomusic',
            description: 'Discover ZAO on SoundCloud',
            type: 'streaming',
            tags: ['music', 'streaming'],
          },
        ],
      },
      {
        name: 'Tutorials',
        description: 'Learn how to use ZAO platforms',
        links: [
          {
            title: 'Getting Started with ZAO',
            url: 'https://zao.gg/tutorials/getting-started',
            description: "Beginner's guide to the ZAO ecosystem",
            type: 'tutorial',
            tags: ['education', 'tutorial'],
          },
          {
            title: 'How to Use WaveWarZ',
            url: 'https://zao.gg/tutorials/wavewarz',
            description: 'Complete guide to WaveWarZ platform',
            type: 'tutorial',
            tags: ['education', 'gaming'],
          },
        ],
      },
      {
        name: 'Artist Tools',
        description: 'Tools and resources for artists',
        links: [
          {
            title: 'ZAO Artist Portal',
            url: 'https://artists.zao.gg',
            description: 'Portal for ZAO artists',
            type: 'platform',
            tags: ['artists', 'tools'],
          },
          {
            title: 'Music Submission Portal',
            url: 'https://submit.zao.gg',
            description: 'Submit your music to ZAO',
            type: 'platform',
            tags: ['artists', 'submission'],
          },
        ],
      },
    ],
  },

  // ── Earned Media ───────────────────────────────────────────────────────
  {
    name: 'Earned Media',
    description: 'Press coverage and media mentions',
    subcategories: [
      {
        name: 'Interviews',
        description: 'ZAO interviews and features',
        links: [
          {
            title: 'Forbes Interview',
            url: 'https://forbes.com/zao-interview',
            description: 'ZAO featured in Forbes',
            type: 'article',
            tags: ['press', 'interview'],
          },
          {
            title: 'TechCrunch Feature',
            url: 'https://techcrunch.com/zao',
            description: 'ZAO on TechCrunch',
            type: 'article',
            tags: ['press', 'tech'],
          },
        ],
      },
      {
        name: 'Podcasts',
        description: 'ZAO podcast appearances',
        links: [
          {
            title: 'Blockchain Music Podcast',
            url: 'https://podcast.example.com/zao',
            description: 'ZAO discusses blockchain and music',
            type: 'podcast',
            tags: ['podcast', 'audio'],
          },
        ],
      },
      {
        name: 'Articles',
        description: 'Articles about ZAO',
        links: [
          {
            title: 'The Future of Music NFTs',
            url: 'https://medium.com/zao-future',
            description: 'How ZAO is changing the music industry',
            type: 'article',
            tags: ['article', 'nft'],
          },
        ],
      },
      {
        name: 'Mentions',
        description: 'ZAO mentions in media',
        links: [
          {
            title: 'Billboard Mention',
            url: 'https://billboard.com/zao-mention',
            description: 'ZAO mentioned in Billboard',
            type: 'article',
            tags: ['press', 'music'],
          },
        ],
      },
    ],
  },

  // ── Fan Art ────────────────────────────────────────────────────────────
  {
    name: 'Fan Art',
    description: 'Community-created ZAO artwork',
    links: [
      {
        title: 'ZAO Fan Art Gallery',
        url: 'https://gallery.zao.gg',
        description: 'Browse community fan art',
        type: 'gallery',
        tags: ['community', 'art'],
      },
      {
        title: 'Submit Fan Art',
        url: 'https://zao.gg/fanart/submit',
        description: 'Share your ZAO-inspired artwork',
        type: 'platform',
        tags: ['community', 'submission'],
      },
    ],
  },

  // ── Collaborators ──────────────────────────────────────────────────────
  {
    name: 'Collaborators',
    description: 'ZAO collaborators and partners',
    subcategories: [
      {
        name: 'Cannon Jones',
        description: 'Collaboration with Cannon Jones',
        links: [
          {
            title: 'Cannon Jones Official',
            url: 'https://cannonjones.com',
            description: 'Official Cannon Jones website',
            type: 'website',
            tags: ['artist', 'collaborator'],
          },
          {
            title: 'ZAO x Cannon Jones Track',
            url: 'https://zao.gg/tracks/cannon-jones',
            description: 'Collaborative track',
            type: 'music',
            tags: ['collaboration', 'music'],
          },
        ],
      },
      {
        name: 'Mumbo',
        description: 'Collaboration with Mumbo',
        links: [
          {
            title: 'Mumbo Official',
            url: 'https://mumbomusic.com',
            description: 'Official Mumbo website',
            type: 'website',
            tags: ['artist', 'collaborator'],
          },
        ],
      },
    ],
  },

  // ── Blockchain Tools ───────────────────────────────────────────────────
  {
    name: 'Blockchain Tools',
    description: 'Blockchain utilities and resources',
    links: [
      {
        title: 'Base Network Explorer',
        url: 'https://basescan.org',
        description: 'Explore Base blockchain',
        type: 'tool',
        tags: ['blockchain', 'explorer'],
        chain: 'base',
      },
      {
        title: 'MetaMask Wallet',
        url: 'https://metamask.io',
        description: 'Connect with MetaMask',
        type: 'tool',
        tags: ['wallet', 'web3'],
      },
      {
        title: 'Coinbase Wallet',
        url: 'https://wallet.coinbase.com',
        description: 'Use Coinbase Wallet for Base',
        type: 'tool',
        tags: ['wallet', 'web3'],
        chain: 'base',
      },
    ],
  },

  // ── ZAO Playlists ─────────────────────────────────────────────────────
  {
    name: 'ZAO Playlists',
    description: 'Curated ZAO music playlists',
    links: [
      {
        title: 'ZAO Essentials Playlist',
        url: 'https://open.spotify.com/playlist/zao-essentials',
        description: 'Essential ZAO tracks',
        type: 'playlist',
        tags: ['music', 'playlist'],
      },
      {
        title: 'WaveWarZ Champions',
        url: 'https://open.spotify.com/playlist/wavewarz-champions',
        description: 'Top tracks from WaveWarZ winners',
        type: 'playlist',
        tags: ['music', 'gaming'],
      },
      {
        title: 'ZAO Community Favorites',
        url: 'https://open.spotify.com/playlist/zao-community',
        description: 'Community-voted favorites',
        type: 'playlist',
        tags: ['music', 'community'],
      },
    ],
  },

  // ── Community & Partners ───────────────────────────────────────────────
  {
    name: 'Community & Partners',
    description: 'Community groups and partnerships',
    subcategories: [
      {
        name: 'ZAO Chats',
        description: 'Community chat platforms',
        links: [
          {
            title: 'ZAO Discord',
            url: 'https://discord.gg/zao',
            description: 'Main ZAO Discord server',
            type: 'social',
            tags: ['community', 'chat'],
          },
          {
            title: 'ZAO Telegram',
            url: 'https://t.me/zaomusic',
            description: 'ZAO Telegram community',
            type: 'social',
            tags: ['community', 'chat'],
          },
        ],
      },
      {
        name: 'C.O.C ConcertZ',
        description: 'Clash of Chains concert series',
        links: [
          {
            title: 'C.O.C ConcertZ Hub',
            url: 'https://coc.zao.gg',
            description: 'Clash of Chains concert platform',
            type: 'platform',
            tags: ['events', 'concerts'],
          },
        ],
      },
      {
        name: 'MidiPunkZ Ecosystem',
        description: 'MidiPunkZ NFT collection and community',
        links: [
          {
            title: 'MidiPunkZ Collection',
            url: 'https://midipunkz.io',
            description: 'Official MidiPunkZ NFT collection',
            type: 'platform',
            tags: ['nft', 'community'],
            chain: 'base',
          },
          {
            title: 'MidiPunkZ Discord',
            url: 'https://discord.gg/midipunkz',
            description: 'Join the MidiPunkZ community',
            type: 'social',
            tags: ['community', 'nft'],
          },
        ],
      },
      {
        name: 'Partners',
        description: 'ZAO partners and collaborators',
        subcategories: [
          {
            name: 'Tech Partners',
            description: 'Technology and platform partners',
            links: [
              {
                title: 'SIGEA',
                url: 'https://sigea.io',
                description: 'Strategic technology partner',
                type: 'partner',
                tags: ['tech', 'partner'],
              },
              {
                title: 'Magnetiq',
                url: 'https://magnetiq.io',
                description: 'Music technology partner',
                type: 'partner',
                tags: ['tech', 'music'],
              },
              {
                title: 'Flix.fun',
                url: 'https://flix.fun',
                description: 'Streaming and content partner',
                type: 'partner',
                tags: ['tech', 'streaming'],
              },
            ],
          },
          {
            name: 'Music & Artist Partners',
            description: 'Music industry partnerships',
            links: [
              {
                title: 'Quakey Nation',
                url: 'https://quakeynation.com',
                description: 'Artist collective partnership',
                type: 'partner',
                tags: ['music', 'artists'],
              },
            ],
          },
          {
            name: 'DAO/Community Partners',
            description: 'Decentralized community partnerships',
            links: [
              {
                title: 'Flix.fun DAO',
                url: 'https://dao.flix.fun',
                description: 'Community governance partner',
                type: 'partner',
                tags: ['dao', 'community'],
                chain: 'base',
              },
            ],
          },
          {
            name: 'Media Partners',
            description: 'Media and press partnerships',
            links: [
              {
                title: 'Blockchain Music News',
                url: 'https://blockchainmusicnews.com',
                description: 'Media coverage partner',
                type: 'partner',
                tags: ['media', 'press'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ── People of the ZAO ─────────────────────────────────────────────────
  {
    name: 'People of the ZAO',
    description: 'The team and community behind ZAO',
    subcategories: [
      {
        name: 'Founders',
        description: 'ZAO founding team',
        links: [
          {
            title: 'ZAO Founder Profile',
            url: 'https://zao.gg/team/founder',
            description: 'Meet the ZAO founder',
            type: 'profile',
            tags: ['team', 'founder'],
          },
        ],
      },
      {
        name: 'Staff',
        description: 'ZAO team members',
        links: [
          {
            title: 'Meet the Team',
            url: 'https://zao.gg/team',
            description: 'Full ZAO team directory',
            type: 'profile',
            tags: ['team', 'staff'],
          },
        ],
      },
      {
        name: 'Artists',
        description: 'ZAO artists and creators',
        links: [
          {
            title: 'ZAO Artist Roster',
            url: 'https://artists.zao.gg/roster',
            description: 'Browse all ZAO artists',
            type: 'directory',
            tags: ['artists', 'music'],
          },
        ],
      },
      {
        name: 'Interviews',
        description: 'Team interviews and profiles',
        links: [
          {
            title: 'Founder Interview Series',
            url: 'https://zao.gg/interviews/founder',
            description: 'In-depth founder interviews',
            type: 'article',
            tags: ['interview', 'team'],
          },
        ],
      },
    ],
  },

  // ── Media Portal ───────────────────────────────────────────────────────
  {
    name: 'Media Portal',
    description: 'ZAO media resources',
    subcategories: [
      {
        name: 'Audio Hub',
        description: 'Audio content and music',
        links: [
          {
            title: 'ZAO Audio Library',
            url: 'https://audio.zao.gg',
            description: 'Browse all ZAO audio content',
            type: 'library',
            tags: ['audio', 'music'],
          },
          {
            title: 'Podcast Archive',
            url: 'https://podcasts.zao.gg',
            description: 'ZAO podcast episodes',
            type: 'library',
            tags: ['audio', 'podcast'],
          },
        ],
      },
      {
        name: 'Video Hub',
        description: 'Video content and streams',
        links: [
          {
            title: 'ZAO YouTube Channel',
            url: 'https://youtube.com/@zaomusic',
            description: 'Official ZAO YouTube',
            type: 'video',
            tags: ['video', 'youtube'],
          },
          {
            title: 'ZAO Twitch',
            url: 'https://twitch.tv/zaomusic',
            description: 'Live streams on Twitch',
            type: 'video',
            tags: ['video', 'streaming'],
          },
          {
            title: 'Video Archive',
            url: 'https://videos.zao.gg',
            description: 'Browse all ZAO videos',
            type: 'library',
            tags: ['video', 'archive'],
          },
        ],
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
