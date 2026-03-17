# Phase 2: Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship high-impact, low-effort features: feed pagination, browser Supabase client, SIWF nonce fix, proposal comments UI, and Supabase Realtime for notifications.

**Architecture:** Each task is independent and can be deployed separately. The browser Supabase client (Task 1) is a prerequisite for Realtime features (Tasks 4, 5).

**Tech Stack:** Next.js, Supabase Realtime, Zod, iron-session, Intersection Observer API

---

## Task 1: Create Browser-Safe Supabase Client

**Files:**
- Modify: `src/lib/db/supabase.ts`

- [ ] **Step 1: Add browser client export**

Add after the existing `supabaseAdmin` export:

```typescript
import { createClient as createBrowserClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
```

- [ ] **Step 2: Add env vars to `.env.example`**

Add:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/supabase.ts .env.example
git commit -m "Add browser-safe Supabase client for Realtime subscriptions"
```

---

## Task 2: SIWF Server-Side Nonce Validation

**Files:**
- Modify: `src/app/api/auth/verify/route.ts`

- [ ] **Step 1: Add nonce store and GET handler (copy pattern from siwe/route.ts)**

Add at the top of the file, after imports:

```typescript
import crypto from 'crypto';

const NONCE_TTL = 5 * 60 * 1000;
const MAX_NONCES = 10_000;
const nonceStore = new Map<string, number>();

function pruneNonces() {
  if (nonceStore.size <= MAX_NONCES) return;
  const now = Date.now();
  for (const [n, ts] of nonceStore) {
    if (now - ts > NONCE_TTL) nonceStore.delete(n);
  }
}
```

- [ ] **Step 2: Add GET handler to generate nonces**

Add before the POST handler:

```typescript
export async function GET() {
  pruneNonces();
  const nonce = crypto.randomBytes(16).toString('hex');
  nonceStore.set(nonce, Date.now());
  return NextResponse.json({ nonce });
}
```

- [ ] **Step 3: Validate and consume nonce in POST handler**

In the POST handler, after extracting `nonce` from the body, add validation before `verifySignInMessage`:

```typescript
    // Validate server-issued nonce
    const nonceTimestamp = nonceStore.get(nonce);
    if (!nonceTimestamp || Date.now() - nonceTimestamp > NONCE_TTL) {
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 400 });
    }
    nonceStore.delete(nonce); // One-time use
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/verify/route.ts
git commit -m "Add server-side nonce validation to SIWF verify endpoint"
```

---

## Task 3: Feed Pagination with Cursor

**Files:**
- Modify: `src/app/api/chat/messages/route.ts`
- Modify: `src/hooks/useChat.ts`
- Modify: `src/components/chat/MessageList.tsx`

- [ ] **Step 1: Add cursor support to messages API**

In `src/app/api/chat/messages/route.ts`, update the GET handler to accept cursor and limit params. After session check, extract params:

```typescript
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor'); // ISO timestamp
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
```

Update the DB query to support cursor-based pagination. Find the existing `.from('channel_casts')` query and modify:

```typescript
  let query = supabaseAdmin
    .from('channel_casts')
    .select('*')
    .eq('channel_id', channel)
    .order('timestamp', { ascending: false })
    .limit(limit + 1); // Fetch one extra to detect hasMore

  if (cursor) {
    query = query.lt('timestamp', cursor);
  }

  const { data, error } = await query;
```

Return with `hasMore` flag:

```typescript
  const hasMore = (data?.length || 0) > limit;
  const casts = (data || []).slice(0, limit).map(rowToCast);
  return NextResponse.json({ casts, hasMore });
```

- [ ] **Step 2: Add pagination state to useChat**

In `src/hooks/useChat.ts`, add cursor state and `loadMore` function:

```typescript
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
```

Add `loadMore` callback:

```typescript
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldestTimestamp = messages[0]?.timestamp; // oldest visible message
      const res = await fetch(`/api/chat/messages?channel=${channel}&cursor=${oldestTimestamp}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const older = (data.casts || []) as Cast[];
        setHasMore(data.hasMore ?? false);
        if (older.length > 0) {
          setMessages(prev => {
            const existingHashes = new Set(prev.map(m => m.hash));
            const newMessages = older.filter(m => !existingHashes.has(m.hash));
            return [...newMessages, ...prev];
          });
        }
      }
    } catch { /* ignore */ }
    setLoadingMore(false);
  }, [channel, messages, loadingMore, hasMore]);
```

Return `loadMore`, `hasMore`, and `loadingMore` from the hook.

- [ ] **Step 3: Add Intersection Observer to MessageList**

In `src/components/chat/MessageList.tsx`, add a sentinel element at the top (for loading older messages) with an Intersection Observer:

```typescript
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);
```

Add the sentinel div at the top of the message list:

```tsx
{hasMore && (
  <div ref={sentinelRef} className="flex justify-center py-2">
    {loadingMore ? (
      <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
    ) : (
      <span className="text-xs text-gray-600">Scroll up for older messages</span>
    )}
  </div>
)}
```

Update the component props to accept `onLoadMore`, `hasMore`, and `loadingMore`.

- [ ] **Step 4: Wire up in ChatRoom**

In `src/components/chat/ChatRoom.tsx`, pass the new props from `useChat` to `MessageList`:

```tsx
<MessageList
  messages={messages}
  // ... existing props
  onLoadMore={loadMore}
  hasMore={hasMore}
  loadingMore={loadingMore}
/>
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/app/api/chat/messages/route.ts src/hooks/useChat.ts src/components/chat/MessageList.tsx src/components/chat/ChatRoom.tsx
git commit -m "Add feed pagination with cursor-based infinite scroll"
```

---

## Task 4: Supabase Realtime for Notifications

**Files:**
- Modify: `src/components/navigation/NotificationBell.tsx`

**Dependency:** Task 1 (browser Supabase client) must be done first, AND `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars must be set.

- [ ] **Step 1: Replace polling with Realtime subscription**

In `NotificationBell.tsx`, replace the polling useEffect (the one with `setInterval(fetchNotifications, 30_000)`) with a Realtime subscription:

```typescript
  // Initial fetch + Realtime subscription
  useEffect(() => {
    fetchNotifications();

    let channel: ReturnType<SupabaseClient['channel']> | null = null;
    try {
      const { getSupabaseBrowser } = require('@/lib/db/supabase');
      const supabase = getSupabaseBrowser();
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'in_app_notifications',
          },
          () => { fetchNotifications(); }
        )
        .subscribe();
    } catch {
      // Fallback to polling if Realtime not available
      const interval = setInterval(fetchNotifications, 30_000);
      return () => clearInterval(interval);
    }

    return () => { channel?.unsubscribe(); };
  }, [fetchNotifications]);
```

Add import at top:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation/NotificationBell.tsx
git commit -m "Replace notification polling with Supabase Realtime subscription"
```

---

## Task 5: Proposal Comments UI

**Files:**
- Create: `src/components/governance/ProposalComments.tsx`
- Modify: `src/app/(auth)/governance/page.tsx`

- [ ] **Step 1: Create ProposalComments component**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_fid: number;
  author_display_name: string;
  author_pfp_url: string;
  author_username: string;
}

interface ProposalCommentsProps {
  proposalId: string;
  currentFid: number;
}

export function ProposalComments({ proposalId, currentFid }: ProposalCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/proposals/comment?proposal_id=${proposalId}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
    setLoading(false);
  }, [proposalId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/proposals/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, body: text.trim() }),
      });
      if (res.ok) {
        setText('');
        await fetchComments();
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  function timeAgo(ts: string): string {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div className="mt-4 border-t border-gray-800 pt-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        Comments {!loading && `(${comments.length})`}
      </p>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-800" />
              <div className="flex-1 h-8 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-600 mb-3">No comments yet</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              {c.author_pfp_url ? (
                <div className="w-6 h-6 relative flex-shrink-0">
                  <Image src={c.author_pfp_url} alt="" fill className="rounded-full object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] text-gray-400">{c.author_display_name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-white">{c.author_display_name}</span>
                  <span className="text-[10px] text-gray-600">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5 break-words">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Add a comment..."
          maxLength={2000}
          className="flex-1 bg-[#0d1b2a] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || sending}
          className="px-3 py-2 bg-[#f5a623] text-black text-xs font-medium rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
        >
          {sending ? '...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate into governance page**

In `src/app/(auth)/governance/page.tsx`, find where proposals are rendered (likely a map over proposals with vote buttons). Add the ProposalComments component inside each proposal card, toggled by clicking the comment count:

Import at top:
```typescript
import { ProposalComments } from '@/components/governance/ProposalComments';
```

Add state for expanded comments:
```typescript
const [expandedComments, setExpandedComments] = useState<string | null>(null);
```

Below the existing vote buttons / comment count display, add:
```tsx
<button
  onClick={() => setExpandedComments(expandedComments === proposal.id ? null : proposal.id)}
  className="text-xs text-gray-500 hover:text-white transition-colors"
>
  {proposal.commentCount || 0} comments
</button>
{expandedComments === proposal.id && (
  <ProposalComments proposalId={proposal.id} currentFid={user.fid} />
)}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/governance/ProposalComments.tsx src/app/\(auth\)/governance/page.tsx
git commit -m "Add proposal comments UI with inline thread view"
```

---

## Verification

After all tasks are complete:

- [ ] Run `npm run build` — must pass
- [ ] Test: Scroll up in chat feed to trigger pagination loading
- [ ] Test: Open a proposal and post a comment
- [ ] Test: If Realtime env vars set, verify notifications arrive without polling delay
- [ ] Test: SIWF login still works (nonce generated + validated)
