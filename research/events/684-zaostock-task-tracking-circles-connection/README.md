---
topic: events
type: decision
status: research-complete
last-validated: 2026-05-20
superseded-by:
related-docs: 609, 650, 662, 672, 677, 679, 682
tier: QUICK
---

# 684 — ZAOstock Task Tracking: The Fragmentation + Connecting It to the Six Circles

> **Goal:** Answer "how are ZAOstock todos stored, and can we connect them to the cobuild six circles." Ground truth from code: todos live in three disconnected stores, none of which is linked to a circle. Recommend the FK + the canonical-store split.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | ADD a nullable `circle_id uuid REFERENCES circles(id)` to the ZAOstock `todos` table (and to `sponsors`, `artists`, `timeline`). | This is the missing link. A todo is owned by a *person*, never a *circle*. With `circle_id`, todos roll up to circles - "what does ops have open" becomes a query, not a guess. |
| 2 | DO NOT merge ZAOstock todos into cowork-zaodevz `actions.json`. Reframe the standup's "one tracker". | cowork-zaodevz is a flat 4-person JSON (owner enum = Zaal/Iman/ThyRev/Samantha/Both/Open). It cannot represent the six circles or the wider volunteer team. Dumping ZAOstock todos there loses structure. |
| 3 | Canonical-store split by SCOPE: ZAOstock *event* work -> ZAOstock Supabase `todos` (circle-tagged). Cross-brand *core-team* ops -> cowork-zaodevz `actions.json`. | Two stores, two scopes, one rule each. Not "one big tracker" - one *clear* tracker per kind of work. |
| 4 | RETIRE `Documents/iman/data/actions.json`. It is a stale byte-identical fork of cowork-zaodevz. | Both files have the same `id:"1"` item. Iman's copy stopped at `updatedAt 2026-05-06`; cowork is at `2026-05-14`. "Integrate Iman's tracker" = delete the fork, not merge it. |
| 5 | FIX the `@ZAOcoworkingBot` json-suggest reply - but it is blocked on audit A1 (doc 679). | The bot dumps raw JSON at the user. The fix lives in `agent/` on Iman's VPS, which is NOT committed to the repo. Commit it first, then fix. See "The json-suggest bug" below. |

## How ZAOstock todos are stored today - THREE disconnected stores

| Store | Backend | Written via | Item shape | Scope |
|-------|---------|-------------|-----------|-------|
| **ZAOstock `todos`** | ZAOstock Supabase | `@ZAOstockTeamBot` -> `bot/src/actions.ts` `add_todo` | `title, owner_id, created_by, notes, status (todo/in_progress/done)` | ZAOstock event team |
| **cowork-zaodevz `actions.json`** | GitHub Contents API (`songchaindao-dot/cowork-zaodevz`) | `@ZAOcoworkingBot` (bot on Iman's VPS) | `id, title, owner, status, category, priority, phase, due, notes` | Zaal+Iman+ThyRev+Samantha, all brands |
| **Iman's `actions.json`** | local file `Documents/iman/data/` | unknown / manual | same shape as cowork | stale duplicate of cowork |

Plus, inside ZAOstock Supabase, four more task-shaped tables: `timeline` (milestones, free-text `category`), `meeting_notes`, `suggestions`, `activity_log` (gemba notes + ideas). "What is left with ZAOstock" has no single answer today because the answer is spread across all of these - that IS the problem.

## The cobuild - six circles, and where they are stored

The May 4 cobuild (doc 609) locked six team circles: **finance, host, livestream, marketing, music, ops**. They are real DB rows in ZAOstock Supabase:

- `circles` - `id, slug, name, coordinator_member_id, description` (read by `bot/src/circles.ts`)
- `circle_members` - composite PK `(circle_id, member_id)`
- `team_members` - the people; `todos.owner_id` points here

Commands `/circles /join /leave /mycircles /coordinators /charter` operate on these. The circles are well-modeled - for *team membership*. They carry zero work.

## The disconnect (the answer to "connect the two")

```
todos.owner_id ----> team_members.id <---- circle_members.member_id ----> circles
       (FK exists)                              (FK exists)
todos.circle_id ----> circles.id     <-- THIS FK DOES NOT EXIST
```

- A todo links to a **person**. A person links to **circles**. So todo -> circle is only reachable *through* the owner, and it is **ambiguous**: a member in 3 circles makes the todo un-attributable. You cannot ask "show the ops circle's open work."
- `timeline.category` is a free-text string (`'sponsors|artists|ops|marketing|event|logistics|post'`) that *overlaps* circle slugs but is not a foreign key - it drifts.
- cowork-zaodevz `category` is a different taxonomy entirely (`"Site / Tech"`, Six Sigma `phase`) - no circle concept at all.

Net: the six circles are an org chart with no work attached. The trackers hold work with no circle attached. They were built in separate sessions and never wired together.

## The fix - wire circles into the todo store

1. **Schema:** `ALTER TABLE todos ADD COLUMN circle_id uuid REFERENCES circles(id);` Repeat for `sponsors`, `artists`, `timeline`. Nullable - unassigned work is allowed, it just shows as "uncircled".
2. **Write path:** add an optional `circle` field to the `add_todo` action in `bot/src/actions.ts`. The Hermes LLM parser already infers owner/date - it can infer circle from the todo text, or the user names it. The standup paste-block format can carry `(circle: ops)`.
3. **Read path:** new `/circle <slug>` command in `circles.ts` - lists that circle's open todos + milestones. `buildStatus()` in `status.ts` gains a per-circle breakdown. The bot's 6am digest posts each circle its own slice.
4. **Backfill:** map existing `timeline.category` -> `circle_id`; for `todos`, seed `circle_id` from the owner's single circle where unambiguous, else leave null for triage.

This makes the six circles the spine of *everything* - membership, todos, sponsors, artists, milestones - instead of an unused org chart.

## The json-suggest bug (@ZAOcoworkingBot)

When a user pastes many todos at `@ZAOcoworkingBot`, it replies with the numbered list re-echoed plus a raw ```` ```json-suggest ```` fenced block (`[{"op":"add","title":"...","owner":"Zaal"}]`). That block is bot-internal machinery leaking into the user-facing message.

- The string `json-suggest` does NOT appear in the cowork-zaodevz **web app** (`Documents/cowork/`). It is generated by the bot `agent/` code, which runs on Iman's VPS `187.77.3.104` and is **not committed to the repo** (doc 679 audit finding A1).
- Likely intended design: the bot proposes operations for a downstream applier. The bug is the proposal is shown to the *user* as raw JSON instead of being applied (the bot already has an `/add` path) or rendered as a clean "Added 12 todos" confirmation.
- **The fix cannot be made from this machine** - the bot source is not here. It is blocked on audit A1: commit `agent/` to `cowork-zaodevz` first, then either patch the message handler or route it through the doc 679 Feature B `/code` pipeline. Until then it is an Iman-on-VPS edit.

Correct behavior: a bulk-todo paste should result in the items added and one short confirmation - never a raw JSON block in the chat.

## Also See

- [Doc 609](../609-zaostock-cobuild-six-circles-may4/) - the cobuild, six-circle lock
- [Doc 672](../../agents/672-zaocoworking-bot-audit-postv213/) - @ZAOcoworkingBot audit
- [Doc 677](../../agents/677-bonfire-cowork-github-connection/) - GitHub <-> Bonfire sync
- [Doc 679](../../agents/679-coworking-agent-mentions-code-pipeline/) - cowork bot audit + /code pipeline (audit A1 = uncommitted bot code)
- [Doc 682](../682-zaostock-standup-may19/) - standup that called for tracker consolidation

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `circle_id` FK to `todos` / `sponsors` / `artists` / `timeline` (Supabase migration) | @Zaal | Migration | Before Aug 15 dry run |
| Add optional `circle` to `add_todo` in `bot/src/actions.ts`; LLM-infer or explicit | @Zaal | PR | After migration |
| Add `/circle <slug>` read command + per-circle breakdown in `buildStatus()` | @Zaal | PR | After write path |
| Backfill `circle_id` from `timeline.category` + owner primary circle | @Zaal | Script | After migration |
| Delete `Documents/iman/data/actions.json` - confirm cowork-zaodevz is the survivor | @Zaal / @Iman | Cleanup | This week |
| Commit cowork-zaodevz `agent/` to the repo (closes audit A1, unblocks the json-suggest fix) | @Iman | PR | Before json-suggest fix |
| Fix the `@ZAOcoworkingBot` bulk-paste reply - apply todos + clean confirmation, no raw JSON | @Iman | VPS / PR | After A1 |

## Sources

- ZAOstock bot code: `bot/src/actions.ts` (`add_todo` -> `todos` table), `bot/src/status.ts` (`buildAllOpenTodos`, `buildStatus`), `bot/src/circles.ts` (six-circle commands), `bot/src/capture.ts` (`/gemba /idea /note`)
- `Documents/cowork/data/actions.json` - cowork-zaodevz tracker shape, verified 2026-05-20
- `Documents/iman/data/actions.json` - stale duplicate, `updatedAt 2026-05-06` vs cowork `2026-05-14`, verified 2026-05-20
- Doc 609 (six circles), Doc 679 (cowork bot audit, finding A1 = bot code uncommitted)
