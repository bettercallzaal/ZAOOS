'use client';

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { AllowlistEntry } from '@/types';

interface SearchUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verified_addresses: string[];
  ens: Record<string, string>;
}

export const AllowlistTable = forwardRef(function AllowlistTable(_props, ref) {
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Farcaster search state
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [fcSearch, setFcSearch] = useState('');
  const [fcResults, setFcResults] = useState<SearchUser[]>([]);
  const [fcLoading, setFcLoading] = useState(false);
  const [addingFid, setAddingFid] = useState<number | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEntries = useCallback(async () => {
    const res = await fetch('/api/admin/allowlist');
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries || []);
    }
    setLoading(false);
  }, []);

  useImperativeHandle(ref, () => ({ refetch: fetchEntries }));

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, msg });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 3000);
  };

  // Cleanup feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // ── Farcaster User Search ──────────────────────────────────────────────────

  const [fcError, setFcError] = useState<string | null>(null);

  const searchFarcaster = useCallback(async (q: string) => {
    if (q.length < 1) {
      setFcResults([]);
      setFcError(null);
      return;
    }
    setFcLoading(true);
    setFcError(null);
    try {
      const res = await fetch(`/api/admin/search-users?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setFcResults(data.users || []);
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('[Admin Search] API error:', res.status, data);
        setFcError(data.error || `Search failed (${res.status})`);
        setFcResults([]);
      }
    } catch (err) {
      console.error('[Admin Search] Network error:', err);
      setFcError('Network error — check console');
      setFcResults([]);
    } finally {
      setFcLoading(false);
    }
  }, []);

  const handleFcSearchChange = (val: string) => {
    setFcSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFarcaster(val), 400);
  };

  const handleAddFromSearch = async (user: SearchUser) => {
    setAddingFid(user.fid);
    try {
      // Use custody address as primary wallet, or first verified address
      const primaryWallet = user.custody_address || user.verified_addresses?.[0] || '';
      // Get ENS name if available
      const ensName = Object.values(user.ens || {})[0] || '';

      const res = await fetch('/api/admin/allowlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          ign: user.display_name || user.username,
          display_name: user.display_name,
          pfp_url: user.pfp_url,
          username: user.username,
          wallet_address: primaryWallet || undefined,
          custody_address: user.custody_address || undefined,
          verified_addresses: user.verified_addresses,
          ens_name: ensName || undefined,
        }),
      });
      if (res.ok) {
        showFeedback('success', `Added ${user.display_name || user.username}`);
        fetchEntries();
        // Remove from search results
        setFcResults((prev) => prev.filter((u) => u.fid !== user.fid));
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Failed to add');
      }
    } catch {
      showFeedback('error', 'Failed to add');
    } finally {
      setAddingFid(null);
    }
  };

  // ── Remove ─────────────────────────────────────────────────────────────────

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name || 'this entry'}?`)) return;
    const res = await fetch('/api/admin/allowlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showFeedback('success', 'Member removed');
      fetchEntries();
    } else {
      showFeedback('error', 'Failed to remove');
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.ign?.toLowerCase().includes(q) ||
      e.real_name?.toLowerCase().includes(q) ||
      e.display_name?.toLowerCase().includes(q) ||
      e.username?.toLowerCase().includes(q) ||
      e.wallet_address?.toLowerCase().includes(q) ||
      e.ens_name?.toLowerCase().includes(q) ||
      String(e.fid).includes(q)
    );
  });

  // ── Backfill ─────────────────────────────────────────────────────────────
  const [backfilling, setBackfilling] = useState(false);

  const runBackfill = async () => {
    setBackfilling(true);
    try {
      const res = await fetch('/api/admin/backfill', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', data.message);
        fetchEntries(); // Refresh the table
      } else {
        showFeedback('error', data.error || 'Backfill failed');
      }
    } catch {
      showFeedback('error', 'Backfill request failed');
    } finally {
      setBackfilling(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const withFid = entries.filter((e) => e.fid).length;
  const withEns = entries.filter((e) => e.ens_name).length;
  const missingFid = entries.length - withFid;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const alreadyAdded = new Set(entries.map((e) => e.fid).filter(Boolean));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-[70] px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
            feedback.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{entries.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Members</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#f5a623]">{withFid}</p>
          <p className="text-xs text-gray-400 mt-1">Linked FIDs</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-400">{withEns}</p>
          <p className="text-xs text-gray-400 mt-1">ENS Names</p>
        </div>
      </div>

      {/* Backfill button — only show if entries are missing FIDs */}
      {missingFid > 0 && (
        <button
          onClick={runBackfill}
          disabled={backfilling}
          className="mb-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors disabled:opacity-50"
        >
          {backfilling ? (
            <>
              <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
              Backfilling from Neynar...
            </>
          ) : (
            <>Backfill {missingFid} entries missing FIDs from Farcaster</>
          )}
        </button>
      )}

      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter members..."
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />
        </div>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
            showAddPanel
              ? 'bg-gray-700 text-gray-300'
              : 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
          }`}
        >
          {showAddPanel ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {/* ── Farcaster User Search Panel ─────────────────────────────────────── */}
      {showAddPanel && (
        <div className="bg-[#1a2a3a] rounded-xl p-4 mb-4 border border-white/[0.08]">
          <p className="text-sm font-medium text-gray-300 mb-3">Search Farcaster Users</p>
          <input
            value={fcSearch}
            onChange={(e) => handleFcSearchChange(e.target.value)}
            placeholder="Search by username..."
            autoFocus
            className="w-full bg-[#0a1628] text-white text-sm rounded-lg px-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] mb-3"
          />

          {fcLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!fcLoading && fcResults.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {fcResults.map((user) => {
                const isAdded = alreadyAdded.has(user.fid);
                const primaryEns = Object.values(user.ens || {})[0];
                return (
                  <div
                    key={user.fid}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#0a1628] border border-white/[0.08]"
                  >
                    {/* Avatar */}
                    {user.pfp_url ? (
                      <Image src={user.pfp_url} alt={`${user.display_name || user.username || 'User'} avatar`} width={40} height={40} className="rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {user.display_name || user.username}
                        </span>
                        <span className="text-xs text-gray-500">@{user.username}</span>
                        <span className="text-[10px] text-gray-600 font-mono">FID:{user.fid}</span>
                      </div>

                      {/* Wallets */}
                      <div className="mt-1.5 space-y-1">
                        {user.custody_address && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">Farcaster</span>
                            <span className="text-xs text-gray-400 font-mono">{shortAddr(user.custody_address)}</span>
                            {user.ens[user.custody_address.toLowerCase()] && (
                              <span className="text-[10px] text-purple-400">{user.ens[user.custody_address.toLowerCase()]}</span>
                            )}
                          </div>
                        )}
                        {user.verified_addresses.map((addr) => (
                          <div key={addr} className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">Verified</span>
                            <span className="text-xs text-gray-400 font-mono">{shortAddr(addr)}</span>
                            {user.ens[addr.toLowerCase()] && (
                              <span className="text-[10px] text-purple-400">{user.ens[addr.toLowerCase()]}</span>
                            )}
                          </div>
                        ))}
                        {primaryEns && !user.custody_address && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">ENS</span>
                            <span className="text-xs text-purple-300">{primaryEns}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => handleAddFromSearch(user)}
                      disabled={isAdded || addingFid === user.fid}
                      className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        isAdded
                          ? 'bg-green-500/10 text-green-400 cursor-default'
                          : addingFid === user.fid
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
                      }`}
                    >
                      {isAdded ? 'Added' : addingFid === user.fid ? '...' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!fcLoading && fcSearch.length >= 1 && fcResults.length === 0 && (
            <div className="text-center py-4">
              <p className={`text-sm ${fcError ? 'text-red-400' : 'text-gray-500'}`}>
                {fcError || `No Farcaster users found for "${fcSearch}"`}
              </p>
              {fcError && (
                <p className="text-xs text-gray-600 mt-1">
                  Try again in a moment - the Farcaster API may be temporarily unavailable
                </p>
              )}
              {!fcError && (
                <p className="text-xs text-gray-600 mt-1">
                  Try the full username (e.g. &quot;dwr.eth&quot; not &quot;Dan&quot;) or search by FID
                </p>
              )}
            </div>
          )}

          {!fcLoading && fcSearch.length < 1 && (
            <p className="text-xs text-gray-600 text-center py-2">
              Type a Farcaster username to search
            </p>
          )}
        </div>
      )}

      {/* Results count */}
      {search && (
        <p className="text-xs text-gray-500 mb-2">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* ── Member Cards ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-[#1a2a3a] rounded-xl py-8 text-center text-gray-500">
            {search ? 'No members match your search' : 'No members yet'}
          </div>
        ) : (
          filtered.map((entry) => {
            const isExpanded = expandedEntry === entry.id;
            const name = entry.display_name || entry.ign || entry.real_name || entry.username || '-';
            return (
              <div
                key={entry.id}
                className="bg-[#1a2a3a] rounded-xl overflow-hidden border border-white/[0.08]"
              >
                {/* Main row */}
                <button
                  onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  {/* Avatar */}
                  {entry.pfp_url ? (
                    <Image src={entry.pfp_url} alt={`${name} avatar`} width={32} height={32} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Name + username */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{name}</span>
                      {entry.username && (
                        <span className="text-xs text-gray-500 truncate">@{entry.username}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.fid && (
                        <span className="text-[10px] text-gray-600 font-mono">FID:{entry.fid}</span>
                      )}
                      {entry.ens_name && (
                        <span className="text-[10px] text-purple-400">{entry.ens_name}</span>
                      )}
                      {entry.wallet_address && !entry.ens_name && (
                        <span className="text-[10px] text-gray-600 font-mono">{shortAddr(entry.wallet_address)}</span>
                      )}
                    </div>
                  </div>

                  {/* Expand arrow */}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.08]">
                    <div className="mt-3 space-y-2">
                      {/* Farcaster wallet (custody) */}
                      {entry.custody_address && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium w-16 text-center">Farcaster</span>
                          <span className="text-xs text-gray-300 font-mono flex-1">{entry.custody_address}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(entry.custody_address!)}
                            className="text-gray-500 hover:text-white text-xs"
                            title="Copy"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Primary wallet */}
                      {entry.wallet_address && entry.wallet_address !== entry.custody_address && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] font-medium w-16 text-center">Primary</span>
                          <span className="text-xs text-gray-300 font-mono flex-1">{entry.wallet_address}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(entry.wallet_address!)}
                            className="text-gray-500 hover:text-white text-xs"
                            title="Copy"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Verified addresses */}
                      {entry.verified_addresses && entry.verified_addresses.length > 0 && (
                        <>
                          {entry.verified_addresses
                            .filter((a) => a !== entry.custody_address && a !== entry.wallet_address)
                            .map((addr) => (
                              <div key={addr} className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium w-16 text-center">Verified</span>
                                <span className="text-xs text-gray-300 font-mono flex-1">{addr}</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(addr)}
                                  className="text-gray-500 hover:text-white text-xs"
                                  title="Copy"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                        </>
                      )}

                      {/* ZAO XMTP wallet */}
                      {entry.xmtp_address && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] font-medium w-16 text-center">ZAO</span>
                          <span className="text-xs text-gray-300 font-mono flex-1">{entry.xmtp_address}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(entry.xmtp_address!)}
                            className="text-gray-500 hover:text-white text-xs"
                            title="Copy"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* ENS */}
                      {entry.ens_name && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium w-16 text-center">ENS</span>
                          <span className="text-xs text-purple-300">{entry.ens_name}</span>
                        </div>
                      )}

                      {/* No wallet data */}
                      {!entry.custody_address && !entry.wallet_address && !(entry.verified_addresses && entry.verified_addresses.length > 0) && (
                        <p className="text-xs text-gray-600">No wallet data — add via Farcaster search to auto-populate</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.08]">
                      <span className="text-[10px] text-gray-600">
                        Added {new Date(entry.added_at).toLocaleDateString()}
                      </span>
                      <div className="ml-auto">
                        <button
                          onClick={() => handleRemove(entry.id, name)}
                          className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
