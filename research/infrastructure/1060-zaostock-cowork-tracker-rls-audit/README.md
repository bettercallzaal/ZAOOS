---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-07-13
superseded-by:
related-docs: "1008, 1009, 1011, 1037"
original-query: "Run Supabase's free Database Advisor against ZAOstock's own project for an RLS check (doc 1035 Tier 3 item) - a real credential-exposure pattern already happened once in a sibling ZAO project (ZAOcowork)"
tier: DISPATCH
---

# 1060 - ZAOcowork Tracker RLS Audit: The Same Pattern Is Still Live

> **Goal:** Doc 1035 flagged running a Database Advisor check as a Tier 3 item, citing a prior credential-exposure
> incident in ZAOcowork as the reason it matters. This session's Supabase MCP connection only reaches
> `etwvzrmlxeobinrlytza` (the ZAOcowork tracker project, per doc 1037's scoping correction) - not ZAOstock's own
> canonical project (`yjrlaxpjusmrfylumban`). Ran the check against the one project actually reachable, and it
> confirms the same access-control pattern is still live today, on the very tables that hold ZAOstock's data.

## A scoping note (same one doc 1037 made)

This is an audit of the **ZAOcowork tracker's own Supabase project**, not ZAOstock's canonical database. It's the
cross-brand tracker several ZAO projects share (`etwvzrmlxeobinrlytza`), which happens to store ZAOstock's
team/circle/sponsor/budget rows (see doc 1037). The real snapshot of `yjrlaxpjusmrfylumban` itself - the project
that actually backs zaostock.com's `/team` dashboard - still hasn't happened, per doc 1037's still-open Next
Action. Read this doc as "what's exposed in the tracker ZAOstock's data currently lives in," not "ZAOstock's own
database is audited."

## Key Decisions

| Recommendation | Why |
|---|---|
| **Tighten the 12 tables' RLS policies from blanket `authenticated`-role access to something scoped (owner-based, service-role-only for writes, or per-project row filtering)** | Every one of `activity_log`, `artists`, `budget_entries`, `circle_members`, `circles`, `contact_log`, `goals`, `meeting_notes`, `sponsors`, `suggestions`, `tasks`, `team_members`, and `volunteers` has an `ALL`-command policy with `USING (true) WITH CHECK (true)` for the `authenticated` role - any signed-in user, not just the bot or an admin, can read AND write every row, including budget line items and team member data |
| **Decide whether `rls_auto_enable()` should stay callable by `anon`/`authenticated`, or be locked to `service_role`** | It's a `SECURITY DEFINER` function exposed at `/rest/v1/rpc/rls_auto_enable` to both roles - whatever it does, it runs with elevated privileges on behalf of anyone who can call it, which is a wider blast radius than most `SECURITY DEFINER` functions need |
| **This is not a new finding, it's a recurrence** | Doc 1035's Tier 3 item explicitly cites a prior credential-exposure incident in this exact project as the reason to check. This audit confirms the underlying access-control gap that produces that class of incident is still present, months later - fixing the policies once doesn't help if nothing changed the pattern that created them |
| **Someone with write access needs to actually run the fix - this session's connection is read-only** | `get_advisors` is a read-only check; tightening the policies requires a migration this session cannot apply |

## Findings

### 1. 12 tables allow any authenticated user full read/write, including ZAOstock's budget and team data

Supabase's Database Advisor (`get_advisors(type: "security")`) flags each with `rls_policy_always_true`:

| Table | Policy name | Command |
|---|---|---|
| `activity_log` | `activity_log_authenticated_all` | ALL |
| `artists` | `artists_authenticated_all` | ALL |
| `budget_entries` | `budget_entries_authenticated_all` | ALL |
| `circle_members` | `circle_members_authenticated_all` | ALL |
| `circles` | `circles_authenticated_all` | ALL |
| `contact_log` | `contact_log_authenticated_all` | ALL |
| `goals` | `goals_authenticated_all` | ALL |
| `meeting_notes` | `meeting_notes_authenticated_all` | ALL |
| `sponsors` | `sponsors_authenticated_all` | ALL |
| `suggestions` | `suggestions_authenticated_all` | ALL |
| `tasks` | `tasks_authenticated_all` | ALL |
| `team_members` | `team_members_authenticated_all` | ALL |
| `volunteers` | `volunteers_authenticated_all` | ALL |

Each policy's `qual` and `with_check` are both the literal `true` - meaning RLS is enabled (so the table isn't
wide open to the public `anon` role) but provides zero actual restriction once a request carries any valid
`authenticated` JWT. This is scoped access in name only. `budget_entries`, `sponsors`, and `team_members` are the
three tables that matter most here - they're ZAOstock's financial and personnel data. [FULL - direct
`mcp__supabase-cowork__get_advisors` call this session]

### 2. A SECURITY DEFINER function is callable by both `anon` and `authenticated`

`public.rls_auto_enable()` is flagged twice - once for `anon_security_definer_function_executable`, once for
`authenticated_security_definer_function_executable`. Both flags point at the same function, callable via
`/rest/v1/rpc/rls_auto_enable` by literally anyone who can reach the API, signed in or not. `SECURITY DEFINER`
means it runs with the privileges of whoever created it, not the caller - so whatever it does, it does it with
more authority than the caller actually has. Its name suggests it might be the very mechanism that's supposed to
auto-enable RLS on new tables - if so, having it callable by `anon` is a irony worth fixing on its own: the
safety mechanism itself has a wider door than the thing it protects. [FULL - direct query this session]

### 3. 14 tables have RLS enabled with literally no policy at all (informational, not a vulnerability)

`audit_logs`, `bot_commands`, `bot_events`, `bot_heartbeats`, `bot_tokens`, `brands`, `comment_notifications`,
`contacts`, `meetings`, `projects`, `task_dependencies`, `task_proposals`, `task_source_cache`, and
`token_claims` all have RLS enabled but zero policies defined. This actually fails closed (nobody can access
these tables at all except via `service_role`, which bypasses RLS) - it's flagged as `INFO` level, not a
security gap, but worth knowing: if any of these tables are supposed to be readable by the bot's normal
authenticated flow and aren't, that's a functionality bug hiding behind what looks like a security posture.
[FULL - direct query this session]

### 4. Performance advisor surfaces routine, low-priority findings - not urgent

9 unindexed foreign keys (e.g. `artists_circle_id_fkey`, `tasks_created_by_fkey`) and 9 unused indexes. All
`INFO` level. Not blocking anything, not part of this doc's scope beyond noting they exist - worth a look
whenever someone's doing general DB maintenance, not before. [FULL - direct query this session]

## Also See

- [Doc 1035 — ZAOstock Master Punch List](../../events/1035-zaostock-master-punch-list/) — the doc that flagged this exact check as a Tier 3 item, citing the prior ZAOcowork incident
- [Doc 1037 — ZAOstock Data Inside the ZAOcowork Tracker](../../events/1037-zaostock-cowork-tracker-data-check/) — the scoping correction this doc relies on (which project is actually reachable, and why it isn't ZAOstock's own)
- [Doc 1011 — ZAO Database Architecture](../1011-zao-database-architecture/) — broader ecosystem context on the `etwvzrmlxeobinrlytza` vs `yjrlaxpjusmrfylumban` split
- [Doc 1009 — ZAO Database Architecture Audit](../1009-zao-database-architecture-audit/) — likely the doc describing the original credential-exposure incident this audit re-confirms is still unresolved

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide the intended access model for the 12 flagged tables (owner-scoped rows? service-role-only writes? a real per-user policy?) and write a migration to replace the `USING (true)` policies | Zaal | Task | 2026-07-25 |
| Check what `rls_auto_enable()` actually does and decide if `anon`/`authenticated` execute access is intentional - lock to `service_role` if not | Zaal | Task | 2026-07-25 |
| Get someone with Supabase write access on `etwvzrmlxeobinrlytza` to apply the resulting migration - this session's connection is read-only | Zaal | Access | 2026-07-25 |
| Still outstanding from doc 1037: get a read-only token for `yjrlaxpjusmrfylumban` (ZAOstock's real project) so a future session can run this same check against the database that actually backs zaostock.com | Zaal | Access | 2026-07-18 |

## Sources

- `mcp__supabase-cowork__get_advisors(type: "security")` against `etwvzrmlxeobinrlytza`, this session — [FULL, direct query]
- `mcp__supabase-cowork__get_advisors(type: "performance")` against the same project, this session — [FULL, direct query]
- [Doc 1037 — ZAOstock Data Inside the ZAOcowork Tracker](../../events/1037-zaostock-cowork-tracker-data-check/) — [FULL, internal, source of the project-identity scoping this doc reuses]
