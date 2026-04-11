export interface PortalDestination {
  name: string;
  url: string;
  description: string;
  external: boolean; // true = opens in new tab, false = internal route
}

export interface Portal {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // emoji
  glowColor: string; // hex color for CSS glow
  locked: boolean;
  gateType?: 'allowlist' | 'token'; // which gate check to use
  destinations: PortalDestination[];
}

export const PORTALS: Portal[] = [
  {
    id: 'music',
    title: 'MUSIC',
    subtitle: 'Listen, battle, discover',
    icon: '🎵',
    glowColor: '#f5a623',
    locked: false,
    destinations: [
      { name: 'FISHBOWLZ', url: 'https://fishbowlz.com', description: 'Music battles & NFT jukebox', external: true },
      { name: 'WaveWarZ', url: 'https://www.wavewarz.com', description: 'Music prediction markets', external: true },
      { name: 'SongJam', url: 'https://songjam.space/zabal', description: 'Live audio spaces', external: true },
      { name: 'Audius', url: 'https://audius.co/dopestilo/album/ambition', description: 'Stream ZAO playlists', external: true },
    ],
  },
  {
    id: 'social',
    title: 'SOCIAL',
    subtitle: 'Connect with the community',
    icon: '💬',
    glowColor: '#5865F2',
    locked: false,
    destinations: [
      { name: 'ZAO OS', url: 'https://zaoos.com', description: 'Main community app', external: true },
      { name: 'Discord', url: 'https://discord.gg/thezao', description: 'Chat server', external: true },
      { name: 'Telegram', url: 'https://t.me/thezao', description: 'Group chat', external: true },
      { name: 'Sopha', url: 'https://sopha.social', description: 'Curated feed', external: true },
    ],
  },
  {
    id: 'build',
    title: 'BUILD',
    subtitle: 'Tools & agents',
    icon: '🛠️',
    glowColor: '#10b981',
    locked: false,
    destinations: [
      { name: 'ZOE Dashboard', url: 'https://zoe.zaoos.com', description: 'Agent command center', external: true },
      { name: 'Pixel Agents', url: 'https://pixels.zaoos.com', description: 'Pixel agent office', external: true },
      { name: 'Paperclip', url: 'https://paperclip.zaoos.com', description: 'Paperclip agent', external: true },
    ],
  },
  {
    id: 'earn',
    title: 'EARN',
    subtitle: 'Bounties, tokens, staking',
    icon: '💰',
    glowColor: '#eab308',
    locked: false,
    destinations: [
      { name: 'Incented', url: 'https://incented.co/organizations/zabal', description: 'Community bounties', external: true },
      { name: 'Clanker', url: 'https://clanker.world', description: '$ZABAL token', external: true },
      { name: 'Empire Builder', url: 'https://empirebuilder.world', description: 'Token staking rewards', external: true },
    ],
  },
  {
    id: 'govern',
    title: 'GOVERN',
    subtitle: 'Vote & propose',
    icon: '⭐',
    glowColor: '#8b5cf6',
    locked: false,
    destinations: [
      { name: 'ZOUNZ DAO', url: 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883', description: 'On-chain proposals & NFT auctions', external: true },
      { name: 'Snapshot', url: 'https://hub.snapshot.org', description: 'Gasless governance polls', external: true },
    ],
  },
  {
    id: 'vip',
    title: 'VIP',
    subtitle: 'Members only',
    icon: '👑',
    glowColor: '#f5a623',
    locked: true,
    gateType: 'allowlist',
    destinations: [
      { name: 'Member Home', url: '/home', description: 'Full ZAO OS experience', external: false },
      { name: 'Proof of Meet', url: 'https://app.magnetiq.xyz', description: 'Verify real-world connections', external: true },
    ],
  },
];

export function getPortalById(id: string): Portal | undefined {
  return PORTALS.find(p => p.id === id);
}
