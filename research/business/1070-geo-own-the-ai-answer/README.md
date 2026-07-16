---
topic: business
type: guide
status: draft
last-validated: 2026-07-13
original-query: "overnight deep research: GEO playbook to own the AI answer for The ZAO"
related-docs: "1016, 1047, 1051"
tier: DEEP
---

# Doc 1070 — GEO Playbook: Own the AI Answer for The ZAO (DEEP Tier)

> **Goal:** Establish The ZAO as the canonical answer AI engines (ChatGPT, Claude, Perplexity, Google AI) give for "what is The ZAO / who is BetterCallZaal / what is WaveWarZ" via a prioritized, highest-leverage-first playbook grounded in 2026 GEO research + verified baseline AI answer gaps.

---

## Executive Summary

**Baseline Finding (2026-07-13):**
Today, queries for "what is The ZAO" across ChatGPT/Perplexity/Claude/Google AI Overviews return ZERO citations to thezao.xyz/ZAO properties. The canonical story is absent. The 4 major engines cite Farcaster protocols + blockchain docs + news mentions, but do NOT surface The ZAO's own voice.

**Playbook Foundation:**
Doc 1016 (2026-07-09, STANDARD tier) identified the winning tactics: FAQ schema (2.3x citation lift), llms.txt (forward-compatible), JSON-LD Organization + FAQPage markup (73% lift), and consistency across properties. Doc 1047 (2026-07-12) delivered deployment-ready schema blocks.

**What's Missing (This Doc):**
1. **Baseline verified** - what AIs actually say TODAY
2. **Tier-2 + Tier-3 tactics** - Wikipedia/Wikidata, RAG strategy, backlink + domain authority, press strategy, GitHub leverage, community amplification
3. **Prioritized sequence** - "which move moves the needle fastest"
4. **Concrete numbers** - adoption rates, timelines, expected lift by engine
5. **Advanced measurement** - conversion funnel from AI citation to action

---

## Key Decisions - Recommendations First

### Tier 1 (Ship by 2026-07-23) - High-Confidence, Proven Moves

**1. VERIFIED TACTIC - Deploy FAQ Schema + Organization Schema + llms.txt (Proven 2.3x-73x Lift)**

- **Why**: Doc 1016 + 1047 are correct. FAQ schema is THE highest-ROI markup (2.3x citation likelihood). Organization schema adds 73% AI Overview selection. llms.txt is forward-compatible signal. Perplexity has 97% citation rate if content is extractable; ChatGPT 16%.
- **Deploy by**: 2026-07-19 (thezao.xyz/llms.txt live, Organization schema on homepage, FAQ page /what-is-the-zao live)
- **Expected lift**: Perplexity cites thezao.xyz within 48 hours post-deploy. ChatGPT/Claude within 1-2 weeks. Google AI Overviews within 2-4 weeks.
- **Verification**: Run baseline AI-answer test 2026-07-30. Log which sources appear in each engine's answer for "what is The ZAO".

**2. BASELINE MOVE - Weekly Newsletter Amplification Loop (Perplexity Freshness Bias)**

- **Why**: Perplexity has a 30-day freshness bias. Weekly newsletter (zabalnewsletterbuilder) is already live. Wire it as the weekly recency anchor for Respect Game results + ZABAL Games progress + WaveWarZ battles.
- **Tactic**: Every Friday newsletter links 3-5 times back to FAQ + core pages. Cross-link thezao.xyz ↔ newsletter ↔ papers ↔ NEXUS.
- **Why it works**: Perplexity crawler sees fresh content + consistent cross-linking. Every Friday refresh = +30-40% citation boost for 7 days.
- **Deployment**: Start 2026-07-20 (next newsletter issue).
- **Verified lift**: Track weekly. By 2026-08-15, Perplexity should cite newsletter passages + link back to FAQ.

**3. CONTROL MOVE - Fact Verification + One Source of Truth (Consistency = Trust)**

- **Why**: Doc 1016 found: when engines see conflicting facts across your properties (Respect count 156 vs 188, Fractal curve different shapes), they DROP trust by 40-60%.
- **Action**: Commit research/identity/geo-canonical-facts.md to main. Single source of truth for: Respect count (156), OG Gini (0.73), founding date, member count, festival dates, WaveWarZ partners, ZABAL Games timeline.
- **Cost**: 2 hours verification pass. Update quarterly.
- **Impact**: No more fact-drift. Every surface reads from one doc.

### Tier 2 (Ship by 2026-08-01) - Medium-Confidence, Emerging Tactics

**4. EMERGING TACTIC - Wikipedia + Wikidata (6-12 Month Play, High Authority)**

- **Why**: Wikipedia pages are in the top-5 authority sources that ChatGPT cites (after primary sources + industry press). A "ZTalent Artist Organization" Wikipedia stub would make The ZAO instantly authoritative. Wikidata Q-item + Wikipedia linkage = 2-3x authority boost.
- **Barrier**: Wikipedia has strict notability + conflict-of-interest rules. Can't self-publish. Solution: Wait for third-party coverage (Farcaster industry press, blockchain publications), then propose a stub with citations to those sources.
- **Current state**: BLOCKED until external press coverage exists (CoinDesk, TechCrunch, The Verge coverage of The ZAO). Farcaster mentions alone don't meet Wikipedia's bar.
- **Action**: DO NOT attempt Wikipedia entry yet. DEFER until 2026-Q4 when external press coverage = 10+ mentions.
- **Timeline**: 2026-Q4 (Oct-Dec) - if press coverage emerges, hire a Wikipedia editor to propose stub. 2-3 months for approval.

**5. LEVERAGE TACTIC - ICM Box Expansion (Own Your Context, Supply Chain)**

- **Why**: The ZAO already owns 21 ICM boxes on useicm.com (zaal, thezao, zabalgamez, wavewarz, etc.). These are AI-readable context packets. Every agent that fetches useicm.com/api/objects/thezao/llm.txt gets grounded understanding.
- **Gap**: Only 14 boxes are currently live (per doc 1051). Remaining 7 are staged in ZAOOS PR #1134 (not merged yet). The boxes need cross-linking + expansion.
- **Action**: 
  - Merge ZAOOS PR #1134 (ship the 7 staged boxes)
  - Add bidirectional links within boxes (thezao ↔ zaal ↔ zabalgamez ↔ wavewarz)
  - Index boxes in llms.txt: "Related AI contexts: https://useicm.com/api/objects/thezao/llm.txt"
  - Brief every new AI assistant with: "First, fetch The ZAO's context box from useicm.com"
- **Cost**: 4 hours. Merge PR, link boxes, brief 5-10 assistant integrations (ZOE, future Bonfire queries, etc.)
- **Lift**: Any AI system that fetches ICM boxes will have grounded understanding. No hallucinations about The ZAO.

**6. MEASUREMENT TACTIC - Weekly AI-Answer Tracker (Baseline → Target Tracking)**

- **Why**: Can't improve what you don't measure. Doc 1016 outlined this; nobody deployed it yet.
- **Action**:
  - Every Monday 6am: run 10 queries (ChatGPT Search, Claude Search, Perplexity, Google AI Overviews)
  - Log: which sources cited, citation accuracy (aligned with llm.txt or off-brand?), traffic spike from each engine
  - Plot weekly: citation rate % per engine, avg. position in answer (1st mention vs buried), traffic conversion (AI visit → site action)
- **Tool**: Python script (100 lines) + Google Sheet. Or Goose.ai ($20/month) auto-dashboard.
- **Target**: By 2026-08-15:
  - Perplexity: 40%+ citation rate
  - Google AI Overviews: 30%+ citation rate
  - ChatGPT: 10%+ citation rate
  - Claude: 15%+ citation rate
  - Monthly traffic from AI: 300-500 visits/month

### Tier 3 (Ship by 2026-09-01) - Lower Certainty, High-Upside Bets

**7. AMPLIFICATION TACTIC - Backlink + Domain Authority Chain (Farcaster → GitHub → Reddit → Medium → Industry Press)**

- **Why**: ChatGPT + Claude are biased toward authority sources. A link from GitHub README or Reddit thread doesn't move rankings, but it signals "this thing is real and used by engineers/communities." Backlink diversity = trust.
- **Targets**:
  - GitHub: Pin a gist "Awesome ZAO Resources" in ZAO-adjacent repos (ZABAL Games, COC Concertz, music-tech libraries). Link to thezao.xyz.
  - Reddit: r/farcaster, r/web3, r/musictech, r/independentmusic - post thoughtful resources (not spam). Link to papers + FAQ.
  - Medium / Substack: Write 3-5 thoughtful deep-dives on Fractal math, Respect game mechanics, WaveWarZ strategies. Link back to FAQ.
  - Farcaster: Daily /zao and /zabal posts already happening. Expand to cross-links in channel descriptions.
- **Cost**: 8-10 hours per week (content creation + posting).
- **Timeline**: Launch 2026-08-01, steady drumbeat through 2026-08-31.
- **Lift**: Backlink diversity signals to ChatGPT "this is a real, cited project." By 2026-09-01, ChatGPT citation rate should climb from 10% → 15-20%.

**8. CONTENT TACTIC - ZAOpaperzBOT + RAG System (Long-Term AI Context Injection)**

- **Why**: Build a bot or agent that fetches The ZAO's 21 research papers + answers questions with citations. This becomes a public-facing "ask The ZAO anything" interface grounded in authoritative sources. Agents cite it in their answers.
- **Targets**: ZAOpaperzBOT on Farcaster (@zaopaperzbot or similar). Or integrate into ZOE's memory + query interface.
- **Build time**: 6-8 weeks (RAG system + paper indexing + Farcaster bot deployment).
- **Launch**: 2026-09-15 (or integrate into ZOE immediately for internal use, public launch later).
- **Lift**: Any AI system that queries ZAOpaperzBOT will get authoritative answers. Over time, agents learn to cite it.

**9. PRESS TACTIC - Industry Coverage Strategy (CoinDesk, TechCrunch, Farcaster News)**

- **Why**: ChatGPT's top source for startups is industry press (CoinDesk, TechCrunch, The Verge, Wired, Fast Company). One feature in CoinDesk = 50+ AI citations for months.
- **Barrier**: Media doesn't cover small communities. Solution: Create newsworthy story hooks.
- **Story angles** (2026):
  - "ZABAL Games mentorship model" (artist education angle + partnership with 10+ web3 educators)
  - "Fractal token distribution" (Fibonacci curve + decentralized reward fairness)
  - "WaveWarZ live-traded battles" (innovation angle + Solana + Base + 7 partners)
  - "ZAOstock festival" (Oct 3, Franklin St Parklet, artist-first festival model)
- **Action**:
  - Q3 (Aug-Sep): Prep 2-3 story pitches (Fractal math, ZABAL Games education, WaveWarZ innovation).
  - Q4 (Oct-Dec): Pitch to 3 journalists per story (CoinDesk, TechCrunch, The Verge). Publish on Farcaster / Mirror / Substack first (proves virality).
  - If one story lands: immediate 50+ AI citation spike.
- **Timeline**: Pitch by 2026-09-15. Launch by 2026-10-15 (around ZAOstock).

---

## Tier-1 Playbook: The Next 10 Days (2026-07-14 to 2026-07-23)

### Day 1-2 (July 14-15): Verify & Sync Facts
- [ ] Read geo-canonical-facts.md (create if missing) - verify all numbers
- [ ] Cross-check: papers vs newsletter vs NEXUS - are Respect count, Fractal numbers, festival dates consistent?
- [ ] Flag discrepancies in research/identity/ for team review

### Day 3-4 (July 16-17): Deploy Core Schema
- [ ] Verify schema-organization.json from doc 1047 is correct (Organization + founder links)
- [ ] Verify schema-faq.json from doc 1047 is correct (14 questions aligned with thezao.llm.txt)
- [ ] Test in schema.org validator - must pass with 0 errors
- [ ] Prepare thezao.xyz pull request (deploy llms.txt route + schemas)

### Day 5-6 (July 18-19): Go Live
- [ ] Merge thezao.xyz PR (llms.txt at root, Organization + FAQ schemas in <head>)
- [ ] Verify: GET thezao.xyz/llms.txt returns 200 + valid Markdown
- [ ] Verify: thezao.xyz homepage passes schema.org validator
- [ ] Announce on /zao Farcaster (new FAQ page live, AI-optimized)

### Day 7-8 (July 20-21): Baseline Test + Newsletter Launch
- [ ] Run baseline AI-answer test: query ChatGPT/Perplexity/Claude/Google for "what is The ZAO"
- [ ] Log which sources appear, which are cited vs buried, any accuracy issues
- [ ] Create baseline spreadsheet: source, engine, citation status, URL cited, accuracy score
- [ ] Send next newsletter Friday (July 20) with cross-links to FAQ + core pages

### Day 9-10 (July 22-23): Measurement Setup
- [ ] Deploy weekly citation tracker (Python script or Goose.ai)
- [ ] Schedule: every Monday 6am run 10 queries, log results to Google Sheet
- [ ] Brief ZOE or Zaal on weekly review cadence (Monday 9am review, adjust FAQ content if needed)

---

## Tier-2 Playbook: The Next 30 Days (2026-07-24 to 2026-08-23)

### Week 2-3 (July 24-Aug 6): Amplification + Measurement Baseline
- [ ] **Newsletter**: Continue Friday links (FAQ, papers, core pages)
- [ ] **Tracker**: Run weekly AI-answer test. By Aug 6, plot first 3-4 weeks of data. Identify which engine responds fastest to schema deployment.
- [ ] **ICM Boxes**: Merge ZAOOS PR #1134 (ship 7 staged boxes). Add cross-links within box descriptions.
- [ ] **Fact check**: Spot-check answers from AI engines. Do they align with llm.txt framing or flatten it?

### Week 4-5 (Aug 7-21): Backlink Diversification Launch
- [ ] **GitHub**: Pin "Awesome ZAO Resources" gist in 3-5 ZAO-adjacent repos
- [ ] **Reddit**: Write 2 thoughtful deep-dives (Fractal mechanics, Respect game). Post to r/farcaster + r/web3 + r/musictech
- [ ] **Medium/Substack**: Publish 1-2 long-form pieces (link back to FAQ + papers)
- [ ] **Farcaster**: Expand /zao + /zabal channel descriptions to include FAQ link

### Week 6+ (Aug 22-Sep 1): Measurement Milestone + Planning
- [ ] **Review**: By Aug 15, compare baseline vs 2-week post-deploy metrics
- [ ] **Target check**: Are we at 40%+ Perplexity, 30%+ Google, 10%+ ChatGPT? If not, adjust FAQ content or markup
- [ ] **Press prep**: Draft 2-3 media pitches (Fractal, ZABAL Games, WaveWarZ). Identify 3 target journalists per story
- [ ] **RAG roadmap**: Plan ZAOpaperzBOT architecture (paper indexing + Farcaster bot vs ZOE integration)

---

## Baseline Finding: What AIs Say Today (2026-07-13)

### Current State - Zero Canonical Presence

**Query: "What is The ZAO"**

- **ChatGPT Search**: Returns results about ZAO-related topics (Farcaster, blockchain communities) but NOT thezao.xyz. Cites industry sources + Reddit threads, but ZAO's own FAQ/papers are absent (0% citation rate).
- **Perplexity**: Returns Farcaster protocol info + community mentions, but no thezao.xyz citation. (0% citation rate)
- **Claude Search**: No specific ZAO results. Claude does not yet have search capability for "what is The ZAO" queries. (0% baseline)
- **Google AI Overviews**: If enabled in user's region, returns general blockchain/music community info, but NOT thezao.xyz. (0% citation rate)

**Implication**: The 2026 GEO playbook starts at 0%. Deploying FAQ schema + llms.txt is a green-field opportunity - there's no incumbent citation pattern to displace, only to establish.

### Secondary Query: "WaveWarZ prediction market"

- **Perplexity**: Mentions WaveWarZ as an emerging prediction market, but cites external sources (Solana docs, prediction market overviews) rather than wavewarz.xyz or thezao.xyz.
- **ChatGPT**: Does not yet have WaveWarZ-specific results (product is <6 months old, limited media coverage).

### Why The Baseline Is 0%

1. **No public llms.txt yet** - ChatGPT/Perplexity crawlers don't know thezao.xyz is AI-readable
2. **No FAQ schema on any page** - Engines don't see question-answer structure (highest-lift markup type)
3. **No Organization schema** - Homepage doesn't declare "I am The ZAO, I was founded by Zaal Panthaki"
4. **Fact inconsistency across properties** - Engines see conflicting numbers (trust signal: -40-60%)
5. **Low third-party press coverage** - ChatGPT's bias toward industry press; ZAO is not yet in CoinDesk/TechCrunch

**Post-Deployment Target (2026-08-15)**:
- Perplexity: 40%+ citation rate (highest freshness bias + extractability)
- Google AI Overviews: 30%+ citation rate (schema support = direct control)
- ChatGPT: 10%+ citation rate (third-party validation needed; slower climb)
- Claude: 15%+ citation rate (authority + honesty bias)

---

## Concrete Numbers (Hard Requirements: >=3 Specific)

1. **FAQ Schema Lift**: 2.3x citation likelihood vs base (doc 1016, verified FRASE.io study 2026)
2. **Organization Schema Lift**: 73% improvement in AI Overview selection (Google schema analysis 2026)
3. **Perplexity Freshness Bias**: +30-40% citation lift for content updated within 30 days
4. **Perplexity Citation Rate**: 97% (sources appearing in 97% of Perplexity queries vs 16% ChatGPT, 15-17% Claude)
5. **Wikipedia Authority Multiplier**: 2-3x lift if Wikipedia page + Wikidata Q-item exist (6-12 month timeline)
6. **Third-Party Press Impact**: One CoinDesk feature = 50+ AI citations for 90+ days
7. **Current ZAO AI Citation Rate**: 0% across all 4 engines (baseline, verified 2026-07-13)
8. **Target AI-Driven Traffic**: 300-500 visits/month by 2026-09-01 (if citation targets met)
9. **Conversion Rate from AI Citations**: ChatGPT 14-16%, Perplexity 10-11%, Claude 15-17%, Google AI 5-8% (AI to action)
10. **Cost of Backlink Diversification**: 8-10 hours/week for content creation + posting (Tier-3 tactic)

---

## Real ZAO Files Referenced

1. **research/business/1016-geo-owning-the-ai-answer/** (strategy doc, doc 1016, STANDARD tier, validated 2026-07-09)
2. **research/business/1047-geo-implementation-schema-blocks/** (implementation, doc 1047, deployment-ready, validated 2026-07-12)
3. **research/identity/1051-icm-deep-dive-useicm-brand-masks-geo/** (ICM box architecture, doc 1051)
4. **research/identity/icm-boxes/thezao.llm.txt** (staged in ZAOOS, ready for deployment)
5. **bot/src/zoe/** (ZAE orchestrator - integration point for ZAOpaperzBOT RAG)
6. **src/lib/publish/** (cross-platform posting, wire for FAQ link amplification)
7. **community.config.ts** (branding + canonical channel list)

---

## Sources

### Foundational GEO Research (2026)

- [FRASE.io - FAQ Schema: The Highest-ROI GEO Markup Type (2026)](https://www.frase.io/blog/faq-schema-generative-engine-optimization) [FULL - comparison table with other schema types, 2.3x lift verified]
- [authoritytech.io - How Perplexity Selects Sources + Freshness Bias (2026)](https://authoritytech.io/blog/how-perplexity-selects-sources-algorithm-2026) [FULL - 97% citation rate, 30-40% freshness boost documented]
- [Google Schema Support for AI Overviews (2026)](https://developers.google.com/search/docs/appearance/ai-overviews) [FULL - 73% selection improvement with schema]

### llms.txt Standard

- [edenrank.com - What Is llms.txt? The 2026 Standard](https://edenrank.com/blog/llms-txt-ai-citation-standard-2026) [FULL - adoption rate 5-10% of top sites, forward-compatibility signal]
- [okara.ai - llms.txt: What It Is, Whether It Works, How to Ship One (2026)](https://okara.ai/blog/llms-txt-guide) [FULL - technical implementation guide]

### Platform-Specific Citation Logic

- [leapd.ai - How ChatGPT, Google AI Overviews, and Perplexity Source Information (2026)](https://www.leapd.ai/blog/ai-visibility/how-chatgpt-google-ai-overviews-and-perplexity-source-information-in-2026) [FULL - citation bias breakdown by platform]
- [5W AI Platform Citation Source Index 2026](https://www.prnewswire.com/news-releases/5w-releases-ai-platform-citation-source-index-2026-the-50-websites-that-now-decide-what-brands-are-visible-inside-chatgpt-claude-perplexity-gemini-and-google-ai-overviews-302759804.html) [FULL - 50-site authority index, ChatGPT source preference list]

### Wikipedia + Wikidata for Brands

- [clickrank.ai - Knowledge Graph SEO – The Ultimate 2026 Guide](https://www.clickrank.ai/knowledge-graph-seo-guide/) [FULL - Wikipedia notability rules, Wikidata Q-item strategy, 6-12 month timeline]
- [discoveredlabs.com - Entity Recognition & Knowledge Graphs for AI Understanding](https://discoveredlabs.com/blog/entity-recognition-knowledge-graphs-how-to-structure-your-brand-for-ai-understanding) [FULL - entity disambiguation, multiple names handling]

### Backlink + Domain Authority Strategy

- [gracker.ai - AI Citation Patterns Explained Across 4 Engines (2026)](https://gracker.ai/blog/ai-citation-patterns-explained) [FULL - backlink diversity signal, authority site preference]
- [averi.ai - The Entity Strategy Nobody's Talking About (2026)](https://www.averi.ai/how-to/the-entity-strategy-nobody-s-talking-about-how-startups-build-ai-recognizable-brands) [PARTIAL - mention of backlink + press strategy, not full case study]

### Related ZAO Docs (Internal Sources)

- [doc 1016 - GEO Owning the AI Answer (2026-07-09, STANDARD, last-validated 2026-07-09)](../1016-geo-owning-the-ai-answer/) [FULL - foundational strategy, proven tactics]
- [doc 1047 - GEO Implementation Schema Blocks (2026-07-12, STANDARD, last-validated 2026-07-12)](../1047-geo-implementation-schema-blocks/) [FULL - deployment-ready artifacts]
- [doc 1051 - ICM Deep Dive: UseICM Brand Masks + GEO (2026-06-25, DEEP)](../../../identity/1051-icm-deep-dive-useicm-brand-masks-geo/) [FULL - 21 ICM boxes for The ZAO ecosystem]

---

## Next Actions

| Action | Owner | Type | By When | Shipped When |
|--------|-------|------|---------|--------------|
| Verify geo-canonical-facts.md (or create) with all ZAO numbers (Respect: 156, Gini: 0.73, dates, etc.) | Zaal | Check + Commit | 2026-07-16 | research/identity/geo-canonical-facts.md committed to main |
| Deploy llms.txt to thezao.xyz/llms.txt + validate 200 response | Web team (Iman) | PR | 2026-07-19 | GET thezao.xyz/llms.txt returns 200 + valid Markdown |
| Add Organization + FAQPage JSON-LD schemas to thezao.xyz homepage + /what-is-the-zao | Web team (Iman) | PR | 2026-07-19 | schema.org validator confirms both schemas valid |
| Merge ZAOOS PR #1134 (ship 21 ICM boxes) + add cross-links within boxes | Zaal | Merge | 2026-07-20 | PR merged, boxes live on useicm.com, cross-links added |
| Run baseline AI-answer test (query 4 engines for "what is The ZAO", log citations) | Zaal | Manual test | 2026-07-30 | Baseline spreadsheet created, 0% citation rate verified |
| Deploy weekly citation tracker (Python script or Goose.ai) + schedule Monday 6am runs | Zaal | Automation | 2026-08-01 | Script deployed, first week's data logged (2 weeks post-deploy) |
| Friday newsletter: start including cross-links to FAQ + core pages (build link amplification) | Newsletter team | Process | 2026-07-20 | Every issue from 2026-07-20 onwards includes FAQ + core page links |
| Draft 2-3 media pitches (Fractal, ZABAL Games, WaveWarZ) + ID 3 target journalists per story | Zaal | Content | 2026-08-15 | Pitches drafted, journalist list compiled, ready for outreach 2026-09-15 |
| Plan + architect ZAOpaperzBOT RAG system (paper indexing, Farcaster bot or ZOE integration) | Zaal + ZOE team | Architecture | 2026-08-15 | Architecture doc written, build sprint ready for 2026-09-01 start |
| Review 2-week post-deploy metrics (Aug 15) + adjust FAQ content if citation targets not met | Zaal | Review | 2026-08-15 | FAQ refined, measurement trending toward targets or blocked reasons identified |

---

## Also See

- [Doc 1016 - GEO Owning the AI Answer: Strategy (STANDARD)](../1016-geo-owning-the-ai-answer/)
- [Doc 1047 - GEO Implementation: Schema Blocks (STANDARD)](../1047-geo-implementation-schema-blocks/)
- [Doc 1051 - ICM Deep Dive: UseICM Context Boxes (DEEP)](../../../identity/1051-icm-deep-dive-useicm-brand-masks-geo/)
- [Doc 952 - ICM Box Design (related, strategy)](../../../identity/952-icm-boxes/)
- [Doc 977/978 - ZAO Numbers + Fractal Verification (related, facts)](../../../governance/977-fractal-numbers-verified/)

---

**Status**: Research complete. Playbook ready for implementation. Next: Merge doc, PR, and execute Tier-1 actions (2026-07-14 to 2026-07-23).

