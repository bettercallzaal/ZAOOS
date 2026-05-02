'use client';

import { useEffect, useState } from 'react';
import { useEscapeClose } from '@/hooks/useEscapeClose';
import type {
  AddressStatsResponse,
  Booster,
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardSlot,
} from '@/lib/empire-builder/types';
import { LEADERBOARD_TYPE_LABELS } from '@/lib/empire-builder/types';
import { ZABAL_OWNER } from '@/lib/empire-builder/config';

type Tab = 'leaderboard' | 'you' | 'boosters';

interface EmpirePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeaderboardApiResponse {
  success: boolean;
  data?: {
    slots: Array<{ index: number; id: string; name?: string; type?: string }>;
    active: { index: number; id: string };
    leaderboard: LeaderboardResponse | null;
  };
  error?: string;
}

interface MeApiResponse {
  success: boolean;
  data?: {
    wallet: string | null;
    slot?: { id: string; name?: string };
    entry: AddressStatsResponse['entry'] | null;
    boosters: Booster[];
  };
  error?: string;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function EmpirePanel({ isOpen, onClose }: EmpirePanelProps) {
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [slots, setSlots] = useState<Array<{ index: number; id: string; name?: string; type?: string }>>([]);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [me, setMe] = useState<MeApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEscapeClose(onClose, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/empire-builder/leaderboard?slot=${activeSlot}`).then(
        (r) => r.json() as Promise<LeaderboardApiResponse>,
      ),
      fetch(`/api/empire-builder/me?slot=${activeSlot}`).then(
        (r) => r.json() as Promise<MeApiResponse>,
      ),
    ])
      .then(([boardRes, meRes]) => {
        if (cancelled) return;
        if (boardRes.success && boardRes.data) {
          setSlots(boardRes.data.slots);
          setBoard(boardRes.data.leaderboard);
        } else {
          setError('Could not load Empire Builder leaderboard');
        }
        if (meRes.success && meRes.data) setMe(meRes.data);
      })
      .catch(() => {
        if (!cancelled) setError('Network error reaching Empire Builder');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeSlot]);

  if (!isOpen) return null;

  const entries = board?.entries ?? [];
  const activeSlotInfo: LeaderboardSlot | null = board?.leaderboard ?? null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0a1628] z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0d1b2a] flex-shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close empire panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm text-gray-300">ZABAL Empire</h2>
            <p className="text-[10px] text-gray-500">
              Empire Builder V3 - {activeSlotInfo?.name ?? 'Leaderboard'}
            </p>
          </div>
          <a
            href="https://www.empirebuilder.world/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#f5a623]/70 hover:text-[#f5a623]"
          >
            Open
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-white/[0.08] bg-[#0d1b2a] flex-shrink-0">
          {(
            [
              { id: 'leaderboard' as const, label: 'Leaderboard' },
              { id: 'you' as const, label: 'You' },
              { id: 'boosters' as const, label: 'Boosters' },
            ]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Slot selector */}
        {slots.length > 1 && (
          <div className="flex gap-1 px-3 py-2 border-b border-white/[0.08] bg-[#0d1b2a] flex-shrink-0 overflow-x-auto">
            {slots.map((s) => {
              const typeLabel = s.type ? LEADERBOARD_TYPE_LABELS[s.type] ?? s.type : null;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSlot(s.index)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    s.index === activeSlot
                      ? 'bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30'
                      : 'bg-[#1a2a3a] text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{s.name ?? s.type ?? `Slot ${s.index + 1}`}</span>
                  {typeLabel && (
                    <span className="text-[8px] opacity-60 uppercase tracking-wider">
                      {typeLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : tab === 'leaderboard' ? (
            <LeaderboardTab entries={entries} myWallet={me?.wallet ?? null} />
          ) : tab === 'you' ? (
            <YouTab data={me ?? null} />
          ) : (
            <BoostersTab boosters={me?.boosters ?? []} />
          )}

          <p className="text-[10px] text-gray-600 text-center pt-2">
            Live from Empire Builder V3. Cached 60s.
          </p>
        </div>
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-400">Loading Empire Builder data...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-red-400 text-sm">{message}</p>
      <p className="text-[10px] text-gray-600 mt-2">
        V3 just launched - retry in a moment or open empirebuilder.world directly.
      </p>
    </div>
  );
}

function LeaderboardTab({
  entries,
  myWallet,
}: {
  entries: LeaderboardEntry[];
  myWallet: string | null;
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-gray-400">No entries yet on this leaderboard.</p>
      </div>
    );
  }

  const myAddr = myWallet?.toLowerCase() ?? null;

  return (
    <div className="space-y-2">
      {entries.slice(0, 50).map((entry) => {
        const isMe = myAddr && entry.address.toLowerCase() === myAddr;
        const isOwner = entry.address.toLowerCase() === ZABAL_OWNER.toLowerCase();
        return (
          <div
            key={entry.address}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              isMe
                ? 'bg-[#f5a623]/10 border-[#f5a623]/30'
                : entry.rank <= 3
                ? 'bg-[#f5a623]/5 border-[#f5a623]/20'
                : 'bg-[#0d1b2a] border-white/[0.08]'
            }`}
          >
            <span className="text-sm font-bold w-8 text-center text-gray-300">#{entry.rank}</span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  isMe ? 'text-[#f5a623]' : 'text-white'
                }`}
              >
                {entry.farcaster_username
                  ? `@${entry.farcaster_username}`
                  : shortAddress(entry.address)}
                {isMe && ' (you)'}
                {isOwner && (
                  <span className="ml-1.5 text-[8px] uppercase tracking-wider text-[#f5a623]/70 align-middle">
                    owner
                  </span>
                )}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{shortAddress(entry.address)}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                {formatNumber(entry.points ?? entry.score ?? 0)}
              </p>
              <p className="text-[10px] text-gray-500">
                {entry.totalRewards
                  ? formatUsd(entry.totalRewards)
                  : entry.score && entry.points
                  ? `${(entry.points / Math.max(entry.score, 1)).toFixed(2)}x boost`
                  : 'no rewards yet'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function YouTab({ data }: { data: MeApiResponse['data'] | null }) {
  if (!data || !data.wallet) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] text-center">
        <p className="text-sm text-gray-400">
          Connect your wallet to see your Empire Builder rank, boosters, and lifetime rewards.
        </p>
      </div>
    );
  }

  if (!data.entry) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] text-center">
        <p className="text-sm text-gray-400">
          Wallet {shortAddress(data.wallet)} is not on this leaderboard yet.
        </p>
        <a
          href="https://www.empirebuilder.world/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#f5a623] hover:text-[#ffd700] mt-3 inline-block"
        >
          Stake or hold ZABAL to qualify
        </a>
      </div>
    );
  }

  const entry = data.entry;
  const score = entry.score ?? 0;
  const points = entry.points ?? 0;
  const boost = score > 0 ? points / score : 0;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30">
        <p className="text-xs text-[#f5a623] uppercase tracking-wider mb-3">Your ZABAL Empire</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-white">{formatNumber(points)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatNumber(score)} score, {boost.toFixed(2)}x boost
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-[#f5a623]">#{entry.rank}</p>
            <p className="text-xs text-gray-400">your rank</p>
          </div>
        </div>
      </div>

      {entry.totalRewards !== undefined && entry.totalRewards > 0 && (
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Lifetime Rewards</p>
          <p className="text-2xl font-bold text-white">{formatUsd(entry.totalRewards)}</p>
          <p className="text-[10px] text-gray-500 mt-1">USD across all distributions to this address</p>
        </div>
      )}
    </div>
  );
}

function BoostersTab({ boosters }: { boosters: Booster[] }) {
  if (boosters.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-gray-400">No boosters surfaced for your wallet.</p>
        <p className="text-[10px] text-gray-600 mt-2">
          Boosters multiply your leaderboard score. Hold qualifying NFTs or tokens to unlock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {boosters.map((b, i) => (
        <div
          key={`${b.contractAddress ?? 'booster'}-${i}`}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            b.qualified
              ? 'bg-[#f5a623]/5 border-[#f5a623]/30'
              : 'bg-[#0d1b2a] border-white/[0.08]'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-[#1a2a3a] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#f5a623]">
              {b.multiplier ? `${b.multiplier}x` : b.type.slice(0, 3)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {b.token_symbol ?? b.type}
              <span className="ml-2 text-[10px] text-gray-500 uppercase">{b.type}</span>
            </p>
            {b.contractAddress && (
              <p className="text-[10px] text-gray-500 truncate">{shortAddress(b.contractAddress)}</p>
            )}
          </div>
          <span
            className={`text-[10px] font-medium px-2 py-1 rounded-full ${
              b.qualified
                ? 'bg-[#f5a623]/15 text-[#f5a623]'
                : 'bg-white/5 text-gray-500'
            }`}
          >
            {b.qualified ? 'qualified' : 'locked'}
          </span>
        </div>
      ))}
    </div>
  );
}
