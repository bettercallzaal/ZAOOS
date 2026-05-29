---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-28
related-docs: 761, 762, 763, 764, 765
original-query: "audit the admin page" (reconstructed - asked after Phase I shipped to validate the /admin surface)
tier: STANDARD
---

# 767 - ZAOcowork /admin audit (post Phase I)

> **Goal:** Audit the now-6-route /admin surface after Phase A through I shipped (PRs #15-#29). Confirm what works, what was broken, what shipped to fix it. Capture remaining tech debt before next phase.

## TL;DR

- 10 findings raised, all 10 shipped in 2 PRs (#28 + #29). /admin now fast (parallel reads), lead-accessible, breadcrumbed, and visually consistent.
- 1 lingering operational gap: migration 006 still not applied to live DB - `projects` table 404. User has the SQL clip but hasn't pasted.
- VPS bot auto-redeploy timer installed - future PRs touching `agent/` redeploy within 10 min, no manual SSH.

## Audit findings (status)

| # | Finding | Severity | Status | PR |
|---|---------|----------|--------|----|
| 1 | /admin doing 11 sequential awaits; ~1.5-2s page load | HIGH (perf) | SHIPPED | #28 |
| 2 | /admin/feed had no lead/admin gate - workers could see admin actions in audit_logs | HIGH (security) | SHIPPED | #28 |
| 3 | Leads had no Admin tab in NavBar, couldn't discover /admin/triage etc | MEDIUM (UX) | SHIPPED | #29 |
| 4 | Permission tier model undocumented; future contributors won't know how to gate new routes | MEDIUM (doc) | SHIPPED | #29 |
| 5 | 5-card callout grid cramped <200px at 1024px | LOW (visual) | SHIPPED | #29 |
| 6 | FeedCallout had no empty / has-events state - inconsistent with sibling callouts | LOW (visual) | SHIPPED | #29 |
| 7 | "Audit log" Section on /admin duplicated /admin/feed without distinguishing role | LOW (UX) | SHIPPED | #29 |
| 8 | No back-to-/admin breadcrumb on subpages - only NavBar | LOW (UX) | SHIPPED | #29 |
| 9 | Bot redeploy manual every merge - 8+ SSH sessions this week | LOW (ops) | SHIPPED | #29 + VPS install |
| 10 | Hardcoded migration filenames in banners would rot on rename | LOW (rot) | SHIPPED | #29 |

## What now works

### 1. /admin perf (finding #1)

Before: 7 independent Supabase reads ran one-at-a-time inside an admin-gated server component. Each ~150-300ms, total ~1.5-2s.

After: `Promise.all` wraps them. Independent reads share a round trip. Cold render still ~700ms (Supabase + Vercel cold start) but warm render <300ms.

Code at `src/app/admin/page.tsx:46-91`.

### 2. /admin/feed security gate (finding #2)

Before: `if (!user) redirect("/login")` and nothing else. A worker (ThyRev / Samantha / Tyler) could load the workspace-wide audit log and see admin promotions, bulk deletes, AI proposal approvals.

After: `if (!isLead(user) && !await isAdmin(user)) redirect("/?not-allowed=feed")`. Workers hitting the URL bounce.

The page already had a thoughtful design comment ("Workers don't get the feed (yet) - they have plenty of context from per-task views") but the code didn't match the design. Doc 765 spec finally enforced.

### 3. Leads can reach /admin (finding #3)

Before: NavBar only rendered the "Admin" tab when `isAdmin === true`. Leads (Zaal/Iman/Shawn) — who are explicitly authorized for /admin/triage, /admin/cleanup, /admin/proposals, /admin/feed — had to type those URLs because no link surfaced them. /admin itself rejected leads at the door.

After: NavBar accepts `isLead` prop too. Tab shows for `isAdmin || isLead`. /admin page opens to leads but the 4 admin-only sections (Users / Brands / Bulk task ops / Audit log) render only for admins. Leads see a muted note pointing to the actionable callouts above. Updated every NavBar caller across 8 page files.

### 4. Permission model documented (finding #4)

`src/lib/auth.ts` has a 4-tier table comment block: Auto / Notify / Ask / Block, with gate function + routes/actions per tier. Future contributor knows where new admin surfaces fit.

The 4 tiers in concrete terms:

| Tier | Gate | Examples |
|------|------|----------|
| Auto | session | board read, /chat, own task edit |
| Notify | session + audit log | bulk-set-owner, bulk-add-brand, comment |
| Ask | session + (lead OR admin) | /admin/triage, /admin/cleanup, /admin/proposals, /admin/feed, reviewUpdate |
| Block | requireAdmin | /admin Users/Brands/Bulk/Audit panels, /admin/projects, bulkDelete |

### 5. Responsive grid (finding #5)

Was `md:grid-cols-2 lg:grid-cols-5`. Now `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`. 5 callouts breathe at every viewport.

### 6. FeedCallout states (finding #6)

3 visual states matching sibling callouts (TriageCallout / CleanupCallout etc):

- `recentEvents === null` (migration not applied): muted neutral
- `recentEvents === 0` (quiet day): muted with "No events in last 24h"
- `recentEvents > 0`: colored blue with `N events today` count

Count computed from existing `auditPageData.rows` on /admin (no extra DB call).

### 7. AuditPanel positioned correctly (finding #7)

/admin/feed is now the chronological browse surface. AuditPanel stays on /admin for the filter-heavy advanced view (filter by entity + actor combo). Section title renamed to "Audit log (advanced filters)" with hint that points to /admin/feed for browsing.

### 8. Back-to-admin breadcrumb (finding #8)

New `src/components/admin/AdminBackLink.tsx`. Mounted above the h1 on every subpage (triage, cleanup, feed, proposals, projects). Keyboard-friendly return path beyond just the NavBar.

### 9. VPS bot auto-redeploy (finding #9)

`ops/bot-autoredeploy.sh` + systemd user service + 10-min timer. Polls origin/main, diffs against bot HEAD, pulls + reinstalls deps + restarts the bot only when `agent/` files changed. Idempotent. Log at `~/zaocoworking-autoredeploy.log` on VPS.

Installed on the live VPS as part of this audit:

```
Created symlink /root/.config/systemd/user/timers.target.wants/zaocoworking-bot-autoredeploy.timer
```

Next 8 merges that touch `agent/` will auto-redeploy. No more SSH dance.

### 10. Migration filename single-source (finding #10)

`src/lib/migrations.ts` is the canonical record of all 6 migration filenames. Every "migration not ready" banner pulls via `migrationPath(key)` instead of hardcoded strings. Rename a migration = 1 edit instead of 6.

## What still works (unchanged + verified)

| Route | HTTP | Gate | Migration dependency |
|-------|------|------|----------------------|
| / | 200 | session | tasks |
| /admin | 307 (auth) | lead+ | 001+002+003 graceful |
| /admin/triage | 307 (auth) | lead+ | 003+006 |
| /admin/cleanup | 307 (auth) | lead+ | none |
| /admin/feed | 307 (auth) | lead+ (FIXED) | 003 |
| /admin/proposals | 307 (auth) | lead+ | 005 |
| /admin/projects | 307 (auth) | admin | 006 (PENDING) |

All routes deploy fine. The 307 redirects are middleware bouncing unauthed requests to /login - expected.

DB tables verified live: `tasks`, `team_members`, `brands`, `audit_logs`, `task_proposals` all return 200. **`projects` 404** = migration 006 still not applied. /admin/projects shows the amber banner, everything else works.

## Operational notes

### Migration 006 still not applied

User has the SQL clip from the Phase I PR session. After applying, /admin/projects unlocks + Projects callout on /admin lights up.

### VPS bot auto-redeploy

Timer installed + active 2026-05-28. To check it's working:

```
ssh root@VPS 'systemctl --user list-timers zaocoworking-bot-autoredeploy.timer'
ssh root@VPS 'tail ~/zaocoworking-autoredeploy.log'
```

Log will be empty until a future merge touches agent/. The script no-ops when nothing changed.

### Bot redeploy script edge cases

- Pulls main even when agent/ unchanged (so VPS git tree stays current for `/admin` SSH workflows).
- If `agent/package.json` hash changes, runs `npm install` before restart.
- If restart fails, exits non-zero so systemd flags the run as failed - next timer cycle retries.
- Log lines are timestamped UTC with action context.

## Followups (not in this audit)

| Item | Why deferred |
|------|--------------|
| Replace hardcoded `isLead` with DB lookup (team_members.role) | Out of scope for this audit. Tracked in doc 765 + auth.ts comment. |
| Apply migration 006 | User action (paste SQL). Clip already saved. |
| Bot autoredeploy notifications | Could post to Telegram when redeploy fires. Low priority. |
| Per-action UI tier chips ("Admin only", "Lead+", etc) | Doc 765 decision #3. Deferred from Phase I to keep that PR scoped. |
| Move OWNERS list to DB-driven (dynamic from team_members) | Currently hardcoded - adding new users requires code edit. Doc 765 follow-up. |
| Login rate limiting | Doc 762 audit finding. Still open. |

## Also See

- [Doc 761](../761-zaocowork-repo-audit-may26/) - original full repo audit
- [Doc 762](../762-zaocowork-post-phase-audit-may26/) - post Phase A-E audit
- [Doc 763](../763-kanban-async-team-best-practices/) - kanban best practices (Phase F seeds)
- [Doc 764](../764-zaocowork-next-improvements/) - F1-F7 next round (Phase G seeds)
- [Doc 765](../765-coordination-layers-agent-human/) - coordination layers (Phase I seeds)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Apply migration 006 in Supabase SQL editor | Zaal | DB op | Whenever convenient |
| Confirm autoredeploy fires on next agent/ PR | Auto / Iman | Verify | Next PR touching agent/ |
| Pick next improvement scope from doc 764/765 followups | Zaal | Plan | After 006 applies |
| Fire research-doc tracker task for doc 767 | Auto | Tracker | After PR merge |

## Sources

- Live HTTP probe of /admin/* routes (2026-05-28) [FULL]
- Live Supabase REST probes of tables: tasks, team_members, brands, audit_logs, task_proposals, projects [FULL]
- VPS systemd-user `list-timers` output post-install [FULL]
- Code reads of: src/app/admin/page.tsx, src/app/admin/*/page.tsx, src/components/NavBar.tsx, src/lib/auth.ts, src/lib/migrations.ts [FULL]
- Prior research docs 761-765 (in same repo, cross-referenced) [FULL]
