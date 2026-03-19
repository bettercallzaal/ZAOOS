'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { communityConfig } from '@/../community.config';
import type { SupabaseClient } from '@supabase/supabase-js';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  actor_display_name: string | null;
  actor_pfp_url: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const TYPE_ICONS: Record<string, string> = {
  message: 'M',
  proposal: 'P',
  vote: 'V',
  comment: 'C',
  member: 'N',
  system: 'S',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
  }, []);

  // Initial fetch + Supabase Realtime subscription (falls back to polling)
  /* eslint-disable react-hooks/set-state-in-effect -- initial fetch triggers async setState */
  useEffect(() => {
    fetchNotifications();

    let channel: ReturnType<SupabaseClient['channel']> | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    try {
      // Dynamic require so this works even if the browser client isn't configured
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabaseBrowser } = require('@/lib/db/supabase');
      const supabase: SupabaseClient = getSupabaseBrowser();
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'in_app_notifications',
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    } catch {
      // Realtime not available — fall back to 30-second polling
      fallbackInterval = setInterval(fetchNotifications, 30_000);
    }

    return () => {
      channel?.unsubscribe();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchNotifications]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-4 h-4 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ backgroundColor: communityConfig.colors.primary }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-[#0d1b2a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-[60]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-600">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                    setOpen(false);
                  }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 transition-colors ${
                    !n.read ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  {/* Avatar or type icon */}
                  {n.actor_pfp_url ? (
                    <Image
                      src={n.actor_pfp_url}
                      alt={`${n.actor_display_name || 'User'} avatar`}
                      width={32}
                      height={32}
                      className="rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white/80"
                      style={{ backgroundColor: communityConfig.colors.primary + '30' }}
                    >
                      {TYPE_ICONS[n.type] || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white leading-snug">
                      <span className="font-semibold">{n.title}</span>
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: communityConfig.colors.primary }}
                    />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
