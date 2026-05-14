# SIDEQUESTZ — Design Spec

**Date:** 2026-05-14
**Status:** approved, ready for implementation plan
**Owner:** Zaal
**Origin:** doc 648 (Ryan Kagy sync) — the main-quest / side-quest alignment tool. ZOE's first build project.

## Goal

A goal-alignment layer for ZOE. Zaal sets one **main quest** (his worthy ideal). He adds **side quests** (ambitions, projects, things he wants to do). ZOE scores how well each side quest aligns with the main quest, keeps the **top 3 active**, parks the rest. The main quest + active 3 ride in ZOE's context every turn, so every ZOE interaction is alignment-aware.

For Zaal only, v1. Conversational through ZOE in Telegram. A read-only UI is v2.

## Philosophy

The alignment test comes from Earl Nightingale's "The Strangest Secret" — the text Zaal named as foundational. Success = "the progressive realization of a worthy ideal." A side quest aligns if it is *progressive realization of the worthy ideal* (the main quest). Not a vibe — a testable judgment ZOE makes and explains.

## Architecture

New module `bot/src/zoe/sidequests.ts`, parallel to `bot/src/zoe/tasks.ts`. Standalone — `tasks.json` is untouched (Approach C). No task rollup in v1.

Two storage files under `~/.zao/zoe/`:

- **`main-quest.md`** — the worthy ideal as prose. Markdown, not JSON: it is a paragraph Zaal hand-edits and ZOE reads whole. One main quest, no expiry.
- **`sidequests.json`** — the side-quest pool.

## Data model

```ts
export interface SideQuest {
  id: string;                  // sq-<timestamp>-<rand>
  title: string;
  description: string;
  alignment: number | null;    // 0-10, null = not yet scored
  alignment_reason: string;    // ZOE's one-line "why this score" ('' if unscored)
  status: 'active' | 'parked' | 'done' | 'dropped';
  created_at: string;          // ISO 8601
  updated_at: string;
  scored_at: string | null;
}
```

`main-quest.md` has no schema — freeform markdown. A helper reads it as a string; empty/missing string means "no main quest set yet".

### The `active` mechanic

After every scoring pass, ZOE sorts the pool by `alignment` descending. **Top 3 scored side quests → `status: 'active'`, every other scored side quest → `status: 'parked'`.** `done` and `dropped` are terminal and excluded from ranking. `active` is computed, never hand-set — though Zaal can override by telling ZOE ("keep X active"), which pins it and bumps the lowest active.

Unscored side quests (`alignment: null`) are never `active` — they sort below scored ones and stay `parked` until scored.

## Components

### 1. `bot/src/zoe/sidequests.ts`

Storage + operations. Pure functions over the two files. Exports:

- `readMainQuest(): Promise<string>` — main-quest.md contents, `''` if absent
- `writeMainQuest(text: string): Promise<void>`
- `readSideQuests(): Promise<SideQuest[]>`
- `writeSideQuests(quests: SideQuest[]): Promise<void>`
- `applyQuestOps(ops: QuestOp[]): Promise<QuestOpResult>` — mirrors `tasks.ts` `applyTaskOps`
- `recomputeActive(quests: SideQuest[]): SideQuest[]` — the sort + top-3 assignment, pure
- `buildQuestsBlock(): Promise<string>` — renders the `<quests>` memory block string

### 2. `QuestOp` type (in `bot/src/zoe/types.ts`)

```ts
export type QuestOp =
  | { op: 'set_main'; text: string }
  | { op: 'add'; quest: { title: string; description: string } }
  | { op: 'score'; id: string; alignment: number; reason: string }
  | { op: 'complete'; id: string; outcome?: string }
  | { op: 'drop'; id: string; reason?: string }
  | { op: 'pin'; id: string };   // override: force active
```

### 3. The `<quests>` memory block

Today `memory.ts` `buildMemoryBlocks()` returns `{ persona, human, working, tasks }`. SIDEQUESTZ adds a 5th: `quests`. The injection point is `concierge.ts` `buildSystemBlocks` (the function that assembles the `<persona>...<tasks>` system prompt today) — it gains a `<quests>` section. Block content:

```
<quests>
Main quest: <main-quest.md contents, or "(not set)">

Active side quests (top 3 by alignment):
1. [9/10] <title> - <alignment_reason>
2. [7/10] <title> - <alignment_reason>
3. [6/10] <title> - <alignment_reason>

Parked: <n> more side quests below the active 3.
</quests>
```

This is the core value: ZOE reasons with the worthy ideal loaded on every turn.

### 4. Concierge integration — `quest_ops`

`concierge.ts` already parses a JSON trailer for `task_ops` + `captures`. Extend the trailer schema with `quest_ops: QuestOp[]`. The concierge system prompt gains a SIDEQUESTZ section explaining: when Zaal sets a main quest or adds/manages a side quest, emit `quest_ops`; when a side quest is added or the main quest changes, ALSO emit `score` ops for the affected side quests using the Nightingale test.

`index.ts` `dispatchConcierge` calls `applyQuestOps(result.quest_ops)` after `applyTaskOps`, same pattern.

### 5. `/quest` and `/quests` commands

`index.ts` bot commands, Zaal-only (same `isFromZaal` gate as `/tasks`):

- `/quest` — main quest + active 3 with scores + reasons
- `/quests` — full pool: active 3, then parked (with scores), then unscored, then done/dropped count

Both use `replyChunked` (long-reply-safe).

## Data flow

1. **Set main quest** — Zaal: "my main quest is X". Concierge emits `{op:'set_main',text:'X'}` + `score` ops re-scoring the whole pool. `applyQuestOps` writes `main-quest.md`, applies scores, calls `recomputeActive`. ZOE replies with the new active 3.
2. **Add side quest** — Zaal: "add side quest: Y". Concierge emits `{op:'add',...}` + `{op:'score',...}` for Y. `applyQuestOps` appends, scores, recomputes. ZOE replies: "added — alignment 7/10 because <reason>. Now active #2." (or "parked").
3. **Every concierge turn** — `buildMemoryBlocks` loads `main-quest.md` + active 3, injects `<quests>`. Every ZOE reply is alignment-aware.
4. **`/quest`** — direct read, no LLM turn.

## Error handling

- **No main quest set** — side quests still add, stay `alignment: null`, `status: 'parked'`. ZOE prompts: "saved — set your main quest and I'll score it."
- **Scoring not emitted / LLM omits a score** — side quest persists with `alignment: null`. ZOE states it could not score; next main-quest change or explicit "score my quests" re-runs.
- **`sidequests.json` missing or corrupt** — `readSideQuests` returns `[]`, logs a warning, carries on (mirrors `readTasks`).
- **`main-quest.md` missing** — `readMainQuest` returns `''`; `<quests>` block shows "(not set)".
- **`quest_ops` JSON malformed** — concierge parser already tolerates a bad JSON trailer (logs, returns empty ops); `quest_ops` defaults to `[]`.
- **`score`/`complete`/`drop`/`pin` op with unknown id** — skipped with a `console.warn`, mirrors `applyTaskOps`.

## Testing

Vitest, co-located at `bot/src/zoe/__tests__/sidequests.test.ts`. Mock file I/O with `vi.mock` + `vi.hoisted` per repo test conventions. Cover:

- `recomputeActive` — pure function: 0, 1, 3, 4+ scored quests; unscored excluded; done/dropped excluded; pinned quest forced active
- `applyQuestOps` — each op type: `set_main`, `add`, `score`, `complete`, `drop`, `pin`; unknown-id skip; success + error paths
- `buildQuestsBlock` — no main quest, no side quests, full pool
- The `quest_ops` parse path in `concierge.ts` — valid trailer, missing `quest_ops` key, malformed JSON

LLM judgment (the actual alignment number) is not unit-tested — only the parsing and application of it. Manual acceptance: set a main quest, add 4 side quests, confirm top 3 `active` + 4th `parked`, change the main quest, confirm full re-score.

## Out of scope (v1) — YAGNI

- No UI — v2 read-only view, deferred
- No task ↔ side-quest rollup — v2 (the Approach B end-state)
- No multiple main quests, no time horizons — decided: one, no expiry
- No side quests in the hourly nudge — `nudges.ts` stays task-queue-only for v1; revisit after
- No Nightingale "30-day test" discipline loop — v2
- Not multi-user — Zaal only

## Files touched

| File | Change |
|------|--------|
| `bot/src/zoe/sidequests.ts` | NEW — storage + ops + `recomputeActive` + `buildQuestsBlock` |
| `bot/src/zoe/types.ts` | ADD — `SideQuest`, `QuestOp`, `QuestOpResult` |
| `bot/src/zoe/memory.ts` | EDIT — `buildMemoryBlocks` returns a 5th `quests` block; `MemoryBlocks` interface gains `quests` |
| `bot/src/zoe/concierge.ts` | EDIT — inject `<quests>` into system blocks; parse `quest_ops` from the JSON trailer; system-prompt SIDEQUESTZ section |
| `bot/src/zoe/index.ts` | EDIT — `applyQuestOps` call in `dispatchConcierge`; `/quest` + `/quests` commands |
| `bot/src/zoe/__tests__/sidequests.test.ts` | NEW — unit tests |
| `~/.zao/zoe/main-quest.md` | NEW (runtime, on VPS) — seeded empty on first boot |
| `~/.zao/zoe/sidequests.json` | NEW (runtime, on VPS) — seeded `[]` on first boot |
