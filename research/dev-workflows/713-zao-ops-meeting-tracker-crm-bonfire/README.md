---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-22
superseded-by:
related-docs: 712, 692, 650, 668, 673, 676, 680
original-query: "here is how I'm doing the meetings - I want it to combine kinda and also include the bonfires as part of it. /zao-research this implementation idea, think through it, brainstorm, make suggestions, grill if needed."
tier: STANDARD
---

# 713 — ZAO Ops: meeting capture unified into the tracker + CRM + Bonfire

> **Goal:** Combine the four disconnected operational pieces - the `/meeting` skill, the cowork tracker, the CRM (doc 712), and Bonfire - into one system: one capture, one queue, one memory.

## Key Decisions

| Decision | Recommendation | Why |
|----------|---------------|-----|
| The combine | `/meeting` becomes the **front door** of the cowork system. A meeting writes tasks + contacts + a meeting record + Bonfire episodes to **one Supabase**. | A meeting *is* an ingestion event of the same shape as everything else. All four pieces already share one DB. |
| Capture model | **Automatic, zero-confirm.** Meeting output lands without an approval step. | Zaal (grill answer): meeting action items currently "die in the recap doc" - the whole point is they auto-appear, waiting. |
| Landing zone | Meeting actions land in an **Inbox** - a triage holding state, not the main board. | Grill answer (b): a clean "here is what came in since last time" list beats silently bloating the board. |
| New task status | Add **`WAITING`** - waiting on someone out-of-org. Distinct from `BLOCKED` (stuck) and `TODO` (assigned in-org). With a dedicated "Waiting On" list view. | Grill answer: external-owned meeting actions are real follow-through but are not your todos until stale. |
| `/meeting` -> tracker | **Re-point `/meeting`'s task write from `actions.json` to the Supabase `tasks` table.** This is the literal combine point. | `/meeting` still writes the dead GitHub-JSON store; the tracker migrated to Supabase (doc 692). They are disconnected today. |

## Findings

**1. The four pieces are disconnected today - and one is writing to a dead store.**

- `/meeting` skill — transcribes, runs 5-pass extraction (decisions/actions/quotes/people), routes to: a `research/events/` recap doc, `actions.json`, Bonfire, memory, Telegram.
- Cowork tracker — `tasks` on Supabase (doc 692), bot + web board.
- CRM (doc 712) — `contacts`/`contact_log`/`meeting_notes` tables exist, empty, unsurfaced.
- Bonfire — the knowledge graph.

The break: **`/meeting` writes task output to `actions.json` (the old GitHub-JSON backend). The tracker migrated to Supabase.** `/meeting` writes where the tracker no longer reads - which is why the parallel session "HELD the tracker write" on the Arthur call. Re-pointing `/meeting` to the Supabase `tasks` table is step one.

**2. The four pieces are the same shape - a meeting produces all of them.**
The Arthur intro call (doc 711) is the worked proof:

| Meeting output | Lands as |
|----------------|----------|
| 6 action items | `tasks` in the **Inbox**, owner pre-filled |
| Actions owned by Arthur (external) | `tasks` status `WAITING`, `contact_id` = Arthur |
| Arthur (a new person) | a `contact` (type: partner) + a `contact_log` touch |
| The call itself | a `meeting_notes` row |
| Decisions + quotes + the recap | Bonfire episodes (the recall layer) |

**3. The Inbox and `WAITING` are two different axes - keep them orthogonal.**
- **Inbox** = a *triage* state: "freshly captured, not yet sorted." Best as a boolean flag (`inbox: true`) on the task, NOT a status. A fresh meeting task = `inbox: true`, status `TODO`. Triaging clears the flag.
- **`WAITING`** = a *status*, alongside TODO / WIP / BLOCKED / DONE. For triaged tasks where the ball is in an out-of-org person's court.

Keeping them separate keeps the status enum clean (5 values) and the Inbox a simple sweep queue.

**4. Bonfire is the memory layer, not a second source of truth.**
Supabase holds the structured records (tasks, contacts, meetings). Bonfire mirrors decisions/quotes/episodes as a *graph for recall* ("what did Arthur say about agent security?"). The cowork app's Assistant tab queries Bonfire. Supabase is always the source of truth; Bonfire is the searchable memory.

## The combined system

```
CAPTURE        /meeting (recordings)   +   bot (Telegram NL)   +   web add-task
                              |  |  |
                              v  v  v
STORE          one Supabase:  tasks  ·  contacts  ·  contact_log  ·  meeting_notes
                 tasks.status: TODO / WIP / BLOCKED / WAITING / DONE
                 tasks.inbox:  true = freshly captured, awaiting triage
                 tasks.contact_id -> contacts
                              |
                              v
MEMORY         Bonfire  <- decisions, quotes, meeting episodes (recall layer)
                              |
                              v
SURFACE        cowork app:  Board  ·  Inbox lane  ·  Waiting On list  ·  Contacts tab  ·  Assistant (queries Bonfire)
```

**The daily loop it produces:** Zaal finishes a meeting -> `/meeting` runs -> actions, contacts, the meeting record, and Bonfire episodes all land automatically. Later, Zaal opens the board to "knock out todos" -> the **Inbox** shows "N captured since last time" -> a quick triage sweep -> work the board. The **Waiting On** list shows what is in other people's courts. Nothing dies in a recap doc.

## Build order

1. **Re-point `/meeting` -> Supabase `tasks`.** Smallest, highest-leverage step - instantly connects meeting capture to the live tracker. Tag each task `inbox: true`, `metadata.source = meeting:<doc>`.
2. **Add the `WAITING` status + `inbox` flag** to `tasks` - schema + the bot status enum + the web board columns.
3. **Build the CRM** (doc 712): `contacts` table + `tasks.contact_id`.
4. **Wire `/meeting` full output**: actions -> Inbox tasks; external-owner actions -> `WAITING` + `contact_id`; people -> `contacts` + `contact_log`; the call -> `meeting_notes`; decisions/quotes -> Bonfire episodes.
5. **Web surfaces**: an Inbox lane, a Waiting On list, the Contacts tab.
6. Drop `/meeting`'s Phase 3 confirm for the auto-land path (Zaal chose zero-confirm); keep a one-line "N items captured" notice.

## Open questions (not yet grilled - resolve before step 4)

- **Contact auto-creation noise:** every named person in a meeting -> a contact, or only the meeting's main external party? Lean: only people the meeting clearly treats as a real contact; one-off mentions stay in the recap text.
- **Whose meetings flow in:** only Zaal's `/meeting` runs, or should the team drop recordings to the bot? If the team, meeting capture has to move into the bot, not stay a terminal skill.

## Also See

- [Doc 712](../../business/712-zao-crm-coworking-app/) — the ZAO CRM (the `contacts` layer this system writes to).
- [Doc 692](../../) — the unified Supabase schema (`tasks` + the 13-table greenfield).
- [Doc 650](../../) / [Doc 668](../../) — the cowork tracker + ZAOcoworkingBot.
- [Doc 673](../../) / [Doc 676](../../) / [Doc 680](../../) — the `/meeting` skill + Bonfire integration.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Re-point `/meeting` task write to Supabase `tasks` | @Zaal | PR (skill + ZAOcowork) | First build session |
| Migration: `tasks.status` += `WAITING`, `tasks.inbox` boolean | @Zaal | PR to ZAODEVZ/ZAOcowork | With step 1 |
| Build the CRM (`contacts` + `tasks.contact_id`) per doc 712 | @Zaal | PR | After the schema change |
| Wire `/meeting` to write Inbox tasks + contacts + meeting_notes | @Zaal | Skill update | After the CRM |
| Web: Inbox lane + Waiting On list + Contacts tab | @Zaal | PR | After the wiring |

## Sources

- [Doc 711](../../events/711-arthur-wavewarz-base-call-may19/) — the Arthur intro call: worked example of meeting -> tasks/contacts/decisions. [FULL]
- [Doc 712](../../business/712-zao-crm-coworking-app/) — the ZAO CRM research this builds on. [FULL]
- The `/meeting` skill (`.claude/skills/meeting/SKILL.md`) — current pipeline + the `actions.json` write. [FULL - read in session]
- `db/schema.sql` (thezao-tracker) + Supabase `list_tables` — confirmed `tasks` + the 5 empty CRM tables. [FULL]
- Grill answers from Zaal, 2026-05-22 (this session) — capture model, Inbox lane, `WAITING` status. [FULL]
