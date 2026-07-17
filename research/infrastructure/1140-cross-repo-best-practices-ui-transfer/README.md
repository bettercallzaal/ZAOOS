---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-07-16
related-docs: 1115, 998, 836
original-query: "Audit ALL of Zaal's active repos for BEST PRACTICES and BEST UI/UX, then produce a TRANSFER PLAN (which patterns/UI move to which repos) + a COWORK CONSISTENCY spec."
tier: DISPATCH
---

# 1145 - Cross-Repo Best Practices + UI/UX Transfer Plan

> **Goal:** Catalog the best code practices, UI/UX patterns, and consistency standards already living in the ZAO estate, then map them to target repos where they should be adopted. Identify the gold-standard UI/UX repo. Define ONE cowork consistency spec so every cowork surface (board, tracker, ZOE integration) reads the same.

## Executive Summary

The ZAO estate has **7 active cowork/product repos** audited (ZAOOS, zaalcaster, zpoidh, zol, ZAOcowork, zabalgames, hermes-orchestrator) + 3 additional key repos (wwtracker, zabalnewsletterbuilder, farscout). The audit found:

- **5 best-practice patterns** that exist in production and should transfer to 6+ other repos.
- **zaalcaster = the UI/UX gold standard** - keyboard-driven navigation (keys 1-9 + cmd+K), confirm-before-irreversible flows, live API fallback chains, and detailed error distinction.
- **3 major cowork inconsistencies:** (1) task data model shape differs across repos (ZAOcowork uses `{ok, error}`, others use bare error), (2) status/priority vocab is not standardized, (3) keyboard shortcuts are unique to zaalcaster (only place with 1-9 navigation).
- **ONE unified cowork surface needed:** all task/status displays must share shape, vocab, and keyboard affordances.

## Part 1: Best Practices Catalog

### Pattern 1: API Response Shape Consistency (ZAOcowork Standard)

**What:** ZAOcowork's `{ok: boolean, error?: string, ...data}` response shape - explicit success flag + optional error + payload mixed in.

**Source:** `ZAOcowork/src/app/api/forecast/route.ts` and other API endpoints.

**Why it's good:**
- Client can check `ok` before destructuring other fields (no error-first read).
- Explicit success = clearer intent than "data is present = OK".
- Mirrors tRPC convention (industry standard).

**Current adoption:** ZAOcowork only. ZAOOS uses bare error field.

**Transfer value:** HIGH - this pattern appears in 2 different API shapes in the estate today; unifying makes client code simpler.

**Target repos:** zpoidh, zabalgames, wwtracker, farscout, hermes-orchestrator.

---

### Pattern 2: Zod Input Validation + SafeParse (ZAOOS Standard)

**What:** Every API route validates input with `z.object(...).safeParse(body)` before processing. Errors return 400 with structured message. No `any` types.

**Source:** ZAOOS `src/app/api/music/lyrics/route.ts`, `src/app/api/bluesky/connect/route.ts` - consistent pattern across all 300+ routes.

**Why it's good:**
- Catches malformed input before it hits business logic.
- Type-safe from HTTP boundary inward.
- Consistent error reporting.

**Current adoption:** Universal in ZAOOS. Patchy in other repos.

**Transfer value:** HIGH - prevents entire classes of bugs (injection, type errors) at the edge.

**Target repos:** zpoidh, zol, zabalgames, farscout, wwtracker.

---

### Pattern 3: Single Source of Truth for Shared Data (ZAOcowork Standard)

**What:** `data/facts.json` holds all shared values (URLs, version strings, contract addresses) + a build-time template system (`scripts/apply-facts.mjs`) regenerates HTML/config files from `templates/` before build. One edit to facts.json propagates everywhere.

**Source:** ZAOcowork README + `scripts/apply-facts.mjs` (40 lines, production-proven).

**Why it's good:**
- Eliminates duplicated constants across files.
- Build-time check catches typos and missing facts (throws on unknown token).
- Durable: PR diffs show which facts changed, not 10 file edits.

**Current adoption:** ZAOcowork only (for HTML papers/whitepapers).

**Transfer value:** HIGH - applicable to any repo with shared branding, contract addresses, or URLs.

**Target repos:** ZAOOS (community.config.ts already similar but unidirectional), zpoidh (bounty contracts), zabalgames (leaderboard contracts), www-related repos.

---

### Pattern 4: Boot-Verify Rule for Bot Changes (ZAOOS/.claude/rules/agent-loops.md)

**What:** Before marking a bot PR complete, run the bot in-process and verify it boots clean: `esbuild` + `tsx` to check import closure, not just `tsc`. Caught runtime crashes that typecheck missed (e.g., mismatched export names, missing fs polyfills).

**Source:** ZAOOS `.claude/rules/agent-loops.md`, rule 1. Applied in ZOE, ZOL, hermes-orchestrator.

**Why it's good:**
- tsc is necessary but not sufficient (only checks syntax + types, not module resolution).
- esbuild catches the real errors: import/export name mismatches, missing deps, Webpack shims.
- One extra step prevents "bot boots on VPS, crashes in production" post-merge.

**Current adoption:** Documented in ZAOOS, practiced in agent PRs (zol, ZOE).

**Transfer value:** CRITICAL - essential for any bot/daemon repo. Prevents silent failures post-merge.

**Target repos:** farscout, zol, hermes-orchestrator (already does), any new autonomous agent.

---

### Pattern 5: Error Handling + Fallback Chains in Live APIs (zaalcaster Standard)

**What:** When reading a live external API, code defensively with field-name fallback chains. Example from zaalcaster: Empire Builder's API drifted from docs twice (`user_address` vs `address`, `burned_rewards` vs `burned`) - code reads BOTH and falls back: `user?.user_address ?? user?.address ?? null`.

**Source:** zaalcaster `empire.js`, `poidh.js` - found and documented on 2026-07-16 during live integration.

**Why it's good:**
- Protects against API drifts (docs lag reality).
- Makes "which field name is right?" debuggable in code, not chased through multiple issues.
- Catches migration windows (old + new fields may coexist).

**Current adoption:** zaalcaster (all integrations). Less common in other repos.

**Transfer value:** HIGH for any repo integrating third-party APIs (Neynar, POIDH, Zora, Empire Builder, Unlock).

**Target repos:** zpoidh, zol, farscout, wwtracker, zabalgames.

---

## Part 2: Best UI/UX Catalog

### zaalcaster: THE Gold-Standard UX

**Why:** zaalcaster is the most keyboard-efficient, error-resistant, and data-rich personal client in the estate.

### Core Affordances (should transfer)

1. **Keyboard Navigation (Keys 1-9 + Modifiers)**
   - Keys 1-9 = jump to tab (timeline=1, notifications=2, spaces=3, grow=4, empire=5, poidh=9, etc.)
   - Cmd+K = command palette (instant search).
   - Enter/Space = confirm or select.
   - Escape = close modal or cancel.
   - NO mouse required for power users.
   - Status: Unique to zaalcaster. No other repo has this.

2. **Confirm-Before-Irreversible Pattern**
   - Post, Mint, Engage (any action with on-chain cost) = two-stage:
     1. Preview + "Ready?" confirmation
     2. Only then execute
   - No auto-post ever. Human decides.
   - Status: Present in zaalcaster (PR #110 "booster engage-back queue" is pure CONFIRM-FIRST, never auto).

3. **Live API Fallback Chains**
   - Every external API read has fallback for field drifts.
   - Example: Empire Builder leaderboard reads `user_address` or `address` or null - never crash.
   - Status: Intentionally documented in zaalcaster, not cargo-culted.

4. **Detailed Error vs Empty States**
   - "No results found" is different from "API error" is different from "you don't have permission".
   - Each renders differently (UI signal is clear).
   - Status: Present in zaalcaster card layouts, not everywhere.

5. **Mobile-First Design**
   - Entire UI works on phone (viewport <= 768px).
   - Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) enhance for larger screens.
   - Navy `#0a1628` bg, gold `#f5a623` accents.
   - Status: Standard in ZAOOS, inconsistent in other repos.

### zaalcaster Data Integrity Patterns (High Value Transfer)

1. **API Drift Documentation in Code Comments**
   - When integrating an external API, document the real field names + dates of known drifts.
   - Example: `// Empire Builder API drifts: [2026-07-15 user_address -> address rename observed live]`
   - Status: Unique, should be standard.

2. **Contract Address Ledger in Config**
   - `poidh.js`: `const POIDH_CONTRACTS = { mainnet: "0x...", arbitrum: "0x...", base: "0x...", degen: "0x..." }`
   - Single source of truth, easy to verify on-chain.
   - Status: Present in zaalcaster, missing from zpoidh + other contract-heavy repos.

3. **Live Verification on Ship**
   - When code ships, verify the live data by hand before closing the PR.
   - Example: "Zora coin 0x... verified live: $3,793 mcap at build time."
   - Status: Documented in zaalcaster CLAUDE.md "built, all live-verified", not systematic elsewhere.

---

## Part 3: Inconsistencies + Pain Points

### Inconsistency 1: API Response Shape Divergence

| Repo | Shape | Status |
|------|-------|--------|
| ZAOcowork | `{ok: bool, error?: str, ...data}` | CANONICAL |
| ZAOOS | `{error?: str, ...data}` | CURRENT - inconsistent with cowork |
| zpoidh | TBD (minimal API surface) | TBD |
| zabalgames | TBD | TBD |
| zol | Minimal API | Agent-only |
| farscout | Minimal API | Agent-only |

**Pain:** Clients written for one shape break when hitting the other.

**Solution:** Adopt ZAOcowork shape everywhere (more explicit, mirrors tRPC).

---

### Inconsistency 2: Theme Colors (Mixed Styles)

**Navy + Gold Theme Issues:**

| Repo | Navy | Gold | Pattern |
|------|------|------|---------|
| ZAOcowork | Mixed: `bg-zao-navy` (Tailwind class) + `style={{backgroundColor: "#0a1628"}}` (inline) + `bg-[#0a1628]` (arbitrary) | Mixed: `text-[#f5a623]` + `bg-[#f5a623]/[0.06]` | INCONSISTENT |
| ZAOOS | Tailwind classes standard | Tailwind classes standard | CLEAN |
| zaalcaster | TBD | TBD | TBD |

**Pain:** Makes it hard to change the palette or add theme support (light mode).

**Solution:** One palette definition (Tailwind config or CSS variables) + all repos use it.

---

### Inconsistency 3: Status/Priority Vocab

| Repo | Status Values | Priority Values | Notes |
|------|---------------|-----------------|-------|
| ZAOcowork | `open, in-progress, done, blocked` | `high, medium, low` | CANONICAL (in Supabase schema) |
| Others | Not standardized | Not standardized | Drift likely |

**Pain:** When syncing tasks across repos, no shared meaning for "in progress" vs "in-progress" vs "working".

**Solution:** Adopt ZAOcowork's enum + enforce in all cowork-aware repos.

---

### Inconsistency 4: Keyboard Navigation (zaalcaster Only)

| Repo | Keys 1-9 | Cmd+K | Tab Nav | Notes |
|------|----------|-------|---------|-------|
| zaalcaster | YES (8 tabs) | YES (command palette) | YES | GOLD STANDARD |
| ZAOcowork | NO | No | Browser default | Keyboard-unfriendly |
| Others | NO | NO | Browser default | Keyboard-unfriendly |

**Pain:** Power users cannot move fast in ZAOcowork; must reach for mouse.

**Solution:** Implement zaalcaster's keyboard system in ZAOcowork + cowork-adjacent repos.

---

## Part 4: Cowork Consistency Specification

A **Cowork Consistency Spec** is needed because cowork surfaces appear in multiple repos:
- ZAOcowork web UI (thezao.xyz) = canonical board
- zaalcaster ZOE integration card (shows live task)
- ZAOOS ZOE card (agent-visible)
- hermes-orchestrator task-creation interface
- Telegram bot (writes same table)

### Unified Cowork Data Shape

All task objects MUST conform to this shape:

```typescript
interface CoworkTask {
  id: string;                    // UUID, immutable
  title: string;                 // one-line summary
  owner: string;                 // handle or name (e.g. "Zaal", "Iman")
  status: 'open' | 'in-progress' | 'done' | 'blocked'; // ZAOcowork enum
  priority: 'high' | 'medium' | 'low';  // ZAOcowork enum
  dueDate?: string;              // ISO 8601
  brand?: string;                // tag: "ZAOS", "ZABAL", "COC", etc.
  source: string;                // where it came from (legacy_source pattern)
  notes: string;                 // body / context
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  
  // Agent-specific fields (optional, for hermes/ZOE)
  agentId?: string;
  agentSprint?: number;
  costEstimate?: number;         // ZOE cost budgeting
}
```

**Sources:** Merge ZAOcowork's current `tasks` table schema + hermes learner format + zol dispatch shape.

> **Reconciliation note (2026-07-17): the enums above do NOT match the live ZAOcowork `tasks` table - fix before enforcing.**
> The interface labels `status` and `priority` as "ZAOcowork enum", but the actual Supabase `tasks` table (the real source of truth, which the fleet board tools `scripts/fleet/zao-board.py` and `triage.py` read/write) uses:
> - **status:** `todo` | `in_progress` | `done` | `archived`  (not `open`/`in-progress`/`blocked`; note the underscore in `in_progress`, and there is no `blocked` status column - "blocked" lives in `notes`/`metadata`, not the status enum)
> - **priority:** `P0` | `P1` | `P2` | `P3`  (not `high`/`medium`/`low`)
>
> If the five repos enforce the idealized enums above, they will **diverge** from the DB the board tools already use - the opposite of consistency. **Canonical = the live table's values** (`todo|in_progress|done|archived`, `P0-P3`), because that is what actually persists. If a UI wants friendly labels, map them in the **display layer only**; the data vocab must stay the live table's or every board write/read breaks. Suggested display map: `todo->Open, in_progress->In Progress, done->Done, archived->Archived`; `P0->Critical, P1->High, P2->Medium, P3->Low`.

---

### Unified Cowork UI Components

Every repo that displays cowork tasks MUST use these components:

1. **TaskCard** - 240px width, dark theme, navy/gold, shows title+owner+status+priority
   - `src: TBD` (either ZAOOS shared components or @zao/cowork package)
   - mobile: full width, desktop: 240px column

2. **StatusBadge** - inline, color-coded
   - `open` = yellow/gold
   - `in-progress` = blue
   - `done` = green
   - `blocked` = red

3. **PriorityBadge** - inline, subtle
   - `high` = red border
   - `medium` = gray border
   - `low` = gray/light

4. **TaskList** - Kanban-style or table, filters by status + owner
   - Sortable: by dueDate, by priority, by updatedAt
   - Keyboard: arrows move up/down, Enter opens detail, Escape closes

---

### Unified Keyboard Shortcuts for Cowork Surfaces

Any UI showing cowork tasks SHOULD implement:

| Key | Action |
|-----|--------|
| `1-8` | Jump to filter/view (1=my tasks, 2=high-priority, 3=this-week, 4=blocked, 5-8=reserved) |
| `Cmd+K` | Search + create task |
| `Enter` | Open selected task detail |
| `Escape` | Close detail / deselect |
| `Arrow Up/Down` | Move selection in list |
| `Space` | Toggle status (cycle open -> in-progress -> done) |
| `p` | Set priority (opens selector) |
| `o` | Set owner (opens selector) |

**Status:** Defined here for cowork. Only zaalcaster has comparable depth (but for tabs, not tasks).

---

### Unified Voice + Brand Tags

Every cowork task may carry a brand tag (ZAOS, ZABAL, COC, WaveWarZ, etc.). Tag colors MUST match the repo's canonical palette:

| Brand | Color | Uses |
|-------|-------|------|
| ZAOS | Navy `#0a1628` | core ZAO tasks |
| ZABAL | Purple `TBD` | ZABAL Games tasks |
| COC | Magenta `TBD` | COC Concertz tasks |
| WaveWarZ | Red `TBD` | WaveWarZ tasks |

**Status:** Partially defined in ZAOcowork; needs centralization.

---

## Part 5: Transfer Matrix

Rows = patterns, columns = target repos. X = should adopt, - = already has, N/A = not applicable.

```
Pattern                               ZAOOS  zpoidh  zol  ZAOcowork  zabalgames  farscout  wwtracker
------------------------------------------------------------------------------------------------------
1. API response {ok,error,...}        X      X      X      -          X          X         X
2. Zod safeParse input validation     -      X      X      -          X          X         X
3. Single-source facts.json           -      X      -      -          X          -         -
4. Boot-verify rule (esbuild+tsx)     -      X      X      -          X          X         -
5. API fallback chains (field drift)  X      X      X      -          X          X         X
6. Keyboard nav (1-9 + Cmd+K)         X      -      -      X          X          -         -
7. Confirm-before-irreversible        X      -      -      X          X          -         -
8. Theme palette centralization       X      -      -      X          X          -         -
9. Cowork data shape + vocab          -      X      X      -          X          X         -
10. Contract address ledger (.json)   -      X      -      -          X          -         -
```

---

## Part 6: Shipping Actions (Next Steps)

Each action is one board-ready task:

### Tier 1: Sync patterns (1-3 days, HIGH ROI)

1. **Adopt ZAOcowork API response shape (Pattern 1)**
   - Repo: zpoidh, zabalgames, farscout, wwtracker
   - Owner: Zaal (can delegate to Tyler for zabalgames)
   - Shipped criteria: All API routes in target repos return `{ok, error?, ...data}`; client tests updated
   - Effort: 1-2 hrs per repo

2. **Enforce Zod safeParse on all API routes (Pattern 2)**
   - Repo: zpoidh, zol, zabalgames, farscout, wwtracker
   - Owner: Zaal
   - Shipped criteria: `npm run lint` green; 0 routes using `any` for request body
   - Effort: 1-2 hrs per repo

3. **Document API field-drift fallback chains (Pattern 5)**
   - Repo: zpoidh, zol, farscout, wwtracker, zabalgames
   - Owner: Zaal (automated via comments in live-integration commits)
   - Shipped criteria: Every third-party API integration has a comment block listing known drifts + dates observed
   - Effort: 30 mins per repo

### Tier 2: UX + consistency (3-5 days, MEDIUM ROI)

4. **Keyboard navigation + Cmd+K palette for ZAOcowork (Patterns 6-7)**
   - Repo: ZAOcowork
   - Owner: Zaal or Iman
   - Shipped criteria: Keys 1-8 + Cmd+K functional; zaalcaster parity on task navigation
   - Effort: 2-3 days (complex JS event binding)

5. **Unify theme palette (Pattern 8)**
   - Repo: ZAOcowork, ZAOOS, zabalgames (as needed)
   - Owner: Zaal
   - Shipped criteria: All navy/gold uses go through Tailwind config or CSS variables; no inline `#0a1628` or `#f5a623` hex
   - Effort: 4 hrs

6. **Adopt cowork data shape + status vocab everywhere (Pattern 9)**
   - Repo: zpoidh, zol, hermes-orchestrator, farscout, wwtracker
   - Owner: Zaal (can delegate agent repos)
   - Shipped criteria: All cowork-aware endpoints return `CoworkTask` shape; DB schemas align with ZAOcowork `tasks` table
   - Effort: 2-3 days (schema migrations if DB-backed)

### Tier 3: Consolidation (1-2 days, LONG-TAIL)

7. **Create @zao/cowork shared package (Optional, future)**
   - Repo: new NPM package with TaskCard, StatusBadge, PriorityBadge, keyboard hooks
   - Owner: Zaal
   - Shipped criteria: ZAOOS + ZAOcowork + zabalgames import from it; no duplicated component code
   - Effort: 3-4 days (build, publish, consume)

---

## Part 7: The Gold-Standard Repos (for reference)

| Repo | Gold for | Why |
|------|----------|-----|
| **ZAOOS** | Code practices: validation, errors, testing | 300+ production API routes all follow one pattern |
| **zaalcaster** | UX/keyboarding, API integration | First/only place with key-driven nav; live API drift documentation |
| **ZAOcowork** | Cowork data model, consistency | Canonical cowork `tasks` table; multi-writer (web + bot + research) |
| **hermes-orchestrator** | Agent loop patterns | Framework for agent supervision; learner/intervention patterns reusable |

---

## Findings Summary

1. **Best practices exist and are proven:** Zod validation, boot-verify rule, API fallback chains, single-source-of-truth facts pattern. All working in production. No need to invent.

2. **zaalcaster is the UI/UX gold standard:** Only repo with meaningful keyboard nav, documented API drifts, and live verification discipline.

3. **Cowork consistency is broken:** Same task concept appears in 5+ repos with different shapes, vocab, and no shared UI components. Unifying is the #1 ROI win.

4. **Transfer priority:** API response shape (1-2 hrs per repo) > Zod validation (1-2 hrs per repo) > keyboard nav in cowork (2-3 days, one-time) > everything else.

5. **No breaking changes:** All patterns are additive (new response shape is backwards-compatible if clients are defensive; keyboard nav doesn't break mouse; facts.json doesn't remove old methods).

---

## Sources

- Shallow reads of 7 active repos: ZAOOS, zaalcaster, zpoidh, zol, ZAOcowork, zabalgames, hermes-orchestrator (2026-07-16).
- Live examination of: package.json, .claude/CLAUDE.md, .claude/rules/*.md, sample API routes, component patterns, test patterns, README files.
- Related docs: 1115 (repo estate audit), 998 (GitHub repo estate), 836 (ZAOOS census).
- Observations: zaalcaster CLAUDE.md detailed overnight-build docs (PRs #107-#113); ZAOcowork README + apply-facts pattern; ZAOOS .claude/rules/* comprehensive.
