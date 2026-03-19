/**
 * Hats tree utilities — fetch and structure the ZAO hat tree.
 *
 * Reads tree data from on-chain via the Hats SDK and resolves
 * IPFS details URIs into human-readable hat metadata.
 */

import { getHatsClient } from './client';
import { TREE_ID, HAT_LABELS, formatHatId } from './constants';

// ── Types ──────────────────────────────────────────────────────────

export interface HatNode {
  id: string;
  prettyId: string;
  details: string;
  label: string;
  imageUri: string;
  maxSupply: number;
  supply: number;
  eligibility: string;
  toggle: string;
  isMutable: boolean;
  isActive: boolean;
  children: HatNode[];
  level: number;
  wearers: string[];
}

export interface HatTreeResult {
  treeId: number;
  root: HatNode | null;
  totalHats: number;
  timestamp: number;
}

// ── Cache ──────────────────────────────────────────────────────────

let cache: { data: HatTreeResult; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── IPFS resolution ────────────────────────────────────────────────

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
];

async function resolveIpfsDetails(uri: string): Promise<string> {
  if (!uri || !uri.startsWith('ipfs://')) return uri || '';
  const cid = uri.replace('ipfs://', '');

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const res = await fetch(`${gateway}${cid}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const json = await res.json();
      return json.name || json.description || uri;
    } catch {
      continue;
    }
  }
  return uri;
}

// ── Tree fetching ──────────────────────────────────────────────────

/**
 * Fetch the full ZAO hat tree from on-chain.
 * Returns a hierarchical tree structure with all hats resolved.
 */
export async function fetchHatTree(): Promise<HatTreeResult> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const client = getHatsClient();
  let totalHats = 0;

  async function fetchNode(hatId: bigint, level: number): Promise<HatNode | null> {
    try {
      const hat = await client.viewHat(hatId);
      if (!hat) return null;

      totalHats++;

      // Resolve IPFS details to human-readable name
      const details = typeof hat.details === 'string' ? hat.details : '';
      const resolvedLabel = HAT_LABELS[hatId.toString()] || await resolveIpfsDetails(details) || `Hat ${formatHatId(hatId).slice(0, 10)}...`;

      // Recursively fetch children
      const numChildren = Number(hat.numChildren || 0);
      const children: HatNode[] = [];

      if (numChildren > 0 && level < 4) {
        // Hat ID encoding: each level uses a 16-bit segment
        const shifts = [208, 192, 176, 160].map(BigInt);
        const shift = shifts[level];

        for (let i = 1; i <= numChildren; i++) {
          const childId = hatId | (BigInt(i) << shift);
          const child = await fetchNode(childId, level + 1);
          if (child) children.push(child);
        }
      }

      return {
        id: hatId.toString(),
        prettyId: formatHatId(hatId),
        details,
        label: resolvedLabel,
        imageUri: typeof hat.imageUri === 'string' ? hat.imageUri : '',
        maxSupply: Number(hat.maxSupply || 0),
        supply: Number(hat.supply || 0),
        eligibility: typeof hat.eligibility === 'string' ? hat.eligibility : '',
        toggle: typeof hat.toggle === 'string' ? hat.toggle : '',
        isMutable: Boolean(hat.mutable),
        isActive: Boolean(hat.active),
        children,
        level,
        wearers: [],
      };
    } catch (err) {
      console.error(`[hats] Failed to fetch hat ${formatHatId(hatId)}:`, err);
      return null;
    }
  }

  // Start from the top hat
  const topHatId = BigInt(TREE_ID) << BigInt(224);
  const root = await fetchNode(topHatId, 0);

  const result: HatTreeResult = {
    treeId: TREE_ID,
    root,
    totalHats,
    timestamp: Date.now(),
  };

  cache = { data: result, timestamp: Date.now() };
  return result;
}

/** Clear the tree cache (useful after hat mutations) */
export function clearTreeCache(): void {
  cache = null;
}
