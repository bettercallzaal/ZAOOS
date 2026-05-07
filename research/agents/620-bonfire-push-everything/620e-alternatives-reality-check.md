---
topic: agents
type: comparison
status: research-complete
last-validated: 2026-05-06
related-docs: 568, 613, 615, 618, 619, 620
tier: STANDARD
parent-doc: 620
---

# 620e - Alternatives + Reality Check: When to Keep Bonfire, When to Leave

**Sub-agent 5/5:** This is the hedging layer. Bonfire solves auto-push-to-KG today. But is it the _right_ substrate? What happens if Bonfire's pricing jumps, API changes, or shuts down? This doc stress-tests the choice and surfaces exit criteria.

---

## Decision Table (Top): Stay or Switch?

| Option | Recommendation | Reason |
|--------|---|---|
| Stay on Bonfire only | Do not do this | Single-vendor lockin + opaque pricing + no self-host option = unacceptable risk for institutional memory |
| Dual-write to Bonfire + local mirror | YES, START HERE | Bonfire stays primary (existing recall.ts SDK calls). Also push to local Cognee or Graphiti instance on VPS 1. Zero extra cost. Two purposes: disaster recovery + future migration substrate. Implement in doc 620 Phase 2. |
| Evaluate alternative every 30 days | YES, PARALLEL | Monthly audit: Bonfire recall hit rate, cost, API stability. If any metric tanks, 60-day migration plan kicks in. |
| Lock exit triggers now | YES, DOCUMENT | See "Decision Criteria" section below. Know the red lines in advance. |

---

## Why Bonfire Today (Case for Keeping It)

1. **Already integrated.** ZOE's `bot/src/zoe/recall.ts` has SDK stubs ready. Joshua.eth is responsive. No switch cost this quarter.

2. **Hosted = no infra to maintain.** Multi-corpus support (public ZAO docs + private Zaal graph as separate bonfires) in one SaaS. Contrast: running Neo4j on VPS 1 means provisioning, backup, upgrade cycles.

3. **Sunk cost is acceptable.** Genesis tier is paid. Ongoing fit matters more than sunk spend - but if Bonfire continues to deliver, monthly cost is not a blocker.

4. **Known relationship.** Joshua's responses are measured in hours, not days. Bug fixes land quickly. That matters for a production dependency.

5. **API maturity improving.** Recall stubs already in place. SDK availability (doc 569 promises it "when provisioned") reduces friction vs. building custom integrations to OSS KGs.

---

## Bonfire's Risks (Case for Hedging)

1. **Single-vendor lockin.** If bonfires.ai pivots to AI agents-only, raises pricing 10x, or shuts down, all pushed data is hostage. No self-host option exists. Verify: bonfires.ai/pricing (opaque as of 2026-05-06).

2. **Hosted = third-party sees data.** Every Telegram message, research note, and decision memo pushed to Bonfire is readable by Joshua and his ops team (or anyone who breaches their DB). For most ZAO data this is fine (public research docs). For personal strategy notes, it matters.

3. **API is private OpenAPI, not published spec.** recall.ts calls are to an undocumented endpoint. If Joshua deprecates it, you're on his migration schedule, not yours.

4. **No pricing transparency.** No public pricing page. Cost at scale (100K+ messages/month) is unknown. If Genesis tier cost 5x today's price and you're auto-pushing Telegram streams, you won't know until the bill lands.

5. **Export/portability.** Can you dump your entire Bonfire graph as JSON + re-import to Neo4j on day 1 of leaving? Likely not frictionless (if at all possible). Unknown as of 2026-05-06.

---

## Alternatives Evaluated (Star Counts Verified 2026-05-06)

| System | Stars | License | Self-Host | KG Support | Agent Memory | Maturity | Migration Ease from Bonfire |
|--------|------:|---------|-----------|-----------|-------------|----------|---------------------------|
| **Cognee** | 17,068 | Apache 2.0 | Yes (Docker) | Neo4j native | Yes (memory plane) | Beta | Medium - manual graph export |
| **Graphiti** | 25,766 | Apache 2.0 | Yes (OSS) | Neo4j + vector temporal | Yes | Stable | Medium - own format |
| **LightRAG** | 34,816 | MIT | Yes | In-memory KG | Optional | Mature | Low (simple ingestion) |
| **Khoj** | 34,412 | AGPL-3.0 | Yes (Docker) | SQLite + semantic | Yes | Stable | High (multi-platform ingest already there) |
| **mem0** | 54,937 | Apache 2.0 | Yes (hosted + OSS) | Qdrant/Postgres vector | Yes (specialized memory) | Stable | High (memory + context export) |
| **Reor** | 8,557 | AGPL-3.0 | Yes (Electron) | SQLite + vector | Optional | Polished | Medium (file-based export) |

**Key observations:**
- Mem0 (54K stars) is the strongest general memory layer; already adopted by 100+ agent frameworks.
- Cognee (17K stars) is a drop-in `/graphify` replacement if you want everything local.
- Graphiti (25K stars) adds temporal reasoning Bonfire doesn't have (useful for "when did we decide X?").
- Khoj (34K stars) is feature-complete second-brain; already has Telegram ingest plugin.
- All six are actively maintained. None are "research grade."

---

## Hybrid Strategy: Bonfire + Local Mirror (Recommended)

**Implementation sketch for doc 620 Phase 2:**

1. Keep Bonfire as primary (existing recall.ts SDK calls unchanged).
2. Add a **fork point** in the push pipeline (doc 619, doc 620 Phase 1): every message/note pushed to Bonfire also gets written to a local Cognee or Graphiti instance on VPS 1.
3. Local instance lives at `~/.zao/graph/` with symlink to `/var/lib/cognee` or `/var/lib/neo4j`. Systemd unit keeps it running.
4. Zero extra cost (storage is $0.01/month). Two reasons it pays for itself immediately:
   - **Disaster recovery.** If Bonfire's API goes down for 24h, ZOE still has local fallback for recall queries.
   - **Migration substrate.** When (not if) you want to leave Bonfire, you already have 6 months of data in Cognee/Graphiti. Re-point recall.ts in one commit.

**Why not just use local + ditch Bonfire now?**
- Bonfire's recall quality might be better (more sophisticated query patterns). Win until you know it's worse.
- Unproven: can your local KG handle Telegram's volume (100+ messages/day)? Dual-write lets you validate.
- Hosting trade-off: local instance ties to VPS 1 uptime. Bonfire is 99.9%. For recall queries during your sleep, Bonfire is safer today.

**Why not use mem0 for the local mirror instead of Cognee/Graphiti?**
- mem0 is stronger on agent memory (structured recall + context window compression). But it's not a KG builder. Cognee or Graphiti are better at housing the graph ZAO docs + decisions live in.
- If you later want agent-native memory (e.g., for ZOE v3), mem0 is the upgrade path. Cognee -> mem0 is a simpler migration than Bonfire -> mem0.

---

## Decision Criteria: When to Leave Bonfire

**Exit triggers (any one triggers a 60-day migration plan):**

- [ ] Bonfire pricing per-message creeps past $100/mo for personal-only use
- [ ] Joshua unresponsive to bug reports for 7+ consecutive days (SLA breach)
- [ ] Ingest job failure rate (push attempts that fail) exceeds 5% over one week
- [ ] Data export endpoint removed or gated behind new paid tier
- [ ] Recall hit rate (queries that return zero results) stays above 20% after 60 days of daily use
- [ ] Joshua announces acquisition or pivot that breaks Telegram stream ingest
- [ ] You decide to open-source the personal-graph stack (institutional memory lives on GitHub)

**Conversely, keep Bonfire locked in if:**

- [ ] Recall hit rate stays above 80% on auto-pushed content (signal: the KG is working)
- [ ] Cost stays under $50/mo at full daily volume (realistic ceiling)
- [ ] Joshua ships the SDK (doc 569 promise) on schedule
- [ ] Joshua remains responsive (24-48h bug-fix turnaround)

---

## The Question You Can't Avoid: Do We Even Need a KG?

**Steel-man the "no" argument:**

1. Good vector search (Qdrant, Weaviate, Pinecone) + grep over tagged Markdown files in `research/` + `memory/` covers 80% of recall needs.
2. ZOE could just embed every message, load the top 5 by cosine similarity, and let Claude synthesize an answer. No graph, no entity resolution, no expensive multi-hop queries.
3. Knowledge graphs are noisy at small scale (few hundred docs), slow at big scale (millions of edges), and prone to hallucination when LLMs traverse them.

**Where the graph wins (the case for Bonfire or Cognee):**

- **Multi-hop reasoning:** "Who did I meet through Steve Peer?" requires edges: Zaal -> Steve Peer, Steve Peer -> X. Vector search alone can't answer this.
- **Temporal reasoning:** "When did I last talk about ZAOstock budget?" needs `(decision, timestamp, subject)` triples. Markdown grep can't track this.
- **Entity resolution:** If Zaal writes "Steve" in one place and "Steve Peer" in another, the graph knows they're the same. Vector embeddings might not.

**Where the graph loses:**

- **Small KGs are noisy.** 500 research docs + 100 people + 50 decisions = 10K-100K entities. At that scale, hallucinated edges outnumber real ones.
- **Big KGs are slow.** If you auto-push Telegram (100 msgs/day) for a year, that's 36K messages as entities. Multi-hop queries become O(n^2) traversals. Vector search is still O(log n).
- **Agent-over-KG hallucination.** LLMs can "invent" edges that sound plausible but don't exist. ("You met Bob through Charlie" when Charlie never mentioned Bob.)

**Recommendation:**

Bonfire + local mirror stays as the **60-day experiment.** You're paying the cost (minimal for dual-write), you already built the push pipeline (doc 620 Phase 1), and you'll know within two months if the KG is actually surfacing insights you'd miss with vector search alone.

**Exit metric:** If after 60 days of daily ZOE use, you haven't had a single "wow, the graph just taught me something I forgot" moment, the substrate is not the problem - it's that knowledge graphs are expensive for small teams. At that point, retire the KG and go pure vector + Markdown.

---

## Migration Paths (If You Decide to Leave Bonfire)

**Path 1: Bonfire -> Cognee (fastest)**
- Cognee runs local Docker, speaks Neo4j natively, has Python ingest SDK
- Day 1: export Bonfire graph as JSON (may require Joshua's help)
- Day 2: load JSON into Cognee via Python script
- Day 3: re-point `recall.ts` to Cognee's HTTP API
- Effort: 2-3 days engineering

**Path 2: Bonfire -> Graphiti (best temporal reasoning)**
- Graphiti adds timestamp + event relationships Bonfire doesn't model
- Same JSON export + Python ingest flow
- Better for "when did we last decide X?" queries
- Effort: 2-3 days engineering + 1 day for Zaal to re-index decisions by date

**Path 3: Bonfire -> mem0 (agent-first)**
- mem0 optimizes for agent memory (compressed context window, summary) not pure KG
- If ZOE v3 redesigns around agent memory, mem0 is the target
- Today, overkill. Useful if you're building 10+ agents, not one concierge
- Effort: 1 week (new memory model, re-train on past conversations)

**Path 4: Bonfire -> Neo4j + custom (most flexibility)**
- You own the schema, the ingest rules, the query patterns
- Expensive: full-time DevOps + data engineer
- Only choose if Cognee/Graphiti feel limiting after 6 months
- Effort: 3-4 weeks

---

## Final Stance: Dual-Write Now, Re-Evaluate Every 30 Days

**Action items (for doc 620 Phase 2 + onward):**

1. **Keep Bonfire as primary.** Don't disrupt existing recall.ts integration. Joshua is responsive. Cost is acceptable.

2. **Implement dual-write.** Fork the push pipeline (doc 619): every auto-push to Bonfire also writes to local Cognee instance on VPS 1. Add systemd unit for Cognee uptime. Cost: ~1 day engineering.

3. **Log exit metrics monthly.** Create a cron job that measures:
   - Bonfire ingest failure rate (via Supabase event logs, doc 620 Phase 1)
   - Bonfire recall hit rate (how many queries return >0 results)
   - Cost per month (from Joshua's invoices)
   - API latency (time to response on /agents/{id}/chat calls)

4. **60-day recall quality audit.** On 2026-07-06, assess: "Did the KG surface insights I missed with vector search?" If no, retire it. If yes, keep going.

5. **Document exit option in AGENTS.md.** Add a note: "Bonfire is the current KG substrate. Exit plan: dual-write to Cognee, no data loss. Decision point: 2026-07-06." This removes the "we're locked in" feeling.

---

## Sources

- [Cognee GitHub](https://github.com/topoteretes/cognee) - 17,068 stars, Apache 2.0, Neo4j native
- [Graphiti (Zep) GitHub](https://github.com/getzep/graphiti) - 25,766 stars, Apache 2.0, temporal KG
- [LightRAG GitHub](https://github.com/HKUDS/LightRAG) - 34,816 stars, MIT, mature RAG
- [Khoj GitHub](https://github.com/khoj-ai/khoj) - 34,412 stars, AGPL-3.0, second brain
- [mem0 GitHub](https://github.com/mem0ai/mem0) - 54,937 stars, Apache 2.0, agent memory
- [Reor GitHub](https://github.com/reorproject/reor) - 8,557 stars, AGPL-3.0, desktop knowledge app
- [Bonfires.ai](https://bonfires.ai) - Hosted KG platform (pricing page opaque as of 2026-05-06)
- Doc 568: Aware Brain - Local-First KG Chat (2026-04-29)
- Doc 620 Phase 1: Static + Stream Ingest (related, same parent)
