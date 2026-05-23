---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 699, 669, 689
original-query: "Which agent-memory / graph-memory system should ZAO adopt for persistent cross-session memory? (sub-study of doc 699)"
tier: STANDARD
---

# 699a - Agent Memory: The Graph Layer for ZAO

> **Goal:** Decide which persistent cross-session memory system ZAO adopts for ZOE/Hermes, and how it wires in.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | LOCK Bonfire as ZAO's primary agent-memory layer | Farcaster-native auth (no bridge), multi-bonfire federation for ZAO's 25+ brands, active co-builder (Ryan), kEngram export = vendor-lock-out safety, already live (ZABAL bonfire) |
| 2 | STAGE Cognee as the self-hosted fallback - do not adopt Letta/Mem0/Zep | Cognee is true OSS (Apache 2.0), has a Claude Code plugin, self-hosts on VPS 1. Triggers only if the Bonfire SDK slips >2 weeks. |
| 3 | SHIP Phase 1 (Bonfire subprocess, ~80 LoC) as a Hermes PR within the week | ZAOcoworkingBot writing events to the ZABAL bonfire is a 3-4 hour change, no breakage |
| 4 | DEFER brand federation (one bonfire + ontology profiles vs separate bonfires) until Phase 2 validates | Decision needs Phase 2 data; premature now |

## The Candidates

| System | Architecture | Stars | Self-host | Verdict for ZAO |
|--------|--------------|-------|-----------|-----------------|
| **Bonfire** | Social knowledge graph + agent personas | early (private SDK) | Managed API | PRIMARY - Farcaster-native, federated, co-builder, export-safe |
| **Cognee** | KG + vector hybrid, Apache 2.0 | ~17.4K | Yes (multi-DB) | FALLBACK - true OSS, Claude Code plugin, self-hostable |
| **Mem0** | Vector library + graph tier | ~56K | Yes ($5-7/mo) | Skip - vector-only core, graph behind $249/mo, no federation |
| **Letta** (MemGPT) | Agent runtime + 3-tier memory | ~23K | Yes | Skip - no multi-bonfire model, self-editing memory is overkill |
| **Zep / Graphiti** | Temporal KG on Neo4j | ~26K | Yes (Neo4j) | Skip - elegant temporal model but no Farcaster, latency unproven on ZAO's corpus |

## Why Bonfire Wins For ZAO Specifically

Not "best memory system in the abstract" - best for ZAO's situation: 188 Farcaster members, 700+ research docs, 25+ brands, the Hermes pipeline, and an active relationship with Bonfire's builder. The OSS alternatives are all SaaS-escape-hatch risks or lack multi-brand federation. Bonfire's kEngram export (Markdown/OWL/Canvas) is the lock-out insurance that makes committing safe.

## Integration Plan

| Phase | Action | Effort | Cost |
|-------|--------|--------|------|
| 1 | Bonfire subprocess - ZAOcoworkingBot writes events to ZABAL bonfire via a spool wrapper | 3-4 hr | 0 |
| 2 | ZOE rebuilt to read from the Bonfire SDK (`agents.chat`, adaptive graph mode) instead of its ring buffer | ~4-6 hr (Hermes PR) | 0.1 ETH mint (already paid) |
| 3 | Brand federation - separate bonfires per brand OR ontology profiles in one | ~8 hr | 0 to 0.1 ETH x N |
| Fallback | If Bonfire SDK slips >2 weeks: ship the Cognee Claude Code plugin, migrate Phase 1 events | 4-6 hr | $5-7/mo or $0 |

## Open Question For Zaal

Per-API-call pricing for Bonfire beyond the 0.1 ETH mint is unconfirmed. Get the SDK + MCP-server ETA and the pricing model from Ryan before Phase 2.

## Sources

- [Doc 669 - Bonfires: Everything We Know](../669-bonfires-everything-we-know/) [FULL]
- [Cognee (GitHub)](https://github.com/topoteretes/cognee) [FULL]
- [Zep / Graphiti (GitHub)](https://github.com/getzep/graphiti) [FULL]
- [Mem0 (GitHub)](https://github.com/mem0ai/mem0) [FULL]
- [Letta docs](https://docs.letta.com/) [PARTIAL]
- [Zep temporal-KG paper (arXiv 2501.13956)](https://arxiv.org/abs/2501.13956) [PARTIAL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship Phase 1 Bonfire subprocess as a Hermes PR | @Zaal | PR | This week |
| Get SDK + MCP ETA + pricing from Ryan | @Zaal | Outreach | This week |
| Stage the Cognee plugin on VPS 1 as fallback insurance | @Claude | Todo | Before Phase 2 |
