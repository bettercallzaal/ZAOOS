# 93 — Supabase Scaling & Optimization for ZAO OS

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Deep dive on Supabase Realtime, pg_cron, pgvector, Edge Functions, Storage, indexing, and branching — specifically for ZAO OS scaling from 100 to 1,000+ members with 22 tables
> **Builds on:** [Doc 42 — Supabase Advanced Patterns](../42-supabase-advanced-patterns/README.md)

---

## Table of Contents

1. [Supabase Realtime — Which Primitive for What](#1-supabase-realtime)
2. [pg_cron — Scheduled Jobs](#2-pg_cron)
3. [pgvector — AI & Music Features](#3-pgvector)
4. [Edge Functions vs Next.js API Routes](#4-edge-functions-vs-nextjs-api-routes)
5. [Storage Optimization](#5-storage-optimization)
6. [Indexing Strategies for 22 Tables](#6-indexing-strategies)
7. [Supabase Branching](#7-supabase-branching)
8. [Cost Projections](#8-cost-projections)

---

## 1. Supabase Realtime

Supabase Realtime offers three primitives. Choosing the wrong one creates performance problems at scale.

### The Three Primitives

| Primitive | How It Works | Persisted? | DB Load | Message Counting |
|-----------|-------------|-----------|---------|-----------------|
| **Postgres Changes** | DB trigger fires on INSERT/UPDATE/DELETE, checked against each subscriber's RLS | Yes | **High** — 1 change x N subscribers = N RLS checks | 1 message per listening client |
| **Broadcast** | Client or server sends ephemeral message to channel subscribers | No | **None** | 1 sent + 1 per receiver |
| **Presence** | Tracks shared state (join/leave/sync), auto-syncs on new joins | No | **None** | Events on track/untrack/update |

### The N-Subscriber Problem (Critical)

Postgres Changes processes changes on a **single thread** to maintain ordering. If 100 users subscribe to a table and you insert 1 row, it triggers **100 RLS checks** sequentially. This means:

- Compute upgrades have **minimal effect** on Postgres Changes throughput
- At 1,000 subscribers, a single insert creates 1,000 RLS evaluations
- If RLS can't keep up, changes are delayed until timeout

**Solution:** Write to DB normally, then re-stream via Broadcast. This is what doc 42 recommended and remains the correct pattern.

### ZAO OS Feature Mapping

| Feature | Primitive | Why | Implementation |
|---------|-----------|-----|----------------|
| **Live notification badges** | **Postgres Changes** (with fallback) | Low volume (~5-20 inserts/day per user), RLS load manageable at 100-1,000 members | Already implemented in `NotificationBell.tsx` — subscribes to `notifications` table INSERT events |
| **Chat message updates** | **Broadcast** | High volume, many subscribers per channel. Postgres Changes would create N^2 RLS checks | API route writes to `channel_casts`, then broadcasts to channel. Clients receive via Broadcast, not DB subscription |
| **"Now playing" music** | **Broadcast** | Ephemeral, updates every ~30s per listener. No need to persist | Dedicated `now-playing` channel. Payload: `{ fid, track, artist, source, timestamp }` |
| **Online member indicators** | **Presence** | Purpose-built for this. Auto-handles join/leave/sync | Channel per page or global. State: `{ fid, displayName, pfp, status, lastSeen }` |

### Notification Badge — Current Implementation Analysis

The existing `NotificationBell.tsx` subscribes to Postgres Changes on `in_app_notifications` table:

```typescript
// Current code (src/components/navigation/NotificationBell.tsx)
channel = supabase
  .channel('notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'in_app_notifications' }, () => {
    fetchNotifications(); // Re-fetches full list on any insert
  })
  .subscribe();
```

**Assessment:** This is acceptable for notifications because:
- Low insert volume (notifications are sparse, not high-throughput)
- Each user only cares about their own notifications
- Falls back to 30-second polling if Realtime fails
- At 1,000 members, worst case is ~1,000 RLS checks per notification insert — manageable

**Optimization for 1,000+:** Add a filter to reduce unnecessary RLS checks:

```typescript
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'notifications',
  filter: `recipient_fid=eq.${currentUserFid}`,  // Server-side filter
}, () => {
  fetchNotifications();
})
```

### Chat Message Broadcast Pattern

```typescript
// Server-side: API route after writing cast to DB
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, serviceRoleKey);

// 1. Write to DB
await supabase.from('channel_casts').insert(newCast);

// 2. Broadcast to channel subscribers (no RLS overhead)
await supabase.channel(`chat:${channelId}`).send({
  type: 'broadcast',
  event: 'new_cast',
  payload: {
    hash: newCast.hash,
    fid: newCast.fid,
    text: newCast.text,
    author_display: newCast.author_display,
    author_pfp: newCast.author_pfp,
    timestamp: newCast.timestamp,
  },
});

// Client-side: subscribe to broadcast
const channel = supabase
  .channel(`chat:${channelId}`)
  .on('broadcast', { event: 'new_cast' }, (payload) => {
    // Add to local state / React Query cache
    queryClient.setQueryData(['casts', channelId], (old) => [payload, ...old]);
  })
  .subscribe();
```

### Presence for Online Indicators

```typescript
const channel = supabase.channel('online-members');

// Track current user
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      fid: session.fid,
      displayName: session.displayName,
      pfp: session.pfpUrl,
      status: 'online',
      currentPage: '/chat',
    });
  }
});

// Listen for changes
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // state = { "user-key": [{ fid, displayName, status, ... }], ... }
  setOnlineMembers(Object.values(state).flat());
});
```

### Realtime Pricing & Limits (2026)

| Resource | Free | Pro ($25/mo) | Team ($599/mo) |
|----------|------|-------------|----------------|
| Concurrent connections | 200 | 500 (configurable) | 500+ |
| Messages/second | 100 | 500 | Contact support |
| Message size | 1 MB | 1 MB | 1 MB |
| Included messages/month | 2M | 5M | 10M |
| Overage per 1M messages | N/A | $2.50 | $2.50 |

**ZAO OS at 100 members:** ~500K messages/month (well within Free tier)
**ZAO OS at 1,000 members:** ~5-10M messages/month (Pro tier, $0-$12.50 overage)

Message count estimate (1,000 members):
- Chat broadcasts: ~200 messages/day x 30 days x avg 50 online = 300K
- Notifications: ~50 inserts/day x 30 days x avg 50 online = 75K
- Presence: ~1,000 join/leave events/day x 30 days = 30K
- Now playing: ~100 updates/day x 30 days x avg 50 online = 150K
- **Total: ~555K/month** (well within Pro tier)

---

## 2. pg_cron — Scheduled Jobs

pg_cron is a Postgres extension that runs cron jobs directly inside the database. Combined with `pg_net` for HTTP requests, it handles all scheduled tasks without external cron services.

### Setup

```sql
-- Enable extensions (run once in SQL Editor)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
```

### ZAO OS Cron Jobs

#### Job 1: Process Scheduled Casts (Every 5 Minutes)

```sql
-- Option A: Direct SQL processing (if cast publishing is a DB function)
SELECT cron.schedule(
  'process-scheduled-casts',
  '*/5 * * * *',
  $$
    UPDATE scheduled_casts
    SET status = 'processing'
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
    RETURNING id, fid, text, channel_id, embed_urls, cross_post_channels;
  $$
);

-- Option B: Invoke Edge Function via pg_net (recommended — has Neynar API access)
SELECT cron.schedule(
  'process-scheduled-casts',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR-PROJECT.supabase.co/functions/v1/process-scheduled-casts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
```

**Recommended approach:** Option B with Edge Function. The Edge Function can call Neynar to publish the cast, update the DB, and handle errors. Pure SQL can't call external APIs.

#### Job 2: Sync Bluesky Feed Posts (Every 15 Minutes)

```sql
SELECT cron.schedule(
  'sync-bluesky-feed',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR-PROJECT.supabase.co/functions/v1/sync-bluesky',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
```

#### Job 3: Clean Up Old Channel Casts (30-Day Retention)

```sql
SELECT cron.schedule(
  'cleanup-old-casts',
  '0 3 * * *',  -- Daily at 3 AM UTC
  $$
    DELETE FROM channel_casts
    WHERE timestamp < NOW() - INTERVAL '30 days';
  $$
);
```

This is already noted in the `create-bluesky-tables.sql` and `create-notifications.sql` scripts as comments. Time to actually enable it.

#### Job 4: Clean Up Old Bluesky Feed Posts (30-Day Retention)

```sql
SELECT cron.schedule(
  'cleanup-bluesky-feed',
  '0 3 * * *',  -- Daily at 3 AM UTC
  $$
    DELETE FROM bluesky_feed_posts
    WHERE indexed_at < NOW() - INTERVAL '30 days';
  $$
);
```

#### Job 5: Refresh Respect Leaderboard Cache

```sql
-- First, create a materialized view for the leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS respect_leaderboard AS
  SELECT
    rm.id,
    rm.name,
    rm.wallet_address,
    rm.fid,
    rm.total_respect,
    rm.fractal_respect,
    rm.event_respect,
    rm.onchain_og,
    rm.onchain_zor,
    rm.fractal_count,
    rm.hosting_count,
    rm.first_respect_at,
    u.pfp_url,
    u.username,
    u.display_name,
    RANK() OVER (ORDER BY rm.total_respect DESC) as rank
  FROM respect_members rm
  LEFT JOIN users u ON rm.fid = u.fid
  WHERE rm.total_respect > 0
  ORDER BY rm.total_respect DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_respect_leaderboard_id
  ON respect_leaderboard (id);

-- Refresh every 5 minutes
SELECT cron.schedule(
  'refresh-respect-leaderboard',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY respect_leaderboard$$
);
```

#### Job 6: Clean Up Old Notifications (30-Day Retention)

```sql
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * *',
  $$
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
  $$
);
```

#### Job 7: Clean Up Expired Sessions

```sql
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 4 * * *',  -- Daily at 4 AM UTC
  $$
    DELETE FROM sessions
    WHERE expires_at < NOW();
  $$
);
```

### Managing Cron Jobs

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View recent job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- Unschedule a job
SELECT cron.unschedule('cleanup-old-casts');
```

### Secure API Key Storage with Vault

```sql
-- Store the service role key in Supabase Vault (not hardcoded in SQL)
SELECT vault.create_secret(
  'your-service-role-key-here',
  'supabase_service_role_key',
  'Service role key for Edge Function invocation'
);

-- Use in cron jobs
SELECT cron.schedule(
  'process-scheduled-casts',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR-PROJECT.supabase.co/functions/v1/process-scheduled-casts',
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
  $$
);
```

### pg_cron Limits

- Maximum **8 concurrent jobs** recommended
- Each job should complete within **10 minutes**
- Minimum interval: every second (but use sparingly)
- Jobs run in the database's timezone (UTC by default on Supabase)

---

## 3. pgvector — AI & Music Features

pgvector enables vector similarity search directly in Postgres. For ZAO OS, this unlocks music taste profiles, semantic search, and AI agent memory.

### Setup

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;
```

pgvector comes pre-installed on all Supabase projects. No additional cost to enable.

### Use Case 1: Music Taste Profile Embeddings

Find members with similar music taste based on their curation history, song submissions, and listening patterns.

```sql
-- Add embedding column to users or create a dedicated table
CREATE TABLE IF NOT EXISTS music_taste_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(384) NOT NULL,  -- gte-small model (384 dims, free via Edge Functions)
  genres JSONB DEFAULT '[]',
  top_artists JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Find similar members
CREATE OR REPLACE FUNCTION find_similar_members(
  query_user_id UUID,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  similarity FLOAT
) AS $$
  SELECT
    mtp.user_id,
    u.display_name,
    1 - (mtp.embedding <=> (
      SELECT embedding FROM music_taste_profiles WHERE user_id = query_user_id
    )) AS similarity
  FROM music_taste_profiles mtp
  JOIN users u ON mtp.user_id = u.id
  WHERE mtp.user_id != query_user_id
  ORDER BY mtp.embedding <=> (
    SELECT embedding FROM music_taste_profiles WHERE user_id = query_user_id
  )
  LIMIT match_count;
$$ LANGUAGE sql;
```

### Use Case 2: Semantic Search Across Proposals & Casts

```sql
-- Add embedding column to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS
  search_embedding vector(384);

-- Semantic search function
CREATE OR REPLACE FUNCTION search_proposals_semantic(
  query_embedding vector(384),
  match_count INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  similarity FLOAT
) AS $$
  SELECT
    p.id,
    p.title,
    p.description,
    p.status,
    1 - (p.search_embedding <=> query_embedding) AS similarity
  FROM proposals p
  WHERE p.search_embedding IS NOT NULL
    AND 1 - (p.search_embedding <=> query_embedding) > similarity_threshold
  ORDER BY p.search_embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql;
```

### Use Case 3: AI Agent Memory

```sql
CREATE TABLE IF NOT EXISTS agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(384) NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('conversation', 'fact', 'preference', 'context')),
  user_fid BIGINT,  -- NULL for global memories
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_agent_memories_embedding
  ON agent_memories USING hnsw (embedding vector_cosine_ops);
```

### Embedding Model Choice

| Model | Dimensions | Cost | Speed | Quality |
|-------|-----------|------|-------|---------|
| `gte-small` | 384 | **Free** (built into Edge Functions) | Fast | Good for short text |
| `text-embedding-3-small` (OpenAI) | 1536 | $0.02/1M tokens | Fast | Better for long documents |
| `text-embedding-3-large` (OpenAI) | 3072 | $0.13/1M tokens | Slower | Best quality |

**Recommendation for ZAO OS:** Start with `gte-small` (384 dimensions). It's free via Supabase Edge Functions, has adequate quality for a 1,000-member community, and uses 4x less storage than OpenAI embeddings. Upgrade to OpenAI models only if quality is insufficient.

### Indexing Strategy

| Dataset Size | Index Type | Recommendation |
|-------------|-----------|----------------|
| < 10,000 rows | **None** (sequential scan) | Postgres sequential scan is faster than HNSW overhead at this scale |
| 10,000 - 100,000 | **HNSW** | `CREATE INDEX USING hnsw (embedding vector_cosine_ops)` |
| 100,000+ | **HNSW** with tuning | Increase `m` and `ef_construction` parameters |

**ZAO OS at 1,000 members:**
- Music taste profiles: ~1,000 rows (no index needed)
- Agent memories: ~10,000-50,000 rows (add HNSW when > 10K)
- Proposal embeddings: ~500 rows (no index needed)
- Cast embeddings: potentially large — only embed "important" casts, not all

```sql
-- HNSW index with custom parameters (for when dataset grows)
CREATE INDEX idx_memories_hnsw ON agent_memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Hybrid Search: Vector + Full-Text

Combine pgvector similarity with PostgreSQL full-text search for best results:

```sql
CREATE OR REPLACE FUNCTION hybrid_search_proposals(
  query_text TEXT,
  query_embedding vector(384),
  match_count INT DEFAULT 10,
  full_text_weight FLOAT DEFAULT 0.5,
  semantic_weight FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  combined_score FLOAT
) AS $$
  WITH fts AS (
    SELECT p.id, ts_rank(
      to_tsvector('english', p.title || ' ' || p.description),
      websearch_to_tsquery('english', query_text)
    ) AS fts_score
    FROM proposals p
    WHERE to_tsvector('english', p.title || ' ' || p.description)
      @@ websearch_to_tsquery('english', query_text)
  ),
  semantic AS (
    SELECT p.id, 1 - (p.search_embedding <=> query_embedding) AS sem_score
    FROM proposals p
    WHERE p.search_embedding IS NOT NULL
  )
  SELECT
    COALESCE(f.id, s.id) AS id,
    (SELECT title FROM proposals WHERE proposals.id = COALESCE(f.id, s.id)),
    COALESCE(f.fts_score, 0) * full_text_weight +
    COALESCE(s.sem_score, 0) * semantic_weight AS combined_score
  FROM fts f
  FULL OUTER JOIN semantic s ON f.id = s.id
  ORDER BY combined_score DESC
  LIMIT match_count;
$$ LANGUAGE sql;
```

### Storage & Performance Impact

| Dimension | Storage per row | 1,000 rows | 100,000 rows |
|-----------|----------------|-----------|--------------|
| 384 (gte-small) | ~1.5 KB | ~1.5 MB | ~150 MB |
| 1536 (OpenAI small) | ~6 KB | ~6 MB | ~600 MB |

At ZAO OS scale (1,000 members), pgvector adds negligible storage overhead. No compute tier upgrade needed.

---

## 4. Edge Functions vs Next.js API Routes

ZAO OS already uses Next.js API routes extensively. Edge Functions should be added only where they provide clear advantages.

### Decision Matrix

| Use Case | Best Choice | Why |
|----------|------------|-----|
| **Webhook processing** (Neynar, Farcaster) | **Edge Functions** | Global deployment, sub-100ms cold start, runs independent of Vercel |
| **pg_cron triggered tasks** | **Edge Functions** | Direct invocation via `pg_net`, no external scheduler needed |
| **Scheduled cast processing** | **Edge Functions** | Called by pg_cron, needs Neynar API access |
| **Bluesky feed sync** | **Edge Functions** | Called by pg_cron, runs on schedule |
| **Embedding generation** | **Edge Functions** | Built-in `gte-small` model, no external API needed |
| **Auth-gated API endpoints** | **Next.js API Routes** | Already have iron-session middleware, Zod validation |
| **Page-adjacent data fetching** | **Next.js API Routes** | Co-located with components, benefits from Vercel edge network |
| **File uploads** | **Next.js API Routes** | Current implementation works well, integrated with middleware |
| **Admin operations** | **Next.js API Routes** | Complex auth checks, multiple DB operations |

### When Edge Functions Win

1. **pg_cron integration:** pg_cron can call Edge Functions directly via `pg_net` HTTP. No need for external cron services or Vercel cron (which has limited free-tier invocations).

2. **Webhook reliability:** If Vercel has an outage, your Edge Functions still process webhooks. Decoupled from deployment pipeline.

3. **Built-in AI:** Supabase Edge Functions include the `gte-small` embedding model natively. Generate embeddings without an OpenAI API key.

4. **Global latency:** Edge Functions run in 30+ regions. For webhook processing where the source could be anywhere, this matters.

### When Next.js API Routes Win

1. **Existing middleware:** Rate limiting, CORS, session validation are already configured in `src/middleware.ts`.

2. **Type sharing:** API routes share types with components. No separate deployment.

3. **Vercel integration:** Automatic preview deployments, logs, analytics.

4. **Complexity:** Most ZAO OS operations need session context, multi-step DB operations, and error handling that's already built in the API routes.

### Recommended Edge Functions for ZAO OS

```
supabase/functions/
  process-scheduled-casts/  -- Called by pg_cron every 5 min
  sync-bluesky/             -- Called by pg_cron every 15 min
  generate-embeddings/      -- Called by DB trigger on insert
  process-webhook/          -- Neynar webhook receiver (backup)
```

### Edge Function Performance (2026)

| Metric | Free | Pro |
|--------|------|-----|
| Invocations/month | 500,000 | 2,000,000 |
| Max execution time | 60s | 150s |
| Memory | 256 MB | 512 MB |
| Cold start | ~200-400ms | ~200-400ms |
| Hot request | ~50-125ms | ~50-125ms |
| Overage per 1M invocations | N/A | $2 |

---

## 5. Storage Optimization

Current implementation in `/api/upload/route.ts` is functional but can be improved.

### Current State

- Single `uploads` bucket (public)
- 5 MB limit, images only (JPEG, PNG, GIF, WebP)
- Files stored as `{fid}/{timestamp}.{ext}`
- No image transformation
- No CDN optimization

### Recommended Improvements

#### 1. Bucket Organization

```sql
-- Create separate buckets for different content types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('post-media', 'post-media', true, 10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('song-artwork', 'song-artwork', true, 5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('private-uploads', 'private-uploads', false, 10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav']);
```

#### 2. Image Transformations (Pro Plan)

Serve optimized images on-the-fly without pre-processing:

```typescript
// Get avatar at 128px with WebP auto-conversion
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('user-123/photo.jpg', {
    transform: {
      width: 128,
      height: 128,
      resize: 'cover',
      quality: 75,
    },
  });
// Result: auto-converts to WebP for supported browsers, served from CDN

// Post image at max 800px wide
const { data } = supabase.storage
  .from('post-media')
  .getPublicUrl('cast-img.png', {
    transform: {
      width: 800,
      quality: 80,
    },
  });
```

**Pricing:** $5 per 1,000 origin images (transformed). First 100 free on Pro.

#### 3. Smart CDN

Supabase serves storage assets through a global CDN (285+ cities). Assets are cached automatically. When a file is updated or deleted, the CDN cache is invalidated.

**Optimization tips:**
- Set long cache TTL for immutable content (avatars rarely change)
- Use unique filenames (timestamp-based, as current implementation does)
- Cached egress is cheaper than origin egress

#### 4. Client-Side Image Compression

Compress before upload to reduce storage and egress costs:

```typescript
// utils/compressImage.ts
export async function compressImage(file: File, maxWidth = 1200): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}
```

#### 5. Storage RLS Policies

```sql
-- Avatars: anyone can read, authenticated users can upload their own
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Note:** ZAO OS uses service_role for all storage operations (server-side upload route), so these policies are informational for if/when client-side uploads are added.

---

## 6. Indexing Strategies for 22 Tables

### Current Index Audit

ZAO OS already has good index coverage (see `scripts/add-missing-indexes.sql`). Here are the gaps and optimization opportunities.

### Priority Indexes by Query Pattern

#### channel_casts (Highest traffic table)

```sql
-- EXISTING: Good
-- idx_channel_casts_channel_ts ON (channel_id, timestamp DESC)  -- Feed queries
-- idx_channel_casts_parent ON (parent_hash) WHERE parent_hash IS NOT NULL  -- Thread queries
-- idx_channel_casts_channel_id ON (channel_id)  -- COUNT queries

-- RECOMMENDED ADDITIONS:

-- Covering index for feed query (avoids heap lookup for common columns)
CREATE INDEX IF NOT EXISTS idx_channel_casts_feed_covering
  ON channel_casts (channel_id, timestamp DESC)
  INCLUDE (fid, author_display, author_pfp, text, embeds, reactions, replies_count);

-- Cleanup queries (pg_cron deletes by timestamp)
CREATE INDEX IF NOT EXISTS idx_channel_casts_timestamp
  ON channel_casts (timestamp)
  WHERE timestamp < NOW() - INTERVAL '25 days';  -- Partial: only old rows
```

**Note on covering index:** This is a significant optimization. The feed query currently does an index scan + heap lookup for every row. A covering index allows index-only scans, which can be 2-5x faster for feed loads. Trade-off: larger index size (~2x), but well worth it for the most-queried table.

#### proposals (Governance queries)

```sql
-- EXISTING: Good
-- idx_proposals_status ON (status)
-- idx_proposals_author ON (author_id)
-- idx_proposals_created ON (created_at DESC)

-- RECOMMENDED ADDITION:
-- Composite for the most common query: "open proposals, newest first"
CREATE INDEX IF NOT EXISTS idx_proposals_open_recent
  ON proposals (created_at DESC)
  WHERE status = 'open';
```

#### users (Auth lookups)

```sql
-- EXISTING: Good
-- idx_users_fid ON (fid) WHERE fid IS NOT NULL
-- idx_users_primary_wallet ON (primary_wallet)
-- idx_users_fid_active ON (fid, is_active) WHERE fid IS NOT NULL

-- No additional indexes needed. Current coverage handles all auth patterns.
```

#### notifications (Bell icon queries)

```sql
-- EXISTING: Good
-- idx_notifications_recipient ON (recipient_fid, read, created_at DESC)

-- RECOMMENDED ADDITION:
-- Unread count query optimization (used by NotificationBell every 30s)
CREATE INDEX IF NOT EXISTS idx_notifications_unread_count
  ON notifications (recipient_fid)
  WHERE read = FALSE;
```

#### respect_members (Leaderboard)

```sql
-- EXISTING: Good
-- idx_respect_members_wallet ON (wallet_address)
-- idx_respect_members_fid ON (fid) WHERE fid IS NOT NULL
-- idx_respect_members_total ON (total_respect DESC)

-- If using materialized view (Section 2), the view has its own index.
-- No additional indexes needed on the base table.
```

### GIN Indexes for JSONB Columns

```sql
-- channel_casts.embeds — queried when filtering media-only casts
CREATE INDEX IF NOT EXISTS idx_channel_casts_embeds_gin
  ON channel_casts USING GIN (embeds jsonb_path_ops);

-- channel_casts.reactions — queried for reaction lookups
CREATE INDEX IF NOT EXISTS idx_channel_casts_reactions_gin
  ON channel_casts USING GIN (reactions jsonb_path_ops);

-- users.verified_addresses — queried for wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_verified_addresses_gin
  ON users USING GIN (verified_addresses jsonb_path_ops);
```

**Note:** Only add GIN indexes if you actually query these JSONB columns with containment operators (`@>`, `?`, `?|`). If you only read the full JSONB blob, GIN indexes waste space.

### Index Monitoring

```sql
-- Find unused indexes (waste of storage + write overhead)
SELECT
  schemaname, tablename, indexname,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find missing indexes (sequential scans on large tables)
SELECT
  schemaname, relname AS table,
  seq_scan, seq_tup_read,
  idx_scan, idx_tup_fetch,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
  AND n_live_tup > 1000
ORDER BY seq_tup_read DESC;
```

### Full-Text Search Index (for cast search)

```sql
-- Add generated tsvector column to channel_casts
ALTER TABLE channel_casts ADD COLUMN IF NOT EXISTS
  search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(text, ''))) STORED;

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_channel_casts_search
  ON channel_casts USING GIN (search_vector);

-- Search query
SELECT * FROM channel_casts
WHERE search_vector @@ websearch_to_tsquery('english', 'ambient electronic')
ORDER BY timestamp DESC
LIMIT 20;
```

---

## 7. Supabase Branching

Supabase Branching creates isolated database environments for development and testing, tied to Git branches.

### How It Works

1. Every Git branch gets its own Supabase instance (database, auth, storage, edge functions)
2. Migrations from `supabase/migrations/` are automatically applied to branch instances
3. Seed data from `supabase/seed.sql` populates the branch
4. Branch instances are ephemeral — paused after inactivity, deleted when PR is merged/closed
5. Each branch gets its own URL, API keys, and dashboard view

### Setup with GitHub Integration

1. Install the Supabase GitHub integration on your repo
2. Link your Supabase project to the GitHub repo
3. Enable branching in Project Settings > Branching
4. Push a branch with migration changes — Supabase auto-creates a preview branch

### Setup with Vercel

When using Vercel + Supabase branching:
- Vercel preview deployments automatically get the branch's Supabase URL and keys
- No manual env var switching needed
- PR comments show deployment status

### Branch Types

| Type | Lifetime | Use Case | Cost |
|------|----------|----------|------|
| **Preview branches** | Ephemeral (tied to PR) | Feature testing, CI | Compute hours while active |
| **Persistent branches** | Long-lived | Staging environment | Fixed monthly compute |

### Configuration for ZAO OS

```
supabase/
  config.toml          # Supabase project config
  migrations/
    20260313_scheduled_casts.sql
    20260313_song_submissions.sql
    (future migrations here)
  seed.sql             # Test data for branches
```

**seed.sql example:**

```sql
-- Seed allowlist with test members
INSERT INTO allowlist (fid, wallet_address, real_name, ign, is_active) VALUES
  (1, '0xtest1...', 'Test User 1', 'tester1', true),
  (2, '0xtest2...', 'Test User 2', 'tester2', true);

-- Seed test users
INSERT INTO users (primary_wallet, fid, username, display_name, role, is_active) VALUES
  ('0xtest1...', 1, 'tester1', 'Test User 1', 'admin', true),
  ('0xtest2...', 2, 'tester2', 'Test User 2', 'member', true);

-- Seed test channel casts
INSERT INTO channel_casts (hash, channel_id, fid, author_username, text, timestamp) VALUES
  ('0xfake1', 'zao', 1, 'tester1', 'Hello from seed data!', NOW());
```

### Pricing (2026)

- **Pro plan ($25/mo):** Branching available. Each branch billed at Micro instance rate (~$0.01344/hr = ~$10/mo if running 24/7)
- **Preview branches** auto-pause after inactivity, so actual cost is minimal for PR-based workflows
- The main project's $10 compute credit does **not** apply to branch instances
- **Realistic cost for ZAO OS:** $2-5/month (branches only active during PR review, auto-pause otherwise)

### Migration Workflow

```bash
# Create a new migration
supabase migration new add_music_taste_profiles

# Edit the generated file in supabase/migrations/

# Test locally
supabase db reset  # Drops, recreates, runs all migrations + seed

# Push branch to GitHub — Supabase auto-creates preview branch
git push origin feature/music-taste

# PR merged — preview branch auto-deleted
# Apply to production
supabase db push
```

### Current Gap in ZAO OS

ZAO OS currently manages schema changes via individual SQL scripts in `scripts/`. To use branching effectively, these need to be consolidated into the `supabase/migrations/` directory with proper timestamps. The two existing migrations (`20260313_song_submissions.sql`, `20260313_scheduled_casts.sql`) are a good start.

---

## 8. Cost Projections

### 100 Members (Current)

| Service | Usage | Plan | Monthly Cost |
|---------|-------|------|-------------|
| Database (Micro) | ~50 MB | Free | $0 |
| Realtime | ~500K messages | Free | $0 |
| Storage | ~500 MB | Free | $0 |
| Edge Functions | ~50K invocations | Free | $0 |
| **Total** | | | **$0** |

### 500 Members (Growth Phase)

| Service | Usage | Plan | Monthly Cost |
|---------|-------|------|-------------|
| Database (Micro) | ~200 MB | Pro | $25 (base) |
| Realtime | ~3M messages | Pro (included) | $0 |
| Storage | ~2 GB | Pro (included) | $0 |
| Edge Functions | ~500K invocations | Pro (included) | $0 |
| Image Transforms | ~2K origins | Pro | $10 |
| Branching | ~2 branches, low use | Pro | $3 |
| **Total** | | | **~$38/mo** |

### 1,000 Members (Target Scale)

| Service | Usage | Plan | Monthly Cost |
|---------|-------|------|-------------|
| Database (Small) | ~500 MB | Pro + Small compute | $25 + $15 |
| Realtime | ~6M messages | Pro + 1M overage | $2.50 |
| Storage | ~5 GB | Pro (8 GB included) | $0 |
| Edge Functions | ~1.5M invocations | Pro (2M included) | $0 |
| Image Transforms | ~5K origins | Pro | $25 |
| Branching | ~2 branches | Pro | $5 |
| pgvector | Negligible at this scale | Included | $0 |
| **Total** | | | **~$72.50/mo** |

### Key Cost Drivers to Watch

1. **Realtime messages** scale linearly with concurrent users x event frequency. Keep Broadcast messages small.
2. **Database compute** — upgrade from Micro to Small when you consistently see >70% CPU usage.
3. **Image transformations** — compress client-side before upload to reduce origin transforms needed.
4. **Egress** — CDN-cached egress is cheaper. Aggressive caching strategy pays for itself.

---

## Implementation Priority

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 1 | **Enable pg_cron** + add 7 scheduled jobs | Small | High — automates cleanup, scheduled casts, leaderboard refresh |
| 2 | **Add Broadcast pattern** for chat messages | Medium | High — eliminates N-subscriber RLS bottleneck |
| 3 | **Add filter to NotificationBell** Realtime subscription | Small | Medium — reduces unnecessary RLS checks |
| 4 | **Add covering index** for channel_casts feed query | Small | Medium — 2-5x faster feed loads |
| 5 | **Enable pgvector** + create music_taste_profiles table | Small | Medium — foundation for AI features |
| 6 | **Set up Supabase branching** + migrate scripts to migrations/ | Medium | Medium — safe schema changes, preview environments |
| 7 | **Create 4 Edge Functions** for cron-triggered tasks | Medium | Medium — reliable scheduled processing |
| 8 | **Optimize Storage** with separate buckets + image transforms | Small | Low — current setup works, this is polish |
| 9 | **Add GIN indexes** for JSONB columns (if queried) | Small | Low — only if JSONB containment queries are needed |
| 10 | **Add full-text search** to channel_casts | Medium | Low — nice-to-have, most search is by channel |

---

## Sources

- [Supabase Realtime — Postgres Changes](https://supabase.com/features/realtime-postgres-changes)
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)
- [Supabase Realtime Pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Supabase Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Cron (pg_cron)](https://supabase.com/docs/guides/cron)
- [pg_cron Extension Docs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [pg_net Async Networking](https://supabase.com/docs/guides/database/extensions/pg_net)
- [pgvector Embeddings & Similarity](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase AI & Vectors](https://supabase.com/docs/guides/ai)
- [Supabase Vector Columns](https://supabase.com/docs/guides/ai/vector-columns)
- [Supabase Semantic Search](https://supabase.com/docs/guides/ai/semantic-search)
- [HNSW Indexes with pgvector (Crunchy Data)](https://www.crunchydata.com/blog/hnsw-indexes-with-postgres-and-pgvector)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Edge Functions Architecture](https://supabase.com/docs/guides/functions/architecture)
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Supabase Storage Scaling](https://supabase.com/docs/guides/storage/production/scaling)
- [Supabase Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn)
- [Managing Indexes in PostgreSQL](https://supabase.com/docs/guides/database/postgres/indexes)
- [Supabase Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Advanced Postgres Indexing (DevTo)](https://dev.to/damasosanoja/beyond-basic-indexes-advanced-postgres-indexing-for-maximum-supabase-performance-3oj1)
- [Supabase index_advisor](https://supabase.com/docs/guides/database/extensions/index_advisor)
- [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)
- [Branching via Dashboard](https://supabase.com/docs/guides/deployment/branching/dashboard)
- [Manage Branching Usage](https://supabase.com/docs/guides/platform/manage-your-usage/branching)
- [Supabase GitHub Integration](https://supabase.com/docs/guides/deployment/branching/github-integration)
- [Supabase Pricing 2026](https://supabase.com/pricing)
- [Supabase Pricing Breakdown (Metacto)](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)
- [Supabase Pricing (UI Bakery)](https://uibakery.io/blog/supabase-pricing)
