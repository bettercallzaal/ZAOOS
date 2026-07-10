# ZOE Bot-Factory MVP - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ZOE run more than one bot from one process, where each bot's brain is an ICM box - proven by minting bot #1 (ZAO Devz).

**Architecture:** One process, many masks. A committed `fleet.ts` registry lists each bot `{ name, tokenEnvVar, icmBoxId, role, audience }`. `memory.ts` gains an ICM-box brain loader. `index.ts` creates one grammy `Bot` per fleet entry and every handler builds memory blocks against that bot's brain. ZOE itself is fleet entry #0 (its brain stays `PERSONA_DEFAULT`, icmBoxId null).

**Tech Stack:** TypeScript (ESM, strict), grammy (Telegram), Node fetch, vitest, tsx runtime. Deployed as the `zoe-bot` systemd user unit on the VPS.

## Global Constraints

- TypeScript strict: no `any`; catch as `unknown`; explicit types on exported functions. (`.claude/rules/typescript-hygiene.md`)
- No `console.log` in production paths - use the existing logger/`console.error`-for-caught-errors pattern already in `bot/src/zoe/`.
- Verify EVERY change with all three: `npm run typecheck` (0 errors), esbuild boot bundle `npx esbuild bot/src/index.ts --bundle --platform=node --format=esm --outfile=/dev/null --packages=external`, and `cd bot && npx vitest run src/zoe/<area>`. tsc-passing alone is NOT enough. (agent-loops rule 1)
- PR-only, never push main, never force-push. Secret-scan every commit (no 64-char hex / `PRIVATE_KEY=` / tokens). ZOE never creates bot accounts/tokens - that is Zaal's manual BotFather step.
- No emojis, no em dashes (hyphens) anywhere, including code comments and commit messages.
- Mask model: exactly ONE process. Do NOT add a systemd unit per bot (decision A, doc 1021).

## Prerequisites (Zaal, manual - not code tasks)

- P1: Create the ZAO Devz Telegram bot in BotFather; get its token. Set it as `ZAODEVZ_BOT_TOKEN` in `bot/.env` on the VPS via the `setting-secrets` skill. (ZOE cannot do this.)
- P2: Confirm bot #1's ICM box id. Reuse the existing thezao box or mint a `zaodevz` box. Put the id in the fleet registry (P2 value feeds Task 5). Not a secret - the box id is public.

---

### Task 1: ICM-box brain loader in memory.ts

**Files:**
- Modify: `bot/src/zoe/memory.ts` (add `fetchIcmBrain`; near the other loaders around `readPersona`)
- Test: `bot/src/zoe/__tests__/icm-brain.test.ts`

**Interfaces:**
- Produces: `export async function fetchIcmBrain(boxId: string, now?: number): Promise<string | null>` - returns the ICM box `llm.txt` body, or `null` on any failure (best-effort). In-memory cache keyed by boxId with a 10-minute TTL.

- [ ] **Step 1: Write the failing test**

```typescript
// bot/src/zoe/__tests__/icm-brain.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchIcmBrain, _resetIcmCache } from '../memory';

const NOW = Date.parse('2026-07-10T12:00:00Z');

beforeEach(() => {
  _resetIcmCache();
  vi.restoreAllMocks();
});

describe('fetchIcmBrain', () => {
  it('returns the llm.txt body on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('# The ZAO\nImpact network.', { status: 200 }),
    );
    const brain = await fetchIcmBrain('icm_abc', NOW);
    expect(brain).toContain('Impact network.');
  });

  it('returns null on a non-200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }));
    expect(await fetchIcmBrain('icm_missing', NOW)).toBeNull();
  });

  it('returns null (never throws) on a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    expect(await fetchIcmBrain('icm_x', NOW)).toBeNull();
  });

  it('serves from cache within the TTL (one fetch for two calls)', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('cached body', { status: 200 }));
    await fetchIcmBrain('icm_c', NOW);
    await fetchIcmBrain('icm_c', NOW + 60_000);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bot && npx vitest run src/zoe/__tests__/icm-brain.test.ts`
Expected: FAIL - `fetchIcmBrain` / `_resetIcmCache` not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `bot/src/zoe/memory.ts`:

```typescript
const ICM_TTL_MS = 600_000; // 10 min
const icmCache = new Map<string, { body: string; at: number }>();

/** Test-only: clear the ICM brain cache. */
export function _resetIcmCache(): void {
  icmCache.clear();
}

/** Fetch an ICM box's llm.txt as a bot brain. Best-effort: null on any failure. */
export async function fetchIcmBrain(boxId: string, now: number = Date.now()): Promise<string | null> {
  const hit = icmCache.get(boxId);
  if (hit && now - hit.at < ICM_TTL_MS) return hit.body;
  try {
    const res = await fetch(`https://useicm.com/api/objects/${encodeURIComponent(boxId)}/llm.txt`, {
      headers: { 'User-Agent': 'ZAO-ZOE-fleet/1.0' },
    });
    if (!res.ok) return null;
    const body = (await res.text()).trim();
    if (!body) return null;
    icmCache.set(boxId, { body, at: now });
    return body;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd bot && npx vitest run src/zoe/__tests__/icm-brain.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck + esbuild, then commit**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"
npm run typecheck
npx esbuild bot/src/index.ts --bundle --platform=node --format=esm --outfile=/dev/null --packages=external
git add bot/src/zoe/memory.ts bot/src/zoe/__tests__/icm-brain.test.ts
git commit -m "feat(zoe): fetchIcmBrain - load an ICM box llm.txt as a bot brain (cached, best-effort)"
```

---

### Task 2: The fleet registry

**Files:**
- Create: `bot/src/zoe/fleet.ts`
- Test: `bot/src/zoe/__tests__/fleet.test.ts`

**Interfaces:**
- Produces:
  - `export interface FleetBot { name: string; tokenEnvVar: string; icmBoxId: string | null; role: string; audience: 'internal' | 'public'; }`
  - `export const FLEET: FleetBot[]` - the committed registry. Entry 0 is ZOE (`icmBoxId: null`).
  - `export function activeFleet(env?: NodeJS.ProcessEnv): FleetBot[]` - only entries whose `tokenEnvVar` is set in env (so an unminted bot is simply skipped, never crashes boot).

- [ ] **Step 1: Write the failing test**

```typescript
// bot/src/zoe/__tests__/fleet.test.ts
import { describe, it, expect } from 'vitest';
import { FLEET, activeFleet } from '../fleet';

describe('fleet registry', () => {
  it('entry 0 is ZOE with no ICM box (its brain stays PERSONA_DEFAULT)', () => {
    expect(FLEET[0].name).toBe('ZOE');
    expect(FLEET[0].icmBoxId).toBeNull();
  });

  it('activeFleet includes a bot only when its token env var is set', () => {
    const env = { ZOE_BOT_TOKEN: 't0', ZAODEVZ_BOT_TOKEN: 't1' } as unknown as NodeJS.ProcessEnv;
    const names = activeFleet(env).map((b) => b.name);
    expect(names).toContain('ZOE');
    expect(names).toContain('ZAO Devz');
  });

  it('activeFleet skips a bot whose token is missing (no crash)', () => {
    const env = { ZOE_BOT_TOKEN: 't0' } as unknown as NodeJS.ProcessEnv;
    expect(activeFleet(env).map((b) => b.name)).toEqual(['ZOE']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bot && npx vitest run src/zoe/__tests__/fleet.test.ts`
Expected: FAIL - `../fleet` does not exist.

- [ ] **Step 3: Write minimal implementation**

```typescript
// bot/src/zoe/fleet.ts
/**
 * The bot fleet registry. One engine, many masks (doc 1021). Each entry is a
 * bot ZOE runs from this single process; its brain is its ICM box (or
 * PERSONA_DEFAULT for ZOE itself). A new bot = a new entry + a token in .env +
 * an ICM box. No new code.
 */
export interface FleetBot {
  name: string;
  tokenEnvVar: string; // env var holding this bot's Telegram token
  icmBoxId: string | null; // ICM box id = brain; null => ZOE's PERSONA_DEFAULT
  role: string;
  audience: 'internal' | 'public';
}

export const FLEET: FleetBot[] = [
  { name: 'ZOE', tokenEnvVar: 'ZOE_BOT_TOKEN', icmBoxId: null, role: 'conductor', audience: 'internal' },
  {
    name: 'ZAO Devz',
    tokenEnvVar: 'ZAODEVZ_BOT_TOKEN',
    icmBoxId: 'ICM_BOX_ID_PLACEHOLDER', // set to the real box id in Task 5
    role: 'zao-devz brand + inbox',
    audience: 'internal',
  },
];

/** Bots whose token is actually present in env - an unminted bot is skipped, not fatal. */
export function activeFleet(env: NodeJS.ProcessEnv = process.env): FleetBot[] {
  return FLEET.filter((b) => {
    const v = env[b.tokenEnvVar];
    return typeof v === 'string' && v.length > 0;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd bot && npx vitest run src/zoe/__tests__/fleet.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck, then commit**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"
npm run typecheck
git add bot/src/zoe/fleet.ts bot/src/zoe/__tests__/fleet.test.ts
git commit -m "feat(zoe): fleet registry - one engine, many masks (activeFleet skips unminted bots)"
```

---

### Task 3: Brain-aware memory blocks

**Files:**
- Modify: `bot/src/zoe/memory.ts` (the block-builder that assembles persona/human/tasks - located via `grep -n "buildMemoryBlocks" bot/src/zoe/memory.ts`)
- Test: `bot/src/zoe/__tests__/brain-override.test.ts`

**Interfaces:**
- Consumes: `fetchIcmBrain` (Task 1).
- Produces: `buildMemoryBlocks` gains an optional last parameter `brain?: { icmBoxId: string | null }`. When `icmBoxId` is non-null, the persona block is the ICM-box body (from `fetchIcmBrain`), falling back to the normal persona if the fetch returns null. When absent/null, behavior is UNCHANGED (ZOE's PERSONA_DEFAULT path).

- [ ] **Step 1: Read the current signature**

Run: `grep -n "export async function buildMemoryBlocks" bot/src/zoe/memory.ts`
Note the exact current parameters (scope: string) and the return shape `{ persona, human, tasks, ... }` so the override is additive and backward-compatible.

- [ ] **Step 2: Write the failing test**

```typescript
// bot/src/zoe/__tests__/brain-override.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMemoryBlocks, _resetIcmCache } from '../memory';

beforeEach(() => { _resetIcmCache(); vi.restoreAllMocks(); });

describe('buildMemoryBlocks brain override', () => {
  it('uses the ICM box body as persona when icmBoxId is set', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('# ZAO Devz\nWe ship the ZAO.', { status: 200 }),
    );
    const blocks = await buildMemoryBlocks('private', { icmBoxId: 'icm_devz' });
    expect(blocks.persona).toContain('We ship the ZAO.');
  });

  it('falls back to the normal persona when the ICM fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
    const blocks = await buildMemoryBlocks('private', { icmBoxId: 'icm_down' });
    expect(blocks.persona.length).toBeGreaterThan(0); // did not blow up; used ZOE persona
  });

  it('is unchanged when no brain override is passed', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    await buildMemoryBlocks('private');
    expect(spy).not.toHaveBeenCalled(); // no ICM fetch on the default ZOE path
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd bot && npx vitest run src/zoe/__tests__/brain-override.test.ts`
Expected: FAIL - `buildMemoryBlocks` does not accept the brain arg / does not fetch.

- [ ] **Step 4: Implement the override**

In `buildMemoryBlocks`, add the optional param and swap the persona source when a box id is present:

```typescript
// signature: add `brain?: { icmBoxId: string | null }` as the last parameter.
// Near where `persona` is currently read (readPersona()):
let persona = await readPersona();
if (brain?.icmBoxId) {
  const icm = await fetchIcmBrain(brain.icmBoxId);
  if (icm) persona = icm; // else keep the ZOE persona as fallback
}
// ...rest of the function unchanged; return { persona, ... } as before.
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd bot && npx vitest run src/zoe/__tests__/brain-override.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Typecheck + full cockpit/zoe tests (no regressions), then commit**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && npm run typecheck
cd bot && npx vitest run src/zoe/
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add bot/src/zoe/memory.ts bot/src/zoe/__tests__/brain-override.test.ts
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "feat(zoe): buildMemoryBlocks brain override - ICM box as persona, ZOE fallback"
```

---

### Task 4: Multi-token poll (the masks) in index.ts

**Files:**
- Modify: `bot/src/zoe/index.ts` (single `new Bot(token)` at ~line 252 + `bot.start()`; handlers register on `bot`)
- Create: `bot/src/zoe/register-handlers.ts` (extract the handler registration so it is reusable per bot)
- Test: `bot/src/zoe/__tests__/register-handlers.test.ts`

**Interfaces:**
- Consumes: `activeFleet` (Task 2), `FleetBot`.
- Produces: `export function registerHandlers(bot: Bot, self: FleetBot): void` - wires the same commands + message handler onto any bot, closing over `self` so every handler can pass `self.icmBoxId` into `buildMemoryBlocks`. `index.ts` then loops `activeFleet()`, constructs a `Bot` per entry, calls `registerHandlers`, and starts each.

- [ ] **Step 1: Read the current handler block**

Run: `sed -n '250,610p' bot/src/zoe/index.ts` - identify every `bot.command(...)` and `bot.on('message:text', ...)` so all of them move into `registerHandlers` verbatim. Note which handlers should stay ZOE-only (e.g. `/cockpit`, `/seed`) vs run on every bot.

- [ ] **Step 2: Write the failing test (wiring only - handlers are integration-tested by boot)**

```typescript
// bot/src/zoe/__tests__/register-handlers.test.ts
import { describe, it, expect, vi } from 'vitest';
import { registerHandlers } from '../register-handlers';
import type { FleetBot } from '../fleet';

const self: FleetBot = { name: 'ZAO Devz', tokenEnvVar: 'ZAODEVZ_BOT_TOKEN', icmBoxId: 'icm_devz', role: 'r', audience: 'internal' };

describe('registerHandlers', () => {
  it('registers a text-message handler and the /start command on the given bot', () => {
    const calls: string[] = [];
    const fakeBot = {
      command: (name: string | string[]) => { calls.push(`cmd:${Array.isArray(name) ? name[0] : name}`); },
      on: (evt: string) => { calls.push(`on:${evt}`); },
    } as unknown as import('grammy').Bot;
    registerHandlers(fakeBot, self);
    expect(calls).toContain('cmd:start');
    expect(calls).toContain('on:message:text');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd bot && npx vitest run src/zoe/__tests__/register-handlers.test.ts`
Expected: FAIL - `../register-handlers` does not exist.

- [ ] **Step 4: Extract handlers into registerHandlers**

Create `bot/src/zoe/register-handlers.ts` exporting `registerHandlers(bot, self)`. Move the command + message handlers from `index.ts` into it verbatim, with two changes: (1) every `buildMemoryBlocks(scope)` call becomes `buildMemoryBlocks(scope, { icmBoxId: self.icmBoxId })`; (2) ZOE-only commands are guarded with `if (self.name === 'ZOE')` before registering. Keep `isFromZaal` gating as-is.

- [ ] **Step 5: Rewire index.ts to loop the fleet**

Replace the single-bot block (~line 252 + the `bot.start()`) with:

```typescript
import { Bot } from 'grammy';
import { activeFleet } from './fleet';
import { registerHandlers } from './register-handlers';

const fleet = activeFleet();
if (fleet.length === 0) {
  console.error('No fleet bots have tokens set (need at least ZOE_BOT_TOKEN)');
  process.exit(1);
}
for (const self of fleet) {
  const t = process.env[self.tokenEnvVar];
  if (!t) continue;
  const b = new Bot(t);
  registerHandlers(b, self);
  b.start({ onStart: () => console.error(`[zoe/fleet] ${self.name} polling`) });
  console.error(`[zoe/fleet] started ${self.name} (brain: ${self.icmBoxId ?? 'PERSONA_DEFAULT'})`);
}
```

Keep the scheduler/cron start-up (posts, cockpit brief) attached to the ZOE entry only, once - do not start it per bot.

- [ ] **Step 6: Run test + typecheck + esbuild boot bundle**

```bash
cd bot && npx vitest run src/zoe/__tests__/register-handlers.test.ts
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && npm run typecheck
npx esbuild bot/src/index.ts --bundle --platform=node --format=esm --outfile=/dev/null --packages=external
```
Expected: test PASS, typecheck 0 errors, esbuild succeeds (this is the real "does it boot" gate).

- [ ] **Step 7: Commit**

```bash
git add bot/src/zoe/index.ts bot/src/zoe/register-handlers.ts bot/src/zoe/__tests__/register-handlers.test.ts
git commit -m "feat(zoe): multi-token poll - one process runs the whole fleet, each bot wears its ICM brain"
```

---

### Task 5: Mint bot #1 (ZAO Devz) + the proof

**Files:**
- Modify: `bot/src/zoe/fleet.ts` (set the real ICM box id from prerequisite P2)

**Interfaces:**
- Consumes: everything above. No new exports.

- [ ] **Step 1: Set the real ICM box id**

In `bot/src/zoe/fleet.ts`, replace `'ICM_BOX_ID_PLACEHOLDER'` with the real box id from prerequisite P2 (e.g. the thezao box `icm_-hsPHePpqX01RovoB_SEqA` or a new zaodevz box). Commit:

```bash
git add bot/src/zoe/fleet.ts
git commit -m "feat(zoe): wire ZAO Devz bot #1 to its ICM box"
```

- [ ] **Step 2: Open the PR (all tasks)**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"
git push origin HEAD:refs/heads/ws/zoe-bot-factory-mvp
# secret-scan the diff first:
git diff origin/main...HEAD | grep -nE '[0-9a-fA-F]{64}|_TOKEN=|PRIVATE_KEY=' && echo ABORT || echo clean
gh api -X POST repos/bettercallzaal/ZAOOS/pulls -f title="feat(zoe): bot-factory MVP - one engine, N ICM-box brains (doc 1021)" -f head="ws/zoe-bot-factory-mvp" -f base="main" -f body="Implements doc 1021 Layer-1 MVP. Verified: typecheck 0, esbuild boot, all src/zoe tests green."
```

- [ ] **Step 3: After merge - deploy + the proof test (needs prerequisite P1 token live on VPS)**

```bash
ssh zaal@31.97.148.88 'cd ~/zao-os && git pull && systemctl --user restart zoe-bot && sleep 8 && systemctl --user is-active zoe-bot && journalctl --user -u zoe-bot -n 8 --no-pager'
```
Expected boot log: `[zoe/fleet] started ZOE` AND `[zoe/fleet] started ZAO Devz (brain: <box id>)`.

- [ ] **Step 4: Run the proof (Zaal, manual)**

DM the new @zaodevz bot a question only its ICM box answers (e.g. "what is ZAO Devz and what does it own?"). DM ZOE the same question. PASS = the ZAO Devz bot answers in-brand from its box AND differently than ZOE. That single result proves "different box = different bot, one engine."

---

## Self-Review

**Spec coverage:** doc 1021 MVP pieces -> Task 1 (ICM brain) + Task 3 (pluggable brain in memory.ts); Task 2 (fleet registry); Task 4 (multi-token poll / one process many masks); Task 5 (mint bot #1 + proof). Human boundary (BotFather token) = prerequisites P1/P2, explicitly not code. Layers 2/3 correctly absent. Covered.

**Placeholder scan:** the only literal placeholder is `ICM_BOX_ID_PLACEHOLDER` in Task 2, resolved in Task 5 Step 1 with the real value from P2 - intentional and closed, not a plan gap.

**Type consistency:** `FleetBot` (Task 2) is consumed unchanged by Tasks 4/5; `fetchIcmBrain` (Task 1) is consumed by Task 3; `registerHandlers(bot, self)` (Task 4) uses `FleetBot`. `buildMemoryBlocks(scope, { icmBoxId })` signature is consistent across Tasks 3 and 4. Consistent.
