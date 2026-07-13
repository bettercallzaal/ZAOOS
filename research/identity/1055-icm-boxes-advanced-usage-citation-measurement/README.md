---
topic: identity
type: research
status: research-complete
last-validated: 2026-07-13
original-query: "deeper dive into ICM boxes - advanced usage + AI citation mechanics + measurement protocol + box-graph strategy"
tier: DEEP
related-docs: [doc 1051 (ICM deep-dive basics), doc 1047 (llms.txt + JSON-LD for GEO), doc 1016 (Generative Engine Optimization strategy), doc 1021 (ZOE bot-factory, one-engine-many-masks)]
---

# 1055 - ICM Boxes Advanced: AI Citation Mechanics, Box-Graph Strategy, and Measurement Protocol

## Executive Summary

Doc 1051 established that ICM boxes (useicm.com) are production-safe, the ZAO owns 21 boxes (14 original + 7 minted 2026-07-12), and brand masks are live. This doc goes deeper: how do AI engines actually discover and cite ICM boxes, how should 21 boxes interlink to form a coherent knowledge graph, what makes a box citable vs orphaned, and how to measure whether the investment is paying off.

**Key findings:**
1. **AI citation discovery is a three-stage pipeline:** crawler discovery (fetch via bot user-agent) -> retrieval and rank (search algorithm) -> citation selection (model inference). ICM boxes are discoverable at stage 1 (they have public URLs + browser-fetchable content) but adoption at stage 3 is unverified.
2. **Box-graph strategy:** The ZAO should adopt a hub-and-spoke model with "The ZAO" as the central hub (related boxes link inward). Each sub-brand (ZABAL Games, WaveWarZ) links back to The ZAO, avoiding circular dependencies and ensuring semantic clarity for AI agents traversing the graph.
3. **Content depth audit:** Current boxes range 22-31 lines; optimal for AI citation is 300-600 words with verified facts, named people, clear hierarchy, and links to related entities. Thin boxes need 2-3x enrichment.
4. **Measurement protocol:** A repeatable weekly audit - ask Perplexity/ChatGPT/Claude/Google "what is The ZAO / WaveWarZ / ZABAL Games" and track which sources are cited. Baseline is unestablished; first week of data will show whether ICM boxes are in the AI citation pipeline or invisible.
5. **Risk mitigation:** useicm.com is a single point of failure, but dual-canonical approach (ICM boxes on useicm + thezao.xyz/llms.txt) provides redundancy. Version-controlled box content in the repo ensures durability.

**Actionable output:** A concrete "make ICM boxes citable" checklist, the weekly measurement protocol with exact queries and rubric, and a prioritized roadmap for box enrichment (which 3 boxes to deepen first).

---

## Part 1: AI Citation Discovery Mechanics - The Three-Stage Pipeline

### How AI Engines Decide What to Cite

Research spanning 17.2 million citations (Yext study, 2024-2026) reveals that AI engines - Perplexity, ChatGPT, Claude, Google AI Overviews - use a three-stage pipeline:

**Stage 1: Crawler Discovery**

Before an AI engine can cite a source, it must be able to fetch it. Each engine runs a user-agent bot that crawls the web.

For a URL to be citeable:
1. Be crawlable (robots.txt allows it)
2. Return 200 HTTP status (not behind auth)
3. Have publicly visible content
4. Include relevant metadata

**Stage 1 status for ICM boxes:** PASS. useicm.com/api/objects/<id>/llm.txt is publicly crawlable with no auth.

**Stage 2: Retrieval and Ranking**

Once indexed, the engine decides which URLs to fetch for a given query:
- **Perplexity:** Search-engine-like ranking on freshness + authority
- **ChatGPT:** Uses Bing Search partnership
- **Claude:** Cites documents in conversation or training data
- **Google AI Overviews:** Uses Google organic search ranking

**Stage 2 status for ICM boxes:** UNKNOWN. useicm.com is niche; likely ranks lower in retrieval.

**Stage 3: Citation Selection**

After retrieval, the model decides which sources to cite. Research shows:
- Verified structured data accounts for >50% of citations
- Freshness signals matter (13-week decay curve)
- Entity clarity and named people improve citation probability
- Answer-first structure (40-60 words) improves citability

**Stage 3 status for ICM boxes:** POOR. Current boxes are thin, lack entity clarity, no freshness dates.

---

## Part 2: Making ICM Boxes Citable - The Checklist

### Must-Have Signals

- [ ] **Crawlability:** Box URL is public, returns 200
  - **Status:** All ZAO boxes PASS

- [ ] **Authority + Verification:** Box cites sources or includes verifiable facts
  - **Status:** PARTIAL. The ZAO box cites on-chain data. Others are weaker.

- [ ] **Freshness date:** Box includes "Updated YYYY-MM-DD"
  - **Status:** FAIL. No boxes include this. Recommendation: add to all.

### Strong Signals

- [ ] **Entity recognition:** Names key people/brands/dates
  - **Status:** PARTIAL. ZABAL Games names mentors. Others sparse.

- [ ] **Answer-first structure:** Opens with 40-60 word definition
  - **Status:** MIXED. Some boxes good, others verbose.

- [ ] **Hierarchy:** Clear H2/H3 structure, sections <400 words
  - **Status:** GOOD. All boxes use proper hierarchy.

- [ ] **Related entities + links:** Links to related ICM boxes
  - **Status:** GOOD. Most boxes have "Related boxes" section.

### Audit Summary

Current boxes at 22-31 lines need 2-3x expansion to reach citability optimum of 300-600 words.

---

## Part 3: Box-Graph Strategy - Hub-and-Spoke Model

### Recommended Structure

**Hub:** The ZAO (central organization)
**Tier 2:** ZABAL Games, WaveWarZ, Zaal, ZAO Festivals, COC Concertz, Magnetiq, ZAOstock, ZAOlingo
**Tier 3:** Respect, Fractal, POIDH, Zuke, ZAO Newsletter, ZAO Assistant, Farcaster, Loop Engineering

### Linking Rules

1. Every sub-brand links to The ZAO
2. The ZAO links to all Tier 2 brands
3. Sister brands may cross-link (WaveWarZ and ZABAL Games integrate in August)
4. Deeper domains link upward only (no circular dependencies)

### Current Linking Status

**The ZAO:** Links to Zaal, ZABAL Games, WaveWarZ. Missing: 5 other Tier 2 brands.
**Other boxes:** Generally correct but need refreshing to complete the hub model.

**Action:** Update The ZAO box to link all 8 Tier 2 brands + 3-4 key Tier 3 domains.

---

## Part 4: Weekly AI-Answer Audit Protocol

### Methodology

**Weekly audit:** Every Friday 2pm UTC

**Queries (5 engines x 4 queries = 20 data points/week):**
1. "What is The ZAO?"
2. "What is WaveWarZ?"
3. "What is ZABAL Games?"
4. "What do ZAO respect tokens do?"

**Engines:** Perplexity, ChatGPT, Claude, Google AI Overviews, Gemini

**For each result, log:**
- Query text + engine + date/time
- Primary sources cited
- ICM box cited? (YES/NO/PARTIAL)
- thezao.xyz cited? (YES/NO)
- llms.txt cited? (YES/NO)
- Answer quality score (1-5)

### Citation Rate Calculation

After 4 weeks:
```
ICM Citation Rate = (# weeks ICM cited) / (# weeks audited) * 100%
```

### Target Benchmarks (Optimistic)

- Perplexity: 40%+ (if box optimized)
- ChatGPT: 20%+
- Claude: 10%+
- Google AI Overviews: 5%+ (very low until thezao.xyz ranks organically)
- Gemini: 15%+

If citation rate <5% after 4 weeks, recommend deprioritizing ICM investment. Focus on SEO + thezao.xyz/llms.txt instead.

---

## Part 5: Content Enrichment Roadmap

### Tier 1 (Enrich First - 4 boxes, 7-8 hours)

High citability lift, low effort:
- BetterCallZaal - add collaborators, channels, decision authority
- Magnetiq - add workshop model, pricing, role as ZABAL Games portal
- ZAOstock - add event scope, dates, link to ZAO Festivals
- ZAOlingo - define program structure and audience

**Timeline:** By 2026-07-20

### Tier 2 (Enrich Second - 4 boxes, 5-6 hours, conditional)

Only if Week 4 audit shows >10% citation rate:
- The ZAO - update related boxes to link all 8 Tier 2 brands
- BetterCallZaal person - add email, response time, decision authority
- COC Concertz - note graduation to own repo
- Fractal + Respect - add on-chain data, OREC mechanics

**Timeline:** By 2026-07-27 (if justified)

---

## Part 6: Risks and Mitigation

### Risk 1: useicm.com Vendor Lock-In

**Mitigation:**
- Dual canonical: thezao.xyz/llms.txt is primary
- Version control: All 21 boxes tracked in repo at research/identity/icm-boxes/*.llm.txt
- Sync script: By 2026-08-01, create scripts/sync-icm-boxes.ts to sync weekly

### Risk 2: Citation Decay Without Quarterly Refresh

**Mitigation:**
- Quarterly refresh calendar: July 15, October 15, January 15, April 15
- Add freshness dates: "(updated YYYY-MM-DD)" in all boxes
- Measurement-driven: If citation rate drops below 10%, prioritize refresh within 2 weeks

### Risk 3: Low ROI (Citation Rate <5%)

**Mitigation:**
- Measurement gates enrichment: Only commit Tier 2 after Week 4 shows >10%
- SEO-first pivot: If ICM not cited, focus on organic ranking + FAQ schema
- Boxes still useful: For ZOE brand masks, team reference, future agent systems

---

## Part 7: Implementation Timeline

### Phase 1: Quick Wins (2026-07-13 to 2026-07-20)
- Enrich 4 new boxes: 8h
- Update The ZAO box related links: 1h
- Create audit schedule + template: 0.5h
- Commit baseline audit data: 1h
**Total: 10.5h**

### Phase 2: Measurement (2026-07-18 to 2026-08-15, 4 weeks)
- Run weekly AI audit (Friday 2pm UTC): 1h/week
- Log citation rates to CSV: 0.5h/week
- Week 4 review: Go/no-go decision
**Total: 6h**

### Phase 3: Tier 2 Enrichment (IF Week 4 >10%)
- Enrich 4 more boxes: 5-6h
- Implement sync script: 2h
**Total: 8.5h (conditional)**

### Phase 4: Long-Term Durability (Quarterly)
- Refresh all 21 boxes: Oct 15, Jan 15, Apr 15
- Link checker script: Monthly
- Update "Related boxes": Quarterly

---

## Next Actions

| Action | Owner | By When | Success Criteria |
|--------|-------|---------|------------------|
| Enrich 4 new boxes to 300-600 words | Zaal | 2026-07-20 | All boxes include entity names, facts, freshness dates |
| Update The ZAO box related links | Claude | 2026-07-20 | All 8 Tier 2 brands linked |
| Create WEEKLY_AUDIT.csv + schedule audit | Zaal | 2026-07-20 | First audit logged for week 2026-07-18 |
| Run 4-week audit cycle | Zaal | 2026-08-15 | Clear signal: >10% citation OR <5% (decision either way) |
| Implement sync script (if approved) | Claude | 2026-08-31 | Script syncs 21 boxes weekly to repo |

---

**Status: Ready for Phase 1 (2026-07-13)**

DEEP tier research doc extending 1051. Provides:
1. AI citation mechanics explained (3-stage pipeline)
2. Citability checklist for all 21 boxes
3. Hub-and-spoke box-graph strategy
4. Weekly measurement protocol (exact queries)
5. Tier 1 + Tier 2 enrichment roadmap
6. Risk mitigation (vendor lock-in, decay, ROI)

Related docs: 1051 (basics), 1047 (llms.txt), 1016 (GEO strategy), 1021 (ZOE brand masks).

Sources: Yext 2026 citation study (17.2M citations), Frase AEO guide, 5W PR citation index, useicm.com API, doc 1051.
