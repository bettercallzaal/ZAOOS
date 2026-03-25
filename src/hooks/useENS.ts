'use client';

import { useState, useEffect } from 'react';
import { resolveENSNames, getENSTextRecords } from '@/lib/ens/resolve';

/**
 * Resolve ENS names for a list of ETH addresses.
 * Returns a map of address → ENS name.
 * Uses shared ENS module with Cloudflare RPC + forward verification.
 */
export function useENSNames(addresses: string[]): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (addresses.length === 0) return;
    let cancelled = false;

    resolveENSNames(addresses).then(results => {
      if (!cancelled) setNames(results);
    });

    return () => { cancelled = true; };
  }, [addresses.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return names;
}

/**
 * Resolve ENS text records for a single ENS name.
 * Returns avatar, description, twitter, github, discord, etc.
 */
export function useENSProfile(ensName: string | null): Record<string, string> {
  const [records, setRecords] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ensName) return;
    let cancelled = false;

    getENSTextRecords(ensName).then(results => {
      if (!cancelled) setRecords(results);
    });

    return () => { cancelled = true; };
  }, [ensName]);

  return records;
}
