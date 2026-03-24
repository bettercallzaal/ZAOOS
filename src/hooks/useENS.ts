'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

const ensCache = new Map<string, string | null>();

/**
 * Resolve ENS names for a list of ETH addresses.
 * Returns a map of address → ENS name (or null).
 * Caches results in memory.
 */
export function useENSNames(addresses: string[]): Record<string, string | null> {
  const [names, setNames] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (addresses.length === 0) return;

    const ethAddresses = addresses.filter(
      (a) => a && a.startsWith('0x') && a.length === 42
    );
    if (ethAddresses.length === 0) return;

    let cancelled = false;

    async function resolve() {
      const results: Record<string, string | null> = {};

      for (const addr of ethAddresses) {
        // Check cache first
        if (ensCache.has(addr.toLowerCase())) {
          results[addr.toLowerCase()] = ensCache.get(addr.toLowerCase())!;
          continue;
        }

        try {
          const name = await client.getEnsName({
            address: addr as `0x${string}`,
          });
          ensCache.set(addr.toLowerCase(), name);
          results[addr.toLowerCase()] = name;
        } catch {
          ensCache.set(addr.toLowerCase(), null);
          results[addr.toLowerCase()] = null;
        }
      }

      if (!cancelled) setNames(results);
    }

    resolve();
    return () => { cancelled = true; };
  }, [addresses.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return names;
}
