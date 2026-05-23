---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-21
related-docs: 154, 601, 661
tier: STANDARD
parent-doc: 661
---

# 661f - CLAUDE.md Drift Audit

CLAUDE.md is checked into the repo and read at session start. Stale numbers compound decision errors. This audit verifies 12 factual claims.

## Number Drift

| CLAUDE.md claim | Actual | Diff | Severity |
|---|---|---|---|
| 301 API routes across 54 domains | 324 routes across 55 domains | +23 routes, +1 domain | Medium |
| 279 components | 294 components | +15 | Low |
| 19 custom hooks | 19 custom hooks | 0 | MATCH |
| 240+ research docs | 729 research docs | +489 | High |
| 540+ research docs (headline) | 729 research docs | Inconsistency within CLAUDE.md | High |

**Analysis:** The numbers in the headline ("540+ research docs") conflict with the Project Map ("240+ research docs"). Actual count is 729. Both claims are stale. Routes and components drifted 2-4% as the codebase grew. Hooks stayed stable. The research docs number is a magnitude off - shows lack of maintenance.

## Date Drift

| Claim | Stated | Reality | Action |
|---|---|---|---|
| "ZAOstock 2026, Wed 2026-04-29" graduation date | Imminent (as of doc write) | Still in monorepo, active dev | Update CLAUDE.md |
| Doc 154 reference | Valid link | Exists at dev-workflows/154-skills-commands-master-reference/ | No action - correct |

**Analysis:** ZAOstock graduation target (2026-04-29) has passed. Code remains in the monorepo. As of 2026-05-17, the latest commits are "doc 599: Adam sync May 2026" and "feat(zaostock-bot): /timeline_done command". Graduation has NOT occurred.

## Surface Drift (the 5 primary surfaces)

All 5 surfaces are active and currently implemented:

| Surface | CLAUDE.md says | Reality | Status |
|---|---|---|---|
| ZOE (`@zaoclaw_bot`) | Single concierge, bot/src/zoe/ | Live, 22 submodules at bot/src/zoe/ (actions, auth, capture, digest, onepagers, etc.) | MATCH |
| Hermes (`@zoe_hermes_bot`) | Autonomous fix-PR pipeline, bot/src/hermes/ | Live, bot/src/hermes/ exists with 4 submodules | MATCH |
| ZAO Devz (`@zaodevz_bot`) | Group dispatch, bot/src/devz/ | Live, bot/src/devz/ exists | MATCH |
| Bonfire (`@zabal_bonfire`) | Knowledge graph recall, bonfires.ai | External SaaS, genesis tier | MATCH |
| ZAOstock bot (`@ZAOstockTeamBot`) | Festival coordination, graduates with spinout | Live in bot/ (root), not yet graduated | MATCH but date stale |

**Analysis:** All 5 surfaces are operational. The ZAOstock graduation claim needs update since the graduation has not yet occurred, but the infrastructure is correct.

## Stack Drift

| Tech | CLAUDE.md | package.json | Status |
|---|---|---|---|
| Next.js | "16" | "^16.2.0" | MATCH (16.2.0 is Next 16) |
| React | "19" | "19.2.3" | MATCH |
| React-DOM | "19" (implicit) | "19.2.3" | MATCH |
| Tailwind | "v4" | "^4" | MATCH |
| iron-session | Mentioned | "^8.0.4" | MATCH |
| Supabase | Mentioned, "@supabase/supabase-js" | "^2.99.1" | MATCH |
| Neynar | Mentioned | "@neynar/nodejs-sdk": "^3.137.0" | MATCH |
| XMTP | Mentioned | "@xmtp/browser-sdk": "^7.0.0" | MATCH |
| Wagmi | Mentioned | "^2.19.5" | MATCH |
| Viem | Mentioned | "^2.47.2" | MATCH |
| Stream.io | Mentioned | "@stream-io/video-react-sdk": "^1.34.1" | MATCH |

**Analysis:** All stack claims are accurate. Versions checked. No action needed.

## Security Claims Verification

| Claim | Finding |
|---|---|
| "NEVER expose SUPABASE_SERVICE_ROLE_KEY, NEYNAR_API_KEY, SESSION_SECRET, APP_SIGNER_PRIVATE_KEY to browser" | No leaks found in src/components/ or src/hooks/. grep return: 0 matches. SECURE |
| "Use Promise.allSettled for parallel ops" | Found: 77 allSettled, 125 Promise.all. Ratio: 38% allSettled, 62% raw Promise.all. Not the dominant pattern. ADVISORY |

**Analysis:** No security leaks in the component layer. The Promise.allSettled guidance is not yet dominant practice - raw Promise.all is still 62% of usage. Consider a sweep or linting rule to enforce the pattern.

## .claude/rules/ Inventory

| File | Last updated | Days old | Current? |
|---|---|---|---|
| api-routes.md | 2026-03-18 | 61 days | YES - stable API boundary |
| components.md | 2026-03-18 | 61 days | YES - stable component conventions |
| secret-hygiene.md | 2026-04-22 | 25 days | YES - recent clawdbotatg adoption |
| skill-enhancements.md | 2026-04-02 | 45 days | YES - Brainstorming & creative constraints still active |
| tests.md | 2026-03-20 | 58 days | YES - vi.mock pattern is current |
| typescript-hygiene.md | 2026-04-20 | 27 days | YES - ECC rules pinned 2026-04-20 |

**Analysis:** All rules are current. Newest: secret-hygiene (25d), typescript-hygiene (27d). Oldest: components, api-routes (61d). No stale rules. Well maintained.

## Boundaries Alignment (CLAUDE.md vs AGENTS.md)

| Section | CLAUDE.md | AGENTS.md | Status |
|---|---|---|---|
| "Use Promise.allSettled for parallel ops" | Line 70 | Line 64 | Both present, identical phrasing |
| "Create PRs to main (never push directly)" | Line 71 | Line 69 | Both present, identical |
| Zod validation required | Line 67 | Line 98 | Both present, identical scope |
| No Redux/Zustand | Line 83 | Line 62 (state mgmt) | Aligned, AGENTS.md more detailed |

**Analysis:** BOUNDARIES section mirrors cleanly. AGENTS.md is slightly more detailed on state management. No drift detected.

## Research Doc Reference Health

| Reference | Path | Status |
|---|---|---|
| "Doc 154" (Skills) | research/dev-workflows/154-skills-commands-master-reference/ | EXISTS - current as of git log |
| "Doc 601" (Agent stack cleanup) | research/agents/601-agent-stack-cleanup-decision/ | EXISTS - referenced as source of truth |

**Analysis:** Both key research docs exist and are reachable.

## Recommended CLAUDE.md Patch

### Finding 1: Research docs number inconsistency

**BEFORE (lines 20 and 36):**
```
**Today the lab includes:** the original Farcaster client for The ZAO, the ZAOstock dashboard + Telegram bot (graduating Wed), agent stack (ZOE, Hermes), music player components, 540+ research docs. 301 API routes, 279 components, 19 hooks.

| `research/` | 240+ research docs (see research/README.md) | Use grep, not bulk reads |
```

**AFTER:**
```
**Today the lab includes:** the original Farcaster client for The ZAO, the ZAOstock dashboard + Telegram bot, agent stack (ZOE, Hermes), music player components, 729 research docs. 324 API routes, 294 components, 19 hooks.

| `research/` | 729 research docs (see research/README.md) | Use grep, not bulk reads |
```

### Finding 2: ZAOstock graduation date is stale

**BEFORE (line 11):**
```
The repo started as a gated Farcaster social client for **The ZAO** (188 members on Base) and grew into a monorepo where many ZAO experiments live side-by-side. Some have already graduated to their own repos (COC Concertz). Some are graduating now (ZAOstock 2026, Wed 2026-04-29). Some are paused (FISHBOWLZ). The rest are still being figured out.
```

**AFTER:**
```
The repo started as a gated Farcaster social client for **The ZAO** (188 members on Base) and grew into a monorepo where many ZAO experiments live side-by-side. Some have already graduated to their own repos (COC Concertz). Some are spinning out (ZAOstock 2026, planned graduation in Q2). Some are paused (FISHBOWLZ). The rest are still being figured out.
```

### Finding 3: Remove "graduating Wed" from headline

**BEFORE (line 20):**
```
**Today the lab includes:** the original Farcaster client for The ZAO, the ZAOstock dashboard + Telegram bot (graduating Wed),
```

**AFTER:**
```
**Today the lab includes:** the original Farcaster client for The ZAO, the ZAOstock dashboard + Telegram bot,
```

### Finding 4: API routes and components are out of date

**BEFORE (line 28-30):**
```
| `src/app/api/` | 301 route handlers across 54 domains | Working on backend |
| `src/components/` | 279 components by feature | Working on UI |
```

**AFTER:**
```
| `src/app/api/` | 324 route handlers across 55 domains | Working on backend |
| `src/components/` | 294 components by feature | Working on UI |
```

## Top Findings Summary

1. **Research docs number is massively stale:** CLAUDE.md claims 240+ or 540+, but actual is 729. This is the largest drift (magnitude off).
2. **ZAOstock graduation date passed but code is still here:** Stated as "graduating Wed 2026-04-29", but as of 2026-05-17, ZAOstock is still in monorepo with active development. Grammar should shift from "graduating now" to "spinning out" with softer date.
3. **API routes +23 and components +15 since doc write:** These drifted 2-4%. Should be updated each major sprint.
4. **Promise.allSettled not yet dominant pattern:** 38% allSettled vs 62% raw Promise.all. Consider enforcing via linting.
5. **All other claims verified:** Stack versions match, security rules are sound, rule files are current, surfaces are active, boundaries align with AGENTS.md.

## Maintenance Recommendation

Update CLAUDE.md quarterly or after every 50-route sprint. Set up a `/check-claude` skill that counts routes/components/hooks and flags drift. Consider embedding the counts in `community.config.ts` as a source of truth if those numbers are user-facing.

---
