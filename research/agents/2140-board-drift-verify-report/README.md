---
topic: agents
type: audit
status: research-complete
last-validated: 2026-07-30
related-docs: 2137, 2138, 2139
original-query: "Board #48: cleanup pass on ~330 active tasks - reconcile drift, verify then close (anti-fabrication)"
tier: STANDARD
---

# 2140 - Board drift verify-report (board #48) - measured, not mass-closed

> **Goal:** The #48 cleanup pass, done the anti-fabrication way: measure the drift with SQL, verify closures against shipped evidence, and propose - not execute - the closes that need Zaal. The tracker MCP is read-only from this session, which is the right constraint anyway: every number below is from a live query (2026-07-30 ~02:30 ET), every proposed close carries evidence.

## The numbers (live queries, public.tasks)

| Measure | Count |
|---------|-------|
| Total rows | 1,355 (1,019 done / 298 todo / 34 in_progress / 4 blocked) |
| ACTIVE (todo + in_progress + blocked, not archived) | 333 |
| OVERDUE (due < today) | 130 (39% of active) |
| Overdue by project | zaodevz 123, ZAO 4, zaofestivals 2, zaal-personal 1 |
| Duplicate titles among active | 0 |
| Stale by updated_at / created_at | UNMEASURABLE - see the data-integrity finding |

## Finding 1 (data integrity): timestamps were bulk-rewritten

Every one of the 333 active tasks has `created_at` AND `updated_at` within the last 30 days - including tasks whose due dates and notes reference early July. A migration or sync re-created/re-touched all rows, so age-based staleness cannot be computed from timestamps anymore. Consequences:
- "Stale in_progress" and "untouched for N weeks" queries silently return 0 - a cleanup loop keyed on updated_at would report a clean board while 130 tasks sit overdue (a silent-failure-guard case: the query goes green while the signal is gone).
- The only reliable drift signals left are `due` dates and content cross-reference.

**Proposal:** add a `last_activity_at` the sync never rewrites, or protect updated_at with a trigger. Until then, all board hygiene keys on `due`.

## Finding 2: the drift mass is zaodevz overdue (123 of 130)

Category breakdown of active zaodevz tasks: Other 56 (22 overdue), ZAO Devz 37 (9), deep 36 (35 overdue), Site/Tech 34 (24), quick 15 (14), park 10 (9), Social 8 (3), Bounty 8 (1), Ops 7 (4). The `deep` and `quick` capture categories are nearly all overdue - captures got due dates at capture time and the dates were aspirational.

**Proposal (Zaal's call, one decision not 130):** a due-date AMNESTY on the capture categories (deep/quick/park, 61 tasks): clear the stale due dates and let the crush loop re-pick, instead of a permanent red wall of 130 overdue that makes real deadlines invisible.

## Verified close candidates (evidence, not opinion)

| Task (status) | Evidence | Action |
|---------------|----------|--------|
| "Handoff: TOP: Brandon DreamNet Phase 3 Spore conformance" (todo, due 08-01) | SHIPPED tonight: PR #2704 merged, doc 2138, 47/47 bidirectional conformance | CLOSE - ZOE can close with the PR link |
| "Inbox action: Zaal: LOCK the August ZABAL Games format" (todo, due 07-25) | Zaal locked it 2026-07-28 (memory + zabalgamez terminal); doc 2137 merged (PR #2708) restates it as plan of record | CLOSE - the lock happened |
| "Inbox action: Merge PR #2074 + apply Heart migration then fire Heart..." (todo, due 07-22) | PR #2074 is CLOSED unmerged ("agent control plane v0", checked live) and the Heart lease core shipped separately (docs 2124/2139, PRs #2502/#2505/#2518/#2520) | CLOSE as superseded - the task as written can never complete |
| "Iman: help ideate WaveWarZ protocol for August" (in_progress) | Doc 1255 shipped (PR #1860) per its own notes | Confirm with Iman, then close |

Everything else in the overdue set reads as REAL open work (onboarding, emails, env vars, launches) - closing those without doing them would be fabrication. They belong to the amnesty + crush loop, not a cleanup script.

## What this pass deliberately did NOT do

- No mass-close: 130 overdue tasks are mostly real commitments, and "done" requires proof (anti-fabrication rule 6).
- No writes at all: the tracker connection is read-only from this session; closes above are queued for ZOE/Zaal.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Close the 2 evidence-verified tasks (Phase 3 handoff, ZABAL format lock) | @ZOE | Board write | 2026-07-30 |
| Decide the capture-category due-date amnesty (one yes/no) | @Zaal | Decision | this week |
| Check PR #2074 state + close/re-scope the Heart-migration task | @ZOE | Verify | 2026-07-30 |
| Fix the timestamp-rewrite (sync must stop clobbering created_at/updated_at) | @Zaal (ZOE) | Build | next board work |

## Sources

- Live SQL against the cowork tracker (supabase-cowork MCP, read-only), 2026-07-30 - all counts above from the actual queries [FULL]
- Tonight's PRs #2704/#2708 + docs 2137/2138 (the closure evidence) [FULL]
