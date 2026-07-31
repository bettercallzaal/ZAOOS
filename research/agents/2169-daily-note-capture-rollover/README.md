# Doc 2169 - Daily-Note Capture with Auto-Rollover (SPEC, needs Zaal's approval to build)

**Status:** SPEC / DESIGN - not built. This PR is the gate: it changes board (`public.tasks`) conventions + adds a cron, both "ask first" per CLAUDE.md. Approve the PR, then I build it.
**Date:** 2026-07-31
**Owner:** ZOE terminal (doer). Origin: cowork organizer relay, Zaal approved the concept 2026-07-31.
**Related:** [[thread-discipline]] (live ledger), the ZAOcowork board, doc 2105 (measurements-as-evidence incidents), the synthetic-due-date failure that broke the daily 2026-07-31.

---

## The problem (measured, not asserted)

The board captures ~28.3 items/day and closes ~3.4/day (8.3:1). That looks like a productivity gap but it is not: at least ~241 PRs merged across ZAOcowork/ZAOOS/zabalgames/thezao.com-iman-ui in the last 21 days (~11/day, and two repo counts hit the query cap so the real number is higher). Zaal ships ~11/day while the board records 3.4. **The friction is in RECORDING, not working.** So the fix targets capture friction, not discipline.

Two concrete failures this design fixes:

1. **Per-item capture is too heavy.** Every thought becomes a row; rows pile up; nothing closes; the board rots. (100 untriaged `Inbox action:` captures, doc audit 2026-07-31.)
2. **Iman's real asks hide inside one comment.** Grounded in the live data: container #9030 (`30/07/2026 tasks`, `kind='task'`) stores all four of Iman's asks as ONE `metadata.comments[].content` string - `"1. Completion of ZaoDevz webapp 2. Complete ZABAL Gamez UI... 3. Confirm New thezao.com UI 4. Zabal Gamez August Audio"`. `child_count = 0`. Nothing parses those four into anything queryable; ZOE's ack only quotes the first ~60 chars. The asks are invisible on the board surface. A pure comment-based daily note doubles down on exactly this failure - which is why **promotion** (below) is non-negotiable.

## The design (Zaal's, with the two amendments he accepted)

1. **ONE daily note per person per day.** New ideas append to the BOTTOM. Undone items roll to the TOP. You work INSIDE the one note, not by creating rows.
2. **AUTO-rollover, not manual.** At the day boundary a cron creates tomorrow's note, copies every unchecked item to the top, and increments a roll-count on each. Manual rollover is the same bottleneck in a new hat - it MUST be a cron.
3. **Roll-count is the feature.** An item that rolled 7 times is self-evidently "not real, or blocked" - a signal no due date can give, and it cannot be faked (it counts what actually happened). This is the **honest replacement for the synthetic due dates** that broke the daily on 2026-07-31 (52% of dues were backfilled fiction; ranking on them failed).
4. **PROMOTION - the guard.** An item leaves the note and becomes a real task ROW when it matters to someone else. **Promotion is FULLY AUTOMATIC by inference** (Zaal's pick 2026-07-31): the rollover cron scans each item and promotes it if EITHER (a) it @mentions a known person, OR (b) it contains a parseable committed date. Everything else stays in the note and rolls. This keeps the board queryable - counts, really-overdue, brand rollups, and "who is blocked on whom" all still work, because anything that matters to another person is a row.

Cowork's on-record risk, accepted: *"if promotion is manual it will not happen, same as every manual step here."* Fully-automatic inference answers that - zero gestures.

## Data model - REUSE the existing `public.tasks` table (no new table)

The board already has `kind`, `parent_task_id`, `metadata` (jsonb), `owner_id`, `due`, `completed_at`. Iman already emergently uses task rows as daily containers. So we formalize that pattern, we do not build a parallel system (code-restraint: reuse before build).

**A daily note** = a `tasks` row:
- `kind = 'daily_note'`
- `title = 'daily 2026-07-31 - iman'` (person + ISO date)
- `owner_id` = the person; `due` = the note's date
- `metadata.items = [ ... ]` - the note's content, structured (NOT a free-text comment)
- `metadata.note_date = '2026-07-31'`, `metadata.rolled_from = '<yesterday note id>'`

**Each item** in `metadata.items[]`:
```json
{
  "id": "it-<ts>-<rand>",
  "text": "complete ZABAL Gamez UI/UX updates",
  "done": false,
  "roll_count": 0,
  "created_at": "2026-07-31T...",
  "promoted_task_id": null
}
```

- `done` marked by checkbox convention in the UI (`- [x]`), stored as `done:true`.
- `roll_count` increments each time the item survives a rollover unchecked.
- `promoted_task_id` links to the real `tasks` row once the item is promoted (null until then).

**A promoted item** = a normal first-class `tasks` row created from the item (`kind='task'`, `parent_task_id` = the note's id so it is traceable, `created_by` = the note owner, `source='daily_note_promotion'`, `metadata.promoted_from_item` = the item id). The note item keeps rolling as a pointer (`promoted_task_id` set) so the note still shows it, but the queryable truth is the row.

**No DDL required** beyond (optionally) a partial index for fast "today's note per person": `CREATE INDEX ... ON public.tasks (owner_id, (metadata->>'note_date')) WHERE kind = 'daily_note';`. Everything else is a metadata convention on an existing table - which is why this is low-risk and reversible (drop the convention, the rows are still normal tasks).

## The rollover cron (the one piece of new automation)

- **Schedule:** daily at `00:00 America/New_York` (EST/EDT). NOT UTC - UTC midnight rolls at 8pm Zaal's time, which is wrong. The cron host (VPS) clock is UTC, so the job pins TZ explicitly.
- **Idempotent:** keyed on `(owner_id, note_date)` - re-running the same day is a no-op (never double-rolls). This matters because a missed/retried cron must not inflate roll_counts.
- **Steps per person:**
  1. Find yesterday's note (`kind='daily_note'`, that owner, `note_date = yesterday`).
  2. Create today's note (if not already present).
  3. For each item where `done = false`: copy it to today's note at the TOP, `roll_count += 1`.
  4. **Promotion pass** - for each carried item not already promoted: if `text` matches `@<known-person>` OR a parseable date, create a real task row and set `promoted_task_id`. (Known-person list + a conservative date parser; log every promotion; false-positive promotions are cheap to close, a missed real ask is not - bias toward promoting.)
  5. Leave yesterday's note OPEN as the record (do not delete/close - it is the audit trail; roll_count history lives across the chain).
- **Loud, not silent** (per silent-failure-guard): the cron asserts it wrote today's note and logs items rolled + promoted; if it can't reach the DB it exits non-zero and pages, it does not pass green.

## Promotion inference - the rules

- **Person mention:** `@\w+` where the handle resolves to a known board person (iman, zaal, sam, ...). An unknown `@foo` does NOT promote (avoids promoting on a stray `@`).
- **Committed date:** a parseable future date in the text (`2026-08-10`, `Aug 10`, `next Tue`, `tomorrow`). A backfilled/synthetic due is irrelevant here - this reads the TEXT the human wrote, not the `due` column, so it cannot inherit the synthetic-date bug.
- **Bias:** when ambiguous, promote. A wrongly-promoted item is one close; a real ask left rolling in a note is the failure we are fixing.
- Every promotion is logged with the matched reason, so it is auditable (anti-fabrication: the promotion count traces to real matches).

## Migration of the emergent containers

- **#1355** (`27/07/2026 tasks`) - verified fully resolved (zabalgames PR #582 + thezao.com-iman-ui PR #1 both MERGED 2026-07-28; #583 is an intentional draft hold). CLOSE it (in the triage close-SQL already in Zaal's clipboard).
- **#9030** (`30/07/2026 tasks`) - still holds 4 live asks from 07-30. These are being EXTRACTED into 4 real tasks (relayed to cowork) so they are not lost, then #9030 becomes the first migrated daily note (its 4 asks parsed into `metadata.items[]`, the two that @mention or date-match auto-promote).
- **#1259 / #1309** - #1309's asks were resolved/decided 2026-07-28 (close); #1259 is one research ask pending Zaal (carry as an item).
- Going forward, Iman's daily standup IS a daily note - the pattern he invented, formalized.

## Open decisions - all resolved (recorded so the build is unambiguous)

| Decision | Resolution |
|---|---|
| Promotion mechanism | **Fully automatic by inference** (Zaal, 2026-07-31) - @person or a date promotes; else rolls. |
| Roll-count location | Per-item, `metadata.items[].roll_count`. |
| Yesterday's note | Stays OPEN as the record (audit trail); not deleted/closed. |
| Day-boundary timezone | `America/New_York` (EST/EDT), pinned in the cron; never UTC. |
| Done marking | Checkbox `- [x]` -> `metadata.items[].done = true`. |
| New table vs reuse | REUSE `public.tasks` (kind='daily_note' + metadata.items). No parallel system. |

## What "built" means (the follow-up implementation PR, after this spec is approved)

1. The rollover cron (idempotent, EST-pinned, loud-fail) - lives with the other cowork/ZOE cron jobs.
2. The promotion inference function (person + date matchers, logged).
3. Migration of #9030 into the first real daily note; close #1355/#1309 per triage.
4. A thin write path so appending an item to today's note is one gesture (a `note`/`daily` verb alongside the existing `todo` capture), so capture friction actually drops - the whole point.
5. Verification (silent-failure-guard): assert a note is created, items roll, roll_count increments, a seeded `@person` item promotes to a real row. Not "cron exited 0".

## Anti-fabrication note

Everything above is grounded on the live board: the `public.tasks` column list, the actual `metadata` shape of #9030 and #1355 (one-comment-holds-four-asks, `child_count=0`), and the measured capture/close/PR-merge counts. Nothing here is built yet - this is a design/spec. The "241 PRs / 21 days" figure comes from cowork's measurement (flagged as a floor - two repo counts hit its query cap); it is a lower bound, not a precise count.
