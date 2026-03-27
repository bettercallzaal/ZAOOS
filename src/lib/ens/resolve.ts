/**
 * ENS resolution utilities — shared between client hooks and server API routes.
 * Uses Cloudflare ETH RPC with fallback chain for reliability.
 */

import { createPublicClient, http, fallback, type Address } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

// Alchemy as primary (supports ENS Universal Resolver), public RPCs as fallback
const ensClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    ...(process.env.ALCHEMY_API_KEY
      ? [http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)]
      : []),
    http('https://eth.llamarpc.com'),
    http('https://ethereum-rpc.publicnode.com'),
  ]),
});

// In-memory cache (survives across calls in the same process)
const nameCache = new Map<string, string | null>();
const textCache = new Map<string, string | null>();

/**
 * Reverse-resolve an ETH address to its ENS primary name.
 * Includes forward verification to prevent spoofed records.
 */
export async function resolveENSName(address: string): Promise<string | null> {
  const key = address.toLowerCase();
  if (nameCache.has(key)) return nameCache.get(key)!;

  try {
    const name = await ensClient.getEnsName({ address: key as Address });
    if (!name) {
      nameCache.set(key, null);
      return null;
    }

    // Forward verification — confirm the name resolves back to this address
    const resolvedAddr = await ensClient.getEnsAddress({ name: normalize(name) });
    if (resolvedAddr?.toLowerCase() !== key) {
      nameCache.set(key, null);
      return null;
    }

    nameCache.set(key, name);
    return name;
  } catch {
    nameCache.set(key, null);
    return null;
  }
}

/**
 * Resolve ENS names for multiple addresses. Returns a map of address → name.
 */
export async function resolveENSNames(addresses: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(
    addresses.filter(a => a && a.startsWith('0x') && a.length === 42).map(a => a.toLowerCase())
  )];

  const results: Record<string, string> = {};

  for (const addr of unique.slice(0, 10)) {
    const name = await resolveENSName(addr);
    if (name) results[addr] = name;
  }

  return results;
}

/**
 * Read ENS text records for a name (avatar, description, socials, etc.)
 */
export async function getENSTextRecords(name: string): Promise<Record<string, string>> {
  const keys = ['avatar', 'description', 'url', 'com.twitter', 'com.github', 'com.discord', 'org.telegram', 'email'];
  const records: Record<string, string> = {};

  const normalizedName = normalize(name);

  for (const key of keys) {
    const cacheKey = `${normalizedName}:${key}`;
    if (textCache.has(cacheKey)) {
      const val = textCache.get(cacheKey);
      if (val) records[key] = val;
      continue;
    }

    try {
      const value = await ensClient.getEnsText({ name: normalizedName, key });
      textCache.set(cacheKey, value);
      if (value) records[key] = value;
    } catch {
      textCache.set(cacheKey, null);
    }
  }

  return records;
}

/**
 * Get ENS avatar URL for a name.
 */
export async function getENSAvatar(name: string): Promise<string | null> {
  try {
    const avatar = await ensClient.getEnsAvatar({ name: normalize(name) });
    return avatar;
  } catch {
    return null;
  }
}

/**
 * Full ENS profile for a single address — name + text records + avatar.
 */
export async function getFullENSProfile(address: string): Promise<{
  name: string | null;
  avatar: string | null;
  records: Record<string, string>;
} | null> {
  const name = await resolveENSName(address);
  if (!name) return null;

  const [records, avatar] = await Promise.all([
    getENSTextRecords(name),
    getENSAvatar(name),
  ]);

  return { name, avatar, records };
}

// ── Basenames (Base chain ENS) ──

import { base } from 'viem/chains';

const baseClient = createPublicClient({
  chain: base,
  transport: fallback([
    ...(process.env.ALCHEMY_API_KEY
      ? [http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)]
      : []),
    http('https://mainnet.base.org'),
    http('https://base-rpc.publicnode.com'),
  ]),
});

const BASENAMES_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const;

const basenameCache = new Map<string, string | null>();

/**
 * Reverse-resolve a Base address to its Basename (.base.eth).
 * Uses L2 Reverse Registrar on Base chain.
 */
export async function resolveBasename(address: string): Promise<string | null> {
  const key = address.toLowerCase();
  if (basenameCache.has(key)) return basenameCache.get(key)!;

  try {
    // Base uses the standard ENS reverse resolution on L2
    const name = await baseClient.getEnsName({
      address: key as Address,
      universalResolverAddress: BASENAMES_RESOLVER,
    });

    if (!name) {
      basenameCache.set(key, null);
      return null;
    }

    basenameCache.set(key, name);
    return name;
  } catch {
    basenameCache.set(key, null);
    return null;
  }
}

/**
 * Resolve Basenames for multiple addresses. Returns a map of address → name.
 */
export async function resolveBasenames(addresses: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(
    addresses.filter(a => a && a.startsWith('0x') && a.length === 42).map(a => a.toLowerCase())
  )];

  const results: Record<string, string> = {};

  for (const addr of unique.slice(0, 10)) {
    const name = await resolveBasename(addr);
    if (name) results[addr] = name;
  }

  return results;
}
