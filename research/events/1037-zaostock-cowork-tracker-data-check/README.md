---
topic: events
type: audit
status: research-complete
last-validated: 2026-07-12
superseded-by:
related-docs: "610, 1011, 1013, 1030, 1035"
original-query: "pull a fresh Supabase snapshot of the ZAO STOCK project's team/circle/sponsor/budget data (doc 1035 Tier 3, last real snapshot doc 610, May 5)"
tier: DISPATCH
---

# 1037 — ZAOstock Data Inside the ZAOcowork Tracker: A Fresh Check

> **Goal:** Doc 1035 flagged that ZAOstock's team/circle/sponsor/budget data hasn't had a direct snapshot since doc 610 (May 5) - everything since has been inference from memory/tracker mentions, not a direct DB check. This doc is that direct check, run against the one project this session's Supabase MCP connection can actually reach.

## A scoping correction before the findings

Doc 610's May 5 snapshot was of `yjrlaxpjusmrfylumban` - ZAOstock's own canonical Supabase project (confirmed since doc 609/610), the one that actually backs zaostock.com's live `/team` dashboard and onepagers system. **This session's Supabase MCP connection cannot reach that project.** `mcp__supabase-cowork__get_project_url` resolves to `etwvzrmlxeobinrlytza` instead - per doc 1011 Finding 5.5, that is **@ZAOcoworkingBot's own separate project**, built in June instead of migrating into ZAOstock's existing database as doc 692 had recommended. It happens to have `circles`/`team_members`/`artists`/`sponsors`/`budget_entries` tables shaped like ZAOstock's originals (`project` column defaults to `'zaostock'` on several of them), because it's being used as a cross-brand tracker that includes ZAOstock among several projects - but it is not the same database doc 610 audited, and a real snapshot of `yjrlaxpjusmrfylumban` itself still hasn't happened since May 5. This doc is honestly scoped to what was actually checked: ZAOstock's data as tracked inside the ZAOcowork tracker, not zaostock.com's own site database.

## Key Decisions

| Recommendation | Why |
|---|---|
| **Assign a coordinator to at least the Livestream and Finance circles now** | Direct query confirms all 6 ZAOstock circles in the cowork tracker (Finance, Host, Livestream, Marketing, Music, Ops) have `coordinator_member_id = NULL` - zero assigned, right now, not just "as of some past doc." This is first-hand confirmation of the exact gap docs 609/720/871/1030/1035 have been describing since May, still true today |
| **Link real team members to their circles in the tracker, not just informally** | `circle_members` (the join table) has 0 rows despite 12 real, active team members existing in `team_members` - ThyRev and Ohnahji (the two livestream-lead candidates from doc 1030 Finding 5) are both there, active, just not linked to anything. The tracker can answer "who's on Livestream" today; it currently doesn't because nobody has ever written the join rows |
| **Resolve the doc 1031 number collision before PR #1235 merges** | Open PR #1235 ("doc 1031: Zaal second-brain system design") still targets doc number 1031 - but 1031 is already merged and live as "ZAOstock: Why Ellsworth, Why This Model" (this session, business/). If #1235 merges as-is it will collide directly. Whoever owns #1235 needs to renumber before merging, not after |
| ~~**Write down who "Roddy" is**~~ **RESOLVED 2026-07-13** | Already named, just not linked from this doc: **Roddy Ehrlenbach, City of Ellsworth Parks/Rec**, the Franklin St Parklet venue contact - see [Doc 809](../809-roddy-zaostock-parklet-lock-apr30/) (a 2026-04-30 call, backfilled 2026-06-06). Doc 809 covers exactly the permit/city-comms relationship this tracker task references. The tracker task title and doc 1032's permit-exemption question both point at the same person; no new outreach needed, just cross-link the docs. |
| **Decide the ZAOstock repo spinout question - it's been open since at least early July with no owner** | "Decide ZAOstock spinout: graduate repo OR update CLAUDE.md" sits in the tracker with `owner_id: null` - genuinely nobody's, not even nominally assigned to Zaal like every other open item |

## Findings

### 1. All 6 ZAOstock circles exist but none have a coordinator, confirmed by direct query

```sql
select slug, name, coordinator_member_id from public.circles order by name;
-- finance    | Finance    | NULL
-- host       | Host       | NULL
-- livestream | Livestream | NULL
-- marketing  | Marketing  | NULL
-- music      | Music      | NULL
-- ops        | Ops        | NULL
```

Every circle referenced across this session's research (doc 1013's "finance circle, currently coordinator (open)," doc 1030's unowned livestream lead) checks out as still-empty in the live table, not just in stale doc text. [FULL - direct SQL query this session]

### 2. Zero of 12 real team members are linked to any circle

`circle_members` (circle_id + member_id join table) has 0 rows. `team_members` has 12 active people: Dcoop, Iman, JANGO, Jose, Metamu, Nemesis, Ohnahji, Samantha, Shawn, ThyRev, Tyler, Zaal. Two of them are directly relevant to this session's open livestream-lead question - **ThyRev** (Thy Revolution, doc 609's original May 5 pick) and **Ohnahji** (Onaji, doc 720's May 19 replacement) - both exist as real active members, neither is linked to the Livestream circle or anything else. The tracker has the raw material to resolve doc 1030 Finding 5's ambiguity structurally (make one of them the Livestream circle's coordinator) but nobody has ever written that row. [FULL - direct SQL join query this session]

### 3. artists/sponsors/budget_entries/volunteers are empty despite real confirmed data existing elsewhere

Already flagged and logged as a tracker action item this session (`inbox:zaostock-tracker-empty-tables`) - restated here as part of the same fresh-check exercise doc 1035 asked for. Fellenz and Dcoop are confirmed live artists (doc 1033), Heart of Ellsworth is a confirmed venue/promotion partner (doc 1031), and doc 1013 (now corrected - see its 2026-07-12 supersede notice - the real budget is ~$5K target, ~$1.5K on hand, not the old $20K figure) has a 5-line spending template - none of it exists as rows in `artists`/`sponsors`/`budget_entries`. This session's MCP connection is read-only, so the insert itself is still pending someone with write access. [FULL - direct table check this session, corroborates the inbox item already logged]

### 4. The `tasks` table surfaces 3 real items no research doc has captured

Filtering `tasks` for ZAOstock/ZAOville-related titles surfaced items that exist only as one-line tracker entries, never written up:

- **"ZAOstock: permit OR City co-sponsorship (call Roddy first)"** - due 2026-08-19, exactly matching doc 1032's Ordinance Chapter 14 deadline. **RESOLVED 2026-07-13:** "Roddy" is Roddy Ehrlenbach, City of Ellsworth Parks/Rec, the Franklin St Parklet venue contact - see [Doc 809](../809-roddy-zaostock-parklet-lock-apr30/), which already covers this exact relationship.
- **"Decide ZAOstock spinout: graduate repo OR update CLAUDE.md"** - `owner_id: null`, genuinely unowned, unlike every other open ZAOstock tracker item (which at minimum default to Zaal).
- **"ZAOstock: kickoff - pick Sponsors lead + fill understudies"** - still `todo`, no due date. Doc 1007 (this session) separately confirmed the sponsors workstream (Jay/Duh) is the one active workstream - this task may already be stale/superseded, worth a quick check rather than treating as still-open.

[FULL - direct SQL query this session, cross-referenced against docs 1007 and 1032]

### 5. Research-doc review debt: 17 "Review research doc NNN" tasks sit open, none marked done

Every doc this session shipped (990, 1002, 1004, 1005, 1007, 1008, 1009, 1013, 1019, 1029, 1030, 1031 [twice - see Key Decisions], 1032, 1033, 1034, 1035, 1036) has a corresponding "Review research doc" tracker task, and every single one is still `status: todo`. This is the exact "research sprawl" pattern doc 1035 was built to solve, still recurring in real time - the tracker is successfully capturing that each doc needs review, but nothing is closing the loop by actually reviewing them. [FULL - direct SQL query this session]

## Also See

- [Doc 610 — ZAOstock Database Consolidation](../../infrastructure/610-zaostock-database-consolidation-may4-5/) — the original May 5 snapshot this doc was asked to refresh; still not directly checkable from this session (see scoping correction above)
- [Doc 1011 — ZAO Database Architecture](../../infrastructure/1011-zao-database-architecture/) — source of the `etwvzrmlxeobinrlytza` vs `yjrlaxpjusmrfylumban` reconciliation this doc relies on (Finding 5.5)
- [Doc 1013 — ZAO Festivals Budgets](../../business/1013-zaofestivals-budgets-zaostock-zaoville/) — source of the budget line items still missing from `budget_entries` (superseded 2026-07-12: real figure is ~$5K target, ~$1.5K on hand, not the doc's original $20K)
- [Doc 1030 — ZAOstock Live Media Production](../1030-zaostock-livestream-media-production/) — source of the ThyRev vs. Ohnahji livestream-lead ambiguity this doc's circle-membership finding bears on
- [Doc 1035 — ZAOstock Master Punch List](../1035-zaostock-master-punch-list/) — the doc whose Tier 3 action this doc fulfills

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Assign a coordinator to the Livestream circle (ThyRev or Ohnahji - or whoever the fired zao-ask question resolves) and Finance circle at minimum - shipped when `circles.coordinator_member_id` is set, not just decided in chat | Zaal | Task | 2026-07-18 |
| Renumber PR #1235 off "doc 1031" before merging - it collides with the already-merged doc 1031 | Zaal | Todo | 2026-07-14 |
| ~~Find out who Roddy is~~ Done - cross-linked to doc 809 above. Optionally add the same one-line note to doc 1032 or the tracker task itself | Zaal | Todo | 2026-07-18 |
| Get someone with Supabase write access to run the artists/sponsors/budget_entries insert already drafted in the `zaostock-tracker-empty-tables` tracker item | Zaal | Task | 2026-07-21 |
| Actually request the read-only Supabase token for `yjrlaxpjusmrfylumban` (ZAOstock's real project) that doc 1011 and doc 826 have both already asked for, 30+ days open - shipped when a session can finally do the real doc-610-style snapshot this doc could only approximate | Zaal | Access | 2026-07-18 |

## Sources

- Direct SQL queries against `etwvzrmlxeobinrlytza` via `mcp__supabase-cowork__*` this session (circles, team_members, circle_members join, tasks filtered by ZAOstock/ZAOville titles) — [FULL, all queries run and results read directly this session]
- [Doc 1011 — ZAO Database Architecture](../../infrastructure/1011-zao-database-architecture/) — [FULL, internal, source of the project-identity reconciliation]
- [Doc 610 — ZAOstock Database Consolidation](../../infrastructure/610-zaostock-database-consolidation-may4-5/) — [FULL, internal, the prior snapshot this doc updates against]
- `gh pr list --repo bettercallzaal/ZAOOS --state open` — [FULL, run directly this session, source of the PR #1235 collision finding]
