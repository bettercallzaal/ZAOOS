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

const SEVERITY_COLORS = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function MemberCRMPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'directory' | 'health'>('directory');
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

  const runFix = async (action: 'link-fids' | 'enrich-profiles' | 'import-socials' | 'sync-tiers' | 'link-profiles' | 'all') => {
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
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold">Member CRM</h1>
          <p className="text-xs text-gray-500 mt-1">Unified member directory + data health</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('directory')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'directory' ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
            }`}
          >
            Directory ({members.length})
          </button>
          <button
            onClick={() => setTab('health')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'health' ? 'bg-red-500/10 text-red-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            Data Health {stats ? `(${stats.issueCount.high} issues)` : ''}
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-white">{r.action}</span>
                        <span className="text-xs text-green-400">{r.fixed} fixed</span>
                        {r.errors > 0 && <span className="text-xs text-red-400">{r.errors} errors</span>}
                      </div>
                      {r.details.length > 0 && (
                        <div className="max-h-32 overflow-y-auto">
                          {r.details.slice(0, 20).map((d, j) => (
                            <p key={j} className="text-[10px] text-gray-500">{d}</p>
                          ))}
                          {r.details.length > 20 && (
                            <p className="text-[10px] text-gray-600">...and {r.details.length - 20} more</p>
                          )}
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
      </div>
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
