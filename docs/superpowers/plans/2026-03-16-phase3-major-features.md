# Phase 3: Major Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship major features: expanded notification triggers, contribute page content, notifications page, and tools page activation.

**Architecture:** Independent tasks, no shared files. Cross-posting already fully implemented (ComposeBar + send route).

**Tech Stack:** Next.js, Supabase, React

---

## Task 1: Add Notification Triggers Across the App

Currently `createInAppNotification` is only called from `/api/chat/send` and `/api/chat/react`. Add triggers for proposals and new member joins.

**Files:**
- Modify: `src/app/api/proposals/route.ts` — notify on proposal creation
- Modify: `src/app/api/proposals/vote/route.ts` — notify proposal author on vote
- Modify: `src/app/api/auth/verify/route.ts` — notify admins on new member login

- [ ] **Step 1: Add notification on proposal creation**

In `src/app/api/proposals/route.ts`, in the POST handler after successful proposal insert, add:

```typescript
import { createInAppNotification } from '@/lib/notifications';

// After successful insert, notify all active members
supabaseAdmin
  .from('users')
  .select('fid')
  .eq('is_active', true)
  .neq('fid', session.fid)
  .then(({ data: members }) => {
    if (members?.length) {
      createInAppNotification({
        recipientFids: members.map((m) => m.fid).filter(Boolean),
        type: 'proposal',
        title: `${session.displayName} created a proposal`,
        body: parsed.data.title,
        href: '/governance',
        actorFid: session.fid,
        actorDisplayName: session.displayName,
        actorPfpUrl: session.pfpUrl,
      }).catch(() => {});
    }
  })
  .catch(() => {});
```

- [ ] **Step 2: Add notification on vote**

In `src/app/api/proposals/vote/route.ts`, after successful vote insert, notify the proposal author:

```typescript
import { createInAppNotification } from '@/lib/notifications';

// Look up proposal author and notify
supabaseAdmin
  .from('proposals')
  .select('author_fid, title')
  .eq('id', parsed.data.proposal_id)
  .single()
  .then(({ data: proposal }) => {
    if (proposal && proposal.author_fid !== session.fid) {
      createInAppNotification({
        recipientFids: [proposal.author_fid],
        type: 'vote',
        title: `${session.displayName} voted on your proposal`,
        body: proposal.title,
        href: '/governance',
        actorFid: session.fid,
        actorDisplayName: session.displayName,
        actorPfpUrl: session.pfpUrl,
      }).catch(() => {});
    }
  })
  .catch(() => {});
```

- [ ] **Step 3: Notify admins on new member first login**

In `src/app/api/auth/verify/route.ts`, after the user upsert, check if this is a first login (no previous `last_login_at`). If so, notify admins:

```typescript
import { createInAppNotification } from '@/lib/notifications';
import { communityConfig } from '@/../community.config';

// After upsert, check if first login
if (!existingUser?.last_login_at) {
  const adminFids = communityConfig.adminFids || [];
  if (adminFids.length > 0) {
    createInAppNotification({
      recipientFids: adminFids,
      type: 'member',
      title: 'New member joined ZAO OS',
      body: `${result.fid ? session.displayName : 'A new user'} logged in for the first time`,
      href: '/admin',
      actorFid: session.fid,
      actorDisplayName: session.displayName,
      actorPfpUrl: session.pfpUrl,
    }).catch(() => {});
  }
}
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/proposals/route.ts src/app/api/proposals/vote/route.ts src/app/api/auth/verify/route.ts
git commit -m "Add notification triggers for proposals, votes, and new members"
```

---

## Task 2: Full Notifications Page

Create a dedicated page at `/notifications` for browsing all notification history (the bell dropdown only shows the latest few).

**Files:**
- Create: `src/app/(auth)/notifications/page.tsx`

- [ ] **Step 1: Create notifications page**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

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
    <div className="min-h-screen bg-[#0a1628] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <a href="/chat" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </a>
            <h1 className="text-lg font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#f5a623] text-black text-xs font-bold">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-[#f5a623] hover:text-[#ffd700] font-medium">
              Mark all read
            </button>
          )}
        </div>

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
            <p className="text-gray-500 text-sm">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map(n => (
              <a
                key={n.id}
                href={n.href}
                onClick={() => !n.read && markRead(n.id)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/notifications/page.tsx
git commit -m "Add full notifications page at /notifications"
```

---

## Task 3: Contribute Page — Fill Placeholders

Replace the 3 "Coming soon" placeholders with real content. Keep it simple — links and descriptions, not full sub-apps.

**Files:**
- Modify: `src/app/(auth)/contribute/page.tsx`

- [ ] **Step 1: Replace Coming Soon placeholders with real content**

Replace the Bounties placeholder (lines 47-57) with a link to GitHub issues:
```typescript
<a
  href="https://github.com/bettercallzaal/ZAOOS/issues?q=is%3Aissue+is%3Aopen+label%3Abounty"
  target="_blank"
  rel="noopener noreferrer"
  className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 hover:border-[#f5a623]/30 transition-colors block"
>
  <div className="flex items-center gap-3">
    <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
    <div>
      <p className="text-sm font-medium text-white">Bounties</p>
      <p className="text-xs text-gray-500">View open bounties on GitHub</p>
    </div>
  </div>
</a>
```

Replace the Documentation placeholder (lines 59-69) with a link to the research library:
```typescript
<a
  href="https://github.com/bettercallzaal/ZAOOS/tree/main/research"
  target="_blank"
  rel="noopener noreferrer"
  className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 hover:border-[#f5a623]/30 transition-colors block"
>
  <div className="flex items-center gap-3">
    <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
    <div>
      <p className="text-sm font-medium text-white">Documentation</p>
      <p className="text-xs text-gray-500">54 research docs + project guides</p>
    </div>
  </div>
</a>
```

Replace the Fork Guide placeholder (lines 71-81) with a link:
```typescript
<a
  href="https://github.com/bettercallzaal/ZAOOS#forking"
  target="_blank"
  rel="noopener noreferrer"
  className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 hover:border-[#f5a623]/30 transition-colors block"
>
  <div className="flex items-center gap-3">
    <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
    <div>
      <p className="text-sm font-medium text-white">Fork Guide</p>
      <p className="text-xs text-gray-500">Launch ZAO OS for your community</p>
    </div>
  </div>
</a>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/contribute/page.tsx
git commit -m "Fill contribute page placeholders with real links"
```

---

## Task 4: Tools Page — Activate Placeholders

Update the tools page to remove "Coming soon" from items that are built, and link to the cross-post feature that already exists in the chat compose bar.

**Files:**
- Modify: `src/app/(auth)/tools/page.tsx`

- [ ] **Step 1: Update Cross-Post item**

Replace the Cross-Post "Coming soon" placeholder (lines 82-92) with a working description:
```typescript
<a
  href="/chat"
  className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 hover:border-[#f5a623]/30 transition-colors block"
>
  <div className="flex items-center gap-3">
    <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
    <div>
      <p className="text-sm font-medium text-white">Cross-Post</p>
      <p className="text-xs text-gray-500">Post to multiple channels at once — use the share icon in chat</p>
    </div>
  </div>
</a>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/tools/page.tsx
git commit -m "Activate cross-post link on tools page"
```

---

## Verification

After all tasks are complete:

- [ ] Run `npm run build` — must pass
- [ ] Test: Create a proposal → check notification bell for other users
- [ ] Test: Vote on proposal → author should get notification
- [ ] Test: Visit /notifications page → full history visible
- [ ] Test: Contribute page → all 3 items are clickable links
- [ ] Test: Tools page → cross-post links to chat
