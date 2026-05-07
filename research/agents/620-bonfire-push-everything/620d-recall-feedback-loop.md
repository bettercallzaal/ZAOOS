---
title: 620d - Recall feedback loop (closing the loop on auto-push)
topics:
  - agents/bonfire
  - agents/recall
type: guide
status: research-complete
last_validated: 2026-05-06
related_docs:
  - 547
  - 615
  - 618
  - 619
  - 620
  - 620b
tier: STANDARD
parent_doc: 620
---

# 620d - Recall feedback loop (closing the loop on auto-push)

Auto-push everything Zaal does to Bonfire is useless if recall returns empty. This doc closes the feedback loop: how ZOE integrates recall into content generation, how to measure if the graph is actually getting smarter, and what to fix when it isn't.

## Decision table

| Concern | Approach | Why |
|---------|----------|-----|
| Auto-recall during draft | Wire recall() into every newsletter/social/doc agent BEFORE prompt goes to Claude | Newsletter agent (620.ts) already calls loadBonfireContext(topic). Pattern: don't block on empty reply; log gap + continue. |
| Multi-hop queries | Trust Bonfire agent config server-side; it handles multi-hop. ZOE only sends "who is X?" and agent synthesizes via graph traversal. | LangGraph chat endpoint supports graph_mode=adaptive (default). No need for two-stage client-side retrieval today. |
| Confidence + grounding | Prompt Bonfire agent UI config to append "Sources: [doc IDs]" to every reply. ZOE parses + shows. Manual review only until grounding lands. | Without source nodes, recall output is unreliable for auto-publish. Add grounding requirement to Bonfire setup sprint (doc 620a). |
| Negative-result handling | Reply explicitly: "(graph has no info on X yet)". Offer to push new fact. Log gap to ~/.zao/zoe/recall-gaps.jsonl. | Closes the loop: Zaal sees what the graph doesn't know + can seed it. Gaps file → priority for next push batch. |
| Measuring success | Track 3 metrics: recall hit rate (% non-empty), node count over time (via /insights), Zaal's qualitative feel. Report in morning brief. | Quantitative gives signal; qualitative confirms value. Morning brief = daily check-in Zaal already sees. |
| Two-stage retrieval | Defer. Single-stage (chat endpoint) sufficient today. Revisit if synthetic hallucination becomes visible. | Bonfire's LangGraph agent already routes to vector search + KG blending via graph_mode. No API call reduction justifies added complexity. |

---

## 1. Auto-recall during draft (close the loop)

Today: ZOE calls recall() only when Zaal types `@recall <query>`.

**Change:** Every content-generation agent (newsletter, social, research doc) calls recall(topic) BEFORE giving the prompt to Claude.

**Example (already live):** `bot/src/zoe/agents/newsletter.ts` lines 149-167.

```typescript
async function loadBonfireContext(topic: string): Promise<string> {
  if (!process.env.BONFIRE_API_KEY || !process.env.BONFIRE_AGENT_ID) {
    return '(Bonfire not configured)';
  }
  try {
    const result = await recall({
      query: topic.length < 200 ? topic : topic.slice(0, 200),
      reason: 'newsletter context grounding',
      expected_kind: 'mixed',
    });
    if (result.kind === 'sdk_response' || result.kind === 'mcp_response') {
      return (result.text ?? '').slice(0, 1500) || '(empty Bonfire reply)';
    }
    return '(manual relay path - Bonfire not auto-queryable)';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `(Bonfire query failed: ${msg.slice(0, 120)})`;
  }
}
```

**Key behaviors:**
- Rate budget: 1 call per draft, not per paragraph.
- Graceful no-op if BONFIRE_API_KEY missing (manual relay path continues).
- Empty reply doesn't block draft: "Bonfire context: (empty Bonfire reply)" goes into the prompt so Claude knows the graph has no data yet.
- Timeout: 120 char error message preserved to avoid cascade failures.

**Wiring priority order (doc 620's §5.2 ship checklist):**
1. Newsletter agent (LIVE)
2. Social agent (when it lands; reserved for per-platform captions)
3. Research doc auto-generation (if added as part of doc 620c)

---

## 2. Multi-hop / topic expansion (server-side agent)

Bonfire's LangGraph agent already handles multi-hop server-side via graph traversal. ZOE doesn't need to orchestrate multi-hop retrieval client-side.

**Test scenarios - 5 query types Zaal would actually ask:**

| Query | Expected behavior | Current support | Gap |
|-------|-------------------|-----------------|-----|
| a. "Who is Kenny?" | Entity lookup - return bio, role, past interactions | Yes (KG nodes are entities) | None unless Kenny mentions aren't in Bonfire yet |
| b. "What did I commit to POIDH?" | Relationship + temporal - filter edges labeled "commitment" on POIDH project | Yes (LangGraph agent traverses edges) | Requires schema: node types (Person, Project, Commitment) + edge types (commits_to, mentioned_in, organized, decided_on) |
| c. "When did I last talk about ZAOstock?" | Temporal + topic - return most recent dated entry mentioning ZAOstock | Partial (agent can filter by mention, but no sort-by-date without doc timestamps) | Bonfire ingest (620b) must tag every pushed doc with ISO timestamp |
| d. "Show me everything about ZAOstock budget" | Topic cluster - return all nodes/edges in the ZAOstock subgraph | Yes (center_node_uuid parameter can anchor to ZAOstock node) | Requires ZAOstock to be a top-level KG entity, not buried in meeting notes |
| e. "What did Kenny say about POIDH bounty review?" | Person + project intersection - filter Kenny's statements about POIDH | Yes (traverse Person-Project edges + filter statements) | Requires statement-level granularity (not just "mentioned in doc X") |

**Bonfire-side config needed (doc 620a §1.3 schema sprint):**
- Explicit node types: Person, Project, Decision, Event, Tool, Concept, Place.
- Edge types: committed_to, organized, mentioned_in, referenced_in, decided, stated, witnessed.
- Per-doc timestamp attachment (not just push datetime but Zaal's logical date).
- Center node anchoring for topic clusters (ZAOstock = single root node, all ZAOstock data reachable via graph).

**No two-stage retrieval needed today.** The LangGraph agent's graph_mode=adaptive already blends vector similarity (for semantic search) + node traversal (for multi-hop). Single API call; Bonfire handles the complexity.

---

## 3. Confidence + grounding (adding source citations)

**Problem:** Bonfire's chat reply is synthesized text with no source node IDs or confidence scores. ZOE cannot tell "this is a hard fact" from "this is the agent's plausible synthesis."

**Solution:**
- Prompt Bonfire agent's system config (via Bonfire UI, not code) to ALWAYS append this footer to every reply:

> Sources: [doc IDs or node UUIDs referenced]

Example reply:
```
Kenny founded POIDH in 2024 as a clip-up bounty platform. The first bounty (ID 1151) went live May 27, 2026 with $1K cap.

Sources: [doc-472-poidh-bounty-launch, person-kenny-uuid, project-poidh-node]
```

**ZOE-side parsing (add to recall.ts):**
```typescript
// Extract sources footer after reply text
const sourcesMatch = text.match(/Sources:\s*\[([^\]]+)\]/);
const sources = sourcesMatch ? sourcesMatch[1].split(',').map(s => s.trim()) : [];
return { kind: 'sdk_response', query, text, sources, grounded: !!sources.length };
```

**Auto-publish gate:**
- WITHOUT grounding (sources field empty): log "ungrounded reply" to audit trail. Use recall output for DRAFT ONLY. Zaal manually reviews before publishing.
- WITH grounding (sources populated): append sources to social post footnote or newsletter endnote. Safe for auto-publish after Zaal flips the switch on content quality (doc 620, §5.5 pre-condition).

**Grounding sprint:** Add to Bonfire setup doc (doc 620a) as week-1 task.

---

## 4. Negative-result handling (close the feedback loop)

When Bonfire returns "I don't know about X":

1. **Tell Zaal explicitly.** ZOE replies with "(graph has no info on ZAOstock Oct 3 dates yet)".
2. **Offer to push.** "Want me to add what you're saying right now to the graph?"
3. **Log the gap.** Append to `~/.zao/zoe/recall-gaps.jsonl`:
```jsonl
{"timestamp": "2026-05-06T14:23:00Z", "query": "ZAOstock Oct 3 dates", "agent": "newsletter", "resolved": false}
```

**ZOE-side code (add to recall.ts):**
```typescript
export async function logRecallGap(query: string, agent: string, resolved: boolean = false): Promise<void> {
  const logPath = join(ZOE_PATHS.home, 'recall-gaps.jsonl');
  const entry = { timestamp: new Date().toISOString(), query, agent, resolved };
  await fs.appendFile(logPath, JSON.stringify(entry) + '\n', 'utf8');
}
```

**Weekly review (Zaal + Claude in morning brief):**
- Read last 7 days of gaps.
- Prioritize high-frequency gaps for next push batch (doc 620b sprint).
- Examples: if Kenny's name appears 5 times with "no data," push all Kenny-related docs first.

---

## 5. Measuring whether push is working

**Metric 1: Recall hit rate**
- Of the last N @recall queries (manual + auto-draft), how many returned non-empty text?
- Computation: count(text.length > 20) / count(all queries).
- Target: 85%+ within 2 weeks of seeding (doc 620b).
- Dashboard: ZOE morning brief includes "Recall hit rate: 87% this week (142/163 queries non-empty)."

**Metric 2: Graph node count + growth trajectory**
- Call Bonfire's (future) `/insights/graph-stats/{agent_uuid}` endpoint daily.
- Log to `~/.zao/zoe/bonfire-stats.jsonl`:
```jsonl
{"date": "2026-05-06", "node_count": 142, "edge_count": 287, "docs_pushed": 15, "hit_rate": 0.87}
```
- Plot weekly: nodes should grow ~30-50/week during seeding, then stabilize at ~5-10/week for maintenance pushes.
- Dashboard: morning brief includes "Bonfire: 142 nodes, 287 edges, 87% hit rate."

**Metric 3: Qualitative feel (the only one that matters)**
- Zaal's gut reaction: does ZOE feel smart or amnesiac?
- Measured by: does recalled context actually make drafts better?
- Check: when newsletter calls recall("today's theme"), does the returned context get used in the draft? Or is it ignored/contradicted?
- Log: ZOE prompts to Claude include the bonfire context inline. Claude's usage is visible in the draft.

**Report location:** ZOE's daily morning brief (already a recurring message). Add section:
```
Bonfire snapshot (last 7 days):
- 142 nodes, 287 edges
- 87% hit rate (142/163 queries)
- Top gaps this week: Kenny (5), ZAOstock logistics (3), POIDH bounty updates (2)
- ~50 new facts pushed
```

---

## 6. Two-stage retrieval pattern (defer)

**What it is:** Instead of single API call to chat endpoint, ZOE first calls vector search to get candidate nodes, then anchors the full agent chat with center_node_uuid for grounding.

**Current:** Chat endpoint with graph_mode=adaptive already does this server-side. Bonfire agent decides what to retrieve based on the user's query.

**Two-stage on client:**
```typescript
// Stage 1: vector search
const candidates = await fetch(`/kg/search`, { query, num_results: 5 }).then(r => r.json());
// Stage 2: chat with anchor
const reply = await fetch(`/agents/{id}/chat`, {
  message: query,
  center_node_uuid: candidates[0].node_id, // anchor to top result
}).then(r => r.json());
```

**Trade-off:**
- Pro: grounding is explicit; ZOE knows which node is the "center."
- Con: 2x API calls; no savings in actual retrieval work (Bonfire still does the same graph traversal).

**Recommendation:** Defer. Single-stage (current chat endpoint) is sufficient. Re-evaluate if:
- Synthetic hallucination becomes visible in recall output (e.g., agent invents facts).
- Vector search fails silent and agent can't recover (need explicit fallback).
- Performance becomes a blocker (unlikely given Bonfire's architecture).

Revisit in doc 620's next sprint (after grounding + hit rate validation).

---

## 5 specific test queries with predicted behavior

| # | Query | Prediction | Acceptance criteria |
|---|-------|-----------|---------------------|
| 1 | `@recall Kenny` | Returns bio + role (Person node). Multi-hop to Projects Kenny's organized (POIDH, ZAOstock, etc). | Reply length > 200 chars AND includes at least one project name |
| 2 | `@recall committed to POIDH` | Matches commitment edges. Returns decision/promise facts related to POIDH. | Includes a specific date or deliverable (not just "Kenny is involved") |
| 3 | `@recall last ZAOstock meeting` | Filters events by (a) project=ZAOstock, (b) most recent timestamp. Returns date + attendees. | Reply includes ISO date (YYYY-MM-DD) and at least one attendee name |
| 4 | `@recall ZAOstock budget` | Anchors center_node_uuid to ZAOstock node. Returns all edges tagged "budget" or "budget_item". | Numeric values (e.g., "$20K target") OR structured breakdown (e.g., "venue: $5K, catering: $3K") |
| 5 | `@recall what did Zaal commit to Steve Peer about` | Person-to-person intersection. Filters Zaal's statements about Steve + commitments. | Reply includes at least one specific thing Zaal said to/about Steve (verbatim or paraphrased from notes) |

**Test execution:** Run queries #1-5 after doc 620b seeding is complete (after 50+ docs pushed). Log results to `~/.zao/zoe/recall-tests-<date>.json`. If 4/5 pass acceptance criteria, hit rate is validation.

---

## 3 metrics with computation method

### Metric 1: Recall hit rate

**Definition:** Percentage of recalls that return non-empty, coherent text (>20 chars).

**Computation:**
```bash
# Count all recalls with text > 20 chars
cat ~/.zao/zoe/recall-gaps.jsonl | \
  jq -s 'map(select(.text_length > 20)) | length' as non_empty | \
  jq -s 'length' as total | \
  echo "$non_empty / $total" | bc -l
```

**Cadence:** Daily. Report weekly rolling average in morning brief.

**Target:** 85%+ by 2026-05-20 (two weeks post-seeding).

### Metric 2: Graph growth trajectory

**Definition:** Node count + edge count + docs pushed per day. Tracked over 7 days for growth rate.

**Computation:**
```bash
# Fetch from Bonfire /insights endpoint (future)
# For now, query Bonfire UI dashboard manually weekly
# Log to:
echo '{"date":"2026-05-06","node_count":142,"edge_count":287,"docs_pushed":15}' >> \
  ~/.zao/zoe/bonfire-stats.jsonl
```

**Growth rate formula:**
```
new_nodes_this_week / 7 = avg_new_nodes_per_day
target = 30-50 nodes/week during seeding phase (May-Jun)
target = 5-10 nodes/week during maintenance phase (Jul+)
```

**Cadence:** Weekly (run /insights query Monday 6am EST). Alerts if growth < 5/week in seeding phase.

### Metric 3: Qualitative signal

**Definition:** Does recalled context land in generated content? Measured by text analysis (not numeric).

**Computation:**
```bash
# For each newsletter draft:
# (1) Extract bonfire_context section from ZOE prompt
# (2) Compare with final draft text (do keywords/entities match?)
# (3) Score: 0 (ignored), 1 (mentioned), 2 (integrated), 3 (drove structure)

# Log example:
echo '{"draft_date":"2026-05-06","bonfire_context":"Kenny + POIDH","integration_score":3,"draft_sample":"Kenny from POIDH at 2pm..."}' >> \
  ~/.zao/zoe/recall-integration.jsonl
```

**Cadence:** Every draft (daily). Compute rolling 7-day average in morning brief. Display as "Integration: 2.8/3 avg (strong)".

**Threshold:** If <1.5/3 avg for 3 consecutive days, notify Zaal that recall context is being ignored (prompt clarity issue or graph quality issue).

---

## Sources

1. **Bonfire API:** https://tnt-v2.api.bonfires.ai/openapi.json - LangGraphChatRequest schema with graph_mode, center_node_uuid, chat_history.
2. **ZOE recall bridge:** `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/recall.ts` - SDK placeholder, manual relay pattern.
3. **Newsletter agent (example):** `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/agents/newsletter.ts` - loadBonfireContext() function (lines 149-167), already wired pattern.
