---
topic: business
type: decision
status: superseded
last-validated: 2026-05-23
superseded-by: 772
related-docs: "110, 212, 670, 673, 712, 713, 726, 727, 734, 735, 736, 772"
original-query: "Set up a new Airtable workspace as the agentic CRM destination for connected MCP queries (Gmail / Google Calendar / Google Drive / GitHub). Past CRM was an older Airtable; upgrade it agentic. Pair with the just-shipped private-data perimeter (PR #666). Replaces the people-CRM intent of docs 712 + 713 on the Airtable side while leaving the cowork-tracker Supabase work intact."
tier: STANDARD
---

# 737 - Airtable agentic CRM v3 (People + Activity + Opportunities)

> **Goal:** Lock the schema + agentic-ingestion design for the new Airtable CRM workspace Zaal just joined. The CRM is the canonical destination for synthesized people-data from the 4 connected MCPs (Gmail, Google Calendar, Google Drive, GitHub) while raw query output stays at `~/.zao/private/` per PR #666. Coexists with the Supabase cowork tracker; does not migrate it.

> **SUPERSEDED 2026-05-29 by [doc 772](../772-crm-supabase-native/).** Zaal reversed the Airtable-canonical decision in favor of a Supabase-native, RLS-gated CRM with a public `/network` feed Airtable cannot serve. The Airtable workspace becomes a read-only archive after the doc-772 migration runs, then frozen. The schema below remains the migration source map (Airtable columns -> Supabase columns).

This doc supersedes the Airtable-versus-Supabase half of docs 712 + 713 for the people-CRM. The tasks half (cowork tracker on Supabase, project `etwvzrmlxeobinrlytza`) stays as shipped.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **People + Activity + Opportunities live in Airtable.** Tasks stay in the Supabase cowork tracker (shipped, untouched). | Per Zaal 2026-05-23: "completely different - this is the CRM Airtable." Two stores, two purposes. Airtable is the right tool for relational people-data with rich link fields + views; Supabase is the right tool for task throughput. No migration, no schema-merge. |
| 2 | **Folk-style schema** (per doc 712 Decision #1) ported to Airtable. NOT Salesforce / HubSpot / Attio. | 3-4 person team, relationship-first, zero-config wins over customization. Folk's data model maps cleanly onto Airtable's link-field idiom. |
| 3 | **Three base tables: Contacts, Activity, Opportunities.** All inter-linked. Plus one Lookup table for Source tags. | Sales-CRM minimum. Activity is the highest-volume table (every email / GCal event / GitHub interaction / meeting recap = one row). Opportunities is the deal/collab/intro pipeline. |
| 4 | **Agentic ingestion = synthesize-then-write, never raw-paste.** | PR #666's private-data perimeter mandates raw output stays at `~/.zao/private/`. Airtable rows carry synthesized facts only (title, owner, date, ZAO-relevance) plus a back-pointer to the raw dump file. PII allowlist from `.claude/rules/pii-hygiene.md` applies. |
| 5 | **PAT auth via `~/.zao/airtable.env`** (chmod 600), never pasted in chat. New PAT scoped to ONLY this workspace + ONLY data.records:read/write + schema.bases:read. | Existing `AIRTABLE_TOKEN` env var is for the OLD Respect-import Airtable - different workspace, do not reuse. Token scope minimization per `.claude/rules/secret-hygiene.md`. |
| 6 | **MCP install order: try domdomegg/airtable-mcp-server first** (community standard, MIT, npm-installable per doc 730 Decision #13). Fall back to Zapier MCP only if it doesn't cover the use case. | Open-source, no vendor latency, no paid tier. `npm install -g` + absolute binary path per doc 730 (NOT `npx -y`). |
| 7 | **Sync flow: MCP queries are pull-by-Claude, not push-by-cron.** No background daemon. | Lower complexity, less risk of runaway PII writes. When Zaal asks Claude to update the CRM, Claude pulls from the 4 MCPs, synthesizes, writes. Outside of those moments, nothing touches Airtable. |
| 8 | **Activity rows link back to a `~/.zao/private/<source>-<slug>-<date>.json` path** in a single `raw_source` field. NEVER the raw content itself. | Audit trail + follow-up queries can re-read the dump locally without re-hitting the source API. Airtable stays small + sharable without leaking the originals. |

## Schema

Three tables in the new workspace + one lookup. All field names lowercase-with-underscores for API ergonomics.

### Table 1: `contacts`

The atom. One row per person (or organization treated as a person).

| Field | Type | Purpose |
|-------|------|---------|
| `name` | Single line text (primary) | Display name as Zaal refers to them. e.g. "Shriyash Soni" |
| `role` | Single line text | Short role tag. e.g. "Founder, Apna Coding" |
| `org` | Single line text | Org name if applicable. e.g. "Apna Coding" |
| `zao_connection` | Multi-select | Tags: `ZABAL-Games-mentor`, `ZABAL-Games-presenter`, `WaveWarZ-collab`, `ZAOstock-team`, `inbound-builder`, `advisor`, `investor`, `customer`, `partner-org`, `community-member`, `cold-intro` |
| `farcaster_handle` | Single line text | Public, no `@`. e.g. `shriyash` |
| `x_handle` | Single line text | Public, no `@` |
| `github_handle` | Single line text | Public |
| `telegram_handle` | Single line text | OK to store privately in Airtable; redacted per pii-hygiene allowlist when synthesized into committed artifacts |
| `email_primary` | Email | OK to store privately in Airtable; redacted per pii-hygiene allowlist when surfaced publicly |
| `location` | Single line text | City / country granularity. e.g. "India" |
| `met_via` | Single line text | How Zaal met them. e.g. "East Boulder Ethereum group chat" |
| `first_contact_date` | Date | YYYY-MM-DD |
| `last_touch_date` | Date | Auto-rolled-up from latest linked Activity row |
| `consent_for_graph` | Checkbox | Has this contact OK'd appearing in public Bonfire episodes / research docs unredacted? Defaults FALSE. |
| `notes` | Long text | Free-form. Anything not in a structured field. |
| `memory_slug` | Single line text | If a `project_<name>.md` memory file exists for this contact, store its slug. e.g. `project_shriyash_soni` |
| `research_docs` | Long text | Comma-separated doc numbers. e.g. `711, 714, 736` |
| `linked_activity` | Link to `activity` | Reverse-linked auto |
| `linked_opportunities` | Link to `opportunities` | Reverse-linked auto |

### Table 2: `activity`

The volume table. One row per discrete interaction. Highest-write-frequency.

| Field | Type | Purpose |
|-------|------|---------|
| `title` | Single line text (primary) | One-line summary. e.g. "Intro call - confirmed ZABAL Games June presenter" |
| `date` | Date + time | When it happened |
| `type` | Single select | `email-sent`, `email-received`, `meeting`, `gcal-event`, `gdrive-collab`, `github-interaction`, `telegram-dm`, `farcaster-cast`, `phone-call`, `in-person`, `other` |
| `contacts` | Link to `contacts` | One or more. The actual people involved. |
| `direction` | Single select | `inbound`, `outbound`, `mutual` |
| `source` | Single select | `gmail-mcp`, `gcal-mcp`, `gdrive-mcp`, `github-mcp`, `meeting-skill`, `manual`, `inbox-skill`, `bonfire-graph` |
| `raw_source` | Single line text | Path to the `~/.zao/private/<source>-<slug>-<date>.json` dump OR a research-doc number. NEVER the raw content. |
| `zao_relevance` | Multi-select | `ZABAL-Games`, `ZAOstock`, `WaveWarZ`, `ZAO-Music`, `ZAO-Devz`, `Hermes`, `ZOE`, `Bonfire`, `Fractal`, `ops`, `personal`, `not-relevant` |
| `summary` | Long text | Synthesized facts (PII-redacted per pii-hygiene if surfaced beyond Airtable). NOT raw content. |
| `linked_opportunities` | Link to `opportunities` | If this activity moved an opportunity forward |
| `bonfire_episode_id` | Single line text | If an episode was POSTed to Bonfire from this activity, store its episode name |

### Table 3: `opportunities`

The pipeline table. One row per deal / collab / intro / decision in flight.

| Field | Type | Purpose |
|-------|------|---------|
| `title` | Single line text (primary) | What it is. e.g. "Apna Coding -> ZABAL Games July build-a-thon submission rail" |
| `kind` | Single select | `collab`, `intro`, `deal`, `partnership`, `hire`, `customer-pipeline`, `funding`, `other` |
| `status` | Single select | `lead`, `qualified`, `in-conversation`, `committed`, `in-flight`, `delivered`, `dropped`, `dormant` |
| `owner` | Single select | `Zaal`, `Iman`, `Tyler`, `Both`, `external` |
| `counterparty_contacts` | Link to `contacts` | Who the other side is |
| `zao_surface` | Multi-select | Same options as `activity.zao_relevance` |
| `value_thesis` | Long text | Why this matters in 2-3 lines |
| `next_action` | Single line text | The next single thing to do |
| `next_action_due` | Date | When |
| `created_at` | Date | When the opportunity was logged |
| `last_activity_date` | Date | Auto-rolled-up from latest linked Activity row |
| `linked_activity` | Link to `activity` | Every touchpoint that advanced this opportunity |
| `linked_research_doc` | Single line text | If a research doc covers it (e.g. doc 736 for the Shriyash one) |

### Table 4 (lookup): `source_tags`

Single field `tag`, single-line text. Pre-populated with the values used in `activity.source` so the picker stays clean. Not strictly necessary (Airtable single-selects work fine without a lookup) but keeps the schema explicit.

## Agentic ingestion flow

Per-source playbook. All flows preserve the PR #666 perimeter: raw goes to `~/.zao/private/`, synthesized goes to Airtable.

### Flow A - Gmail thread or thread search

Trigger: Zaal says "Claude, pull recent emails from / about X" or "log this thread to the CRM."

1. Claude calls `mcp__claude_ai_Gmail__*` to fetch threads matching the query.
2. Claude writes the full raw response to `~/.zao/private/gmail-<query-slug>-<YYYYMMDD>.json`.
3. Claude resolves participant email addresses against `contacts.email_primary` in Airtable.
   - If a `contacts` row exists -> link to it.
   - If not -> create a new `contacts` row with minimum fields (name from "From" header, email_primary, `met_via: gmail-mcp`).
4. For each thread, Claude writes ONE `activity` row: `type: email-received` (or `email-sent`), `date` from headers, `contacts` linked, `source: gmail-mcp`, `raw_source: ~/.zao/private/gmail-<slug>-<date>.json`, `summary` = synthesized (2-3 sentences, PII redacted per `.claude/rules/pii-hygiene.md`).
5. If the thread surfaced an actionable lead / collab / intro -> Claude proposes a new `opportunities` row to Zaal for confirmation. Never auto-creates opportunities.

### Flow B - Google Calendar sweep

Trigger: Zaal says "what's on the calendar this week and who am I meeting" or "log past week's meetings to CRM."

1. Claude calls `mcp__claude_ai_Google_Calendar__list_events` for the requested window.
2. Raw -> `~/.zao/private/gcal-<calendar>-<YYYYMMDD>.json`.
3. For each event with attendees, resolve attendees against `contacts.email_primary`. Create missing contacts with `met_via: gcal-mcp`.
4. Write ONE `activity` row per event: `type: gcal-event`, `date` from start time, `contacts` = all attendees, `source: gcal-mcp`, `raw_source` = dump path, `summary` = event title + Zaal-relevant context.
5. If a Google Cal event title matches an existing `/meeting` recap, link the `activity.raw_source` to the research doc number too.

### Flow C - Google Drive

Trigger: Zaal points at a folder or doc.

1. Claude calls `mcp__claude_ai_Google_Drive__*`.
2. Raw -> `~/.zao/private/gdrive-<folder-slug>-<YYYYMMDD>.json`.
3. If the file is a meeting transcript or notes -> hand off to `/meeting` skill flow (which writes its own research doc + already feeds tasks into the Supabase tracker per doc 713).
4. If the file is something else (proposal, contract, deck) -> write ONE `activity` row: `type: gdrive-collab`, link to the relevant `contacts` (parsed from doc sharing settings), `summary` = "Reviewed [doc title] - [one-line takeaway]". If it surfaces an opportunity, propose `opportunities` row.

### Flow D - GitHub interaction

Trigger: PR comment, issue mention, repo star, fork.

1. Claude calls the native Claude GitHub MCP for the specific interaction.
2. Raw -> `~/.zao/private/github-<repo>-<event>-<YYYYMMDD>.json`.
3. Resolve GitHub usernames against `contacts.github_handle`. Create missing contacts with `met_via: github-mcp`.
4. `activity` row: `type: github-interaction`, link to the contact, `summary` = "Opened PR #N on repo/X" or similar.
5. Most of this is low-signal noise. Flow D should be opt-in per query, not a default sweep.

### Flow E - /meeting skill (existing)

The `/meeting` skill (doc 673/676) already writes:
- Recap doc to `research/events/`
- Meeting index row
- Bonfire episodes
- Action items to the Supabase cowork tracker

**New addition for v3:** after the meeting recap is committed, `/meeting` also writes:
- ONE `contacts` row per NEW attendee (skip ZAO ecosystem people already in the table)
- ONE `activity` row of `type: meeting`, linked to all attendees, `summary` = meeting recap one-liner, `raw_source` = research doc number
- If decisions surfaced an opportunity (e.g. doc 736 Shriyash -> ZABAL Games confirmed presenter), propose `opportunities` row to Zaal

This makes `/meeting` the highest-quality writer into the CRM. Manual ingestion via the other flows is the catchup layer.

## Coexistence with shipped systems

| System | Owns | This CRM owns |
|--------|------|---------------|
| Supabase cowork tracker (project `etwvzrmlxeobinrlytza`, table `tasks`) | Tasks - what needs to get done, who's doing it, by when | NOT tasks |
| Supabase Respect ledger (existing `AIRTABLE_TOKEN` import per doc 212) | Respect scores + Fractal session attendance | NOT Respect |
| Webflow CRM at `thezao.com/community` | Public member directory (49 members) per doc 110 | NOT public members |
| Bonfire knowledge graph | Episodes / facts / entities across all surfaces | Source-of-truth pointers (Airtable links back to Bonfire episode names) |
| Research library at `research/<topic>/` | Long-form synthesis + decisions | Pointers (Airtable links back to doc numbers) |
| Personal memory at `~/.claude/.../memory/` | Zaal-specific facts, preferences, feedback rules | NOT memory; CRM `memory_slug` field links back to memory file for context retrieval |

The CRM is the **relational join** across these. None of them have all three of (people + activity timeline + opportunity pipeline) in one query-able shape.

## Supersession + partial overrides

| Doc | What stays | What supersedes |
|-----|-----------|----------------|
| Doc 712 (ZAO CRM design - Supabase) | Folk-style decision (Key Decision #1), 4-person-team scope reasoning | Storage layer changes Supabase -> Airtable (this doc); cowork tracker still uses Supabase for tasks |
| Doc 713 (meeting tracker + CRM + Bonfire unified) | /meeting becomes the front door (still true), Supabase as one DB for tasks (still true) | The "CRM in Supabase" half - people/activity/opps move to Airtable; tasks stay in Supabase |
| Doc 110 (community directory CRM) | Webflow -> Supabase migration for public 49 members (still valid; this is the PUBLIC directory, not the relationship CRM) | No conflict - different scope |
| Doc 212 (Vercel + Airtable integrations) | Respect-import pattern stays. Existing `AIRTABLE_TOKEN` is for the OLD workspace - this CRM gets a NEW PAT in a NEW env var | New env var: `AIRTABLE_CRM_TOKEN` |

## Risks + open questions

| Risk | Mitigation |
|------|-----------|
| Airtable rate limit (5 req/sec per base) | Batch writes via the `/rest/v1/<table>?records=[]` bulk endpoint (up to 10 records per call). At full ingestion of a typical week (~50 emails + 20 GCal + handful of GitHub), this is ~10 batches total = fine. |
| PAT in env vs in chat | NEVER paste the PAT in chat. Generate in Airtable UI -> `~/.zao/airtable-crm.env` chmod 600. Add to skill auto-loaders by sourcing this file. |
| Schema drift between Airtable + this doc | Airtable's UI lets anyone add fields/tables. Pin a `last-validated` date on this doc; re-validate quarterly. If schema drifts > 5 fields, doc moves to `superseded`. |
| Two Airtable workspaces is one too many to keep mental track of | Document both in MEMORY.md: `project_airtable_respect.md` (old) + `project_airtable_crm.md` (new, this doc). Use DIFFERENT env var names so a wrong-workspace write is impossible. |
| Synthesized rows still contain PII (emails, phone, attendee names) inside Airtable | Airtable workspace is private to Zaal + invited team. Pii-hygiene allowlist applies to anything LEAVING Airtable (research docs, Bonfire episodes, public artifacts). Inside Airtable the data lives, but it does not propagate without an explicit redact pass. |
| Cost - Airtable free tier = 1000 records per base | Activity is the volume table. At ~50 rows/week, free tier lasts ~5 months. Team Plan ($20/seat/mo) = 50k records. Decision deferred to ~month 4 - re-check then. |
| Vendor lock-in | All schema in this doc + a `scripts/airtable-crm-export.ts` weekly cron writing a JSON snapshot to `~/.zao/private/airtable-crm-backup-<date>.json` keeps the door open to migrate. |

## Sequenced adoption plan

Strictly ordered. Each step unblocks the next.

1. **Zaal accepts the workspace invite in browser.** (You - 2 min). Revoke the invite-token-leaked-in-chat link after acceptance.
2. **Zaal creates the new base in the workspace** named "ZAO CRM". (You - 5 min).
3. **Zaal creates 3 tables (`contacts`, `activity`, `opportunities`) + 1 lookup (`source_tags`)** per the schema above. Field names exactly as written. (You - 30 min in Airtable UI).
4. **Zaal generates a personal access token** scoped to ONLY this workspace + ONLY `data.records:read/write` + `schema.bases:read`. Store in `~/.zao/airtable-crm.env` chmod 600 with var name `AIRTABLE_CRM_TOKEN`. (You - 5 min).
5. **Install `domdomegg/airtable-mcp-server` via `npm install -g`** + absolute binary path (per doc 730 Decision #13, NOT `npx -y`). Configure with `AIRTABLE_CRM_TOKEN`. Restart Claude Code. (Claude or you - 15 min).
6. **First test query: pull last week's GCal events into Airtable.** (Claude - 5 min after step 5). This validates the full loop end-to-end on a low-PII source.
7. **Backfill: import existing `contacts` from already-captured intros** (Shriyash from doc 736, Tyler from 714, Arthur from 711, kmac from 718, Jordan from 719, Cannon from 720/725, etc). (Claude - one-shot, ~30 min).
8. **Wire `/meeting` skill's new CRM-write step** (Flow E above). New PR after the Airtable MCP is dogfooded. (Claude - half-day implementation).
9. **Document the new workflow in `bot/src/zoe/USERGUIDE.md`** so ZOE can describe it to Zaal on demand. (Claude - 15 min).
10. **Set the export cron** (`scripts/airtable-crm-export.ts` weekly to `~/.zao/private/`). Vendor-lock-in escape hatch. (Claude - 1 hour).

Pause and re-validate after step 7 - the backfill will surface schema gaps faster than any spec.

## Also See

- [Doc 712 - ZAO CRM design](../712-zao-crm-coworking-app/) - the Folk-style decision this doc preserves but moves to Airtable storage
- [Doc 713 - meeting tracker + CRM + Bonfire unified](../../dev-workflows/713-zao-ops-meeting-tracker-crm-bonfire/) - the front-door pattern this doc preserves; the storage-layer half supersedes
- [Doc 110 - community directory CRM](../../community/110-community-directory-crm/) - public member directory; orthogonal scope
- [Doc 212 - Vercel + Airtable integrations](../../dev-workflows/212-vercel-integrations-airtable/) - the existing Respect-import Airtable; keep using its `AIRTABLE_TOKEN`, do not conflate
- [Doc 670](../../events/670-iman-call-may18-craig-pizzadao/), [711, 714, 718, 719, 720, 725, 736](../../events/) - source recaps for the backfill contacts
- [Doc 726 - Bonfires teaching another bot](../../identity/726-bonfires-teaching-another-bot/) - knowledge-graph layer that Activity rows link back to via `bonfire_episode_id`
- [Doc 727 - ZOE as agent builder](../../agents/727-zoe-as-agent-builder-supervisor/) - the orchestrator pattern that the agentic ingestion flows ride on
- [Doc 734 - hermes-orchestrator](../../agents/734-hermes-orchestrator-framework/) - downstream: agentic flows could become `PatternAdapter`s once stable
- [Doc 735 - Apple Containerization sandbox](../../agents/735-apple-containerization-sandbox-for-agents/) - relevant once Airtable-writing agents run autonomously
- [PR #666 - private-data perimeter](https://github.com/bettercallzaal/ZAOOS/pull/666) - the file-system + PII rules this CRM rides on top of
- `.claude/rules/pii-hygiene.md` - allowlist + redaction rules for any synthesis leaving Airtable

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Accept Airtable workspace invite (browser, manual) | @Zaal | One-shot | This session |
| Revoke the invite-token link leaked in chat | @Zaal | Security | Immediately after accepting |
| Create base "ZAO CRM" with `contacts` / `activity` / `opportunities` / `source_tags` tables per schema | @Zaal | Airtable UI | Today |
| Generate scoped PAT, store in `~/.zao/airtable-crm.env` chmod 600 as `AIRTABLE_CRM_TOKEN` | @Zaal | Security | Today |
| Install `domdomegg/airtable-mcp-server` via `npm install -g` | @Zaal | Toolchain | After PAT exists |
| First test query - pull last week's GCal events into Airtable | @Claude | MCP query | After MCP installed |
| Backfill contacts from docs 711/714/718/719/720/725/736 | @Claude | One-shot bulk insert | After test query green |
| Wire CRM-write step into `/meeting` skill (Flow E) | @Claude | Skill PR | After backfill validates schema |
| Document workflow in `bot/src/zoe/USERGUIDE.md` | @Claude | Doc PR | After /meeting integration |
| Set weekly `scripts/airtable-crm-export.ts` cron to `~/.zao/private/` | @Claude | Script PR | After integration dogfooded for 7 days |
| Write `project_airtable_crm.md` memory + add to MEMORY.md index | @Claude | Memory | After base created |
| Add `AIRTABLE_CRM_TOKEN` to `.env.example` (placeholder only, no real token) | @Claude | PR | After PAT exists |
| Re-validate schema quarterly; bump `last-validated` | @Zaal | Audit | Every 3 months |

## Sources

- ZAOOS doc 712 (ZAO CRM design) [FULL - read frontmatter + Key Decisions table, confirms Folk-style decision]
- ZAOOS doc 713 (meeting + CRM + Bonfire unified) [FULL - read frontmatter + Key Decisions table, confirms Supabase-only intent that this doc partially supersedes]
- ZAOOS doc 110 (community directory CRM) [FULL - read frontmatter + decisions, confirms scope is public directory not relationship CRM]
- ZAOOS doc 212 (Vercel + Airtable integrations) [FULL - confirms existing AIRTABLE_TOKEN, Respect-import scope, REST API limits]
- ZAOOS doc 670, 711, 714, 718, 719, 720, 725, 736 [PARTIAL - meeting recap headers cross-referenced; not all body content re-read this session, but doc 736 was just authored from a /meeting transcript so structure is fresh]
- Zaal scoping reply (this session, 2026-05-23): "completely different - this is the CRM Airtable... people + activity + opportunities pipeline... can use any or all lets test easiest first" [FULL - direct chat confirmation]
- [domdomegg/airtable-mcp-server](https://github.com/domdomegg/airtable-mcp-server) [PARTIAL - community-standard Airtable MCP referenced as install target; metadata not separately fetched this turn, will verify at install time per Step 5 of adoption plan]
- [Airtable Web API docs](https://airtable.com/developers/web/api/introduction) [PARTIAL - referenced from doc 212 (5 req/sec rate limit confirmed); current PAT scopes documented in Airtable UI not fetched here, verify at PAT generation time]
- PR #666 (private-data perimeter) [FULL - just shipped this session, .gitignore + pii-hygiene.md + ~/.zao/private/ all confirmed]
- ZAOOS codebase audit: `src/app/api/admin/respect-import/route.ts`, `src/components/admin/ImportRespectButton.tsx`, `src/app/api/fractals/analytics/route.ts` [FULL - grep confirmed these are the Respect-Airtable surfaces, separate from the new CRM]
