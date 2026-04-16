# 413 - ZAOstock Dashboard as Notion Replacement

> **Status:** Research complete
> **Date:** 2026-04-16
> **Goal:** Extend custom dashboard at /stock/team to replace Notion entirely - sponsor CRM, volunteers, artists, timeline, budget, meeting notes

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Replace Notion** | USE existing `/stock/team` dashboard. Own the code, $0 forever, already auth'd, already deployed |
| **Stack** | KEEP Next.js 16 server components + Supabase + iron-session (already working) |
| **New tables** | 5 tables: `stock_sponsors`, `stock_volunteers`, `stock_artists`, `stock_timeline`, `stock_budget_entries` |
| **Reuse tables** | Already have `stock_team_members`, `stock_goals`, `stock_todos` - no changes needed |
| **UI pattern** | Tabs within Dashboard.tsx - one component per domain (SponsorCRM, VolunteerRoster, ArtistPipeline, Timeline, BudgetTracker, MeetingNotes) |
| **MVP scope** | Ship in 3 waves over 2 weeks - Sponsors first (money blocker), Artists second (lineup blocker), rest after |
| **Auth** | KEEP existing `stock-team-session` - no changes needed, 14 team members already seeded |

---

## Existing Foundation (What's Already Built)

| Component | File | Status |
|-----------|------|--------|
| Login/auth | `src/app/stock/team/LoginForm.tsx` | Working - scrypt hash, iron-session |
| Dashboard shell | `src/app/stock/team/Dashboard.tsx` | Working - 3 sections (goals, todos, team) |
| Goals board | `src/app/stock/team/GoalsBoard.tsx` | Working - status cycling |
| Todo list | `src/app/stock/team/TodoList.tsx` | Working - owner assignment, status cycling, notes |
| Team roster | `src/app/stock/team/TeamRoles.tsx` | Working - display only |
| Session lib | `src/lib/auth/stock-team-session.ts` | Working - 30-day cookie |
| API routes | `src/app/api/stock/team/{goals,todos,members,login,logout}` | Working - Zod validation, service role Supabase |

**14 team members already seeded with password `zaostock2026`. 20 todos already loaded from kickoff.**

---

## New Database Schema

### stock_sponsors (CRM)
```sql
CREATE TABLE stock_sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('local', 'virtual', 'ecosystem')),
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'in_talks', 'committed', 'paid', 'declined')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  amount_committed NUMERIC(10,2),
  amount_paid NUMERIC(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  owner_id UUID REFERENCES stock_team_members(id),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### stock_volunteers
```sql
CREATE TABLE stock_volunteers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('setup', 'checkin', 'water', 'safety', 'teardown', 'floater', 'content', 'unassigned')),
  shift TEXT CHECK (shift IN ('early', 'block1', 'block2', 'teardown', 'allday')),
  confirmed BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  recruited_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### stock_artists (pipeline)
```sql
CREATE TABLE stock_artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'contacted', 'interested', 'confirmed', 'declined', 'travel_booked')),
  socials TEXT,
  travel_from TEXT,
  needs_travel BOOLEAN DEFAULT true,
  set_time_minutes INT DEFAULT 25,
  set_order INT,
  fee NUMERIC(10,2) DEFAULT 0,
  rider TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  outreach_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### stock_timeline (milestones)
```sql
CREATE TABLE stock_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'overdue')),
  category TEXT,
  owner_id UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### stock_budget_entries
```sql
CREATE TABLE stock_budget_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'projected' CHECK (status IN ('projected', 'committed', 'actual')),
  date DATE,
  related_sponsor_id UUID REFERENCES stock_sponsors(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### stock_meeting_notes
```sql
CREATE TABLE stock_meeting_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_date DATE NOT NULL,
  title TEXT NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  action_items TEXT DEFAULT '',
  created_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## UI Pattern: Tabbed Dashboard

Dashboard.tsx becomes a tab container. Each tab = one domain.

```
[Dashboard]
├── Goals (existing)
├── Tasks (existing - TodoList)
├── Sponsors (NEW)
├── Artists (NEW)
├── Volunteers (NEW)
├── Timeline (NEW)
├── Budget (NEW)
└── Notes (NEW)
```

**Component architecture:**
```
src/app/stock/team/
├── page.tsx           (server component, fetches all data)
├── Dashboard.tsx      (tab router)
├── GoalsBoard.tsx     (existing)
├── TodoList.tsx       (existing)
├── TeamRoles.tsx      (existing)
├── SponsorCRM.tsx     (NEW - Kanban by status, filter by track)
├── ArtistPipeline.tsx (NEW - list by status, set order drag-drop)
├── VolunteerRoster.tsx (NEW - table + shift grid)
├── Timeline.tsx        (NEW - sorted by date, overdue highlight)
├── BudgetTracker.tsx   (NEW - income vs expense, category breakdown)
└── MeetingNotes.tsx    (NEW - date-sorted list, markdown render)
```

---

## Comparison of Options

| Option | Cost | Control | Team Collab | Block Limits | Time to Build | Fit |
|--------|------|---------|-------------|-------------|---------------|-----|
| **Custom dashboard extension** | $0 | Full | 14 editors no limit | None | 2 weeks | USE |
| **Notion Free** | $0 | None | 10 guests max | Yes on teamspace | 1 day | SKIP - too small |
| **Notion Plus** | $140/mo | None | Unlimited | No | 1 day | SKIP - expensive |
| **Airtable Free** | $0 | None | 5 editors | 1000 records | 3 days | SKIP - limits |
| **Supabase Studio only** | $0 | Full | Admin only | None | 0 days | SKIP - no team UI |

---

## MVP Build Plan (172 Days to Festival)

### Wave 1: Ship THIS week (money blocker)
- [ ] `stock_sponsors` table + seed with 15 targets from outreach.md
- [ ] `SponsorCRM.tsx` - 3 Kanban columns by track (Local/Virtual/Ecosystem), status pills
- [ ] `/api/stock/team/sponsors` route (GET, POST, PATCH)
- [ ] Wire into Dashboard.tsx as "Sponsors" tab

**Why first:** Bangor Savings Bank pitch needs a tracker. First money = momentum.

### Wave 2: Ship NEXT week (lineup blocker)
- [ ] `stock_artists` table + seed wishlist
- [ ] `ArtistPipeline.tsx` - columns by status, drag to set order
- [ ] `stock_timeline` table + seed from timeline.md
- [ ] `Timeline.tsx` - date-sorted list, highlight overdue
- [ ] API routes for both

**Why second:** Artist confirmations drive everything else (travel, schedule, promotion).

### Wave 3: Ship weeks 3-4 (polish)
- [ ] `stock_volunteers` table + `VolunteerRoster.tsx`
- [ ] `stock_budget_entries` table + `BudgetTracker.tsx`
- [ ] `stock_meeting_notes` table + `MeetingNotes.tsx`
- [ ] Stats dashboard at top of page (funded %, artists confirmed, days to event)

### Wave 4: Post-launch polish (May)
- [ ] Email notifications via Supabase Edge Functions
- [ ] Sponsor pitch one-click PDF export
- [ ] Public read-only view at /stock/live for advisors
- [ ] Slack/Discord webhook on status changes

---

## ZAO Ecosystem Integration

- Existing dashboard: `src/app/stock/team/`
- Existing API: `src/app/api/stock/team/`
- Existing auth: `src/lib/auth/stock-team-session.ts`
- Existing SQL setup: `scripts/stock-team-setup.sql`
- Supabase admin client: `src/lib/db/supabase.ts` (getSupabaseAdmin)
- New SQL migration: create `scripts/stock-team-expand.sql` for 5 new tables
- Existing planning docs become Notion-style pages in the dashboard - keep the markdown for AI processing, render in UI for team use

---

## Why This Beats Notion

| Factor | Notion | Custom Dashboard |
|--------|--------|------------------|
| Cost Year 1 | $840 minimum ($140/mo x 6 months for 14 users) | $0 (Supabase Free covers it) |
| Block limits | Yes on Free tier | None |
| Auth integration | Separate login | Already ties to team members |
| Custom workflows | Limited by Notion's model | Build anything you want |
| Integration with /stock page | Manual copy-paste | Same DB, live data |
| Sponsor pitch page uses data | Manual sync | Direct query from sponsors table |
| Livestream day-of ops panel | Not possible | Trivial to add |
| Onchain integration (0xSplits, POAP) | Not possible | Direct Base L2 integration |
| AI agent access | Notion API | Direct Supabase queries |
| Offline-resistant | Needs internet | Cache-friendly with SWR |

**Biggest win:** Sponsor pitch page at `/stock/sponsor` can query sponsors table directly. Sponsor commits = instantly visible on public pitch page. Notion = copy-paste lag.

---

## Technical Notes

- All new API routes follow existing pattern: `getStockTeamMember()` auth check -> Zod validate -> `getSupabaseAdmin()` write
- Use `PATCH` not `PUT` for updates (existing convention)
- Kanban drag-drop: `@dnd-kit/core` (already in ecosystem, if not install)
- Date picker: native `<input type="date">` (no library needed)
- Keep server components where possible (page.tsx), client components only for interactive parts
- Revalidation: `router.refresh()` after mutations (existing pattern)

---

## Sources

- [Supabase Free Tier Limits](https://supabase.com/pricing) - 500MB DB, 5GB bandwidth, unlimited API calls
- [Next.js 16 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- Existing codebase: `src/app/stock/team/` + `src/app/api/stock/team/`
- Doc 368: Notion vs Custom Dashboard (recommended Notion - THIS doc updates that recommendation)
- Doc 369: DreamEvent Gap Analysis (dimensions to cover)
- Existing SQL: `scripts/stock-team-setup.sql`
