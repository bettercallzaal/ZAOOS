# Phase 1: Immediate Fixes & Critical Security Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken functionality and patch critical security vulnerabilities identified in the 2026-03-16 audit.

**Architecture:** All changes are surgical — small, independent fixes to existing files. No new abstractions. Each task can be committed and deployed independently.

**Tech Stack:** Next.js API routes, Zod validation, Supabase, Neynar webhooks, iron-session

---

## Task 1: Fix Webhook Channel Names

**Files:**
- Modify: `src/app/api/webhooks/neynar/route.ts:6`

- [ ] **Step 1: Replace hardcoded channels with import from community.config.ts**

Replace line 6:
```typescript
const WATCHED_CHANNELS = ['zao', 'zabal', 'coc'];
```

With:
```typescript
import { communityConfig } from '@/../community.config';
const WATCHED_CHANNELS: readonly string[] = communityConfig.farcaster.channels;
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/neynar/route.ts
git commit -m "Fix webhook channel names — import from community.config.ts"
```

---

## Task 2: Add Zod Validation to `/api/chat/react`

**Files:**
- Modify: `src/app/api/chat/react/route.ts:1-5,18-20,60-62`

- [ ] **Step 1: Add Zod schema and replace manual parsing in POST handler**

Add import at the top of the file:
```typescript
import { castHashSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

const reactSchema = z.object({
  type: z.enum(['like', 'recast']),
  hash: castHashSchema,
});
```

Replace line 18 (`const { type, hash } = await req.json();`) and the type check on lines 19-21 with:
```typescript
    const body = await req.json().catch(() => null);
    const parsed = reactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { type, hash } = parsed.data;
```

Remove the old `if (!['like', 'recast'].includes(type))` check since Zod handles it.

- [ ] **Step 2: Apply same fix to DELETE handler**

Replace line 60 (`const { type, hash } = await req.json();`) and the type check on lines 61-63 with the same Zod parse pattern.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/react/route.ts
git commit -m "Add Zod validation to /api/chat/react endpoint"
```

---

## Task 3: Add Rate Limit to `/api/chat/react`

**Files:**
- Modify: `src/middleware.ts` — inside `getRateLimitConfig` function

- [ ] **Step 1: Add rate limit rule for react endpoint**

Add after the `/api/chat/send` rule (around line 14):
```typescript
  if (pathname.startsWith('/api/chat/react')) {
    return { limit: 30, windowMs: MINUTE };
  }
```

- [ ] **Step 2: Also add rate limits for unprotected read endpoints**

Add rules for `/api/chat/messages` and `/api/chat/thread`:
```typescript
  if (pathname.startsWith('/api/chat/messages') || pathname.startsWith('/api/chat/thread')) {
    return { limit: 30, windowMs: MINUTE };
  }
```

- [ ] **Step 3: Prefer `x-real-ip` over `x-forwarded-for`**

Find the IP extraction line (around line 71):
```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
```

Replace with:
```typescript
const ip = request.headers.get('x-real-ip')
  || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  || 'unknown';
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts
git commit -m "Add rate limits for react/messages/thread endpoints, prefer x-real-ip"
```

---

## Task 4: Require Webhook HMAC Secret

**Files:**
- Modify: `src/app/api/webhooks/neynar/route.ts:51-58`

- [ ] **Step 1: Reject webhook requests when secret is not configured**

Find the HMAC verification section (around line 51). Currently it skips verification when the secret is undefined. Replace the `if (!secret)` branch:

```typescript
  const secret = ENV.NEYNAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] NEYNAR_WEBHOOK_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/neynar/route.ts
git commit -m "Require NEYNAR_WEBHOOK_SECRET — reject unsigned webhook requests"
```

---

## Task 5: Validate localStorage XMTP Key Format

**Files:**
- Modify: `src/lib/xmtp/client.ts:149-150`

- [ ] **Step 1: Add format validation before returning stored key**

Replace the current return logic in `getOrCreateLocalKey`:
```typescript
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    return stored as `0x${string}`;
  }
```

With:
```typescript
  const stored = localStorage.getItem(storageKey);
  if (stored && /^0x[0-9a-fA-F]{64}$/.test(stored)) {
    return stored as `0x${string}`;
  }
  // Invalid or missing — remove corrupted data and regenerate
  if (stored) localStorage.removeItem(storageKey);
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/lib/xmtp/client.ts
git commit -m "Validate localStorage XMTP key format before use"
```

---

## Task 6: Add XMTP Message Length Limit

**Files:**
- Modify: `src/contexts/XMTPContext.tsx` — `sendMessage` function (around line 853)
- Modify: `src/components/messages/MessageCompose.tsx` — textarea element (around line 63)

- [ ] **Step 1: Add maxLength to textarea**

In `MessageCompose.tsx`, add `maxLength={4000}` to the textarea element:
```typescript
<textarea
  maxLength={4000}
  // ... existing props
/>
```

- [ ] **Step 2: Add length validation in sendMessage**

In `XMTPContext.tsx`, in the `sendMessage` function, after the trim check add:
```typescript
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 4000) {
      showActionError('Message too long (max 4000 characters)');
      return;
    }
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/contexts/XMTPContext.tsx src/components/messages/MessageCompose.tsx
git commit -m "Add 4000 char message length limit to XMTP messaging"
```

---

## Task 7: Fix Upload Route File Extension

**Files:**
- Modify: `src/app/api/upload/route.ts:31-32`

- [ ] **Step 1: Derive extension from validated MIME type instead of filename**

Replace lines 31-32:
```typescript
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${session.fid}/${Date.now()}.${ext}`;
```

With:
```typescript
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png',
      'image/gif': 'gif', 'image/webp': 'webp',
    };
    const ext = mimeToExt[file.type] || 'jpg';
    const filename = `${session.fid}/${Date.now()}.${ext}`;
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload/route.ts
git commit -m "Derive upload file extension from MIME type, not user filename"
```

---

## Task 8: Add Auth to Music Metadata Endpoint

**Files:**
- Modify: `src/app/api/music/metadata/route.ts` — add session check at top of GET handler

- [ ] **Step 1: Add session authentication**

Add at the top of the GET handler (after imports):
```typescript
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
```

Add the import if not present:
```typescript
import { getSessionData } from '@/lib/auth/session';
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/music/metadata/route.ts
git commit -m "Add session auth to /api/music/metadata to prevent SSRF"
```

---

## Task 9: Cache Thread Replies in Webhook

**Files:**
- Modify: `src/app/api/webhooks/neynar/route.ts:80-84`

- [ ] **Step 1: Remove the parent_hash filter so replies are cached**

Replace lines 80-84:
```typescript
  // Ignore replies (parent_hash set = reply to a cast, not a top-level channel post)
  // Top-level channel posts have parent_hash = null, parent_url = channel URL
  if (cast.parent_hash) {
    return NextResponse.json({ ok: true });
  }
```

With:
```typescript
  // Cache both top-level posts and replies for thread views
  // parent_hash is set for replies, null for top-level channel posts
```

The `castToRow` function already maps `parent_hash` correctly, so no other changes needed.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/neynar/route.ts
git commit -m "Cache thread replies in webhook — enable DB-first thread loading"
```

---

## Task 10: Add Missing Notification Triggers

**Files:**
- Modify: `src/app/api/chat/react/route.ts` — notify cast author on reaction
- Modify: `src/app/api/webhooks/neynar/route.ts` — notify on new channel cast from webhook

- [ ] **Step 1: Notify cast author on reaction (like/recast)**

In `/api/chat/react/route.ts` POST handler, after the successful Neynar reaction call, add a fire-and-forget notification. You'll need to look up the cast author's FID. Since we have the cast hash, query the `channel_casts` table:

```typescript
    // Fire-and-forget notification to cast author
    supabaseAdmin
      .from('channel_casts')
      .select('fid, author_display')
      .eq('hash', hash)
      .single()
      .then(({ data: castData }) => {
        if (castData && castData.fid !== session.fid) {
          createInAppNotification({
            recipientFids: [castData.fid],
            type: 'message',
            title: `${session.displayName} ${type === 'like' ? 'liked' : 'recasted'} your post`,
            body: '',
            href: '/chat',
            actorFid: session.fid,
            actorDisplayName: session.displayName,
            actorPfpUrl: session.pfpUrl,
          }).catch(() => {});
        }
      })
      .catch(() => {});
```

Add imports:
```typescript
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/react/route.ts src/app/api/webhooks/neynar/route.ts
git commit -m "Add notification triggers for reactions"
```

---

## Task 11: Add React Error Boundaries

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/app/(auth)/layout.tsx` — wrap children with error boundary

- [ ] **Step 1: Create ErrorBoundary component**

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-[#0a1628] min-h-screen">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-400 mb-4 max-w-sm">{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#f5a623] text-black font-medium rounded-lg hover:bg-[#ffd700] transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap auth layout with ErrorBoundary**

In `src/app/(auth)/layout.tsx`, import and wrap children:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

// In the return:
<ErrorBoundary>
  {children}
</ErrorBoundary>
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/ErrorBoundary.tsx src/app/\(auth\)/layout.tsx
git commit -m "Add React Error Boundaries to prevent full-page crashes"
```

---

## Verification

After all tasks are complete:

- [ ] Run `npm run build` — must pass
- [ ] Run `npm run lint` — check for any new warnings
- [ ] Verify webhook processes casts from all 4 channels (zao, zabal, cocconcertz, wavewarz)
- [ ] Verify `/api/chat/react` rejects invalid hashes
- [ ] Verify upload creates files with MIME-derived extensions
- [ ] Test Error Boundary by temporarily throwing in a component
