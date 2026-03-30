'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface HealthStats {
  totalUsers: number;
  respectHolders: number;
  communityMembers: number;
  totalRespectMembers: number;
  unlinkedRespect: number;
  allowlistNotLoggedIn: number;
  missingZid: number;
  missingDiscord: number;
  missingRealName: number;
  neverActive: number;
  issueCount: { high: number; medium: number; low: number };
}

interface Issue {
  severity: 'high' | 'medium' | 'low';
  member: string;
  issue: string;
  fix?: string;
}

interface Member {
  id: string;
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  realName: string | null;
  ensName: string | null;
  zid: string | null;
  tier: string;
  role: string;
  tags: string[];
  primaryWallet: string | null;
  preferredWallet: string | null;
  platforms: Record<string, string | null>;
  respect: { total: number; fractal: number; onchainOG: number; onchainZOR: number; fractalCount: number } | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

interface MissingFidMember {
  id: string;
  name: string;
  wallet_address: string | null;
  total_respect: number;
  fractal_count: number;
  onchain_og: number;
}

interface FidStats {
  totalMembers: number;
  withFid: number;
  missingFid: number;
}

const SEVERITY_COLORS = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function MemberCRMPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'directory' | 'health' | 'fids'>('directory');
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'respect_holder' | 'community'>('all');
  const [sortBy, setSortBy] = useState<'respect' | 'name' | 'recent' | 'active'>('respect');
  const [issueFilter, setIssueFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [fixing, setFixing] = useState<string | null>(null);
  const [fixResults, setFixResults] = useState<{ action: string; fixed: number; errors: number; details: string[] }[] | null>(null);

  // FID tab state
  const [fidActive, setFidActive] = useState<MissingFidMember[]>([]);
  const [fidOnchain, setFidOnchain] = useState<MissingFidMember[]>([]);
  const [fidInactive, setFidInactive] = useState<MissingFidMember[]>([]);
  const [fidStats, setFidStats] = useState<FidStats | null>(null);
  const [fidInputs, setFidInputs] = useState<Record<string, string>>({});
  const [fidSaving, setFidSaving] = useState(false);
  const [fidSaveResult, setFidSaveResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const [fidLoading, setFidLoading] = useState(false);
  const [fidSearch, setFidSearch] = useState('');
  const [fidSection, setFidSection] = useState<'active' | 'onchain' | 'inactive'>('active');

  const runFix = async (action: 'link-fids' | 'enrich-profiles' | 'import-socials' | 'sync-tiers' | 'link-profiles' | 'backfill-dates' | 'all') => {
    setFixing(action);
    setFixResults(null);
    try {
      const res = await fetch('/api/admin/member-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setFixResults(data.results || []);
      // Reload health data
      fetch('/api/admin/member-health').then(r => r.json()).then(d => { setStats(d.stats); setIssues(d.issues || []); });
    } catch { /* ignore */ }
    setFixing(null);
  };

  // Load FID data when tab switches
  useEffect(() => {
    if (tab !== 'fids') return;
    setFidLoading(true);
    fetch('/api/admin/member-fid')
      .then(r => r.json())
      .then(d => {
        setFidActive(d.active || []);
        setFidOnchain(d.onchainOnly || []);
        setFidInactive(d.inactive || []);
        setFidStats(d.stats || null);
      })
      .catch(console.error)
      .finally(() => setFidLoading(false));
  }, [tab]);

  const fidPendingCount = Object.values(fidInputs).filter(v => v.trim() !== '').length;

  const saveFids = async () => {
    const updates = Object.entries(fidInputs)
      .filter(([, v]) => v.trim() !== '' && !isNaN(Number(v)))
      .map(([memberId, fid]) => ({ memberId, fid: Number(fid) }));

    if (updates.length === 0) return;

    setFidSaving(true);
    setFidSaveResult(null);
    try {
      const res = await fetch('/api/admin/member-fid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      setFidSaveResult(data);

      // Clear saved inputs and reload
      if (data.updated > 0) {
        const savedIds = new Set(updates.map(u => u.memberId));
        setFidInputs(prev => {
          const next = { ...prev };
          for (const id of savedIds) delete next[id];
          return next;
        });
        // Reload FID list
        const r = await fetch('/api/admin/member-fid');
        const d = await r.json();
        setFidActive(d.active || []);
        setFidOnchain(d.onchainOnly || []);
        setFidInactive(d.inactive || []);
        setFidStats(d.stats || null);
      }
    } catch { /* ignore */ }
    setFidSaving(false);
  };

  // Load health data
  useEffect(() => {
    fetch('/api/admin/member-health')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setIssues(d.issues || []); })
      .catch(console.error);
  }, []);

  // Load directory
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ sort: sortBy, limit: '200' });
    if (tierFilter !== 'all') params.set('tier', tierFilter);
    if (search) params.set('search', search);

    fetch(`/api/members/directory?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (!controller.signal.aborted) setMembers(d.members || []); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [search, tierFilter, sortBy]);

  if (!user?.isAdmin) {
    return <div className="flex items-center justify-center h-[60vh] text-gray-500">Admin access required</div>;
  }

  const filteredIssues = issueFilter === 'all' ? issues : issues.filter(i => i.severity === issueFilter);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold">Member CRM</h1>
          <p className="text-xs text-gray-500 mt-1">Unified members + data health</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('directory')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'directory' ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => setTab('health')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'health' ? 'bg-red-500/10 text-red-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            Data Health {stats ? `(${stats.issueCount.high} issues)` : ''}
          </button>
          <button
            onClick={() => setTab('fids')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'fids' ? 'bg-purple-500/10 text-purple-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            Missing FIDs {fidStats ? `(${fidStats.missingFid})` : ''}
          </button>
        </div>

        {/* ── DIRECTORY TAB ──────────────────────────────────── */}
        {tab === 'directory' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members..."
                className="flex-1 min-w-[200px] bg-white/5 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
              />
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value as typeof tierFilter)}
                className="bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="all">All Tiers</option>
                <option value="respect_holder">Respect Holders</option>
                <option value="community">Community</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="respect">Sort: Respect</option>
                <option value="name">Sort: Name</option>
                <option value="recent">Sort: Newest</option>
                <option value="active">Sort: Last Active</option>
              </select>
            </div>

            {/* Member list */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-[#0d1b2a] rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-1">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-[#0d1b2a] rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors">
                    {/* PFP */}
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                      {m.pfpUrl ? (
                        <Image src={m.pfpUrl} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-bold">
                          {(m.displayName || m.username || '?')[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {m.displayName || m.username || m.realName || 'Unknown'}
                        </span>
                        {m.zid && (
                          <span className="text-[9px] font-bold text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded-full">
                            ZID #{m.zid}
                          </span>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          m.tier === 'respect_holder'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {m.tier === 'respect_holder' ? 'Respect' : 'Community'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-600">
                        {m.username && <span>@{m.username}</span>}
                        {m.ensName && <span className="text-[#f5a623]">{m.ensName}</span>}
                        {m.realName && <span>{m.realName}</span>}
                      </div>
                    </div>

                    {/* Respect */}
                    <div className="text-right flex-shrink-0">
                      {m.respect ? (
                        <>
                          <p className="text-sm font-mono text-[#f5a623]">{m.respect.total}R</p>
                          <p className="text-[10px] text-gray-600">{m.respect.fractalCount} fractals</p>
                        </>
                      ) : (
                        <p className="text-[10px] text-gray-600">No respect</p>
                      )}
                    </div>

                    {/* Platforms */}
                    <div className="flex gap-1 flex-shrink-0">
                      {m.fid && <span className="w-5 h-5 rounded bg-purple-500/10 flex items-center justify-center text-[8px] text-purple-400" title="Farcaster">FC</span>}
                      {m.platforms.bluesky && <span className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center text-[8px] text-blue-400" title="Bluesky">BS</span>}
                      {m.platforms.discord && <span className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center text-[8px] text-indigo-400" title="Discord">DC</span>}
                      {m.platforms.x && <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[8px] text-gray-300" title="X">X</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── HEALTH TAB ──────────────────────────────────── */}
        {tab === 'health' && stats && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <StatCard label="Total Users" value={stats.totalUsers} />
              <StatCard label="Respect Holders" value={stats.respectHolders} color="text-green-400" />
              <StatCard label="Community" value={stats.communityMembers} />
              <StatCard label="Unlinked Respect" value={stats.unlinkedRespect} color="text-yellow-400" />
              <StatCard label="Missing ZID" value={stats.missingZid} color="text-red-400" />
              <StatCard label="Missing Discord" value={stats.missingDiscord} />
              <StatCard label="Missing Real Name" value={stats.missingRealName} />
              <StatCard label="Never Active" value={stats.neverActive} color="text-red-400" />
            </div>

            {/* Auto-fix actions */}
            <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800/50 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Auto-Fix Actions</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => runFix('link-fids')}
                  disabled={!!fixing}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
                >
                  {fixing === 'link-fids' ? 'Linking...' : 'Link FIDs (wallet → Farcaster)'}
                </button>
                <button
                  onClick={() => runFix('enrich-profiles')}
                  disabled={!!fixing}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                >
                  {fixing === 'enrich-profiles' ? 'Enriching...' : 'Enrich Profiles (from Neynar)'}
                </button>
                <button
                  onClick={() => runFix('sync-tiers')}
                  disabled={!!fixing}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                >
                  {fixing === 'sync-tiers' ? 'Syncing...' : 'Sync Tiers (respect → holder)'}
                </button>
                <button
                  onClick={() => runFix('import-socials')}
                  disabled={!!fixing}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 disabled:opacity-50 transition-colors"
                >
                  {fixing === 'import-socials' ? 'Importing...' : 'Import Socials (from Farcaster)'}
                </button>
                <button
                  onClick={() => runFix('link-profiles')}
                  disabled={!!fixing}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
                >
                  {fixing === 'link-profiles' ? 'Linking...' : 'Link Artist Profiles'}
                </button>
                <button
                  onClick={() => runFix('backfill-dates')}
                  disabled={!!fixing}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                >
                  {fixing === 'backfill-dates' ? 'Backfilling...' : 'Backfill First Respect Dates'}
                </button>
                <button
                  onClick={() => runFix('all')}
                  disabled={!!fixing}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20 hover:bg-[#f5a623]/20 disabled:opacity-50 transition-colors"
                >
                  {fixing === 'all' ? 'Running all...' : 'Run All Fixes'}
                </button>
              </div>
              {fixing && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-3 h-3 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                  Running {fixing}... this may take a minute for large batches
                </div>
              )}
              {fixResults && (
                <div className="space-y-2 mt-2">
                  {fixResults.map((r, i) => (
                    <div key={i} className="bg-[#0a1628] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{r.action}</span>
                          <span className="text-xs text-green-400">{r.fixed} fixed</span>
                          {r.errors > 0 && <span className="text-xs text-red-400">{r.errors} errors</span>}
                        </div>
                        {r.details.length > 0 && (
                          <button
                            onClick={() => {
                              const text = `${r.action}: ${r.fixed} fixed\n${r.details.join('\n')}`;
                              navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
                            }}
                            className="text-[10px] text-gray-500 hover:text-[#f5a623] transition-colors"
                          >
                            Copy log
                          </button>
                        )}
                      </div>
                      {r.details.length > 0 && (
                        <div className="max-h-48 overflow-y-auto">
                          {r.details.map((d, j) => (
                            <p key={j} className="text-[10px] text-gray-500">{d}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Issue severity filter */}
            <div className="flex gap-2 mb-3">
              {(['all', 'high', 'medium', 'low'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setIssueFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    issueFilter === s
                      ? s === 'high' ? 'bg-red-500 text-white' :
                        s === 'medium' ? 'bg-yellow-500 text-black' :
                        s === 'low' ? 'bg-gray-500 text-white' :
                        'bg-[#f5a623] text-black'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {s === 'all' ? `All (${issues.length})` :
                   `${s.charAt(0).toUpperCase() + s.slice(1)} (${issues.filter(i => i.severity === s).length})`}
                </button>
              ))}
            </div>

            {/* Issues list */}
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredIssues.map((issue, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border ${SEVERITY_COLORS[issue.severity]}`}>
                  <span className={`text-[10px] font-bold uppercase mt-0.5 flex-shrink-0 ${
                    issue.severity === 'high' ? 'text-red-400' :
                    issue.severity === 'medium' ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {issue.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{issue.member}</p>
                    <p className="text-xs text-gray-400">{issue.issue}</p>
                    {issue.fix && <p className="text-[10px] text-gray-600 mt-0.5">Fix: {issue.fix}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* ── MISSING FIDs TAB ─────────────────────────────── */}
        {tab === 'fids' && (
          <>
            {/* Stats bar */}
            {fidStats && (
              <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center border border-gray-800/50">
                  <p className="text-xl font-bold text-green-400">{fidStats.withFid}</p>
                  <p className="text-[10px] text-gray-500">Have FID</p>
                </div>
                <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center border border-purple-500/20">
                  <p className="text-xl font-bold text-purple-400">{fidStats.missingFid}</p>
                  <p className="text-[10px] text-gray-500">Missing FID</p>
                </div>
                <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center border border-gray-800/50">
                  <p className="text-xl font-bold text-white">{fidStats.totalMembers}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
              </div>
            )}

            {/* Search + Save bar */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={fidSearch}
                onChange={e => setFidSearch(e.target.value)}
                placeholder="Search members..."
                className="flex-1 bg-white/5 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              {fidPendingCount > 0 && (
                <button
                  onClick={saveFids}
                  disabled={fidSaving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {fidSaving ? (
                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  Save {fidPendingCount} FID{fidPendingCount !== 1 ? 's' : ''}
                </button>
              )}
            </div>

            {/* Save result */}
            {fidSaveResult && (
              <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${
                fidSaveResult.errors.length > 0
                  ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                  : 'bg-green-500/10 text-green-300 border border-green-500/20'
              }`}>
                Updated {fidSaveResult.updated} FID{fidSaveResult.updated !== 1 ? 's' : ''}
                {fidSaveResult.errors.length > 0 && ` (${fidSaveResult.errors.length} errors)`}
              </div>
            )}

            {/* Section tabs */}
            <div className="flex gap-1 mb-3">
              {([
                { key: 'active' as const, label: 'Active', count: fidActive.length, color: 'text-[#f5a623]' },
                { key: 'onchain' as const, label: 'On-Chain Only', count: fidOnchain.length, color: 'text-blue-400' },
                { key: 'inactive' as const, label: 'Inactive', count: fidInactive.length, color: 'text-gray-500' },
              ]).map(s => (
                <button
                  key={s.key}
                  onClick={() => setFidSection(s.key)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                    fidSection === s.key
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-[#0d1b2a] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {s.label} ({s.count})
                </button>
              ))}
            </div>

            {fidLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-[#0d1b2a] rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <FidMemberList
                members={
                  fidSection === 'active' ? fidActive :
                  fidSection === 'onchain' ? fidOnchain : fidInactive
                }
                search={fidSearch}
                inputs={fidInputs}
                onInputChange={(id, val) => setFidInputs(prev => ({ ...prev, [id]: val }))}
              />
            )}

            <p className="text-[10px] text-gray-600 text-center mt-4">
              Tip: Open <a href="https://farcaster.xyz" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">farcaster.xyz</a>, search for the member, click the ... menu to see their FID, then paste it here.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function FidMemberList({
  members,
  search,
  inputs,
  onInputChange,
}: {
  members: MissingFidMember[];
  search: string;
  inputs: Record<string, string>;
  onInputChange: (id: string, val: string) => void;
}) {
  const filtered = search
    ? members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.wallet_address?.toLowerCase().includes(search.toLowerCase()))
    : members;

  if (filtered.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">{search ? 'No matches.' : 'All members in this group have FIDs.'}</p>;
  }

  return (
    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-gray-600 uppercase tracking-wider sticky top-0 bg-[#0a1628] z-10">
        <span className="w-8 text-right">#</span>
        <span className="flex-1">Name</span>
        <span className="w-16 text-right">Sessions</span>
        <span className="w-16 text-right">Respect</span>
        <span className="w-28">FID</span>
        <span className="w-8" />
      </div>

      {filtered.map((m, i) => {
        const searchName = m.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const fcLink = m.name.startsWith('0x')
          ? `https://optimistic.etherscan.io/address/${m.wallet_address}`
          : `https://farcaster.xyz/${searchName}`;

        return (
          <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-[#0d1b2a] rounded-lg border border-gray-800/50 hover:border-gray-700 transition-colors">
            <span className="w-8 text-right text-[10px] text-gray-600">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{m.name}</p>
              {m.wallet_address && (
                <p className="text-[10px] text-gray-600 truncate">{m.wallet_address}</p>
              )}
            </div>
            <span className="w-16 text-right text-xs text-gray-400">{m.fractal_count || 0}</span>
            <span className="w-16 text-right text-xs font-mono text-[#f5a623]">{Number(m.total_respect) || Number(m.onchain_og) || 0}</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="FID"
              value={inputs[m.id] || ''}
              onChange={e => onInputChange(m.id, e.target.value.replace(/\D/g, ''))}
              className={`w-28 bg-[#0a1628] border rounded px-2 py-1 text-xs text-white placeholder-gray-700 focus:outline-none transition-colors ${
                inputs[m.id]?.trim()
                  ? 'border-purple-500/50 bg-purple-500/5'
                  : 'border-gray-800 focus:border-purple-500/50'
              }`}
            />
            <a
              href={fcLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-colors flex-shrink-0"
              title="Look up on Farcaster"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-[#0d1b2a] rounded-xl p-3 border border-gray-800/50">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
