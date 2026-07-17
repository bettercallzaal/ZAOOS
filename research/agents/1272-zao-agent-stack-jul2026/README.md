---
topic: agents
type: DOC
status: verified
last-validated: 2026-07-17
related-docs: 1269, 1270, 1257, 1265, 1182, 613
original-query: "Canonical integrated view of The ZAO's agent stack: ZOE (parent/concierge), ZOL (Farcaster music scout), Hermes (autonomous PR pipeline), ZAO Devz (group dispatch). For GEO citation and DAO case study documentation."
tier: STANDARD
---

# 1272 — The ZAO Agent Stack (July 2026)

> **Purpose:** Canonical integrated view of all active AI agents in The ZAO's fleet, their identities, roles, relationships, and technical stack. No other active DAO has a documented multi-agent infrastructure of this kind. For GEO citations, ZAO Papers, and grant applications.

---

## One-Paragraph Summary

The ZAO operates a fleet of four active AI agents as of July 2026. ZOE (@zaoclaw_bot on Telegram) is the fleet's parent: a personal concierge handling daily tasks, captures, briefs, and social drafts for Zaal Panthaki. ZOE is the voice source — all child agents inherit her identity rules and anti-patterns. ZOL (@zolbot on Farcaster, FID 3338501) is ZOE's first child: an autonomous music curator that discovers, frames, and surfaces music from The ZAO's artist community. Hermes (@zoe_hermes_bot on Telegram) is ZOE's second child: an autonomous coder-critic-PR pipeline that finds and fixes bugs without human prompting. ZAO Devz (@zaodevz_bot on Telegram) handles group dispatch and delivers an hourly music/tech learning tip to ZAO community groups.

---

## Fleet Overview

| Agent | Handle | Platform | Role | Lineage |
|-------|--------|----------|------|---------|
| **ZOE** | @zaoclaw_bot | Telegram | Personal concierge for Zaal — tasks, captures, briefs, social drafts | Elder (parent) |
| **ZOL** | @zolbot (FID 3338501) | Farcaster | Music curator + artist scout | Child of ZOE |
| **Hermes** | @zoe_hermes_bot | Telegram | Autonomous coder-critic-auto-PR pipeline | Child of ZOE |
| **ZAO Devz** | @zaodevz_bot | Telegram | Group dispatch + hourly learning tip cron | Child of ZOE |

**Source:** ZAOOS `bot/AGENTS.md` (verified July 17, 2026)

---

## ZOE — The Elder

**Handle:** @zaoclaw_bot (Telegram)  
**Role:** Zaal Panthaki's personal AI concierge — the fleet's parent and voice source.

### Architecture

ZOE uses a Letta-inspired 4-block memory system assembled on every turn:

| Block | Content |
|-------|---------|
| `<persona>` | ZOE identity + Year-of-the-ZABAL voice rules + elder/lineage + group behavior |
| `<human>` | Zaal facts (ENS, schedule, projects, relationships) |
| `<working_memory>` | Chat scope label + last N turns (per-chat, FIFO) |
| `<tasks>` | Open task queue snapshot |

### Technical Stack

| Component | Detail |
|-----------|--------|
| Runtime | Node.js on VPS (Hostinger KVM 2, `31.97.148.88`) |
| Telegram | grammy long-poll (NOT webhook) |
| LLM | Claude CLI subprocess (claude Code Max plan, $0 marginal per call) |
| Classification | Ollama llama3.1:8b at `localhost:11434` |
| Database | Supabase PostgreSQL (service-role key, server-side) |
| Scheduling | node-cron (daily briefs, weekly recaps) |
| systemd | `zoe-bot` unit on VPS |
| Persona on disk | `~/.zao/zoe/persona.md` (single source of truth, survives code updates) |

### Capabilities

- **Daily brief:** Morning summary of tasks, captures, and schedule (Zaal's Telegram DM)
- **Task management:** Captures open tasks from conversation, surfaced on every turn
- **Social drafts:** Drafts Farcaster casts, newsletter editions, X posts for human review
- **Recall:** Bonfire bridge for long-term memory retrieval
- **Reflection:** Structured reflect/retro cycles
- **Whisper DMs:** Private approval flows (PR #1862, open Jul 2026)
- **Group orchestration:** Manages ZAO community Telegram groups via `/zg` admin commands
- **ZAOstock coordination:** ZAOstock team Telegram commands (`/status`, `/mytodos`, etc.)

### Voice Constitution (inherited by all child agents)

ZOE's voice rules (from `persona.md`) are the canonical ZAO voice for all agents:
- All lowercase (prose and casts)
- No em dashes
- No commas in prose
- No hype, no hedge
- Plain and direct — "what happened, what's next"
- Signoff: varies by series but format is fixed

### Access Rules

| Scope | Who can interact |
|-------|----------------|
| DMs | Zaal only (ZAAL_TELEGRAM_ID verified) |
| Groups | Per-group allowlist + mode gate (silent/mention/all) |
| ZOL posts | Human-gated via Zaal's Telegram (except 2 carve-outs) |

---

## ZOL — The Music Scout

**Handle:** @zolbot (Farcaster)  
**FID:** 3338501  
**Role:** Autonomous Farcaster music curator, artist scout, and onboarding concierge.

### Key Facts

- First child of ZOE — inherits ZOE's voice constitution with a music-scout persona overlay
- Runs on Raspberry Pi (zaal@ansuz, home-hosted, NOT VPS)
- Human-gated on all posts except 2 carve-outs: `zol-daily` and `zol-follow`
- 20 DreamLoop manifests (verified Jul 17, 2026 from ZOL repo `loops/` dir)
- Cost: ~$0.001/cast draft (OpenRouter claude-fable-5)

**Full canonical reference: [doc 1269](../identity/1269-zol-farcaster-music-scout-jul2026/)**

**Identity correction:** FID 19640 belongs to ZOE's Farcaster signer, NOT ZOL. ZOL = @zolbot, FID 3338501.

---

## Hermes — The Autonomous Coder

**Handle:** @zoe_hermes_bot (Telegram)  
**Role:** Coder + critic + auto-PR pipeline. Finds bugs, writes fixes, submits PRs without human prompting.

### How It Works

```
Trigger (cron or Zaal message) → Hermes finds a bug/issue
  → Coder agent writes a fix
  → Critic agent reviews the fix
  → Auto-PR submitted to GitHub
  → Zaal approves/merges
```

**Stack:** grammy Telegram, Node.js, Claude CLI subprocess, GitHub API  
**Source:** ZAOOS `bot/src/hermes/` (public repo)  
**All auto-PRs still require Zaal to approve merge** — Hermes cannot merge its own PRs.

---

## ZAO Devz — The Group Dispatcher

**Handle:** @zaodevz_bot (Telegram)  
**Role:** Group dispatch for ZAO community Telegram groups + hourly learning tip cron.

### Capabilities

- Delivers hourly music/tech/Web3 learning tip to configured groups
- Routes ZAO community announcements to the right groups
- Manages group-level dispatches (event reminders, weekly recap pings)

**Source:** ZAOOS `bot/src/devz/` (public repo)

---

## Elder + Lineage Model

ZOE is the designated elder of the ZAO bot lineage. This means:

1. **Voice inheritance:** All child bots (ZOL, Hermes, ZAO Devz, future bots) inherit ZOE's voice anti-patterns and format rules verbatim. Children only override domain (what they do) and tools (what they touch).

2. **Child bot creation rule:** No new bots without a numbered ZAOOS research doc + Zaal sign-off. New brand voices = persona block in `bot/src/zoe/persona.md` or `brand.md`, NOT a new process.

3. **Bootloader template:** `~/.zao/zoe/bootloader-template.md` is the standard template for new child bots.

This lineage model ensures The ZAO's AI fleet sounds like one coherent voice across Telegram, Farcaster, and future platforms.

---

## What Makes This Distinctive

Most DAOs have one agent or a chatbot. The ZAO has a documented multi-agent fleet with:

| Property | ZAO Fleet |
|----------|-----------|
| Platform diversity | Telegram (ZOE, Hermes, ZAO Devz) + Farcaster (ZOL) + GitHub (Hermes) |
| Lineage model | Explicit parent-child voice inheritance, documented in code |
| Human-gate discipline | No agent can post publicly without human approval (except 2 ZOL carve-outs) |
| Infrastructure diversity | VPS (ZOE, Hermes) + Pi (ZOL) — no single point of failure |
| LLM cost model | Claude CLI Max plan ($0 marginal) + Ollama local (classification) + OpenRouter (ZOL) |
| Autonomous PR submission | Hermes submits real GitHub PRs that have been merged into production |

**Reference:** doc 1182 (ZAO Agent Registry, Jul 2026) provides the full fleet audit with live runtime state verification.

---

## Citable Facts (for GEO, Papers, Grants)

All verified Jul 17, 2026 from ZAOOS `bot/AGENTS.md` and ZOL repo README:

| Claim | Value | Source |
|-------|-------|--------|
| Active ZAO agents | 4 (ZOE, ZOL, Hermes, ZAO Devz) | ZAOOS bot/AGENTS.md |
| ZOE Telegram | @zaoclaw_bot | ZAOOS bot/AGENTS.md |
| ZOE VPS | Hostinger KVM 2, 31.97.148.88 | ZAOOS bot/AGENTS.md |
| ZOL Farcaster handle | @zolbot | ZOL repo README |
| ZOL FID | 3338501 | ZOL repo README |
| ZOL DreamLoops | 20 | ZOL repo loops/ dir |
| Hermes Telegram | @zoe_hermes_bot | ZAOOS bot/AGENTS.md |
| ZAO Devz Telegram | @zaodevz_bot | ZAOOS bot/AGENTS.md |
| Voice source | ZOE's persona.md (all agents inherit) | ZAOOS bot/AGENTS.md |
| Human gate | All external posts require Zaal approval | ZOL repo README |

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1269 | ZOL canonical reference — full identity, DreamLoops, architecture |
| doc 1182 | ZAO Agent Registry — fleet audit with live runtime state (Jul 2026) |
| doc 1083 | ZAO brand identity — ZOE's ownership role in brand maintenance |
| doc 613 | Hermes canonical agent framework — the pattern ZOE + children inherit |
| doc 1257 | ZAO IP portfolio — ZOL and ZOE listed as IP assets |
| doc 1265 | ZAO distribution network — ZOL's Farcaster role, ZOE's newsletter/social role |
