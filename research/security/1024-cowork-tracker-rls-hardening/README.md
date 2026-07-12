# Doc 1024: ZAOstock Cowork Tracker RLS Hardening Proposal

**Date:** 2026-07-12  
**Tier:** SECURITY (CRITICAL)  
**Status:** REVIEW ONLY - Do Not Apply Blind  
**Author:** Claude Code (Security Audit)  
**Related:** Doc 841 (ZAOOS over-audit 2026-06), Secret Hygiene rules

---

## Executive Summary

The ZAOstock cowork tracker database (Supabase project `etwvzrmlxeobinrlytza`) has a critical RLS (Row-Level Security) exposure: 13 tables allow ANY holder of an authenticated Supabase token to read and write ALL rows, with zero ownership scoping.

**Tables exposed:**
- activity_log, artists, budget_entries, circle_members, circles, contact_log, goals, meeting_notes, sponsors, suggestions, tasks (stock_todos), team_members, volunteers

**Policy pattern:** Each table has a single policy named `<table>_authenticated_all` with:
- Command: ALL (SELECT, INSERT, UPDATE, DELETE)
- Role: authenticated
- USING: true
- WITH CHECK: true

**Blast radius:** Any developer with the Supabase project's anon key, or any compromised frontend code, can directly write to every row of every table. This is the same exposure class as a prior ZAOcowork incident.

**Recommended fix:** Two cases, determined by the app's authentication model. This proposal documents both; a developer must choose one based on code review.

---

## The Exposure

### Verification

Exposure verified 2026-07-12 via read-only query of the live Supabase project:
```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename IN (
  'activity_log', 'artists', 'budget_entries', 'circle_members', 'circles',
  'contact_log', 'goals', 'meeting_notes', 'sponsors', 'suggestions',
  'tasks', 'team_members', 'volunteers'
)
AND policyname LIKE '%authenticated_all%';
```

All 13 rows returned: `cmd=ALL, roles=authenticated, qual=true, with_check=true`.

### Why It Matters

The Supabase project is internet-facing. The anon key is already public (embedded in client-side code). An attacker with the anon key could:

1. **Read all team data:** Member names, email, phone, roles, meeting notes, sponsor deal terms, artist contacts, budget details, etc.
2. **Corrupt data:** Modify artist status, budget entries, team member roles, sponsor contact info, etc.
3. **Inject false records:** Add fake volunteers, meetings, contacts, goals, etc.
4. **Enumerate relationships:** Discover circle memberships, sponsor-artist pairings, team structures via reverse engineering the schema.

The cowork app is team-internal (not public-facing), so the data is NOT meant to be accessed directly from the browser. All mutations should go through authenticated API routes on the server.

### Root Cause

The Supabase project was bootstrapped with "Service role full access" policies for all tables (see `scripts/archive/2026-04-25-cleanup/stock-schema.sql`). These were later changed to permissive authenticated ALL policies, either:
- By a migration that wasn't tracked in ZAOOS
- By direct Supabase dashboard edits (no git history)
- By an accident/drift during project setup

The policies were never hardened after the project went live.

---

## The App's Auth Model

To choose the right fix, review the app's auth pattern:

### Current Pattern (Verified)

**Iron-session + Service Role:**
- Client authentication: iron-session cookies (server-side, not Supabase auth)
- Database access: `getSupabaseAdmin()` / `supabaseAdmin` (service role key)
- Example: `src/lib/stock/members.ts` calls `getSupabaseAdmin().from('stock_sponsors').select(...)`
- All mutations happen via server routes, not direct browser-to-DB queries

This means the app is in **CASE B** (service-role-only).

### Alternative Pattern (Hypothetical)

If the app instead used Supabase auth directly (each user a Supabase auth UUID), RLS policies could scope writes by `owner_id = auth.uid()`. This would be **CASE A** (per-user auth). The codebase does NOT currently use this pattern.

---

## Two Fix Cases

Both cases remove the overly permissive authenticated ALL policies. The difference is what replaces them.

### Case A: Per-User Auth with Ownership Scoping

**Apply this if:**
- Each team member authenticates as a Supabase auth user (auth.uid() is meaningful)
- Tables have ownership columns that map to auth.uid() (e.g., owner_id, created_by, user_id)
- Writes should be scoped by owner (you can only write rows you own)
- Reads are team-wide (you can read all rows to see shared data)

**Example policies:**
```sql
-- Scoped write: owner_id must equal your auth.uid()
CREATE POLICY "todos_owner_write" ON stock_todos
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Team read: any authenticated user can select
CREATE POLICY "todos_team_read" ON stock_todos
  FOR SELECT
  USING (true);
```

**Challenges for ZAOOS:**
- The app uses iron-session, not Supabase auth. There's no `auth.uid()` column in team_members.
- Would need a user_mapping table or a schema change to tie Supabase auth users to team members.
- Column naming varies (owner_id, created_by, outreach_by, recruited_by, contacted_by, actor_id, etc.).
- Some tables have no ownership column at all (budget_entries, goals, suggestions).

**Recommendation:** Only use CASE A if you plan to migrate the app to Supabase auth. Current auth model doesn't support it.

### Case B: Service-Role-Only (Current App Pattern)

**Apply this if:**
- The app uses service role (`supabaseAdmin`) for all mutations
- The client (browser) has NO direct write access to these tables
- Client reads are optional (can be read-only or disabled entirely)

**Policy approach:**
1. Drop all permissive authenticated ALL policies
2. Keep service-role full access (or add it if missing)
3. If client-side reads are needed (e.g., listings), add scoped authenticated SELECT policies

**Example policies:**
```sql
-- Service role (server-side) can do anything
-- (This is the default when RLS is enabled and no policies forbid it)

-- Client can read (if listing page needs current data)
-- Decide: READ-ONLY, or NOTHING (cached data only)
-- For now, we recommend NOTHING (reads via API route + cache)

-- Client cannot write (all writes must go through /api/stock/... routes)
```

**Implementation notes:**
- The app currently uses `getSupabaseAdmin()` everywhere (verified in `src/lib/stock/`).
- Reads from the client can be:
  - **Full reads:** Add `CREATE POLICY "read_all" FOR SELECT USING (true)`
  - **Read-only:** Already enforced at the API level; no UPDATE/DELETE/INSERT policies
  - **Disabled:** Client never queries directly; reads via API route + cache
- Writes are always server-side (service role bypasses RLS anyway).

**Recommendation:** CASE B is the right fix for the current app. No auth schema changes needed.

---

## The Hardening Script

**File:** `scripts/cowork-rls-hardening.sql`  
**Status:** REVIEW ONLY - do not apply blind

The script includes:

1. **Guard:** Will not run without setting `app.apply_rls_hardening='1'` (prevents accidents)
2. **Case A block** (commented out): Per-user auth with scoped policies
3. **Case B block** (active): Service-role-only, drop permissive ALL policies
4. **Verification query:** Check policies after hardening
5. **Rollback section** (commented out): How to revert if needed

### How to Apply

1. **Determine your case:** Review `src/lib/auth/stock-team-session.ts` and `src/lib/stock/*.ts`
2. **Choose Case A or B:** (Case B recommended for current app)
3. **Test first:** Apply to a Supabase staging/branch database
4. **Verify reads/writes:** Ensure the cowork app still functions after hardening
5. **Review columns:** If using CASE A, verify ownership column names match the code
6. **Opt-in explicitly:** Set `app.apply_rls_hardening='1'` before running
7. **Apply to production:** In a low-usage window, after human review

### Guard Mechanism

The script will not execute unless a reviewer explicitly opts in:

```sql
-- SET SESSION app.apply_rls_hardening = '1';
-- \include scripts/cowork-rls-hardening.sql
```

This prevents accidents from copy-pasting or CI pipelines auto-applying security scripts.

---

## Secondary Issues

### 1. SECURITY DEFINER Function: `rls_auto_enable`

**Finding:** A function named `rls_auto_enable` has the SECURITY DEFINER flag and is executable by anon/authenticated roles.

**Risk:** SECURITY DEFINER functions execute with the creator's privileges. If anon/authenticated can execute `rls_auto_enable`, they could run database operations as the function owner (likely service role).

**Action:** Review what `rls_auto_enable` does. If it's not meant for client use, revoke anon/authenticated execute privileges:

```sql
REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION rls_auto_enable() TO service_role;
```

### 2. Functions with Mutable Search Path

**Finding:** Some functions may have mutable `search_path` (non-immutable, `provolatility != 'i'`) and `SECURITY DEFINER` set.

**Risk:** Unintended table access via injected schema/function names in parameters.

**Action:** Find these:

```sql
SELECT proname, provolatility, prosecdef
FROM pg_proc
WHERE prosecdef = true
  AND provolatility != 'i';
```

Review each one. If immutability is possible (function doesn't change behavior), mark it as `IMMUTABLE`. If SECURITY DEFINER is not needed, remove it.

---

## Test-First Runbook

### Step 1: Create a Staging Branch

In Supabase, create a preview/branch database (if available):
```
Supabase Dashboard > Branches > Create Preview
```

Or use a separate test project.

### Step 2: Apply the Hardening Script

```bash
# Set opt-in flag
set -a
export PGPASSWORD="<supabase-password>"
set +a

# Determine your case (A or B)
# Review scripts/cowork-rls-hardening.sql carefully

# Apply (example for Case B)
psql -h <db-host> -U postgres -d postgres -f scripts/cowork-rls-hardening.sql \
  -v "ON_ERROR_STOP=1"
```

Or directly in Supabase SQL Editor (copy-paste with guard opt-in).

### Step 3: Verify Policies

Run the verification query from the script:

```sql
SELECT table_name, policy_name, action, roles
FROM pg_policies
WHERE table_name IN (
  'activity_log', 'artists', 'budget_entries', 'circle_members', 'circles',
  'contact_log', 'goals', 'meeting_notes', 'sponsors', 'suggestions',
  'tasks', 'team_members', 'volunteers'
)
ORDER BY table_name, action;
```

**Expected:** No rows with `action='ALL'` and `roles='authenticated'`.

### Step 4: Test the Cowork App

On the staging database, run the cowork app:

```bash
# Redirect DB to staging
export SUPABASE_URL="<staging-project-url>"
export SUPABASE_ANON_KEY="<staging-anon-key>"
export SUPABASE_SERVICE_ROLE_KEY="<staging-service-role-key>"

npm run dev

# Open cowork tracker
# http://localhost:3000/spaces/stock-team-dashboard

# Test reads:
# - Can you load the dashboard?
# - Can you see artists, sponsors, volunteers, goals, etc.?

# Test writes (as team member):
# - Can you add/edit an artist?
# - Can you add a sponsor contact log entry?
# - Can you add a goal?

# If using Case A (per-user auth):
# - Can you only edit your own records?
```

### Step 5: Monitor for Errors

Watch the app logs and Supabase logs for RLS policy errors:

```
Failed to read from table: insufficient privileges
42501 (insufficient_privileges)
```

If these appear, you may have scoped the policies too narrowly. Adjust and re-test.

### Step 6: Coordinate a Production Window

Once staging is solid:
1. Schedule a 30-minute maintenance window during low-usage time (2-4am PT, typical)
2. Notify the team via Telegram
3. Apply the hardening script to production
4. Run verification query
5. Do a quick smoke test of the cowork app
6. Announce completion

---

## Rollback Plan

If the hardening script causes issues:

1. **In Supabase SQL Editor**, run the rollback section from the script (currently commented out)
2. **OR**, recreate the original policies:
   ```sql
   CREATE POLICY "activity_log_authenticated_all" ON activity_log
     FOR ALL USING (true) WITH CHECK (true);
   -- ... repeat for all 13 tables
   ```

The rollback will restore full access to authenticated roles (same as before). Be prepared to roll back within 5 minutes if the app breaks.

**Note:** Always test rollback on staging first. Ensure you can apply and revert cleanly.

---

## Ownership and Next Steps

- **PR:** `security: cowork tracker RLS hardening proposal (REVIEW ONLY, do not apply blind)` will be opened as a community review
- **Decider:** Zaal (project lead) must choose Case A or B based on auth model
- **Implementer:** Developer with Supabase admin access applies to staging, verifies, then production
- **Followup:** After hardening is live, implement secondary fixes (rls_auto_enable, search_path)

---

## References

- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
- ZAOOS security rules: `.claude/rules/secret-hygiene.md`, `api-routes.md`
- Prior ZAOOS RLS fix: `scripts/spaces-rls-hardening.sql`
- Incident precedent: Prior ZAOcowork RLS exposure (exact doc number not found, but noted in exposure brief)

---

## Appendix: Table Schema Recap

For reference, the 13 exposed tables and their key columns:

| Table | Key Columns | Ownership Column | Notes |
|-------|-------------|------------------|-------|
| activity_log | id, fid, activity_type, activity_date | N/A (read-only audit) | Team-wide read only |
| artists | id, name, status, outreach_by | outreach_by | Shared team write |
| budget_entries | id, type, category, amount, status | N/A (shared) | Shared team write |
| circle_members | member_id, circle_id | N/A (FK join) | Shared team read/write |
| circles | id, slug, name, coordinator_member_id | N/A (shared, coords rotate) | Shared team read/write |
| contact_log | id, entity_type, entity_id, contacted_by | contacted_by | Shared team write, attributed to actor |
| goals | id, title, status, category | N/A (shared) | Shared team read/write |
| meeting_notes | id, meeting_date, title, created_by | created_by | Attributed to author |
| sponsors | id, name, status, amount_committed, owner_id | owner_id | Per-sponsor ownership |
| suggestions | id, suggestion, status | N/A (open submission) | May allow anon submit in future |
| tasks (stock_todos) | id, title, status, owner_id, created_by | owner_id, created_by | Per-task ownership or per-creator |
| team_members | id, name, role, scope, active | N/A (team-wide) | Shared team read/write |
| volunteers | id, name, role, shift, confirmed, recruited_by | recruited_by | Attributed to recruiter |

---

**Doc 1024 — ZAOstock Cowork Tracker RLS Hardening Proposal**  
Prepared 2026-07-12 | CRITICAL SECURITY REVIEW | Do Not Apply Blind
