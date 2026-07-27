---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-07-27
related-docs: 601, 2030, 2088
original-query: "https://github.com/block/buzz - research this GitHub repo (Block Inc's buzz project). What it is, what it does, the stack, license, activity/maturity, and any relevance/applicability to the ZAO ecosystem (agents, music, dev-workflows, infra). Tier STANDARD."
tier: STANDARD
---

# 2089 - Block's Buzz: humans + AI agents as peers on a Nostr relay

> **Goal:** Assess Block Inc's open-source "Buzz" workspace and decide whether ZAO should adopt it, borrow from it, or just monitor it - specifically for the multi-agent + human coordination problem ZOE already has.

## Key Decisions (recommendations first)

| Decision | Call | Why |
|----------|------|-----|
| Adopt Buzz as ZAO's workspace | **NO** | Adoption is a migration off Discord + GitHub + Telegram, not an integration. ZAO's stack is Vercel/Supabase/Neynar (web2 SaaS + web3 auth); Buzz is Nostr-native. Wrong cost/benefit today. |
| Borrow ONE idea: signed, receipted cross-agent handoffs | **YES - investigate** | Buzz's core novelty is that every agent action (message, PR, review, merge) is a signed Nostr event with a cryptographic audit trail. ZAO's cross-lane coordination is currently unsigned manual clipboard hand-offs (this very session: ZOE lane <-> ZAOcowork lane via copy-paste). That is the exact gap Buzz's model closes. This also rhymes with the DreamNet receipt work (doc 2030). |
| Monitor Buzz as a reference architecture | **YES** | 14.6k stars in ~4.5 months, Block runs it internally to replace Slack + GitHub. It is the most credible real-world "agents as team members" design to watch for agent-scaling + CLI-agent patterns. |

**One-line take:** Buzz is a strategic *learn*, not a *roadmap item*. The idea worth stealing is signed/receipted agent handoffs; the product is not for ZAO's music/community vertical right now.

## What it is

Buzz (github.com/block/buzz, Apache-2.0, launched 2026-07-21) is Block Inc's open-source workspace that unifies team chat, code hosting, and AI-agent coordination on a single **Nostr relay per community**. Humans and AI agents are peer participants - each with a cryptographic identity - and every action is a signed event, giving a tamper-evident audit trail. Block is dogfooding it internally to replace both Slack and Chat and GitHub. It is self-hostable (an org runs its own relay, keeping data off Block's servers).

## Findings

| Dimension | Detail |
|-----------|--------|
| **Core capability** | Unified messaging (channels/threads/DMs, media comments anchored to code frames) + git (patches, CI results, reviews, merges stored as signed Nostr events) + YAML workflow automation with approval gates. Agents get repo access, issue triage, workflow orchestration, channel creation - as full members, not bot integrations. |
| **Agent interface** | CLI-first, supports tool-calling LLMs - Goose (Block's own), Codex, and Claude Code named explicitly. |
| **Stack** | Rust 54% (13.5M bytes, the relay backend, Axum + PostgreSQL + Redis pub/sub + S3-compatible storage) - TypeScript 39% (frontend/tooling, React) - plus Dart/Kotlin/Swift mobile SDKs. |
| **License** | Apache License 2.0 (permissive - forkable). |
| **Maturity** | 14,571 stars, 1,242 forks, 801 open issues. Created 2026-03-06, last push 2026-07-27 (same day - extremely active). ~4.5 months old, production-grade (Block runs it internally). |
| **Community reception** | HN launch thread ~374 upvotes / ~331 comments. Serious technical discussion; skepticism centered on "agent choreography" complexity. |

Specific numbers: 14,571 stars; 1,242 forks; 801 open issues; created 2026-03-06; Rust 54% / TS 39% of the codebase.

## Relevance to ZAO

**Where it lands (yes):**
- **The coordination problem is ZAO's problem.** This session ran two Claude lanes (ZOE + ZAOcowork) coordinating over the same Supabase board via manually copy-pasted clipboard blocks - with an explicit "do not double-run the SQL" caveat because there was no shared, verifiable state. Buzz's signed-event model is a principled answer to exactly that: agents as peers writing to one auditable log. See the fleet + orchestration surfaces (doc 601 agent-stack cleanup).
- **Signed agent work aligns with ZAO's verifiable-identity bias** (Farcaster signers, XMTP identities) and with the DreamNet receipt emission ZAO already does (`dreamnet.receipt.v1`, doc 2030). The "every action is a receipt" idea is not foreign - Buzz just makes it the substrate.
- **Same LLM tier.** Buzz's CLI targets Claude Code, which is ZOE's own coder brain - so the agent-interface patterns are directly readable.

**Where it does not (no / unclear):**
- **Migration, not integration.** ZAO lives on Discord (cowork), GitHub (code), Telegram (ZOE). Buzz would replace all three. Not worth it now.
- **Different agent model.** Buzz = agents as channel peers; ZOE = orchestrator-centric (one Telegram bot, DMs for questions, group for status). Different UX + governance.
- **Vertical mismatch.** Buzz is generalist team tooling; ZAO is vertical for music creators + web3 communities (SongJam, ZABAL Games, COC Concertz). No creator-platform angle in Buzz.

## Also See

- [Doc 601](../601-agent-stack-cleanup-decision/) - the ZAO agent-stack cleanup (ZOE as the one orchestrator)
- [Doc 2088](../2088-zai-discord-voice-auto-capture/) - ZAI Discord capture (another "borrow OSS, don't adopt wholesale" call)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Read this doc + decide: monitor-only, or spike a signed/receipted cross-lane handoff for ZOE (vs the current manual clipboard) | zaal | Decision | 2026-08-05 |
| If spiking: draft a design doc for signed ZOE<->cowork handoffs, reusing the existing `dreamnet.receipt.v1` emission (doc 2030) rather than adopting Nostr | zaal | Research doc | 2026-08-12 |
| Re-validate Buzz's maturity + any ZAO-relevant features (staleness check on this fast-moving repo) | zaal | Doc update | 2026-09-27 |

## Sources

- [github.com/block/buzz](https://github.com/block/buzz) - [FULL] README + project description
- [api.github.com/repos/block/buzz](https://api.github.com/repos/block/buzz) - [FULL] stars/forks/issues/dates/license
- [api.github.com/repos/block/buzz/languages](https://api.github.com/repos/block/buzz/languages) - [FULL] language byte breakdown
- [tftc.io - Buzz launch coverage](https://www.tftc.io/buzz-block-nostr-ai-agent-workspace-launch) - [PARTIAL] launch date + core features (community coverage, not primary)
- [cryptobriefing.com - Block launches Buzz](https://cryptobriefing.com/block-launches-buzz-nostr-workspace/) - [PARTIAL] Nostr architecture confirmation
- [HN Show HN thread](https://news.ycombinator.com/item?id=48632977) - [PARTIAL] community sentiment
- [HN launch discussion](https://news.ycombinator.com/item?id=48995213) - [PARTIAL] skepticism on agent choreography
