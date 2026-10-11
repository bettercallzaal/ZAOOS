---
topic: infrastructure
type: comparison
status: research-complete
last-validated: 2026-10-11
superseded-by:
related-docs: "1011, 955, 176, 1180"
original-query: "Can we do some deep research on super based alternatives that are free and open source because one of our biggest challenges right now, one of our costs, is that and we want to be able to have a different database per project, but right now we don't because of cost prohibitations. So let's look into that. I'm willing to pay an amount as long as it's not a crazy amount, uh for the storage. But it would be also really nice to get as much free storage for a project as possible. So let's just like research. Five different alternatives, please."
tier: DEEP
---

# 2660 - Supabase alternatives: a database per project without the per-project bill

> **Goal:** Find the cheapest way to give every ZAO project its own database, comparing five free and open source alternatives to Supabase (hosted free tiers and self-hosting on our VPS), with every price fetched on 2026-10-11.

"Super based" in the voice note is Supabase. Nothing here is decided. The A/B/C at the end goes to Zaal through the Grill.

## Key Decisions

| Decision | Recommendation | Why |
|---|---|---|
| Where do small project databases live? | **A (recommended): USE Neon's Free plan, one Neon project per ZAO project.** | Neon's pricing page, fetched 2026-10-11, reads "100 projects", "1 GB of storage per project", $0. Supabase's reads "Limit of 2 active projects" on Free and "Additional projects from $10/mo" on Pro. Neon is Postgres, so the move is `pg_dump` and `pg_restore`, not a rewrite. |
| Does the ZAO OS app move? | **NO. Keep `efsxtoxvigqowjhgcbiz` on Supabase Pro.** | Measured in this repo: 11 source files subscribe to Supabase Realtime, 334 files call `.from()`, and the SQL carries 224 `create policy` statements. None of the five alternatives carries all of that across for free. |
| Which project moves first? | **The recognition DB (`fkbevtrowvddlstkoejt`).** | It is the smallest known shape: 4 tables, 2 views, 4 RLS policies and 10 seeded sources, all in one SQL file in the vault (`projects/zao-recognition-db-schema-2026-09-25.sql`). Whether its consumers use Realtime or Storage was not measured. |
| What does A cost? | **$0 per month for the Neon side.** The Supabase bill falls toward the $25 Pro base as projects leave the Pro org. | The size of the saving is UNKNOWN until Zaal reads the Supabase billing page: this doc did not measure how many of the 10 project refs sit in the paid org. |
| Self-host on the VPS? | **B, not first.** One Postgres cluster with a database per project plus PostgREST costs $0 and fits the box, but we would own backups and uptime on the machine that runs ZOE. | VPS measured 2026-10-11: 2 vCPU, 7.8 GB RAM (6.2 GB available), 47 GB disk free. Full self-hosted Supabase needs 4 GB RAM minimum per stack and is one project per stack. |
| Turso? | **SKIP for now.** | Its free plan (100 databases) fits the ask on paper, but Turso announced on 2026-10-02 that it "is being acquired by Supabase", and it is SQLite, not Postgres. |

## What we use from Supabase today (measured, not assumed)

Surface read: the ZAOOS repo at `origin/main` commit `904ef0afb`, directories `src` and `bot/src`, non-test `.ts` and `.tsx` files (1,324 files), plus every `.sql` file in the repo (146 files). Command: a grep per pattern, 2026-10-11.

| Supabase feature | Evidence in the ZAO OS app | Used? |
|---|---|---|
| Postgres through the REST client (`supabase-js` `.from()`) | 334 files. Client built in `src/lib/db/supabase.ts` with `createClient(url, key)` | YES, heavily |
| Stored procedures (`.rpc()`) | 4 files, 4 functions: `increment_participant_count`, `decrement_participant_count`, `sum_total_respect`, `assign_next_zid` | YES, lightly |
| Realtime (`.channel()`, `postgres_changes`) | 15 files call `.channel(`, 11 name `postgres_changes`, for example `src/app/spaces/page.tsx:81`. 15 `supabase_realtime` publication references in SQL | YES |
| Storage | 1 file: `src/app/api/upload/route.ts:58` (bucket `uploads`) | YES, one call site |
| Row-level security | 224 `create policy` statements across 69 SQL files, 189 `enable row level security` statements | YES, heavily |
| Supabase Auth | 0 files call `.auth.getUser`, `signIn`, `signUp` or similar. Sessions are iron-session (10 files). No `@supabase/ssr` | NO |
| Auth helper functions inside SQL | 34 references to `auth.uid()`, `auth.jwt()` or `auth.role()` in policies | YES, as SQL helpers |
| Edge Functions | 0 files call `functions.invoke`. No `supabase/functions` directory exists | NO |
| pg_cron | 6 `cron.schedule` calls in SQL | YES, lightly |
| Extensions | `pgcrypto`, `uuid-ossp` | YES |

What this means for any move: the app does not use Supabase Auth or Edge Functions, so losing them costs nothing. It does lean on the REST client shape, RLS, Realtime and the `auth.*` SQL helpers, so an alternative missing those is a migration cost for the main app. Small projects are a different matter and each needs the same count run on its own repo first.

The shape of "a database per project" today is the 10 project refs in `~/zao-vault/notes/supabase-projects.md` (read from the vault's `origin/main`): ZAO OS app, cowork tracker, ZAOstock, gstack telemetry, zpoidh, recognition DB, Sparkz, Wavy, WaveWarZ and one unnamed ref. Seven more repos use Supabase with no ref in tracked files. That note marks six of its ten sections as not re-checked.

## Prior research (checked first)

- [infrastructure/1011-zao-database-architecture](../1011-zao-database-architecture/) (2026-07-10) audited the Supabase estate and ruled that consolidating projects was not urgent, putting the delta at "roughly $30/month". This doc asks the opposite question (more databases, not fewer) and does not overturn 1011's main finding, which is the missing migration CI gate.
- [infrastructure/955-coc-concertz-database-options](../955-coc-concertz-database-options/) (2026-07-03) kept COC Concertz on Firestore and already warned that Supabase's free tier pauses projects after 7 days idle.
- [infrastructure/176-supabase-scaling-optimization](../176-supabase-scaling-optimization/) covers Realtime, pg_cron and indexing on Supabase itself.
- [infrastructure/1180-cloudflare-neon-edge-swarm-architecture](../1180-cloudflare-neon-edge-swarm-architecture/) (2026-07-16, draft) proposed Neon for agent workloads. It predates Neon's current free plan.
- Search run: `zao-research-index "supabase alternative self-host postgres"` and `"neon pocketbase appwrite"`, plus a grep of doc READMEs for the vendor names, 2026-10-11. No earlier doc compares these five for cost. Not searched: the `_archive` folder beyond the one hit it returned.
- Tracker: one open card, `inbox:supabase-paid-reaudit` ("Supabase is PAID and writes work again"), due 2026-10-06.

## Supabase today, the baseline

All from supabase.com/pricing and the compute billing docs, as of 2026-10-11.

- **Free:** 500 MB database size, shared CPU with 500 MB RAM, 5 GB egress, 1 GB file storage. "Free projects are paused after 1 week of inactivity. Limit of 2 active projects."
- **Pro:** "From $25 / month". "First project included. Additional projects from $10/mo." 8 GB disk size per project, 250 GB egress and then $0.09 per GB.
- **Why each project costs money:** "Each project on the Supabase platform includes a dedicated Postgres instance running on its own server." Paid plans include $10 of compute credits "which cover one project running on the Micro/Nano Compute size". Micro is $0.01344 per hour, about $10 a month.
- **Ten small projects on Pro:** $25 + 9 x $10 = **$115 a month** at list price (arithmetic from the two figures above). "Paused projects do not count towards Compute usage", so pausing an idle paid project stops its $10.

This is the "cost prohibition" in the ask: every extra database is a dedicated server at about $10 a month.

## The five alternatives

### 1. Neon (hosted Postgres with a large free plan)

- **What it is:** serverless Postgres with storage and compute separated, so an idle database costs nothing to keep. The pricing page describes it as "Built around Lakebase Postgres, by Databricks".
- **License:** Apache License 2.0 (LICENSE file in `neondatabase/neon`, read 2026-10-11). Maintained by Neon, a Databricks company. Latest GitHub release tag `release-proxy-8853`, published 2025-07-29; last push to the repo 2026-08-31. The open source repo is the engine; nobody in the sources read here runs it themselves, so treat Neon as hosted.
- **Free plan, as of 2026-10-11:** "100 projects", "100 CU-hours" per project per month, "1 GB of storage per project" with "20 GB account total", sizes "Up to 2 CU (8 GB RAM)", scale to zero "After 5 minutes", "5 GB per project" public network transfer, 10 branches per project, "Managed Better Auth" up to 60k monthly users, 5 GB object storage. Neon's own gloss on the compute: "enough to run a 0.25 CU compute in a project for 400 hours/month".
- **First paid step:** Launch, usage-based, "there's no minimum monthly fee". $0.106 per CU-hour, $0.35 per GB-month, 500 GB transfer per project included. Neon's page gives "Typical spend: $15/mo" for intermittent load and 1 GB.
- **Ten small databases:** **$0** on Free (10 of the 100 projects, 10 of the 20 GB). On Launch, one 0.25 CU database left always on is 0.25 x 730 = 182.5 CU-hours, or $19.35 a month (arithmetic from the rate), so ten always-on databases would cost more than Supabase. The saving comes from the free plan and from scale to zero, not from the paid rate.
- **What we lose versus Supabase:** Realtime (neither the pricing page nor the Data API pages read here list a change-feed product; the rest of Neon's docs were not searched). Supabase Studio. The `auth.uid()` family of SQL helpers, which policies would need rewritten (Neon's Data API page names a `pg_session_jwt` extension for this; the mapping was not tested). What stays: Postgres itself, RLS, and a REST layer: "The Neon Data API is fully compatible with PostgREST", with client libraries `@neondatabase/neon-js` and `@neondatabase/postgrest-js`. Whether an unmodified `supabase-js` client can point at it is UNVERIFIED: `supabase-js` appends `rest/v1` to its base URL (`SupabaseClient.ts` line 401).
- **Migration for one small project:**
  1. Count what the project uses (the table above, run on its repo).
  2. Create a Neon project on the same Postgres version.
  3. `pg_dump` from Supabase, `pg_restore` into Neon. This is Neon's own documented path ("Migrate from Supabase").
  4. Replace `auth.*` helper calls in policies, or drop them if the project only uses the service key from a server.
  5. Point the app at Neon: either a direct Postgres connection, or enable the Data API and swap the client import.
  6. Compare row counts table by table, then switch the env var. Keep the Supabase project paused, not deleted, until Zaal says otherwise.
- **The catch:** the free plan's limits stop the database rather than bill you. "On the Free plan, when you run out of CU-hours or public network transfer, your compute is suspended until the next billing period or until you upgrade." Scale to zero is "5 min inactivity; cannot disable" on Free, and a sleeping database "reactivates automatically within a few hundred milliseconds". The Data API "has no permission layer of its own. Every request is authorized entirely by your PostgreSQL GRANT statements and Row-Level Security (RLS) policies". pg_cron jobs on a database that sleeps after 5 minutes are a risk this doc did not test.

### 2. Self-hosted Supabase on the VPS

- **What it is:** the same stack Supabase runs, as Docker Compose: Postgres, PostgREST, Auth, Realtime, Storage, Studio, Kong.
- **License:** Apache License 2.0 (LICENSE file in `supabase/supabase`). Components carry their own: `supabase/realtime` Apache 2.0, `supabase/auth` MIT. Maintained by Supabase Inc. Latest release `v1.26.08`, 2026-08-07; last push 2026-10-11. Supabase "publish stable snapshots of the Docker Compose setup approximately once a month".
- **Free tier:** the software is free. Requirements from the self-hosting docs, as of 2026-10-11: minimum 4 GB RAM, 2 cores, 40 GB SSD; recommended 8 GB+, 4 cores+, 80 GB+.
- **Cost for ten:** one stack is one project. Our VPS (2 vCPU, 7.8 GB RAM total, 47 GB free, measured 2026-10-11) meets the minimum for one stack and not for ten: ten at the 4 GB minimum is 40 GB of RAM. Hostinger's page lists KVM 2 (2 vCPU, 8 GB) at $8.99 a month, "Renews at $14.99/mo", and KVM 8 (8 vCPU, 32 GB) at $25.99, "Renews at $49.99/mo". So ten real stacks cost more than ten Supabase projects. What we pay for the current VPS is not in any file read here.
- **What we lose:** nothing in features; this is the only option that keeps `supabase-js`, Realtime, Storage, RLS and the `auth.*` helpers unchanged. We lose managed backups, managed upgrades and the multi-project dashboard.
- **Migration for one small project:** 1. Run the Compose stack on the VPS with fresh secrets. 2. Put Caddy in front for TLS. 3. `pg_dump` and `pg_restore`. 4. Copy storage objects if any. 5. Change two env vars (URL and keys). 6. Set up a nightly `pg_dump` to somewhere off the box.
- **The catch:** one stack is one project. From GitHub discussion 38048: "Yes you need a new instance per project. This is exactly how the hosted Supabase platform works." Discussion 4907, asking for multiple projects in self-hosted Studio, has 129 upvotes and was created 2022-01-10. In Supabase's own 2025 thread on self-hosting, one user wrote "maintaining and updating the selft hosted version is way too complicated". A community project (Sbarbase) claims to share one cluster across projects; that is its author's claim in the same thread and was not checked.

### 3. Plain Postgres plus PostgREST on the VPS

- **What it is:** one Postgres server on our box with one database per project, and PostgREST, "a standalone web server that turns your PostgreSQL database directly into a RESTful API". PostgREST is the REST layer inside Supabase, so the query shape our code uses already matches.
- **License:** PostgreSQL is under the PostgreSQL License, "a liberal Open Source license, similar to the BSD or MIT licenses" (postgresql.org). PostgREST is MIT (LICENSE file, "Copyright (c) 2014-2026 The PostgREST contributors"). PostgREST latest release `v16.4`, 2026-09-24.
- **Free tier:** all of it, no limit on databases beyond disk. A database per project in one cluster shares one server instead of needing a server each; the per-database overhead was not measured.
- **Cost for ten:** **$0** on the existing VPS. One PostgREST process per database.
- **What we lose:** Realtime (could be added by running `supabase/realtime` beside it, untested here), Storage, Studio, Auth, and every managed safety net. RLS stays, since it is a Postgres feature, and PostgREST switches into a database role from a JWT, the same pattern Supabase's anon and service keys use.
- **Migration for one small project:** 1. Install Postgres and create the database and roles. 2. `pg_restore` the dump. 3. Create the `auth.*` helper functions the policies call, or drop them. 4. Run PostgREST for that database with a JWT secret. 5. Put Caddy in front, mapping `/rest/v1` to PostgREST so `supabase-js` (which hardcodes that path) keeps working. 6. Nightly `pg_dump` off the box, and test one restore.
- **The catch:** it is only the REST layer, and everything around it becomes ours. The Vercel-hosted apps would depend on a single 2-core VPS that also runs ZOE and n8n. The docs list a Schema Cache reference that was not read for this doc. This is the most complete build and the most operations work.

### 4. Turso (hosted SQLite, many small databases)

- **What it is:** a hosted service for many lightweight SQLite-compatible databases, built for the one-database-per-tenant pattern.
- **License:** MIT for both `tursodatabase/turso` (latest release `v0.8.2`, 2026-10-06) and `tursodatabase/libsql` (latest `libsql-server-v0.24.32`, 2025-02-14). Maintained by Turso, now joining Supabase.
- **Free plan, as of 2026-10-11:** 100 databases, 5 GB total storage, 500 million rows read and 10 million rows written per month, 1 day point-in-time restore. The fetched pricing page text contains no mention of pausing or inactivity (a search for those words returned 0 lines against 14 lines mentioning databases).
- **First paid step:** Developer at "$4.99/month" (the page shows this with "Save $1/month", so it is the yearly-billed price): unlimited databases, 9 GB.
- **Ten small databases:** **$0** on Free, or about $5 on Developer.
- **What we lose:** Postgres itself. No RLS, no Realtime, no Auth, no Storage, no `supabase-js`. Every query in a migrated project is rewritten for SQLite.
- **Migration for one small project:** 1. Translate the schema to SQLite types. 2. Export rows as CSV and import. 3. Rewrite every query with the Turso client. 4. Move access rules out of RLS policies into server code. For a project with four tables this is a day of work; for the main app it is a rewrite.
- **The catch:** Turso's own blog, 2026-10-02: "Turso, pioneers of the many database architecture, is being acquired by Supabase." They promise "Turso keeps running" and "Expect deeper integration between Turso and Supabase in the coming months." The Hacker News thread (221 points) has customers on both sides: "UGH as a turso customer, I do not want this" and "I was a little worried that the turso project's future was tied to the success of turso the company". Moving off Supabase to save money by adopting a product Supabase is buying is a bet on pricing nobody has published yet.

### 5. PocketBase (one small binary per project, on the VPS)

- **What it is:** "Open Source backend in 1 file": embedded SQLite, realtime subscriptions, auth, file storage and an admin dashboard in a single Go binary.
- **License:** MIT (LICENSE.md, "Copyright (c) 2022 - present, Gani Georgiev"). One maintainer. Latest release `v0.40.5`, 2026-10-08. 61,352 GitHub stars, 19 open issues on 2026-10-11.
- **Free tier:** self-hosted only. FAQ: "Do you offer hosting? No. PocketBase is self-hosted only."
- **Cost for ten:** **$0** on the existing VPS: ten processes on ten ports behind Caddy. The FAQ cites "10 000+ persistent realtime connections on a cheap $4 Hetzner CAX11 VPS (2vCPU, 4GB RAM)", which is the same size class as our box.
- **What we lose:** Postgres, SQL-level RLS (PocketBase has its own per-collection API rules) and `supabase-js`. What it gives that options 1, 3 and 4 do not: auth, file storage, realtime and an admin UI in the box.
- **Migration for one small project:** 1. Recreate the tables as collections in the admin UI. 2. Import rows through the API. 3. Rewrite queries with the PocketBase SDK. 4. Rewrite access rules as collection rules. 5. Run it under systemd behind a reverse proxy. 6. Turn on its built-in backups to S3-compatible storage.
- **The catch:** it is one person's volunteer project and says so. FAQ: "PocketBase is neither a startup, nor a business. There is no paid team or company behind it... There are no promises for maintenance and support". README: "full backward compatibility is not guaranteed before reaching v1.0.0". On databases: "PocketBase uses embedded SQLite (in WAL mode) and there are no plans for supporting other databases." On scale: "Only on a single server". It suits a brand-new small tool, not a move of existing Postgres data.

## Left out, one line each

- **Appwrite** (BSD 3-clause style LICENSE, release 2.4.0 on 2026-10-08): its default database is its own TablesDB, and a dedicated PostgreSQL database is "From $10/mo per database" on its pricing page, the same per-database price we are trying to escape.
- **Nhost** (MIT): the free Starter plan reads "Limit of 1 project. Project paused after 1 week of inactivity", which is tighter than Supabase's own free plan; Pro is "From $25 / month".
- **Convex:** "$25 per developer/month" above the free tier and a proprietary data model; doc 955 already skipped it for the same reason.
- **Firebase:** not open source and not Postgres, so it fails the ask on its first two words.

## Comparison

Prices as of 2026-10-11, from each vendor's own page. "10 small DBs" is a month.

| Option | Free databases | Free storage each | Price for 10 small DBs | Self-host | Postgres-compatible | Auth included | RLS |
|---|---|---|---|---|---|---|---|
| Supabase today (Pro) | 2 on Free, paused after 1 week idle | 500 MB (Free), 8 GB (Pro) | $115 ($25 + 9 x $10) | yes | yes | yes | yes |
| 1. Neon | 100 | 1 GB (20 GB total) | $0 on Free; usage-based above | no (in practice) | yes | yes (Better Auth) | yes |
| 2. Self-hosted Supabase | 1 per stack | disk on the box | $0 for one stack; ten stacks need about 40 GB RAM | yes | yes | yes | yes |
| 3. Postgres + PostgREST | limited by disk only | disk on the box (47 GB free) | $0 on the current VPS | yes | yes | no | yes |
| 4. Turso | 100 | 5 GB shared across all | $0 on Free; $4.99 Developer | partly (libSQL server) | no (SQLite) | no | no |
| 5. PocketBase | limited by disk only | disk on the box | $0 on the current VPS | yes (only) | no (SQLite) | yes | no (API rules instead) |

## Recommendation: A / B / C

Nothing below is decided. It goes to Zaal through the Grill.

**A (recommended). Neon Free for every small project database; the ZAO OS app stays on Supabase Pro.**
Cheapest path in both dollars and work. Each small project gets its own Neon project (1 GB, sleeps when idle, wakes in a few hundred milliseconds). First trial: the recognition DB, because it is 4 tables in one SQL file. Cost: $0 a month on Neon. The Supabase bill drops by about $10 for each paid project that leaves, down to the $25 base. Reversible: the Supabase project is paused, not deleted, until the trial is judged.

**B. Self-host on the VPS: one Postgres, a database per project, PostgREST in front.**
$0 a month and no vendor limit, and it is the fuller technical build. The price is paid in operations: backups, upgrades, TLS and uptime become ours, on a 2-core box that already runs ZOE and n8n. Worth doing later if Neon's limits bite, and best started with an internal tool rather than anything public.

**C. Stay on Supabase and pay $10 a month for each extra project.**
Zero migration and every feature kept. Ten projects is $115 a month at list price. Right only if the real bill turns out to be small, which is the first thing to check.

**What to check before picking:** how many of the 10 project refs are in the paid org, and what last month's invoice was. That is a fact only Zaal's Supabase billing page holds, and it sets the size of the saving.

## Also See

- [infrastructure/1011-zao-database-architecture](../1011-zao-database-architecture/) - the estate audit and the migration CI gate
- [infrastructure/955-coc-concertz-database-options](../955-coc-concertz-database-options/) - Firestore vs Supabase vs Convex for COC Concertz
- [infrastructure/176-supabase-scaling-optimization](../176-supabase-scaling-optimization/) - Realtime, pg_cron, indexing
- [infrastructure/1180-cloudflare-neon-edge-swarm-architecture](../1180-cloudflare-neon-edge-swarm-architecture/) - earlier Neon proposal for agents
- `~/zao-vault/notes/supabase-projects.md` - the 10 project refs and which repos use each
- Tracker card `inbox:supabase-paid-reaudit` (todo, due 2026-10-06)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Answer the A/B/C above in the Grill; done when the choice is recorded in a vault decision note | Zaal | Decision | 2026-10-14 |
| Read the Supabase billing page and record how many projects are in the Pro org and last month's total; done when both numbers are in `~/zao-vault/notes/supabase-projects.md` | Zaal | His fact | 2026-10-14 |
| If A: trial the recognition DB on Neon (create project, `pg_dump`, `pg_restore`, per-table row-count comparison); done when the comparison is pasted into a PR or vault note | Zaal, through a side lane | Trial | 2026-10-18 |
| Before any second project moves: run this doc's feature count on that project's repo (Realtime, Storage, `auth.*` helpers, pg_cron); done when the table is in the move's PR | Zaal, through the lane doing the move | Check | 2026-10-25 |
| Re-fetch all pricing pages and update `last-validated`; done when this doc's figures are re-stamped | Zaal, through the research lane | Re-validate | 2026-11-10 |

## Sources

Method for every web source: `curl` with a browser user agent, HTML stripped to text with a local script, quotes copied from that text. Fetched 2026-10-11. GitHub and Hacker News through their JSON APIs. No WebFetch summaries were used. Not searched: Reddit and X.

Vendor pages
- [Supabase pricing](https://supabase.com/pricing) - FULL, curl + strip
- [Supabase compute billing docs](https://supabase.com/docs/guides/platform/manage-your-usage/compute) - FULL, curl + strip
- [Supabase self-hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker) - FULL, curl + strip
- [Neon pricing](https://neon.com/pricing) - FULL, curl + strip
- [Neon plans docs](https://neon.com/docs/introduction/plans) - FULL, curl + strip
- [Neon Data API get started](https://neon.com/docs/data-api/get-started) - FULL, curl + strip
- [Neon Data API overview](https://neon.com/docs/data-api/overview) - PARTIAL, only the PostgREST compatibility section was read
- [Neon: migrate from Supabase](https://neon.com/docs/import/migrate-from-supabase) - PARTIAL, the introduction and prerequisites were read, not every step
- [Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero) - PARTIAL, the timing statements were read
- [Turso pricing](https://turso.tech/pricing) - FULL, curl + strip. The monthly-billed Developer price was not visible in the fetched text
- [Turso is joining Supabase](https://turso.tech/blog/turso-is-joining-supabase) - FULL, curl + strip
- [PocketBase home](https://pocketbase.io/) - FULL, curl + strip
- [PocketBase FAQ](https://pocketbase.io/faq/) - FULL, curl + strip
- [PocketBase going to production](https://pocketbase.io/docs/going-to-production/) - PARTIAL, backup and proxy sections
- [PostgREST documentation](https://docs.postgrest.org/en/stable/) - PARTIAL, landing page and authentication reference
- [PostgreSQL licence](https://www.postgresql.org/about/licence/) - FULL, curl + strip
- [Hostinger VPS hosting](https://www.hostinger.com/vps-hosting) - FULL, curl + strip (plan table)
- [Appwrite pricing](https://appwrite.io/pricing) - PARTIAL, the plan comparison is loaded by script and was not in the fetched text; only the database pricing block was read
- [Nhost pricing](https://nhost.io/pricing) - FULL, curl + strip
- [Convex pricing](https://www.convex.dev/pricing) - PARTIAL, only the headline plan prices were read

Licenses and releases (GitHub API, LICENSE file contents read, not the license field)
- [supabase/supabase](https://github.com/supabase/supabase) Apache 2.0 - [neondatabase/neon](https://github.com/neondatabase/neon) Apache 2.0 - [PostgREST/postgrest](https://github.com/PostgREST/postgrest) MIT - [tursodatabase/turso](https://github.com/tursodatabase/turso) MIT - [tursodatabase/libsql](https://github.com/tursodatabase/libsql) MIT - [pocketbase/pocketbase](https://github.com/pocketbase/pocketbase) MIT - [appwrite/appwrite](https://github.com/appwrite/appwrite) BSD 3-clause style text - [nhost/nhost](https://github.com/nhost/nhost) MIT - [supabase/realtime](https://github.com/supabase/realtime) Apache 2.0 - [supabase/auth](https://github.com/supabase/auth) MIT. All FULL for the first lines of the LICENSE file and the latest release tag.
- [supabase-js SupabaseClient.ts](https://github.com/supabase/supabase-js/blob/master/packages/core/supabase-js/src/SupabaseClient.ts) - PARTIAL, the URL-building lines were read

Community
- [Supabase discussion 4907: multiple projects for self-hosted](https://github.com/orgs/supabase/discussions/4907) - PARTIAL, body and the five most upvoted of the first 40 comments, GitHub GraphQL API
- [Supabase discussion 39820: Self-hosting, what's working and what's not](https://github.com/orgs/supabase/discussions/39820) - PARTIAL, same method
- [Supabase discussion 38048: multiple projects on a single self-hosted instance](https://github.com/orgs/supabase/discussions/38048) - FULL, GitHub GraphQL API
- [Hacker News: Supabase is acquiring Turso](https://news.ycombinator.com/item?id=49934784) - PARTIAL, the first 7 of 31 top-level comments, Algolia HN API
- [Hacker News: Pocketbase lost its funding from FLOSS fund](https://news.ycombinator.com/item?id=47062561) - PARTIAL, first 5 top-level comments; read for context, not quoted
- [Hacker News: Pocketbase, open-source realtime back end in 1 file](https://news.ycombinator.com/item?id=46075320) - PARTIAL, first 5 top-level comments; read for context, not quoted

Measured locally
- ZAOOS repo feature counts: grep over `src`, `bot/src` and all `.sql` files, 2026-10-11
- VPS specs: `nproc`, `free -h`, `df -h /`, `docker ps` over SSH, 2026-10-11 14:10 UTC
- `~/zao-vault/notes/supabase-projects.md` at the vault's `origin/main`
