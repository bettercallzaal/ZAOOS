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

// Role-based color mapping for visual distinction
const ROLE_COLORS: Record<string, string> = {
  ZAO: 'bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/20',
  Configurator: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Governance Council': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Governance Council Members': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};
const DEFAULT_ROLE_COLOR = 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/15';

function getRoleColor(label: string): string {
  return ROLE_COLORS[label] || DEFAULT_ROLE_COLOR;
}

type FetchState =
  | { status: 'idle'; roles: HatRole[] }
  | { status: 'loading'; roles: HatRole[] }
  | { status: 'done'; roles: HatRole[] };

export default function HatBadge({ walletAddress, compact = true, maxBadges = 3 }: HatBadgeProps) {
  const isValid = walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
  const initialCached = isValid ? getCached(walletAddress) : null;
  // Determine initial state: cached → done, valid uncached → loading, otherwise idle
  const needsFetch = isValid && !initialCached;
  const [state, setState] = useState<FetchState>(
    initialCached
      ? { status: 'done', roles: initialCached }
      : needsFetch
        ? { status: 'loading', roles: [] }
        : { status: 'idle', roles: [] }
  );

  useEffect(() => {
    if (!isValid || getCached(walletAddress)) return;

    let cancelled = false;

    fetch(`/api/hats/check?wallet=${walletAddress}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const r: HatRole[] = data.roles || [];
        setCache(walletAddress, r);
        setState({ status: 'done', roles: r });
      })
      .catch(() => { if (!cancelled) setState({ status: 'done', roles: [] }); });

    return () => { cancelled = true; };
  }, [walletAddress, isValid]);

  const loading = state.status === 'loading';
  const roles = state.roles;

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
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap ${getRoleColor(role.label)}`}
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
          className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleColor(role.label)}`}
        >
          {role.label}
        </span>
      ))}
    </div>
  );
}
