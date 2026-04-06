'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Member {
  fid: number;
  username: string | null;
  displayName: string | null;
  wallet: string;
  zaoSubname: string | null;
  zid: string | null;
  pfpUrl: string | null;
}

interface SubnameRequest {
  id: string;
  fid: number;
  current_name: string | null;
  requested_name: string;
  status: string;
  created_at: string;
}

export function SubnameManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<SubnameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createFid, setCreateFid] = useState('');
  const [createName, setCreateName] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, reqRes] = await Promise.all([
        fetch('/api/admin/ens-subnames'),
        fetch('/api/admin/ens-subnames/requests'),
      ]);
      if (subsRes.ok) {
        const data = await subsRes.json();
        setMembers(data.members || []);
      }
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests((data.requests || []).filter((r: SubnameRequest) => r.status === 'pending'));
      }
    } catch (err) {
      console.error('Failed to fetch subname data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => () => { if (messageTimerRef.current) clearTimeout(messageTimerRef.current); }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 5000);
  };

  const handleBatchCreate = async () => {
    setActionLoading('batch');
    try {
      const res = await fetch('/api/admin/ens-subnames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: true }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', data.message || `Created ${data.created?.length || 0} subnames`);
        fetchData();
      } else {
        showMessage('error', data.error || 'Batch create failed');
      }
    } catch {
      showMessage('error', 'Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!createFid || !createName) return;
    setActionLoading('create');
    try {
      const res = await fetch('/api/admin/ens-subnames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: Number(createFid), name: createName }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', `Created ${data.subname}`);
        setCreateFid('');
        setCreateName('');
        fetchData();
      } else {
        showMessage('error', data.error || 'Create failed');
      }
    } catch {
      showMessage('error', 'Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (fid: number, subname: string) => {
    const name = subname.replace('.thezao.eth', '');
    setActionLoading(`revoke-${fid}`);
    try {
      const res = await fetch('/api/admin/ens-subnames', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, name }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', data.message || 'Revoked');
        fetchData();
      } else {
        showMessage('error', data.error || 'Revoke failed');
      }
    } catch {
      showMessage('error', 'Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'deny') => {
    setActionLoading(`review-${requestId}`);
    try {
      const res = await fetch('/api/admin/ens-subnames/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', action === 'approve' ? `Approved → ${data.subname}` : 'Denied');
        fetchData();
      } else {
        showMessage('error', data.error || 'Review failed');
      }
    } catch {
      showMessage('error', 'Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const withSubname = members.filter(m => m.zaoSubname);
  const withoutSubname = members.filter(m => !m.zaoSubname);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">ENS Subnames</h3>
          <p className="text-xs text-gray-500 mt-1">
            {withSubname.length} assigned · {withoutSubname.length} pending · thezao.eth
          </p>
        </div>
        <button
          onClick={handleBatchCreate}
          disabled={actionLoading === 'batch' || withoutSubname.length === 0}
          className="px-4 py-2 bg-[#f5a623] text-black text-sm font-medium rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
        >
          {actionLoading === 'batch' ? 'Creating...' : `Batch Create (${withoutSubname.length})`}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="bg-[#0d1b2a] rounded-xl border border-yellow-500/20 p-4">
          <p className="text-xs text-yellow-400 uppercase tracking-wider mb-3">
            Pending Name Change Requests ({requests.length})
          </p>
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-[#0a1628] rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm text-gray-300">FID {r.fid}</span>
                  <span className="text-xs text-gray-500 mx-2">wants</span>
                  <span className="text-sm text-[#f5a623] font-mono">{r.requested_name}.thezao.eth</span>
                  {r.current_name && (
                    <span className="text-xs text-gray-600 ml-2">(from {r.current_name})</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReviewRequest(r.id, 'approve')}
                    disabled={actionLoading === `review-${r.id}`}
                    className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg hover:bg-green-500/20 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewRequest(r.id, 'deny')}
                    disabled={actionLoading === `review-${r.id}`}
                    className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Create */}
      <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Create Single Subname</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="FID"
            value={createFid}
            onChange={e => setCreateFid(e.target.value)}
            className="w-24 px-3 py-2 bg-[#0a1628] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#f5a623] outline-none"
          />
          <div className="flex-1 flex items-center bg-[#0a1628] border border-white/[0.08] rounded-lg overflow-hidden focus-within:border-[#f5a623]">
            <input
              type="text"
              placeholder="name"
              value={createName}
              onChange={e => setCreateName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="flex-1 px-3 py-2 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
            <span className="pr-3 text-xs text-gray-500">.thezao.eth</span>
          </div>
          <button
            onClick={handleCreate}
            disabled={!createFid || !createName || actionLoading === 'create'}
            className="px-4 py-2 bg-[#f5a623] text-black text-sm font-medium rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
          >
            {actionLoading === 'create' ? '...' : 'Create'}
          </button>
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Member</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">ZID</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Subname</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.fid} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5">
                      <span className="text-white">{m.displayName || m.username || `FID ${m.fid}`}</span>
                      {m.username && (
                        <span className="text-gray-500 text-xs ml-2">@{m.username}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.zid ? (
                        <span className="text-[#f5a623] text-xs font-bold">#{m.zid}</span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.zaoSubname ? (
                        <span className="text-green-400 font-mono text-xs">{m.zaoSubname}</span>
                      ) : (
                        <span className="text-gray-600 text-xs">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {m.zaoSubname ? (
                        <button
                          onClick={() => handleRevoke(m.fid, m.zaoSubname!)}
                          disabled={actionLoading === `revoke-${m.fid}`}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600">Use batch or manual</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
