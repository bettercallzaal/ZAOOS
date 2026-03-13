'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AllowlistEntry } from '@/types';

export const AllowlistTable = forwardRef(function AllowlistTable(_props, ref) {
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [newEntry, setNewEntry] = useState({ ign: '', wallet_address: '', fid: '' });

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
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAdd = async () => {
    if (!newEntry.ign && !newEntry.wallet_address) return;
    setAdding(true);
    try {
      const body: Record<string, unknown> = {};
      if (newEntry.ign) body.ign = newEntry.ign;
      if (newEntry.wallet_address) body.wallet_address = newEntry.wallet_address;
      if (newEntry.fid) body.fid = parseInt(newEntry.fid);

      const res = await fetch('/api/admin/allowlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setNewEntry({ ign: '', wallet_address: '', fid: '' });
        setShowAddForm(false);
        showFeedback('success', 'Member added');
        fetchEntries();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Failed to add');
      }
    } catch {
      showFeedback('error', 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

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

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.ign?.toLowerCase().includes(q) ||
      e.real_name?.toLowerCase().includes(q) ||
      e.wallet_address?.toLowerCase().includes(q) ||
      String(e.fid).includes(q)
    );
  });

  // Stats
  const recentAdds = entries.filter((e) => {
    const added = new Date(e.added_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return added > weekAgo;
  }).length;

  const withFid = entries.filter((e) => e.fid).length;

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
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
            feedback.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{entries.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Members</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#f5a623]">{withFid}</p>
          <p className="text-xs text-gray-400 mt-1">Linked FIDs</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{recentAdds}</p>
          <p className="text-xs text-gray-400 mt-1">Added This Week</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
            showAddForm
              ? 'bg-gray-700 text-gray-300'
              : 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
          }`}
        >
          {showAddForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {/* Add Form (collapsible) */}
      {showAddForm && (
        <div className="bg-[#1a2a3a] rounded-xl p-4 mb-4 border border-gray-700">
          <p className="text-sm font-medium text-gray-300 mb-3">New Member</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={newEntry.ign}
              onChange={(e) => setNewEntry({ ...newEntry, ign: e.target.value })}
              placeholder="Name"
              className="bg-[#0a1628] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
            />
            <input
              value={newEntry.wallet_address}
              onChange={(e) => setNewEntry({ ...newEntry, wallet_address: e.target.value })}
              placeholder="0x... wallet address"
              className="bg-[#0a1628] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
            />
            <div className="flex gap-2">
              <input
                value={newEntry.fid}
                onChange={(e) => setNewEntry({ ...newEntry, fid: e.target.value })}
                placeholder="FID"
                className="bg-[#0a1628] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] w-24"
              />
              <button
                onClick={handleAdd}
                disabled={adding || (!newEntry.ign && !newEntry.wallet_address)}
                className="flex-1 bg-[#f5a623] text-[#0a1628] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {search && (
        <p className="text-xs text-gray-500 mb-2">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Table */}
      <div className="bg-[#1a2a3a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Wallet</th>
                <th className="py-3 px-4 font-medium">FID</th>
                <th className="py-3 px-4 font-medium hidden sm:table-cell">Added</th>
                <th className="py-3 px-4 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    {search ? 'No members match your search' : 'No members yet'}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">
                      {entry.ign || entry.real_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                      {entry.wallet_address
                        ? `${entry.wallet_address.slice(0, 6)}...${entry.wallet_address.slice(-4)}`
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400">{entry.fid || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden sm:table-cell">
                      {new Date(entry.added_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRemove(entry.id, entry.ign || entry.real_name || '')}
                        className="text-red-400/70 hover:text-red-400 text-xs transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
