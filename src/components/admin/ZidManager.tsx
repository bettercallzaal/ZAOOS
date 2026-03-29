'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface User {
  id: string;
  primary_wallet: string;
  fid: number | null;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  zid: number | null;
  role: string;
  respect_wallet: string | null;
  created_at: string;
}

interface RespectEntry {
  fid: number | null;
  wallet: string;
  ogRespect: number;
  zorRespect: number;
  totalRespect: number;
  firstTokenDate: string | null;
}

export function ZidManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [respectMap, setRespectMap] = useState<Map<string, RespectEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [respectLoading, setRespectLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(feedbackTimerRef.current), []);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) { console.error('[ZidManager] fetch users:', err); } finally {
      setLoading(false);
    }
  }, []);

  const fetchRespect = useCallback(async () => {
    try {
      const res = await fetch('/api/respect/leaderboard');
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, RespectEntry>();
        for (const entry of data.leaderboard || []) {
          if (entry.fid) map.set(String(entry.fid), entry);
          if (entry.wallet) map.set(entry.wallet.toLowerCase(), entry);
        }
        setRespectMap(map);
      }
    } catch (err) { console.error('[ZidManager] fetch respect:', err); } finally {
      setRespectLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRespect();
  }, [fetchUsers, fetchRespect]);

  const getRespect = (user: User): RespectEntry | undefined => {
    if (user.fid) {
      const byFid = respectMap.get(String(user.fid));
      if (byFid) return byFid;
    }
    const wallet = (user.respect_wallet || user.primary_wallet || '').toLowerCase();
    return respectMap.get(wallet);
  };

  const handleAssignZid = async (user: User) => {
    setAssigning(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, assign_zid: true }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', `${user.display_name || user.username || 'User'} → ZID #${data.user?.zid}`);
        fetchUsers();
      } else {
        showFeedback('error', data.error || 'Failed to assign');
      }
    } catch {
      showFeedback('error', 'Network error');
    } finally {
      setAssigning(null);
    }
  };

  // Split users into assigned and unassigned
  const withZid = users.filter((u) => u.zid !== null).sort((a, b) => (a.zid || 0) - (b.zid || 0));
  const withoutZid = users.filter((u) => u.zid === null);

  // Further split unassigned: has respect vs no respect
  const eligibleNoZid = withoutZid
    .filter((u) => {
      const r = getRespect(u);
      return r && r.totalRespect > 0;
    })
    .sort((a, b) => {
      // Sort by first token date ascending (earliest first = lowest ZID)
      const dateA = getRespect(a)?.firstTokenDate || '9999';
      const dateB = getRespect(b)?.firstTokenDate || '9999';
      return dateA.localeCompare(dateB);
    });
  const noRespectNoZid = withoutZid.filter((u) => {
    const r = getRespect(u);
    return !r || r.totalRespect === 0;
  });

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
      {/* Feedback */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-[70] px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
          feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#f5a623]">{withZid.length}</p>
          <p className="text-xs text-gray-400 mt-1">ZIDs Assigned</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{eligibleNoZid.length}</p>
          <p className="text-xs text-gray-400 mt-1">Eligible (has respect)</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-500">{noRespectNoZid.length}</p>
          <p className="text-xs text-gray-400 mt-1">No Respect Yet</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{withZid.length > 0 ? Math.max(...withZid.map((u) => u.zid || 0)) : 0}</p>
          <p className="text-xs text-gray-400 mt-1">Highest ZID</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[#f5a623]/5 border border-[#f5a623]/20 rounded-xl p-4 mb-6">
        <p className="text-sm text-[#f5a623] font-medium">ZID Assignment Rules</p>
        <ul className="text-xs text-gray-400 mt-2 space-y-1">
          <li>ZID 1–99: Early testers & OGs with ZAO tokens before March 2026</li>
          <li>ZID 100+: New members joining after launch</li>
          <li>Must have on-chain Respect (OG or ZOR) to be eligible</li>
          <li>Lower number = earlier member = more OG status</li>
          <li>Once assigned, a ZID never changes</li>
        </ul>
        <p className="text-[10px] text-gray-600 mt-2">
          After assigning all early testers, run in Supabase: SELECT setval(&apos;zid_seq&apos;, 99);
        </p>
      </div>

      {/* Eligible — ready to assign */}
      {eligibleNoZid.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-green-400 uppercase tracking-wider font-medium">
              Ready to Assign ({eligibleNoZid.length})
            </p>
          </div>
          <div className="space-y-2">
            {eligibleNoZid.map((user) => {
              const respect = getRespect(user);
              return (
                <div key={user.id} className="flex items-center gap-3 bg-[#1a2a3a] rounded-xl px-4 py-3 border border-green-500/20">
                  {user.pfp_url ? (
                    <Image src={user.pfp_url} alt={`${user.display_name || user.username || 'User'} avatar`} width={36} height={36} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 font-mono">
                      {user.primary_wallet.slice(2, 4)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.display_name || user.username || shortAddr(user.primary_wallet)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      {user.username && <span>@{user.username}</span>}
                      {user.fid && <span>FID {user.fid}</span>}
                    </div>
                  </div>
                  <div className="text-right mr-3">
                    <p className="text-sm font-bold text-white">{respect?.totalRespect.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">
                      {respect?.ogRespect ? `${respect.ogRespect} OG` : ''}
                      {respect?.ogRespect && respect?.zorRespect ? ' + ' : ''}
                      {respect?.zorRespect ? `${respect.zorRespect} ZOR` : ''}
                    </p>
                    {respect?.firstTokenDate && (
                      <p className="text-[10px] text-gray-600">since {respect.firstTokenDate}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAssignZid(user)}
                    disabled={assigning === user.id}
                    className="text-xs font-medium px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700] disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    {assigning === user.id ? '...' : 'Assign ZID'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assigned ZIDs */}
      <div className="mb-6">
        <p className="text-xs text-[#f5a623] uppercase tracking-wider font-medium mb-3">
          Assigned ({withZid.length})
        </p>
        {withZid.length === 0 ? (
          <div className="bg-[#1a2a3a] rounded-xl py-8 text-center text-gray-500 text-sm">
            No ZIDs assigned yet
          </div>
        ) : (
          <div className="space-y-1">
            {withZid.map((user) => {
              const respect = getRespect(user);
              return (
                <div key={user.id} className="flex items-center gap-3 bg-[#1a2a3a] rounded-xl px-4 py-2.5">
                  <span className="text-lg font-bold text-[#f5a623] w-12 text-center flex-shrink-0">
                    #{user.zid}
                  </span>
                  {user.pfp_url ? (
                    <Image src={user.pfp_url} alt={`${user.display_name || user.username || 'User'} avatar`} width={32} height={32} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 font-mono">
                      {user.primary_wallet.slice(2, 4)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.display_name || user.username || shortAddr(user.primary_wallet)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      {user.username && <span>@{user.username}</span>}
                      {user.fid && <span>FID {user.fid}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{respect?.totalRespect.toLocaleString() || '0'}</p>
                    <p className="text-[10px] text-gray-500">
                      {respect?.firstTokenDate ? `since ${respect.firstTokenDate}` : 'respect'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Not eligible */}
      {noRespectNoZid.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
            Not Eligible — No Respect ({noRespectNoZid.length})
          </p>
          <div className="space-y-1">
            {noRespectNoZid.map((user) => (
              <div key={user.id} className="flex items-center gap-3 bg-[#1a2a3a]/50 rounded-xl px-4 py-2.5 opacity-60">
                {user.pfp_url ? (
                  <Image src={user.pfp_url} alt={`${user.display_name || user.username || 'User'} avatar`} width={32} height={32} className="rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 font-mono">
                    {user.primary_wallet.slice(2, 4)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.display_name || user.username || shortAddr(user.primary_wallet)}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    {user.username && <span>@{user.username}</span>}
                    {user.fid && <span>FID {user.fid}</span>}
                  </div>
                </div>
                <span className="text-[10px] text-gray-600">No respect</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {respectLoading && (
        <p className="text-xs text-gray-600 text-center mt-4">Loading on-chain respect data...</p>
      )}
    </div>
  );
}
