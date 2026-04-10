# ZAO Stock Team Dashboard

**Date:** 2026-04-10
**Status:** Design

## What we're building

Two things:

1. **Update `/stock`** (public) - clean up the placeholder artist grid, keep everything else
2. **Build `/stock/team`** (password-gated) - a working dashboard where the ZAO Stock team can see status, todos, roles, and goals at any time without needing to be on a call

From the 3/31 standup (Zaal's words): "a landing page website, and then we'll also have a page for collaborators and contributors. So like, we have a place where anyone can go at any time to see like where we're at."

## Context: The structure

From the standup and FailOften's framework doc:

- **ZAO** = talent network, programming, community, events, sponsorship relationships
- **New Media Commons (NMC)** = fiscal sponsorship through Fractured Atlas (501c3). Tax-deductible donations. Opens doors to $10K-$100K grants from banks/corps especially Q3/Q4
- **ENTERACT** = FailOften's creative agency. Execution layer - projection mapping, installations, consultation, operating procedures. Sliding scale per project/contract

Funding model: sponsors (not ticket sales). Three lanes: paid (client has budget), sponsored (ZAO brings sponsors), funded (grants/tax-deductible/institutional).

## Part 1: `/stock` page updates

**Remove:**
- The 6-placeholder artist grid ("Coming Soon" cards)
- The "10 artists performing equal sets" text below it

**Keep everything else as-is.** The page is already accurate on date, venue, countdown, about, RSVP, sponsorship, past events, fundraising links.

## Part 2: `/stock/team` dashboard

### Auth

Simple password login. No Farcaster/wallet auth needed.

- Zaal creates team members in Supabase (name + password)
- Team member goes to `/stock/team`, enters name + password
- Session stored in an httpOnly cookie (`stock_team_session`, 30-day TTL)
- iron-session, same pattern as main app but separate cookie name so it doesn't interfere

### Database (3 tables)

**`stock_team_members`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | "Zaal", "FailOften", "AttaBotty", "Cole" |
| password_hash | text | bcrypt |
| role | text | "Curation", "Technical Build", "Production", etc. |
| scope | text | Brief description of what they own |
| created_at | timestamptz | |

**`stock_todos`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | |
| owner_id | uuid | FK to stock_team_members, nullable (unassigned) |
| status | text | "todo", "in_progress", "done" |
| notes | text | nullable, anyone can add context |
| created_by | uuid | FK to stock_team_members |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`stock_goals`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | e.g. "Venue confirmed" |
| status | text | "locked", "wip", "tbd" |
| details | text | Current state / context |
| category | text | "venue", "funding", "artists", "production", "logistics", "marketing" |
| sort_order | int | Display order |

### Seed data

**Goals** (pre-populated):
- Venue: Franklin St Parklet via Heart of Ellsworth (wip)
- Date: October 3, 2026 (locked)
- Official status: Part of Art of Ellsworth Maine Craft Weekend (locked)
- Weather backup: Wallace Events tent rental (tbd)
- Steve Peer: Pitch for co-curation (tbd)
- Funding: Identify grant/sponsor paths via NMC (tbd)
- Budget: Draft minimum viable + stretch (tbd)
- Sound/PA: Local vendor research Ellsworth/Bangor (tbd)
- Contracts: Define team member agreements (tbd)
- Sponsor list: 10-20 local businesses in Ellsworth + Bangor (tbd)
- Press: Ellsworth American connection (wip)

**Team members** (seeded via migration script, passwords set by Zaal):
- Zaal - Curation / Community / Local Logistics
- FailOften - Technical Build / Funding Structure / ENTERACT
- AttaBotty (Cole) - Production / Sponsorships / Event-Day Ops
- DaNici - TBD
- Hurric4n3Ike - Live Entertainment
- DCoop - ZAOVille (DMV) coordination

### Dashboard layout

Single scrollable page, mobile-first, dark theme (navy/gold).

**1. Header**
- "ZAO Stock Team" + logged-in member name + logout link

**2. Status board**
- Goals grouped by category
- Each shows title, status badge (locked/wip/tbd), and details
- Editable details field - any team member can update

**3. Team + Roles**
- Simple list: name, role, scope
- Not editable from the UI (Zaal manages via Supabase)

**4. Todos**
- Filter by: all / mine / by owner
- Each todo shows: title, owner, status, notes
- Any team member can: create new todos, update status (todo/in_progress/done), add notes
- Sort: incomplete first, then by created_at

### API routes

All routes check the `stock_team_session` cookie.

| Route | Method | What |
|-------|--------|------|
| `/api/stock/team/login` | POST | Validate name + password, set session cookie |
| `/api/stock/team/logout` | POST | Clear session cookie |
| `/api/stock/team/members` | GET | List team members + roles |
| `/api/stock/team/goals` | GET | List all goals |
| `/api/stock/team/goals` | PATCH | Update goal details/status |
| `/api/stock/team/todos` | GET | List todos (optional ?owner= filter) |
| `/api/stock/team/todos` | POST | Create todo |
| `/api/stock/team/todos` | PATCH | Update todo status/notes/owner |

### Auth helper

```typescript
// src/lib/auth/stock-team-session.ts
// Separate iron-session config for stock team
// Cookie: stock_team_session, 30-day TTL
// Payload: { memberId: string, name: string }
```

### Permissions

- Any authenticated team member can view everything
- Any team member can create todos, update todo status/notes, update goal details
- Team member management (add/remove people) is done directly in Supabase by Zaal - no admin UI for now

## What this is NOT

- Not a project management tool - no due dates, no priority levels, no Gantt charts
- Not a communication tool - use Discord for that
- Not public - team only
- No admin UI for member management yet - Supabase dashboard is fine for now

## Files to create/modify

**Modify:**
- `src/app/stock/page.tsx` - remove artist placeholder grid

**Create:**
- `src/lib/auth/stock-team-session.ts` - session config
- `src/app/stock/team/page.tsx` - dashboard page
- `src/app/stock/team/LoginForm.tsx` - password login form
- `src/app/stock/team/Dashboard.tsx` - main dashboard component
- `src/app/stock/team/TodoList.tsx` - todo list with create/update
- `src/app/stock/team/GoalsBoard.tsx` - goals status board
- `src/app/stock/team/TeamRoles.tsx` - team + roles display
- `src/app/api/stock/team/login/route.ts`
- `src/app/api/stock/team/logout/route.ts`
- `src/app/api/stock/team/members/route.ts`
- `src/app/api/stock/team/goals/route.ts`
- `src/app/api/stock/team/todos/route.ts`
- `supabase/migrations/20260410_stock_team_dashboard.sql`
- `scripts/seed-stock-team.ts` - seed script for initial goals + team members
