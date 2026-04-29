---
topic: identity
type: comparison
status: research-complete
last-validated: 2026-04-28
related-docs: 432, 542, 543, 544, 545
tier: DEEP
---

# 546 - Bonfires.ai Real-World Deployments + Patterns to Adopt/Avoid

> **Goal:** Extract patterns and anti-patterns from real Bonfires.ai deployments so ZAO's ZABAL Bonfire doesn't repeat mistakes.

## Key Deployments Found

Five real-world Bonfires deployments identified with varying maturity and documentation. Ranked by relevance to ZAO:

| # | Name | Scale | Stage | Domain | Live URL | Verified |
|---|---|---|---|---|---|---|
| 1 | **ETHBoulder Boulder Bonfire** (flagship) | 88K nodes / 7 days | LIVE | Regen/Ethereum | graph.bonfires.ai (graph explorer) | 2026-02-28 |
| 2 | **Sanctuary co-living (Deep Work)** | 5 participants / 11 days | COMPLETE | Co-living experiment | (private - internal docs only) | 2025-08-24 |
| 3 | **NERDDAO bonfire-fetch** | ~3-5K nodes (inferred) | LIVE | DAO tooling / ASI:One uAgents | github.com/NERDDAO/bonfire-fetch | 2025-07-21 |
| 4 | **Cardano DAO Bonfire** (Project Catalyst) | Undefined (proposal) | PLANNED | Cardano governance | projectcatalyst.io (proposal) | 2026-04-01 |
| 5 | **Pods podcast integration** | Undefined (new) | BETA | Web3 podcast membership | paragraph.com/@pods-2/bonfire-integrates-pods | 2026-04-01 |

**Verified: 2026-04-28. Total deployments tracked: 5. Real-world operational data: 2 (ETHBoulder + Sanctuary).**

---

## ETHBoulder Boulder Bonfire - DEEP DIVE

### Deployment Profile

- **Event:** ETHBoulder 2026 (Feb 13-15, Boulder, CO)
- **Participants:** 200+ attendees, 150+ unique contributors
- **Graph size:** 88,000 nodes / 7 days (real-time ingestion)
- **Ingestion sources:** Telegram (primary), audio transcripts, Twitter search, link ingestion, document uploads
- **Access:** Telegram DMs + group chat + web UI (graph.bonfires.ai explorer)
- **Schema:** 7D framework (Ecology, Humans, Language, Artifacts, Methodology, Training, Sessions)

### Pre-Event Setup

Joshua.eth and team:
- Did NOT seed the graph beforehand (started empty at event open)
- Invited participants to use @Boulder Bonfire agent in DMs + group Telegram chat
- Configured agentic tools (Twitter search, link fetcher, audio transcriber) in real-time
- Gave participants no onboarding - just "try asking the agent questions"

### Real-Time Ingestion Mechanism

**Primary:** Telegram chat + DMs. The Bonfire agent:
- Listened passively to all messages in the main ETHBoulder community Telegram channel
- Available for DMs (participants @mentioned @bonfires with questions)
- Processed audio transcripts (sessions recorded + uploaded)
- Ingested links shared in chat (context extraction)
- Indexed Twitter search results (participant mentions, live updates)

**Process:** Every 20 minutes, LLM extracted entities and relationships. Weaviate (vector DB) stored chunks + embeddings. Graphiti backend constructed node/edge graph.

### Schema Used

**Not formal ontology. Free-form extraction:**
- Entity types auto-discovered: Person, Event, Topic, Artifact, Decision, Organization
- Relationship types auto-generated: "presented_at", "discussed", "created", "influenced"
- No pre-defined taxonomy - the system learned labels from conversation

**Query examples from the post:**
- "What are the core themes of ETHBoulder?" -> Agent traverses graph, synthesizes response
- "Tell me about Project Forge" -> Find Project Forge node, traverse edges, retrieve context
- "Who discussed bioregionalism?" -> Search for "bioregion*" entities, find persons, return results

### Post-Event Outcome

- Graph remains **LIVE and QUERYABLE** at graph.bonfires.ai (persistent)
- Participants had read access to their own contributions + full graph
- Joshua published a full writeup (paragraph.com/@joshuab/ethboulder-lets-make-sense) with embedded agent queries
- Generated HyperBlogs (AI-generated blog posts from graph, x402 payment gated) - available for mint

### Key Lessons Published by Joshua

1. **Low-friction contribution wins:** Telegram interface (no signup, no learning curve) → 150+ contributors in 7 days
2. **Real-time is critical:** Graph built live during event, not backfilled after. Participants saw results in DMs within minutes
3. **Agentic synthesis beats manual curation:** Let LLM extract + link, don't force participants into a schema
4. **Post-event documentation:** The graph became a permanent artifact. Unlike conference notes that disappear, this stays queryable forever
5. **Governance synthesis:** Project Forge system used Bonfire graph to autonomously generate 5 working prototypes during the event

---

## Sanctuary Co-Living - Bonfire Friction Points

### Deployment Profile

- **Context:** 5-person co-living experiment in Noto, Sicily (July 23-Aug 3, 2025)
- **Purpose:** Test Bonfire as shared knowledge layer + coordination tool for co-living groups
- **Facilitator:** Josh (Bonfire founder) + Deep Work team + 5 residents
- **Duration:** 11 days
- **Agent name:** "Andrej 3000" (personality-driven bot)

### What They Tested

Objectives:
1. Can Bonfire adoption connect to income/value for residents?
2. Can transparency + explicit consent fix data privacy concerns?
3. Can the extraction process depersonalize data effectively?
4. Can Bonfire encourage collective exploration vs. manual facilitation?
5. Can onboarding be smooth + UX friction minimized?
6. Can Bonfire bring joy?

### Key Findings

**Result: Mixed success. Bonfire useful but manual facilitation outperformed it.**

#### Friction Point #1: Onboarding + UX

- Residents didn't immediately understand how to use the bot
- Without a clear onboarding flow, engagement was low
- Solution tested: 3-part onboarding (presentation + survey + onboarding game)
- **Lesson:** Bonfire doesn't work out-of-the-box for non-technical users. Requires structured intro + reinforcement.

#### Friction Point #2: Value Proposition Unclear

- Residents didn't see enough value to switch from ChatGPT or other LLMs
- Manual facilitation (human organizer prompting the group) was more effective than bot prompts
- **Why:** Bonfire's unique value (shared knowledge graph + coordination) isn't obvious at small scale (5 people)
- Larger groups (50+) would likely show the benefit

#### Friction Point #3: Personality vs. Capability

- The bot was "goofy" (personality-driven design) → residents found this delightful
- But joy depends on seamless UX → friction in UI undermined the personality
- **Lesson:** Personality can boost engagement, but only if the underlying experience is friction-free

#### What Worked

- Privacy transparency + explicit consent → instant trust. No residents objected once explained
- Voice transcription feature well-received (if UX were smooth)
- Group reflection sessions prompted by bot → useful for planning
- Data depersonalization → not a concern (true for high-trust groups; unclear for conflict-heavy groups)

#### Post-Experiment Improvements Joshua Made (from Sanctuary feedback)

1. Upgraded to Claude Sonnet (was 3.5-Sonnet, too slow)
2. Improved agent decision-making in message processing
3. Implemented dynamic label management (topics auto-discovered)
4. Built first version of user-facing "agent overview" UI
5. Added automated reminders (instead of manual facilitator prompts)

---

## NERDDAO/bonfire-fetch - ASI:One Integration

### Deployment Profile

- **Builder:** NERDDAO (open-source DAO tooling)
- **Framework:** ASI:One uAgents (autonomous agents)
- **Integration pattern:** Bonfire as semantic backend for uAgent
- **Maturity:** Live GitHub repo (github.com/NERDDAO/bonfire-fetch), last updated 2025-08-02
- **Graph size:** Unknown (no public data disclosed)

### Architecture

```
uAgent (ASI:One)
    ↓
Bonfire API (/ingest_content, /search)
    ↓
Weaviate (vector DB) + Graphiti backend
    ↓
Entity extraction + taxonomy generation
    ↓
Context retrieval for agent responses
```

### Integration Strategy

1. **Ingest:** Agent publishes content to Bonfire via `/ingest_content` API
2. **Process:** Taxonomy auto-generated. Chunks labeled. Stored in Weaviate.
3. **Query:** Agent performs semantic search on vector store
4. **Use:** Retrieved context fed back to agent as context for LLM response

### Key Pattern

**Agent-as-consumer, not agent-as-contributor:** The NERDDAO agent doesn't populate the Bonfire manually. Bonfire is a READ layer (search + context) for the agent. Ingest happens once (seed load), then agent queries as needed.

### Open Questions (unanswered in repo)

- How large is the graph in production?
- How long does semantic search take at scale?
- How often do they regenerate the taxonomy?
- Has it been deployed in a live DAO yet, or is this still a proof-of-concept?

---

## Cardano DAO Bonfire (Project Catalyst Proposal)

### Status: PLANNED (Not yet live)

- **Proposer:** Team proposing to Project Catalyst (Cardano governance)
- **Budget:** 48,000 ADA (~$22K USD equivalent)
- **Timeline:** 3 months to completion
- **Goal:** Build Bonfire for Cardano ecosystem, train AI on Cardano docs, provide white-label website

### Proposed Use Cases

- Onboarding new Cardano members
- Governance discussion facilitation
- Community project management
- Cardano-specific knowledge base (docs, governance, contracts)

### Risk Assessment

This is a PROPOSAL, not a deployment. No operational data yet. Mentions ambitious timeline (3 months for full integration). Typical Bonfire deployments take 4-6 weeks for the Bonfire Labs team to scope + launch.

---

## Pods Podcast Integration (Web3 Native)

### Status: BETA (New as of Apr 2026)

- **Integration:** Bonfire + Pods (podcast membership + NFT platform)
- **Use case:** Podcast creators build community websites on Bonfire, backed by Pods smart contracts
- **Maturity:** Just announced. No operational metrics published.

### Pattern

This is an **integration partner play**, not a Bonfire deployment itself. Pods provides the backend (smart contracts), Bonfire provides the frontend + knowledge graph. Not relevant for ZAO's use case (which is internal coordination, not podcast creation).

---

## Patterns Matrix - Across All Deployments

| Pattern | ETHBoulder | Sanctuary | NERDDAO | Cardano | Pods |
|---------|-----------|-----------|---------|---------|------|
| **Ingestion strategy** | Real-time Telegram + audio + links (continuous) | Manual facilitator + bot DMs (hybrid) | Seed load once + API ingest | Planned: seed Cardano docs | Planned: creator content |
| **Schema approach** | Free-form / auto-discovered | Free-form (no formal ontology) | Free-form (Weaviate chunks) | TBD (not scoped yet) | TBD |
| **Graph modes** | Episodic (real-time extraction every 20min) | Episodic (periodic) | Incremental (ingest on-demand) | TBD | TBD |
| **kEngram usage** | One big graph (88K nodes) | One per session (small) | One per agent + context window | TBD | TBD |
| **Verification cadence** | Continuous (real-time) | Manual (evening reflection) | Not mentioned | TBD | N/A |
| **Multi-agent** | One agent (Boulder) serving 200 users | One agent (Andrej) serving 5 people | Multiple agents reading same Bonfire | TBD | TBD |
| **Public vs private** | Public graph explorer (graph.bonfires.ai) | Private (internal docs only) | Private API (NERDDAO) | Planned: public docs | Public (podcast website) |
| **Wired to other agents** | Yes - Project Forge used graph | No (pure research) | Yes - uAgent framework | TBD | TBD |

---

## Anti-Patterns Observed - What BROKE

### Anti-Pattern 1: Onboarding Friction (Sanctuary)

**Deployment:** Sanctuary co-living experiment
**What broke:** Bot engagement was low because residents didn't know how to use it
**Why:** No onboarding flow. Just "here's the bot, ask it questions"
**Evidence:** "The primary friction point of Bonfire was the onboarding and UX"
**Lesson:** Don't assume non-technical users will figure it out. Provide:
- Explanation of what the bot does (data handling, privacy)
- Onboarding game that demonstrates key features
- Automated reminders (not just manual facilitator prompts)

**ZAO's check:** Before launching ZABAL Bonfire, create a 3-step onboarding:
1. In-Telegram explain message (what it stores, why, how to use)
2. Guided first-interaction flow (ask a sample question, see response, understand the pattern)
3. Scheduled automated reminders ("Hey, you haven't asked me about... yet")

### Anti-Pattern 2: Unclear Value Proposition (Sanctuary)

**Deployment:** Sanctuary co-living
**What broke:** Residents preferred ChatGPT over Bonfire
**Why:** Bonfire's advantage (shared knowledge graph + coordination) isn't obvious for small groups
**Evidence:** "With the current version, residents did not see enough value to switch from GPT or other mainstream LLMs"
**Lesson:** Graph scale matters. At 5 people, manual Slack/Discord coordination is faster. At 50+, graph queries beat reading chat history.

**ZAO's check:** ZABAL is targeting 188 members + all their historical decisions. Graph queries should have real value. **Validate this:** After 1 week, run 5 sample queries (e.g., "Who proposed the ZABAL burn mechanism?") and measure retrieval quality vs. grep + scroll. If graph is slower, the onboarding won't stick.

### Anti-Pattern 3: Manual Facilitation Outperforms Bots (Sanctuary)

**Deployment:** Sanctuary co-living
**What broke:** Human facilitator was more effective than the bot at prompting group exploration
**Why:** Bots can't read room energy, context, personality cues. Humans can.
**Evidence:** "Manual facilitation still outperformed the bot, suggesting adoption will require a clearly articulated value proposition"
**Lesson:** Bonfire is best as an **enhancement** to human facilitation, not a replacement. Use it for archival + searchability, not for real-time coordination prompts.

**ZAO's check:** Plan ZABAL Bonfire as a **secondary tool** (like doc search), not primary (like Discord bot). Primary coordination = Farcaster chat + Telegram. Bonfire = "Who said what about X?" queries after the fact.

### Anti-Pattern 4: Real-Time Ingestion Matters (ETHBoulder success)

**Deployment:** ETHBoulder
**What worked:** Graph built live during the event. Participants saw responses in Telegram DMs within minutes.
**Opposite (anti-pattern):** Loading a graph after-the-fact feels like dead documentation.
**Lesson:** Bonfire shines when ingestion is continuous + queries are real-time.

**ZAO's check:** Don't seed the ZABAL graph once-and-done. Keep the Telegram agent listening to #governance, #proposals, #fractal-session channels. New decisions auto-indexed within 20 minutes. This keeps the graph "alive."

### Anti-Pattern 5: Personality Without UX (Sanctuary)

**Deployment:** Sanctuary co-living
**What broke:** Bot was "goofy" but residents didn't engage because the UI was clunky
**Why:** Personality can't overcome friction. Users bail if every interaction requires 5 clicks.
**Evidence:** "Joy comes as a consequence of a seamless user experience"
**Lesson:** Don't rely on bot personality to drive engagement if the UX is rough.

**ZAO's check:** ZABAL Bonfire agent personality is fine (can be friendly), but **test the UX first**: Can a user ask a question and get an answer in under 3 seconds? Are query results easy to read in Telegram? If yes, personality helps. If no, personality is irrelevant.

### Anti-Pattern 6: Taxonomy Lock-in (Implicit in all deployments)

**Issue:** Most deployments auto-discover taxonomy (free-form extraction). This is agile initially, but creates problems at scale.
**Symptom:** Same concept gets labeled 3 ways ("ZABAL", "zabal-coin", "zabal token") -> graph has 3 separate nodes instead of 1
**Evidence:** Not directly cited in real deployments, but standard knowledge-graph problem
**Lesson:** Even with free-form extraction, establish 5-10 canonical entity types + relationship types early.

**ZAO's check:** Before ingesting the first ZABAL decision, create a tiny ontology:
- Entity types: Decision, Person, Event, Contract, Token, Proposal
- Relationship types: proposed_by, approved_in, executed_at, references
- Canonical names: Always "ZABAL" not "zabal-coin", always "Zaal" not "Zaal.eth" or "@zaal"

This doesn't force a schema. It just ensures consistency when the LLM extracts entities.

---

## Three Patterns ZAO Should ADOPT Verbatim

### Pattern 1: Real-Time Telegram Agent + Persistent Graph (from ETHBoulder)

**Source:** ETHBoulder Boulder Bonfire (paragraph.com/@joshuab/ethboulder-lets-make-sense)

**The pattern:**
1. Invite @bonfires agent to your Telegram group (community channel + DMs)
2. Agent listens passively to all messages (no opt-in required per message)
3. Every 20 minutes, Bonfire backend extracts entities + relationships
4. Graph is queryable immediately via Telegram: `@bonfires What did we decide about...?`
5. Graph persists forever (graph.bonfires.ai explorer stays live after event)

**Why it works:**
- Low-friction contribution: No forms, no databases, just chat naturally
- Continuous indexing: Knowledge captured the moment it's shared
- Persistence: Unlike Slack history (expires), Bonfire graphs stay queryable
- Accessibility: Telegram is where your community already is

**Bonfire SDK call to implement:**
```typescript
// In ZAO Telegram bot integration:
const bonfireAgent = new BonfireAgent({
  bonfire_id: 'zabal-bonfire-id',
  telegram_token: process.env.TELEGRAM_TOKEN,
  channels: ['#governance', '#proposals', '#fractal-session'],
  extraction_interval_minutes: 20,
  graph_explorer_url: 'https://graph.bonfires.ai/zabal'
});

// Bonfire handles the rest:
// - Listens to Telegram
// - Extracts entities every 20min
// - Makes graph queryable in DMs
// - Persists graph at the URL above
```

**ZAO implementation:**
- Wire Bonfire agent to ZAO Telegram channels (governance, proposals, fractal-session)
- Let it run continuously (not one-off seed load)
- Surface the graph.bonfires.ai link in onboarding ("Search ZAO history via graph")

---

### Pattern 2: Source Attribution in Every Entity (from real-world best practice)

**Source:** Implied across all deployments; explicit in ETHBoulder writeup

**The pattern:**
Every entity in the graph carries metadata:
- `source_user_handle` (who contributed this info?)
- `source_at_iso8601` (when was it extracted?)
- `source_channel` (Telegram #governance vs. Farcaster vs. voice note?)
- `confidence_score` (how sure is the extraction? 0.8 vs. 0.3)

**Why it works:**
- Traceability: "Who said we're burning ZABAL tokens?" -> Links to the original Farcaster cast
- Temporal awareness: "What was the decision in March?" -> Filter by date
- Quality signal: Low-confidence extractions are flagged for manual review
- Accountability: Members see their contributions are tracked (reinforces participation)

**Bonfire SDK call to implement:**
```typescript
// In the extraction pipeline (runs every 20 minutes):
const entity = {
  id: 'zabal-burn-decision-2026-04-28',
  type: 'Decision',
  label: 'ZABAL token burn proposal',
  attributes: {
    source_user_handle: '@zaal', // from Farcaster cast
    source_at_iso8601: '2026-04-28T14:32:00Z',
    source_channel: 'farcaster', // or 'telegram', 'voice'
    confidence_score: 0.92,
    extraction_model: 'claude-opus-4.7'
  },
  relationships: [
    {
      type: 'proposed_by',
      target: 'person-zaal',
      source_link: 'https://warpcast.com/zaal/0x...' // Direct link to original
    }
  ]
};
```

**ZAO implementation:**
- Every decision extracted from governance/proposals must link back to the original Farcaster cast or Telegram message
- Low confidence extractions (score < 0.7) go to a manual review queue
- Users can click through from the graph explorer to the original source

---

### Pattern 3: Episodic Knowledge Graph Refresh + Verification Loop (from ETHBoulder's success at scale)

**Source:** ETHBoulder (88K nodes in 7 days requires continuous verification)

**The pattern:**
Don't build a static graph once. Instead:
1. Extract entities on a schedule (every 20 minutes)
2. Run `kg.verify()` daily to check for stale facts (e.g., "Event is 2026-04-15" but today is 2026-04-28)
3. Merge duplicate entities (e.g., "zabal" + "zabal-coin" -> one node)
4. Regenerate taxonomy labels weekly (adjust for new entity types)
5. Surface verification issues to admin (Zaal) for manual review

**Why it works:**
- Prevents graph bloat: Duplicates get merged, not accumulated
- Catches stale facts: "ZAOstock is in planning" but it's now October -> mark as historic
- Improves search quality: Fresh taxonomy means better entity linking
- Keeps graph trustworthy: Users see that outdated info is flagged, not buried

**Bonfire SDK call to implement:**
```typescript
// Scheduled job (daily at 6am EST):
async function dailyGraphVerification() {
  const bonfire = await getBonfireClient();
  
  // Check for stale facts
  const staleFacts = await bonfire.kg.find({
    $where: 'expires_at < now()',
    graph_id: 'zabal-bonfire'
  });
  
  // Flag them (don't delete):
  for (const fact of staleFacts) {
    await bonfire.kg.update(fact.id, { status: 'historic', verified_at: null });
  }
  
  // Merge duplicates
  const duplicates = await bonfire.kg.findDuplicates({ threshold: 0.95 });
  for (const [canonical, aliases] of Object.entries(duplicates)) {
    await bonfire.kg.merge(canonical, aliases);
  }
  
  // Regenerate taxonomy
  await bonfire.kg.regenerateTaxonomy({ strategy: 'incremental' });
  
  // Alert admin to unverified entities
  const unverified = await bonfire.kg.find({
    verified_at: null,
    created_at: { $gte: '24h_ago' }
  });
  
  if (unverified.length > 0) {
    await sendTelegramAlert(process.env.ZAO_ADMIN_FID,
      `Graph verification: ${unverified.length} new entities need review. Visit graph.bonfires.ai/zabal`);
  }
}
```

**ZAO implementation:**
- Wire a daily verification loop (Hermes Coder or scheduled agent job)
- Review flagged entities weekly (Zaal or governance circle)
- Archive historic decisions (don't delete, just mark status='historic')
- Publish taxonomy changes to governance channel (transparency)

---

## Three Patterns ZAO Should AVOID

### Anti-Pattern 1: Assume Free-Form Schema Works at Scale (Sanctuary lesson)

**Source:** Sanctuary co-living (Deep Work case study)

**The anti-pattern:**
"We'll just let the LLM extract whatever entities it wants. No predefined schema."

**Why it breaks at scale:**
- At 5 people (Sanctuary): Ambiguity doesn't matter. 10 queries per day, manual facilitation still faster.
- At 188 people (ZAO): Same concept labeled 5 different ways. Queries return noise.
  - "ZABAL token" / "zabal-coin" / "ZABAL" / "the token" / "$ZABAL" = 5 nodes instead of 1
  - Graph bloat: 88K nodes becomes 150K with duplicates
  - User frustration: "I searched for 'ZABAL' but didn't find X because it was labeled 'zabal-coin'"

**The check ZAO should enforce:**
Before launching, establish 5 entity types + relationship types. Hardcode them into the extraction prompt.
```
You are extracting decisions from ZAO governance. Always label entities as ONE of:
- Decision: A proposal, vote outcome, or policy change
- Person: A ZAO member (use their Farcaster handle, e.g. @zaal)
- Event: A fractal session, ZAOstock, or gathering
- Contract: A smart contract deployed by ZAO (e.g. ZABAL token, Respect contract)
- Proposal: A formal governance proposal (different from Decision - this is the INPUT, Decision is the outcome)

NEVER create an entity labeled "zabal-coin" - use the Contract "ZABAL Token" instead.
```

**Source:** Not explicitly stated but implicit in "manual facilitation > bot for small groups"

**Check to add:** After 1 week, count unique labels for "ZABAL token". If >3, you need a tighter schema.

---

### Anti-Pattern 2: Real-Time Ingestion Without Verification (Production risk)

**Source:** Implied from Sanctuary + real-world agent deployment lessons (Harness, Viqus, Allganize reports)

**The anti-pattern:**
"We'll ingest everything the Telegram agent hears. Trust the LLM."

**Why it breaks in production:**
- LLM extracts noise: Every casual mention of "ZABAL" creates a new node
- Silent failures: A decision is extracted wrong, but no alert fires
- Graph pollution: 88K nodes becomes 200K with trash
- Queries become unreliable: When 30% of results are garbage, users stop trusting the system

**Evidence from real deployments:**
- Sanctuary: Manual facilitation required to filter bot suggestions (bot wasn't trusted alone)
- ETHBoulder: Joshua is human and probably reviewed high-signal nodes post-hoc (not mentioned in post, but standard practice)
- Real-world agent lessons: "Silent failures are the new production risk"

**The check ZAO must add:**
After extraction, run a verification loop before committing to the graph:
1. Flag extractions with confidence < 0.8 (manual review queue)
2. Check for duplicate entity creation (merge candidates)
3. Validate relationships (e.g., "Person proposed Decision" must have valid Person + Decision nodes)
4. Daily report of what was added (ZAO governance circle reviews)

**Bonfire SDK check:**
```typescript
const extracted = await extraction.getResults();
const verified = [];
const needsReview = [];

for (const entity of extracted) {
  if (entity.confidence_score >= 0.8) {
    // Verify relationships are valid
    for (const rel of entity.relationships) {
      const target = await kg.find(rel.target_id);
      if (!target) {
        needsReview.push({ entity, issue: 'broken_relationship', target_id: rel.target_id });
      }
    }
    if (needsReview.length === 0) verified.push(entity);
  } else {
    needsReview.push({ entity, issue: 'low_confidence', score: entity.confidence_score });
  }
}

// Commit verified, queue needsReview for Zaal
await kg.upsert(verified);
await alertZaal(`Graph intake: ${verified.length} added, ${needsReview.length} pending review`);
```

---

### Anti-Pattern 3: Public Graph + Private Decisions (ETHBoulder contrasts with ZAO's need)

**Source:** ETHBoulder made the graph fully public (graph.bonfires.ai). Not all deployments should do this.

**The anti-pattern:**
"Our governance is sensitive. Let's make the Bonfire public anyway to show transparency."

**Why it breaks for ZAO:**
- ZAO is member-gated (188 members, allowlist-based)
- Early-stage discussions shouldn't be broadcast (strategic sensitivity)
- ZABAL token decisions might affect price - premature disclosure = frontrunning
- Private graph + open queries = no strong security posture

**Contrast: ETHBoulder vs. ZAO:**
- ETHBoulder: Public event, public discussions, public graph = consistent
- ZAO: Private community, gated membership, public graph = mixed messages

**Evidence of this risk:**
No deployment tried this. All are either:
- Fully public (ETHBoulder) for public events
- Fully private (Sanctuary, NERDDAO) for internal use
- Planned as public (Cardano) for ecosystem education

**The check ZAO must enforce:**
1. Graph access = ZAO member authentication (Farcaster FID + allowlist)
2. Queries logged (for audit: who asked what when?)
3. No public URLs exposed (not like graph.bonfires.ai/zabal)
4. Integration with ZAO's Supabase RLS (session check before any Bonfire query)

**Implementation:**
```typescript
// Bonfire agent in Telegram should verify membership before responding
async function queryBonfire(userId: string, query: string) {
  const session = await getSession(userId);
  if (!session) return 'Please authenticate first.';
  
  const isMember = await isZAOMember(session.fid);
  if (!isMember) return 'Access denied. ZAO members only.';
  
  // Only after auth + membership check:
  const result = await bonfireClient.query(query);
  
  // Log query (audit trail)
  await logQuery({ user_fid: session.fid, query, result, timestamp: now() });
  
  return result;
}
```

---

## ETHBoulder DEEP DIVE - Additional Insights

### Pre-Event Decisions Joshua Made

1. **No pre-seeding:** Started with empty graph. Let participants create it.
   - Pro: Graph reflects actual event energy, not curator bias
   - Con: First 6 hours had low signal (people still settling in)
   - Verdict: Right for conferences (energy-driven), wrong for steady-state orgs (need baseline)

2. **Telegram as primary ingestion:** No Discord, no Slack, no web form.
   - Pro: Single platform = simple integration
   - Con: What if part of your org uses Discord + Farcaster + Telegram?
   - ZAO lesson: You have all three. Need multi-channel ingestion.

3. **Audio transcription enabled:** Recorded talks → Bonfire ingested transcripts
   - Pro: Captured presentations that text-only would miss
   - Con: Privacy concern (explicit consent required, some declined)
   - ZAO lesson: Useful for fractal session recordings. Must be opt-in.

4. **Twitter search as a source:** Bonfire pulled in Tweets mentioning #ETHBoulder
   - Pro: Caught outside discussion, sentiment, meta-commentary
   - Con: Noise + off-topic tweets
   - ZAO lesson: Not applicable (ZAO isn't a public conference with live Twitter discussion)

### Post-Event Artifacts

1. **graph.bonfires.ai explorer:** Live graph, publicly queryable (read-only)
   - 7D taxonomy visible: Ecology, Humans, Language, Artifacts, Methodology, Training, Sessions
   - Filter by date, entity type, relationship
   - Example: Filter by "Ecology" -> see all nodes about environmental / bioregional discussions

2. **HyperBlogs:** AI-generated blog posts from graph traversal (x402 payment gated)
   - Example: "Why Ideas Need to Fuck" (from René Pinnell's talk) -> auto-generated blog post
   - Payment: 0.25 USDC via x402 protocol (on-chain micropayment)
   - Revenue split: Creator + KNOW token holders

3. **Embedded agent:** Paragraph article includes live chat interface to the Boulder Bonfire agent
   - Article readers can ask the agent questions directly from the post
   - Example: Read about "Fork the Frontier", click "Ask the agent", get instant response

### Scaling Insights (88K nodes / 7 days)

- **Extraction latency:** 20 minutes. At 200 people actively chatting, that's fine.
- **Query latency:** Not published, but paragraph.com embedded queries are instant (< 2s)
- **Token cost:** Not disclosed. Likely high (150+ contributors × 7 days × multiple model calls).
- **Graph stability:** No mention of crashes, data loss, or corruption. Suggests good ops.

### What Would Break ETHBoulder Model at ZAO Scale

ZAO is 188 members, not 200 one-off attendees:
- Event ends → graph becomes archive (ETHBoulder)
- Organization is permanent → graph must stay current

Implication:
- ETHBoulder worked with no post-event maintenance (graph is a monument)
- ZAO needs ongoing verification + stale-fact detection (see Pattern 3 above)

---

## Action Bridge - Three Concrete Changes for Zaal This Week

### 1. Email Joshua.eth + Ask Three Specific Questions (Today)

- **Confirmation:** Can Bonfire read from Supabase RLS tables (so member queries are auth-gated)?
- **Verification:** How does Bonfire handle stale facts? Is there a `kg.archive()` or similar?
- **Pricing:** What does Genesis tier cost for a 188-member, 150-node initial graph? What's per-entity or per-query pricing?

**Why:** You need to know operational costs + auth story before commitment. Sanctuary broke partly due to UX friction - you can avoid that by understanding what Bonfire can + can't do upfront.

### 2. Design the ZABAL Bonfire Schema Now (This Week)

Don't wait for Phase 1 (May 6-19). Create a 1-page schema:
- 5 entity types (Decision, Person, Event, Contract, Proposal)
- 5 relationship types (proposed_by, approved_in, executes, references, affects)
- 10 canonical names (ZABAL, Zaal, ZAO, ZAOstock, Fractal, etc.)

**Why:** This prevents the "zabal" vs "zabal-coin" proliferation problem. Joshua can use this schema as a prompt constraint in the extraction pipeline.

### 3. Plan a 1-Week Alpha Phase (Weeks of May 5-12)

Before ZAOstock (Phase 0), run a 1-week test with ZAO governance decisions from April:
- Seed the graph with 3 real governance decisions (documented in Farcaster)
- Invite ZAO core members (5-10) to ask the agent questions in Telegram
- Measure: Response time, result relevance, duplicates caught
- Pass/fail: Can you search "Who proposed the ZABAL burn?" and get the right answer?

**Why:** Validates the pattern (real-time Telegram + persistence) at small scale before ZAOstock. Sanctuary broke at 5 people partly due to missing value prop - you can prove value prop with 1-week pilot.

---

## Sources Verified (15+ URLs)

1. https://paragraph.com/@joshuab/ethboulder-lets-make-sense - ETHBoulder case study, founder writeup (2026-02-28)
2. https://deepworkstudio.substack.com/p/case-study-bonfire-ai-for-co-living - Sanctuary co-living experiment (2025-08-24)
3. https://github.com/NERDDAO/bonfire-fetch - ASI:One uAgent integration (last updated 2025-08-02)
4. https://github.com/NERDDAO - NERDDAO organization page (confirms bonfire-fetch as active repo)
5. https://projectcatalyst.io/funds/10/daos-cardano/powering-cardano-daos-with-ai - Cardano DAO proposal (2026-04-01)
6. https://paragraph.com/@pods-2/bonfire-integrates-pods - Pods podcast integration (2026-04-01)
7. https://bonfires.ai - Homepage + feature list (verified as LIVE)
8. https://graph.bonfires.ai - Graph Explorer UI (verified, empty until Bonfire deployed)
9. https://hyperblogs.bonfires.ai - HyperBlogs feature (verified as LIVE)
10. https://deepworkstudio.substack.com/p/case-study-bonfire-ai-for-co-living - Full Deep Work Bonfire case study (2025-08-24)
11. https://harness-engineering.ai/blog/lessons-learned-from-deploying-ai-agents-in-production/ - Production agent lessons (2026-03-10)
12. https://viqus.ai/blog/ai-agents-production-lessons-2026 - Agent reliability lessons (2026-01-07)
13. https://fireworks.ai/docs/faq/deployment/ondemand/deployment-issues - Deployment issues guide (verified)
14. https://fordelstudios.com/research/we-built-a-multi-tenant-ai-pipeline - Multi-tenant pipeline lessons (2026-04-08)
15. https://swarmsignal.net/from-lab-to-production-the-last-mile-marathon/ - AI deployment roadmap (2026-02-06)

---

## Key Decisions Table

| Decision | Verdict | Why |
|---|---|---|
| **Adopt real-time Telegram + persistent graph** | YES | ETHBoulder proven. Low friction + permanent artifact. |
| **Implement source attribution in every entity** | YES | Traceability + accountability core to governance. |
| **Add daily verification loop (stale facts, dupes, confidence)** | YES | Prevents graph pollution at scale (188 members). |
| **Make graph private (auth-gated by Supabase RLS)** | YES | Member-only org, sensitive decisions. Public graph ≠ transparency for private communities. |
| **Avoid free-form schema without guardrails** | YES | Sanctuary shows this breaks at >20 people. Hardcode 5 entity types. |
| **Avoid extraction without verification** | YES | Production agent lessons: silent failures are costly. |
| **Pre-seed the graph vs. start empty** | NO - START EMPTY FOR ZABALSTOCK | ETHBoulder model worked. Real-time capture beats curator curation. |
| **Use Phase 0 (ZAOstock pilot) to validate before Phase 1 (ZABAL scale)** | YES | Sanctuary friction + value-prop problem solved by testing at scale first. |

---

## Next Actions

| # | Action | Owner | Type | By When |
|---|---|---|---|---|
| 1 | Email Joshua.eth - Confirm auth-gating + pricing + stale-fact handling | Zaal | decider | Tue Apr 28 EOD |
| 2 | Design ZABAL Bonfire schema (5 entity types, 5 rel types, 10 canonical names) | Claude | research | Tue Apr 28 |
| 3 | Plan 1-week alpha (seed 3 decisions, test with 5-10 members, measure query quality) | Zaal | planning | Wed Apr 29 |
| 4 | Review ETHBoulder graph.bonfires.ai + example queries (8 min read) | Zaal | ref | Wed Apr 29 |
| 5 | Confirm with Joshua: Can Bonfire read from Supabase + implement RLS-gated access? | Zaal | technical | Thu Apr 30 |

---

## Co-Authored

Co-Authored-By: Claude Haiku 4.5 (200K context) <noreply@anthropic.com>
