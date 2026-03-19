'use client';

import { useEffect, useState } from 'react';

interface HatRole {
  hatId: string;
  label: string;
}

interface HatBadgeProps {
  /** Wallet address to check for hat roles */
  walletAddress: string;
  /** Show compact single-line badges (default) or expanded list */
  compact?: boolean;
  /** Max badges to show before "+N more" (default: 3) */
  maxBadges?: number;
}

// Simple in-memory cache to avoid re-fetching for the same wallet
const roleCache = new Map<string, { roles: HatRole[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(wallet: string): HatRole[] | null {
  const entry = roleCache.get(wallet.toLowerCase());
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.roles;
  return null;
}

function setCache(wallet: string, roles: HatRole[]) {
  roleCache.set(wallet.toLowerCase(), { roles, ts: Date.now() });
}

export default function HatBadge({ walletAddress, compact = true, maxBadges = 3 }: HatBadgeProps) {
  const [roles, setRoles] = useState<HatRole[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return;

    const cached = getCached(walletAddress);
    if (cached) {
      setRoles(cached);
      return;
    }

    setLoading(true);
    fetch(`/api/hats/check?wallet=${walletAddress}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        const r: HatRole[] = data.roles || [];
        setRoles(r);
        setCache(walletAddress, r);
      })
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  if (loading) {
    return (
      <span className="inline-block w-12 h-4 bg-white/5 rounded animate-pulse" />
    );
  }

  if (roles.length === 0) return null;

  const visible = roles.slice(0, maxBadges);
  const remaining = roles.length - maxBadges;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 flex-wrap">
        {visible.map((role) => (
          <span
            key={role.hatId}
            className="px-1.5 py-0.5 bg-[#f5a623]/10 text-[#f5a623] text-[10px] font-medium rounded-full whitespace-nowrap"
            title={role.label}
          >
            {role.label}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] text-gray-500">+{remaining}</span>
        )}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <span
          key={role.hatId}
          className="px-2 py-0.5 bg-[#f5a623]/10 text-[#f5a623] text-xs font-medium rounded-full"
        >
          {role.label}
        </span>
      ))}
    </div>
  );
}
