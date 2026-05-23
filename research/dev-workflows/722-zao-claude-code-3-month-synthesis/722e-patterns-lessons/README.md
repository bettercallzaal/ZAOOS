---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
related-docs: 601, 644, 672, 694, 649
tier: STANDARD
original-query: Extract cross-cutting patterns + lessons from 3 months of Claude Code + GitHub work (2026-02-23 to 2026-05-23). Synthesis, not catalog.
---

# 722e - Patterns & Lessons: 3 Months of Claude Code + GitHub Work

> **Goal:** Extract the cross-cutting patterns, what stuck, what died, what shifted. A synthesis of Feb 23 - May 23, 2026. Not a catalog - just the essential lessons that recurred or proved decisive.

## Key Decisions (Top 5 Takeaways)

| Decision | Locked | Why It Mattered |
|----------|--------|-----------------|
| Hermes pattern is THE agent framework | 2026-05-05 (Doc 601) | Killed 12 systems down to 5 surfaces. Stable, cheap (no API billing), production-ready. Closed the "add another bot" spiral. |
| Monorepo-as-lab model for ZAOOS | 2026-04-28 (Doc 601) | Things graduate to own repo when public-ready, code DELETED from ZAOOS to prevent drift. Reversed the "too many old branches" problem. |
| 5-surface operating model | 2026-05-04 (Doc 644) | Zaal's daily reality: Claude Code CLI + Bonfire + Hermes + ZAOstock bot + ZOE. Everything else is complexity debt. Became the canonical constraint for all new bots. |
| /worksession discipline per branch | 2026-04-29 | Each terminal gets its own `ws/` branch, never edits root directly. Eliminated branch collisions from parallel sessions. Feedback memory locked. |
| Festival naming: ZAO-PALOOZA, ZAO-CHELLA | 2026-05-04 (PR #604) | Hyphenated, all-caps, never "Palooza". Brand consistency doc locked. Still being enforced session-to-session. |

---

## 1. What Was Canonicalized

### Hermes + Claude CLI as agent substrate

- **Locked 2026-05-05** in Doc 601, reiterated in Doc 644 as non-negotiable.
- Pattern: `claude` CLI subprocess, Max plan OAuth auth, system prompt injection per call, cost routing (Sonnet for cheap, Opus for hard).
- Why it won: fast, cheap (no API billing), stable model quality, past experiments (Composio AO, Agent Zero, ZOE v2) hit quality walls.
- Became the template for all new bots (Magnetiq, AttaBotty) in Doc 644.

### Five operating surfaces (post-Doc-601 collapse)

1. **ZOE** (@zaoclaw_bot) - concierge, Hermes-pattern brain
2. **Hermes** (@zoe_hermes_bot) - coder/critic, PR-triggered
3. **Bonfire** (@zabal_bonfire) - memory layer, graph recall
4. **ZAOstock bot** - team ops, graduating own repo
5. **Claude Code CLI** - primary for code/research/writing

From ~12 systems to 5. Formalized in Doc 644 with template for future bots.

### Bonfire as the knowledge graph

- Single source of truth for captures, recalls, graph facts.
- Replaced the need for ZOE's container + extensions + sqlite embeddings.
- Became the memory layer that ZOE + Hermes query on demand.

### Monorepo-as-lab pattern for ZAOOS

- Products graduate to own repo when public-ready + ready to share.
- Code is DELETED from ZAOOS on graduation (prevents drift).
- Proven by: BCZ YapZ (graduated 2026-05-06 to bettercallzaal/bcz-yapz + bczyapz.com, PR #480).
- ZAOstock spinning out as next graduate (docs 681-684, PRs #579/#583/#588 queued).

### Brand canon locked

- ZAO-PALOOZA / ZAO-CHELLA (hyphenated, all-caps) - PR #604
- ZABAL (all caps) in all contexts
- Canonical Zaal pitch: "decentralized impact network" (2026-04-28)
- Bonfire episodes as the unifying graph posts (every doc syncs via episode links)

### /worksession discipline

- Feedback memory `feedback_workspace_worktrees.md` locked: always launch via wsesh or `claude --worktree`.
- Never edit ZAO OS V1 root directly (Doc 459).
- Each session gets its own `ws/` branch, prevents parallel-session collisions that plagued Feb-Mar.

---

## 2. What Was Killed

### OpenClaw container + 7-agent squad (2026-05-04, Doc 601)

- ZOEY/BUILDER/SCOUT/WALLET/FISHBOWLZ/CASTER sub-agents, never used.
- ZOE container had 60+ extension plugins, custom config schema, broken telegram channel.
- KILLED: Brain swapped to Hermes-pattern, identity (@zaoclaw_bot) survives.
- Saves ~600MB RAM + Minimax dependency + extension hell.

### Composio AO orchestrator

- Pilot at bcz (localhost:3001), paused 3+ weeks.
- DECOMMISSIONED 2026-05-04 as part of Doc 601 cleanup.
- Memory `project_composio_ao_pilot.md` marked dead.

### 10-bot branded fleet plan

- From 2026-04 brainstorm (memory `project_tomorrow_first_tasks.md`).
- Never built, PERMANENT DEFER per Doc 601.
- Rationale: Bonfire multi-agent capability can host all personalities within one bonfire; no new tokens needed.

### ZOE v2 redesign + Agent Zero migration

- Pivot proposed earlier, skipped per Doc 601.
- Bonfire eats the roles (memory + task scheduling).
- "Agent Zero quality walls" = aspirational; Hermes is the stable choice.

### FISHBOWLZ audio rooms

- Paused 2026-04-16, formally killed 2026-05-04 (Doc 601).
- Partnership with Juke (nickysap Farcaster audio client) chosen instead.
- Code staying in ZAOOS but marked `project_fishbowlz_deprecated.md`.

### ZOE learning pings cron

- Python script at ~/zoe-learning-pings/run.sh.
- KILLED Phase 4 (Doc 601): replaced with bot/src/zoe/scheduler.ts (node-cron, same cadence, better quality).

### Bot-to-bot bridge autonomy

- Bridge group created 2026-05-03, immediately revealed the smell: "building 2 bots to coordinate 2 bots."
- DEFERRED PERMANENT until Bonfire SDK lands.
- Group stays passive-ingest only.

---

## 3. What Shifted Mid-Flight

### ZOE multiple pivots

- Started as OpenClaw Minimax brain (Doc 234 era)
- Shifted to Bonfire-as-ZOE (Doc 601 Option B)
- Landed on Hermes-brain (@zaoclaw_bot identity preserved) - Doc 601 Option D
- Each shift responded to live bottleneck discovery, not planning error

### ZAOscribe to ZAO Craig rename

- Task-tracking tool for ZAOstock was called "ZAOscribe" in early research
- Renamed to "ZAO Craig" in Doc 670 (Iman call 2026-05-18)
- Reflects the actual user need: a concierge for structured daily capture + tracking, not just scribing

### Task tracker schema evolution

- Originally designed as ZAOstock-specific (todos, timeline, circles)
- May 20 session (2026-05-20) audited both ZAOstock + ZAOcoworking systems
- NEW MODEL: unified `tasks` table with `project` discriminator (zaostock/zaodevz/wavewarz/...) instead of two separate schemas
- Doc 692 (PR #588) locks the unified field-by-field mapping
- Greenfield rebuild on new Supabase instead of live migration (lower risk, cleaner)

### Tracker ownership model

- ZAOcoworking initially used 6-value enum (Zaal/Iman/Both/ThyRev/Samantha/Open)
- Unified model switches to UUID FK to team_members (extensible, properly relational)
- Discovered via Iman's live bot: enum doesn't scale

### Bonfire read cadence

- Initially: Bonfire queries returned [] until admin manually labeled nodes
- Learned: must pre-label corpus or build topic inference
- Not a code fix - architectural learning about graph density requirements

---

## 4. Recurring Patterns That Worked

### Hermes coder + critic + auto-PR

- Proven in live PR #461 (2026-04-25): safe-git-push.sh + pre-push hook + PreToolUse hook.
- Pattern: on /SHIP FIX, spawns coder subprocess, runs it against PR, generates fix, creates auto-PR.
- Zero API billing (uses Max plan), stable Opus quality.
- Used for real fixes in ZAOOS, cowork-zaodevz, other repos.

### Skills as commands (/meeting, /bonfire, /zao-research, /vps, etc.)

- ~75 skills available in the skill list at session start.
- Dispatching pattern: when user types `/X`, invoke the Skill tool before doing anything.
- Reduced redundant tool chains, made complex operations repeatable.
- Key skills that recurred: /zao-research (batch fetch), /plan-eng-review (structure), /verify (run app).

### Subagent dispatch for multi-dimensional research

- Doc 694: 8 parallel research agents, one per folder group, scored 649 docs in bulk.
- Pattern: when a task is inherently parallelizable (audit all folders, check all repos), dispatch agents instead of inlining.
- Feedback memory `feedback_ship_and_use_not_meta.md`: use what's shipped, don't spend session time fixing process.

### Doc-per-meeting + cross-link via related-docs

- ZAOstock standup (2026-05-19) -> Doc 681 (research recap) -> Doc 682 (meeting index)
- ZAO Devz call (2026-05-11) -> Doc 640 (Magnetiq spec) + Doc 642 (AttaBotty spec)
- Pattern: frontmatter `related-docs: [...]` creates a graph of meeting -> decision -> implementation docs.
- Became the search strategy: grep for a doc, jump via related-docs to context.

### Bonfire episode posts as unifying graph

- Every major research doc linked via bonfires.ai episodes.
- Episode = one entry point, contains all related docs + quotes + cross-links.
- Replaced the need for a centralized wiki index; Bonfire's graph IS the index.
- Used in memory consolidation + session handoffs.

### Two-tier scripts: local fast path + VPS fallback

- Example: bot/src/zoe/claude-cli.ts + Ollama at :11434
- Ollama for fast classify (entity/intent) - stays local
- Claude CLI for write/research - goes to VPS if needed
- Pattern found across: local-fast (mlx-whisper), VPS-capable (Hermes), Bonfire-capable (graph queries)

### Memory consolidation into project_*.md files

- Every major decision + recurred topic -> its own memory file
- Examples: project_hermes_canonical, project_zaostock_spinout, project_fractal_process
- Feedback memory `feedback_research_before_grill.md`: always /zao-research existing sources first.
- Session start: read memory MEMORY.md to avoid re-discovering old decisions.

### Supabase RLS when needed, service-role-only for simplicity when not

- ZAOstock: currently service-role only (no RLS), but doc 692 greenfield build includes RLS from day one.
- Pattern: prototype with service-role (faster), migrate to RLS before graduation to own repo.

---

## 5. Recurring Frictions

### Branch thrash from parallel sessions sharing one workdir

- Feedback memory `feedback_workspace_worktrees.md` (locked 2026-04-20): always use worktrees or /worksession.
- Feb-Mar: multiple Claude sessions editing ZAOOS root directly, branch collisions, lost commits.
- Fix: enforced `ws/` branch discipline. Every session gets its own worktree.
- Still recurring: new developers sometimes skip /worksession, create branches off outdated main.

### Two-copy skill drift (repo + user ~/. claude/skills/)

- Skills stored in TWO places: bettercallzaal/.claude/skills/ (in repo) and ~/.claude/skills/ (local).
- When a skill updates in repo, local copy isn't auto-synced.
- Example: /zao-research v1 vs v2 fetch chain (Doc 693), skill updated in repo but old version ran locally for 2 sessions.
- Unfixed friction: no canonical source-of-truth, manual sync required.

### Secret-hygiene incidents

- Doc 473 (fifth-builder incident): deployer private key leaked into AUDIT_REPORT.md on public repo.
- Secret-hygiene.md adopted as canonical guard (5 steps, pre-commit scanning, post-complete repo scan).
- Recurring: even with guards, developers slip. One session required pre-commit hook audits before shipping agent PRs.
- Pattern that worked: step 2 (pre-commit staged-diff scan) caught 3 near-misses before push.

### Bonfire read returning [] until admin labeling

- Bonfire KG needs pre-labeled corpus to be useful.
- First few sessions: queries returned empty until Joshua.eth manually tagged nodes.
- Workaround: daily Bonfire "brief" prompt to inject context, not relying on pure query.
- Architectural insight: graph density matters; sparse graph = empty queries.

### Doc-number collisions from parallel sessions

- Handoff doc 2026-05-20: "doc numbering is colliding across parallel sessions (682, 683 each got used twice)."
- Proposed fix: next session picks high/safe number + `git fetch` all branches first.
- Still unfixed: no atomic doc-number reservation system.

### VPS env scattered across hosts

- ZAOstock bot: .env at ~/zaostock-bot/.env on VPS
- ZAOcoworking bot: .env at ~/cowork-zaodevz/.env on Iman's VPS (187.77.3.104)
- Hermes: .env somewhere else
- Pattern problem: no canonical script to verify all .env files are in sync.
- Partly fixed by Doc 644 template (shared sync-supabase-env.sh pattern), but adoption incomplete.

### ZAOcoworking bot fixes deployed live, not in version control (Doc 672 A1)

- v2.16 (batch suggestions) + v2.17 (group confirmation) deployed to Iman's VPS.
- Agent code at /root/cowork-zaodevz/agent/ never in version control.
- Handoff doc 2026-05-20: "if that bot is ever rebuilt from its repo, these fixes vanish."
- Action: carry fixed agent/ into the fork (green-field rebuild plan handles this).

### Metadata debt in research library

- Doc 694: 111 of 649 docs marked REVALIDATE (stale/missing dates).
- 117 marked RE-RESEARCH (thin: stubs, missing Sources, info loss).
- Root cause: docs created in research sprints without standardized frontmatter.
- Cheap fix (metadata scripted refresh) proposed but unexecuted as of 2026-05-23.

---

## 6. Quantitative Summary (Feb 23 - May 23, 2026)

| Metric | Value | Notes |
|--------|-------|-------|
| **Git commits (ZAOOS main branch)** | 2,161 | `git log --since="2026-02-23" --until="2026-05-23"` |
| **Research docs (total live)** | 851 | `find research/ -name README.md \| wc -l` |
| **Open PRs + merged (all time)** | ~500 | Approximate from gh pr list; many merged. |
| **Skills available** | 75+ | Listed at session start; custom + vendor. |
| **Agent surfaces live** | 5 | ZOE, Hermes, Bonfire, ZAOstock bot, Claude CLI. |
| **Bots killed or paused** | 7 | OpenClaw + ZOEY/WALLET/FISHBOWLZ/Composio AO + learning pings. |
| **Days elapsed** | 73 | 2026-02-23 to 2026-05-23 |
| **Tier-STANDARD research docs** | ~200 | Estimate; most audit/decision docs landed here. |
| **Bonfire KG nodes** | 1100+ | Per Doc 549 (Bonfire power-user playbook). |

---

## 7. What's Next (Open Threads at Session-End)

### Brand-label tracker schema (Doc 692, PR #588 queued)

- Unified tasks table with `project` discriminator (zaostock/zaodevz/wavewarz/...) instead of separate schemas.
- Greenfield build on new Supabase + new GitHub org (thezao).
- OPEN: confirm fork scope, new repo name, canonical actions.json source, RLS posture for new DB.
- Handoff doc 2026-05-20 Section 6 has the 5 decisions to lock before building.

### ZAOcoworking bot fixes into version control (Doc 672, handoff section 3)

- v2.16 (batch suggestions) + v2.17 (group confirmation) deployed live, not in repo.
- Action: commit agent/ into the fork so fixes survive rebuild.
- Local copy: /Users/zaalpanthaki/Documents/cowork/agent/ (with both fixes, .env removed).

### Sherpa-onnx diarization for transcripts

- Music research (Docs 333/334) identified speaker diarization as P0 for ZAO Stock Oct 3 speaker curation.
- Doc 567 + 568: local LLM research, Ollama vs Open WebUI vs LiteLLM.
- Not yet shipped; VPS 1 has no GPU (constraint).
- Next session: decide on MVP (cloud API vs local workaround).

### ZAO ops system consolidation (Doc 713 area)

- Multiple task-tracking systems (ZAOstock, ZAOcoworking) colliding.
- Doc 692 proposed unification; greenfield build underway.
- Future: connect Hermes (fix-PR pipeline) + ZOE (captures) + Bonfire (graph) as one ops stack.
- Not yet unified; three separate backends still.

### PR #593 conflict + rescue

- Mentioned in memory as needing resolution; specifics not in docs reviewed.
- Mark for next session: check gh pr view 593.

### Memory consolidation remaining

- Doc 694 flagged 117 docs as RE-RESEARCH (thin), 111 as REVALIDATE (metadata debt).
- Proposed: scripted metadata refresh (cheap, no re-research).
- Execution: zero sessions spent on this; deferred pending Zaal approval (Decision #1 in Doc 694).

### Skills drift resolution

- /zao-research v1 vs v2 discovered live, local copy slower.
- No canonical skill-sync process yet.
- Proposed: CI/CD check that ~/.claude/skills/ matches repo version on session start.

---

## Sources

- **Doc 601** (2026-05-04) - Agent Stack Cleanup Decision, locked Hermes + 5-surface model
- **Doc 644** (2026-05-11) - ZAO Agent Stack Canon + Team Bot Template, locked Hermes pattern for all bots
- **Doc 672** (2026-05-18) - ZAOcoworking Bot Full Audit, identified v2.16/v2.17 fixes not in repo
- **Doc 694** (2026-05-20) - Research Library Audit, 649 docs scored, metadata debt identified
- **Doc 649** (referenced in memory) - 84-repo survey of Zaal's builder patterns
- **Handoff 2026-05-20** - Full context for tracker unification + ZAOcoworking fixes
- **Memory files** - project_hermes_canonical, project_zaostock_spinout, feedback_workspace_worktrees, etc.
- **Git log** - 2,161 commits Feb 23 - May 23
- **PR audit** - ~500 PRs merged in the period
- **Session logs** - patterns extracted from parallel-session friction, decision reviews, meeting recaps

---

## Lessons to Lock for Next 3 Months

1. **Hermes is the agent framework.** No new AI pipelines; extend Hermes pattern.
2. **Five surfaces is the ceiling.** Every new bot proposal gets a research doc + Zaal approval.
3. **Monorepo-as-lab scales.** When a product is public-ready, spin it out. Don't let old code rot.
4. **Bonfire is the graph.** Don't build parallel KG systems; use Bonfire + SDK when available.
5. **Metadata debt is cheap to fix early.** Standardize frontmatter on day 1, not 6 months later.
6. **/worksession discipline prevents chaos.** Every session, every branch, enforced.
7. **Skill drift is real.** Canonical source needed; consider monorepo-as-toolkit pattern.
8. **Secret hygiene is non-negotiable.** All 5 guards from secret-hygiene.md on every agent PR.
9. **Doc-per-meeting + related-docs = search strategy.** Keep frontmatter clean; grep works.
10. **Two-tier scripts (local + VPS fallback) reduce friction.** Prototype local, scale to VPS when needed.

---

## Next Actions

| Action | Owner | Type | Priority |
|--------|-------|------|----------|
| Lock 5 decisions in Doc 692 Section 6 (fork scope, new GitHub, canonical actions.json, RLS, bot dual-write) | @Zaal | Decision | P0 |
| Commit ZAOcoworking bot v2.16/v2.17 fixes into version control before rebuild | Claude | Code | P0 |
| Execute Doc 694 Decision #1: scripted metadata refresh on 111 REVALIDATE docs | Claude (if approved) | Batch fix | P1 |
| Build sherpa-onnx diarization spike or choose cloud API for music research | Claude + Zaal | Research | P1 (Oct 3 time-sensitive) |
| Design + propose skill-sync CI/CD check to prevent drift | Claude | Design | P2 |
| Audit all .env files across VPS hosts, consolidate into template | Claude + Iman | Infra | P2 |

---

**Last Updated:** 2026-05-23  
**Status:** Research-complete, ready for next 3-month sprint planning
