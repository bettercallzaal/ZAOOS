---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-22
superseded-by:
related-docs: 692, 650, 668, 679
original-query: "the next thing we should build is a ZAO CRM /zao-research this idea to include into the coworking app"
tier: STANDARD
---

# 712 — ZAO CRM: a relationship layer for the cowork tracker

> **Goal:** Decide what a "ZAO CRM" should be and how it bolts into the cowork tracker (ZAODEVZ/ZAOcowork) - scoped, buildable, not a Salesforce clone.

## Key Decisions

| Decision | Recommendation | Why |
|----------|---------------|-----|
| CRM style | **Folk-style** - relationship-first, lightweight. NOT Attio (build-your-own-schema) or HubSpot (sales pipeline). | ZAO tracks relationships, not deals. 4-person team. Speed and zero-config beat customization. |
| Build vs buy | **Build it into the cowork tracker.** Do not buy Folk ($20/user/mo). | The data layer is already ~60% scaffolded (see Findings), and ZAO can solve the one problem every CRM vendor fails at. |
| Data model | **One `contacts` table with a `type` discriminator** + a `contact_id` FK on `tasks`. | Mirrors doc 692's unified-table pattern. The schema already has `sponsors`/`artists`/`volunteers`. |
| v1 scope | `contacts` + `contact_log` + task↔contact link + a "Contacts" tab. Nothing else. | Attio's own onboarding advice: start with 3-4 objects, run one real process for two weeks before expanding. |
| The differentiator | The **bot + `/meeting` skill auto-log touches** into `contact_log`. | Every CRM's fatal flaw is that humans do not log. ZAO has capture surfaces Folk/Attio do not. |

## Findings

**1. The data layer already exists - this is mostly a "surface what is there" job.**
doc 692's unified Supabase schema (`db/schema.sql` in thezao-tracker) created 13 tables. Five are CRM-shaped and **all sit empty, 0 rows, never surfaced by the app** - only `tasks` is wired up:

- `sponsors` (name, tier, amount, status, contact, circle_id, notes)
- `artists` (name, status, set_length, contact, circle_id, notes)
- `volunteers` (name, role, status, contact, notes)
- `contact_log` (contact, channel, summary, logged_by, logged_at)
- `meeting_notes` (title, body, meeting_date, created_by)

A ZAO CRM is ~60% wiring up tables that exist, not a from-scratch build.

**2. The market splits three ways - take Folk's philosophy, not its product.**

| Tool | Model | Price | Fit for ZAO |
|------|-------|-------|-------------|
| **Folk** | Relationship-first, lightweight, spreadsheet-style, "works for any relationship not just sales" | $20/user/mo (free <200 contacts) | Right philosophy - wrong to pay for it |
| **Attio** | Object-based, you model your own schema, custom objects + relations | Free / $29/user/mo | Too much DIY config for a 4-person team |
| **HubSpot** | Full sales + marketing platform, pipelines, sequences | Free / $90/user/mo for sequences | Enterprise-sales bloat ZAO does not need |

Folk's pitch: "strips away the bloat of Salesforce/HubSpot to focus on what matters - people, conversations, follow-ups." That is exactly the ZAO CRM. It just costs $20/user/mo for something the cowork tracker is two tables away from.

**3. Do NOT build sales-CRM bloat.** Every source agrees: skip pipelines/deal stages, forecasting, lead scoring, email sequences, territory/quota management. That weight is for sales orgs running complex deal motions. ZAO's relationships are sponsors, artists, volunteers, partners, venues, press, leads - tracked, not "closed."

**4. The killer CRM-task pattern is "next action linked to contact."** Every task tied to a person/company so you see context instantly. The cowork tracker **is already a task system** - so adding a `contacts` object and a task↔contact link *is* the CRM. ZAO's existing tasks already prove the need: "Get the Empire Builder API key from Jordan", "Send testimonial outreach DMs", "Confirm the Eden Fractal schedule with Dan/Tadas" are all relationship tasks with no contact to hang on.

**5. The universal CRM failure mode - and ZAO's unfair advantage.** Every comparison flagged the same flaw: CRMs depend on humans to log conversations, so the data "slowly drifts from reality." Vendors (Lightfield, Coffee) now sell auto-capture as the fix. **ZAO already has the capture surfaces** - the Telegram bot (natural-language: "logged a call with the venue") and the `/meeting` skill (transcript -> extracted decisions/contacts). The `contact_log` can populate itself. That is the reason to build this in rather than buy Folk.

## Recommended data model

Fold the three empty ZAOstock-scoped tables into one general table (0 rows - trivial migration):

```
contacts
  id            uuid pk
  type          text   -- sponsor | artist | volunteer | partner | venue | lead | press | member
  name          text not null
  project       text   -- zaostock | zaodevz | bcz | ...
  status        text   -- e.g. prospect | active | confirmed | cold
  handle        text   -- email / X / Telegram / phone
  circle_id     uuid references circles(id)
  owner_id      uuid references team_members(id)   -- who owns the relationship
  last_touch_at timestamptz
  notes         text
  metadata      jsonb default '{}'
  created_at    timestamptz default now()

tasks.contact_id   uuid references contacts(id)   -- a task can be "about" a contact
```

Keep `contact_log` (the touch history) and `meeting_notes` as-is.

## v1 scope (ship this, nothing more)

- Migration: `contacts` table, `tasks.contact_id`, backfill nothing (start clean).
- Web: a **Contacts tab** next to Board / Assistant - a list (filter by type/owner) + a contact detail view = info, linked open tasks ("next actions"), and the `contact_log` timeline.
- Add-contact + log-a-touch: a web form, and bot commands `/contact` and `/log`.
- Auto-log: the bot's NL path and the `/meeting` skill write `contact_log` rows.
- **Skip:** pipelines, deal stages, enrichment, email sequences, reporting dashboards.

## Also See

- [Doc 692](../../) — the unified Supabase schema this builds on (`tasks` + the 13-table greenfield).
- [Doc 650](../../) — cowork-zaodevz, the team action tracker.
- [Doc 668](../../) / [Doc 679](../../) — ZAOcoworkingBot, the Telegram surface that would carry `/contact` + `/log`.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Migration: `contacts` table + `tasks.contact_id` FK | @Zaal | PR to ZAODEVZ/ZAOcowork | Next build session |
| Build the Contacts tab (list + detail) | @Zaal | PR | After migration |
| Bot `/contact` + `/log` commands | @Zaal | PR | After the tab |
| Wire the `/meeting` skill to write `contact_log` | @Zaal | Skill update | After bot commands |
| Decide: fold `sponsors`/`artists`/`volunteers` into `contacts`, or keep separate | @Zaal | Decision | Before the migration |

## Sources

- [Attio vs folk - CRM comparison (5050 Growth)](https://5050growth.com/attio-vs/folk/) — [FULL] feature/price split, when each fits.
- [folk CRM Review 2026 (MakerStack)](https://makerstack.co/reviews/folk-crm-review/) — [FULL] folk's relationship-first positioning, pricing, AI follow-ups.
- [Attio vs Folk for Growing Teams (Lightfield)](https://lightfield.app/blog/attio-vs-folk) — [FULL] the shared data-drift flaw - "the CRM slowly drifts from reality."
- [Attio Review 2026 (CRM.org)](https://crm.org/news/attio-review) — [FULL] object-model tradeoffs, "start with 3-4 objects" onboarding advice.
- WebSearch: CRM + task management patterns (OnePageCRM, Capsule, HubSpot) — [PARTIAL - summary only] the "next action linked to contact" pattern.
- Codebase: `db/schema.sql` (thezao-tracker) — [FULL] confirmed the 5 empty CRM tables via Supabase `list_tables` (all 0 rows).
