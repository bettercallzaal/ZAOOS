---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
related-docs: 154, 661, 663, 676, 677
tier: STANDARD
---

# 683e - Skills + Workflows + Connective Layer Audit

> **Goal:** Audit ZAO's 150+ available skills (gstack + 44 ZAO custom), recurring manual rituals, and the Bonfire knowledge graph as connective seam. Identify overlapping skills to merge, manual commands that should become hooks/cron jobs, and structural bottlenecks (MEMORY.md over size limit, missing knowledge-graph writes, decentralized doc-tracking).

---

## Executive Summary

The ZAO ecosystem has **44 custom skills** at `~/.claude/skills/` (plus 100+ gstack/ECC skills), but workflow orchestration relies heavily on **Zaal invoking commands manually** rather than automation. Top consolidation opportunities:

1. **Research + Social Posting pipeline** - zao-research (3-tier), socials, and newsletter (missing skill) should write to Bonfire automatically + cache outputs
2. **Worksession discipline** - branch-guard hook exists but fails silently; SessionStart hook warns but doesn't ENFORCE. Need pre-push hook to guarantee ws/ branches
3. **MEMORY.md structural split** - 31.2 KB (limit 24.4 KB) requires splitting into topics to unlock future feedback/decision auto-recording
4. **Knowledge graph as single source of truth** - 676-677 ship the KG (780 episodes live) but only 2 surfaces write to it (ZOE mirrorTurn, ZAOcoworkingBot /add). Need automated bridge: every skill output -> bonfire episode

**Quick wins (difficulty <= 3, value high):** Split MEMORY.md into topic files (1 hour), add pre-push branch-guard hook (30 min), wire research doc outputs to Bonfire + Telegram relay (3 hours).

---

## Ranked Consolidation + Automation Opportunities

| # | Opportunity | Current State | Proposed Consolidation/Automation | Difficulty (1-10) | Value | Cheap Win? |
|---|-------------|----------------|-----------------------------------|------------------|-------|-----------|
| **C1** | Research + Social + Newsletter pipeline | zao-research outputs markdown; socials reads markdown; newsletter missing | Unify: zao-research -> JSON structure -> Bonfire episode -> [socials, newsletter, clipboard each read from KG] | 6 | HIGH | NO |
| **C2** | MEMORY.md over size limit (31.2 KB, limit 24.4 KB) | Single 156-line file, feedback entries too long | Split into: memory/projects/, memory/feedback/, memory/user/, keep index in root | 2 | HIGH | YES |
| **C3** | Multiple planning skills | plan-ceo-review, plan-eng-review, plan-design-review overlap on structure | Merge into /plan skill with context parameter; keep role-specific PROMPT variants | 4 | MED | NO |
| **C4** | Overlapping research skills | zao-research, autoresearch, bcz-research, bandz-research all 3-tier with different corpora | Unify on zao-research base; add corpus selector (ZAO | autoresearch-refs | BCZ | bandz) | 5 | MED | NO |
| **C5** | Meeting/office-hours/retro dupe | meeting, office-hours, retro all schedule + run note-taking | Consolidate to /meeting with "retro" mode; remove office-hours, move to /schedule skill | 3 | MED | YES |
| **A1** | Worksession branch discipline | SessionStart hook warns; branch-guard.sh on pre-push; but violations happen (feedback_branch_discipline.md shows repeated issues) | Add pre-push hook: fail if not on ws/* OR main; block accidental commits on branches outside lifecycle | 3 | HIGH | YES |
| **A2** | Secret scanning on every commit | .claude/rules/secret-hygiene.md defines 5 guards; none auto-run before commit | Wire secret_scan.py into pre-commit hook (copy from bot/ ingest pipeline); block 64-char hex, PEM blocks, API keys | 4 | HIGH | YES |
| **A3** | Bonfire as connective layer | 780 episodes ingested; only 2 surfaces write (ZOE mirrorTurn, ZAOcoworkingBot /add); reads gated on labeling | Add write bridge: every /zao-research doc -> episode; ship /search command; auto-label on doc completion | 7 | HIGH | NO |
| **A4** | Research doc number collisions | Doc 663 shipped collision guard; verify it runs on every commit | Check .git/hooks/pre-commit; if not present, add. Warn on dupe nums before write | 2 | MED | YES |
| **A5** | Clipboard auto-output | /clipboard invoked constantly; user manually copies/pastes to Telegram | Auto-route: /clipboard output -> bot.ts relay + Telegram DM to Zaal's coworking bot | 5 | MED | NO |
| **A6** | Doc-number tracking fragmented | MEMORY.md has project_* files with doc refs; research/ has docs; no unified registry | Wire every Write(research/*) to auto-extract doc number -> Bonfire episode + MEMORY.md | 6 | MED | NO |

---

## Top 3 Consolidations (Deep Dive)

### C2: Split MEMORY.md into Topic Subdirectory

**Current:** `/Users/zaalpanthaki/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/MEMORY.md` is 31.2 KB (limit 24.4 KB), 156 lines of index entries averaging 200 chars each (too long per memory spec).

**Problem:** Size limit blocks adding new feedback/decision entries. Each memory read loads the entire file.

**Proposed:** Split into topic tree:
```
memory/
  MEMORY.md (index only: pointer to topic files)
  projects/MEMORY.md (30 project_* entries, ~8 KB)
  feedback/MEMORY.md (25+ feedback_* entries, ~7 KB)
  user/MEMORY.md (3 user_* entries, ~1 KB)
  global/MEMORY.md (kept in ~/.claude/projects/global/ for cross-project)
```

Keep a **root index** at MEMORY.md with single-line pointers + a `[Read more]` skill that auto-selects the right topic file by path prefix.

**Buildable:** Yes. 1-hour manual split, no code changes needed. Creates capacity for ongoing feedback loops (decision tracking, pattern library).

**File path:** `/Users/zaalpanthaki/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` - split into subdirs, rewrite MEMORY.md index.

---

### C1: Research + Social + Newsletter Unified Pipeline

**Current:** 
- `/zao-research` outputs markdown doc + writes to `/research/` + writes to MEMORY.md
- `/socials` reads the markdown output (handoff via conversation context)
- `/newsletter` missing entirely - requires manual Paragraph.com drafting

**Problem:** Outputs scattered across 3 surfaces; social posts require manual copy-paste; newsletter requires separate drafting system; Bonfire (676) shows knowledge graph should be the source-of-truth for team context.

**Proposed:** 
```
1. zao-research outputs BOTH markdown doc + JSON structure to Bonfire
2. Bonfire stores episode with tags: [topic, status:draft, author, date, body]
3. /socials skill: prompt shows "Recent research (from Bonfire)" + drafts platform-specific posts
4. /newsletter skill: queries Bonfire for week's episodes, auto-drafts summary, user edits, then posts + distributes
5. /clipboard auto-relay (A5): if user invokes /clipboard on Bonfire episode, relay to Telegram coworking bot
```

**Why it matters:** Bonfire becomes THE source of truth for "what did we ship/learn?", Zaal's ritual becomes 1-2 Telegram messages instead of CLI + browser context-switching.

**Buildable:** 6-8 hours. Requires: Bonfire write wrapper (2h), /newsletter skill (2h), modify /socials to read Bonfire (1h), test (1h).

**File paths:** 
- Bonfire write bridge: `bot/src/zoe/bonfire.ts` (extend mirrorTurn pattern)
- Newsletter skill: `~/.claude/skills/newsletter/SKILL.md` (new)
- Social read: `~/.claude/skills/socials/SKILL.md` (modify step 1 to optionally read Bonfire)

---

### A1: Enforce Worksession Branch Discipline via Hooks

**Current:** 
- SessionStart hook warns if not on ws/* but allows continuation
- Pre-push hook (branch-guard.sh) checks branch but is called by /ship, not automatically on every `git push`
- Feedback shows repeated branch violations (feedback_branch_discipline.md, feedback_check_pr_state_always.md, feedback_never_push_main.md)

**Problem:** Warnings don't prevent damage. Zaal bypasses or forgets /ship, pushes to main directly, creates merge conflicts.

**Proposed:** Add TWO hooks:
```bash
# 1. Pre-push hook (git native)
# at .git/hooks/pre-push - runs on EVERY git push (not optional)
#!/bin/bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "main" ]] || [[ "$BRANCH" != "ws/"* ]]; then
  echo "FATAL: Cannot push to $BRANCH. Work must be on ws/* branches. Run /worksession first."
  exit 1
fi

# 2. Pre-commit hook (git native) 
# at .git/hooks/pre-commit - runs on EVERY commit
#!/bin/bash
bash .claude/scripts/secret-scan.sh --pre-commit || exit 1
```

**Why it matters:** Hard boundaries prevent foot-guns. No amount of warnings fix muscle memory; hooks do.

**Buildable:** Yes. 30 minutes. Copy scripts from `.claude/skills/worksession/` into `.git/hooks/`, make executable, test on next commit.

**File paths:**
- Pre-push script: `.git/hooks/pre-push` (write new)
- Pre-commit script: `.git/hooks/pre-commit` (write new, copy secret_scan.py from bot/ ingest)
- Test: next /ship workflow

---

## Top 3 Automations (Deep Dive)

### A3: Bonfire as Connective Layer (Knowledge Graph Writes)

**Current State (676-677):**
- Bonfire deployed on Genesis tier at bonfires.ai, 780 episodes ingested
- Only 2 surfaces write: ZOE mirrorTurn (on task capture), ZAOcoworkingBot /add
- All READ vectors blocked until admin runs labeling
- 6 utilization paths documented but not wired

**What's Missing:** 
- `/search` command in ZAOcoworkingBot (4-6h, high value)
- Auto-write bridge for research docs (zao-research -> episode)
- Auto-labeling trigger (low signal, but unlocks reads)
- Cross-bot ingest module (shared across ZOE, ZAOcoworkingBot, ZAOstockTeamBot, Hermes)

**Proposed Next Wave (per 676):**
```
Wave 0 (now):  Merge PR #571 (ZOE mirror shipped), tell team @zabal_bonfire works
Wave 1 (1 wk): Admin runs labeling (unlocks all READ vectors at once)
Wave 2 (2 wk): 
  - Ship /search in ZAOcoworkingBot (4-6h, queries Bonfire /delve)
  - Add weekly fractal contribution digest route (80 LoC)
  - Wire zao-research output to Bonfire episode (2h)
```

**Buildable:** Phased. Wave 2 items are 6-8 total hours. Highest leverage: labeling (0 build, unlocks everything).

**File paths:**
- Bonfire write module: `src/lib/bonfire/write.ts` (new, shared across bots)
- /search route: `src/app/api/search/bonfire/route.ts` (new)
- Labeling trigger: integrate into `bot/src/zoe/handlers/` or cron job
- Research write bridge: modify `~/.claude/skills/zao-research/` to call write.ts on doc save

---

### A2: Secret Scanning on Every Commit (Pre-commit Hook)

**Current:** 
- `.claude/rules/secret-hygiene.md` defines 5 guards (guards from clawdbotatg Fifth Builder incident doc 473)
- bot/ ingest pipeline has `secret_scan.py` (mandatory pre-flight check)
- No automatic hook running on user commits

**Problem:** Secret can still leak if Zaal commits on main or an unexpected branch before the hook triggers. CI on push catches it, but damage is already in history.

**Proposed:** 
```bash
# Copy bot/scripts/secret_scan.py to .claude/scripts/
# Add .git/hooks/pre-commit (runs before every commit):
#!/bin/bash
python3 .claude/scripts/secret_scan.py --staged || exit 1
```

**Checks (from secret-hygiene.md):**
1. 64-char hex (private keys)
2. PEM BEGIN blocks
3. GitHub PAT (ghp_*)
4. Anthropic key (sk-ant-*)
5. OpenAI key (sk-*)

**Buildable:** Yes. 30 minutes. Copy script, wire hook, test.

**File paths:**
- Secret scan script: `.claude/scripts/secret_scan.py` (copy from bot/)
- Hook: `.git/hooks/pre-commit` (new, call secret_scan.py)

---

### A1: Pre-push Branch Guard Becomes Automatic (Revisited)

Same as C1 deep-dive above. Moves from "optional /ship step" to "always-on git hook". 30 min, essential.

---

## Cheap Wins (Difficulty <= 3, Value HIGH)

All buildable in a single focused afternoon (3-4 hours total):

| Win | Current | Proposed | Time | Build | File Path |
|-----|---------|----------|------|-------|-----------|
| **1. Split MEMORY.md** | 31.2 KB file, over limit | Split into memory/projects/, memory/feedback/, memory/user/ subdirs + root index | 1 h | Manual split, no code | `memory/{projects,feedback,user}/MEMORY.md` |
| **2. Pre-push branch guard** | SessionStart hook warns only; branch-guard.sh only on /ship | Add .git/hooks/pre-push: fail if not ws/* or main | 0.5 h | Copy script, make executable | `.git/hooks/pre-push` |
| **3. Pre-commit secret scan** | secret_scan.py in bot/, not used on user commits | Copy to .claude/scripts/; add .git/hooks/pre-commit | 0.5 h | Copy + wire hook | `.git/hooks/pre-commit`, `.claude/scripts/secret_scan.py` |
| **4. Verify doc-collision guard** | Doc 663 shipped; verify .git/hooks/pre-commit has it | Check if hook exists and runs; if not, add | 0.25 h | Inspect .git/hooks/ | `.git/hooks/pre-commit` (append if needed) |
| **5. Wire Bonfire labeling trigger** | Labeling blocks all KG reads; manual admin step | Add cron job or SessionStart hook: run labeling endpoint once weekly | 1 h | Write cron script or hook command | `.cron/bonfire-labeling.sh` or add to settings.json hook |
| **6. Add /search stub to ZAOcoworkingBot** | Search not available; plan documented in 676d | Create `src/app/api/search/bonfire/route.ts` stubbed, ready for wiring | 1 h | New route, scaffold only | `src/app/api/search/bonfire/route.ts` |

---

## Connective Layer: Bonfire Knowledge Graph as Single Source of Truth

**Current Reality (676-677):**
- Bonfire is the ZAO ecosystem's shared memory (780 episodes: 31 brands, 80 GitHub READMEs, 668 research docs + live feed from 2 bots)
- Writes are hardcoded to 2 surfaces (ZOE, ZAOcoworkingBot); reads are gated on labeling
- Zero automation between skill outputs (zao-research, socials, /meeting notes) and the KG

**The Vision (from 676):**
Every asset in ZAO flows through the Bonfire:
- Team work (ZAOcoworkingBot /add) -> episode
- Decisions (research docs) -> episode
- Captures (ZOE) -> episode
- Learning (skill outputs: research, socials drafts, notes) -> episode

This way, when Zaal asks "what do we know about X?" or a new agent joins, **one query** to the Bonfire returns all context - no hunting across 5 Telegram groups, 3 notion docs, and git history.

**Missing:** The write bridges. Every skill should be wired to optionally write its output to the KG. The skill-output -> Bonfire bridge is the connective seam that's currently manual (Zaal copies-pastes findings into Telegram, team reads context from manual relay, not KG).

---

## Overlapping Skills (Consolidation Candidates)

| Skill Cluster | Members | Overlap | Proposal |
|---|---|---|---|
| **Planning** | plan-ceo-review, plan-eng-review, plan-design-review | All structure: context > brainstorm > timeline > blockers > sign-off | Merge to /plan + context param (ceo|eng|design). Keep voice variants as prompts. |
| **Research** | zao-research, autoresearch, autoresearch:* (plan/debug/fix/predict/security), bcz-research, bandz-research | All 3-tier (quick/standard/deep); all search local + web; different corpora | Unify on zao-research base. Add corpus selector (default=ZAO, alt=autoresearch-refs/bcz/bandz). Keep subcommand variants for autoresearch modes. |
| **Meeting notes** | meeting, office-hours, retro | All schedule + run live note-taking + post to group | Consolidate to /meeting with mode param (standup|retro|office-hours). Remove redundant skills. |
| **Testing** | qa, qa-only, e2e testing (ECC skill) | qa runs full suite; qa-only skips build | Keep qa + qa-only; defer e2e to browser-qa or dedicated skill. No consolidation needed. |

---

## Structural Improvements (No Code)

1. **Document the skill dependency graph.** Doc 154 references skills but doesn't map "if you choose X, avoid Y" or "X outputs feed Y input." Add a 2D matrix to 154 showing which skills are pre/post for each workflow.

2. **Lock research doc frontmatter.** Every doc in research/ should have topic + type + status + related-docs + tier. Standardize via pre-write hook (already exists in settings.json, post-write; move to pre-write to enforce before write).

3. **Automate doc-number minting.** Instead of guessing the next number, write a `/new-doc topic/title` helper that reads existing docs, suggests next available number, creates the directory, and scaffolds frontmatter.

---

## Risk Summary

- **MEMORY.md overflow blocking feedback loops** - Fix with cheap win #1 (split into topics)
- **Branch discipline failures** - Fix with cheap win #2 (pre-push hook)
- **Secret leaks in git history** - Fix with cheap win #3 (pre-commit hook)
- **Bonfire unconnected from daily workflow** - Medium-term: wire skill outputs to KG (A3, phased)
- **Skill redundancy slowing discovery** - Fix with consolidation C4 (unify research on zao-research base)

---

## Next Steps

1. **Immediate (today):** Run cheap wins 1-4 (split MEMORY.md, add git hooks, verify collision guard) — 2 hours
2. **This week:** Cheap win #5 (labeling trigger) + verify doc 663 collision guard is live — 1 hour
3. **Next sprint:** C1 (research + social pipeline to Bonfire) — 6-8 hours, high leverage
4. **Parallel:** Wave 2 of 676 (A3: /search command, fractal digest, cross-bot KG module) — 6-8 hours

---

## Audit Metadata

- **Audit date:** 2026-05-20
- **Auditor:** Sub-agent 683e (Dispatch-tier consolidation audit)
- **Related audits:** Doc 661 (codebase), Doc 663 (repos + collision guard), Doc 676-677 (Bonfire KG)
- **Session:** ws/jadyn-producer-brief (parallel consolidation audit)
- **Skills reviewed:** 44 ZAO custom + 100+ gstack/ECC (sample of 15 key skills)
- **Hooks reviewed:** 5 hooks in .claude/settings.json (SessionStart, PreToolUse [2], PostToolUse [2])
- **Memory audited:** MEMORY.md (31.2 KB, over 24.4 KB limit)
