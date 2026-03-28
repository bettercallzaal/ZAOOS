# 98 — Supabase Database Optimizations for ZAO OS

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Deep dive on Realtime notifications, materialized views, database functions, RLS audit, Supabase Vault, triggers, and connection pooling
> **Builds on:** [Doc 42 — Supabase Advanced Patterns](../042-supabase-advanced-patterns/README.md), [Doc 93 — Supabase Scaling & Optimization](../176-supabase-scaling-optimization/README.md)

---

## Table of Contents

1. [Supabase Realtime — Live Notification Badges](#1-supabase-realtime--live-notification-badges)
2. [Materialized Views — Respect Leaderboard](#2-materialized-views--respect-leaderboard)
3. [Database Functions — Transactional Operations](#3-database-functions--transactional-operations)
4. [Row-Level Security Audit — All 22 Tables](#4-row-level-security-audit--all-22-tables)
5. [Supabase Vault — Encrypted Secret Storage](#5-supabase-vault--encrypted-secret-storage)
6. [Database Triggers — Automation](#6-database-triggers--automation)
7. [Connection Pooling — Next.js Serverless Best Practices](#7-connection-pooling--nextjs-serverless-best-practices)

---

## 1. Supabase Realtime — Live Notification Badges

### Current State

`NotificationBell.tsx` subscribes to Postgres Changes on `in_app_notifications` (note: the actual table is `notifications`). It listens for INSERT events and re-fetches the full notification list. Falls back to 30-second polling if Realtime fails.

**Problem:** The subscription listens to table name `in_app_notifications` but the actual table is `notifications`. This means Realtime never fires, and the component silently falls back to polling. This needs fixing.

### Fix 1: Correct Table Name + Add FID Filter

```typescript
// src/components/navigation/NotificationBell.tsx — fixed subscription
channel = supabase
  .channel(`notifications:${currentUserFid}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',  // <-- fix: was 'in_app_notifications'
      filter: `recipient_fid=eq.${currentUserFid}`,  // server-side filter
    },
    (payload) => {
      // Optimistic: add new notification to local state immediately
      const newNotif = payload.new as Notification;
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    }
  )
  .subscribe();
```

The `filter` parameter is critical at scale. Without it, Supabase performs an RLS check for **every subscriber** on every INSERT. With the filter, only the matching subscriber gets checked.

### Fix 2: Enable Realtime on the notifications Table

Supabase Realtime Postgres Changes requires the table to be added to the Realtime publication. This is a one-time SQL command:

```sql
-- Enable Realtime on the notifications table
-- Run in SQL Editor (one-time setup)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

Without this, subscriptions silently receive nothing. This is the most common Realtime setup issue.

### Fix 3: Optimistic Badge Update

Instead of re-fetching the entire notification list on every Realtime event, update state incrementally:

```typescript
// In NotificationBell.tsx
const handleRealtimeInsert = useCallback((payload: { new: Record<string, unknown> }) => {
  const newNotif = payload.new as Notification;

  // Add to top of list (newest first)
  setNotifications((prev) => {
    // Prevent duplicates (Realtime can sometimes deliver twice)
    if (prev.some((n) => n.id === newNotif.id)) return prev;
    return [newNotif, ...prev.slice(0, 49)]; // Keep max 50
  });

  // Increment unread badge
  setUnreadCount((c) => c + 1);
}, []);
```

### Complete Realtime Hook Pattern

For a reusable pattern across the app:

```typescript
// src/hooks/useRealtimeNotifications.ts
'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeNotificationsOptions {
  fid: number;
  onNewNotification: (notification: Record<string, unknown>) => void;
  onError?: () => void;
}

export function useRealtimeNotifications({
  fid,
  onNewNotification,
  onError,
}: UseRealtimeNotificationsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    if (fallbackRef.current) {
      clearInterval(fallbackRef.current);
      fallbackRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!fid) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabaseBrowser } = require('@/lib/db/supabase');
      const supabase: SupabaseClient = getSupabaseBrowser();

      channelRef.current = supabase
        .channel(`notifications:${fid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_fid=eq.${fid}`,
          },
          (payload) => {
            onNewNotification(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Fall back to polling on Realtime failure
            console.warn('[Realtime] Subscription failed, falling back to polling');
            fallbackRef.current = setInterval(() => {
              onError?.();
            }, 30_000);
          }
        });
    } catch {
      // Supabase browser client not available
      onError?.();
    }

    return cleanup;
  }, [fid, onNewNotification, onError, cleanup]);

  return { cleanup };
}
```

### Realtime Requirements Checklist

1. Table must be in the Realtime publication (`ALTER PUBLICATION supabase_realtime ADD TABLE notifications`)
2. Anon key client must be used (not service role)
3. RLS must allow SELECT for the subscribing user (already done via `add-notifications-rls.sql`)
4. Channel name must be unique per subscription scope (use `notifications:${fid}`)
5. Always `unsubscribe()` in useEffect cleanup
6. Always implement polling fallback

---

## 2. Materialized Views — Respect Leaderboard

### Current Problem

The respect leaderboard is computed from `respect_members` on every request, joining with `users` for profile data and sorting by `total_respect DESC`. With 40 members this is fast, but the join + sort + rank computation gets expensive as the community grows.

### Solution: Materialized View + pg_cron Refresh

```sql
-- ============================================================
-- Materialized View: respect_leaderboard
-- Pre-computes the leaderboard with user profile data and ranks.
-- Refreshed every 5 minutes via pg_cron.
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS respect_leaderboard AS
  SELECT
    rm.id,
    rm.name,
    rm.wallet_address,
    rm.fid,
    rm.total_respect,
    rm.fractal_respect,
    rm.event_respect,
    rm.hosting_respect,
    rm.bonus_respect,
    rm.onchain_og,
    rm.onchain_zor,
    rm.fractal_count,
    rm.hosting_count,
    rm.first_respect_at,
    u.pfp_url,
    u.username,
    u.display_name,
    RANK() OVER (ORDER BY rm.total_respect DESC) AS rank,
    PERCENT_RANK() OVER (ORDER BY rm.total_respect DESC) AS percentile
  FROM respect_members rm
  LEFT JOIN users u ON rm.fid = u.fid
  WHERE rm.total_respect > 0
  ORDER BY rm.total_respect DESC;

-- Unique index required for CONCURRENTLY refresh (no read lock)
CREATE UNIQUE INDEX IF NOT EXISTS idx_respect_leaderboard_id
  ON respect_leaderboard (id);

-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_respect_leaderboard_rank
  ON respect_leaderboard (rank);

CREATE INDEX IF NOT EXISTS idx_respect_leaderboard_fid
  ON respect_leaderboard (fid)
  WHERE fid IS NOT NULL;
```

### Schedule Refresh via pg_cron

```sql
-- Refresh every 5 minutes (CONCURRENTLY = no read lock during refresh)
SELECT cron.schedule(
  'refresh-respect-leaderboard',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY respect_leaderboard$$
);
```

**Why CONCURRENTLY matters:** Without it, the view is locked during refresh (nobody can read it). With CONCURRENTLY, reads continue against the old data while the new data is being built. Requires a UNIQUE index on the view.

### Query the Materialized View

```typescript
// In API route: /api/respect/leaderboard
const { data, error } = await supabaseAdmin
  .from('respect_leaderboard')  // Supabase treats mat views like tables
  .select('*')
  .order('rank', { ascending: true })
  .range(0, 49);
```

### Additional Materialized Views Worth Creating

#### Community Stats Dashboard

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS community_stats AS
  SELECT
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS active_members,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admin_count,
    (SELECT COUNT(*) FROM proposals WHERE status = 'open') AS open_proposals,
    (SELECT COUNT(*) FROM fractal_sessions) AS total_fractals,
    (SELECT COALESCE(SUM(total_respect), 0) FROM respect_members) AS total_respect_issued,
    (SELECT COUNT(*) FROM channel_casts WHERE timestamp > NOW() - INTERVAL '7 days') AS casts_last_7d,
    (SELECT COUNT(*) FROM song_submissions) AS total_songs,
    NOW() AS refreshed_at;

-- No unique index needed (single row), use non-concurrent refresh
SELECT cron.schedule(
  'refresh-community-stats',
  '*/10 * * * *',
  $$REFRESH MATERIALIZED VIEW community_stats$$
);
```

#### Proposal Vote Tallies

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS proposal_vote_tallies AS
  SELECT
    p.id AS proposal_id,
    p.title,
    p.status,
    p.created_at,
    p.closes_at,
    COUNT(pv.id) AS total_votes,
    COUNT(pv.id) FILTER (WHERE pv.vote = 'for') AS votes_for,
    COUNT(pv.id) FILTER (WHERE pv.vote = 'against') AS votes_against,
    COUNT(pv.id) FILTER (WHERE pv.vote = 'abstain') AS votes_abstain,
    COALESCE(SUM(pv.respect_weight) FILTER (WHERE pv.vote = 'for'), 0) AS weight_for,
    COALESCE(SUM(pv.respect_weight) FILTER (WHERE pv.vote = 'against'), 0) AS weight_against
  FROM proposals p
  LEFT JOIN proposal_votes pv ON p.id = pv.proposal_id
  GROUP BY p.id, p.title, p.status, p.created_at, p.closes_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_proposal_tallies_id
  ON proposal_vote_tallies (proposal_id);

SELECT cron.schedule(
  'refresh-proposal-tallies',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY proposal_vote_tallies$$
);
```

### Materialized View Best Practices

| Rule | Why |
|------|-----|
| Always add a UNIQUE index | Required for `REFRESH CONCURRENTLY` |
| Refresh frequency matches data staleness tolerance | Leaderboard: 5 min is fine. Live vote counts: consider 1 min |
| Monitor refresh duration | `SELECT * FROM cron.job_run_details WHERE jobname = 'refresh-respect-leaderboard' ORDER BY start_time DESC LIMIT 5;` |
| Don't over-refresh | Each refresh does a full re-computation. At 40 members this takes <100ms. At 1,000 it might take 500ms. |
| Use regular views for small, simple queries | Materialized views add complexity. Only use when the computation is expensive enough to justify caching. |

---

## 3. Database Functions — Transactional Operations

Database functions (stored procedures) run inside PostgreSQL, giving you:
- **Atomicity:** Multiple operations in a single transaction
- **Performance:** No round-trip latency between app and DB
- **Security:** Can be `SECURITY DEFINER` to bypass RLS for specific operations

### Function 1: Vote on Proposal + Check Threshold (Atomic)

Currently this requires multiple API calls: insert vote, re-query vote counts, check if threshold is met, update proposal status. This should be a single transaction:

```sql
CREATE OR REPLACE FUNCTION cast_vote_and_check_threshold(
  p_proposal_id UUID,
  p_voter_id UUID,
  p_vote TEXT,
  p_respect_weight INTEGER,
  p_approval_threshold INTEGER DEFAULT 3  -- configurable threshold
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_votes_for INTEGER;
  v_votes_against INTEGER;
  v_total_votes INTEGER;
  v_proposal_status TEXT;
BEGIN
  -- 1. Check proposal is still open
  SELECT status INTO v_proposal_status
  FROM proposals WHERE id = p_proposal_id;

  IF v_proposal_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposal not found');
  END IF;

  IF v_proposal_status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposal is not open for voting');
  END IF;

  -- 2. Insert vote (UNIQUE constraint prevents double-voting)
  INSERT INTO proposal_votes (proposal_id, voter_id, vote, respect_weight)
  VALUES (p_proposal_id, p_voter_id, p_vote, p_respect_weight)
  ON CONFLICT (proposal_id, voter_id)
  DO UPDATE SET vote = p_vote, respect_weight = p_respect_weight;

  -- 3. Count votes
  SELECT
    COUNT(*) FILTER (WHERE vote = 'for'),
    COUNT(*) FILTER (WHERE vote = 'against'),
    COUNT(*)
  INTO v_votes_for, v_votes_against, v_total_votes
  FROM proposal_votes
  WHERE proposal_id = p_proposal_id;

  -- 4. Check threshold and auto-update status
  IF v_votes_for >= p_approval_threshold THEN
    UPDATE proposals SET status = 'approved', updated_at = NOW()
    WHERE id = p_proposal_id AND status = 'open';
  ELSIF v_votes_against >= p_approval_threshold THEN
    UPDATE proposals SET status = 'rejected', updated_at = NOW()
    WHERE id = p_proposal_id AND status = 'open';
  END IF;

  -- 5. Return result
  v_result := jsonb_build_object(
    'success', true,
    'votes_for', v_votes_for,
    'votes_against', v_votes_against,
    'total_votes', v_total_votes,
    'new_status', (SELECT status FROM proposals WHERE id = p_proposal_id)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Call from API route:**

```typescript
// src/app/api/proposals/vote/route.ts
const { data, error } = await supabaseAdmin.rpc('cast_vote_and_check_threshold', {
  p_proposal_id: proposalId,
  p_voter_id: userId,
  p_vote: vote,          // 'for', 'against', 'abstain'
  p_respect_weight: respectWeight,
  p_approval_threshold: 3,
});

if (error) {
  return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
}

const result = data as { success: boolean; votes_for: number; new_status: string };
```

### Function 2: Record Fractal Scores + Update Member Totals (Atomic)

```sql
CREATE OR REPLACE FUNCTION record_fractal_session(
  p_session_date DATE,
  p_session_name TEXT,
  p_host_name TEXT,
  p_host_wallet TEXT,
  p_scoring_era TEXT,
  p_scores JSONB  -- array of { member_name, wallet_address, rank, score }
)
RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_score JSONB;
  v_participant_count INTEGER;
BEGIN
  v_participant_count := jsonb_array_length(p_scores);

  -- 1. Create fractal session
  INSERT INTO fractal_sessions (session_date, name, host_name, host_wallet, scoring_era, participant_count)
  VALUES (p_session_date, p_session_name, p_host_name, p_host_wallet, p_scoring_era, v_participant_count)
  RETURNING id INTO v_session_id;

  -- 2. Insert all scores
  FOR v_score IN SELECT * FROM jsonb_array_elements(p_scores)
  LOOP
    INSERT INTO fractal_scores (session_id, member_name, wallet_address, rank, score)
    VALUES (
      v_session_id,
      v_score->>'member_name',
      v_score->>'wallet_address',
      (v_score->>'rank')::INTEGER,
      (v_score->>'score')::DECIMAL
    );

    -- 3. Update member totals (upsert)
    INSERT INTO respect_members (name, wallet_address, total_respect, fractal_respect, fractal_count, first_respect_at)
    VALUES (
      v_score->>'member_name',
      v_score->>'wallet_address',
      (v_score->>'score')::DECIMAL,
      (v_score->>'score')::DECIMAL,
      1,
      p_session_date
    )
    ON CONFLICT (wallet_address) WHERE wallet_address IS NOT NULL
    DO UPDATE SET
      total_respect = respect_members.total_respect + (v_score->>'score')::DECIMAL,
      fractal_respect = respect_members.fractal_respect + (v_score->>'score')::DECIMAL,
      fractal_count = respect_members.fractal_count + 1,
      updated_at = NOW();
  END LOOP;

  -- 4. Update host's hosting count
  UPDATE respect_members
  SET hosting_count = hosting_count + 1,
      hosting_respect = hosting_respect + 10,  -- hosting bonus
      total_respect = total_respect + 10,
      updated_at = NOW()
  WHERE wallet_address = p_host_wallet;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'participants', v_participant_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function 3: Get User Profile with Computed Fields

```sql
CREATE OR REPLACE FUNCTION get_user_profile(p_fid BIGINT)
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_respect RECORD;
  v_unread_count INTEGER;
BEGIN
  -- User data
  SELECT * INTO v_user FROM users WHERE fid = p_fid AND is_active = TRUE;
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Respect data
  SELECT total_respect, fractal_count, hosting_count
  INTO v_respect
  FROM respect_members WHERE fid = p_fid;

  -- Unread notification count
  SELECT COUNT(*) INTO v_unread_count
  FROM notifications
  WHERE recipient_fid = p_fid AND read = FALSE;

  RETURN jsonb_build_object(
    'found', true,
    'id', v_user.id,
    'fid', v_user.fid,
    'username', v_user.username,
    'display_name', v_user.display_name,
    'pfp_url', v_user.pfp_url,
    'role', v_user.role,
    'total_respect', COALESCE(v_respect.total_respect, 0),
    'fractal_count', COALESCE(v_respect.fractal_count, 0),
    'hosting_count', COALESCE(v_respect.hosting_count, 0),
    'unread_notifications', v_unread_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function 4: Bulk Insert Notifications (for system events)

```sql
CREATE OR REPLACE FUNCTION notify_all_members(
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_href TEXT,
  p_actor_fid INTEGER DEFAULT NULL,
  p_actor_display_name TEXT DEFAULT NULL,
  p_actor_pfp_url TEXT DEFAULT NULL,
  p_exclude_fid INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO notifications (recipient_fid, type, title, body, href, actor_fid, actor_display_name, actor_pfp_url)
  SELECT
    u.fid,
    p_type,
    p_title,
    p_body,
    p_href,
    p_actor_fid,
    p_actor_display_name,
    p_actor_pfp_url
  FROM users u
  WHERE u.is_active = TRUE
    AND u.fid IS NOT NULL
    AND u.fid != COALESCE(p_exclude_fid, -1);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**

```typescript
// Notify all members about a new proposal
const { data: notifiedCount } = await supabaseAdmin.rpc('notify_all_members', {
  p_type: 'proposal',
  p_title: 'New proposal: Fund music video',
  p_body: 'A new treasury proposal has been submitted for community vote.',
  p_href: `/governance/proposals/${proposalId}`,
  p_actor_fid: session.fid,
  p_actor_display_name: session.displayName,
  p_actor_pfp_url: session.pfpUrl,
  p_exclude_fid: session.fid,  // don't notify the author
});
```

### Best Practices for Database Functions

| Rule | Why |
|------|-----|
| Use `SECURITY DEFINER` sparingly | It runs as the function owner (usually `postgres`), bypassing RLS. Only use for operations that need cross-table access. |
| Always validate inputs | Even though Zod validates on the API side, add CHECK constraints in the function for defense-in-depth. |
| Use `RETURNS JSONB` for complex returns | Supabase `rpc()` maps JSONB directly to JavaScript objects. |
| Keep functions focused | One function per business operation. Don't create "god functions". |
| Log errors | Use `RAISE WARNING` or write to `security_audit_log` for auditable operations. |

---

## 4. Row-Level Security Audit — All 22 Tables

### Current State

All 22 tables have `ENABLE ROW LEVEL SECURITY`. However, most tables have **no policies defined** — meaning all access is denied except via `service_role`. This is secure but means Realtime subscriptions (which use the anon key) receive nothing.

### Table Inventory & RLS Assessment

#### Tier 1: Server-Only Tables (No RLS policies needed)

These tables are only accessed via `supabaseAdmin` (service role) from API routes. No client-side access. Current setup is correct.

| Table | RLS Enabled | Policies | Assessment |
|-------|------------|----------|------------|
| `allowlist` | Yes | None | Correct. Only service role reads/writes. |
| `sessions` | Yes | None | Correct. Auth system only. |
| `hidden_messages` | Yes | None | Correct. Admin operation only. |
| `security_audit_log` | Yes | None | Correct. Server-side audit trail. |
| `notification_tokens` | Yes | None | Correct. Push token management is server-side. |

#### Tier 2: Tables Needing SELECT Policies (for Realtime or future client queries)

| Table | RLS Enabled | Current Policies | Needed Policies |
|-------|------------|-----------------|-----------------|
| `notifications` | Yes | SELECT (own only via `app.current_fid`) | **Good but needs anon key support for Realtime** |
| `channel_casts` | Yes | None | **Needs SELECT for Realtime** (if using Postgres Changes) |
| `proposals` | Yes | None | **Needs SELECT** (members can view all open proposals) |
| `proposal_votes` | Yes | None | **Needs SELECT** (members can view vote counts) |
| `proposal_comments` | Yes | None | **Needs SELECT** (members can view comments) |

#### Tier 3: Tables Needing Read Policies (future client-side access)

| Table | RLS Enabled | Current Policies | Needed Policies |
|-------|------------|-----------------|-----------------|
| `users` | Yes | None | **Needs SELECT** (members can view profiles) |
| `respect_members` | Yes | None | **Needs SELECT** (leaderboard is public within ZAO) |
| `fractal_sessions` | Yes | None | **Needs SELECT** (history viewable by members) |
| `fractal_scores` | Yes | None | **Needs SELECT** (viewable by members) |
| `respect_events` | Yes | None | **Needs SELECT** (viewable by members) |
| `song_submissions` | Yes | Full access (`true`) | **Overly permissive** — tighten to members only |
| `community_issues` | Yes | SELECT all, INSERT all, UPDATE all | **UPDATE too permissive** — should be admin only |
| `scheduled_casts` | Yes | SELECT/INSERT/UPDATE/DELETE all (`true`) | **Overly permissive** — should be own casts only |

#### Tier 4: Low-risk / External

| Table | RLS Enabled | Current Policies | Assessment |
|-------|------------|-----------------|------------|
| `bluesky_members` | Yes | None | Correct. Server-managed. |
| `bluesky_feed_posts` | Yes | None | Correct. Server-managed. |

### Recommended RLS Policies

#### For Realtime Notifications (Critical)

The existing `add-notifications-rls.sql` uses `current_setting('app.current_fid')` which works for service role but not for anon key Realtime subscriptions. For Realtime to work, the anon key client needs a policy:

```sql
-- Allow Realtime subscriptions with server-side filter
-- The filter `recipient_fid=eq.${fid}` prevents data leakage
-- but the RLS policy must still allow the SELECT to proceed.
--
-- Option A: Allow all authenticated reads (Realtime filter handles scoping)
CREATE POLICY "Anon can read notifications (Realtime filtered)" ON notifications
  FOR SELECT TO anon
  USING (true);
-- NOTE: This relies on the Realtime filter parameter for security.
-- The anon key client cannot query directly — only subscribe to filtered changes.

-- Option B (more secure): Use a custom claim or session variable
-- This requires setting the FID in the JWT or session before subscribing.
-- More complex but prevents any anon query from reading all notifications.
```

**Recommendation:** Option A is acceptable because:
1. The anon key can only subscribe to Realtime, not directly query (no bypass risk unless someone crafts raw queries with the anon key)
2. The Realtime filter ensures only matching rows are delivered
3. All direct API queries go through service role anyway

If you want belt-and-suspenders security, restrict the anon SELECT with a row limit:

```sql
CREATE POLICY "Anon limited notification access" ON notifications
  FOR SELECT TO anon
  USING (created_at > NOW() - INTERVAL '1 hour');
-- Only recent notifications visible via anon key
```

#### For Governance Tables

```sql
-- Proposals: members can read all, only author can insert
CREATE POLICY "Members can read proposals" ON proposals
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Members can create proposals" ON proposals
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only the proposal author or admin can update (close, edit)
CREATE POLICY "Author or admin can update proposals" ON proposals
  FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT id FROM users WHERE fid = current_setting('app.current_fid', true)::bigint)
    OR EXISTS (SELECT 1 FROM users WHERE fid = current_setting('app.current_fid', true)::bigint AND role = 'admin')
  );

-- Votes: members can read all, insert their own
CREATE POLICY "Members can read votes" ON proposal_votes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Members can vote" ON proposal_votes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comments: members can read all, insert their own
CREATE POLICY "Members can read comments" ON proposal_comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Members can comment" ON proposal_comments
  FOR INSERT TO authenticated
  WITH CHECK (true);
```

#### Fix Overly Permissive Policies

```sql
-- scheduled_casts: restrict to own casts
DROP POLICY IF EXISTS "Users can see their own scheduled casts" ON scheduled_casts;
DROP POLICY IF EXISTS "Users can update their own scheduled casts" ON scheduled_casts;
DROP POLICY IF EXISTS "Users can delete their own scheduled casts" ON scheduled_casts;

CREATE POLICY "Users see own scheduled casts" ON scheduled_casts
  FOR SELECT USING (fid = current_setting('app.current_fid', true)::integer);

CREATE POLICY "Users update own scheduled casts" ON scheduled_casts
  FOR UPDATE USING (fid = current_setting('app.current_fid', true)::integer);

CREATE POLICY "Users delete own scheduled casts" ON scheduled_casts
  FOR DELETE USING (fid = current_setting('app.current_fid', true)::integer);

-- community_issues: restrict UPDATE to admins
DROP POLICY IF EXISTS "Admins can update issues" ON community_issues;

CREATE POLICY "Admins can update issues" ON community_issues
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE fid = current_setting('app.current_fid', true)::bigint AND role = 'admin')
  );
```

### RLS Performance Rules

1. **Index every column referenced in RLS policies** (already done for `fid` on most tables)
2. **Wrap `current_setting()` in a subselect** for caching: `(SELECT current_setting('app.current_fid', true)::bigint)`
3. **Avoid cross-table lookups in RLS** when possible (the `users` table lookup for admin check is acceptable at ZAO scale)
4. **Use `TO authenticated` or `TO anon`** to skip policy evaluation entirely for irrelevant roles

---

## 5. Supabase Vault — Encrypted Secret Storage

### What Supabase Vault Is

Supabase Vault uses the `pgsodium` extension to encrypt secrets at rest in a dedicated `vault.secrets` table. Secrets are encrypted with a root key managed by Supabase (you never see it). You interact through:

- `vault.create_secret()` — store a secret
- `vault.decrypted_secrets` — view to read decrypted values (requires `postgres` role)

### Setup

```sql
-- Vault is pre-installed on Supabase projects. Just verify:
SELECT * FROM pg_extension WHERE extname = 'pgsodium';
-- If not present:
CREATE EXTENSION IF NOT EXISTS pgsodium;
```

### Store Secrets

```sql
-- Store the Neynar API key (used by pg_cron Edge Function calls)
SELECT vault.create_secret(
  'neynar-api-key-value-here',
  'neynar_api_key',
  'Neynar API key for Edge Function webhook processing'
);

-- Store the Supabase service role key (used by pg_cron to call Edge Functions)
SELECT vault.create_secret(
  'your-service-role-key-here',
  'supabase_service_role_key',
  'Service role key for pg_cron Edge Function invocation'
);

-- Store the app signer private key (used by Edge Functions for Farcaster signing)
SELECT vault.create_secret(
  'app-signer-private-key-here',
  'app_signer_private_key',
  'App wallet private key for Farcaster EIP-712 signing'
);
```

### Read Secrets (SQL)

```sql
-- Read a specific secret by name
SELECT decrypted_secret
FROM vault.decrypted_secrets
WHERE name = 'neynar_api_key'
LIMIT 1;
```

### Use in pg_cron Jobs

This is the primary use case — pg_cron needs API keys to call Edge Functions, but you should not hardcode them in the cron job SQL:

```sql
-- BEFORE (insecure — key visible in cron.job table):
SELECT cron.schedule('process-casts', '*/5 * * * *', $$
  SELECT net.http_post(
    url := 'https://project.supabase.co/functions/v1/process-casts',
    headers := '{"Authorization": "Bearer sb-hardcoded-key-here"}'::jsonb,
    body := '{}'::jsonb
  );
$$);

-- AFTER (secure — key read from Vault at runtime):
SELECT cron.schedule('process-casts', '*/5 * * * *', $$
  SELECT net.http_post(
    url := 'https://project.supabase.co/functions/v1/process-casts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'supabase_service_role_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
$$);
```

### Use in Edge Functions

Edge Functions can read Vault secrets via the Supabase client:

```typescript
// supabase/functions/process-scheduled-casts/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Read Neynar API key from Vault
  const { data: secret } = await supabase
    .from('vault.decrypted_secrets')  // Not a real table — use rpc
    .select('decrypted_secret')
    .eq('name', 'neynar_api_key')
    .single();

  // Actually, in Edge Functions you'd typically use:
  // Deno.env.get('NEYNAR_API_KEY') — set in Supabase dashboard
  // Vault is primarily for secrets needed in SQL (pg_cron, triggers, functions)
});
```

### What to Store in Vault vs Environment Variables

| Secret | Vault | Env Var | Why |
|--------|-------|---------|-----|
| Service role key (for pg_cron) | **Yes** | Also in Vercel | pg_cron SQL needs it at runtime |
| Neynar API key (for Edge Functions) | Optional | **Yes** (Edge Function secrets) | Edge Functions read env vars natively |
| App signer private key | **Yes** | Also in Vercel | Backup storage, DB functions might need it |
| Session secret | No | **Yes** (Vercel only) | Only used in Next.js, never in SQL |
| External API keys (Bluesky, etc.) | **Yes** | Also in Vercel | pg_cron jobs may need them |

### Vault Best Practices

1. **Never log decrypted secrets** — use `RAISE WARNING` carefully in functions
2. **Rotate secrets** by creating a new secret with the same name (old one is overwritten)
3. **Vault access requires `postgres` role** — anon and authenticated roles cannot read `vault.decrypted_secrets`
4. **Monitor access** via `security_audit_log` if you create wrapper functions
5. **Vault is not a replacement for env vars** — it supplements them for secrets needed in SQL context

### Manage Vault Secrets

```sql
-- List all secrets (encrypted, shows name + description only)
SELECT id, name, description, created_at, updated_at
FROM vault.secrets;

-- Update a secret
UPDATE vault.secrets
SET secret = 'new-api-key-value'
WHERE name = 'neynar_api_key';

-- Delete a secret
DELETE FROM vault.secrets WHERE name = 'old_unused_key';
```

---

## 6. Database Triggers — Automation

### Current Triggers

ZAO OS already has two triggers:
1. `users_updated_at` — auto-updates `updated_at` on users table
2. `respect_members_updated_at` — auto-updates `updated_at` on respect_members table

Both use the shared `update_updated_at()` function.

### Trigger 1: Auto-update `updated_at` on All Tables That Have It

```sql
-- Apply the existing update_updated_at() trigger to remaining tables:

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- NOTE: This already exists from create-proposals.sql

CREATE TRIGGER community_issues_updated_at
  BEFORE UPDATE ON community_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Trigger 2: Auto-notify on New Proposal

When a new proposal is created, notify all members:

```sql
CREATE OR REPLACE FUNCTION notify_new_proposal()
RETURNS TRIGGER AS $$
DECLARE
  v_author RECORD;
BEGIN
  -- Get author details
  SELECT display_name, pfp_url, fid INTO v_author
  FROM users WHERE id = NEW.author_id;

  -- Insert notification for all active members except the author
  INSERT INTO notifications (recipient_fid, type, title, body, href, actor_fid, actor_display_name, actor_pfp_url)
  SELECT
    u.fid,
    'proposal',
    'New proposal: ' || LEFT(NEW.title, 50),
    LEFT(NEW.description, 100) || '...',
    '/governance/proposals/' || NEW.id,
    v_author.fid,
    v_author.display_name,
    v_author.pfp_url
  FROM users u
  WHERE u.is_active = TRUE
    AND u.fid IS NOT NULL
    AND u.fid != COALESCE(v_author.fid, -1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_proposal_insert
  AFTER INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_proposal();
```

### Trigger 3: Auto-notify on Vote

```sql
CREATE OR REPLACE FUNCTION notify_proposal_vote()
RETURNS TRIGGER AS $$
DECLARE
  v_voter RECORD;
  v_proposal RECORD;
BEGIN
  -- Get voter details
  SELECT display_name, pfp_url, fid INTO v_voter
  FROM users WHERE id = NEW.voter_id;

  -- Get proposal details
  SELECT title, author_id INTO v_proposal
  FROM proposals WHERE id = NEW.proposal_id;

  -- Get author FID
  DECLARE v_author_fid BIGINT;
  BEGIN
    SELECT fid INTO v_author_fid FROM users WHERE id = v_proposal.author_id;
  END;

  -- Notify the proposal author (if not voting on their own proposal)
  IF v_author_fid IS NOT NULL AND v_author_fid != COALESCE(v_voter.fid, -1) THEN
    INSERT INTO notifications (recipient_fid, type, title, body, href, actor_fid, actor_display_name, actor_pfp_url)
    VALUES (
      v_author_fid,
      'vote',
      v_voter.display_name || ' voted on your proposal',
      'Vote: ' || NEW.vote || ' on "' || LEFT(v_proposal.title, 50) || '"',
      '/governance/proposals/' || NEW.proposal_id,
      v_voter.fid,
      v_voter.display_name,
      v_voter.pfp_url
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_vote_insert
  AFTER INSERT ON proposal_votes
  FOR EACH ROW
  EXECUTE FUNCTION notify_proposal_vote();
```

### Trigger 4: Auto-close Expired Proposals

Instead of a cron job, use a trigger that checks on any vote:

```sql
CREATE OR REPLACE FUNCTION auto_close_expired_proposals()
RETURNS TRIGGER AS $$
BEGIN
  -- Close any proposals past their deadline
  UPDATE proposals
  SET status = 'rejected', updated_at = NOW()
  WHERE status = 'open'
    AND closes_at IS NOT NULL
    AND closes_at < NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire on any vote insert (piggyback on existing activity)
CREATE TRIGGER check_expired_proposals
  AFTER INSERT ON proposal_votes
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_close_expired_proposals();
```

**Note:** For reliable deadline enforcement, combine this trigger with a pg_cron job that runs daily:

```sql
SELECT cron.schedule(
  'close-expired-proposals',
  '0 0 * * *',  -- Daily at midnight UTC
  $$UPDATE proposals SET status = 'rejected', updated_at = NOW() WHERE status = 'open' AND closes_at IS NOT NULL AND closes_at < NOW()$$
);
```

### Trigger 5: Cascade Soft-Delete Notifications on User Deactivation

```sql
CREATE OR REPLACE FUNCTION on_user_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is deactivated, clean up their data
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    -- Mark all their unread notifications as read (don't delete)
    UPDATE notifications SET read = TRUE
    WHERE recipient_fid = NEW.fid AND read = FALSE;

    -- Disable their push notification tokens
    UPDATE notification_tokens SET enabled = FALSE
    WHERE fid = NEW.fid;

    -- Cancel their pending scheduled casts
    UPDATE scheduled_casts SET status = 'cancelled'
    WHERE fid = NEW.fid AND status = 'pending';

    -- Log the deactivation
    INSERT INTO security_audit_log (actor_fid, action, target_type, target_id, details)
    VALUES (
      NEW.fid,
      'user_deactivated',
      'user',
      NEW.id::text,
      jsonb_build_object('previous_role', OLD.role, 'deactivated_at', NOW())
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_deactivation_trigger
  AFTER UPDATE OF is_active ON users
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION on_user_deactivation();
```

### Trigger 6: Auto-update `last_login_at` on Session Creation

```sql
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_login_at = NOW()
  WHERE fid = NEW.fid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_session_insert
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();
```

### Trigger Best Practices

| Rule | Why |
|------|-----|
| Use `AFTER` triggers for side effects (notifications, logging) | `BEFORE` triggers can block the original operation if they fail |
| Use `FOR EACH ROW` for row-specific logic | `FOR EACH STATEMENT` fires once per statement, regardless of affected rows |
| Keep triggers fast (<50ms) | Long triggers block the transaction |
| Don't create circular triggers | Table A trigger writes to Table B, Table B trigger writes to Table A = infinite loop |
| Use `SECURITY DEFINER` for cross-table writes | Otherwise the trigger runs as the calling user, who may lack permissions |
| Use `WHEN` clause for conditional firing | Avoids function call overhead when condition isn't met |

---

## 7. Connection Pooling — Next.js Serverless Best Practices

### How Supabase Connection Pooling Works

Supabase runs **Supavisor** (their PgBouncer replacement) in front of PostgreSQL. Every Supabase project exposes two connection modes:

| Mode | Port | Connection String Suffix | Use Case |
|------|------|------------------------|----------|
| **Transaction** | 6543 | `?pgbouncer=true` | Serverless functions, API routes, short-lived connections |
| **Session** | 5432 | (default) | Long-lived connections, LISTEN/NOTIFY, prepared statements |

### Default Pool Sizes

| Compute Size | Direct Connections | Pool Connections |
|-------------|-------------------|-----------------|
| Micro (Free) | 60 | 200 |
| Small (Pro) | 90 | 200 |
| Medium | 120 | 200 |
| Large | 160 | 300 |

### ZAO OS Configuration

The `@supabase/supabase-js` client handles pooling automatically — it uses the REST API (PostgREST), which maintains its own connection pool to PostgreSQL. **You do not need to configure PgBouncer yourself** when using the Supabase JS client.

However, if you connect directly via `postgres://` (e.g., for migrations, Prisma, or raw SQL), you need to use the right connection string:

```bash
# For serverless (Next.js API routes, Edge Functions):
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# For migrations and long-running scripts:
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### Best Practices for Next.js Serverless

#### 1. Singleton Client Pattern (Already Implemented)

ZAO OS already does this correctly in `src/lib/db/supabase.ts`:

```typescript
// Correct: singleton with lazy initialization
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(url, serviceRoleKey);
  }
  return _supabaseAdmin;
}
```

This works because:
- Next.js serverless functions share module scope within a single container
- The Supabase JS client uses HTTP (PostgREST), not persistent TCP connections
- No connection leak risk

#### 2. Avoid Connection Exhaustion in API Routes

```typescript
// BAD: Creates a new client per request (works but wasteful)
export async function GET() {
  const supabase = createClient(url, key);  // Don't do this
  const { data } = await supabase.from('users').select('*');
}

// GOOD: Use the singleton (already the pattern in ZAO OS)
export async function GET() {
  const { data } = await supabaseAdmin.from('users').select('*');
}
```

#### 3. Parallel Queries with `Promise.allSettled`

```typescript
// Efficient: parallel queries over a single client
const [usersResult, proposalsResult, statsResult] = await Promise.allSettled([
  supabaseAdmin.from('users').select('id, display_name').eq('is_active', true),
  supabaseAdmin.from('proposals').select('*').eq('status', 'open'),
  supabaseAdmin.from('respect_leaderboard').select('*').limit(10),
]);
```

The Supabase JS client multiplexes HTTP requests — parallel queries don't consume multiple database connections.

#### 4. Edge Runtime Considerations

For Next.js API routes using the Edge runtime:

```typescript
// next.config.js or route file
export const runtime = 'edge';

// The Supabase JS client works in Edge runtime (uses fetch, not node:http)
// No special configuration needed
```

#### 5. Connection Timeout Settings

For long-running operations (bulk imports, complex joins):

```typescript
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30_000),  // 30s timeout
      });
    },
  },
});
```

#### 6. Monitoring Connection Usage

```sql
-- Current active connections
SELECT
  usename,
  application_name,
  client_addr,
  state,
  COUNT(*) as count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY usename, application_name, client_addr, state
ORDER BY count DESC;

-- Connection pool status (Supavisor)
-- View in Supabase Dashboard > Database > Connection Pooling
```

### Common Serverless Pitfalls

| Pitfall | Solution |
|---------|----------|
| "Too many connections" errors | Use transaction pooling (port 6543). The JS client uses REST by default, so this shouldn't happen. |
| Stale connections after deploy | Supabase JS client uses HTTP — no persistent connections to go stale. |
| Cold start latency | The JS client has minimal cold start overhead (~5ms). No connection handshake like TCP-based clients. |
| Prepared statements failing | Transaction mode pooling doesn't support prepared statements. The JS client doesn't use them (PostgREST translates to SQL). |
| `LISTEN/NOTIFY` not working | Requires session mode (port 5432). Use Supabase Realtime instead for pub/sub in serverless. |

### Supabase JS Client vs Direct PostgreSQL

| Aspect | Supabase JS (PostgREST) | Direct pg (`postgres://`) |
|--------|------------------------|--------------------------|
| Connection type | HTTP (stateless) | TCP (persistent) |
| Pooling needed | No (HTTP) | Yes (PgBouncer/Supavisor) |
| Prepared statements | Not applicable | Session mode only |
| LISTEN/NOTIFY | Use Realtime instead | Supported in session mode |
| Max concurrent | Unlimited (HTTP) | Limited by pool size |
| Latency | ~5-15ms per query | ~1-5ms per query |
| Use in ZAO OS | Primary (all API routes) | Migrations only |

**Key insight:** Because ZAO OS exclusively uses `@supabase/supabase-js` (which goes through PostgREST over HTTP), connection pooling is largely a non-issue. The pooler matters if you add direct Postgres connections (Prisma, Drizzle, raw `pg` client), which ZAO OS does not use.

---

## Implementation Priority

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | **Fix NotificationBell** table name (`notifications` not `in_app_notifications`) + add Realtime publication | Small | High — enables live notification badges |
| 2 | **Create `respect_leaderboard` materialized view** + pg_cron refresh | Small | High — eliminates per-request computation |
| 3 | **Add `cast_vote_and_check_threshold` function** | Small | High — atomic voting, prevents race conditions |
| 4 | **Add Vault secrets** for pg_cron Edge Function calls | Small | High — removes hardcoded keys from SQL |
| 5 | **Add notification triggers** (new proposal, new vote) | Medium | Medium — automatic notifications without API calls |
| 6 | **Create `proposal_vote_tallies` materialized view** | Small | Medium — fast governance dashboard |
| 7 | **Fix overly permissive RLS** on `scheduled_casts`, `community_issues` | Small | Medium — security hardening |
| 8 | **Add `community_stats` materialized view** | Small | Low — dashboard optimization |
| 9 | **Add `record_fractal_session` function** | Medium | Low — atomic fractal scoring (currently works fine via multiple API calls) |
| 10 | **Add user deactivation trigger** | Small | Low — cleanup automation |

---

## SQL Migration File

All SQL from this research can be consolidated into a single migration:

```
supabase/migrations/20260321_database_optimizations.sql
```

Run in order:
1. Materialized views (Section 2)
2. Database functions (Section 3)
3. RLS policy fixes (Section 4)
4. Vault secrets (Section 5 — run manually, not in migration)
5. Triggers (Section 6)
6. Realtime publication (Section 1)

---

## Sources

- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Realtime Subscriptions](https://supabase.com/docs/reference/javascript/subscribe)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- [Supabase Database Functions (RPC)](https://supabase.com/docs/guides/database/functions)
- [Supabase RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
- [pgsodium Encryption](https://supabase.com/docs/guides/database/extensions/pgsodium)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)
- [Supabase Connection Pooling (Supavisor)](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supavisor Architecture](https://supabase.com/blog/supavisor-postgres-connection-pooler)
- [Next.js Serverless + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Realtime Publication Setup](https://supabase.com/docs/guides/realtime/postgres-changes#replication-setup)
