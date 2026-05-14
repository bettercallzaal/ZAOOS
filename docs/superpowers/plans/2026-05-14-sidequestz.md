# SIDEQUESTZ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone goal-alignment layer to ZOE — one main quest, a scored side-quest pool, top-3 auto-active, injected into ZOE's context every turn.

**Architecture:** New self-contained module `bot/src/zoe/sidequests.ts` (own storage, own path helpers — no import from `memory.ts`, avoids a circular dependency). `memory.ts` imports `buildQuestsBlock` from it for a new 5th `<quests>` memory block. `concierge.ts` injects `<quests>` and parses a new `quest_ops` JSON-trailer key. `index.ts` applies `quest_ops` and adds `/quest` `/quests` commands. `tasks.json` is untouched (Approach C from the spec).

**Tech Stack:** TypeScript, Node 22, `tsx` runner, `grammy` (Telegram). Tests use the built-in `node:test` runner via `tsx` — the `bot/` package has NO vitest and adding it needs a dependency approval; `node:test` is the zero-dependency equivalent. Spec said "vitest"; this is the only deliberate deviation.

**Spec:** `docs/superpowers/specs/2026-05-14-sidequestz-design.md`

---

## File structure

| File | Responsibility |
|------|----------------|
| `bot/src/zoe/types.ts` | MODIFY — add `SideQuest`, `QuestOp`, `QuestOpResult`; add `quest_ops` to `ConciergeResult` |
| `bot/src/zoe/sidequests.ts` | CREATE — storage primitives, `recomputeActive` (pure), `applyQuestOps`, `buildQuestsBlock`, `formatQuestList` |
| `bot/src/zoe/__tests__/sidequests.test.ts` | CREATE — `node:test` unit tests for the pure + I/O logic |
| `bot/src/zoe/memory.ts` | MODIFY — `MemoryBlocks` gains `quests`; `buildMemoryBlocks` calls `buildQuestsBlock`; `ZOE_PATHS` gains two paths |
| `bot/src/zoe/concierge.ts` | MODIFY — `buildSystemBlocks` injects `<quests>`; `splitReplyAndOps` parses `quest_ops`; `runConciergeTurn` returns them |
| `bot/src/zoe/index.ts` | MODIFY — `applyQuestOps` call in `dispatchConcierge`; `/quest` + `/quests` commands |
| `~/.zao/zoe/persona.md` (VPS, runtime) | DEPLOY — append the SIDEQUESTZ output-format section so ZOE knows to emit `quest_ops` |

**Design notes locked here:**
- `SideQuest` gains a `pinned: boolean` field (the spec's `pin` op needs somewhere to record state; `status` is recomputed each pass so it cannot hold "pinned").
- `complete` and `drop` ops are `{op, id}` only — no `outcome`/`reason` (spec had them optional; `SideQuest` has no `notes[]`, so storing them is dead data — YAGNI, cut).
- No first-boot seeding of `main-quest.md` / `sidequests.json` — the read functions return `''` / `[]` on a missing file, and the write functions `mkdir -p` + create on first write. Functionally equivalent to seeding, less coupling.
- `sidequests.ts` computes its own `ZOE_HOME` (one-line dup of `memory.ts`) so it stays a standalone module and tests can point `process.env.ZOE_HOME` at a temp dir.

---

## Task 1: Types + storage primitives

**Files:**
- Modify: `bot/src/zoe/types.ts`
- Create: `bot/src/zoe/sidequests.ts`
- Create: `bot/src/zoe/__tests__/sidequests.test.ts`

- [ ] **Step 1: Add the SIDEQUESTZ types to `types.ts`**

Append to the end of `bot/src/zoe/types.ts` (after the `selectModel` function):

```typescript

// --- SIDEQUESTZ (doc 648 / spec 2026-05-14) -----------------------------------

export interface SideQuest {
  id: string;                  // sq-<timestamp>-<rand>
  title: string;
  description: string;
  alignment: number | null;    // 0-10, null = not yet scored
  alignment_reason: string;    // ZOE's one-line "why this score" ('' if unscored)
  status: 'active' | 'parked' | 'done' | 'dropped';
  pinned: boolean;             // true = forced active regardless of score
  created_at: string;          // ISO 8601
  updated_at: string;
  scored_at: string | null;
}

export type QuestOp =
  | { op: 'set_main'; text: string }
  | { op: 'add'; quest: { title: string; description: string; alignment?: number; alignment_reason?: string } }
  | { op: 'score'; id: string; alignment: number; reason: string }
  | { op: 'complete'; id: string }
  | { op: 'drop'; id: string }
  | { op: 'pin'; id: string };

export interface QuestOpResult {
  main_quest_set: boolean;
  added: SideQuest[];
  scored: string[];
  completed: string[];
  dropped: string[];
  pinned: string[];
  active: SideQuest[];   // the resulting active set after recompute
}
```

- [ ] **Step 2: Add `quest_ops` to `ConciergeResult` in `types.ts`**

In `bot/src/zoe/types.ts`, in the `ConciergeResult` interface, add the `quest_ops` line right after `task_ops`:

```typescript
export interface ConciergeResult {
  /** Text to reply to user in Telegram */
  reply: string;
  /** Tasks the assistant wants to add or update */
  task_ops: TaskOp[];
  /** Side-quest ops the assistant wants to apply (SIDEQUESTZ) */
  quest_ops: QuestOp[];
  /** Captures to log */
  captures: ZoeCaptureNote[];
  /** Cost stats from Claude CLI call */
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
  durationMs: number;
}
```

- [ ] **Step 3: Write the failing test for storage primitives**

Create `bot/src/zoe/__tests__/sidequests.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Each test points ZOE_HOME at a fresh temp dir. sidequests.ts reads
// process.env.ZOE_HOME lazily (per call), so this works if set before import-use.
async function withTempHome<T>(fn: () => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'sidequests-test-'));
  const prev = process.env.ZOE_HOME;
  process.env.ZOE_HOME = dir;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.ZOE_HOME;
    else process.env.ZOE_HOME = prev;
    await rm(dir, { recursive: true, force: true });
  }
}

test('readMainQuest returns empty string when no file exists', async () => {
  await withTempHome(async () => {
    const { readMainQuest } = await import('../sidequests.ts');
    assert.equal(await readMainQuest(), '');
  });
});

test('writeMainQuest then readMainQuest round-trips trimmed text', async () => {
  await withTempHome(async () => {
    const { readMainQuest, writeMainQuest } = await import('../sidequests.ts');
    await writeMainQuest('  Build the ZAO into a self-running impact network  ');
    assert.equal(await readMainQuest(), 'Build the ZAO into a self-running impact network');
  });
});

test('readSideQuests returns [] when no file exists', async () => {
  await withTempHome(async () => {
    const { readSideQuests } = await import('../sidequests.ts');
    assert.deepEqual(await readSideQuests(), []);
  });
});

test('writeSideQuests then readSideQuests round-trips', async () => {
  await withTempHome(async () => {
    const { readSideQuests, writeSideQuests } = await import('../sidequests.ts');
    const q = {
      id: 'sq-1', title: 'X', description: 'desc', alignment: 5,
      alignment_reason: 'r', status: 'parked' as const, pinned: false,
      created_at: 't', updated_at: 't', scored_at: 't',
    };
    await writeSideQuests([q]);
    assert.deepEqual(await readSideQuests(), [q]);
  });
});

test('readSideQuests returns [] on corrupt JSON', async () => {
  await withTempHome(async () => {
    const { readSideQuests } = await import('../sidequests.ts');
    const { writeFile, mkdir } = await import('node:fs/promises');
    await mkdir(process.env.ZOE_HOME!, { recursive: true });
    await writeFile(join(process.env.ZOE_HOME!, 'sidequests.json'), '{not json', 'utf8');
    assert.deepEqual(await readSideQuests(), []);
  });
});
```

Note: `await import('../sidequests.ts')` inside each test (not a top-level import) is deliberate — `node:test` runs sequentially, and re-importing is cheap; the lazy `questHome()` reads `process.env.ZOE_HOME` per call so the temp dir is honored regardless.

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: FAIL — `Cannot find module '../sidequests.ts'` (file does not exist yet).

- [ ] **Step 5: Create `bot/src/zoe/sidequests.ts` with the storage primitives**

```typescript
/**
 * SIDEQUESTZ — ZOE's goal-alignment layer (spec 2026-05-14, doc 648).
 *
 * Standalone module. Does NOT import from memory.ts (avoids a circular dep:
 * memory.ts imports buildQuestsBlock from here). Computes its own ZOE_HOME.
 *
 * Storage under ~/.zao/zoe/:
 *   main-quest.md     — the worthy ideal, freeform prose
 *   sidequests.json   — the side-quest pool
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SideQuest, QuestOp, QuestOpResult } from './types';

const ACTIVE_LIMIT = 3;

function questHome(): string {
  return process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
}
function mainQuestPath(): string {
  return join(questHome(), 'main-quest.md');
}
function sideQuestsPath(): string {
  return join(questHome(), 'sidequests.json');
}
function newQuestId(): string {
  return `sq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function nowIso(): string {
  return new Date().toISOString();
}

export async function readMainQuest(): Promise<string> {
  try {
    return (await fs.readFile(mainQuestPath(), 'utf8')).trim();
  } catch {
    return '';
  }
}

export async function writeMainQuest(text: string): Promise<void> {
  await fs.mkdir(questHome(), { recursive: true });
  await fs.writeFile(mainQuestPath(), text.trim() + '\n', 'utf8');
}

export async function readSideQuests(): Promise<SideQuest[]> {
  try {
    const raw = await fs.readFile(sideQuestsPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeSideQuests(quests: SideQuest[]): Promise<void> {
  await fs.mkdir(questHome(), { recursive: true });
  await fs.writeFile(sideQuestsPath(), JSON.stringify(quests, null, 2), 'utf8');
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: PASS — 5 tests pass.

- [ ] **Step 7: Commit**

```bash
git add bot/src/zoe/types.ts bot/src/zoe/sidequests.ts bot/src/zoe/__tests__/sidequests.test.ts
git commit -m "feat(sidequestz): types + storage primitives"
```

---

## Task 2: `recomputeActive` — the pure ranking function

**Files:**
- Modify: `bot/src/zoe/sidequests.ts`
- Test: `bot/src/zoe/__tests__/sidequests.test.ts`

- [ ] **Step 1: Write the failing tests for `recomputeActive`**

Append to `bot/src/zoe/__tests__/sidequests.test.ts`:

```typescript

import type { SideQuest } from '../types.ts';

function mkQuest(over: Partial<SideQuest>): SideQuest {
  return {
    id: 'sq-x', title: 'T', description: 'D', alignment: null,
    alignment_reason: '', status: 'parked', pinned: false,
    created_at: 't', updated_at: 't', scored_at: null,
    ...over,
  };
}

test('recomputeActive: empty pool returns empty', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  assert.deepEqual(recomputeActive([]), []);
});

test('recomputeActive: top 3 by alignment go active, rest parked', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 9 }),
    mkQuest({ id: 'b', alignment: 7 }),
    mkQuest({ id: 'c', alignment: 5 }),
    mkQuest({ id: 'd', alignment: 3 }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.a, 'active');
  assert.equal(status.b, 'active');
  assert.equal(status.c, 'active');
  assert.equal(status.d, 'parked');
});

test('recomputeActive: unscored quests are never active', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 8 }),
    mkQuest({ id: 'b', alignment: null }),
    mkQuest({ id: 'c', alignment: null }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.a, 'active');
  assert.equal(status.b, 'parked');
  assert.equal(status.c, 'parked');
});

test('recomputeActive: done and dropped quests are excluded and untouched', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 9, status: 'done' }),
    mkQuest({ id: 'b', alignment: 8, status: 'dropped' }),
    mkQuest({ id: 'c', alignment: 2 }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.a, 'done');
  assert.equal(status.b, 'dropped');
  assert.equal(status.c, 'active'); // only rankable quest -> active
});

test('recomputeActive: a pinned quest is always active even with a low score', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 9 }),
    mkQuest({ id: 'b', alignment: 8 }),
    mkQuest({ id: 'c', alignment: 7 }),
    mkQuest({ id: 'd', alignment: 1, pinned: true }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.d, 'active');           // pinned -> active
  assert.equal(status.a, 'active');           // top score fills a slot
  assert.equal(status.b, 'active');           // second score fills the last slot
  assert.equal(status.c, 'parked');           // bumped out by the pin
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: FAIL — `recomputeActive` is not exported from `sidequests.ts`.

- [ ] **Step 3: Implement `recomputeActive` in `sidequests.ts`**

Append to `bot/src/zoe/sidequests.ts` (after `writeSideQuests`):

```typescript

/**
 * Recompute the active set. Pure — returns a new array, mutates nothing.
 *
 * - done/dropped quests are terminal: status untouched, never active.
 * - pinned quests are always active.
 * - remaining slots (ACTIVE_LIMIT minus pinned count) fill from the
 *   highest-alignment SCORED quests.
 * - every other rankable quest (scored-but-bumped, or unscored) -> parked.
 */
export function recomputeActive(quests: SideQuest[]): SideQuest[] {
  const result = quests.map((q) => ({ ...q }));
  const rankable = result.filter((q) => q.status !== 'done' && q.status !== 'dropped');

  const pinned = rankable.filter((q) => q.pinned);
  const unpinned = rankable.filter((q) => !q.pinned);
  // highest alignment first; unscored (null) sinks to the bottom
  unpinned.sort((a, b) => (b.alignment ?? -1) - (a.alignment ?? -1));

  const slots = Math.max(0, ACTIVE_LIMIT - pinned.length);
  const activeUnpinned = unpinned.filter((q) => q.alignment !== null).slice(0, slots);
  const activeIds = new Set([...pinned, ...activeUnpinned].map((q) => q.id));

  for (const q of rankable) {
    q.status = activeIds.has(q.id) ? 'active' : 'parked';
  }
  return result;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: PASS — all tests pass (10 total now).

- [ ] **Step 5: Commit**

```bash
git add bot/src/zoe/sidequests.ts bot/src/zoe/__tests__/sidequests.test.ts
git commit -m "feat(sidequestz): recomputeActive ranking function"
```

---

## Task 3: `applyQuestOps` — the op applier

**Files:**
- Modify: `bot/src/zoe/sidequests.ts`
- Test: `bot/src/zoe/__tests__/sidequests.test.ts`

- [ ] **Step 1: Write the failing tests for `applyQuestOps`**

Append to `bot/src/zoe/__tests__/sidequests.test.ts`:

```typescript

test('applyQuestOps: set_main writes the main quest', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readMainQuest } = await import('../sidequests.ts');
    const res = await applyQuestOps([{ op: 'set_main', text: 'Ship the ZAO' }]);
    assert.equal(res.main_quest_set, true);
    assert.equal(await readMainQuest(), 'Ship the ZAO');
  });
});

test('applyQuestOps: add with alignment scores immediately and can go active', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const res = await applyQuestOps([
      { op: 'add', quest: { title: 'WaveWarZ Africa', description: 'launch', alignment: 8, alignment_reason: 'direct' } },
    ]);
    assert.equal(res.added.length, 1);
    const stored = await readSideQuests();
    assert.equal(stored.length, 1);
    assert.equal(stored[0].alignment, 8);
    assert.equal(stored[0].status, 'active'); // only quest, scored -> active
    assert.notEqual(stored[0].scored_at, null);
  });
});

test('applyQuestOps: add without alignment stays unscored and parked', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    await applyQuestOps([{ op: 'add', quest: { title: 'Someday thing', description: 'd' } }]);
    const stored = await readSideQuests();
    assert.equal(stored[0].alignment, null);
    assert.equal(stored[0].status, 'parked');
    assert.equal(stored[0].scored_at, null);
  });
});

test('applyQuestOps: score updates an existing quest and recomputes active', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const add = await applyQuestOps([{ op: 'add', quest: { title: 'Q', description: 'd' } }]);
    const id = add.added[0].id;
    const res = await applyQuestOps([{ op: 'score', id, alignment: 9, reason: 'core' }]);
    assert.deepEqual(res.scored, [id]);
    const stored = await readSideQuests();
    assert.equal(stored[0].alignment, 9);
    assert.equal(stored[0].alignment_reason, 'core');
    assert.equal(stored[0].status, 'active');
  });
});

test('applyQuestOps: complete and drop are terminal', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const add = await applyQuestOps([
      { op: 'add', quest: { title: 'A', description: 'd', alignment: 5, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'B', description: 'd', alignment: 6, alignment_reason: 'r' } },
    ]);
    const [idA, idB] = add.added.map((q) => q.id);
    await applyQuestOps([{ op: 'complete', id: idA }, { op: 'drop', id: idB }]);
    const stored = await readSideQuests();
    const byId = Object.fromEntries(stored.map((q) => [q.id, q.status]));
    assert.equal(byId[idA], 'done');
    assert.equal(byId[idB], 'dropped');
  });
});

test('applyQuestOps: pin forces a quest active across recompute', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const add = await applyQuestOps([
      { op: 'add', quest: { title: 'A', description: 'd', alignment: 9, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'B', description: 'd', alignment: 8, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'C', description: 'd', alignment: 7, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'D', description: 'd', alignment: 1, alignment_reason: 'r' } },
    ]);
    const idD = add.added[3].id;
    await applyQuestOps([{ op: 'pin', id: idD }]);
    const stored = await readSideQuests();
    const byId = Object.fromEntries(stored.map((q) => [q.id, q.status]));
    assert.equal(byId[idD], 'active'); // pinned despite alignment 1
  });
});

test('applyQuestOps: unknown id on score is skipped, not thrown', async () => {
  await withTempHome(async () => {
    const { applyQuestOps } = await import('../sidequests.ts');
    const res = await applyQuestOps([{ op: 'score', id: 'sq-nope', alignment: 5, reason: 'r' }]);
    assert.deepEqual(res.scored, []); // skipped silently
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: FAIL — `applyQuestOps` is not exported.

- [ ] **Step 3: Implement `applyQuestOps` in `sidequests.ts`**

Append to `bot/src/zoe/sidequests.ts` (after `recomputeActive`):

```typescript

/**
 * Apply a batch of QuestOps. set_main writes main-quest.md; the rest mutate
 * the side-quest pool. After every batch the active set is recomputed and the
 * pool is persisted. Unknown ids are skipped with a console.warn (mirrors
 * applyTaskOps in tasks.ts) - never throws on a bad id.
 */
export async function applyQuestOps(ops: QuestOp[]): Promise<QuestOpResult> {
  const existing = await readSideQuests();
  const byId = new Map(existing.map((q) => [q.id, q]));
  const res: QuestOpResult = {
    main_quest_set: false,
    added: [],
    scored: [],
    completed: [],
    dropped: [],
    pinned: [],
    active: [],
  };

  for (const op of ops) {
    switch (op.op) {
      case 'set_main': {
        await writeMainQuest(op.text);
        res.main_quest_set = true;
        break;
      }
      case 'add': {
        const ts = nowIso();
        const scored = op.quest.alignment != null;
        const q: SideQuest = {
          id: newQuestId(),
          title: op.quest.title,
          description: op.quest.description,
          alignment: op.quest.alignment ?? null,
          alignment_reason: op.quest.alignment_reason ?? '',
          status: 'parked',
          pinned: false,
          created_at: ts,
          updated_at: ts,
          scored_at: scored ? ts : null,
        };
        byId.set(q.id, q);
        res.added.push(q);
        break;
      }
      case 'score': {
        const q = byId.get(op.id);
        if (!q) {
          console.warn(`[zoe/sidequests] score skipped - id not found: ${op.id}`);
          break;
        }
        q.alignment = op.alignment;
        q.alignment_reason = op.reason;
        q.scored_at = nowIso();
        q.updated_at = nowIso();
        res.scored.push(q.id);
        break;
      }
      case 'complete': {
        const q = byId.get(op.id);
        if (!q) {
          console.warn(`[zoe/sidequests] complete skipped - id not found: ${op.id}`);
          break;
        }
        q.status = 'done';
        q.pinned = false;
        q.updated_at = nowIso();
        res.completed.push(q.id);
        break;
      }
      case 'drop': {
        const q = byId.get(op.id);
        if (!q) {
          console.warn(`[zoe/sidequests] drop skipped - id not found: ${op.id}`);
          break;
        }
        q.status = 'dropped';
        q.pinned = false;
        q.updated_at = nowIso();
        res.dropped.push(q.id);
        break;
      }
      case 'pin': {
        const q = byId.get(op.id);
        if (!q) {
          console.warn(`[zoe/sidequests] pin skipped - id not found: ${op.id}`);
          break;
        }
        q.pinned = true;
        q.updated_at = nowIso();
        res.pinned.push(q.id);
        break;
      }
    }
  }

  const recomputed = recomputeActive(Array.from(byId.values()));
  await writeSideQuests(recomputed);
  res.active = recomputed.filter((q) => q.status === 'active');
  return res;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: PASS — all tests pass (17 total now).

- [ ] **Step 5: Commit**

```bash
git add bot/src/zoe/sidequests.ts bot/src/zoe/__tests__/sidequests.test.ts
git commit -m "feat(sidequestz): applyQuestOps"
```

---

## Task 4: `buildQuestsBlock` + `formatQuestList`

**Files:**
- Modify: `bot/src/zoe/sidequests.ts`
- Test: `bot/src/zoe/__tests__/sidequests.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `bot/src/zoe/__tests__/sidequests.test.ts`:

```typescript

test('buildQuestsBlock: no main quest, no side quests', async () => {
  await withTempHome(async () => {
    const { buildQuestsBlock } = await import('../sidequests.ts');
    const block = await buildQuestsBlock();
    assert.match(block, /Main quest: \(not set\)/);
    assert.match(block, /Active side quests: \(none yet\)/);
  });
});

test('buildQuestsBlock: shows main quest, active ids, and parked count', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, buildQuestsBlock } = await import('../sidequests.ts');
    await applyQuestOps([
      { op: 'set_main', text: 'Ship the ZAO' },
      { op: 'add', quest: { title: 'A', description: 'd', alignment: 9, alignment_reason: 'core' } },
      { op: 'add', quest: { title: 'B', description: 'd', alignment: 7, alignment_reason: 'near' } },
      { op: 'add', quest: { title: 'C', description: 'd', alignment: 5, alignment_reason: 'some' } },
      { op: 'add', quest: { title: 'D', description: 'd', alignment: 2, alignment_reason: 'weak' } },
    ]);
    const block = await buildQuestsBlock();
    assert.match(block, /Main quest: Ship the ZAO/);
    assert.match(block, /Active side quests \(top 3 by alignment\)/);
    assert.match(block, /\[9\/10\] \(sq-.*\) A - core/);
    assert.match(block, /Parked \(1\):/);
  });
});

test('formatQuestList: includes parked and a done/dropped count', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, formatQuestList } = await import('../sidequests.ts');
    const add = await applyQuestOps([
      { op: 'add', quest: { title: 'A', description: 'd', alignment: 9, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'B', description: 'd' } },
    ]);
    await applyQuestOps([{ op: 'complete', id: add.added[0].id }]);
    const out = await formatQuestList();
    assert.match(out, /B/);                 // the unscored/parked quest is listed
    assert.match(out, /Done\/dropped: 1/);  // the completed quest is counted
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: FAIL — `buildQuestsBlock` / `formatQuestList` are not exported.

- [ ] **Step 3: Implement `buildQuestsBlock` and `formatQuestList`**

Append to `bot/src/zoe/sidequests.ts` (after `applyQuestOps`):

```typescript

function scoreLabel(alignment: number | null): string {
  return alignment !== null ? `${alignment}/10` : 'unscored';
}

/**
 * The compact <quests> memory block injected into every concierge turn:
 * main quest + the active 3 (with ids + reasons) + a one-line parked summary.
 * Defensively recomputes active status for display even if sidequests.json
 * was hand-edited.
 */
export async function buildQuestsBlock(): Promise<string> {
  const [main, quests] = await Promise.all([readMainQuest(), readSideQuests()]);
  const ranked = recomputeActive(quests);
  const active = ranked
    .filter((q) => q.status === 'active')
    .sort((a, b) => (b.alignment ?? -1) - (a.alignment ?? -1));
  const parked = ranked.filter((q) => q.status === 'parked');

  const lines: string[] = [];
  lines.push(`Main quest: ${main || '(not set)'}`);
  lines.push('');
  if (active.length === 0) {
    lines.push('Active side quests: (none yet)');
  } else {
    lines.push('Active side quests (top 3 by alignment):');
    active.forEach((q, i) => {
      lines.push(`${i + 1}. [${scoreLabel(q.alignment)}] (${q.id}) ${q.title} - ${q.alignment_reason || 'no reason on file'}`);
    });
  }
  if (parked.length > 0) {
    lines.push('');
    const summary = parked
      .map((q) => `(${q.id}) ${q.title} [${scoreLabel(q.alignment)}]`)
      .join(', ');
    lines.push(`Parked (${parked.length}): ${summary}`);
  }
  return lines.join('\n');
}

/**
 * The fuller /quests view: main quest, active 3 with reasons, every parked
 * quest with its score + reason, and a done/dropped tally.
 */
export async function formatQuestList(): Promise<string> {
  const [main, quests] = await Promise.all([readMainQuest(), readSideQuests()]);
  const ranked = recomputeActive(quests);
  const active = ranked
    .filter((q) => q.status === 'active')
    .sort((a, b) => (b.alignment ?? -1) - (a.alignment ?? -1));
  const parked = ranked
    .filter((q) => q.status === 'parked')
    .sort((a, b) => (b.alignment ?? -1) - (a.alignment ?? -1));
  const terminalCount = ranked.filter((q) => q.status === 'done' || q.status === 'dropped').length;

  const lines: string[] = [];
  lines.push(`Main quest: ${main || '(not set)'}`);
  lines.push('');
  lines.push(`Active (${active.length}):`);
  if (active.length === 0) lines.push('  (none yet)');
  for (const q of active) {
    lines.push(`  [${scoreLabel(q.alignment)}] (${q.id}) ${q.title}`);
    lines.push(`     ${q.alignment_reason || 'no reason on file'}`);
  }
  lines.push('');
  lines.push(`Parked (${parked.length}):`);
  if (parked.length === 0) lines.push('  (none)');
  for (const q of parked) {
    lines.push(`  [${scoreLabel(q.alignment)}] (${q.id}) ${q.title}`);
  }
  lines.push('');
  lines.push(`Done/dropped: ${terminalCount}`);
  return lines.join('\n');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: PASS — all tests pass (20 total now).

- [ ] **Step 5: Commit**

```bash
git add bot/src/zoe/sidequests.ts bot/src/zoe/__tests__/sidequests.test.ts
git commit -m "feat(sidequestz): buildQuestsBlock + formatQuestList"
```

---

## Task 5: Wire the `<quests>` block into `memory.ts`

**Files:**
- Modify: `bot/src/zoe/memory.ts`

- [ ] **Step 1: Add the `buildQuestsBlock` import to `memory.ts`**

In `bot/src/zoe/memory.ts`, after the existing `import type { ZoeTask } from './types';` line (line 22), add:

```typescript
import { buildQuestsBlock } from './sidequests';
```

- [ ] **Step 2: Add `quests` to the `MemoryBlocks` interface**

In `bot/src/zoe/memory.ts`, change the `MemoryBlocks` interface to add a `quests` field:

```typescript
export interface MemoryBlocks {
  persona: string;
  human: string;
  working: string;
  tasks: string;
  quests: string;
  chat_scope: ChatScope;
  chat_title?: string;
}
```

- [ ] **Step 3: Populate `quests` in `buildMemoryBlocks`**

In `bot/src/zoe/memory.ts`, in `buildMemoryBlocks`, change the `Promise.all` destructure and the return.

Replace:
```typescript
  const [persona, human, recentTurns, tasks] = await Promise.all([
    readPersona(),
    readHuman(),
    readRecent(scope),
    readTasks(),
  ]);
```
with:
```typescript
  const [persona, human, recentTurns, tasks, quests] = await Promise.all([
    readPersona(),
    readHuman(),
    readRecent(scope),
    readTasks(),
    buildQuestsBlock(),
  ]);
```

And replace the return line:
```typescript
  return { persona, human, working, tasks: tasksBlock, chat_scope: scope, chat_title: chatTitle };
```
with:
```typescript
  return { persona, human, working, tasks: tasksBlock, quests, chat_scope: scope, chat_title: chatTitle };
```

- [ ] **Step 4: Add the two SIDEQUESTZ paths to `ZOE_PATHS`**

In `bot/src/zoe/memory.ts`, in the `ZOE_PATHS` export object, add two entries:

```typescript
export const ZOE_PATHS = {
  home: ZOE_HOME,
  persona: PERSONA_PATH,
  human: HUMAN_PATH,
  recent_dir: RECENT_DIR,
  archive_dir: ARCHIVE_DIR,
  tasks: TASKS_PATH,
  bootloader: BOOTLOADER_PATH,
  main_quest: join(ZOE_HOME, 'main-quest.md'),
  sidequests: join(ZOE_HOME, 'sidequests.json'),
};
```

- [ ] **Step 5: Verify typecheck passes**

Run: `cd bot && npm run typecheck 2>&1 | grep -v "teams/shared\|agents/newsletter"`
Expected: no NEW errors. (Pre-existing unrelated errors in `src/teams/shared.ts` and `src/zoe/agents/newsletter.ts` are filtered out by the grep and are not our concern.)

- [ ] **Step 6: Commit**

```bash
git add bot/src/zoe/memory.ts
git commit -m "feat(sidequestz): wire <quests> block into memory blocks"
```

---

## Task 6: Wire `<quests>` + `quest_ops` into `concierge.ts`

**Files:**
- Modify: `bot/src/zoe/concierge.ts`
- Modify: `bot/src/zoe/memory.ts` (PERSONA_DEFAULT output-format section)

- [ ] **Step 1: Update the `concierge.ts` type import**

In `bot/src/zoe/concierge.ts`, change the types import line (line 12):

Replace:
```typescript
import type { ConciergeOptions, ConciergeResult, TaskOp, ZoeCaptureNote } from './types';
```
with:
```typescript
import type { ConciergeOptions, ConciergeResult, TaskOp, QuestOp, ZoeCaptureNote } from './types';
```

- [ ] **Step 2: Inject the `<quests>` block in `buildSystemBlocks`**

In `bot/src/zoe/concierge.ts`, in `buildSystemBlocks`, add a `<quests>` section to the returned array. Replace the `<tasks>` block at the end of the array:
```typescript
    `<tasks>`,
    blocks.tasks,
    `</tasks>`,
  ].join('\n');
```
with:
```typescript
    `<tasks>`,
    blocks.tasks,
    `</tasks>`,
    ``,
    `<quests>`,
    blocks.quests,
    `</quests>`,
  ].join('\n');
```

- [ ] **Step 3: Parse `quest_ops` in `splitReplyAndOps`**

In `bot/src/zoe/concierge.ts`, update `splitReplyAndOps`. Change the signature, the parsed-type cast, and the return.

Replace the whole function:
```typescript
function splitReplyAndOps(text: string): { reply: string; taskOps: TaskOp[]; captures: ZoeCaptureNote[] } {
  const match = text.match(OPS_FENCE_RE);
  if (!match) {
    return { reply: text.trim(), taskOps: [], captures: [] };
  }
  const jsonStr = match[1];
  const reply = text.replace(OPS_FENCE_RE, '').trim();
  try {
    const parsed = JSON.parse(jsonStr) as {
      task_ops?: TaskOp[];
      captures?: Array<{ text: string; topic: string }>;
    };
    const captures: ZoeCaptureNote[] = (parsed.captures ?? []).map((c) => ({
      id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: c.text,
      topic: c.topic ?? 'note',
      source: 'dm',
      created_at: new Date().toISOString(),
    }));
    return {
      reply,
      taskOps: parsed.task_ops ?? [],
      captures,
    };
  } catch (err) {
    console.error('[zoe/concierge] failed to parse ops JSON:', (err as Error).message, 'raw:', jsonStr.slice(0, 200));
    return { reply, taskOps: [], captures: [] };
  }
}
```
with:
```typescript
function splitReplyAndOps(text: string): {
  reply: string;
  taskOps: TaskOp[];
  questOps: QuestOp[];
  captures: ZoeCaptureNote[];
} {
  const match = text.match(OPS_FENCE_RE);
  if (!match) {
    return { reply: text.trim(), taskOps: [], questOps: [], captures: [] };
  }
  const jsonStr = match[1];
  const reply = text.replace(OPS_FENCE_RE, '').trim();
  try {
    const parsed = JSON.parse(jsonStr) as {
      task_ops?: TaskOp[];
      quest_ops?: QuestOp[];
      captures?: Array<{ text: string; topic: string }>;
    };
    const captures: ZoeCaptureNote[] = (parsed.captures ?? []).map((c) => ({
      id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: c.text,
      topic: c.topic ?? 'note',
      source: 'dm',
      created_at: new Date().toISOString(),
    }));
    return {
      reply,
      taskOps: parsed.task_ops ?? [],
      questOps: parsed.quest_ops ?? [],
      captures,
    };
  } catch (err) {
    console.error('[zoe/concierge] failed to parse ops JSON:', (err as Error).message, 'raw:', jsonStr.slice(0, 200));
    return { reply, taskOps: [], questOps: [], captures: [] };
  }
}
```

- [ ] **Step 4: Return `quest_ops` from `runConciergeTurn`**

In `bot/src/zoe/concierge.ts`, in `runConciergeTurn`, update the destructure and the returned object.

Replace:
```typescript
  const { reply, taskOps, captures } = splitReplyAndOps(result.text);

  return {
    reply,
    task_ops: taskOps,
    captures,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.totalCostUsd,
    model,
    durationMs: result.durationMs,
  };
```
with:
```typescript
  const { reply, taskOps, questOps, captures } = splitReplyAndOps(result.text);

  return {
    reply,
    task_ops: taskOps,
    quest_ops: questOps,
    captures,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.totalCostUsd,
    model,
    durationMs: result.durationMs,
  };
```

- [ ] **Step 5: Add the SIDEQUESTZ section to `PERSONA_DEFAULT` in `memory.ts`**

In `bot/src/zoe/memory.ts`, in the `PERSONA_DEFAULT` template string, find the `OUTPUT FORMAT:` section. Replace the JSON example block and the line after it:
```
----
\`\`\`json
{
  "task_ops": [
    {"op": "add", "task": {"title": "...", "description": "...", "status": "pending", "priority": "med", "source": "ad-hoc", "notes": []}},
    {"op": "complete", "id": "task-id", "outcome": "..."}
  ],
  "captures": [
    {"text": "verbatim what zaal said worth remembering", "topic": "decision"}
  ],
  "escalate": false
}
\`\`\`

Set "escalate": true ONLY if your current model (Sonnet) cannot answer well and the response should be re-run on Opus. Include "reason" when escalating.

If no ops/captures and no escalation: omit the JSON block entirely.
```
with:
```
----
\`\`\`json
{
  "task_ops": [
    {"op": "add", "task": {"title": "...", "description": "...", "status": "pending", "priority": "med", "source": "ad-hoc", "notes": []}},
    {"op": "complete", "id": "task-id", "outcome": "..."}
  ],
  "quest_ops": [
    {"op": "set_main", "text": "the worthy ideal in Zaal's words"},
    {"op": "add", "quest": {"title": "...", "description": "...", "alignment": 7, "alignment_reason": "one line: how this advances the main quest"}},
    {"op": "score", "id": "sq-id", "alignment": 9, "reason": "..."},
    {"op": "complete", "id": "sq-id"},
    {"op": "drop", "id": "sq-id"},
    {"op": "pin", "id": "sq-id"}
  ],
  "captures": [
    {"text": "verbatim what zaal said worth remembering", "topic": "decision"}
  ],
  "escalate": false
}
\`\`\`

Set "escalate": true ONLY if your current model (Sonnet) cannot answer well and the response should be re-run on Opus. Include "reason" when escalating.

If no ops/captures and no escalation: omit the JSON block entirely.

## SIDEQUESTZ

The <quests> block carries Zaal's main quest (his worthy ideal) and his active side quests. Use it - reason with the main quest loaded on every turn.

When Zaal sets or changes his main quest: emit a "set_main" quest_op. Then emit a "score" quest_op for EVERY existing side quest you can see ids for in the <quests> block - the whole pool re-scores against the new main quest.

When Zaal adds a side quest: emit an "add" quest_op. Include "alignment" (0-10) and "alignment_reason" in the same op - score it immediately using the test below. Tell Zaal the score and whether it landed active or parked.

Alignment test (Earl Nightingale, "The Strangest Secret"): success is the progressive realization of a worthy ideal. A side quest scores HIGH if it directly advances the main quest, LOW if it pulls focus away from it. The score is your honest judgment - explain it in one line. Never fake a number.

ZOE auto-keeps the top 3 by alignment "active", parks the rest. Zaal can override with "pin". Use "complete" when a side quest is done, "drop" when he abandons it.

If no main quest is set yet: still emit "add" ops for side quests, but leave "alignment" off - they stay unscored until the main quest exists.
```

- [ ] **Step 6: Verify typecheck passes**

Run: `cd bot && npm run typecheck 2>&1 | grep -v "teams/shared\|agents/newsletter"`
Expected: no NEW errors.

- [ ] **Step 7: Commit**

```bash
git add bot/src/zoe/concierge.ts bot/src/zoe/memory.ts
git commit -m "feat(sidequestz): inject <quests> + parse quest_ops in concierge"
```

---

## Task 7: Wire `quest_ops` + `/quest` `/quests` into `index.ts`

**Files:**
- Modify: `bot/src/zoe/index.ts`

- [ ] **Step 1: Add the `sidequests` imports to `index.ts`**

In `bot/src/zoe/index.ts`, find the import block. After the existing line:
```typescript
import { applyTaskOps, seedInitialTasks } from './tasks';
```
add:
```typescript
import { applyQuestOps, buildQuestsBlock, formatQuestList } from './sidequests';
```

- [ ] **Step 2: Apply `quest_ops` in `dispatchConcierge`**

In `bot/src/zoe/index.ts`, in `dispatchConcierge`, find:
```typescript
    if (result.task_ops.length > 0) {
      await applyTaskOps(result.task_ops);
    }
```
and add the quest_ops application right after it:
```typescript
    if (result.task_ops.length > 0) {
      await applyTaskOps(result.task_ops);
    }

    if (result.quest_ops.length > 0) {
      await applyQuestOps(result.quest_ops);
    }
```

- [ ] **Step 3: Add the `/quest` and `/quests` commands**

In `bot/src/zoe/index.ts`, find the existing `bot.command('tasks', ...)` handler (around line 160). Add two new command handlers immediately after the `bot.command('seed', ...)` handler ends (after its closing `});`):

```typescript
bot.command('quest', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const block = await buildQuestsBlock();
  await replyChunked(ctx, block);
});

bot.command('quests', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const list = await formatQuestList();
  await replyChunked(ctx, list);
});
```

- [ ] **Step 4: Verify typecheck passes**

Run: `cd bot && npm run typecheck 2>&1 | grep -v "teams/shared\|agents/newsletter"`
Expected: no NEW errors.

- [ ] **Step 5: Run the full test suite to confirm nothing regressed**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: PASS — all 20 tests still pass.

- [ ] **Step 6: Commit**

```bash
git add bot/src/zoe/index.ts
git commit -m "feat(sidequestz): apply quest_ops + /quest /quests commands"
```

---

## Task 8: Final verification + PR

**Files:** none (verification + ship)

- [ ] **Step 1: Full typecheck of the bot package**

Run: `cd bot && npm run typecheck 2>&1 | tail -8`
Expected: only the 4 pre-existing unrelated errors (`src/teams/shared.ts(7,1)` unused directive; `src/zoe/agents/newsletter.ts` 3 errors). No errors in any `sidequests`, `memory`, `concierge`, `index`, or `types` file.

- [ ] **Step 2: Full test run**

Run: `cd bot && npx tsx --test src/zoe/__tests__/sidequests.test.ts`
Expected: PASS — 20/20 tests pass.

- [ ] **Step 3: Manual acceptance smoke test (local, no VPS)**

Run this one-off script to exercise the real flow against a temp dir:
```bash
cd bot && ZOE_HOME=$(mktemp -d) npx tsx -e '
import { applyQuestOps, buildQuestsBlock, formatQuestList } from "./src/zoe/sidequests.ts";
await applyQuestOps([{ op: "set_main", text: "Build the ZAO into a self-running impact network" }]);
await applyQuestOps([
  { op: "add", quest: { title: "Launch WaveWarZ Africa", description: "with Iman", alignment: 8, alignment_reason: "ships the network" } },
  { op: "add", quest: { title: "SIDEQUESTZ v2 UI", description: "read-only view", alignment: 6, alignment_reason: "supports alignment" } },
  { op: "add", quest: { title: "Learn watercolor", description: "hobby", alignment: 2, alignment_reason: "pulls focus" } },
  { op: "add", quest: { title: "Tailscale bridge", description: "Ryan integration", alignment: 7, alignment_reason: "infra for the network" } },
]);
console.log("--- /quest ---"); console.log(await buildQuestsBlock());
console.log(); console.log("--- /quests ---"); console.log(await formatQuestList());
'
```
Expected: main quest prints; the top 3 by alignment (8, 7, 6) show as active with ids + reasons; "Learn watercolor" (2) shows in the Parked summary.

- [ ] **Step 4: Merge latest main + push the branch**

```bash
git fetch origin main
git merge origin/main --no-edit
git push -u origin ws/sidequestz-0514
```
If the push reports the branch already has commits (the spec commit), that is expected — this just adds the implementation commits to the same branch / PR #521.

- [ ] **Step 5: Update PR #521 to cover the implementation**

```bash
gh pr edit 521 --title "SIDEQUESTZ - spec + implementation (ZOE goal-alignment layer)"
```
Then add a comment summarizing what shipped: `gh pr comment 521 --body "Implementation complete: sidequests.ts module + <quests> memory block + quest_ops + /quest /quests commands. 20 unit tests passing. Typecheck clean. Ready for deploy."`

- [ ] **Step 6: Post-merge deploy steps (do NOT run until Zaal merges PR #521)**

These are documented here for the deploy, run after merge:
```bash
# 1. Pull on the VPS
ssh zaal@31.97.148.88 "cd /home/zaal/zao-os && git fetch origin && git reset --hard origin/main"
# 2. Append the SIDEQUESTZ section to the LIVE persona.md so ZOE knows to emit quest_ops
#    (the PERSONA_DEFAULT edit only seeds NEW installs; the live file already exists)
#    Append the same "## SIDEQUESTZ" block from Task 6 Step 5 to ~/.zao/zoe/persona.md
# 3. Restart ZOE
ssh zaal@31.97.148.88 "systemctl --user restart zoe-bot.service && sleep 6 && journalctl --user -u zoe-bot.service -n 6 --no-pager"
# 4. Acceptance: DM ZOE "my main quest is <X>", then "add side quest: <Y>", then /quest
```

---

## Self-review notes

- **Spec coverage:** every spec section maps to a task — data model (T1), `recomputeActive` (T2), `applyQuestOps` (T3), `buildQuestsBlock` + the `/quests` view (T4), the `<quests>` memory block (T5), concierge `quest_ops` + the system-prompt SIDEQUESTZ instruction (T6), `index.ts` apply + commands (T7), tests throughout, deploy in T8.
- **Deliberate deviations from the spec** (all flagged in the header / design notes): `node:test` instead of vitest (bot package has no vitest, adding it needs dependency approval); `SideQuest` gains `pinned: boolean` (the `pin` op needs durable state); `complete`/`drop` ops drop the unused `outcome`/`reason` fields (YAGNI — no `notes[]` on `SideQuest`); no first-boot file seeding (read functions handle absence, write functions create on demand).
- **Type consistency:** `SideQuest`, `QuestOp`, `QuestOpResult` defined once in T1, used identically in T3/T4/T6/T7. `quest_ops` added to `ConciergeResult` in T1, produced in T6, consumed in T7.
- **No placeholders:** every code step shows complete code; every run step shows the command + expected output.
