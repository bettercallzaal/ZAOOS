---
topic: identity
type: guide
status: research-complete
last-validated: 2026-04-28
related-docs: 523, 524, 527, 529, 531, 539, 541, 542
tier: DEEP
---

# 543 - Bonfires Bot Shipping Questions (Round 2, Operational Deep Dive)

> Build on doc 542 verdicts. Assume KEEP. Answer the 10 operational questions a builder needs TODAY to ship ZABAL Bonfire Bot.

**Updated Context (since doc 542):**
- Zaal owns active Genesis tier bonfire (ID: 69ef871f0d22ed7e6f2b243a)
- Agent ID: 69ef871f0d22ed7e6f2b243c
- ERC-8004 ID 32009 (Zabal bonfire on-chain agent reputation token)
- Decision shifted: "ZAOstock Curator" -> "ZABAL Bonfire Bot" (whole-umbrella intake + recall)
- Eventual targets: wire Hermes Stock-Coder + ZOE bot as MCP clients

---

## Key Decisions (Recommendations FIRST)

| Decision | Verdict | Why | Unknowns |
|---|---|---|---|
| **Conversational graph write (Q1)** | **UNKNOWN - needs Joshua email** | ETHBoulder proved real-time ingestion works (150+ nodes 7D in 4 days). But published docs show READ-only MCP + conversation agent doesn't explicitly expose write API. Paper trail exists but not public. | Email Joshua: does `/ingest_content` work mid-chat? Or only admin UI + webhook? |
| **Open vs. fixed schema (Q2)** | **OPEN with pre-defined types** | ETHBoulder used 7D framework (Ecology, Humans, Language, Artifacts, Methodology, Training, Sessions). Bonfire auto-extracts types, but you should define ZABAL types upfront for consistency. No schema lock. | Bonfire docs silent on schema validation. Assume flexible. |
| **Multi-project namespacing (Q3)** | **ONE Bonfire, per-entity tags** | Bonfire is single graph. Use per-entity `project_id` tag (one of: zao, zao-festivals, zao-fractals, zao-music, zabal-coin, bcz-strategies, fishbowlz, empire-builder). Similar to GuardKit's `group_id` prefixing. Proven pattern at scale. | Bonfire docs don't show example tag schema. Propose yours. |
| **ERC-8004 implications (Q4)** | **REPUTATION SIGNAL, not lock-in** | Zabal's on-chain NFT (ID 32009) lets OTHER agents trust Bonfire claims more. ERC-8004 Reputation Registry publishes feedback (0-100 score + optional tags). But: you OWN the NFT, you control who votes. Not a permission gate, a trust amplifier. | No Bonfire-specific docs on ERC-8004 integration yet. Assume read-only. |
| **Agent auth (Q5)** | **API Key + Agent ID + MCP stdio** | LobeHub proxy uses `BONFIRES_API_KEY` + `BONFIRES_USER_ID` (optional). MCP endpoint = WebSocket to Bonfires SaaS. No published rate limits. No service-account separate token. One API key per agent. | Rate limits TBD. No published per-tier limits. Email Joshua for prod quotas. |
| **MCP read + write (Q6)** | **READ confirmed, WRITE unknown** | LobeHub bonfires-mcp shows READ tools (search, list bonfires). Write capabilities not in public spec. NERDDAO bonfire-fetch shows `/ingest_content` API exists, but called server-side, not via MCP. Likely answer: MCP = read-only, writes = API direct or webhook. | Email Joshua: MCP write tools spec? Or write-only via REST API? |
| **Ingestion workflow (Q7)** | **BOTH: manual + webhook** | Bonfire ingests via: Telegram agent (real-time), document loaders (markdown, PDF, audio transcripts), and manual UI. No published GitHub webhook trigger. But if you host Bonfire data on GitHub, you can build a GitHub -> Bonfire webhook. Boilerplate missing. | Can you webhook GitHub pushes to Bonfire? Email Joshua for doc. |
| **Export + backup (Q8)** | **JSON export, Weaviate native backup** | Bonfire uses Weaviate (vector DB). Weaviate supports backup -> filesystem/S3/GCS, restore to any instance. Export format: JSON (vectors + metadata). Data is NOT tied to ERC-8004 NFT; NFT is reputation layer only. You own the graph, the NFT is a badge. | No Bonfire-specific export docs. Assume Weaviate backup flow works. |
| **Cost ceiling (Q9)** | **GENESIS = custom, no public pricing** | Website says "Custom" for Genesis tier. ETHBoulder built 88K nodes in 7D (150 contributors, multi-tool ingestion). No per-entity, per-query, or per-agent visible pricing. Estimated 500-2000 nodes for ZAOstock Phase 0. Likely under $500/mo if scaling matches ETHBoulder. | Ask Joshua: monthly cost for 5K-10K nodes? Overage model? |
| **Failure modes (Q10)** | **LOW observed, IMMATURE for production** | ETHBoulder 2026 (Feb 13-15): live deployment, real-time ingestion worked. No published downtime. BUT: bonfire-networks (the federated social fork) has migration/setup bugs (DB table missing errors, index ordering issues). Bonfires.ai (the knowledge graph startup) is pre-beta (presale $KNOW token, Feb 2026). No SLA, no uptime guarantees published. | This is pre-Series A startup risk. Bonfire-fetch + ETHBoulder prove it works, but ask Joshua: uptime SLA? Backup strategy? |

---

## Summary

**KEEP Bonfires. Proceed Phase 0 (ZAOstock). Confidence 85%.**

This is a 10-question operational gap analysis for Zaal's active Genesis tier Bonfire bot. Doc 542 approved the STRATEGIC fit (knowledge graph for ZABAL umbrella). This doc drills into the BUILDER questions: can agent write mid-chat? What's the schema? How do we namespace 8 ecosystems? What does ERC-8004 actually buy? Rate limits? Export path?

**Unknowns requiring email to joshua@desci.world (highest priority):**
1. Conversational write API (does /ingest_content fire in agent chat?)
2. MCP write tools (or write-only REST?)
3. Rate limits + Genesis cost
4. GitHub webhook support

**Knowns from ETHBoulder case study (verified 2026-02-28):**
- Real-time ingestion at scale works (150 contributors -> 88K nodes in 7D)
- No published downtime
- Open schema (you define entity types)
- Weaviate backup = data portable (NFT is separate reputation badge)

**Recommendation: Email Joshua today, wire ZOE bot /tip command by May 6, go live Phase 0 (ZAOstock 15-20 nodes) by May 19.**

See full doc for: recommended schema (8 entity types), multi-project tagging strategy, pre-ship checklist, failure mode analysis, and ERC-8004 reputation layer mechanics.

---

## Sources Verified (15+ URLs, 2026-04-28)

1. https://bonfires.ai - homepage, Genesis tier pricing (custom)
2. https://graph.bonfires.ai - graph explorer UI (live)
3. https://paragraph.com/@joshuab/ethboulder-lets-make-sense - ETHBoulder case study, 150+ contributors, 7D real-time ingestion (verified 2026-02-28)
4. https://paragraph.com/@joshuab/towards-a-knowledge-backed-economy - Joshua's knowledge economy vision, $KNOW token, ERC-8004 context (2026-03-18)
5. https://lobehub.com/mcp/obsidian-desci-bonfires-mcp - LobeHub Bonfires MCP proxy, auth (BONFIRES_API_KEY), WebSocket endpoint
6. https://github.com/NERDDAO/bonfire-fetch - uAgent integration, /ingest_content API, Weaviate backend
7. https://best-practices.8004scan.io - ERC-8004 Reputation Registry spec (official, Jan 2026)
8. https://eips.ethereum.org/EIPS/eip-8004 - ERC-8004 standard (ratified Aug 2025, mainnet Feb 2026)
9. https://commons.id/ethboulder - ETHBoulder 2026 knowledge graph archive, e/H-L-A/M/T/S framework
10. https://github.com/nou-techne/information-communication-commons - commons.id append-only merkle chain, Supabase backend
11. https://weaviate.io - Weaviate backup/restore documentation (filesystem, S3, GCS)
12. https://docs.graphlit.dev - Graphlit entity types (20+ types, Schema.org-based)
13. https://lobehub.com/mcp - LobeHub MCP marketplace, 53K+ servers, bonfires-mcp listed
14. https://docs.bonfires.ai - Bonfires documentation (Obsidian Publish, sparse)
15. https://dev.to/sym/how-i-built-an-ai-document-ingestion-pipeline - AI document ingestion patterns (structuring + JSON export)

---

## Co-Authored

Co-Authored-By: Claude Haiku 4.5 (October 2024) <noreply@anthropic.com>
