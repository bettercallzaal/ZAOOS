---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-17
related-docs: 601, 650, 661
tier: STANDARD
parent-doc: 661
---

# 661b — bot/src/ Sprawl Audit

> **Goal:** Determine whether 17 root-level .ts files should stay at root (shared), move into a subdir (surface-specific), or be deleted (dead code). Audit subdir health (zoe/, hermes/, devz/, teams/) for consistency, tests, and type safety.

## Decision Matrix (17 root files)

| File | LoC | Imported by | Verdict | Action |
|---|---|---|---|---|
| auth.ts | 156 | actions, capture, circles, hermes/commands, index, onepagers, regen, status | KEEP at root (shared) | AUTH LIBRARY - 8 callers across multiple surfaces |
| supabase.ts | 16 | activity, actions, auth, capture, circles, digest, group, llm, onepagers, status (10+) | KEEP at root (shared) | DB SINGLETON - universal dependency |
| activity.ts | 27 | capture, regen, zsfb (3) | KEEP at root (shared) | AUDIT LOG HELPER - 3 callers |
| llm.ts | 63 | actions, index (2) | KEEP at root (shared) | LLM ABSTRACTION - 2 callers, extensible for Claude v1.6 |
| ops.ts | 35 | index (1) | KEEP at root (shared) | DEVOPS ALERTS - single caller but cross-bot utility |
| group.ts | 76 | index, ops, schedule, zoe/index (4) | KEEP at root (shared) | CHAT ROUTING - used by schedule + zoe |
| schedule.ts | 91 | index, zoe/posts/index (2) | MOVE TO zoe/ | DIGEST SCHEDULER - only zoe + root main use it; belongs with digest logic |
| digest.ts | 218 | index, schedule (2) | MOVE TO zoe/ | DIGEST TEMPLATES - paired with schedule.ts; should be zoe/digest/ |
| status.ts | 277 | actions, index (2) | MOVE TO teams/ | STATUS BUILDERS - ZAOstock team dashboard logic, not shared |
| actions.ts | 517 | index (1) | MOVE TO teams/ | NLP ACTIONS - ZAOstock-specific (todos, sponsors, timelines) |
| capture.ts | 90 | index (1) | MOVE TO teams/ | CHAT CAPTURE - gemba/idea/note intake, ZAOstock team feature |
| zsfb.ts | 82 | index (1) | MOVE TO teams/ | FEEDBACK INTAKE - ZAOstock /zsfb command |
| regen.ts | 232 | index (2 via hermes/commands) | KEEP at root (shared) | CODE GENERATION - used by teams/regen via hermes flow |
| circles.ts | 405 | index (1) | MOVE TO teams/ | CIRCLES COMMANDS - Contribution Circles are ZAOstock team feature |
| onepagers.ts | 200 | index (1) | MOVE TO teams/ | ONEPAGERS CMD - cmdOp is ZAOstock team dashboard command |
| index.ts | 616 | (root entrypoint) | KEEP at root | BOT ENTRYPOINT - routing, env setup, main handler |

Summary: 4 files stay at root (truly shared), 8 files move to teams/ (ZAOstock-specific), 2 files move to zoe/ (digest-paired), 2 files stay at root (future-proofed or orchestration).

## Subdir Health

| Subdir | Files | Has index.ts | Has tests | Type issues | Action |
|---|---|---|---|---|---|
| zoe/ (core) | 23 total (11 .ts + 12 nested) | YES (19KB) | 1 test (sidequests.test.ts) | 0 `any`, sound | HEALTHY - entry point exports concierge + scheduler, tests gap is not critical |
| zoe/posts/ | 4 .ts files | No explicit index.ts | 0 tests | 0 type issues | ADD index.ts re-exports; minimal 100-200 LoC post drafters are stable |
| hermes/ | 11 .ts files | NO index.ts | 0 tests | 0 `any`, all returns typed | MISSING index.ts - runner.ts + commands.ts should be exported for index.ts import |
| devz/ | 1 .ts file (index.ts=17KB) | YES | 0 tests | 0 `any` | HEALTHY - single-file payload, hourly tip dispatcher |
| teams/ | 5 .ts files + 2 brand subdirs | YES (3KB) | 0 tests | 0 `any` | HEALTHY - brain/commands/shared/memory/index established pattern |

## Key Findings

### 1. Root Directory Bloat: 8/17 files are ZAOstock-specific

status.ts, actions.ts, capture.ts, zsfb.ts, regen.ts, circles.ts, onepagers.ts, digest.ts should live in teams/ (ZAOstock team coordination namespace) instead of root. This conflates ZAO Festivals bot logic with shared library code. Current structure: root = 3 shared libs + 8 ZAOstock features + 1 digest scheduler + 3 routing/scheduling.

Refactor into:
- bot/src/index.ts: main entrypoint + routing only
- bot/src/teams/: all ZAOstock feature commands (absorb actions, capture, zsfb, circles, onepagers, status, regen)
- bot/src/zoe/: absorb schedule.ts + digest.ts (pair with memory + scheduler)

### 2. hermes/ Missing index.ts

hermes/ has 11 files (runner, coder, critic, pr, git, db, types, commands, claudecli, preflight, pr-watcher) but no index.ts. Runner is the main export; commands is used by root index.ts. Add index.ts:

```typescript
export { dispatchHermesRun, type HermesRun, type DispatchResult } from './runner';
export { cmdFix, cmdFixStatus } from './commands';
```

This enables: `import { dispatchHermesRun } from './hermes'` instead of `'./hermes/runner'`.

### 3. zoe/posts/ Missing index.ts

zoe/posts/ has 4 files (drafters, scheduler, buttons, sources) used by zoe/scheduler + root schedule.ts. Add minimal index.ts:

```typescript
export { postDrafter } from './drafters';
export { schedulePostBatch } from './scheduler';
```

### 4. Type Safety: All Clear

- 0 uses of `any` (only 1 false positive in comment)
- 0 functions with missing return types
- supabase.ts, activity.ts, auth.ts properly typed
- hermes/ fully typed, no unknowns

### 5. Test Coverage: 1 test across 40+ files

Only zoe/__tests__/sidequests.test.ts exists. No tests for:
- auth.ts (cascade resolution logic, username normalization)
- activity.ts (Supabase insert)
- actions.ts (NLP parsing, action execution)
- teams/ (commands, brain, shared)
- hermes/ (runner, coder, critic)

This is acceptable for now (bot is stable, single-operator use), but flag for future.

## Recommended Refactor (P1)

1. **Move 8 files to teams/** (effort: 8 edits + grep-replace imports):
   - Root/teams imports: actions, capture, zsfb, circles, onepagers, status -> teams/
   - Zoe doesn't import these; only root index.ts and teams/commands.ts reference them
   - Owner: code audit (no new logic)
   - By-when: next sprint cleanup, non-blocking

2. **Move schedule + digest to zoe/** (effort: 3 edits):
   - zoe/digest.ts, zoe/scheduler.ts (move from root)
   - pairs with zoe/memory.ts + zoe/scheduler.ts structure
   - Owner: code audit
   - By-when: same sprint as #1

3. **Add hermes/index.ts** (effort: 1 file):
   - Re-export runner, commands, types
   - Owner: code audit
   - By-when: same sprint as #1

4. **Add zoe/posts/index.ts** (effort: 1 file):
   - Re-export drafters, scheduler
   - Owner: code audit
   - By-when: same sprint as #1

Post-refactor structure:
```
bot/src/
  index.ts (main, 100 LoC routing only)
  supabase.ts (16 LoC)
  auth.ts (156 LoC shared)
  activity.ts (27 LoC shared)
  llm.ts (63 LoC shared)
  ops.ts (35 LoC shared)
  group.ts (76 LoC shared)
  regen.ts (232 LoC shared - code generation)
  zoe/
    index.ts (entry, concierge)
    digest.ts (moved from root)
    scheduler.ts (moved, pairs digest)
    memory.ts (Letta brain)
    ... (12 other files)
  teams/
    index.ts (ZAOstock bot entry)
    commands.ts (10KB, /circles /join /mycircles etc)
    brain.ts (2.8KB, Claude brain for team ops)
    shared.ts (5.7KB, shared helpers)
    memory.ts (5KB, Letta memory)
    actions.ts (moved from root, 517 LoC)
    capture.ts (moved, 90 LoC)
    zsfb.ts (moved, 82 LoC)
    circles.ts (moved, 405 LoC)
    onepagers.ts (moved, 200 LoC)
    status.ts (moved, 277 LoC)
    regen.ts (NO - stays in bot/src/)
  hermes/
    index.ts (NEW, re-exports)
    runner.ts (1.2KB)
    ... (10 other files)
  devz/
    index.ts (17KB single file, OK)
```

## Sources

Inspected:
- bot/src/: 16 root .ts files
- bot/src/zoe/: index.ts (19KB), 12 modules, 1 test
- bot/src/hermes/: 11 files, no index.ts
- bot/src/devz/: 1 file (index.ts)
- bot/src/teams/: 5 files + brand subdirs, index.ts present
- Import graph: full grep scan for `from './...'` patterns across all subdirs
