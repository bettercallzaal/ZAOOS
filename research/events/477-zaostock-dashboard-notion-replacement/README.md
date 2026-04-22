# 477 — ZAOstock Dashboard: Replace Notion Completely (170-Day Build)

> **Status:** Research complete
> **Date:** 2026-04-16
> **Goal:** Audit current `/stock/team` dashboard, identify the specific gaps that still push the team to Notion, and phase a minimum viable build across the 170 days remaining until Oct 3, 2026.

---

## Key Decisions

| Decision | Recommendation |
|----------|----------------|
| **Build strategy** | SHIP incremental — dashboard is already ~90% functional (10 tables, 25 components, 11 API routes). Treat this as hardening + 5 net-new features, not a rewrite. |
| **Net-new tables** | ADD 4 only: `stock_attachments`, `stock_activity_log`, `stock_comments`, `stock_contact_log`. Skip everything else until after Oct 3. |
| **Skip for v1** | DEFER saved filters, @-mentions, Gantt, multi-workspace, role-based permissions — none of these are Notion blockers. |
| **Rich text editor** | USE `@tiptap/react` 3.x (not BlockNote — Tiptap has 10x GitHub stars, Next.js 16 RSC-safe). Already on React 19. |
| **File storage** | USE Supabase Storage buckets `stock-decks` (private, signed URLs) and `stock-riders` (private). Direct upload from client with 25MB limit. |
| **Calendar view** | USE `react-big-calendar` 1.13+ for Timeline tab. No heavy dep — already have date-fns. Month + agenda views only. |
| **Realtime** | SKIP Supabase realtime subscriptions for v1. Pull-to-refresh + on-mutation local state is fine for 17-person team. Revisit only if they complain. |
| **Public sponsor pitch** | ADD per-sponsor shareable page at `/stock/sponsor/[token]` — token-gated, reuses `stock_sponsors` row. Sends prospects a real page, not a PDF. |
| **CSV bulk import** | ADD on Sponsors, Artists, Volunteers tabs. Parse client-side with `papaparse` (already in deps). Critical for Tyler/Magnetic outreach lists. |
| **Day-of mode** | ADD `/stock/team/day-of` view for Oct 3 — volunteer check-in, artist call times, incident log. Separate route, not a tab. |

---

## Current State Audit (What's Already Built)

### Tables — 10 live in `scripts/stock-schema.sql`

| Table | Columns | Role |
|-------|---------|------|
| `stock_team_members` | 8 (bio, links, photo_url) | Auth + profiles |
| `stock_goals` | 6 (locked/wip/tbd) | Locked decisions board |
| `stock_todos` | 7 (owner, creator refs) | Task board |
| `stock_sponsors` | 14 (3 tracks, 6 statuses, amounts) | Full CRM |
| `stock_artists` | 20 (wishlist→booked, claim_token, cypher) | Artist pipeline |
| `stock_timeline` | 8 (due_date, category, status) | Milestones |
| `stock_volunteers` | 9 (8 roles × 5 shifts) | Day-of roster |
| `stock_budget_entries` | 9 (income/expense, projected/committed/actual) | Live finance |
| `stock_meeting_notes` | 7 (attendees array, action_items) | Meeting log |
| `stock_suggestions` | 6 (public intake) | Suggestion box |

### Components — 25 files, 4,489 lines total

| Component | Lines | Maturity |
|-----------|-------|----------|
| `ArtistPipeline.tsx` | 460 | Full kanban + list + claim tokens |
| `SponsorCRM.tsx` | 419 | 3 tracks, 6-col kanban, attention card |
| `PersonalHome.tsx` | 395 | Per-member tab, daily Next Action |
| `Dashboard.tsx` | 322 | 10-tab router |
| `TodoList.tsx` | 260 | Owner/creator filters |
| `Timeline.tsx` | 240 | List + month grouping (no calendar yet) |
| `BudgetTracker.tsx` | 201 | Projected/committed/actual |
| `VolunteerRoster.tsx` | 197 | 8 roles, 5 shifts |
| `MeetingNotes.tsx` | 172 | Plain textarea (no rich text) |
| `KanbanBoard.tsx` | 177 | Shared board primitive |
| `BioEditor.tsx` | 151 | Profile editor |

### API Routes — 11 live under `src/app/api/stock/team/`

`goals`, `todos`, `members`, `sponsors`, `artists`, `timeline`, `budget`, `notes`, `volunteers`, `login`, `logout`, `profile`.

Plus public: `artist-profile`, `cypher`, `apply`, `suggestions`.

### What this covers (Notion parity status)

| Notion feature | Dashboard equivalent | Status |
|----------------|----------------------|--------|
| Database views (table/kanban/calendar) | Kanban + list per tab | CALENDAR MISSING |
| Relations between databases | `owner_id`, `related_sponsor_id`, etc. | DONE |
| Rollups / aggregations | Budget totals, volunteer counts, sponsor $ | DONE |
| Page-per-row detail | `CollapsibleDetail` expand + `/stock/team/m/[slug]` | PARTIAL (no deep pages for sponsors/artists) |
| Rich text editing | Plain textareas | MISSING |
| File attachments | None | MISSING |
| Comments / discussion | None | MISSING |
| @mentions | None | MISSING |
| Activity log | None | MISSING |
| Share externally | Public profiles + apply form | PARTIAL (no per-sponsor pitch page) |
| Mobile | Mobile-first Tailwind | DONE |

---

## Gap Analysis — What Still Pushes Team to Notion

Interviewed via codebase: what does Notion give them that this doesn't?

| Gap | Why it matters for ZAOstock | Impact if skipped |
|-----|------------------------------|-------------------|
| **File attachments on sponsors/artists** | Sponsor pitch decks, artist riders, contracts, W-9s, signed agreements. Can't send prospects "see attached" without this. | HIGH — sponsor outreach stalls without decks |
| **Contact log per sponsor/artist** | Who DM'd Tyler, when, what they said. `last_contacted_at` is a single timestamp, not a thread. | HIGH — Finance team needs handoff history |
| **Comments on entities** | "Hey @Candy should we pass on this sponsor?" Currently lives in Discord, lost forever. | MEDIUM — team discussion fragments |
| **Activity log** | "Who marked Craig G's budget entry 'actual'?" No audit trail. | MEDIUM — accountability gap |
| **Calendar view on Timeline** | Can't see "what's due in June" at a glance. List-only. | MEDIUM — planning blind spot |
| **Rich text on meeting notes + action items** | Bullets, bold, checkboxes, links. Plain textarea = ugly, no structure. | MEDIUM — notes look amateur shared externally |
| **Bulk CSV import** | Tyler brings a list of 50 Magnetic contacts. Typing them one-by-one = 2 hrs. | HIGH — kills day-1 velocity for Finance team |
| **Per-sponsor public pitch page** | Custom link per prospect: "hey Acme, here's our pitch for you." Currently everyone sees the same `/stock/sponsor/deck`. | HIGH — personalization = conversion |
| **Day-of check-in / incident mode** | Oct 3, 20 volunteers, 12 artists. Need one-tap check-in, not kanban. | CRITICAL — festival day infra |
| **Notifications when @'d or assigned** | Someone assigns Craig a todo. Craig needs to know without logging in. | LOW (team Discord handles it) |

---

## Four New Tables (All That's Needed)

### 1. `stock_attachments`

Polymorphic file pointers. Works across sponsors, artists, timeline, notes.

```sql
CREATE TABLE IF NOT EXISTS stock_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('sponsor','artist','timeline','note','volunteer')),
  entity_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('deck','rider','contract','invoice','photo','other')),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_by UUID REFERENCES stock_team_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_attachments_entity_idx
  ON stock_attachments(entity_type, entity_id);
```

Supabase Storage buckets: `stock-decks` (private), `stock-riders` (private), `stock-contracts` (private). Signed URLs from server on demand.

### 2. `stock_activity_log`

Audit trail. Write on every mutation in the 11 API routes.

```sql
CREATE TABLE IF NOT EXISTS stock_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES stock_team_members(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_activity_entity_idx
  ON stock_activity_log(entity_type, entity_id, created_at DESC);
```

Helper `src/lib/stock/log-activity.ts` — single function all API routes call after a successful mutation.

### 3. `stock_comments`

Threaded discussion on any entity.

```sql
CREATE TABLE IF NOT EXISTS stock_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('sponsor','artist','timeline','todo','note','volunteer','budget')),
  entity_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES stock_team_members(id),
  body TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  parent_id UUID REFERENCES stock_comments(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_comments_entity_idx
  ON stock_comments(entity_type, entity_id, created_at);
```

### 4. `stock_contact_log`

Outreach history. Replaces `last_contacted_at` single-field with a thread.

```sql
CREATE TABLE IF NOT EXISTS stock_contact_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('sponsor','artist')),
  entity_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','call','sms','dm_farcaster','dm_x','dm_tg','in_person','other')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
  summary TEXT NOT NULL,
  contacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contacted_by UUID NOT NULL REFERENCES stock_team_members(id),
  next_action TEXT,
  next_action_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_contact_log_entity_idx
  ON stock_contact_log(entity_type, entity_id, contacted_at DESC);
```

Add a trigger to update `stock_sponsors.last_contacted_at` from the max `contacted_at` so the existing "days since contact" attention card keeps working.

---

## UI Patterns That Work Best

| Pattern | Source | Where to use |
|---------|--------|-------------|
| **Expand-in-place drawer** (not modal) | Linear, Height | Sponsor/Artist expanded view with tabs: Details / Contact Log / Attachments / Activity / Comments |
| **Tiptap inline editor** | Notion, GitHub issues | Meeting notes body, action_items, comment body, artist/sponsor notes |
| **Drop-zone anywhere on card** | Trello, Height | Drag a PDF onto a sponsor card → uploads + attaches |
| **Command palette** (cmd+K) | Linear | Already noted as Year 1 in doc 425, now time to ship |
| **Filter pills above the kanban** | Linear, Plane | Status, track, owner, date — toggleable pills, not hidden dropdown |
| **Agenda view on calendar** | react-big-calendar | Timeline tab default view; month toggle secondary |
| **One-page day-of mode** | Clubhouse, festival apps | `/stock/team/day-of` — big buttons only, no density |
| **Public-share toggle per entity** | Notion's "share with web" | Sponsor detail: toggle on → generates `/stock/sponsor/[token]` link |

---

## Minimum Viable Build — 170-Day Phasing

Today: 2026-04-16. Festival: 2026-10-03. That's 170 days, 24 weeks.

### Phase 1: Hardening + Attachments (Apr 16 → May 5, 19 days)

**Goal:** Sponsor outreach no longer blocked on deck-attach. Activity log lives.

- [ ] Ship the 4 new tables in `scripts/stock-schema.sql` (still idempotent, one script)
- [ ] Supabase Storage buckets + policies (server signs URLs, never public)
- [ ] Attachments upload UI on `SponsorCRM.tsx` and `ArtistPipeline.tsx` expanded detail
- [ ] `src/lib/stock/log-activity.ts` + wire into all 11 mutation routes
- [ ] Activity feed rail on each expanded detail ("Zaal changed status lead → contacted · 2h ago")
- [ ] Fix any open bio/photo save bugs surfaced this week

**Gate for Phase 2:** Tyler uploads the first sponsor deck without asking Zaal for help.

### Phase 2: Contact Log + Comments (May 5 → Jun 2, 28 days)

**Goal:** Finance team fully owns sponsor pipeline without Notion.

- [ ] Contact log UI — add a log entry from sponsor/artist detail, shows thread
- [ ] Backfill existing `last_contacted_at` into first contact log entries
- [ ] Comments UI on sponsors, artists, timeline, todos (not budget — too noisy)
- [ ] `@name` autocomplete in comment body (no notification delivery yet)
- [ ] Tiptap replace the textarea in `MeetingNotes.tsx` body + action_items

**Gate for Phase 3:** Zero new Notion rows created since Phase 2 ship.

### Phase 3: Calendar + Public Pitch + Bulk Import (Jun 2 → Jul 14, 42 days)

**Goal:** Prospect sees a sharp pitch page. Magnetic CSV drops in in 30 seconds.

- [ ] `react-big-calendar` on Timeline tab, month + agenda views
- [ ] CSV import on Sponsors, Artists, Volunteers — papaparse client-side, preview diff, commit
- [ ] `/stock/sponsor/[token]/page.tsx` — public per-sponsor pitch, pulls `why_them` + embed Magnetic video + one CTA
- [ ] Toggle "Share externally" on sponsor detail, generates token URL
- [ ] Public profile pages for artists at `/stock/artists/m/[slug]` (already have m route for team)

**Gate for Phase 4:** First sponsor prospect clicks a custom pitch link before a meeting.

### Phase 4: Day-of Mode + Run-of-Show (Jul 14 → Sep 1, 49 days)

**Goal:** Oct 3 infrastructure is built and tested, not theoretical.

- [ ] `/stock/team/day-of` route — read-only dashboard: volunteer check-in list, artist call times, current act on stage
- [ ] Volunteer check-in toggle (single tap, large target, timestamp logged)
- [ ] Incident log table `stock_incidents` (name, description, severity, timestamp, resolved_at) — 5th new table, Phase 4 only
- [ ] Run-of-show pulls from `stock_artists.day_of_start_time` + `day_of_duration_min` (already in schema, just surface it)
- [ ] Stress test day-of view on phone in venue wifi (Ellsworth Franklin St parklet)

**Gate for Phase 5:** One practice "dry run" session — all teammates log in day-of mode, tap-through.

### Phase 5: Freeze, Polish, Backup (Sep 1 → Oct 3, 32 days)

**Goal:** Stability. Nothing new. Everyone knows the tool cold.

- [ ] Feature freeze Sep 15 — after that only critical bug fixes
- [ ] Nightly Supabase backup to separate project (day-of resilience)
- [ ] Print/PDF export from `SnapshotButton` for day-of paper fallback
- [ ] Team walkthrough 1 week before (Sep 26) — 30 min screen-share, Q&A
- [ ] Day-of on-call rotation: Zaal + DCoop primary, Candy + Tyler backup

---

## Open-Source Code Patterns to Borrow

| Repo | Pattern | URL |
|------|---------|-----|
| Plane (`makeplane/plane`) | Polymorphic comments + activity log schema | https://github.com/makeplane/plane/blob/preview/apiserver/plane/db/models/issue.py |
| Cal.com (`calcom/cal.com`) | Tiptap + mentions in Next.js 16 RSC | https://github.com/calcom/cal.com/tree/main/packages/features/ee/workflows |
| Supabase examples | Signed URL pattern for private buckets | https://supabase.com/docs/guides/storage/serving/downloads#signed-urls |
| react-big-calendar demos | Agenda + month toggle pattern | https://jquense.github.io/react-big-calendar/examples/?path=/docs/examples--basic |

Search via `mcp__grep__searchGitHub` for `"entity_type" "entity_id" typescript supabase` returns 200+ hits — polymorphic comments on Supabase is a well-trodden path.

---

## Risks / What Could Go Wrong

| Risk | Mitigation |
|------|-----------|
| Phase 1 slips → Tyler/Finance team goes back to Notion | Ship attachments FIRST, not activity log. Attachments are the single biggest Notion pull. |
| Comments become Discord #2 → discussion still fragments | Don't try to replace Discord. Comments are per-entity only ("notes on Acme deal"), not general chat. |
| Day-of mode built too late → Oct 3 scramble | Phase 4 ends Sep 1, leaves 32 days buffer. Move Phase 4 earlier if Phase 3 wraps fast. |
| Realtime pressure from team ("I want to see changes live") | Answer: "it's a 17-person team, refresh is fine. Realtime is 2027." |
| CSV imports create duplicates | Dedupe by `name` (case-insensitive) on import, show "2 skipped (already exist)" toast. |

---

## ZAO Ecosystem Integration

- **Schema lives in:** `scripts/stock-schema.sql` — append the 4 new tables, keep idempotent
- **API routes:** `src/app/api/stock/team/attachments/route.ts`, `comments/route.ts`, `contact-log/route.ts`, `activity/route.ts`
- **Components:** extend `src/app/stock/team/SponsorCRM.tsx`, `ArtistPipeline.tsx`, `Timeline.tsx`, `MeetingNotes.tsx`; add `AttachmentUploader.tsx`, `CommentThread.tsx`, `ContactLog.tsx`, `ActivityRail.tsx`
- **Day-of route:** `src/app/stock/team/day-of/page.tsx` (server component, pulls live)
- **Public pitch:** `src/app/stock/sponsor/[token]/page.tsx` (public, token-checked)
- **Auth:** reuse `getStockTeamMember()` from `src/lib/auth/stock-team-session.ts` — no changes
- **Branding:** stays navy `#0a1628` / gold `#f5a623` per community.config.ts
- **Link to:** research doc 425 (kanban patterns — parent UI spec), doc 472 (artist lockin), doc 476 (Apr 22 recap), doc 270 (original planning)

---

## Sources

- [Plane — open source Notion/Linear alternative](https://github.com/makeplane/plane) — polymorphic schema reference
- [Tiptap docs — Next.js App Router integration](https://tiptap.dev/docs/editor/getting-started/install/nextjs)
- [react-big-calendar repo](https://github.com/jquense/react-big-calendar)
- [Supabase Storage — private buckets + signed URLs](https://supabase.com/docs/guides/storage/security/access-control)
- [papaparse — CSV in browser](https://www.papaparse.com/)
- [Doc 425 — Dashboard UI Lean Kanban Patterns (parent)](../../events/425-zaostock-dashboard-ui-lean-kanban-patterns/)
- [Doc 472 — Artist lockin timeline](../472-zaostock-artist-lockin-timeline/)
- [Doc 476 — Apr 22 team recap](../476-zaostock-apr22-team-recap/)
