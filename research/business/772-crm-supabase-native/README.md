---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-29
superseded-by:
related-docs: 737, 712, 743, 110, 734
original-query: "Public/private personal relationship CRM for a build-in-public founder: dual-layer contact model (public feed: name, handle, role, how-we-met, conversation summary, date; private RLS-gated: email, phone, location, confidential notes, relationship strength), contacts + interactions schema, /network public route + /crm private dashboard. ALSO cover: how builders/founders run people-CRMs fed by AI agents, CRM-as-knowledge-graph patterns, and how this should integrate with ZAO's Bonfire knowledge graph (episodes from interactions). Target stack: Next.js 16 + Supabase RLS + Telegram bot (ZOE) entry path."
tier: DISPATCH
---

# 772 - ZAO CRM: Supabase-Native Public/Private Relationship CRM

> **Goal:** Migrate the ZAO relationship CRM off Airtable (doc 737) onto a Supabase-native, RLS-gated two-layer model with a public `/network` feed and a private `/crm` dashboard in ZAOOS, fed by ZOE over a bot API.

## Decision context (read this first)

This doc **overrides doc 737** (Airtable Agentic CRM v3, locked 2026-05-23, live since 2026-05-25). Zaal chose Supabase-native on 2026-05-29 for: native RLS, programmatic queryability, ZAOOS integration, and a build-in-public public feed that Airtable cannot serve. Doc 737 gets `superseded-by: 772`. The live Airtable data (10 activity + 6 contacts from the 2026-05-25 `gmail-week-import.py` run) is migrated, not abandoned.

ZOE proposed this build in a Telegram session without knowing doc 737 existed. The research reconciled the conflict; Zaal resolved it toward Supabase-native.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **Supabase-native is canonical. Airtable becomes read-only archive, then frozen.** | One source of truth, native RLS, no two-store sync debt. Reverses doc 737. |
| 2 | **One private base table per entity + a public VIEW with `security_invoker = true`.** NOT two tables, NOT column-level security (Postgres has no column-level RLS). | Supabase's official "some columns public, some private" pattern. Field filtering at the SQL layer, not app code. |
| 3 | **`interactions` carries a per-row `visibility` enum (`public`/`private`).** Public feed shows only `public` rows; owner sees all via RLS. | Granular - you publish "met X, talked about Y" while keeping the confidential notes private on the same record set. |
| 4 | **Wrap `auth.uid()` as `(select auth.uid())` in every RLS policy + index `owner_id`.** | Supabase benchmark: 179ms -> 9ms on 100K rows (95% faster). RLS without an index on the policy column tanks throughput ~86%. |
| 5 | **Borrow Monica's schema shape (contacts + activities + reminders).** Don't fork Monica (PHP/Laravel, AGPL-3.0). | Monica (24,560 GitHub stars) is the most battle-tested open personal-CRM data model. We take the shape, build native TS. |
| 6 | **Bot writes via `POST /api/crm/interactions` with a Bearer shared-secret; browser uses iron-session.** Dual-auth in one route, service-role client server-side only. | ZOE is a machine caller with no user session. Matches existing `src/lib/auth/session.ts` + `src/lib/db/supabase.ts` split. |
| 7 | **Public feed = server component reading the public view with the anon key + `use cache`/`cacheLife`.** Per-contact `/network/[slug]` via `generateStaticParams`. | Next.js 16 caching. Public, cacheable, no auth round-trip. |
| 8 | **Interactions -> Bonfire episodes stay best-effort + async** (reuse doc 734 `BonfireMemory` adapter, fire-and-forget like the ZOE relay just shipped). | Bonfire already has `bonfire_episode_id` on the activity model. Don't block the write path on the graph POST. |

One deliberate **don't**: no graph database (Neo4j) for v1. Postgres + a `jsonb` relationships column covers "who introduced whom" until traversal queries actually become the bottleneck. Bonfire is the graph layer we already have.

## Findings

### 1. Dual-layer privacy: private table + public view (Decision 2)

Postgres has **no column-level RLS**. The canonical Supabase pattern for "some fields public, some private" is a locked base table plus a view that exposes only safe columns, with `security_invoker = true` so the view obeys the base table's RLS:

```sql
-- base table: owner-only, RLS-locked
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  -- public-safe
  name text not null,
  handle text unique,
  role text,
  org text,
  how_we_met text,
  public_summary text,
  is_public boolean not null default false,
  -- private
  email text, phone text, location text,
  private_notes text, relationship_strength int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index contacts_owner_idx on public.contacts(owner_id);   -- RLS perf (Decision 4)
alter table public.contacts enable row level security;

create policy owner_all on public.contacts for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- public view: only safe columns, only opted-in rows
create view public.contacts_public
with (security_invoker = true) as
  select id, name, handle, role, org, how_we_met, public_summary, created_at
  from public.contacts
  where is_public = true;
grant select on public.contacts_public to anon, authenticated;
```

**Critical gotcha:** without `security_invoker = true`, a view runs as its owner (superuser) and **bypasses RLS entirely**. This is the #1 Supabase data-leak footgun. Postgres 15+ only - Supabase runs Postgres 15, so it is available.

### 2. Interactions with per-row visibility (Decision 3)

```sql
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  type text not null,            -- meeting | call | email | message | gcal | github
  occurred_at timestamptz not null default now(),
  public_summary text,           -- shown on the public feed
  private_notes text,            -- never leaves the private layer
  visibility text not null default 'private' check (visibility in ('public','private')),
  source text,                   -- gmail-mcp | meeting-skill | manual | zoe
  bonfire_episode_id text,
  created_at timestamptz default now()
);
create index interactions_owner_idx on public.interactions(owner_id);
create index interactions_contact_idx on public.interactions(contact_id);
alter table public.interactions enable row level security;

create policy owner_all on public.interactions for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- public view: public rows only, safe columns only
create view public.interactions_public
with (security_invoker = true) as
  select id, contact_id, type, occurred_at, public_summary
  from public.interactions
  where visibility = 'public';
grant select on public.interactions_public to anon, authenticated;
```

### 3. Migration from Airtable (Decision 1)

Airtable API limits: **5 requests/sec per base**, 50 req/sec per service account, **100 records per list page** (opaque `offset` token, expires across sessions), batch writes max 10. One-shot TS script: page contacts -> map to Supabase columns (`is_public` from Airtable `consent_for_graph`, `private_notes` from `notes`, etc.) -> `upsert(onConflict: 'handle')`; then page activity -> insert interactions linked by mapped contact id. Sleep 200ms between pages to stay under 5 req/sec. Keep the Airtable record id in a `legacy_airtable_id` column for reconciliation, freeze Airtable after verification.

### 4. Reference data model - Monica (Decision 5)

Monica (24,560 stars, 2,452 forks, AGPL-3.0, v5.0.0-beta) models: **contacts + activities (logged interactions: call/email/meeting + date + notes) + reminders + notes + inter-contact relationships**. We borrow the contacts/activities split exactly (our `contacts` + `interactions`). Reminders are a v2 add. Dex/Clay/Folk/Covve are closed-source; Clay's agent-enrichment loop ($185/mo Launch tier, 15K actions/mo) is the reference for the agent-fed pattern, not the schema.

### 5. Agent-fed loop (ZOE entry path, Decision 6)

Industry-standard loop across Clay, Twin, n8n briefing platforms: **trigger -> extract (LLM parses unstructured email/meeting to structured JSON) -> dedupe (fuzzy match on email/handle) -> upsert contact -> insert interaction -> optional notify**. ZOE's path: `POST /api/crm/interactions` with `Authorization: Bearer $BOT_API_SECRET`, Zod-validated body, service-role Supabase client, upsert contact by handle then insert interaction. Same route accepts an iron-session cookie for the browser dashboard. Caller identity recorded in a `created_by` field for audit.

### 6. Next.js 16 surfaces (Decision 7)

- `/network` (public): server component, anon key, reads `contacts_public`/`interactions_public`, `'use cache'` + `cacheLife({ stale: 60, revalidate: 300 })`.
- `/network/[slug]`: `generateStaticParams` over public handles + `cacheTag('contact-<handle>')` for targeted revalidation on write.
- `/crm` (private): iron-session gate. **Caveat - verify before building:** one research agent reported Next.js 16 renames `middleware.ts` -> `proxy.ts` and pushes real auth enforcement into a Data Access Layer (CVE-2025-29927). This repo still uses `src/middleware.ts` on `next@^16.2.0` and it works. Do NOT assume the rename - confirm against the installed version's docs before refactoring auth. Gate `/crm` with a session check in the page/layout + DAL regardless, never rely on middleware alone.

## Proposed schema + build plan (needs Zaal sign-off before migration runs)

Per CLAUDE.md, DB migrations require approval. The SQL above is the proposal. Build order:

1. **Migration SQL** (`scripts/<date>_crm.sql`): `contacts` + `interactions` + 2 public views + RLS + indexes. Apply to Supabase after sign-off.
2. **Airtable -> Supabase migration script** (one-shot, TS, `scripts/zao-crm-sync/airtable-to-supabase.ts`).
3. **Bot API** `src/app/api/crm/interactions/route.ts` (dual-auth, Zod, service-role).
4. **`/crm` private dashboard** (iron-session, CRUD).
5. **`/network` public feed** + `/network/[slug]`.
6. **ZOE write path** in `bot/src/zoe/` calling the bot API.
7. **Bonfire** episode emit on `visibility=public` interactions (reuse doc 734 adapter).
8. Freeze Airtable; update doc 737 `superseded-by`.

## Also See

- [Doc 737](../737-airtable-agentic-crm-v3/) - the Airtable CRM this supersedes (schema source for the migration map)
- [Doc 712](../712-zao-crm-coworking-app/) - earlier Supabase CRM intent (pre-737)
- [Doc 743](../743-agentic-cold-outreach-workflow/) - outreach writers that will target the new schema
- [Doc 110](../../community/110-community-directory-crm/) - public community directory (`community_profiles`), distinct from this relationship CRM
- [Doc 734](../../agents/734-hermes-orchestrator-framework/) - `BonfireMemory` adapter reused for episode emit

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review + approve the migration SQL (contacts + interactions + views + RLS) | @Zaal | Approval | Before any apply |
| Apply migration to Supabase after approval | @Zaal | DB migration | On approval |
| Write + run Airtable -> Supabase one-shot migration script | Claude | PR | After SQL applied |
| Build bot API + `/crm` + `/network` (4 PRs, staged) | Claude | PR | Sprint |
| Set `superseded-by: 772` on doc 737 | Claude | PR | This PR |
| Wire ZOE `/api/crm/interactions` write path | Claude | PR | After bot API |

## Sources

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - [FULL]
- [Supabase RLS Performance & Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - [FULL] (the 179ms->9ms benchmark + subquery wrap)
- [Airtable API rate limits](https://support.airtable.com/docs/managing-api-call-limits-in-airtable) - [FULL] (5 req/s per base, 100/page)
- [Monica HQ - github.com/monicahq/monica](https://github.com/monicahq/monica) - [FULL] (24,560 stars, AGPL-3.0, contacts/activities schema)
- [Clay pricing](https://www.clay.com/pricing) - [FULL] (Launch $185/mo, agent-enrichment reference)
- [Ayush Poddar - relationship memory / "not-yet gate"](https://startupgtm.substack.com/p/the-ai-networking-system-relationship) - [FULL] (public-vs-private consent boundary for a public people log)
- [Next.js Authentication guide](https://nextjs.org/docs/app/guides/authentication) - [FULL]
- [Next.js ISR / use cache](https://nextjs.org/docs/app/guides/incremental-static-regeneration) - [FULL]
- [Next.js 16 middleware->proxy / CVE-2025-29927 analysis](https://iurii.rogulia.fi/blog/nextjs-middleware-to-proxy) - [PARTIAL - single secondary source; the proxy.ts rename claim is NOT verified against installed next@16.2.0 docs and is flagged needs-verification in the doc body, not adopted]
- [PersonalFLOW - knowledge-graph CRM rationale](https://www.personalflow.ai/blog/knowledge-graph-crm) - [FULL] (when graph beats flat tables; informs the "no Neo4j v1" call)
