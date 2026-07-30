# 2154 - ZOE Digital Identity + Legal Body (give the agent a body)

**Date:** 2026-07-30
**Status:** Design (spec) - approved to build the non-gated parts, gated actions handed to Zaal
**Owner:** Zaal
**Siblings:** [[project_zao_midao_legal_body]], [[project_pi_computer_use]], [[project_zoe_orchestrator_locked]], [[project_dreamnet_trust_layer]], [[project_zai_community_agent]], doc 601 (agent-stack cleanup), doc 2153 (ZM)

---

## The one line

ZOE today is a Telegram bot token. It cannot stand where the builders actually live (Discord servers, community rooms), and it cannot hold anything in the world. This doc designs giving ZOE a real digital identity - an email, real accounts on the Pi, and eventually a legal body - so it is a presence, not a bot.

## Why now (the grounding, all real)

- **The builders live in Discord.** KORRO (branth / aliasbranth, dev+CEO of Korrocorp) runs a 28-member Discord (Korrocorp, `discord.gg/RSBHHjxnYt`), ships from there, DM'd Zaal from there. ZOE-as-bot-token cannot be sent into that room. Same for most active builders - Discord is where the work happens, and ZOE is absent from all of it.
- **The Adam / MiDAO conversation.** "Talking MiDAO with Adam Miller" (ZABAL Gamez live, 2026-06-12, `zabalgamez.com/live`) + the Just DAO It episode (doc 2153 seed): the endgame is an AI agent that holds a legal entity (RMI LLC via MiDAO) and can manage funds under it. That is the far rung of this same ladder. See [[project_zao_midao_legal_body]] ("free RMI Digital LLC to give a ZAO agent a legal body; flagship ZOL gets a body").
- **The mechanism already exists and Zaal already flagged it.** The **OtoCo MCP** email (`otoco@ghost.io`, 2026-07-22; Zaal forwarded it to himself 2026-07-24, marked IMPORTANT): "Connect Cursor, Claude, Codex, ChatGPT, Grok and other MCP-compatible agents to OtoCo to form and manage US / Marshall-Islands entities onchain - with confirmation-gated paid actions." An MCP server that lets an agent form + operate a legal entity, with paid actions gated. That is rung 3's tooling, off the shelf.
- **It is rung one of the DreamNet trust ladder we just built for.** Brandon's thesis (this session's Spore federation work): **Identity -> Receipt -> Reputation -> Trust** ([[project_dreamnet_trust_layer]]). The Spore receipt layer shipped this session (doc 2138, PR #2704 Phase 3). Identity is the rung underneath it. This doc builds that rung for ZOE.

## The identity ladder (3 rungs, strictly in order)

### Rung 1 - Email (a real inbox ZOE owns)

The floor. Every account signup needs a deliverable inbox that can receive a confirmation link.

- **Have today:** `zoe-zao@agentmail.to` (AgentMail relay, drives the `/inbox` skill). Fine for programmatic mail; NOT reliably accepted by consumer signups (Discord, etc. reject/friction many relay domains).
- **Rung-1 decision:** promote the AgentMail address OR stand up a proper mailbox (a Google Workspace / Proton inbox on a ZAO-owned domain, e.g. `zoe@thezao.com` or `zoe@bettercallzaal.com`). Recommendation: a real mailbox on a ZAO domain - it is deliverable, it is ownable, and a ZAO-domain identity is what rung 3 (legal body) will want to reference anyway.
- **GATED (Zaal clicks):** creating the mailbox / adding the domain alias. Account creation is not something the assistant does.

### Rung 2 - Accounts on the Pi (Discord first)

Real accounts tied to the rung-1 email, operated by ZOE via the Pi's computer-use ([[project_pi_computer_use]]). This is where it stops being a bot: a presence that can join KORRO's server, sit in a community call, read the room, and (gated) speak.

**The honest fork - Discord ToS.** Discord's ToS prohibits automating a *user* account (self-bots); a fully-autonomous ZOE user account risks a ban. Two shapes:

- **A) Human-registered, ZOE-assisted (RECOMMENDED start).** A real account (Zaal's, or ZOE's identity registered by Zaal), where ZOE reads/drafts/surfaces via computer-use on the Pi and Zaal stays in the loop for anything that posts. ToS-safe-ish, human-gated, slower. Matches the repo's outbound-is-gated rules ([[feedback_zoe_dm_questions_group_status]], agent-loops rule 8).
- **B) Fully-autonomous account.** ZOE operates it end to end. Maximum presence, real ban risk, and it is exactly the "outbound on your behalf" that the assistant rules gate.

**Decision: start at A.** Let rung 3 (legal body) be what eventually earns the case for B - an agent with a legal entity behind it is a different, defensible ToS conversation. A is not a compromise; it is the correct first version (workflow-discipline rule 3: ship the fail-safe path in v1).

- **GATED (Zaal clicks):** registering the Discord account + joining any server + any post/DM.
- **Assistant builds:** the Pi computer-use flow that, given the logged-in account, reads a target server, summarizes the room, drafts replies to Zaal's inbox/Telegram for approval. No autonomous posting.

### Rung 3 - Legal body (OtoCo MCP / MiDAO)

An RMI LLC the ZOE identity can operate under - the "ZOL gets a body" flagship. Not required to join a Discord; it is the endgame that makes the identity real in the world (can hold funds, sign, be referenced by receipts).

- **Mechanism:** OtoCo MCP (form + manage RMI/US entity onchain, confirmation-gated paid actions) + Adam / MiDAO relationship.
- **GATED (Zaal clicks):** the entity formation itself - paid, onchain, irreversible. The assistant does not execute financial/on-chain actions. The assistant CAN: wire up the OtoCo MCP server, draft the formation parameters, and stage the confirmation for Zaal.

## Which agent wears this identity (taxonomy)

Taxonomy is LOCKED (CLAUDE.md): **ZOE** = private orchestrator, **ZOL** = social (Farcaster), **ZAI** = community. Zaal's ask said "under the ZOE" - read as: the **runtime/identity lives under ZOE on the Pi** (ZOE owns the mailbox, the credentials, the computer-use session). The **public face** in a community Discord is a separate call - it may present as **ZAI** (the community agent, [[project_zai_community_agent]]) rather than ZOE-the-private-orchestrator. Open decision below; does not block rungs 1-2.

## What the assistant builds vs what Zaal clicks

| Piece | Rung | Who |
|-------|------|-----|
| Decide + create the real mailbox (ZAO domain) | 1 | **Zaal (gated - account creation)** |
| Wire ZOE to read/send from that mailbox | 1 | Assistant |
| Register the Discord account | 2 | **Zaal (gated)** |
| Join KORRO's / any server | 2 | **Zaal (gated - joining/consent)** |
| Pi computer-use flow: read server -> summarize -> draft-for-approval | 2 | Assistant |
| Any post / DM from the account | 2 | **Zaal (gated - outbound)** |
| Wire up OtoCo MCP server + draft formation params | 3 | Assistant |
| Form the RMI LLC (paid, onchain) | 3 | **Zaal (gated - financial/irreversible)** |

## Open decisions (for Zaal)

1. **Rung-2 shape:** A (ZOE-assisted real account) vs B (fully-autonomous). Recommendation + design assume **A**.
2. **Rung-1 mailbox:** promote `zoe-zao@agentmail.to`, or stand up `zoe@thezao.com` (rec: the ZAO-domain mailbox).
3. **Public face in community Discords:** ZOE identity directly, or present as **ZAI**. (Runtime under ZOE either way.)
4. **Rung-3 timing:** form the legal body now (OtoCo is ready) or after rung-2 proves the presence is worth it.

## Guards this design keeps

- Account creation, signups, entering passwords: PROHIBITED for the assistant - always Zaal.
- Outbound (posts/DMs), on-chain, and spend: human-gated (agent-loops rule 8).
- One instance owns any credential/session (agent-loops rule 9): the ZOE mailbox + Discord session live on ONE Pi runtime, never split.
- Secrets: mailbox/account credentials go to `~/.zao/private/` (chmod 600), never printed/committed (secret-hygiene.md, agent-loops rule 15).
- PII from any community room ZOE reads: `~/.zao/private/`, synthesis-only in chat, never committed (pii-hygiene.md).

## Source

Zaal, 2026-07-30 (this session): "make a proper email and more things with the Pi under ZOE so we can join discords etc by making an account not just as a bot." Grounding: KORRO Discord history (in-session), Talking MiDAO w/ Adam Miller (2026-06-12), OtoCo MCP email (2026-07-22), DreamNet trust ladder (doc 2138 / [[project_dreamnet_trust_layer]]).
