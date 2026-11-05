import { describe, expect, it } from 'vitest';
import {
  applyWalletVisibility,
  hasPublicField,
  hasPublicProfile,
  isWalletPublic,
  memberScope,
  PUBLIC_FIELDS,
  projectPublicMember,
  publicProfileUpdateSchema,
} from '@/lib/members/public-profile';

const WALLET = '0xAaAa000000000000000000000000000000000001';
const VERIFIED = '0xbbbb000000000000000000000000000000000002';

const full = {
  id: 'member-id',
  fid: 42,
  username: 'alice',
  displayName: 'Farcaster Alice',
  pfpUrl: 'https://img/alice.png',
  realName: 'Alice Secret',
  bio: 'bio text',
  location: 'Lusaka',
  website: 'https://alice.example',
  tags: ['dj'],
  ensName: 'alice.eth',
  ensAvatar: 'https://img/ens.png',
  ensProfile: { email: 'x' },
  ensNames: { [WALLET.toLowerCase()]: 'alice.eth', [VERIFIED]: 'secret.eth' },
  basenames: { [VERIFIED]: 'secret.base.eth' },
  zid: 7,
  tier: 'respect_holder',
  role: 'admin',
  zaoSubname: 'alice.zao.eth',
  primaryWallet: WALLET,
  preferredWallet: VERIFIED,
  custodyAddress: '0xcccc',
  verifiedAddresses: [VERIFIED],
  solanaWallet: 'SoL',
  hiddenWallets: ['verified_addresses'],
  platforms: {
    x: 'alice_x',
    instagram: 'alice_ig',
    bluesky: 'alice_bsky',
    soundcloud: 'sc',
    spotify: 'sp',
    audius: 'au',
    discord: 'discord-id',
  },
  respect: { total: 100 },
  fractalHistory: [{ rank: 1 }],
  events: [{ type: 'x' }],
  reputation: { neynarScore: 0.9 },
  artistProfile: { slug: 'alice' },
  coverImageUrl: 'https://img/cover.png',
  social: { followerCount: 10 },
  farcasterRegisteredAt: '2024-01-01',
  lastLoginAt: '2026-10-01',
  lastActiveAt: '2026-10-02',
  createdAt: '2025-01-01',
  somethingAddedLater: 'must stay hidden',
};

const SECRETS = [
  'Farcaster Alice',
  'alice',
  'img/',
  'Secret',
  'bio text',
  'Lusaka',
  'example',
  'dj',
  'alice.eth',
  'secret.eth',
  '0xbbbb',
  '0xcccc',
  'SoL',
  'alice_',
  'discord-id',
  '2026-10',
  'must stay',
];

const row = (overrides = {}) => ({
  public_name: 'Ally',
  public_fields: [] as string[],
  hidden_wallets: [] as string[],
  primary_wallet: WALLET,
  verified_addresses: [VERIFIED],
  custody_address: '0xcccc',
  ...overrides,
});

describe('projectPublicMember', () => {
  it('shows only the picked name, the wallets and the id when every toggle is off', () => {
    const out = projectPublicMember(row(), full);
    expect(out.displayName).toBe('Ally');
    expect(out.primaryWallet).toBe(WALLET);
    // The display wallet the member picked shows too, unless they hid it.
    expect(out.preferredWallet).toBe(VERIFIED);
    expect(out.id).toBe('member-id');
    expect(out.tags).toEqual([]);
    expect(out.fid).toBeNull();
    expect(out.username).toBeNull();

    const { displayName, primaryWallet, preferredWallet, id, ...rest } = out;
    const json = JSON.stringify(rest);
    for (const secret of SECRETS) expect(json).not.toContain(secret);
  });

  it('keeps the response shape so existing clients keep rendering', () => {
    const out = projectPublicMember(row(), full);
    expect(Object.keys(out).sort()).toEqual(Object.keys(full).sort());
    expect(Object.values(out.platforms).every((v) => v === null)).toBe(true);
    expect(out.ensNames).toEqual({});
    expect(out.hiddenWallets).toEqual([]);
  });

  it.each([
    ['avatar', 'pfpUrl'],
    ['real_name', 'realName'],
    ['bio', 'bio'],
    ['location', 'location'],
    ['website', 'website'],
    ['tags', 'tags'],
    ['ens', 'ensName'],
    ['farcaster', 'fid'],
    ['membership', 'zid'],
    ['respect', 'fractalHistory'],
    ['reputation', 'reputation'],
    ['artist', 'artistProfile'],
    ['activity', 'lastActiveAt'],
    ['username', 'username'],
  ] as const)('toggle %s unlocks %s and nothing unrelated', (field, key) => {
    const out = projectPublicMember(row({ public_fields: [field] }), full);
    expect(out[key]).toEqual(full[key]);
    if (field !== 'bio') expect(out.bio).toBeNull();
    else expect(out.location).toBeNull();
  });

  it('unlocks one platform at a time', () => {
    const out = projectPublicMember(row({ public_fields: ['x'] }), full);
    expect(out.platforms.x).toBe('alice_x');
    expect(out.platforms.instagram).toBeNull();
    expect(out.platforms.discord).toBeNull();
  });

  it('never exposes login time, other wallets or a field with no rule, even with all on', () => {
    const out = projectPublicMember(row({ public_fields: [...PUBLIC_FIELDS] }), full);
    expect(out.lastLoginAt).toBeNull();
    expect(out.custodyAddress).toBeNull();
    expect(out.solanaWallet).toBeNull();
    expect(out.verifiedAddresses).toEqual([]);
    expect(out.somethingAddedLater).toBeNull();
  });

  it('hides the wallet when the member hid it, including through ENS', () => {
    const out = projectPublicMember(
      row({ hidden_wallets: ['primary_wallet', 'verified_addresses'], public_fields: ['ens'] }),
      full,
    );
    expect(out.primaryWallet).toBeNull();
    expect(out.preferredWallet).toBeNull();
    expect(out.ensNames).toEqual({});
    expect(out.basenames).toEqual({});
  });

  it('does not reveal a preferred wallet from a hidden group', () => {
    const out = projectPublicMember(row({ hidden_wallets: ['verified_addresses'] }), full);
    expect(out.primaryWallet).toBe(WALLET);
    expect(out.preferredWallet).toBeNull();
  });

  it('ignores toggles when there is no name', () => {
    const noName = row({ public_name: '  ', public_fields: ['bio'] });
    expect(hasPublicProfile(noName)).toBe(false);
    expect(hasPublicField(noName, 'bio')).toBe(false);
    expect(isWalletPublic(noName)).toBe(false);
    expect(projectPublicMember(noName, full).bio).toBeNull();
  });
});

describe('applyWalletVisibility', () => {
  it('removes hidden wallets from the member view and leaves the rest', () => {
    const out = applyWalletVisibility(row({ hidden_wallets: ['verified_addresses'] }), full);
    expect(out.preferredWallet).toBeNull();
    expect(out.verifiedAddresses).toEqual([]);
    expect(out.ensNames).toEqual({ [WALLET.toLowerCase()]: 'alice.eth' });
    expect(out.hiddenWallets).toEqual([]);
    expect(out.primaryWallet).toBe(WALLET);
    expect(out.bio).toBe('bio text');
  });
});

describe('memberScope', () => {
  it.each([
    [null, 42, 'public'],
    [undefined, 42, 'public'],
    [{ fid: 42 }, 42, 'full'],
    [{ fid: 9, isAdmin: true }, 42, 'full'],
    [{ fid: 9 }, 42, 'member'],
    [{ fid: 0 }, 0, 'member'],
    [{ fid: 0 }, null, 'member'],
  ])('%j viewing fid %s is %s', (session, fid, expected) => {
    expect(memberScope(session, fid)).toBe(expected);
  });
});

describe('publicProfileUpdateSchema', () => {
  it('trims the name and removes duplicate fields', () => {
    const parsed = publicProfileUpdateSchema.parse({ name: '  Ally ', fields: ['bio', 'bio'] });
    expect(parsed).toEqual({ name: 'Ally', fields: ['bio'] });
  });

  it.each([
    ['missing name', { fields: [] }],
    ['blank name', { name: '   ', fields: [] }],
    ['long name', { name: 'a'.repeat(51), fields: [] }],
    ['control character', { name: 'a\u0007b', fields: [] }],
    ['bidi override', { name: 'a‮b', fields: [] }],
    ['unknown field', { name: 'Ally', fields: ['lastLoginAt'] }],
    ['another fid', { name: 'Ally', fields: [], fid: 99 }],
  ])('rejects %s', (_label, body) => {
    expect(publicProfileUpdateSchema.safeParse(body).success).toBe(false);
  });
});
