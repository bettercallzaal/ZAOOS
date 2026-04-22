'use client';

import { useEffect, useState } from 'react';

interface ActivityRow {
  id: string;
  actor: { id: string; name: string } | null;
  entity_type: string;
  entity_id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function describe(row: ActivityRow): string {
  const actor = row.actor?.name ?? 'Someone';
  switch (row.action) {
    case 'create':
      return `${actor} created this`;
    case 'delete':
      return `${actor} deleted this`;
    case 'update': {
      const field = row.field_changed || 'something';
      if (row.old_value && row.new_value) {
        return `${actor} changed ${field}: ${truncate(row.old_value)} -> ${truncate(row.new_value)}`;
      }
      return `${actor} updated ${field}`;
    }
    case 'comment':
      return `${actor} commented: ${truncate(row.new_value || '')}`;
    case 'contact_log':
      return `${actor} logged contact: ${truncate(row.new_value || '')}`;
    case 'attachment_add':
      return `${actor} uploaded ${truncate(row.new_value || 'a file')}`;
    case 'attachment_delete':
      return `${actor} removed ${truncate(row.old_value || 'a file')}`;
    default:
      return `${actor} ${row.action}`;
  }
}

function truncate(s: string, n = 80): string {
  const clean = s.replace(/^"|"$/g, '');
  return clean.length > n ? `${clean.slice(0, n)}...` : clean;
}

export function ActivityRail({
  entityType,
  entityId,
  limit = 20,
}: {
  entityType: string;
  entityId: string;
  limit?: number;
}) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/stock/team/activity?entity_type=${entityType}&entity_id=${entityId}&limit=${limit}`,
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed');
        if (!cancelled) setRows(json.activity || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, limit]);

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wider text-gray-500">Activity</div>
      {loading ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-xs text-red-400">{error}</div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-gray-500 italic">No activity yet.</div>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li
              key={r.id}
              className="text-xs text-gray-300 flex items-start gap-2 bg-[#0a1628] border border-white/5 rounded px-3 py-2"
            >
              <span className="shrink-0 text-gray-500 w-16">{relativeTime(r.created_at)}</span>
              <span className="flex-1">{describe(r)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
