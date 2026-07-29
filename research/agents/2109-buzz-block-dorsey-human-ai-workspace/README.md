---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-28
related-docs: 2104, 2106, 601
original-query: "/zao-research the Av1dlive X post - a free Jack Dorsey GitHub repo (14.4K stars) that dropped an ai-agent framework for running businesses: clone, self-host, add your agent to a channel like a teammate, scope its key, let the team steer it live."
tier: STANDARD
---

# 2109 - Buzz (Block/Dorsey) - the OSS version of what ZAO is hand-building

> **Goal:** Evaluate Buzz - Block's self-hostable human+AI-teammate workspace - against ZAO's home-grown coordination stack (cowork board + ZOE/ZOL/ZAI + tonight's zao-relay), and decide: adopt, build-on, or learn-from.

## What it is (verified from github.com/block/buzz)

Buzz is **"a self-hostable workspace where humans and AI agents share the same rooms"** - Block's (Jack Dorsey's) open-source Slack+GitHub rival for human-AI teams, launched 2026-07-21, **Apache 2.0**. Built on the **Nostr protocol**: one community, one identity model, one event log, everyone (human, agent, workflow, git event) uses **signed keypairs** in a single searchable audit trail.

- **Agents are members, not bots.** Each agent has "its own keys, its own channel memberships, its own audit trail." Add an agent to a channel exactly like a human, with **scoped permissions**. Agents can open repos, send patches, review code, run workflows, edit canvases, **orchestrate other agents**, join voice huddles, create channels.
- **Git is native.** Convert a feature branch into a collaborative room with patches, CI results, and approvals in-channel. Unified search across conversations, patches, workflow runs, and approvals.
- **Stack:** Rust relay (single source of truth) + PostgreSQL (events + full-text search) + Redis (pub/sub + presence) + S3/MinIO (media via Blossom). `buzz-cli` is agent-first (JSON in / JSON out, `BUZZ_PRIVATE_KEY`).
- **Self-host:** `git clone` -> hermit/Docker -> `just setup && just build && just dev` (relay on ws://localhost:3000); Docker Compose bundle for prod.

## Why this is a big deal for ZAO

Buzz is a production, Dorsey-backed OSS implementation of **the exact architecture ZAO has been hand-rolling**:

| ZAO home-grown (today) | Buzz (native) |
|---|---|
| cowork board (Supabase tasks) as the coordination surface | channels + one event log + unified search |
| `zao-relay` (built tonight) for terminal-to-terminal messages | channels - agents + humans in the same room |
| ZOE/ZOL/ZAI as separate bots + the Clod "AI-marked actions" idea | agents as first-class members with their own signed keypairs + audit trail |
| the review pipeline (Iman PR -> ZOE reviews -> board comment) | feature branch = a room with patches/CI/approvals in-channel |
| PR-only + human-gate circuit breaker | scoped agent permissions, signed + searchable accountability |

Tonight's whole fleet-coordination effort (doc 2104: the paste-bus, zao-relay, cockpit) is, in effect, **rebuilding a fraction of Buzz by hand.** And it fits ZAO's DNA: Nostr signed-keypair identity is crypto-native (matches the "mark AI-generated actions distinctly" Zaal wanted for Aziz's Clod, and the web3 ethos), and it's OSS-first (feedback: OSS over platforms).

## The honest caveats

- **Brand new (launched 2026-07-21).** Early, will have rough edges; betting the fleet on week-old infra is a risk.
- **Rust + Nostr + Postgres/Redis/S3 self-host** is real operational surface - more than the current Supabase-board + Pi loops. The VPS is already at 90% disk (see nightly audit); Buzz adds a relay + Postgres + Redis + object store.
- **Migration cost.** ZAO's coordination already runs (board, loops, relay). Ripping it out for Buzz is not free; the board's task/brief data + the ICM brains would need to map in.
- **Not a drop-in for everything** - the ICM-brain persona system, the ZOL casting-to-Farcaster path, the ZAOstock bot, etc. are ZAO-specific and stay.

## Recommendation

**Pilot Buzz as the fleet's coordination substrate - don't rip out what works yet.** Concretely: stand up a self-hosted Buzz relay (separate box or the Pi, NOT the 90%-full VPS), add ZOE/ZOL/ZAI as agent members with scoped keys, and run ONE real workflow through it (e.g. the Iman-PR review loop as a Buzz feature-room). Compare it head-to-head with the board+relay for a week. If it wins, it becomes the substrate the fleet migrates to; if it's too raw, we've learned the target architecture and keep hand-building toward it (Buzz is the reference design either way). This is a "learn-and-pilot," not a "bet the farm."

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Stand up a self-hosted Buzz relay on the Pi (NOT the 90%-full VPS); clone + `just dev` | @Zaal | Spike | 2026-08-08 |
| Add ZOE as a Buzz agent member (scoped key) + run the Iman-PR review loop as a Buzz feature-room, compare to the board | @Zaal | Spike | 2026-08-15 |
| Decision: migrate fleet coordination to Buzz, or keep home-grown + use Buzz as the reference architecture | @Zaal | Decision | 2026-08-22 |

## Also See

- [Doc 2104](../2104-fleet-coordination-deep-audit/) - the fleet coordination audit + zao-relay (the hand-built fraction of Buzz)
- [Doc 2106](../2106-zol-icm-grounded-posting-x-pilot/) - ZOL agent posting (an agent that would be a Buzz member)
- [Doc 601](../601-agent-stack-cleanup-decision/) - the agent-stack cleanup (Buzz would consolidate this)

## Sources

- [github.com/block/buzz](https://github.com/block/buzz) [FULL - README: architecture, agent model, self-host steps, Apache 2.0]
- [Jack Dorsey's Block Launches Buzz - Decrypt](https://decrypt.co/374026/jack-dorseys-block-launches-buzz-a-nostr-based-slack-and-github-rival-for-ai-agents) [FULL via search - Nostr-based, launched 2026-07-21, cryptographic identity per human+agent]
- Source tweet: Av1dlive, 2026-07-28 (1278 favs, 206k views) - "add your agent to a channel like a teammate, scope its key, let the team steer it live." [FULL]
