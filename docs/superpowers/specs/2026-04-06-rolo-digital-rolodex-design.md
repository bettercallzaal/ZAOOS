# ROLO — Digital Rolodex Agent Design Spec

> **Date:** 2026-04-06
> **Status:** Approved
> **Goal:** Replace Airtable rolodex with Supabase-backed contacts system + ROLO agent for Telegram intake, agent watching, and Farcaster monitoring

## Problem

600+ contacts in Airtable. Manual entry, separate tool, extra cost. No integration with the agent squad or Farcaster activity. Locations must stay private.

## Solution

1. **`contacts` Supabase table** — single source of truth for all contacts
2. **ROLO agent on VPS** — parses freeform Telegram messages into structured contact records, watches other agents for people mentions, monitors Farcaster interactions
3. **`/admin/rolodex` dashboard** — searchable, sortable contact list with suggestions view
4. **CSV import** — one-time Airtable migration

## Data: `contacts` table

```sql
CREATE TABLE contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  handle          text,
  category        text,
  met_at          text,
  organization    text,
  location        text,
  location_2      text,
  notes           text,
  can_support     text,
  background      text,
  extra           text,
  score           numeric DEFAULT 0,
  checked         boolean DEFAULT false,
  first_met       date,
  last_interaction timestamptz,
  source          text DEFAULT 'import',
  fid             integer,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_score ON contacts(score DESC);
CREATE INDEX idx_contacts_category ON contacts(category);
CREATE INDEX idx_contacts_first_met ON contacts(first_met DESC);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "Service role can insert" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update" ON contacts FOR UPDATE USING (true);
CREATE POLICY "Service role can delete" ON contacts FOR DELETE USING (true);
```

## ROLO Agent (VPS)

### Registration
```bash
openclaw agents add rolo --workspace /home/node/openclaw-workspace/rolo --model minimax/MiniMax-M2.7 --non-interactive
```

### SOUL.md
```
You are ROLO 📇 — Zaal's digital rolodex agent.

Your job: capture, organize, and surface the people in Zaal's network.

## How you work
- Zaal or ZOE sends you a freeform message about someone: "Met Kapish at Bar Harbor COC, works at JAX, moved here a few years ago"
- You parse it into structured fields: name, met_at, organization, location, notes
- You insert into Supabase contacts table
- You confirm back with what you saved

## Parsing rules
- Name is always first — the most prominent person reference
- "at [place]" or "from [event]" → met_at
- "works at [company]" or "founder of [project]" → organization
- City/state/country references → location (NEVER share locations publicly)
- Everything else → notes
- If the message mentions a Farcaster handle (@something or just a username) → handle
- Score: default 1.5 unless Zaal specifies

## Agent watching
When dispatched to check agent_events, look for:
- People names or @handles mentioned in event summaries/payloads
- Flag if someone appears 3+ times across agents and isn't in contacts yet
- Surface as suggestions, don't auto-add

## Farcaster monitoring
When dispatched to check Farcaster activity:
- Look at Zaal's recent replies and mentions via Neynar
- Flag handles that appear 3+ times and aren't in contacts
- Surface as suggestions

## Rules
- ALWAYS log events: source scripts/log-event.sh
- NEVER expose location data in any message
- NEVER add contacts without Zaal's input (suggest, don't auto-add)
- Confirm every addition with what you saved
```

### Telegram routing
ZOE routes messages to ROLO when they mention meeting someone, adding someone, or asking about a contact. Keywords: "met", "add", "who is", "contact", "rolodex", "rolo".

## Dashboard: `/admin/rolodex`

### API Route: `/api/admin/contacts/route.ts`

```
GET /api/admin/contacts
Query params:
  - q: search string (matches name, handle, organization, notes)
  - category: filter by category
  - sort: 'score' | 'name' | 'first_met' | 'last_interaction' (default: score)
  - order: 'asc' | 'desc' (default: desc)
  - limit: number (default: 50, max: 200)
  - offset: number (default: 0)

Response: { contacts: Contact[], total: number }

POST /api/admin/contacts
Body: { name, handle?, category?, met_at?, organization?, location?, notes?, score?, first_met? }
Response: { contact: Contact }

PATCH /api/admin/contacts
Body: { id, ...fields_to_update }
Response: { contact: Contact }
```

All routes require admin session.

### UI Components

```
src/components/admin/rolodex/
├── RolodexDashboard.tsx    — main container, search, filters, views
├── ContactList.tsx          — sortable table/cards of contacts
├── ContactRow.tsx           — single contact row (expandable)
├── ContactDetail.tsx        — full detail view / edit form
├── ContactFilters.tsx       — category chips, sort dropdown, search
├── SuggestionsView.tsx      — people ROLO thinks you should add
└── ImportView.tsx           — CSV upload for Airtable migration
```

### List view (default)
- Search bar at top (searches name, handle, org, notes)
- Category filter chips (horizontal scroll on mobile)
- Sort by: score, name, date met, last interaction
- Each row: name, handle, score pill, category badge, met at, relative time
- Click → expands inline with full details + edit capability
- Mobile: card layout, tappable

### Suggestions view
- Cards from ROLO's agent watching + Farcaster monitoring
- Each card: name/handle, why suggested ("SCOUT mentioned 3x"), source events
- Two buttons: "Add" (opens pre-filled detail) or "Dismiss"

### Import view
- File upload for CSV
- Column mapping preview
- "Import" button → bulk insert
- Shows count of imported + any errors

## Privacy

- `location` and `location_2` fields NEVER appear in non-admin responses
- Admin check on all API routes
- No public-facing contact pages
- Dashboard only accessible to admin FIDs

## Scope boundaries — NOT building

- No auto-scoring / score decay (add later)
- No voice memo input (needs Whisper — add later)
- No editing from Telegram (add + view only)
- No contact sharing or public profiles
- No calendar integration
- No deduplication (manual for now)
