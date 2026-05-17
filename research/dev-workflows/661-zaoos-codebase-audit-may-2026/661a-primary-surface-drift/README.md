---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-17
related-docs: 601, 661
tier: STANDARD
parent-doc: 661
---

# 661a — Primary-Surface Drift Audit

> **Goal:** Verify whether the codebase reflects the doc 601 consolidation from 12+ surfaces to 5 primary surfaces (ZOE, Hermes, ZAO Devz, Bonfire, ZAOstock bot). Flag any lingering code from decommissioned surfaces.

## Key Findings

| Finding | Severity | Evidence | Action |
|---------|----------|----------|--------|
| FISHBOWLZ code still live + active in src/ | P1 | 26 files, 63 refs, latest commits May 17 | DELETE /src/app/fishbowlz/, /src/app/api/fishbowlz/, /src/components/fishbowlz/ |
| DEALER agent references FISHBOWLZ (decommissioned surface) | P1 | src/lib/agents/dealer.ts:2 comment says "FISHBOWLZ room economy" | UPDATE comment to reflect actual economy or clarify DEALER is dormant |
| Magnetiq/AttaBotty team-bots added POST-cutoff (2026-05-11) | P2 | bot/src/teams/ added 2026-05-11 #503/#507, not in CLAUDE.md | DOCUMENT in CLAUDE.md or REMOVE if off-roadmap |
| MiniMax refs persist across codebase | P2 | 53 refs in src/lib/apo/, src/lib/fishbowlz/, bot/src/llm.ts | NEUTRAL: MiniMax is utility layer, not a surface; keep unless FISHBOWLZ deleted |
| Openclaw references (2 refs only, benign) | P0 | bot/src/zoe/reflect.ts (1 ref), bot/src/zoe/tasks.ts (1 ref) = historical context | KEEP: non-functional references in comments/task descriptions |
| BRAIN/ and agents/ dirs exist but non-functional | P0 | BRAIN/ = Bonfire-pattern knowledge graph; agents/ = CEO/founding-engineer/researcher/security-auditor roles (not bots) | KEEP: BRAIN is active KG pattern, agents/ is role-based research dir |
| memory files marked HISTORICAL | P0 | project_openclaw_status.md, project_composio_ao_pilot.md, project_fishbowlz_deprecated.md all flagged | VERIFY: read CLAUDE.md again to confirm deprecation status |

## Detailed Evidence

### 1. FISHBOWLZ Code Still Active (26 files, 63 refs)

**Path:** `/src/app/fishbowlz/`, `/src/app/api/fishbowlz/`, `/src/components/fishbowlz/`

**File Count:**
```
src/app/fishbowlz/                   4 files
src/app/api/fishbowlz/              13 files
src/components/fishbowlz/            9 files
Total: 26 files
```

**Recent Activity:** Latest changes May 17 2026 (today)
- chore: adopt clawdbotatg patterns (doc 473)
- fix(lint): restore variables/imports
- fix(lint): ignore infra/

**Commits Since Cutoff (2026-05-04):** 3 commits touch FISHBOWLZ code.
- ffad7c7a (May 17) — chore: adopt clawdbotatg patterns
- 93c22d84 (May 9) — fix(lint)
- ddb1cec8 (May 9) — fix(lint)

**Status Per CLAUDE.md:** "FISHBOWLZ (paused 2026-04-16, killed 2026-05-04 — Juke partnership stands)". Code should be DELETED, not maintained.

---

### 2. DEALER Agent Cites Decommissioned Surface

**Path:** `/src/lib/agents/dealer.ts`

**Content (line 2-3):**
```
/**
 * DEALER agent -- FISHBOWLZ room economy.
```

**Issue:** FISHBOWLZ was decommissioned 2026-05-04, but DEALER agent still references it. Last update was 6209ff7b (May 4, refactor agents), but the comment was never corrected.

**Status:** DEALER, BANKER, VAULT are ACTIVE per CLAUDE.md. DEALER should either:
- Have a real economy it manages (if active), OR
- Be marked dormant with a `@deprecated` JSDoc

---

### 3. Magnetiq/AttaBotty Bots (Team-Bots) Added Post-Cutoff

**Path:** `bot/src/teams/`

**Commits:**
- c1cd4e1d (2026-05-11) — feat(bot): team-bots stack - Magnetiq + AttaBotty (#503)
- f8e99709 (2026-05-14) — docs+feat: brand-fit audit + persona tightening (#507)

**Discrepancy:** CLAUDE.md primary-surface table (lines 14-21) lists only 5 surfaces. Magnetiq + AttaBotty are NOT listed. They're mentioned in project memories (project_zao_vs_zabal_projects.md) as "ZABAL Projects (Zaal solo, pre-incubation)" but have NO entry in CLAUDE.md's official surface list.

**Code Status:** Fully integrated. Shared infrastructure (brain.ts, memory.ts), env-based config (MAGNETIQ_BOT_TOKEN, ATTABOTTY_BOT_TOKEN), systemd-ready.

**Action:** Either:
- ADD to CLAUDE.md primary-surface table with justification, OR
- MOVE to separate "Brand Bots" or "Beta Surfaces" section with status

---

### 4. MiniMax References (53 occurrences)

**Paths:** `bot/src/llm.ts`, `src/lib/apo/`, `src/lib/fishbowlz/`, `src/app/api/chat/minimax/`, etc.

**Status:** MiniMax is NOT a surface; it's a utility LLM provider used by multiple surfaces. Benign to keep. However, it was originally tied to openclaw (which is now decommissioned). Many refs are in FISHBOWLZ recap/summarize code.

**Action:** NEUTRAL for now. Once FISHBOWLZ is deleted, audit MiniMax usage and consider archiving unused refs.

---

### 5. Openclaw References (2 refs, benign)

**Locations:**
- `bot/src/zoe/reflect.ts:1` — "Today you opened PR #470 (ZOE doc 604) and stopped openclaw container."
- `bot/src/zoe/tasks.ts:13` — "After Phase 1 complete: stop openclaw container (DONE 2026-05-04)..."

**Status:** Historical context, not functional. Safe to keep as-is or update to remove mentions.

---

### 6. BRAIN/ Directory (Knowledge Graph Pattern)

**Path:** `/BRAIN/`

**Contents:**
- `projects/zao-stock-2026-10-03.md`
- `people/1447437687-zaal.md`
- `_meta/` (conflicts, digest, freshness, source authority)

**Status:** ACTIVE. Part of Bonfire/knowledge-graph consolidation. Separate from agent surfaces. KEEP.

---

### 7. agents/ Directory (Role-Based Research)

**Path:** `/agents/`

**Contents:**
```
agents/ceo/
agents/founding-engineer/
agents/researcher/
agents/security-auditor/
```

**Status:** These are role personas for research, NOT agent bots. No code, no Telegram bots. KEEP.

---

### 8. Memory Files (Decommissioning Status)

**Files marked HISTORICAL/DEPRECATED:**
- `project_openclaw_status.md` — "DECOMMISSIONED 2026-05-04"
- `project_composio_ao_pilot.md` — "DECOMMISSIONED 2026-05-04"
- `project_fishbowlz_deprecated.md` — "KILL CONFIRMED 2026-05-04"

**Files NOT marked but referencing dead surfaces:**
- `project_fishbowlz_status.md` — Says "Live on zaoos.com/fishbowlz", no deprecation flag
- `project_fishbowlz_agents_design.md` — "Three-tier agent system... paused mid-brainstorm", no kill notice

**Action:** Update stale memory files to point to deprecated versions or delete them entirely.

---

## Recommended Actions

1. **DELETE FISHBOWLZ code from src/ (P1, ~30min)**
   - Run: `rm -r src/app/fishbowlz src/app/api/fishbowlz src/components/fishbowlz`
   - Update any remaining fishbowlz routes to 410 Gone or redirect
   - Files affected: 26 files, ~2000 lines
   - Owner: Zaal or designated
   - By-when: Before next major release

2. **Fix DEALER comment (P1, ~5min)**
   - Update `src/lib/agents/dealer.ts:2` to clarify actual economy or mark `@deprecated`
   - Owner: Any
   - By-when: Next commit touching agents/

3. **Document/Remove Magnetiq+AttaBotty (P2, ~1hr)**
   - Option A: Add "Brand Bots" section to CLAUDE.md with these bots + status
   - Option B: Move bot/src/teams/ to separate beta/ dir if not production-ready
   - Owner: Zaal (decision) + Any (implementation)
   - By-when: End of sprint

4. **Archive stale memory files (P2, ~10min)**
   - Rename or delete: `project_fishbowlz_status.md`, `project_fishbowlz_agents_design.md`
   - Owner: Any
   - By-when: Next memory cleanup

5. **Audit MiniMax usage post-FISHBOWLZ (P2, later)**
   - After FISHBOWLZ deletion, grep for MiniMax and consolidate
   - Owner: TBD
   - By-when: 2026-06-01

---

## Sources

- CLAUDE.md (project instructions) — primary-surface table
- git log --since="2026-03-17" — recent commits
- grep -r "fishbowlz|openclaw|magnetiq|minimax" — surface refs
- Memory files in ~/.claude/projects/.../memory/
- /src/lib/agents/, /bot/src/, /BRAIN/, /agents/ directories
