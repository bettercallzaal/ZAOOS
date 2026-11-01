import { z } from 'zod';

/**
 * Opt-in public member profiles.
 *
 * Rule (Zaal): a public profile needs a name the member picked. The wallet can
 * show and is controlled by the existing hidden_wallets setting. Every other
 * field stays hidden until the member turns it on. A member with no public name
 * has no public profile at all.
 */
export const PUBLIC_FIELDS = [
  'username',
  'avatar',
  'real_name',
  'bio',
  'location',
  'website',
  'tags',
  'x',
  'instagram',
  'bluesky',
  'soundcloud',
  'spotify',
  'audius',
  'discord',
  'ens',
  'farcaster',
  'membership',
  'respect',
  'reputation',
  'artist',
  'activity',
] as const;

export type PublicField = (typeof PUBLIC_FIELDS)[number];

export const publicNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  // Control characters and bidi overrides could disguise a name.
  .regex(/^[^\p{Cc}‪-‮⁦-⁩]+$/u);

export const publicProfileUpdateSchema = z
  .object({
    name: publicNameSchema,
    fields: z
      .array(z.enum(PUBLIC_FIELDS))
      .max(PUBLIC_FIELDS.length * 2)
      .transform((fields) => [...new Set(fields)]),
  })
  .strict();

export interface PublicProfileRow {
  public_name?: string | null;
  public_fields?: readonly string[] | null;
  hidden_wallets?: readonly string[] | null;
  primary_wallet?: string | null;
  custody_address?: string | null;
  verified_addresses?: readonly string[] | null;
}

export type MemberScope = 'full' | 'member' | 'public';

/** Scope comes only from the server session, never from the request. */
export function memberScope(
  session: { fid?: number; isAdmin?: boolean } | null | undefined,
  memberFid?: number | null,
): MemberScope {
  if (!session) return 'public';
  if (session.isAdmin) return 'full';
  if (session.fid && memberFid && session.fid === memberFid) return 'full';
  return 'member';
}

export function hasPublicProfile(row: PublicProfileRow | null | undefined): boolean {
  return typeof row?.public_name === 'string' && row.public_name.trim().length > 0;
}

export function hasPublicField(
  row: PublicProfileRow | null | undefined,
  field: PublicField,
): boolean {
  return hasPublicProfile(row) && (row?.public_fields ?? []).includes(field);
}

function isSameAddress(a: string | null | undefined, b: string | null | undefined) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

function isAddressHidden(row: PublicProfileRow, address: string) {
  const hidden = row.hidden_wallets ?? [];
  if (hidden.includes('primary_wallet') && isSameAddress(row.primary_wallet, address)) return true;
  if (hidden.includes('custody_address') && isSameAddress(row.custody_address, address)) {
    return true;
  }
  const isVerified = (row.verified_addresses ?? []).some((v) => isSameAddress(v, address));
  return (
    isVerified &&
    (hidden.includes('verified_addresses') || hidden.includes(`verified_${address.toLowerCase()}`))
  );
}

export function isWalletPublic(row: PublicProfileRow | null | undefined): boolean {
  if (!row || !hasPublicProfile(row) || !row.primary_wallet) return false;
  return !isAddressHidden(row, row.primary_wallet);
}

function filterByAddress(value: unknown, keep: (address: string) => boolean) {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).filter(([address]) => keep(address)));
}

/** Response keys a toggle unlocks. Any key not listed here is denied by default. */
const KEY_RULES: Record<string, PublicField> = {
  pfpUrl: 'avatar',
  realName: 'real_name',
  bio: 'bio',
  location: 'location',
  website: 'website',
  tags: 'tags',
  ensName: 'ens',
  ensAvatar: 'ens',
  ensProfile: 'ens',
  fid: 'farcaster',
  social: 'farcaster',
  farcasterRegisteredAt: 'farcaster',
  zid: 'membership',
  tier: 'membership',
  role: 'membership',
  zaoSubname: 'membership',
  respect: 'respect',
  fractalHistory: 'respect',
  events: 'respect',
  reputation: 'reputation',
  artistProfile: 'artist',
  coverImageUrl: 'artist',
  lastActiveAt: 'activity',
  createdAt: 'activity',
};

const PLATFORMS: readonly PublicField[] = [
  'x',
  'instagram',
  'bluesky',
  'soundcloud',
  'spotify',
  'audius',
  'discord',
];

/**
 * Reduce a full member record to what a member opted in to. Default deny: a key
 * added to the record later stays hidden until it gets a rule above. Keys keep
 * their place with an empty value so existing clients render without changes.
 */
export function projectPublicMember<T extends object>(row: PublicProfileRow, full: T): T {
  const source = full as Record<string, unknown>;
  const walletPublic = isWalletPublic(row);
  const preferred = typeof source.preferredWallet === 'string' ? source.preferredWallet : null;
  const preferredPublic = walletPublic && !!preferred && !isAddressHidden(row, preferred);

  const visibleWallets = new Set<string>();
  if (walletPublic && row.primary_wallet) visibleWallets.add(row.primary_wallet.toLowerCase());
  if (preferredPublic && preferred) visibleWallets.add(preferred.toLowerCase());
  const keepWallet = (address: string) => visibleWallets.has(address.toLowerCase());

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    const rule = KEY_RULES[key];
    if (rule && hasPublicField(row, rule)) output[key] = value;
    else output[key] = Array.isArray(value) ? [] : null;
  }

  if ('id' in source) output.id = source.id;
  if ('displayName' in source) output.displayName = row.public_name?.trim() ?? null;
  if ('username' in source) {
    output.username = hasPublicField(row, 'username') ? source.username : null;
  }
  if ('primaryWallet' in source) output.primaryWallet = walletPublic ? row.primary_wallet : null;
  if ('preferredWallet' in source) output.preferredWallet = preferredPublic ? preferred : null;
  if ('hiddenWallets' in source) output.hiddenWallets = [];

  const ensOn = hasPublicField(row, 'ens');
  if ('ensNames' in source) {
    output.ensNames = ensOn ? filterByAddress(source.ensNames, keepWallet) : {};
  }
  if ('basenames' in source) {
    output.basenames = ensOn ? filterByAddress(source.basenames, keepWallet) : {};
  }

  if ('platforms' in source) {
    const platforms = (source.platforms ?? {}) as Record<string, unknown>;
    output.platforms = Object.fromEntries(
      PLATFORMS.map((platform) => [
        platform,
        hasPublicField(row, platform) ? (platforms[platform] ?? null) : null,
      ]),
    );
  }

  return output as T;
}

/**
 * Signed-in members keep the community view, but a wallet the member hid stays
 * hidden on the server rather than relying on the client to drop it.
 */
export function applyWalletVisibility<T extends object>(row: PublicProfileRow, full: T): T {
  const source = full as Record<string, unknown>;
  const output: Record<string, unknown> = { ...source };
  const keep = (address: string) => !isAddressHidden(row, address);

  for (const key of ['primaryWallet', 'preferredWallet', 'custodyAddress']) {
    const value = source[key];
    if (typeof value === 'string' && !keep(value)) output[key] = null;
  }
  if (Array.isArray(source.verifiedAddresses)) {
    output.verifiedAddresses = (source.verifiedAddresses as string[]).filter(keep);
  }
  if ('ensNames' in source) output.ensNames = filterByAddress(source.ensNames, keep);
  if ('basenames' in source) output.basenames = filterByAddress(source.basenames, keep);
  if ('hiddenWallets' in source) output.hiddenWallets = [];
  return output as T;
}

/** The migration has not been applied yet: Postgres or PostgREST cannot see the column. */
export function isPublicProfileColumnMissing(error: { code?: string } | null | undefined): boolean {
  return error?.code === '42703' || error?.code === 'PGRST204';
}
