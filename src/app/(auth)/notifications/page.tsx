'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/navigation/PageHeader';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
  actor_display_name: string | null;
  actor_pfp_url: string | null;
}

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const typeIcons: Record<string, string> = {
  message: 'M7.5 8.25h9m-9 3H12',
  proposal: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125',
  vote: 'M9 12.75L11.25 15 15 9.75',
  comment: 'M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12',
  member: 'M18 18.72a9.094 9.094 0 003.741-.479',
  system: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (filter === 'unread') params.set('unread_only', 'true');
    const res = await fetch(`/api/notifications?${params}`);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
    }
    setLoading(false);
  }, [filter]);

   
  useEffect(() => { setLoading(true); fetchNotifications(); }, [fetchNotifications]);
   

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] pb-36 text-white">
      <PageHeader
        title="Notifications"
        backHref="/home"
        count={unreadCount > 0 ? unreadCount : undefined}
        rightAction={unreadCount > 0 ? (
          <button onClick={markAllRead} className="text-xs text-[#f5a623] hover:text-[#ffd700] font-medium">
            Mark all read
          </button>
        ) : undefined}
      />
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="flex gap-2 mb-4">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <div className="w-8 h-8 rounded-full bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-800/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            {filter === 'unread' ? (
              <>
                <p className="text-gray-400 text-sm font-medium">All caught up!</p>
                <p className="text-gray-500 text-xs mt-1">No unread notifications.</p>
                <button
                  onClick={() => setFilter('all')}
                  className="mt-3 text-xs font-medium text-[#f5a623] hover:text-[#ffd700] transition-colors"
                >
                  View All
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No notifications yet</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map(n => (
              <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notification Item ──────────────────────────────────────────────────────

const NotificationItem = memo(function NotificationItem({
  notification: n,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <a
      href={n.href}
      onClick={() => !n.read && onMarkRead(n.id)}
      className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-colors ${
        n.read ? 'hover:bg-white/5' : 'bg-[#f5a623]/5 hover:bg-[#f5a623]/10'
      }`}
    >
      {n.actor_pfp_url ? (
        <div className="w-8 h-8 relative flex-shrink-0">
          <Image src={n.actor_pfp_url} alt="" fill className="rounded-full object-cover" unoptimized />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[n.type] || typeIcons.system} />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${n.read ? 'text-gray-300' : 'text-white font-medium'}`}>{n.title}</p>
        {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.body}</p>}
        <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
      </div>
      {!n.read && <span className="w-2 h-2 rounded-full bg-[#f5a623] flex-shrink-0 mt-2" />}
    </a>
  );
});
