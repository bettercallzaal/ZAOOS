import { type Address, createPublicClient, fallback, http, isAddress } from 'viem';
import { base } from 'viem/chains';

/**
 * Unlock Protocol key-ownership reads on Base.
 *
 * No new dependency: an Unlock "lock" is a PublicLock ERC-721 contract, and the
 * single view we need (`getHasValidKey`) is read with plain viem. Locks are
 * created via EVENTS by Unlock Labs (events.unlock-protocol.com); we only read
 * them here for gating. See research doc 863.
 */

// Mirrors the Base public client in src/lib/ens/resolve.ts
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

// Minimal PublicLock ABI - only the view we read.
const PUBLIC_LOCK_ABI = [
  {
    inputs: [{ name: '_user', type: 'address' }],
    name: 'getHasValidKey',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/** True if `wallet` holds a valid (non-expired) key for the lock. */
export async function hasValidKey(lockAddress: string, wallet: string): Promise<boolean> {
  if (!isAddress(lockAddress) || !isAddress(wallet)) return false;
  try {
    return await baseClient.readContract({
      address: lockAddress as Address,
      abi: PUBLIC_LOCK_ABI,
      functionName: 'getHasValidKey',
      args: [wallet as Address],
    });
  } catch {
    // Contract read failure (bad address, RPC hiccup) = treat as "no key".
    return false;
  }
}

/**
 * Check a set of wallets against one lock. Returns the first address that holds
 * a valid key, or null. Fault-tolerant: one bad read does not fail the batch.
 */
export async function findKeyHolder(
  lockAddress: string,
  wallets: string[],
): Promise<string | null> {
  const candidates = wallets.filter((w) => isAddress(w));
  if (!isAddress(lockAddress) || candidates.length === 0) return null;

  const results = await Promise.allSettled(
    candidates.map(async (w) => ((await hasValidKey(lockAddress, w)) ? w : null)),
  );

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) return r.value;
  }
  return null;
}
