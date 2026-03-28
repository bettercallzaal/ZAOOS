# 42 — Supabase Advanced Patterns

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Deep dive on database design, RLS, Realtime, Storage, Edge Functions, and optimization for ZAO OS

---

## Priority Actions for ZAO OS

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | **Use cursor-based pagination** for all feeds | High (scales, consistent) | Medium |
| 2 | **Use Broadcast** for chat (not Postgres Changes) | High (scales better) | Medium |
| 3 | **Install supabase-cache-helpers** with React Query | High (auto cache management) | Small |
| 4 | **Set up migration workflow** (supabase CLI + version control) | High (safe schema changes) | Medium |
| 5 | **Enable pgvector** now for future AI features | Medium (easier to add early) | Small |
| 6 | **Add materialized views** for leaderboard/stats | Medium (fast aggregations) | Small |
| 7 | **Generate TypeScript types** from schema | Medium (type safety) | Small |
| 8 | **Use Edge Functions** for webhook processing + cron | Medium (global, fast) | Medium |

---

## 1. Schema Design for Social Apps

### Normalized First, Denormalize Later
Start normalized (`users`, `posts`, `reactions`, `follows`, `channels`). PostgreSQL handles joins well. Only denormalize (add `reaction_count` to posts) when you measure a specific bottleneck — maintain via triggers.

### JSONB Columns
**Use for:** metadata blobs, external API payloads, flexible attributes
**Don't use for:** data needing JOINs, foreign keys, or unique constraints
**Index:** `CREATE INDEX USING GIN (column jsonb_path_ops)` — smaller, faster for containment queries (`@>`)

### Indexing for Social Feeds
```sql
-- Most common query: recent posts in channel
CREATE INDEX idx_posts_channel ON posts (channel_id, created_at DESC);

-- Partial index (excludes soft-deleted)
CREATE INDEX idx_posts_active ON posts (created_at DESC) WHERE deleted_at IS NULL;

-- Covering index (index-only scan for feed)
CREATE INDEX idx_posts_feed ON posts (channel_id, created_at DESC)
  INCLUDE (author_id, content_preview);
```

### Full-Text Search (Built-in PostgreSQL)
```sql
-- Generated column for search
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(text,''))) STORED;

-- GIN index
CREATE INDEX idx_posts_search ON posts USING GIN (search_vector);

-- Query with natural syntax
SELECT * FROM posts
WHERE search_vector @@ websearch_to_tsquery('english', 'ambient electronic music');
```

### Cursor-Based Pagination (Mandatory for Feeds)
```sql
-- Composite cursor for deterministic ordering
CREATE INDEX idx_posts_cursor ON posts (created_at DESC, id DESC);

-- Query
SELECT * FROM posts
WHERE (created_at, id) < ($cursor_created_at, $cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```
Return last row's `(created_at, id)` as next cursor (base64-encode for clients).

### Soft Deletes
- User-facing content: `deleted_at TIMESTAMP` column + partial index `WHERE deleted_at IS NULL`
- Ephemeral data (sessions, receipts): hard delete
- Audit trail: trigger copies old row to `audit_log` as JSONB on UPDATE/DELETE
- Pitfall: soft deletes break UNIQUE — use partial unique indexes

### Materialized Views
```sql
-- Leaderboard (refresh every 5 min via pg_cron)
CREATE MATERIALIZED VIEW leaderboard AS
  SELECT author_fid, COUNT(*) as post_count, SUM(reaction_count) as total_reactions
  FROM posts WHERE deleted_at IS NULL
  GROUP BY author_fid;

CREATE UNIQUE INDEX idx_leaderboard_fid ON leaderboard (author_fid);

-- Refresh concurrently (no read lock)
SELECT cron.schedule('refresh-leaderboard', '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard$$);
```

---

## 2. Row Level Security (RLS)

### Allowlist-Based Access (ZAO Pattern)
```sql
CREATE POLICY "Allowlisted users can read posts" ON posts FOR SELECT
USING (EXISTS (SELECT 1 FROM allowlist WHERE fid = current_setting('app.current_fid')::int));
```

### Performance Optimization
1. **Index all columns in RLS policies** — missing index = sequential scan per row
2. **Wrap function calls in subselects** — `(select auth.uid())` caches result (1 call vs N calls)
3. **Use `TO authenticated`** — skips policy evaluation for anonymous users
4. **Avoid RLS on high-throughput tables** — use service role + application-level auth for real-time messages

### Common Pitfalls
- **Recursive policies:** Table A checks Table B, Table B checks Table A → infinite loop. Fix: `SECURITY DEFINER` functions
- **Trusting `user_metadata`:** Users can modify it via `auth.updateUser()`. Use `app_metadata` (server-only) or roles table
- **SQL Editor bypasses RLS:** Uses `postgres` role. Test from client SDK or Studio impersonation
- **83% of exposed Supabase databases** involved RLS misconfigurations (Jan 2025 audit)

---

## 3. Supabase Realtime

### Three Primitives

| Primitive | Persisted? | Use Case | Scaling |
|-----------|-----------|----------|---------|
| **Postgres Changes** | Yes (DB trigger) | Feed updates, new posts | 1 insert = N RLS checks (1 per subscriber) |
| **Broadcast** | No (ephemeral) | Typing, reactions, "now playing" | Low overhead, no DB load |
| **Presence** | No (ephemeral) | Online status, who's listening | Auto-sync on join/leave |

### ZAO OS Recommendations
- **Chat messages:** Use **Broadcast** (not Postgres Changes) — write to DB, then broadcast from Edge Function. Avoids 1:N RLS check problem.
- **Typing indicators:** Broadcast only
- **Online/presence:** Presence with `{ status, currentTrack, displayName }`
- **"Now playing":** Broadcast on dedicated channel

### Rate Limits

| Resource | Free | Pro |
|----------|------|-----|
| Concurrent connections | 200 | 500+ |
| Messages/second | 100 | 500 |
| Message size | 1 MB | 1 MB |

### Reconnection
- Built-in exponential backoff
- On reconnect: run "catch-up" query for missed events
- Always `channel.unsubscribe()` in useEffect cleanup

---

## 4. Storage

### Bucket Organization

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | Profile pictures (CDN-cached) |
| `post-media` | Yes | Images/audio in public posts |
| `private-uploads` | No | DM attachments, gated content |

### Image Transformation (Pro+)
- On-the-fly: `?width=200&height=200&quality=75`
- Auto WebP conversion for supported browsers
- CDN-cached transformations
- Serve avatars at 128px, post images at 800px max

### Signed URLs (Private Content)
- Time-limited, generated server-side
- Set minimum expiry (60s for player, 3600 for download)
- CDN-cacheable

---

## 5. Edge Functions

### When to Use vs Next.js API Routes

| Use Case | Edge Functions | API Routes |
|----------|---------------|------------|
| Webhook processing | **Preferred** (global, fast) | OK |
| Cron jobs | **Preferred** (pg_cron trigger) | Needs external cron |
| Heavy computation | OK (150s timeout) | OK |
| Auth-gated API | Either | Preferred with middleware |

### Performance
- Cold start: ~400ms median
- Hot request: ~125ms median
- Max execution: 150s (Pro), 60s (Free)
- Memory: 256MB (Free), 512MB (Pro)
- Deno runtime (TypeScript native)

### pg_cron + Edge Functions
```sql
-- Daily digest at 10 AM
SELECT cron.schedule('daily-digest', '0 10 * * *',
  $$SELECT net.http_post('https://your-project.supabase.co/functions/v1/send-digest', '{}')$$);

-- Cleanup old notifications every night
SELECT cron.schedule('cleanup', '0 3 * * *',
  $$DELETE FROM notifications WHERE created_at < now() - interval '90 days'$$);
```

---

## 6. PostgreSQL Advanced

### pgvector (AI Agent Memory)
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE memories ADD COLUMN embedding vector(1536);
CREATE INDEX ON memories USING hnsw (embedding vector_cosine_ops);
```
- 1536 dims for OpenAI `text-embedding-3-small`
- HNSW index: faster queries, slower build
- Hybrid search: combine `ts_rank()` (FTS) + vector distance via Reciprocal Rank Fusion

### pg_stat_statements (Performance Monitoring)
```sql
-- Find slowest queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 20;
```

### Triggers for Denormalized Counters
```sql
-- Auto-update reaction count
CREATE FUNCTION update_reaction_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_reaction_insert
  AFTER INSERT ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_reaction_count();
```

---

## 7. Migrations

### Workflow
```bash
supabase init                          # Initialize
supabase start                         # Local Postgres + Studio
supabase db diff --schema public       # Auto-generate migration from changes
supabase migration new add_feature     # Create empty migration manually
supabase db reset                      # Drop + recreate + run all migrations
supabase db push                       # Apply to remote (staging/prod)
```

### Type Generation
```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```
Pass `Database` generic to `createClient<Database>()` for full type safety.

### Seeding
- `supabase/seed.sql` runs after migrations on `start` and `reset`
- Seed allowlist from CSV, test channels, sample posts
- Multiple seed files: `[db.seed] sql_paths = ['./seeds/allowlist.sql']`

---

## 8. Performance Optimization

### Connection Pooling (Supavisor)
- **Transaction mode (port 6543):** Use for serverless/API routes (shared connections)
- **Session mode (port 5432):** Use for long-lived connections, LISTEN/NOTIFY
- Default pool: 15 connections (Micro), 30 (Small)
- Always use transaction mode from Next.js server components

### Query Optimization
- Use `EXPLAIN (ANALYZE, BUFFERS)` for slow queries
- Seq Scan on large table = missing index
- Use `.select('col1, col2')` not `.select('*')`
- Batch operations: `upsert` over individual INSERTs

### Cost Optimization
- Cursor pagination cuts bandwidth ~60%
- Compress images before upload
- Use RLS instead of application filtering (less data returned)
- Set billing alerts
- Monitor MAUs ($3.25 per 1,000 MAUs at scale)

---

## 9. Backup & Recovery

| Plan | Frequency | Retention | PITR |
|------|-----------|-----------|------|
| Free | Weekly | 7 days | No |
| Pro | Daily | 7 days | Add-on (~$100/mo) |
| Team | Daily | 14 days | Add-on |

### Manual Backup
```bash
supabase db dump -f backup.sql --project-ref your-ref
```

### Strategy for ZAO OS
1. Rely on daily backups for routine
2. Enable PITR when you have paying users
3. Weekly `supabase db dump` to separate location
4. All migrations in version control (can recreate from scratch)

---

## 10. Next.js Integration

### supabase-cache-helpers (Recommended)
```bash
npm install @supabase-cache-helpers/postgrest-react-query
```
- **Automatic cache keys** from Supabase queries
- **Auto cache updates** on mutations (insert/update/delete update all relevant queries)
- **Optimistic updates** built in
- **Realtime → cache** integration (events auto-update React Query cache)

### Optimistic Update Pattern
1. User sends message
2. Add to React Query cache with temp ID + `status: 'sending'`
3. Mutation to Supabase
4. Success: replace temp ID with real ID, `status: 'sent'`
5. Error: mark `status: 'failed'`, show retry
6. Other clients pick up via Realtime

### Server Components
- Use `@supabase/ssr` for server-side client
- Always `supabase.auth.getUser()` (not `getSession()`) for security
- Cookie-reading must happen outside `"use cache"` scope

---

## Sources

- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices)
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture)
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)
- [Supavisor 1M Connections](https://supabase.com/blog/supavisor-1-million)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Full-Text Search](https://supabase.com/docs/guides/database/full-text-search)
- [Supabase Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Connection Management](https://supabase.com/docs/guides/database/connection-management)
- [Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [React Query + Next.js + Cache Helpers](https://supabase.com/blog/react-query-nextjs-app-router-cache-helpers)
- [Supabase SSR Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Pricing](https://supabase.com/pricing)
