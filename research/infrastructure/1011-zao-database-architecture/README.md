---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs: "610, 692, 766, 955, 1007"
original-query: "can we just improve our whole database solution for all of the projects across the zao"
tier: DISPATCH
---

# 1011 — ZAO Ecosystem Database Architecture: Cross-Project Audit + Consolidation Decision

> **Goal:** Triggered by today's ZAOcowork `team_members.primary_team does not exist` bug. Map every known ZAO Supabase project, find the actual root cause behind this class of bug (it has now happened at least three times), and give a real recommendation - not just "should we consolidate."

## Key Decisions

| Recommendation | Why |
|---|---|
| **Ship a CI gate that blocks merge on unapplied/undetected migrations - do this FIRST, before anything about consolidation** | This is the actual fix for the proven, repeated bug class (see Findings 2-3). Consolidating projects does NOT fix this - a single consolidated project with no CI gate would suffer the identical bug. Supabase's own tooling for this (`supabase migration list`, `db push --dry-run`, GitHub required-status-checks) exists today and is unused in every ZAO repo checked this session |
| **DO NOT treat consolidating the 4+ Supabase projects into one as urgent** | The cost delta is small - roughly $30/month at Pro-tier pricing, likely $0 today if usage sits inside free-tier limits (unconfirmed, see Finding 7) - and consolidation is an operational-simplification project, not a bug fix. Pursue it later, as a deliberate choice, not as a reaction to this week's incident |
| **Run Supabase's free built-in Database Advisor (Security Advisor rule 0013, RLS-disabled-in-public) against every known ZAO project this week** | A real RLS gap already happened once in ZAOcowork - `team_members.password_hash` was exposed to the public anon key until migration 013 fixed it. Nobody has checked whether the same gap exists in ZAOstock, the ZAOOS cowork tracker, or the legacy bot project. This is a 10-minute-per-project check with a free built-in tool |
| **Confirm the pricing tier and backup/PITR status of every known project** | Free tier has zero automated backups. Nobody checked this session which of the 4+ known projects (`efsxtoxvigqowjhgcbiz`, `etwvzrmlxeobinrlytza`, `yjrlaxpjusmrfylumban`, ZAOcowork's own) are actually on Free vs. Pro, so nobody knows which ones have zero backup coverage right now |
| **Fix the citation gap in migration 013 itself** | The migration's own header attributes the RLS discovery to "Audit doc-766 / the role_table_grants check," but doc 766 as it exists in the research library explicitly claims the opposite ("Security/RLS/payment/signing surfaces all ship with full implementation - no TODOs in critical paths") and never mentions RLS or password hashes anywhere in its text. Either the citation is wrong, or the real audit that caught this was never written up as a doc - either way, the trail is currently broken |

## Findings

### 1. There are at least 4 separate ZAO Supabase projects, likely more

Confirmed project refs found directly in local env files and prior research (not guessed):

| Project ref | App | Source |
|---|---|---|
| `efsxtoxvigqowjhgcbiz` | ZAOOS legacy bot (`agent_events` for zoe.zaoos.com) | `~/.zao/zao.env`-adjacent config, corroborated by doc 610 |
| `etwvzrmlxeobinrlytza` | ZAOOS cowork tracker (`tasks` table) | `~/.zao/zao.env`, confirmed live via `mcp__supabase-cowork__get_project_url` this session |
| `yjrlaxpjusmrfylumban` | ZAOstock (canonical since 2026-05-04 per doc 609/610) | Doc 610 |
| (ref not captured locally) | ZAOcowork's own project (`team_members`, `tasks`, `sponsors`, etc.) | `ZAOcowork/.env.example` confirms a distinct `SUPABASE_URL` var, not one of the three above - this repo was cloned fresh this session and had never been checked out locally before |

FISHBOWLZ is documented elsewhere in the skill's own project table as Supabase-backed but its project ref was not checked this session. **COC Concertz also has a live-but-dormant Supabase project** (`src/lib/supabase.ts` + `/api/archive/*` routes, per doc 955, 2026-07-03) wired for an archive feature that hasn't activated yet - a 5th project. **This list is a floor, not a ceiling** - no session has ever inventoried every ZAO Supabase project in one place before this doc. [FULL - direct env file reads + live MCP call + doc 955 cross-reference, not inferred]

### 2. The team-routing bug (today) is a structural pattern, not a one-off mistake

Direct read of `ZAOcowork/supabase/migrations/013_enable_rls.sql`'s own header comment states outright: *"Apply in the Supabase SQL editor (the read-only MCP can't run DDL)."* This is the actual root cause of today's incident, stated by the codebase itself: schema changes across the ZAO ecosystem are written as `.sql` files and depend on a **human manually pasting them into a web UI**, with **zero automated check** that this ever happened before the corresponding application code merges and deploys.

Cross-repo confirmation: `gh search code "Supabase SQL editor" --owner=bettercallzaal` returns **16 distinct instances** of "run this in the Supabase SQL editor" instructions across the ZAOOS repo alone - bot setup, hermes migrations, unlock-events, stock-team roster edits, the respect-database build plan, and more. This is the ecosystem's standard operating procedure for schema changes, applied with no exceptions found. [FULL - direct file read + `gh search code` executed this session, 16 hits enumerated]

### 3. This exact failure class has now happened at least twice more, independently

- **ZAOcowork RLS gap (date unclear, fixed by migration 013):** the migration's own comment states RLS was never enabled on ZAOcowork's tables, meaning the public anon key "could read/write everything - including `team_members.password_hash`." This is a real credential-exposure incident, not hypothetical.
- **ZAOstock two-project schema drift (doc 610, audited 2026-05-04):** the website and the bot wrote to two different Supabase projects that silently diverged - `todos` table row counts matched (21/21) but **statuses diverged** (9 done/7 todo/5 in-progress on one side vs. 2 done/18 todo/1 in-progress on the other), a `circles` slug mismatch (`merch` on one side, `livestream` on the other, never reconciled), and **5 phantom tables** (`stock_proposals`, `stock_proposal_objections`, `stock_qa_log`, `stock_respect_events`, `stock_buddy_pairings`) that existed only in application code, never in either database - meaning `/propose`, `/object`, `/consent`, `/buddy`, and `/respect` bot commands crashed on every use until someone noticed.
- **ZAOcowork team-routing bug (this session, 2026-07-09):** PR #124's own body said explicitly "DO THIS FIRST... NOT auto-merged. Held on purpose" - and it was merged 4 hours later anyway, without the SQL ever being run.

Three independent incidents, three different root symptoms (credential exposure, silent data divergence, hard crash), one shared root cause: no automated gate confirms a migration file was actually applied before the code that depends on it ships. [FULL - all three corroborated by direct file/doc reads this session]

### 4. This session's own Supabase MCP access is scoped to exactly one project

`mcp__supabase-cowork__get_project_url` returned `etwvzrmlxeobinrlytza` (the ZAOOS cowork tracker) - not ZAOstock, not ZAOcowork, not the legacy bot project. This is a direct, first-hand demonstration of the ecosystem-wide problem: even an AI session actively trying to verify or fix a schema issue structurally cannot reach most of the ZAO's own databases without a project-specific MCP reconfiguration that doesn't currently exist for 3 of the 4+ known projects. [FULL - directly observed this session]

### 5. The migration-013 citation doesn't trace to anything

Migration 013's header attributes the RLS discovery to "Audit doc-766 / the role_table_grants check." Direct read of `research/dev-workflows/766-midway-work-audit-2026-05-27/README.md` (a 2026-05-27 DISPATCH-tier audit) shows it explicitly claims **the opposite**: *"Security/RLS/payment/signing surfaces all ship with full implementation - no TODOs in critical paths."* A full-text grep of that doc for "RLS," "role_table_grants," "anon key," and "password_hash" returns zero matches outside that one summary line. Either the citation in migration 013 points to the wrong doc number, or whatever audit actually caught the RLS gap was never itself written up as a research doc. This is a small thing on its own, but it's exactly the kind of broken paper trail that makes it hard to know, six weeks later, whether a given class of bug has actually been checked for across the rest of the ecosystem. [FULL - doc read + grep executed this session, zero matches confirmed]

### 5.5. A prior, well-reasoned unification decision did not stick - direct evidence for Key Decision #1

Doc 692 (2026-05-20, DISPATCH tier) already did the exact analysis this doc might otherwise have proposed: it audited ZAOstock's live 12-table Supabase (`yjrlaxpjusmrfylumban`) against ZAOcoworking's non-existent database (a flat `data/actions.json` file plus an unexecuted `schema.sql`), and made an explicit, well-argued call - make ZAOstock's Supabase the one canonical "ZAO operational database," migrate ZAOcoworking's 18 rows into it, retire the JSON file.

**That did not happen as decided.** The cowork tracker this session actually writes to (`~/bin/zao-tracker`, used dozens of times this session, confirmed live via `mcp__supabase-cowork__get_project_url`) runs on project ref **`etwvzrmlxeobinrlytza`** - a third, distinct project that matches neither `yjrlaxpjusmrfylumban` (ZAOstock, the doc 692 target) nor `efsxtoxvigqowjhgcbiz` (the old ZAO OS bot project). Project refs are immutable once created - this is not the same project renamed, it is a fourth database that came into existence sometime after a documented decision to consolidate down to fewer databases.

This is direct, first-hand evidence for Key Decision #1's core claim: **a topology decision alone does not stay fixed.** Six weeks after an explicit, reasoned unification call, the ecosystem has more Supabase projects, not fewer. Whatever process gap let that drift happen unnoticed is the same gap (Finding 2) that lets migration files go unapplied - nothing enforces that a documented architecture decision is actually the thing running in production, six weeks later. [FULL - doc 692 read directly this session, live project ref confirmed via MCP call this session, cross-checked against doc 610's two project refs]

### 6. Industry context: this is not a ZAO-specific mistake, it's the default failure mode

External research (see Sources) found this is a widely-documented pattern across Supabase/AI-codegen projects broadly, not something unique to ZAO's setup:

- **CVE-2025-48757:** 10.3% of Lovable-generated apps audited (170 of 1,645) had exposed Supabase tables from missing/disabled RLS - 303 vulnerable endpoints total.
- **A 2026 audit of 107 YC-backed startups** found 71 had publicly accessible databases exposing 20.1 million rows to anonymous access; 28% leaked PII, and 6 companies leaked auth tokens outright.

This matters for scoping the fix: generic "be more careful" advice will not close this gap, because the same failure keeps happening across thousands of unrelated teams using the same tooling. The fix has to be structural (a CI gate that runs automatically), not a discipline problem to be solved by asking people to remember. [FULL - external research via subagent, both figures traced to named sources below]

### 7. Supabase's own tooling for exactly this problem exists and is unused everywhere in ZAO

- `supabase migration list` - directly compares local migration files against what's actually been applied to the remote database, flagging drift.
- `supabase db push --dry-run` - previews which migrations would run, without executing them; the natural CI check.
- GitHub integration with **required status checks** - Supabase's own documented pattern to block a PR from merging if its migrations don't apply cleanly.
- Supabase's explicit stated rule: *"Never change the remote database directly"* (i.e., never hand-edit via the dashboard SQL editor) - which is the literal opposite of the "paste into the Supabase SQL editor" instruction found 16+ times across the ZAOOS repo (Finding 2).

None of this - not `migration list`, not a dry-run CI step, not a required GitHub status check - was found wired up in any ZAO repo checked this session (ZAOcowork, ZAOstock, or ZAOOS). [FULL - Supabase's own docs, cited below; absence confirmed by direct repo inspection this session]

### 8. Consolidation cost/benefit is real but small, and doesn't fix Finding 2 by itself

External research put current Supabase pricing at: Free tier allows 2 projects at $0; Pro tier is $25/month base with roughly $10/month per additional project's compute. Four separate projects at Pro-tier pricing would run in the ballpark of $55/month vs. roughly $25/month consolidated into one project with schema isolation - a difference of about $30/month, or $360/year. **Nobody confirmed this session which tier any of the 4+ known ZAO projects actually run on** - if they're all still within Free-tier limits, the current real-world cost delta from consolidating could be zero.

Doc 955 (COC Concertz, 2026-07-03) already flagged a concrete risk relevant here: **Supabase free-tier projects auto-pause after 7 days of inactivity.** Any of the low-traffic ZAO projects (the legacy bot project is the obvious candidate) sitting on Free tier could already be silently paused between usage bursts - this compounds Finding 7's unconfirmed-tier problem into an actual availability risk, not just a cost question.

Critically: consolidating to one project with per-app Postgres schemas does not, by itself, close the gap in Finding 2. A single project with no CI gate would still let a migration file sit uncommitted-to-the-database indefinitely - the exact same failure, just with a smaller blast radius. Consolidation is worth doing eventually for the operational simplicity (one dashboard, one backup policy, one credential set to rotate instead of four), but it is a secondary project, not a substitute for Key Decision #1. [PARTIAL - pricing figures from subagent research, not independently re-verified against supabase.com/pricing this session; tier-per-project status genuinely unconfirmed, flagged as a Next Action]

## Also See

- [Doc 610 — ZAOstock Database Consolidation](../../events/../infrastructure/610-zaostock-database-consolidation-may4-5/) — the prior, single-project version of this exact problem; Finding 3 above draws directly on its row-count/status-drift table
- [Doc 766 — Midway-work audit](../../dev-workflows/766-midway-work-audit-2026-05-27/) — the doc migration 013 cites for the RLS discovery; per Finding 5, the citation does not actually check out
- [Doc 1007 — ZAOstock T-86 Days Readiness Audit](../../events/1007-zaostock-t86-readiness-audit/) — this session's other audit, which separately found this session's Supabase MCP access was scoped to the wrong project (same root issue as Finding 4 here)
- [Doc 955 — COC Concertz Database Options](../955-coc-concertz-database-options/) — the prior, single-app version of the consolidation question; source of the free-tier 7-day auto-pause risk in Finding 8, and the 5th Supabase project (COC's dormant archive feature) in Finding 1
- [Doc 692 — Unifying ZAOstock + ZAOcoworking onto One Operational Database](../692-cowork-zaostock-unified-db/) — the prior unification decision that, per Finding 5.5, apparently did not survive - the strongest single piece of evidence in this doc for why Key Decision #1 (enforcement, not topology) is the right first move

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a GitHub required-status-check + CI step running `supabase db push --dry-run` (or `migration list`) to ZAOcowork first, since it's the site of today's incident - shipped when a test PR with a missing migration is blocked from merging | Zaal | PR | 2026-07-16 |
| Roll the same CI gate out to ZAOstock and the ZAOOS repo - shipped when each repo's next PR runs the check and passes | Zaal | PR | 2026-07-23 |
| Run Supabase's free Database Advisor (Security Advisor rule 0013) against all 4+ known projects - shipped when each project's report is checked and any RLS-disabled table holding real data is fixed | Zaal | Task | 2026-07-14 |
| Confirm the pricing tier (Free/Pro/Team) and backup/PITR status of every known ZAO Supabase project - shipped when a one-line status per project is recorded in a memory file | Zaal | Task | 2026-07-14 |
| Fix or resolve the migration-013 citation gap (Finding 5) - shipped when the citation in the migration comment is corrected, or the actual audit that found the RLS gap is written up properly | Zaal | Todo | 2026-07-18 |
| Decide go/no-go on schema-based consolidation as a separate, non-urgent ops project - shipped when Zaal makes an explicit call, independent of the CI-gate work above | Zaal | Task | 2026-07-25 |
| Reconcile what `etwvzrmlxeobinrlytza` (the live cowork-tracker project) actually is and how it relates to doc 692's decision - shipped when a memory file or doc addendum explains whether doc 692 was implemented differently than written, abandoned, or superseded | Zaal | Todo | 2026-07-16 |

## Sources

- `ZAOcowork/supabase/migrations/013_enable_rls.sql` — [FULL, read directly this session via fresh clone]
- `ZAOcowork/supabase/migrations/014_team_routing_columns.sql` and its PR #124/#145 history — [FULL, read + `gh api` this session]
- `gh search code "Supabase SQL editor" --owner=bettercallzaal` — [FULL, 16 results enumerated this session]
- [Doc 610 — ZAOstock Database Consolidation](../../infrastructure/610-zaostock-database-consolidation-may4-5/) — [FULL, internal, read this session]
- [Doc 766 — Midway-work audit](../../dev-workflows/766-midway-work-audit-2026-05-27/) — [FULL, internal, read + grepped this session]
- `mcp__supabase-cowork__get_project_url` call — [FULL, directly observed this session]
- [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — [FULL, per subagent research]
- [Supabase Database Advisor / lint rule 0013](https://supabase.com/docs/guides/database/database-advisors?lint=0013_rls_disabled_in_public) — [FULL, per subagent research]
- [CVE-2025-48757 Lovable RLS exposure writeup](https://vibeappscanner.com/supabase-row-level-security) — [PARTIAL - subagent-sourced, not independently re-fetched this session]
- [YC startup Supabase audit, ModernPentest](https://modernpentest.com/blog/yc-supabase-vulnerability-research) — [PARTIAL - subagent-sourced, not independently re-fetched this session]
- [Supabase database migrations docs](https://supabase.com/docs/guides/deployment/database-migrations) — [FULL, per subagent research]
- [Supabase GitHub integration / required status checks](https://supabase.com/docs/guides/deployment/branching/github-integration) — [FULL, per subagent research]
- [Supabase pricing](https://supabase.com/pricing) — [PARTIAL - subagent-sourced figures used in Finding 8, not independently re-verified this session]
- [Supabase Branching 2.0](https://supabase.com/blog/branching-2-0) — [PARTIAL - subagent-sourced]
- Two STANDARD-tier subagent research passes (Supabase cost/consolidation tradeoffs; RLS + backup baseline practices), run in parallel this session — [FULL, both returned complete written reports with cited sources, folded into Findings 6-8 above]
