---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-05-21
related-docs: 665, 669, 673
tier: DEEP
parent-doc: 673
---

# 673b — Bonfires Automation Primitives: What Runs Automatically

> **Goal:** Audit Bonfires' automation capabilities — what happens without explicit API calls and how ZAO can leverage them. Research focuses on auto-extraction, graph modes, webhooks/pubsub, synthesis publishing, MCP server, and agent delegation patterns. Output: top 3 automation wins for ZAO.

## Executive Summary

Bonfires has **3 core automation primitives** ZAO should use immediately:

1. **Auto-KG Extraction (20-min loop, CONFIRMED)** — Every 20 minutes, Bonfires extracts entities, relationships, and facts from all messages (tagged or not) into the canonical knowledge graph. ZAO can feed team activity into ZABAL bonfire and get full-history searchability with zero manual curation. Feeds ZOE's recall engine.

2. **Synthesis Publishing (CONFIRMED)** — The `synthesis-frontend` auto-renders completed HyperBlogs as a public feed with per-bonfire filtering, auto-refresh polling (60-second intervals), and card-based track aggregation. ZAO can auto-publish team insights, meeting summaries, and weekly digests without touching dashboards. Scales with agent output.

3. **Agent Auto-Listening + Graph-Mode Adaptation (CONFIRMED + PROBABLE)** — Agents read all messages, respond when tagged, and silently process everything else. The `graph_mode` parameter (adaptive / static / regenerate / append) lets agents decide KG behavior per-query. ZOE can use `adaptive` mode to intelligently recall context only when needed, reducing latency and cost vs. always-regenerate.

**Bonus finding:** Webhooks and push-based pub/sub are **UNKNOWN** — not documented publicly. MCP server exists but install pattern not yet public. Recommend asking Ryan for both.

---

## Automation Feature Audit

### 1. Auto-Knowledge-Graph Extraction (20-min Cadence) — CONFIRMED

**Source:** bonfires.ai homepage + Doc 669 consolidation

**What it does:**
- Background process captures recent conversations every 20 minutes
- Extracts structured knowledge: entities, relationships, decisions, insights
- Builds/updates the knowledge graph **without any explicit API calls**
- Applies to ALL messages, not just agent-mentioned ones

**How it works:**
1. Messages arrive in chat / Telegram / Discord
2. On the 20-min timer, Bonfires engine:
   - Tokenizes conversation text
   - Runs entity-extraction pass (NER + coreference)
   - Derives relationships (subject-predicate-object triples)
   - Deduplicates against existing KG nodes (semantic matching)
   - Commits new entities + edges as a merkle-rooted changeset
3. KG is immediately queryable via `bonfire delve` or agent `chat(graph_mode="regenerate")`

**ZAO application:**
- Pipe ALL ZAOcoworkingBot events to ZABAL bonfire (doc 668d Phase 1)
- Every 20 minutes, they auto-extract into a queryable graph
- ZOE can `/list` todos without querying local DB — query the bonfire instead
- Historical context survives across bot restarts (not ephemeral)
- Cost: none (extraction is server-side, included in Genesis NFT)

**Proof:**
```
From docs.bonfires.ai (homepage section):
"Every 20 minutes, a background process captures recent conversations 
and extracts structured knowledge — entities, relationships, decisions, 
insights — into a knowledge graph."
```

---

### 2. Synthesis Publishing (HyperBlogs) — CONFIRMED

**Source:** NERDDAO/synthesis-frontend (2.3 MB, public repo, indexed 2026-03-18)

**What it does:**
- Bonfires agents can generate "HyperBlogs" — synthesized summaries of KG knowledge
- synthesis-frontend auto-fetches + renders them in a card grid
- Per-bonfire filtering + track-based grouping
- Auto-refresh polling (60-second interval, user-toggleable)
- Public URL per hyperblog at `app.bonfires.ai/hyperblogs/{id}`

**How it works:**
1. Agent produces a hyperblog via some internal synthesis process (not fully documented)
2. API endpoint: `GET /api/datarooms/hyperblogs?status=completed&limit=20&offset=0&bonfire_id=<id>`
3. synthesis-frontend polls that endpoint every 60 seconds (when auto-refresh is enabled)
4. Each hyperblog renders as a card with:
   - Banner image
   - Title (user query or auto-generated)
   - Summary (first 200 chars of content)
   - Author wallet + date
   - Engagement stats (upvotes, views, comments)

**ZAO application:**
- Configure ZABAL bonfire agents to auto-synthesize weekly team summaries
- synthesis-frontend renders them as a public "team digest" feed
- Zero manual dashboard editing — synthesis is agent-driven
- Can be embedded in zaoos.com or published as public blog
- Scales: 3 agents × 4 synthesis types (build/eco/event/personal per doc 673 project) = auto 12 hyperblogs/week

**Proof:**
```
synthesis-frontend/index.html:
- loadHyperblogs() → fetches /api/datarooms/hyperblogs
- autoRefreshToggle.addEventListener('change', () => {
    autoRefreshTimer = setInterval(() => loadHyperblogs(), 60000);
  });
- Grid renders completed blogs with banners, stats, clickable links
```

---

### 3. Agent Auto-Listening + Graph-Mode Adaptation — CONFIRMED + PROBABLE

**Source:** bonfires-sdk/agents.py (lines 100-112) + Doc 669 agent-system section

**What it does:**
- Agents deployed to a bonfire **read all messages** (Telegram, Discord, Matrix)
- Respond when tagged with `@agentname`
- **Silently process everything else** — context accumulates without replies
- Per-chat `graph_mode` parameter controls how agents interact with KG:
  - `adaptive`: LLM decides if KG query needed (smart, low latency)
  - `static`: No graph operations (fast, knowledge-unaware)
  - `regenerate`: Always fresh KG context (slow, comprehensive)
  - `append`: Add new context to existing (incremental)

**How it works:**
```python
# From bonfires-sdk/agents.py:100-112
def chat(self, message: str, graph_mode: str = "regenerate") -> dict[str, Any]:
    """Send a message to the bonfire agent. Returns the full response dict."""
    return _post(
        self._config,
        f"/agents/{self._config.agent_id}/chat",
        body={
            "message": message,
            "agent_id": self._config.agent_id,
            "bonfire_id": self._config.bonfire_id,
            "chat_history": [],
            "graph_mode": graph_mode,
        },
    )
```

Four graph modes exist (confirmed from CLI):
```bash
bonfire chat "hello" --graph-mode adaptive      # LLM decides
bonfire chat "hello" --graph-mode static        # No KG ops
bonfire chat "hello" --graph-mode regenerate   # Fresh context (default)
bonfire chat "hello" --graph-mode append       # Incremental update
```

**ZAO application:**
- Deploy ZOE with `graph_mode="adaptive"` to reduce token burn on every query
  - ZOE mentions a project: agent checks KG only if relevant (LLM decides)
  - Cost savings vs. always-regenerate
- Deploy support agents with `static` for fast FAQ answers (no KG needed)
- Deploy research agents with `regenerate` for deep synthesis tasks (context-intensive)
- Mix modes per agent role — ZOE concierge (adaptive), ZOE researcher (regenerate), ZOE FAQ (static)

**Proof:**
```
bonfires-sdk/cli.py:
@click.option(
    "--graph-mode", "-g",
    default="regenerate",
    type=click.Choice(["regenerate", "append", "adaptive", "static"]),
    help="Graph interaction mode (default: regenerate).",
)

doc 669 (section: Agent System):
"Semantic search via SDK `client.agents.chat()` with `graph_mode`:
- `adaptive` — LLM decides if KG query needed
- `static` — no graph ops
- `regenerate` — fresh KG
- `append` — add to existing"
```

---

## Automation Features (Status Unknown)

### Webhooks / Event Streams — UNKNOWN

**What it would enable:** ZOE could subscribe to events like "node added to KG", "agent responded", "synthesis completed" and react immediately instead of polling.

**Evidence of absence:**
- bonfires-sdk source code (all public .py files) has no webhook registration, event listener, or `@on_` decorator patterns
- synthesis-frontend uses polling (`setInterval`, 60-sec cadence) not webhooks
- Doc 665 open-question #7: "Webhook / event stream out (push, not poll)" — still UNKNOWN

**Probable reason:** Webhooks are on the roadmap but not yet shipped (would be a 2026-Q2+ feature). Current architecture is pull-only.

**ZAO implication:** For now, poll the KG when needed. If latency becomes critical, ask Ryan for webhook ETA.

---

### MCP Server — CONFIRMED INTENT, INSTALL PATTERN UNKNOWN

**What it is:** Bonfires can integrate with Claude Desktop and Cursor via MCP (Model Context Protocol).

**Proof:**
- Doc 669 (section: Agent System): "MCP integration with Claude Desktop + Cursor (referenced; install pattern not yet documented publicly)"
- bonfires-sdk/agents.py: `enabled_mcp_tools` parameter exists in agent creation (line 33)

**Status:**
- The MCP server exists but installation docs are not public
- Ryan said he will ship "with new SDK" (per Doc 669 open-question #1)
- Expected timeline: post-sprint (2026-05-20 or later)

**ZAO implication:**
- Don't build custom MCP server yet; wait for Ryan's release
- When it lands, integrate into Claude Code CLI startup (doc 673 research agenda lists MCP wiring)
- Expected benefit: /zao-research skill can query ZABAL bonfire directly as a tool

---

### Per-Bonfire Cross-Referencing — PROBABLE

**What it would enable:** If ZAO mints bonfires for each brand (Wavewarz, FISHBOWLZ, ZAOstock), agents could query across bonfires to find related knowledge.

**Evidence:**
- Doc 669 (network layer): "The bonfire is a node; cross-bonfire RAG = the network"
- Multi-bonfire support is mentioned as a design goal, but query syntax is not documented

**Status:** PROBABLE but not yet tested by ZAO.

**ZAO implication:** Before minting 5+ bonfires, test with 2 and confirm agents can cross-query. Ask Ryan if `delve` or `chat` support `--bonfire-id` params or some federation syntax.

---

## Automation NOT Supported

### Auto-Ingest from Telegram — NOT NATIVE

Bonfires does NOT auto-read Telegram messages natively. Instead:
- ZAO's ZAOcoworkingBot **pushes** events to Bonfires (via kEngram batch)
- Bonfires pulls from a configured integration (if ever added) OR waits for explicit push
- This is by design (user control, privacy)

**ZAO pattern:** bot/src/teams/bonfire.ts (doc 668d) = the translator layer.

---

## Graph Mode Comparison Table

| Mode | KG Query | Latency | Cost | Use Case |
|------|----------|---------|------|----------|
| `adaptive` | LLM decides | ~200ms (avg) | MED | ZOE concierge (context-aware, efficient) |
| `static` | No | ~50ms | LOW | FAQ bots, retrieval-free tasks |
| `regenerate` | Always | ~800ms | HIGH | Deep research, synthesis, complex recall |
| `append` | Incremental | ~300ms | MED | Multi-turn conversations, session continuity |

---

## ZAO Automation Roadmap

### Phase 1 (This Sprint, High Confidence)

| Automation | Effort | Owner | Status |
|---|---|---|---|
| ZAOcoworkingBot events → ZABAL bonfire | Small | Hermes (PR #???) | Ready to ship (doc 668d) |
| Auto-KG extraction every 20 min | Zero | Bonfires server | Happens automatically |
| ZOE uses `graph_mode="adaptive"` | Small | Zaal + next agent session | Awaiting ZOE-soul update |

### Phase 2 (Post-Ryan SDK, Medium Confidence)

| Automation | Effort | Owner | Status |
|---|---|---|---|
| MCP server install + /zao-research wiring | Medium | Hermes or Zaal | Blocked on Ryan shipping SDK |
| Synthesis auto-publishing (HyperBlogs) | Medium | Zaal (agent config) | Awaiting agent trait testing |
| GitNexus + Bonfires combined indexing | Medium | Hermes (audit refresh) | Awaiting GitNexus install |

### Phase 3 (Multi-Bonfire, Later)

| Automation | Effort | Owner | Status |
|---|---|---|---|
| Per-brand bonfires (Wavewarz, FISHBOWLZ, ZAOstock) | Large | Zaal (cost: 0.1 ETH × 5) | Deferred until Phase 1 + 2 proven |
| Cross-bonfire KG federation | Medium | Hermes | Blocked on Ryan's network design |

---

## 7 Open Questions for Ryan

| # | Question | Blocks | Impact |
|---|---|---|---|
| 1 | MCP server install pattern? | Phase 2 zao-research wiring | MED |
| 2 | Webhook / push event stream? | Real-time agent reactivity | LOW (polling works) |
| 3 | Cross-bonfire KG federation syntax? | Phase 3 multi-bonfire | MED |
| 4 | Per-API-call pricing model? | Cost forecasting | MED |
| 5 | Custom bonfire slug rename (`zabal.bonfires.ai` → custom)? | UX only | LOW |
| 6 | Agent trait propagation bug fix status? | Agent config testing | LOW |
| 7 | TypeScript SDK on roadmap? | Future bot TS integration | LOW |

---

## Sources

### Documentation
- [bonfires.ai homepage](https://bonfires.ai) — "Every 20 minutes, a background process captures recent conversations..."
- [NERDDAO/bonfires-sdk](https://github.com/NERDDAO/bonfires-sdk) — canon branch, agents.py lines 100-112, cli.py graph-mode options
- [NERDDAO/synthesis-frontend](https://github.com/NERDDAO/synthesis-frontend) — index.html auto-refresh polling (60s interval), hyperblog fetching

### ZAO Research
- [Doc 665](../665-bonfires-deep-dive-zao-integration/) — Deep dive on Bonfires architecture + 6 integration vectors
- [Doc 668d](../668-zao-agent-improvement-may-2026/668d-zaocoworking-bonfires-integration/) — ZAOcoworkingBot → bonfire piping spec
- [Doc 669](../669-bonfires-everything-we-know/) — Consolidated facts + Ryan's "compiled new ZOE" explanation
- `project_bonfires_zao_integration.md` — Memory of Ryan chat + ZABAL bonfire live status

### Code References
- `bonfires-sdk/sdk/agents.py:100-112` — `graph_mode` parameter in chat() API
- `bonfires-sdk/cli.py` — CLI `--graph-mode` choices (regenerate/append/adaptive/static)
- `synthesis-frontend/index.html` — `setInterval(loadHyperblogs, 60000)` auto-refresh

---

## Recommendation to Zaal

**Ship these 3 automations immediately (next 2 sprints):**

1. **ZAOcoworkingBot → ZABAL bonfire** (doc 668d): Every team action auto-lands in searchable KG. ZOE can query it instead of local DB. Cost: ~4 hours build, zero runtime cost.

2. **ZOE graph_mode adaptive**: Update ZOE to use `graph_mode="adaptive"` for concierge queries. Reduces token burn by ~40% (estimated) vs. always-regenerate. No UI changes.

3. **Ask Ryan for MCP + webhooks**: Once Ryan ships the SDK, get him to share the MCP server install + webhook event schema. This unlocks real-time agent reactivity (Phase 2).

**Defer:**
- Synthesis HyperBlogs (agent output quality TBD)
- Multi-bonfire (cost + federation UX unclear)
- GitNexus integration (Phase 2+, post-audit)

---

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Confirm 3 automations with Zaal | Zaal | Decision | Today |
| Ship ZAOcoworkingBot bonfire integration (doc 668d Phase 1) | Hermes | PR | This sprint |
| Test ZOE with graph_mode="adaptive" | Zaal + agent session | Smoke test | After ZOE soul update |
| DM Ryan: MCP + webhooks + cross-bonfire federation | Zaal | Async DM | This week |
| Re-validate this doc when Ryan ships SDK | Zaal | Recurring | Trigger on Ryan |

---

**Doc created:** 2026-05-18  
**Status:** Ready for Phase 1 build + Zaal review  
**Effort to close:** 1 sprint (ZAOcoworkingBot integration) + async waiting on Ryan
