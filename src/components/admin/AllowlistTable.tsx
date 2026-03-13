'use client';

import { useState, useEffect, useCallback } from 'react';
import { AllowlistEntry } from '@/types';

export function AllowlistTable() {
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ ign: '', wallet_address: '', fid: '' });

  const fetchEntries = useCallback(async () => {
    const res = await fetch('/api/admin/allowlist');
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
        fetchEntries();
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this entry?')) return;
    await fetch('/api/admin/allowlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchEntries();
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

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#f5a623] mb-4">Allowlist ({entries.length} members)</h2>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, wallet, or FID..."
        className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-4 py-2 mb-4 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
      />

      {/* Add new */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={newEntry.ign}
          onChange={(e) => setNewEntry({ ...newEntry, ign: e.target.value })}
          placeholder="Name"
          className="bg-[#1a2a3a] text-white text-sm rounded px-3 py-1.5 placeholder-gray-500 focus:outline-none"
        />
        <input
          value={newEntry.wallet_address}
          onChange={(e) => setNewEntry({ ...newEntry, wallet_address: e.target.value })}
          placeholder="0x... wallet"
          className="bg-[#1a2a3a] text-white text-sm rounded px-3 py-1.5 placeholder-gray-500 focus:outline-none flex-1 min-w-[200px]"
        />
        <input
          value={newEntry.fid}
          onChange={(e) => setNewEntry({ ...newEntry, fid: e.target.value })}
          placeholder="FID"
          className="bg-[#1a2a3a] text-white text-sm rounded px-3 py-1.5 placeholder-gray-500 focus:outline-none w-20"
        />
        <button
          onClick={handleAdd}
          disabled={adding}
          className="bg-[#f5a623] text-[#0a1628] text-sm font-medium px-4 py-1.5 rounded hover:bg-[#ffd700] disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Wallet</th>
              <th className="py-2 pr-4">FID</th>
              <th className="py-2 pr-4">Added</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-white/5">
                <td className="py-2 pr-4 text-white">{entry.ign || entry.real_name || '-'}</td>
                <td className="py-2 pr-4 text-gray-400 font-mono text-xs">
                  {entry.wallet_address
                    ? `${entry.wallet_address.slice(0, 6)}...${entry.wallet_address.slice(-4)}`
                    : '-'}
                </td>
                <td className="py-2 pr-4 text-gray-400">{entry.fid || '-'}</td>
                <td className="py-2 pr-4 text-gray-500 text-xs">
                  {new Date(entry.added_at).toLocaleDateString()}
                </td>
                <td className="py-2">
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
