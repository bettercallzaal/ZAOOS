# 257 — ZOE Ship Log: Apr 3 2026

**Date:** 2026-04-03
**Category:** Operations / Ship Log
**Status:** Complete

---

## What Shipped

### PR #101 — Merged to main
- Docs 251-256 covering publish.new agent marketplace, autoagent patterns, ZOE ecosystem status
- VPS SSH direct access skill
- ZOE repo pulled and up to date on VPS

### ZOE Identity + Architecture
- ZOE's SOUL.md fully updated with real identity, git workflow, ZOE↔ZOEY delegation protocol
- ZOEY agent workspace created (SOUL.md, AGENTS.md, tasks/, results/)
- ZOE's primary mission defined: **best agent curator + creator for ZAO ecosystem**

### MEMORY.md + TASKS.md
- MEMORY.md updated with full agent ecosystem architecture
- TASKS.md updated with current queue
- Standing orders established

### New Standing Orders
- **Save everything as research:** Every significant finding from Telegram convos must be committed to ZAOOS repo as numbered research doc. Format: `research/XXX-topic/README.md`. Use branch + PR workflow.
- **`/zao-research [topic]`:** When Zaal says this in Telegram, ZOE searches existing research library + does new web research + saves findings as next numbered research doc in the repo.

---

## ZOE ↔ ZOEY Stack Established

**ZOE** (orchestration layer — me):
- Stays on VPS, manages workspace, coordinates, plans
- Delivers all Zaal-facing communications
- Git workflow: branch → commit → push → PR

**ZOEY** (action agent):
- Goes out and does things in the world
- Registers for platforms, plays poker, monitors communities
- Tasks: `zoey/tasks/YYYY-MM-DD-taskname.md`
- Results: `zoey/results/YYYY-MM-DD.md`
- Spawned via `sessions_spawn`

**Communication:** ZOEY writes results → ZOE synthesizes → reports to Zaal

---

## Agent Ecosystem Architecture

```
ZOE (overseer / factory)
├── ZOEY (action agent — front-facing)
├── FISHBOWLZ Agent (persistent audio spaces)
├── Artist Agent Template (everything but the music)
├── Member Assistant Agents (personalized per member)
└── Future: self-replicating factory
```

---

## Key Decisions Made

1. **ClawDown poker:** ZOE registered as agent, API key stored in `~/.clawdown/api_key`
2. **publish.new:** Agent-friendly CLI, x402 micropayments, skill exists
3. **FISHBOWLZ:** Built as ZAOOS miniapp, HMS audio, fishbowl rotation format, JSONL logging
4. **X Spaces integration:** yt-dlp approach (free), works for audio capture but one-way

---

## Open Items

- [ ] Neynar API key — current one is invalid, need fresh key
- [ ] ClawDown API key — on different machine, need to retrieve or re-register
- [ ] FISHBOWLZ MVP — PR #102 open, needs review + migration applied
- [ ] AgentMail — setup deferred
- [ ] publish.new listing — deferred until FISHBOWLZ MVP shipped
