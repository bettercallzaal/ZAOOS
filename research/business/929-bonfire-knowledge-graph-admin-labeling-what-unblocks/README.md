---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-01
superseded-by:
related-docs:
original-query: "Bonfire knowledge-graph admin labeling - what unblocks agent writes (recurring blocker across docs)"
tier: STANDARD
---

# 929 - Bonfire knowledge-graph admin labeling - what unblocks agent writes (r

> Drafted by ZOE's research-worker from "Bonfire knowledge-graph admin labeling - what unblocks agent writes (recurring blocker across docs)". Auto-committed to main for durability; review + deepen as needed.

I have comprehensive data from both the codebase and web sources. Now I have everything to write the properly formatted research doc.

---

```yaml
---
topic: Bonfire knowledge-graph admin labeling - what unblocks agent writes
type: blocker-analysis
status: partially-resolved
last-validated: 2026-07-01
related-docs: 722i, 807, 620, 717, 754, 620d
original-query: "Bonfire knowledge-graph admin labeling - what unblocks agent writes (recurring blocker across docs)"
---
```

## Key Decisions

| Decision | Options Considered | Status | Owner | Why It Matters |
|---|---|---|---|---|
| Which recall endpoint to use | `/vector_store/search` vs `/delve` | RESOLVED - use `/delve` (2026-06-25) | Zaal / ZOE | `/vector_store/search` requires admin labeling and returned `[]`; `/delve` works with a non-admin key today |
| Who triggers `/labeling/hybrid` | Joshua.eth (Bonfires admin) vs Carlos (founder) | BLOCKED - pending escalation | Zaal | Labeling runs server-side only; 403 on non-admin keys; re-enables `/vector_store/search` path permanently |
| Whether to stay on Bonfires platform | Hosted Bonfires vs self-hosted Graphiti | DEFERRED | Zaal | Bonfires was mid-rewrite as of Jun 6; Carlos said re-integration complete Jun 14; dependency risk flagged in session-2026-05-31 doc |
| Write path confirmation | `/knowledge_graph/episode/create` vs other | RESOLVED - create endpoint works without admin key | Zaal / ZOE | Write was never blocked; only read was blocked |

---

## Findings

### The Core Blocker (Historical - as of May 23, 2026)

Doc 722i established the issue precisely: `/vector_store/search` (the vector recall path ZOE used) returned an empty array `[]` despite 1100+ nodes and 120+ new episodes being confirmed written. The cause was not a write failure but a read-gate. The `/labeling/hybrid` endpoint - which runs Bonfires' auto-classification over ingested chunks and populates the vector index - is a 403 for any non-admin API key. Without it, the vector store index is empty, so search returns nothing even though the graph has data.

The write path (`/knowledge_graph/episode/create`) was never gated. Episodes write successfully with a standard key. The "agent can't write" framing in older docs was imprecise: agents CAN write, they just could not read back anything they wrote.

### The Resolution (Verified 2026-06-25)

`scripts/ecosystem-monitor/README.md` and `to-bonfire.sh` both document: "write via `/knowledge_graph/episode/create`, recall via `/delve` (both work with a non-admin key; the old 'needs admin labeling' belief was wrong)." The `/delve` endpoint is the Bonfires graph-query interface and does not require the vector index to be labeled. It queries the graph layer (Graphiti / Neo4j) directly, bypassing the vector store.

This means the functional blocker is resolved for ZOE's use case: write works, read works via `/delve`.

The remaining gap is that `/vector_store/search` (semantic similarity search over labeled chunks) is still inoperative until Joshua.eth or Carlos runs the admin labeling pass. This matters for similarity-style recall but not for episode retrieval.

| Read Path | Requires Admin Labeling | Works Today | Use For |
|---|---|---|---|
| `/vector_store/search` | YES | NO (returns `[]`) | Semantic similarity over labeled corpora |
| `/delve` | NO | YES (verified 2026-06-25) | Episode retrieval, graph queries |
| Write: `/knowledge_graph/episode/create` | NO | YES | All agent writes |

### Three Options for Fully Unblocking

| Option | What It Does | Effort | Risk | Status |
|---|---|---|---|---|
| **A. Escalate to Joshua/Carlos** | Triggers `/labeling/hybrid` on ZABAL Bonfire; re-enables `/vector_store/search` permanently | Low (1 message to Joshua.eth) | None | NOT YET DONE as of latest docs |
| **B. Use `/delve` as primary recall** | Bypasses the vector index entirely; queries graph directly; already working | Zero (already wired in ecosystem-monitor) | Graph recall is less semantic than vector search | DONE (2026-06-25) |
| **C. Self-host Graphiti** | Run the open-source Neo4j + Graphiti layer independently; no platform dependency | High (infra, setup) | Loses Bonfires' hosted labeling, multi-agent sharing, Genesis tier perks | DEFERRED |

### Why the Blocker Recurred Across Docs

Docs 722, 722i, 620, 754, 807, and the ecosystem-monitor all flag the same issue because it was diagnosed in May (doc 722i, May 23), escalation to Joshua was recommended but not acted on, and subsequent sessions re-discovered the empty read. The discovery of `/delve` as the workaround happened independently in June without backfilling the earlier docs. This created the appearance of a still-open blocker when it is functionally resolved for ZOE's current write/recall loop.

---

## Recommended Action

| Action | Owner | By When | Done? |
|---|---|---|---|
| Message Joshua.eth asking him to run `/labeling/hybrid` on the ZABAL Bonfire | Zaal | This week | [ ] |
| Confirm `/delve` is wired in ZOE recall path (not just ecosystem-monitor scripts) | Zaal / ZOE | Next deploy | [ ] |
| Update docs 722i and 620d status to RESOLVED-PARTIAL, add note that `/delve` unblocks read | Zaal | Before next session touching Bonfire | [ ] |
| If Carlos fireside Jun 14 refactor is complete, re-test `/vector_store/search` after Joshua runs labeling | Zaal | After Joshua escalation | [ ] |

---

## Sources

- [FULL] Bonfires Technical Overview - Obsidian Publish - https://publish.obsidian.md/bonfires/files/Technical/Bonfires
- [PARTIAL - no auth/label details] Graphiti GitHub - Episode write model - https://github.com/getzep/graphiti
- [PARTIAL - high-level only] Bonfires.ai homepage - https://www.bonfires.ai/
- [PARTIAL - review aggregator, no technical depth] Bonfire AI Reviews - SourceForge - https://sourceforge.net/software/product/Bonfire-AI/
- [FAILED - 404] zabal.bonfires.ai (direct URL, tried https://zabal.bonfires.ai)
- [FULL - codebase] `scripts/ecosystem-monitor/README.md` - verified 2026-06-25: `/delve` works without admin key
- [FULL - codebase] `scripts/ecosystem-monitor/to-bonfire.sh` - comment line 7 explicitly retracts the "needs admin labeling" belief
- [FULL - codebase] `research/dev-workflows/722-zao-claude-code-3-month-synthesis/722i-bonfire-kg-state/README.md` - definitive May 23 audit; labeling gap, Joshua escalation path
- [FULL - codebase] `research/events/807-zabal-games-fireside-carlos-bonfires-jun6/README.md` - Bonfires refactor deadline Jun 14, group-listen config blocker

**Community source:** https://github.com/getzep/graphiti - GitHub Discussions / Issues on Graphiti (the open-source Neo4j graph engine Bonfires runs on top of). This is the upstream community where Bonfires-related write/read permission questions would surface if platform-level.

---

**Summary:** Agent writes to Bonfire were never actually blocked - only reads were gated behind `/labeling/hybrid` (403 for non-admin keys). As of 2026-06-25, the `/delve` endpoint provides non-admin read access and is verified working. The remaining unblock is a single escalation to Joshua.eth to run admin labeling, which re-enables `/vector_store/search` for semantic recall. The blocker recurred across docs because the `/delve` workaround was found in June without retroactively updating May-era docs. **Next: message Joshua.eth.**
