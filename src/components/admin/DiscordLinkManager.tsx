'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface DiscordUser {
  id: string;
  primary_wallet: string;
  fid: number | null;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  discord_id: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  has_intro: boolean;
  proposal_count: number;
  vote_count: number;
}

interface Stats {
  linked: number;
  unlinked: number;
  introCount: number;
}

interface BulkPreview {
  matches: { userId: string; displayName: string; wallet: string; discordId: string }[];
  alreadyLinked: number;
  noMatch: number;
  total: number;
}

interface BulkResult {
  linked: number;
  alreadyLinked: number;
  noMatch: number;
  errors: string[];
  total: number;
}

type LinkFilter = 'all' | 'linked' | 'unlinked';
type SortKey = 'name' | 'status';

export function DiscordLinkManager() {
  const [users, setUsers] = useState<DiscordUser[]>([]);
  const [stats, setStats] = useState<Stats>({ linked: 0, unlinked: 0, introCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Per-row link input state
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Bulk auto-link
  const [bulkStep, setBulkStep] = useState<'idle' | 'loading-file' | 'previewing' | 'executing' | 'done'>('idle');
  const [walletMap, setWalletMap] = useState<Record<string, string> | null>(null);
  const [bulkPreview, setBulkPreview] = useState<BulkPreview | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [autoLinkableCount, setAutoLinkableCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = useCallback((type: 'success' | 'error', msg: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, msg });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/discord-link');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || { linked: 0, unlinked: 0, introCount: 0 });
      } else {
        showFeedback('error', 'Failed to load discord link data');
      }
    } catch {
      showFeedback('error', 'Network error loading data');
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute auto-linkable count whenever walletMap or users change
  useEffect(() => {
    if (!walletMap) {
      setAutoLinkableCount(0);
      return;
    }
    const walletToDiscord: Record<string, string> = {};
    for (const [discordId, wallet] of Object.entries(walletMap)) {
      walletToDiscord[wallet.toLowerCase()] = discordId;
    }
    let count = 0;
    for (const u of users) {
      if (u.discord_id) continue;
      const wallets = [u.primary_wallet?.toLowerCase()].filter(Boolean) as string[];
      if (wallets.some(w => walletToDiscord[w])) count++;
    }
    setAutoLinkableCount(count);
  }, [walletMap, users]);

  // Filter + sort
  const filtered = users
    .filter(u => {
      if (linkFilter === 'linked' && !u.discord_id) return false;
      if (linkFilter === 'unlinked' && u.discord_id) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.primary_wallet?.toLowerCase().includes(q) ||
        u.discord_id?.toLowerCase().includes(q) ||
        String(u.fid).includes(q)
      );
    })
    .sort((a, b) => {
      if (sortKey === 'status') {
        const aLinked = a.discord_id ? 1 : 0;
        const bLinked = b.discord_id ? 1 : 0;
        if (aLinked !== bLinked) return bLinked - aLinked;
      }
      const aName = (a.display_name || a.username || a.primary_wallet || '').toLowerCase();
      const bName = (b.display_name || b.username || b.primary_wallet || '').toLowerCase();
      return aName.localeCompare(bName);
    });

  // Link a discord_id to a user
  const handleLink = async (userId: string, discordId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/discord-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, discordId }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', `Linked Discord ID ${discordId}`);
        setLinkingId(null);
        setLinkInput('');
        fetchData();
      } else {
        showFeedback('error', data.error || 'Failed to link');
      }
    } catch {
      showFeedback('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // Unlink discord_id
  const handleUnlink = async (userId: string, displayName: string) => {
    if (!confirm(`Unlink Discord from ${displayName}?`)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/discord-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, discordId: null }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', `Unlinked Discord from ${displayName}`);
        fetchData();
      } else {
        showFeedback('error', data.error || 'Failed to unlink');
      }
    } catch {
      showFeedback('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // Handle wallet file upload for bulk auto-link
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkStep('loading-file');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        // Expect { discord_id: wallet_address, ... }
        if (typeof data === 'object' && !Array.isArray(data)) {
          setWalletMap(data);
          setBulkStep('idle');
          showFeedback('success', `Loaded ${Object.keys(data).length} wallet mappings from file`);
        } else {
          showFeedback('error', 'Invalid format. Expected JSON object: { discord_id: wallet_address }');
          setBulkStep('idle');
        }
      } catch {
        showFeedback('error', 'Failed to parse JSON file');
        setBulkStep('idle');
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be re-uploaded
    e.target.value = '';
  };

  // Preview bulk auto-link
  const handleBulkPreview = async () => {
    if (!walletMap) {
      showFeedback('error', 'Upload a wallets.json file first');
      return;
    }
    setBulkStep('previewing');
    try {
      const res = await fetch('/api/admin/discord-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview: true, walletMap }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkPreview(data);
      } else {
        showFeedback('error', data.error || 'Preview failed');
        setBulkStep('idle');
      }
    } catch {
      showFeedback('error', 'Network error');
      setBulkStep('idle');
    }
  };

  // Execute bulk auto-link
  const handleBulkExecute = async () => {
    if (!walletMap) return;
    setBulkStep('executing');
    try {
      const res = await fetch('/api/admin/discord-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview: false, walletMap }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkResult(data);
        setBulkStep('done');
        showFeedback('success', `Linked ${data.linked} users`);
        fetchData(); // Refresh the table
      } else {
        showFeedback('error', data.error || 'Bulk link failed');
        setBulkStep('previewing');
      }
    } catch {
      showFeedback('error', 'Network error');
      setBulkStep('previewing');
    }
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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
        <div className={`fixed top-4 right-4 z-[70] px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
          feedback.type === 'success'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* ── Section A: Summary Stats ── */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{stats.linked}</p>
          <p className="text-xs text-gray-400 mt-1">Discord Linked</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-400">{stats.unlinked}</p>
          <p className="text-xs text-gray-400 mt-1">Unlinked</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-400">{stats.introCount}</p>
          <p className="text-xs text-gray-400 mt-1">Discord Intros</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#f5a623]">{autoLinkableCount}</p>
          <p className="text-xs text-gray-400 mt-1">Auto-Linkable</p>
        </div>
      </div>

      {/* ── Section D: Bulk Auto-Link ── */}
      <div className="bg-[#1a2a3a] rounded-xl p-4 mb-4 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-white">Bulk Auto-Link by Wallet</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload the bot&apos;s wallets.json to match Discord IDs to users by wallet address
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={bulkStep === 'loading-file'}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/[0.08] transition-colors disabled:opacity-50"
            >
              {walletMap ? `${Object.keys(walletMap).length} wallets loaded` : 'Upload wallets.json'}
            </button>
            {walletMap && bulkStep === 'idle' && (
              <button
                onClick={handleBulkPreview}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 border border-[#f5a623]/30 transition-colors"
              >
                Preview Matches
              </button>
            )}
          </div>
        </div>

        {/* Preview results */}
        {bulkStep === 'previewing' && bulkPreview && (
          <div className="mt-3 border-t border-white/[0.08] pt-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-400">{bulkPreview.matches.length}</p>
                <p className="text-[10px] text-gray-500">Will Link</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-400">{bulkPreview.alreadyLinked}</p>
                <p className="text-[10px] text-gray-500">Already Linked</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-500">{bulkPreview.noMatch}</p>
                <p className="text-[10px] text-gray-500">No Match</p>
              </div>
            </div>

            {bulkPreview.matches.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                {bulkPreview.matches.map(m => (
                  <div key={m.userId} className="flex items-center gap-2 text-xs bg-[#0a1628] rounded-lg px-3 py-1.5">
                    <span className="text-white font-medium truncate flex-1">{m.displayName}</span>
                    <span className="text-gray-500 font-mono">{shortAddr(m.wallet)}</span>
                    <svg className="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <span className="text-[#5865F2] font-mono">{m.discordId}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleBulkExecute}
                disabled={bulkPreview.matches.length === 0}
                className="text-xs font-medium px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
              >
                Link {bulkPreview.matches.length} Users
              </button>
              <button
                onClick={() => { setBulkStep('idle'); setBulkPreview(null); }}
                className="text-xs font-medium px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Executing spinner */}
        {bulkStep === 'executing' && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Linking users...</span>
          </div>
        )}

        {/* Done results */}
        {bulkStep === 'done' && bulkResult && (
          <div className="mt-3 border-t border-white/[0.08] pt-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-400">{bulkResult.linked}</p>
                <p className="text-[10px] text-gray-500">Linked</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-400">{bulkResult.alreadyLinked}</p>
                <p className="text-[10px] text-gray-500">Already Linked</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-500">{bulkResult.noMatch}</p>
                <p className="text-[10px] text-gray-500">No Match</p>
              </div>
            </div>
            {bulkResult.errors.length > 0 && (
              <div className="text-xs text-red-400 space-y-1 mb-2">
                {bulkResult.errors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}
            <button
              onClick={() => { setBulkStep('idle'); setBulkPreview(null); setBulkResult(null); }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* ── Section B: Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, wallet, Discord ID..."
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />
        </div>
        <select
          value={linkFilter}
          onChange={(e) => setLinkFilter(e.target.value as LinkFilter)}
          className="bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 border-0 focus:ring-1 focus:ring-[#f5a623]"
        >
          <option value="all">All</option>
          <option value="linked">Linked</option>
          <option value="unlinked">Unlinked</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 border-0 focus:ring-1 focus:ring-[#f5a623]"
        >
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Link Status</option>
        </select>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-xs text-gray-500 mb-2">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* ── Section B: User Cards ── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-[#1a2a3a] rounded-xl py-8 text-center text-gray-500">
            {search ? 'No users match your search' : 'No users found'}
          </div>
        ) : (
          filtered.map(user => {
            const name = user.display_name || user.username || shortAddr(user.primary_wallet);
            const isExpanded = expandedId === user.id;
            const isLinking = linkingId === user.id;

            return (
              <div
                key={user.id}
                className="bg-[#1a2a3a] rounded-xl overflow-hidden border border-white/[0.08]"
              >
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : user.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  {/* Avatar */}
                  {user.pfp_url ? (
                    <Image src={user.pfp_url} alt={`${name} avatar`} width={36} height={36} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 font-mono">
                      {user.primary_wallet.slice(2, 4)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{name}</span>
                      {user.username && <span className="text-xs text-gray-500">@{user.username}</span>}
                      {user.fid && <span className="text-[10px] text-gray-600">FID:{user.fid}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-600 font-mono">{shortAddr(user.primary_wallet)}</span>
                      {user.discord_id && (
                        <span className="text-[10px] text-[#5865F2] font-mono">{user.discord_id}</span>
                      )}
                    </div>
                  </div>

                  {/* Discord Status Badge */}
                  {user.discord_id ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 font-medium flex-shrink-0">
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 border border-gray-600/30 font-medium flex-shrink-0">
                      Unlinked
                    </span>
                  )}

                  {/* Chevron */}
                  <svg className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.08]">
                    <div className="mt-3 space-y-2 text-xs">
                      {/* Wallet */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] font-medium w-16 text-center">Wallet</span>
                        <span className="text-gray-300 font-mono flex-1 truncate">{user.primary_wallet}</span>
                      </div>

                      {/* Discord ID */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#5865F2]/10 text-[#5865F2] font-medium w-16 text-center">Discord</span>
                        <span className="text-gray-300 font-mono flex-1">
                          {user.discord_id || <span className="text-gray-600 italic">Not linked</span>}
                        </span>
                      </div>

                      {/* Discord Data */}
                      {user.discord_id && (
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${user.has_intro ? 'bg-green-400' : 'bg-gray-600'}`} />
                            <span className="text-gray-400">{user.has_intro ? 'Has intro' : 'No intro'}</span>
                          </div>
                          <div className="text-gray-400">
                            {user.proposal_count} proposal{user.proposal_count !== 1 ? 's' : ''}
                          </div>
                          <div className="text-gray-400">
                            {user.vote_count} vote{user.vote_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-[10px] text-gray-600 mt-2">
                        <span>Role: {user.role}</span>
                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* ── Section C: Link Actions ── */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.08]">
                      {user.discord_id ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUnlink(user.id, name); }}
                          disabled={saving}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          Unlink Discord
                        </button>
                      ) : isLinking ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            placeholder="Discord ID (e.g. 691422751491227719)"
                            autoFocus
                            className="flex-1 bg-[#0a1628] text-white text-xs rounded-lg px-3 py-1.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5865F2] font-mono"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && linkInput.trim()) handleLink(user.id, linkInput.trim());
                              if (e.key === 'Escape') { setLinkingId(null); setLinkInput(''); }
                            }}
                          />
                          <button
                            onClick={() => { if (linkInput.trim()) handleLink(user.id, linkInput.trim()); }}
                            disabled={saving || !linkInput.trim()}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors disabled:opacity-50"
                          >
                            {saving ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setLinkingId(null); setLinkInput(''); }}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLinkingId(user.id); setLinkInput(''); }}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#5865F2]/10 text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors"
                        >
                          Link Discord
                        </button>
                      )}
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
}
