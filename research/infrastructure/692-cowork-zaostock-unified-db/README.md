---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-05-20
superseded-by:
related-docs: 610, 650, 662, 679, 684
tier: DISPATCH
---

# 692 — Unifying ZAOstock + ZAOcoworking onto One Operational Database

> **Goal:** Decide the right way to make ZAOcoworking the single store for all of ZAOstock's operational data (tasks, milestones, sponsors, artists, volunteers, circles), with @ZAOstockTeamBot kept as the ZAOstock front door. Based on a two-agent deep audit of both systems.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | The unified store = the **existing live Supabase** (today shared by ZAO OS + the ZAOstock dashboard + @ZAOstockTeamBot). Do NOT stand up a new database inside cowork-zaodevz. | ZAOcoworking has **no live database**. It is an 18-row `data/actions.json` file in a GitHub repo, plus a `supabase/schema.sql` that was written but **never executed**. ZAOstock already runs a live, relational, 12-table operational Supabase. Migrate 18 rows in; do not rebuild 12 tables out. |
| 2 | Add a `project` column to `todos` and `timeline`. One database, every row tagged by brand (`zaostock`, `zaodevz`, `wavewarz`, ...). | A discriminator column is how two task streams share one schema. ZAOcoworking's `category` field already spans brands - it maps straight onto `project`. |
| 3 | Rewrite @ZAOcoworkingBot's storage layer (`agent/src/actions-store.ts`) from the GitHub Contents API to Supabase. The command surface (`/add /wip /done` ...) is unchanged. | This is the real engineering work. It also ends the `actions.json` SHA-dance and the whole json-suggest concurrency bug class - it IS Phase 2 of ZAOcoworking's own `BACKLOG.md`. |
| 4 | @ZAOstockTeamBot stays the ZAOstock front door, essentially unchanged - it already writes this Supabase. Just default its writes to `project='zaostock'`. | Per the locked decision. Zero migration risk on the ZAOstock side; the mature system does not move. |
| 5 | Retire `data/actions.json` and the unexecuted `cowork-zaodevz/supabase/schema.sql`. Salvage two ideas from that schema later: `task_comments` and `notifications`. | One source of truth. The cowork schema.sql is task-only - it has no sponsors/artists/circles/volunteers, so it is the wrong base to build on. |
| 6 | The ZAOcoworking web app re-points `src/lib/data.ts` from the GitHub Contents API to Supabase. Same kanban UI, new backend. | The kanban becomes a view over the shared `todos` table, filtered by `project`. |

**Naming note:** "stored on coworking" is satisfied by *ownership and access*, not by which Supabase project the bytes sit in. The recommendation makes the existing Supabase the canonical ZAO operational database; the ZAOcoworking bot and web app become first-class clients of it. If a ZAOcoworking-owned Supabase project is a hard requirement (for org/ownership reasons), see "Alternative" below - it costs weeks and buys nothing functional.

## The core finding - an asymmetry the request did not assume

The request says "have all ZAOstock todos be *from* the ZAOcoworking database." The audit found the ZAOcoworking database does not exist yet:

| | ZAOstock | ZAOcoworking |
|---|----------|--------------|
| Task store | Live Supabase Postgres | `data/actions.json` - one flat JSON file in a GitHub repo |
| Item count | ~30-100 todos + 40-80 milestones (query limits imply) | 18 items |
| Schema | 12 relational tables, FK ownership | 1 JSON array; a `supabase/schema.sql` exists but was **never run** |
| Tables | `todos`, `timeline`, `circles`, `circle_members`, `team_members`, `sponsors`, `artists`, `volunteers`, `meeting_notes`, `contact_log`, `suggestions`, `activity_log`, + `budget_entries`/`goals` | none |
| Writes | @ZAOstockTeamBot + web dashboard, transactional | @ZAOcoworkingBot + web, GitHub Contents API + a 3-try SHA-dance |
| Owner model | `team_members` UUID foreign key (~14 members) | hardcoded 6-value enum: `Zaal/Iman/Both/ThyRev/Samantha/Open` |
| Maturity | live, relational, in daily use | a JSON file; concurrent edits collide on commit SHA |

Conclusion: the merge direction is **ZAOcoworking-into-the-live-DB**, then the live DB is owned and branded as the ZAOcoworking operational database. Rebuilding ZAOstock's mature 12-table schema inside a fresh empty Supabase would be weeks of high-risk work to arrive somewhere strictly worse than today.

## Target architecture

```
                  ONE Supabase Postgres  (the ZAO operational DB)
                  todos / timeline  (+ project column)
                  sponsors / artists / volunteers / circles / circle_members
                  team_members / contact_log / meeting_notes / activity_log
                          ^                              ^
                          |                              |
        @ZAOstockTeamBot  |                              |  @ZAOcoworkingBot
        (unchanged - adds  |                              |  (actions-store.ts
         project=zaostock) |                              |   rewritten: JSON -> Supabase)
                          |                              |
        ZAOstock web      |                              |  ZAOcoworking web (kanban)
        dashboard /team   +                              +  data.ts re-pointed to Supabase
```

Two bots, two web apps, one database. A `project` column keeps ZAOstock rows and ZAO Devz rows in the same `todos` table without two schemas. Concurrent writes from both bots are handled by Postgres row-level transactions - strictly safer than the `actions.json` SHA-dance.

## Schema changes (on the existing Supabase)

All additive and backward-compatible, so @ZAOstockTeamBot keeps working untouched through every phase:

```sql
-- 1. brand discriminator
ALTER TABLE todos    ADD COLUMN project text NOT NULL DEFAULT 'zaostock';
ALTER TABLE timeline ADD COLUMN project text NOT NULL DEFAULT 'zaostock';

-- 2. absorb ZAOcoworking's ActionItem fields into todos
ALTER TABLE todos ADD COLUMN priority     text;          -- P1|P2|P3
ALTER TABLE todos ADD COLUMN phase        text;          -- Define|Measure|Analyze|Improve|Control
ALTER TABLE todos ADD COLUMN category     text;          -- functional tag (Site/Tech, Ops, ...)
ALTER TABLE todos ADD COLUMN due          date;
ALTER TABLE todos ADD COLUMN important    boolean DEFAULT false;
ALTER TABLE todos ADD COLUMN urgent       boolean DEFAULT false;
ALTER TABLE todos ADD COLUMN completed_at timestamptz;
ALTER TABLE todos ADD COLUMN completed_by uuid REFERENCES team_members(id);
ALTER TABLE todos ADD COLUMN circle_id    uuid REFERENCES circles(id);   -- from doc 684
ALTER TABLE todos ADD COLUMN legacy_id    text;          -- old actions.json id, for audit

-- 3. reconcile status: ZAOstock todos = todo|in_progress|done; ZAOcoworking adds BLOCKED
--    add 'blocked' to the todos status set (or a CHECK constraint update)
```

Field/value mapping for the 18 incoming ZAOcoworking items:

| ZAOcoworking ActionItem | -> ZAOstock `todos` |
|---|---|
| `status` TODO/WIP/BLOCKED/DONE | `status` todo / in_progress / blocked / done |
| `owner` enum | `owner_id` -> `team_members` row (create the 4 cowork people if missing). `Both` -> `owner_id` null + `category` note. `Open` -> `owner_id` null |
| `category` ("ZAO Devz", "WaveWarZ Zambia", ...) | split: brand part -> `project`, function part -> `category` |
| `priority`, `phase`, `important`, `urgent`, `due` | same-named new columns |
| `comments[]`, `activity[]` | rows in the existing `activity_log` table |
| `id` ("1", "2", ...) | `legacy_id` (new uuid `id` assigned) |

## The two bots after the merge

- **@ZAOstockTeamBot** - unchanged. Already on this Supabase. Its `add_todo` etc. simply set `project='zaostock'`. The ZAOstock side does not move - lowest-risk half of the migration.
- **@ZAOcoworkingBot** - `agent/src/actions-store.ts` is rewritten: drop the Octokit + SHA-dance, use a Supabase client against `todos`. Every command handler (`/add /wip /blocked /done /assign /setdue /setnote /setprio`) keeps its signature - they call the new store. Its views filter `project IN (...)` for the brands it tracks. The roster, the v2.16 batch fix, and the v2.17 group-confirmation fix all stay.
- Both write the same `todos` table. That is the win: today the json-suggest/SHA-dance bugs exist *because* `actions.json` is a file; Postgres makes concurrent multi-bot writes a non-issue.

## Migration plan - 6 phases, reversible until Phase 5

| Phase | Work | Reversible? |
|-------|------|-------------|
| 0 | Run the additive schema changes on the live Supabase. @ZAOstockTeamBot unaffected (new columns are nullable/defaulted). | yes - columns can be dropped |
| 1 | Backfill `project='zaostock'` on existing `todos`/`timeline` rows. | yes |
| 2 | Migration script: read `actions.json`'s 18 items, insert into `todos` (project per category), create the 4 ZAOcoworking people as `team_members`, move `comments[]`/`activity[]` into `activity_log`. | yes - delete the 18 rows |
| 3 | Rewrite @ZAOcoworkingBot `actions-store.ts` -> Supabase. Cut the bot over. Freeze `actions.json` read-only as rollback. | yes - revert the bot, unfreeze JSON |
| 4 | Re-point the ZAOcoworking web app `src/lib/data.ts` -> Supabase. | yes |
| 5 | Retire `actions.json` + the unused `supabase/schema.sql`. Update `BACKLOG.md`/`README.md`. | point of no return |

## Risks and what to confirm first

- **No RLS on the Supabase.** Today it is service-role-only (full access). Adding ZAOcoworking's bot + web as more service-role clients widens the blast radius. Minimum: scope each key; medium-term: add row-level security per `project`. State this explicitly before cutover.
- **`GITHUB_REPO` discrepancy.** The ZAOcoworking web app defaults to `bettercallzaal/imanprojects`; the bot defaults to `songchaindao-dot/cowork-zaodevz`. Confirm which `actions.json` is the real one **before** the Phase 2 migration, or you migrate the wrong 18 rows.
- **`Both` owner** has no ZAOstock equivalent (ZAOstock uses a single `owner_id`). Pick a convention - `owner_id` null + a `category`/note tag - and apply it consistently.
- **Two web apps, two auth systems** (ZAOcoworking's 2-password HMAC vs the ZAOstock dashboard's). They stay separate apps sharing one DB - fine, but do not try to merge the auth in this project.
- **`category` is half brand, half function** in ZAOcoworking ("ZAO Devz" is a brand, "Site / Tech" is a function). The migration must split these into `project` + `category`, not dump both into one field.

## Alternative (considered, not recommended)

Stand up a brand-new ZAOcoworking-owned Supabase project and rebuild ZAOstock's 12-table schema inside it, then migrate ZAOstock's live data across. Cost: weeks of schema rebuild + a high-risk migration of a system in daily use, RLS re-work, and re-pointing @ZAOstockTeamBot (which the locked decision says stays put). Benefit: the Supabase project is owned under the ZAOcoworking org. That is an ownership/branding outcome, not a functional one - achieve the same by designating the existing Supabase as the canonical ZAO operational DB.

## Supersedes

Doc 684, Key Decision #2 ("DO NOT merge ZAOstock todos into cowork-zaodevz"). Doc 684 was correct that ZAOcoworking's *flat JSON* cannot hold ZAOstock's relational model. This doc's answer is the same reasoning, new conclusion: do not merge into the JSON - move ZAOcoworking onto Postgres, then merge. The user has decided to make that investment.

## Also See

- [Doc 610](../610-zaostock-database-consolidation-may4-5/) - prior ZAOstock database consolidation
- [Doc 684](../../events/684-zaostock-task-tracking-circles-connection/) - ZAOstock task tracking, the `circle_id` recommendation
- [Doc 679](../../agents/679-coworking-agent-mentions-code-pipeline/) - ZAOcoworking bot audit, the uncommitted `agent/` finding
- [Doc 650](../../agents/650-cowork-zaodevz-imanagent/) / [662](../662-zaocoworking-v2-v3-architecture/) - ZAOcoworking architecture, the Supabase Phase 2 plan

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm the canonical `actions.json` repo (`imanprojects` vs `cowork-zaodevz`) | @Zaal / @Iman | Decision | Before Phase 2 |
| Phase 0: additive schema migration on the Supabase (project + cowork fields + blocked status) | @Zaal | Migration | Week 1 |
| Phase 1: backfill `project='zaostock'` | @Zaal | Script | Week 1 |
| Phase 2: write + run the actions.json -> todos migration script | @Zaal | Script | Week 2 |
| Phase 3: rewrite @ZAOcoworkingBot `actions-store.ts` to Supabase; cut over | @Iman | PR | Week 2-3 |
| Phase 4: re-point the ZAOcoworking web app `data.ts` to Supabase | @Iman | PR | Week 3 |
| Decide RLS posture before cutover (scoped keys minimum) | @Zaal | Decision | Before Phase 3 |
| Phase 5: retire `actions.json` + the unused `schema.sql` | @Iman | Cleanup | Week 4 |

## Sources

- Deep audit of ZAOstock: `ZAO OS V1/bot/src/` (actions.ts, status.ts, circles.ts, capture.ts, activity.ts, auth.ts), `zaostock/src/app/team/` + `zaostock/src/app/api/team/`, schema in `zao-os-ao-research/scripts/stock-team-*.sql`. Conducted 2026-05-20.
- Deep audit of ZAOcoworking: `cowork/` web app (`src/lib/data.ts`, `src/components/Board.tsx`, `supabase/schema.sql`), `cowork/agent/src/` (actions-store.ts, types.ts, roster.ts), `data/actions.json` (18 items). Conducted 2026-05-20.
- Doc 610 (prior consolidation), Doc 684 (task tracking), Doc 662/679 (ZAOcoworking architecture + the Supabase Phase 2 plan in `BACKLOG.md`).
