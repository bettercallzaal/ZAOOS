'use client';

import { useCallback, useEffect, useState } from 'react';

interface AuditEntry {
  id: string;
  actor_fid: number | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('create') || lower.includes('add') || lower.includes('insert')) {
    return 'bg-green-900/50 text-green-300 border-green-700';
  }
  if (lower.includes('update') || lower.includes('edit') || lower.includes('modify')) {
    return 'bg-blue-900/50 text-blue-300 border-blue-700';
  }
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('ban')) {
    return 'bg-red-900/50 text-red-300 border-red-700';
  }
  if (lower.includes('login') || lower.includes('auth') || lower.includes('session')) {
    return 'bg-purple-900/50 text-purple-300 border-purple-700';
  }
  return 'bg-gray-800/50 text-gray-300 border-gray-600';
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateJson(obj: Record<string, unknown> | null, maxLen = 80): string {
  if (!obj || Object.keys(obj).length === 0) return '—';
  const str = JSON.stringify(obj);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (selectedAction) params.set('action', selectedAction);

    try {
      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
      if (data.actions?.length) setActions(data.actions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [offset, selectedAction]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Header + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">Audit Log</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setOffset(0);
            }}
            className="rounded-lg border border-white/[0.08] bg-[#0d1b2a] px-3 py-1.5 text-sm text-white focus:border-[#f5a623] focus:outline-none"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400">
            {total} total {total === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#0d1b2a]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3 hidden sm:table-cell">Details</th>
              <th className="px-4 py-3">Actor FID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              /* Loading skeleton */
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.08]">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-12 animate-pulse rounded bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-white/[0.08] transition-colors hover:bg-[#0a1628]/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                    {formatTimestamp(entry.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getActionColor(entry.action)}`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    <span className="text-gray-400">{entry.target_type || '—'}</span>
                    {entry.target_id && (
                      <span className="ml-1 text-gray-500" title={entry.target_id}>
                        {entry.target_id.length > 12
                          ? entry.target_id.slice(0, 12) + '…'
                          : entry.target_id}
                      </span>
                    )}
                  </td>
                  <td
                    className="hidden max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-500 sm:table-cell"
                    title={entry.details ? JSON.stringify(entry.details) : undefined}
                  >
                    {truncateJson(entry.details)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {entry.actor_fid ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
            className="rounded-lg border border-white/[0.08] bg-[#0d1b2a] px-4 py-2 text-white transition-colors hover:border-[#f5a623] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= total}
            className="rounded-lg border border-white/[0.08] bg-[#0d1b2a] px-4 py-2 text-white transition-colors hover:border-[#f5a623] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
