'use client';

import { useState, useEffect } from 'react';

/**
 * Resolve ENS names for a list of ETH addresses via server-side API.
 * Uses /api/ens which has Alchemy RPC (no CORS issues, key protected).
 */
export function useENSNames(addresses: string[]): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ethAddresses = addresses.filter(a => a && a.startsWith('0x') && a.length === 42);
    if (ethAddresses.length === 0) return;

    let cancelled = false;

    fetch(`/api/ens?addresses=${ethAddresses.join(',')}`)
      .then(r => r.ok ? r.json() : { names: {} })
      .then(data => {
        if (!cancelled) setNames(data.names || {});
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [addresses.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return names;
}

/**
 * Resolve ENS text records for a single ENS name via server-side API.
 */
export function useENSProfile(ensName: string | null): {
  records: Record<string, string>;
  avatar: string | null;
} {
  const [data, setData] = useState<{ records: Record<string, string>; avatar: string | null }>({
    records: {},
    avatar: null,
  });

  useEffect(() => {
    if (!ensName) return;
    let cancelled = false;

    fetch(`/api/ens?name=${encodeURIComponent(ensName)}`)
      .then(r => r.ok ? r.json() : { records: {}, avatar: null })
      .then(d => {
        if (!cancelled) setData({ records: d.records || {}, avatar: d.avatar || null });
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [ensName]);

  return data;
}
