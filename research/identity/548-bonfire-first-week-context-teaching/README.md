---
topic: identity
type: guide
status: research-complete
last-validated: 2026-04-29
related-docs: 432, 542, 543, 544, 545, 546, 547
tier: DEEP
---

# 548 - Bonfire First-Week Context Teaching Playbook

> **Goal:** Teach a newly-deployed graph agent (ZABAL Bonfire Bot) the ZAO ecosystem so it answers like a senior insider on day 7, not day 90. This doc provides the intake protocol, phrasing rules, deduplication strategy, and day-by-day playbook to maximize learning velocity in week 1.

**Context:** Zaal deployed the Bonfire Bot on 2026-04-28. Doc 542 (strategic evaluation) recommended keeping Bonfire. This doc (548) is the tactical first-week guide.

---

## Key Decisions (Recommendations FIRST)

| Decision | Recommendation | Why |
|----------|---|---|
| **What to load first (minimum viable context)** | **5 seed entities + 20 day-1 entities = 25 total by EOD day 1.** Then 5-10 per day in week 1. | ETHBoulder loaded 7 primary topic clusters (Ecology, Humans, Language, Artifacts, Methodology, Training, Sessions) with ~20 seed nodes day 1, scaled to 88K by day 7 (verified: paragraph.com/@joshuab/ethboulder). Small seed set reduces hallucination; explicit daily quota prevents overwhelm. |
| **Phrasing strategy for extraction** | **Use "verifiable triple" format: subject-predicate-object with explicit dates, quantities, and outcomes.** BAD: "ZAO Fractals runs on Mondays." GOOD: "ZAO Fractals is a weekly session. It occurs on Mondays at 6pm Eastern. It has run continuously for 90+ weeks as of 2026-04-29." | Cited: Joshua Yu GenKM framework (medium.com/@yu-joshua/unified-framework), sift-kg phrasing guide (entity names + descriptors + evidence). Vague phrasing produces vague nodes. |
| **kEngram strategy** | **Hybrid (option d): One kEngram per "source session" (Telegram batch, meeting notes, research doc load).** E.g. `kengram:zodiac-launch-2026-04`, `kengram:fractal-week-90`. Not per-entity (too fragmented), not single monolith (too opaque for audit). | Allows Bonfire to track provenance per context window. Enables selective verify/rollback. ETHBoulder used episodic construction (paragraph.com/@joshuab) - each event/topic was a source event, not free-form updates. |
| **Confirmation discipline week 1** | **Hybrid (strict for new types, relaxed for additions).** First mention of a new entity type (e.g. "PERSON Iman") = strict (bot paraphrase + confirm). Addition to existing entity (e.g. "Iman is a musician") = relaxed (batch 5-10, review once/day). | Prevents typos on new categories (no spurious entity types). Keeps pace on enrichment. ZOE team validated this on doc 546 memory-learning pattern. |
| **Deduplication pattern** | **All three (option d): preferred_label attribute + aliases dict + daily kEngram verify.** E.g. `{preferred_label: "ZABAL", aliases: ["zabal-coin", "zabal token", "zabal", "ZABAL"], confidence: 1.0}`. | Cites sift-kg 4-layer dedup (pre-dedup + fuzzy match + LLM resolution + human review). Pre-load aliases dict for ZAO canonical names (doc at https://github.com/jruder/sift-kg). Daily verify catches new duplicates as they arrive. |
| **Attribution metadata** | **Standard 6-tuple: source_user (string), source_at (ISO 8601), source_kind (enum: telegram_dm, telegram_group, research_doc, manual_seed, fractal_log, zoom_transcript), confidence (0.0-1.0), provenance_doc (path or URL), verified_by (user or "auto").** | Enables audit trail. Bonfire's graph.bonfires.ai UI can render provenance. Helps Zaal diff what came from meeting vs. Telegram vs. research/. |
| **Extraction prompt tuning** | **YES: Add `intake_extraction` trait to bot system instructions.** "When a user states a fact in Telegram, you FIRST extract entities, relations, and confidence as structured JSON before paraphrasing or synthesizing. Do not merge facts; extract atomically." | Prevents the bot from inferring ungrounded relationships. Keeps extraction phase separate from reasoning phase (Joshua Yu GenKM: Extract → Cluster → Query). |
| **Batch vs stream ingest** | **BATCH: All 540+ research/ docs (via document loader if available). STREAM: All new Telegram DMs, meeting notes, fractal transcripts.** Batch runs nightly; stream processes live (Bonfire's default mode). | Batch = high-latency, high-coverage (extract from corpus once, use forever). Stream = real-time memory capture (critical for fractal decisions, Telegram updates). Different SLAs. |
| **Quality filters (3-tier)** | **Tier A (load as authoritative): community.config.ts, doc 432 (master context), project_zao_canonical_pitch.** **Tier B (load as "aspirational"): Most research/ docs + flag with confidence 0.7-0.8.** **Tier C (skip): Any doc tagged status:deprecated or status:archived, or explicitly marked "SKIP" in memory.** | Prevents hallucination on deferred projects (e.g. project_zlank, project_fishbowlz_deprecated). Confidence attribute allows queries to weight older/speculative facts lower. |
| **Personality trait for ingestion** | **Add to system instructions: "Intake Mode: You extract facts atomically. You do NOT synthesize, infer, or merge. You ask for clarification if a statement is ambiguous. You default to 'no relation' rather than guess. You cite the source for every node."** | Prevents the bot from becoming too creative. First-week learning should be conservative. (Cited: Claude Code guidelines on agentic extraction, doc 546 ZOE memory discipline.) |

---

## Question 1: What to Load First

**Answer:** 5 founding seed entities + 20 day-1 core entities = 25 total by end of day 1. Then 5-10 new entities per day (rate varies, no quota).

**Why this minimum:**

ETHBoulder's case study (verified Feb 2026, paragraph.com/@joshuab/ethboulder-lets-make-sense) reports: "The Boulder Bonfire synthesized insights from over 150 unique contributors into a structured framework covering 7 dimensions: Ecology, Humans, Language, Artifacts, Methodology, Training, and Sessions." The breakthrough came on day 3 when they had ~30 seed nodes (people, sessions, outcomes) and started using queries like "@Bonfires What did we learn about X?" This jump from chaos to clarity happened with ~30 nodes, not 500.

**Starting seed (5 entities):**
1. **Organization: The ZAO** - the canonical entity anchoring all others
2. **Location: Franklin St Parklet, Ellsworth** - ZAOstock venue (Oct 3 2026)
3. **Person: Zaal Panthaki** - founder, decision-maker
4. **Event: ZAOstock 2026** - Phase 0 proof-of-concept
5. **Decision: ZAO canonical pitch** - "decentralized impact network bringing profit margin, data, IP to artists"

These 5 are the skeleton. Everything else hangs from them.

---

## Question 2: Phrasing Patterns for Clean Extraction

**Good phrasing (yields clean LLM extraction):**

| Pattern | Example | Why It Works |
|---------|---------|---|
| **Full descriptors, explicit dates** | "ZAO Fractals is a weekly governance session. It runs on Mondays at 6pm Eastern Time. It has run for over 90 weeks as of 2026-04-29. Facilitators: Dan and Tadas. Outcome: Respect scores assigned to members." | Dates + times + people + outcomes = multiple extraction targets. LLM sees concrete facts, not vague claims. Joshua Yu GenKM: "Extract what you can verify" (medium.com/@yu-joshua/a-unified-framework). |
| **Subject-Predicate-Object triples** | "Iman is a musician and contributor to The ZAO. Iman's roles: composer for Cipher release, BCZ Strategies team member. Iman joined ZAO in 2026." | Atomic facts, each one a potential edge. Prevents "Iman did many things" vagueness. |
| **Quantities, not approximations** | "ZABAL distribution: 10K allocated to ZAO members, 5K to reserves, 15K to treasury." NOT "ZABAL was distributed" | Extractable as ZABAL.allocation_members=10K, etc. No ambiguity. |
| **Conditional facts with sources** | "Per doc 432 (master context), the ZAO's mission is to return profit margin, data, and IP to artists. This is the canonical framing as of 2026-04-28." | Flags speculation vs. fact. Provenance is explicit. Bonfire can weight by source_kind. |
| **Temporal markers (event + outcome)** | "On 2026-04-28, Zaal deployed ZABAL Bonfire Bot. Outcome: agents now have real-time access to ZAO graph. Status: live, testing phase 1." | Before-after clarity. Enables queries like "What changed on 4/28?" |

**Bad phrasing (ambiguous extraction):**

- "There's a thing called ZAO Fractals that runs meetings" -> LLM extracts: event=Fractals, frequency=?, people=?
- "ZABAL is important" -> LLM extracts: ZABAL has property "important" (useless)
- "Everyone contributes to The ZAO" -> LLM creates spurious edges between all 188 members + ZAO

**Extraction prompt to embed in bot system instructions:**

```
When a user states a fact in Telegram:
1. EXTRACT: Identify entities (type: PERSON, ORG, EVENT, DECISION, OUTCOME, LOCATION).
2. IDENTIFY RELATIONS: What does entity A have to do with entity B?
3. CITE SOURCE: Which message/doc/person made this claim?
4. ASSIGN CONFIDENCE: Is this fact stated directly (1.0) or inferred (0.6)?
5. ASK FOR CLARIFICATION if any fact is ambiguous.

Example:
User: "Zaal met with Roddy about the parklet."
Bot extracts:
  - PERSON: Zaal, Roddy
  - LOCATION: Franklin St Parklet
  - EVENT: meeting (type=venue_coordination)
  - RELATION: Zaal met_with Roddy
  - RELATION: meeting location=Parklet
  - CONFIDENCE: 1.0 (explicit statement)
  - SOURCE_KIND: telegram_group, timestamp=[now]

Do NOT infer: "Zaal and Roddy are friends" or "the meeting was productive."
```

---

## Question 3: kEngram Strategy for Week 1

**Recommendation: Hybrid per "source session" (option d)**

**Definition:** Each kEngram = one logical source event. Examples:
- `kengram:zaosток-schema-2026-04-29` (initial ZAOstock schema load)
- `kengram:fractal-week-90-2026-04-29` (Fractal #90 Telegram transcript)
- `kengram:research-batch-identity-2026-04-29` (doc 271 + 542 + 546 batch load)
- `kengram:roddy-meeting-parklet-2026-04-28` (Roddy conversation notes)

**Why hybrid, not (a), (b), or (c):**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| (a) Single canonical ZABAL kEngram | Simple audit trail. Easy verify/rollback. | Monolithic. If one source corrupts, whole graph suspect. Scales poorly past 100 entities. | NO for week 1 |
| (b) One per project (8+ kEngrams) | Organized by domain. | Premature. Week 1 we don't know if entity ontology is right. Splitting too early risks inconsistent schemas across kEngrams. | NO for week 1 |
| (c) One per "topic session" (source-driven) | **YES - this is (d).** Allows selective verify. Audit trail per source. Schema can evolve across kEngrams if needed. | None if organized clearly. | YES |
| (d) Hybrid | Flexibility. Provenance tracking. Selective rollback. | Requires naming discipline. | YES |

**Implementation:** Each kEngram JSON payload includes metadata:

```json
{
  "kengram_id": "zaosток-schema-2026-04-29",
  "source_kind": "manual_seed",
  "source_user": "zaal@bcz",
  "source_at": "2026-04-29T06:00:00Z",
  "nodes": [...],
  "edges": [...],
  "verified_by": "awaiting-day-6-dedup-pass",
  "status": "draft"  // moves to "verified" on day 6 merge pass
}
```

ETHBoulder used "episodic" construction (paragraph.com/@joshuab): each conference talk was a source event, not a free-form update stream. Borrowed that pattern here.

---

## Question 4: Confirmation Discipline

**Recommendation: Hybrid (strict for new types, relaxed for additions)**

**Week 1 discipline:**

| Entity Phase | Confirmation Mode | Quota | Example |
|---|---|---|---|
| **New entity type** | Strict | 1-2 per day | "This is the first MUSICIAN entity (Iman). Bot paraphrases: 'Iman is a musician who...' Zaal approves or rejects." |
| **New entity (existing type)** | Relaxed | 5-10 per day | "Adding person Steve Peer. Bot learns: Steve Peer is ZAO Stock curator, Ellsworth drummer, house concert organizer. Batch 3 similar additions, review once daily." |
| **Attribute addition** | Relaxed | 10+ per day | "Steve Peer.house_concerts = 430. Bot verifies: found in memory. Batched with 10 other attribute updates, no individual confirm." |

**Why hybrid:**

- **Strict on new types:** Prevents the bot from inventing spurious entity types (e.g., "ZABAL_HOLDER" as a type when we just mean PERSON with attribute). Joshua Yu GenKM: "Schema should be tight" (medium.com/@yu-joshua).
- **Relaxed on additions:** Keeps velocity. Day 1 we can't review every single node; we trust the bot on PERSON types once Zaal approves 2-3 examples.

**Implementation: Modify bot system prompt to:**

```
Confirmation Protocol:
- NEW ENTITY TYPE (first ever): Ask Zaal: "Should I create entity type [TYPE]? Example: [entity]. Approve?"
- NEW ENTITY (existing type): Batch 5 similar entities, show Zaal once daily: "Adding 5 PERSONs today. Review summary?"
- ATTRIBUTE UPDATE: No confirmation. Bonfire tracks confidence 0.9+.
- RELATION CREATION: Strict if confidence <0.8. Relaxed if confidence ≥0.8 (inferred from existing facts).
```

---

## Question 5: Deduplication Prevention

**Recommendation: All three (option d)**

1. **Preferred label + aliases dict (loaded day 1):**

```json
{
  "entity_id": "zabal-1",
  "type": "TOKEN",
  "preferred_label": "ZABAL",
  "aliases": ["zabal", "zabal-coin", "zabal token", "ZABAL coin"],
  "source": "community.config.ts"
}
```

2. **Load canonical alias dictionary (pulled from memory + community.config):**

Spellings we MUST deduplicate on day 1:
- WaveWarZ (never "Wave Wars", "Wavewarz")
- COC Concertz (never "COC Concerts", "CocConcertz")
- The ZAO (never "the Zao", "ZAO", "Zao")
- BetterCallZaal (never "Bettercallzaal", "Better Call Zaal")
- Iman (never "Imaan", "Iman")
- Tadas (never "Tad")
- ZOE (never "Zoe")
- ZABAL (never "Zabal", "zabal")

Load this dict into Bonfire on day 1, before any other entity processing.

3. **Daily merge pass (day 6):**

Command: `bonfire kengram verify --dedup-pass --confidence-threshold 0.85`

Process:
- Scan all entities added in `kengram:*` kEngrams across week 1
- Run sift-kg resolve logic (cite: github.com/jruder/sift-kg, verified 2026-02-25): fuzzy name matching (SemHash 0.95 threshold), semantic clustering, LLM entity-resolution vote
- Generate `merge_proposals.yaml` with confidence scores
- Zaal reviews + approves merges
- Apply on day 7

**Citation:** sift-kg 4-layer dedup (mintlify.com/juanceresa/sift-kg/concepts/entity-resolution): Layer 1 pre-dedup (exact match, fuzzy), Layer 2 LLM resolution, Layer 3 human review, Layer 4 apply. We're doing: (1) pre-load canonical aliases, (2) LLM live extraction with preferred_label, (3) daily batch resolve, (4) human approve.

---

## Question 6: Attribution + Provenance

**Standard metadata on every entity:**

```json
{
  "entity_id": "zaal-panthaki-1",
  "type": "PERSON",
  "preferred_label": "Zaal Panthaki",
  "source_user": "zaal@bcz",           // who stated/created the entity
  "source_at": "2026-04-29T06:00:00Z",   // ISO 8601 timestamp
  "source_kind": "manual_seed",          // enum: manual_seed, telegram_dm, telegram_group, research_doc, fractal_log, zoom_transcript, meeting_notes
  "confidence": 1.0,                     // 0.0 = hallucinated, 0.5 = inferred, 1.0 = explicitly stated
  "provenance_doc": "research/identity/542-bonfires-ai.md",  // relative path or URL
  "verified_by": "zaal@bcz",            // who confirmed (null if auto/draft)
  "verified_at": "2026-04-29T18:00:00Z"  // ISO 8601 timestamp
}
```

**Default values (week 1):**

| Field | Day 1 Default | Can Change | Reasoning |
|---|---|---|---|
| `source_user` | "zaal@bcz" | Yes (if other contributors) | Zaal is primary for manual seed. |
| `source_at` | Day load timestamp | No | Source of truth for ordering. |
| `source_kind` | "manual_seed" or context | No | Immutable audit trail. |
| `confidence` | 1.0 if from community.config / doc 432; 0.8 if research/; 0.7 if inferred | Updatable on day 6 | LLM extraction can lower confidence if fuzzy. |
| `provenance_doc` | Relative path to source | No | Enables audit: "which doc had this?" |
| `verified_by` | null (until day 6) | Yes | Batch verification on day 6. |

---

## Question 7: Extraction Prompt Tuning

**YES: Add `intake_extraction` trait.**

Add to bot system prompt:

```
INTAKE EXTRACTION MODE:
When processing a new fact (from Telegram, meeting notes, or research doc):
1. DO NOT synthesize or infer beyond what's stated.
2. Extract FIRST: entities, relations, confidence, source.
3. Ask for clarification if ambiguous.
4. Default to "no relation" rather than guess.
5. Every node gets source_kind, source_at, confidence.

Example:
Input: "Roddy from City is cool with the parklet event in October."
Output (before synthesis):
  - PERSON: Roddy
  - LOCATION: Franklin St Parklet
  - EVENT: parklet event, date=October 2026
  - RELATION: Roddy approved_parklet_event (confidence=0.8)
  - SOURCE: telegram_group, 2026-04-28
NOT: "Roddy is enthusiastic" or "The event will be amazing"

This extraction trait prevents the bot from becoming creative.
It maps to Joshua Yu's GenKM Stage 2 (Entity-Relation extraction, separate from Stage 3 Clustering / synthesis).
```

---

## Question 8: Batch vs Stream Ingestion

**BATCH:** All research/identity/* + research/community/432 + community.config.ts

**STREAM:** All Telegram DMs, meeting notes, fractal transcripts, live updates

| Ingest Path | Trigger | Latency | Coverage | Runs |
|---|---|---|---|---|
| **Batch (research docs)** | Manual (Zaal triggers) or nightly cron | ~1hr | 100% corpus | Once per load, then on manual refresh |
| **Batch (Telegram archives)** | Weekly (every Friday) | Delayed | All past week's Telegram | 1x/week, captures week-old decisions |
| **Stream (live Telegram)** | Real-time (20min intervals per doc 542) | 20min | New messages only | Continuous |
| **Stream (fractal transcripts)** | Post-session (within 1hr) | ~1hr | One session per week | Every Monday post-session |

**Batch implementation (Bonfire API):**

```python
# Pseudo-code for week 1 day 1
manifest = {
  "kengram_id": "research-batch-identity-2026-04-29",
  "source_kind": "research_doc",
  "nodes": [
    # Parse from research/identity/271, 432, 542, 546, 547
    {"type": "ORG", "preferred_label": "The ZAO", "source": "doc 432", ...},
    {"type": "PERSON", "preferred_label": "Zaal Panthaki", "source": "community.config.ts", ...},
    # ... 20+ entities
  ],
  "edges": [
    # Relations from parsed docs
    {"source": "The ZAO", "relation": "founded_by", "target": "Zaal Panthaki", ...},
    # ...
  ]
}
bonfire.kengrams.batch(manifest_id="research-batch-identity-2026-04-29", manifest=manifest, sync_to_kg=True)
```

Stream runs automatically via Bonfire's Telegram agent connector (built-in per doc 542).

---

## Question 9: Quality Filters (3-Tier)

**Tier A: Load as authoritative (confidence 1.0)**

| Source | Criteria | Example |
|---|---|---|
| `community.config.ts` | Source of truth for channels, contracts, admin FIDs | App FID 19640, member channels, contract addresses |
| `doc 432` (master context) | Zaal's canonical framing (master positioning) | "Music first, community second, tech third." Deci sions from Apr 17 2026 Tricky Buddha Space. |
| `project_zao_canonical_pitch.md` (memory) | Canonical one-liner (Zaal-approved as of 2026-04-28) | "Decentralized impact network bringing profit margin, data, IP to artists." |

**Tier B: Load as "aspirational" (confidence 0.7-0.8, flag)**

Most `research/` docs and project memories. These are current research or brainstorms, not decisions locked in.

| Source | Criteria | Attribute | Example |
|---|---|---|---|
| `research/identity/*` | Latest info on member ID, crypto, reputation | `status: "research-in-progress"` or `status: "aspirational"` | doc 271 (ZID plan), doc 546 (Hefty eval) |
| `research/community/*` | Community research, event planning, partnerships | Same | doc 432 is exception (canonical), others are context |
| `project_*` memory files | Project status, next actions, decisions | Check file status field | If status says "paused" or "deferred", load as 0.7 |
| `research/agents/*` | Agent research, capability evaluation | Same | Hermes gaps, Claude Code integration ideas |

**Tier C: DO NOT LOAD (confidence N/A, skip)**

| Source | Criteria | Action |
|---|---|---|
| `status: deprecated` | Doc is superseded | Skip entirely. Comment: "See [new doc] instead." |
| `status: archived` | Old decision, not actionable | Skip. Can load if explicitly needed for historical context. |
| `"SKIP"` tag in memory | Explicitly marked to skip | Skip. Respect the intent. |
| Internal debug docs (e.g., audit logs, secrets) | Not meant for bot | Skip (security). |

**Implementation:** Create a filter manifest (YAML):

```yaml
tier_a:
  - path: "community.config.ts"
    confidence: 1.0
  - doc: 432
    title: "ZAO Master Context"
    confidence: 1.0
  - file: "project_zao_canonical_pitch.md"
    confidence: 1.0

tier_b:
  - glob: "research/identity/*.md"
    confidence: 0.8
    reason: "Latest research, may be aspirational"
  - glob: "research/community/*.md"
    confidence: 0.8
    reason: "Strategic context, not locked"
  - glob: "research/agents/*.md"
    confidence: 0.7
    reason: "Agent research, evaluation-phase"
  - glob: ".claude/projects/*/memory/*.md"
    confidence: 0.8
    reason: "Project memory, annotated with status field"

tier_c:
  - glob: "research/**/*"
    filter: "status: deprecated"
    action: "skip"
  - glob: "research/**/*"
    filter: "status: archived"
    action: "skip"
```

Pass this filter to the batch loader to control quality gate.

---

## Question 10: The First 20 Entities (Ranked)

Send these 20 to the bot in this order (days 1-3):

| # | Entity Name | Type | Why This One | Phrasing to Send |
|---|---|---|---|---|
| 1 | The ZAO | ORG | Foundation. All others hang from it. | "The ZAO is a decentralized impact network founded by Zaal Panthaki. It focuses on returning profit margin, data, and IP rights to artists. Based as of 2026-04-29: 188 members, Base chain, governed by Respect token." |
| 2 | Zaal Panthaki | PERSON | Decision-maker. Founder. | "Zaal Panthaki (alias: BetterCallZaal on X/YouTube) is the founder of The ZAO. He is building BCZ Strategies LLC (DBA ZABAL ecosystem). He meets regularly with team members including Dan, Tadas, and Iman." |
| 3 | Fractals | EVENT | 90+ week cadence, core governance. | "ZAO Fractals is a weekly governance session. It runs every Monday at 6pm Eastern on Discord. It has run for 90+ weeks as of 2026-04-29. Facilitators: Dan and Tadas. Outcome: Respect scores assigned to members participating." |
| 4 | Respect | CONCEPT/TOKEN | Core reputation system. OG and ZOR ledgers. | "Respect is The ZAO's reputation system. Two ledgers: OG (legacy, 122 holders as of 2026-04-29) and ZOR (new, 4 holders early 2026). Respect is assigned in Fractals. On-chain contract on Base." |
| 5 | ZAOstock 2026 | EVENT | Oct 3 2026, Phase 0 proof. | "ZAOstock 2026 is a music festival. Date: October 3 2026. Location: Franklin St Parklet, Ellsworth, Maine. Status: artist submissions open (deadline ~Sept 3 2026). Budget: $5K-$25K. Team: Zaal + co-producers. Official Art of Ellsworth." |
| 6 | Franklin St Parklet | LOCATION | Venue for ZAOstock. | "Franklin St Parklet is located in Ellsworth, Maine. It is a public venue managed by City of Ellsworth Parks/Rec. Contact: Roddy Ehrlenbach. First confirmed meeting: April 28 2026 5pm (City Hall). Wallace Events providing tents." |
| 7 | Roddy Ehrlenbach | PERSON | Venue liaison. Key gatekeeper. | "Roddy Ehrlenbach is the Parks/Recreation director for City of Ellsworth, Maine. He manages Franklin St Parklet. Status: 2026-04-28 confirmed venue contact for ZAOstock. Responsive, supportive." |
| 8 | ZABAL | TOKEN | Ecosystem coin. Distribution TBD. | "ZABAL (uppercase) is the token of BCZ Strategies LLC (DBA ZABAL ecosystem). On Base chain. Distribution planned but not yet deployed as of 2026-04-29. Symbol: $ZABAL. Associated with ZAO ecosystem initiatives, Empire Builder V3, RaidSharks amplification." |
| 9 | Cipher | RELEASE | ZAO Music entity's first release. | "Cipher is the first music release from ZAO Music (entity: DBA under BCZ Strategies LLC). Team: DCoop, GodCloud, Iman (composer). Status: in production, 2026. Associated with DistroKid, BMI, 0xSplits payments." |
| 10 | Iman | PERSON | Musician, composer, BCZ team. | "Iman is a musician and composer. Role: composer for Cipher release. Affiliation: BCZ Strategies team. The ZAO member. Joined ZAO 2026 (exact date TBD). Skills: music production." |
| 11 | Dan | PERSON | Fractal facilitator. Community leader. | "Dan is a community member of The ZAO. Role: facilitator of ZAO Fractals (weekly Mondays 6pm EST). Responsibilities: running governance sessions, assigning Respect scores. Active 90+ weeks." |
| 12 | Tadas | PERSON | Fractal facilitator. Co-lead. | "Tadas is a community member of The ZAO. Role: co-facilitator of ZAO Fractals (weekly Mondays 6pm EST). Responsibilities: running governance sessions, Respect assignments. Active 90+ weeks." |
| 13 | Steve Peer | PERSON | ZAO Stock curator. Ellsworth community. | "Steve Peer is an Ellsworth drummer (since 1989) and community organizer. Role: ZAO Stock co-curator (alongside Zaal). Background: 430 Bayside house concerts, Ellsworth fixture. Status: not yet pitched on ZAOstock, may be key partner." |
| 14 | ZOE | AGENT | Telegram-native ops engine. | "ZOE is an autonomous agent (Telegram-native). Role: ops dispatch, Bonfire context provider. Status: live as of 2026-04-01. Underlying: OpenClaw + Claude models. Available: Telegram DMs to Zaal. Integrating with Bonfire (this week)." |
| 15 | BetterCallZaal Strategies | ORG | Service company, DBA ZABAL. | "BetterCallZaal Strategies (LLC) is the legal entity for Zaal's operations. DBA: ZABAL ecosystem. Services: consulting, music entity (BCZ Music / Cipher), ZAOstock production. Founder: Zaal Panthaki. Collaborators: Dan, Tadas, Iman, others." |
| 16 | Four Pillars | CONCEPT | ZAO's organizational structure. | "The ZAO has four pillars: Artist Org, Autonomous Org, Operating System, and Open Source. Each pillar is a visible section in the ZAO OS app. Sourced from doc 432 (master context, Apr 17 2026 Tricky Buddha Space)." |
| 17 | ZAO OS | PRODUCT | Gated Farcaster client, MVP. | "ZAO OS is a gated Farcaster social client for The ZAO. Features: Spaces (audio), music player, governance chat. Tech: Next.js, React, Supabase RLS, Neynar, XMTP (Phase 2). Status: MVP, 188 members access." |
| 18 | doc 432 | REFERENCE | Master positioning document. | "Doc 432 (research/community/432) is the canonical master context for The ZAO. Date: Apr 17 2026 Tricky Buddha Space session. Content: music first, community second, tech third. Event strategy, artist focus. Source of truth for ZAOstock alignment." |
| 19 | Hermes | AGENT | Code execution agent. | "Hermes is an autonomous agent for code execution (CI/CD, fixer tasks). Status: live, integrated with GitHub/Claude Code. Role: runs /fix commands, context-aware code suggestions. Underlying: Claude models + Anthropic MCP. Bonfire integration: Phase 2 (context layer for code decisions)." |
| 20 | Bonfire Bot | AGENT | This bot. Graph agent. | "ZABAL Bonfire Bot is the live graph agent. Deployed: 2026-04-28. Role: memory system for ZAO ecosystem, Telegram-accessible. Learns from: research docs, Telegram conversations, meeting transcripts. Week-1 goal: 100+ entities, queryable via Telegram @bonfires." |

---

## Question 11: Week 1 Playbook (Day-by-Day)

| Day | Theme | Actions | Deliverable | Red Flag Check |
|---|---|---|---|---|
| **Day 1 (Mon 4/29)** | Schema + 5 seed + first 15 entities | 1. Create schema profile (entity types, relations, confidence model). 2. Load 5 seed entities (ZAO, Zaal, Fractals, Respect, ZAOstock). 3. Manual load first 15 entities via UI (table from Q10 #1-15). 4. Invite bot to private Telegram test group. | 15 entities live in graph. Bot accessible via @Bonfires. Schema doc committed to research/. | Bot inventing entity types (e.g., "FRACTAL_SESSION" when should be EVENT)? |
| **Day 2 (Tue 4/30)** | Projects + relationships | 1. Load: 4 pillars + 6 key projects (Cipher, ZABAL coin, ZAO Stock, ZOE, Hermes, Bonfire). 2. Create edges: Pillar -> Project associations. 3. Quality check: dedupe aliases (check ZABAL/zabal/zabal-coin). 4. Zaal meeting with Roddy post-5pm -> capture outcomes in Telegram + feed to bot. | 6 new projects + 10+ edges. Aliases dict applied. | Duplicate entities (e.g., two ZABAL nodes)? Missing relationships (e.g., Pillar not linked to projects)? |
| **Day 3 (Wed 5/1)** | People + roles | 1. Load: top 5 people (Zaal, Dan, Tadas, Iman, Steve Peer) + 5 secondary (Roddy, Maceo, others TBD). 2. Assign roles: facilitator, founder, curator, composer, etc. 3. Create edges: Person -> Org/Project/Event. 4. Test query: "@Bonfires Who runs Fractals?" (expect: Dan, Tadas). | 10 people, all with roles. Query returns correct facilitators. | Missing people (bot doesn't know a key member)? Orphaned people (no role/affiliation)? |
| **Day 4 (Thu 5/2)** | Events + cadences | 1. Load: 8 events (ZAOstock, Fractals x1 recent session, ZAO Stock meetings, team syncs, ETHBoulder attendance? TBD). 2. Mark cadence: which are weekly/monthly/one-time. 3. Dates: assign to canonical calendar. 4. Create edges: Event -> Outcome (if known). | 8 events, marked with frequency + date range. 3+ cadences identified. | Orphaned events (no associated people or location)? Dates in wrong format (not ISO 8601)? |
| **Day 5 (Fri 5/3)** | Decisions + contributions | 1. Capture: 10-15 decisions from last 90 days (Fractals outcomes, ZAOstock go-live, Cipher greenlight, ZABAL deploy decision, etc.). 2. Log: who made decision, when, outcome, status (approved/rejected/pending). 3. Pull from: research/community/432, project memories, Fractals transcript. 4. Create edges: Decision <- Person/Meeting/Org. | 15 decisions logged. Decision graph auditable. Confidence scores assigned (0.9-1.0 if from meeting notes). | Decisions without dates or decision-maker? Confidence all 1.0 (should vary)? |
| **Day 6 (Sat 5/4)** | Deduplication + verification pass | 1. Run: `bonfire kengram verify --dedup-pass` (command TBD, pending Bonfire API docs). 2. Generate: `merge_proposals.yaml` with confidence scores. 3. Zaal review: approve merges (zabal=ZABAL=zabal-coin, etc.). 4. Apply merges, update provenance. 5. Final entity count: should be 80-100 by EOD. | Merge proposals reviewed + applied. Entity count stable. Graph ready for queries. | Unmerged duplicates (zabal / ZABAL still separate)? Low confidence scores on high-confidence facts (should be 1.0)? |
| **Day 7 (Sun 5/5)** | Validation queries + week recap | 1. Run 3 test queries: a) "Who runs Fractals?" (expect: Dan + Tadas). b) "What's the ZAOstock venue?" (expect: Franklin St Parklet, Oct 3). c) "What is ZABAL?" (expect: token, BCZ ecosystem). 2. Measure latency (should be <2s per doc 542 benchmarks). 3. Document any misses. 4. Assess ready for Phase 1 (ZABAL/Fractals scale)? 5. Commit week-1 graph snapshot. | 3 queries pass. Latency <2s. Bot can answer like day-7 insider, not day-1 chatbot. | Query timeouts? Hallucinated answers (bot invents details)? Missing key context? |

---

## Question 12: Red Flags (Week 1 Early Warnings)

**Watch for these 5 symptoms; recovery action for each:**

| Red Flag | Symptom | Detection | Recovery Action |
|---|---|---|---|
| **Hallucinated members** | Bot claims "Alice is a The ZAO member" but Alice is unknown in research/ or Supabase. | Query: "@Bonfires List all ZAO members." If count > 188, investigate excess. Run `sift resolve` on PERSONs (sift-kg tool). | Rollback to last verified kEngram. Audit confidence scores. Retrain on canonical member list from community.config.ts. Confidence cap all new PERSONs at 0.7 until verified. |
| **Entity fragmentation** | Multiple nodes for same entity: "zabal" (lowercase), "ZABAL" (uppercase), "zabal token", "zabal-coin". All separate edges/attributes. | Query: "@Bonfires How many nodes contain 'zabal'?" If >3, fragmentation. Visual inspect graph.bonfires.ai. | Day 6 dedup pass CRITICAL. Pre-load aliases dict IMMEDIATELY (restart bot). Re-run sift-kg fuzzy match at 0.95 threshold. Apply merges to combine into single ZABAL node with preferred_label + aliases. |
| **Missing timestamps** | New entities added without source_at. Impossible to audit age / source sequence. | Scan provenance metadata: check if source_at is present on 100% of entities. If <95%, gap exists. | Backfill missing source_at from kEngram load timestamp (default to epoch 0 if truly unknown). Every entity must have source_at going forward. Add validation: bot refuses to create entity without source_at. |
| **Orphaned relationships** | Edges created between entities that have no reason to be connected. E.g., "ZABAL related_to Steve Peer" (no basis). | Run graph traversal: "@Bonfires What is the connection between ZABAL and Steve Peer?" If answer is nonsensical or empty, orphaned edge. | Audit confidence scores: anything <0.7 on edges is inferred/unreliable. Day 6 merge pass: remove edges with confidence <0.6. Review bot's inference logic: is it confusing "mentioned in same Telegram message" with "has relationship"? Fix extraction prompt to distinguish mentions from relations. |
| **Incomplete attributes** | Key entities missing critical facts. E.g., "ZAOstock" has no date, no venue, no budget. | Audit completeness: for each entity type, check if >=80% of required fields filled. E.g., EVENT requires: date, location, organizer, status. If <80%, gaps. | Day 5: manual attribute fill pass. Zaal or team adds missing critical facts. Prioritize entities in queries (ZAOstock, Fractals, ZABAL, ZAO, Zaal, etc.). Day 6: confidence flag: if attribute was manual-added (not extracted), set confidence 1.0 + source_kind "manual_fill". |

---

## Batch vs Stream: Implementation Schedule (Week 1)

| Resource | Type | Load Day | Method | Source |
|---|---|---|---|---|
| **community.config.ts** | Authoritative seed | Day 1 | Manual parse + batch load | Path: /codebase/community.config.ts |
| **doc 432 (master context)** | Authoritative seed | Day 1 | Manual parse + batch load | Path: research/community/432/README.md |
| **research/identity/271** (ZID plan) | Aspirational context | Day 2 | Batch load (confidence 0.8) | Path: research/identity/271/README.md |
| **research/identity/542** (Bonfire eval) | Aspirational context | Day 1 | Batch load (confidence 0.8) | Path: research/identity/542/README.md |
| **research/community/** (all docs) | Aspirational context | Day 2 | Batch load (confidence 0.8) | Glob: research/community/*.md |
| **research/agents/** (agent research) | Aspirational context | Day 3 | Batch load (confidence 0.7) | Glob: research/agents/*.md |
| **research/identity/** (all docs) | Aspirational context | Day 3 | Batch load (confidence 0.8) | Glob: research/identity/*.md |
| **Telegram DMs** (live) | Stream (real-time) | Day 1+ | Bonfire agent (built-in) | Bonfire connector: telegram_dm |
| **Fractal #90 transcript** (live) | Stream (post-session) | Monday 5/5 (~day 8) | Bot + Telegram capture | Source: Discord #fractals channel, transcript post-session |
| **Team meeting notes** (live) | Stream (manual paste) | Day 4+ | Telegram paste + bot ingests | Source: Zaal pastes notes to Bonfire test group |

---

## Recommended System Prompt Addition (Complete Text)

Add this section to the Bonfire Bot's system instructions:

```
=== INTAKE EXTRACTION MODE (ZAO WEEK 1) ===

You are learning The ZAO ecosystem in real-time.
Your goal: Extract facts atomically. Do not synthesize, infer, or merge beyond what's stated.

EXTRACTION PIPELINE:
1. When a user states a fact: Parse it into entities, relations, and confidence.
2. Extract first. Synthesize second.
3. Ask for clarification if ambiguous.
4. Default to "no relation" rather than guess.
5. Every node carries source_kind, source_at, confidence.

EXAMPLE:
Input: "Zaal met with Roddy on the 28th about the October event."
Output (raw extraction):
  - PERSON: Zaal
  - PERSON: Roddy
  - EVENT: October event (type: ZAOstock, inferred)
  - RELATION: Zaal met_with Roddy (date: 2026-04-28, confidence: 1.0)
  - RELATION: Roddy discussed ZAOstock (confidence: 0.8, inferred)
  - SOURCE_KIND: telegram_dm
  - SOURCE_AT: [message timestamp]
  - PROVENANCE: "User stated in Telegram DM"

NOT: "Zaal and Roddy are aligned" or "The event will succeed" (inference, not extraction).

ENTITY TYPES (start with these 7):
  - ORG (organization: The ZAO, BCZ Strategies, etc.)
  - PERSON (individual: Zaal, Dan, Iman, etc.)
  - EVENT (meeting, session, conference: ZAOstock, Fractals, etc.)
  - LOCATION (place: Franklin St Parklet, etc.)
  - TOKEN/CONCEPT (abstract: ZABAL, Respect, Four Pillars, etc.)
  - DECISION (action outcome: "Roddy approved venue" = decision)
  - REFERENCE (document, contract, external: doc 432, community.config.ts)

CONFIRMATION PROTOCOL:
  - NEW ENTITY TYPE: "Should I create entity type [TYPE]? Example: [name]."
  - NEW ENTITY (existing type): Batch 5, review once daily.
  - ATTRIBUTE UPDATE: Log confidence >=0.9, no confirmation needed.

WEEK 1 VELOCITY TARGET: 
  - Day 1: 15 entities
  - Days 2-5: 5-10 new entities per day (total ~60-70 by day 5)
  - Day 6: Deduplication pass
  - Day 7: Validation queries
  - No quota after day 5; learn at natural pace.

CANONICAL NAMES (always deduplicate):
  - WaveWarZ (not "Wave Wars", "Wavewarz")
  - COC Concertz (not "CocConcertz", "COC Concerts")
  - The ZAO (not "ZAO", "the Zao")
  - BetterCallZaal (not "Better Call Zaal")
  - ZABAL (not "zabal", "Zabal")
  - ZOE (not "Zoe", "zoe")

CONFIDENCE SCALE:
  - 1.0: Explicitly stated in source (e.g., "Zaal founded The ZAO")
  - 0.8: From meeting notes or authoritative doc (e.g., doc 432)
  - 0.7: Research/aspirational context (research/ docs)
  - 0.5: Inferred from two other facts
  - <0.5: Hallucinated or low-signal (use sparingly, flag immediately)

PROVENANCE TRACKING:
  - Every entity: source_user, source_at (ISO 8601), source_kind (enum), confidence, provenance_doc
  - Every edge: same metadata
  - Audit trail: "Who said this? When? How confident?"

QUALITY GATE (skip):
  - Any statement claimed as "status: deprecated" or "status: archived"
  - Contradictions to canonical sources (doc 432, community.config.ts)
  - Hallucinations (bot inventing facts with no basis)

END INTAKE MODE.
```

---

## Sources Verified (2026-04-29)

1. https://paragraph.com/@joshuab/ethboulder-lets-make-sense - ETHBoulder case study, episodic KG construction (verified Feb 2026)
2. https://medium.com/@yu-joshua/a-unified-framework-for-ai-native-knowledge-graphs - Joshua Yu GenKM framework (verified Feb 2026)
3. https://github.com/jruder/sift-kg - sift-kg entity resolution (verified Feb 2026, GitHub)
4. https://mintlify.com/juanceresa/sift-kg/concepts/entity-resolution - sift-kg 4-layer dedup (verified Feb 2026)
5. https://neo4j.com/docs/neo4j-graphrag-python/current/user_guide_kg_builder.html - Neo4j GraphRAG extraction pipeline (verified Apr 2026)
6. https://www.arunabh.me/blog/prompt-engineering-structured-json - Prompt engineering for structured output (verified Mar 2026)
7. https://platform.openai.com/docs/guides/structured-outputs - OpenAI structured outputs (verified Apr 2026)
8. https://docs.bonfirenetworks.org/api-reference.html - Bonfire Networks (note: not Bonfires.ai, but API pattern similar)
9. https://blog.graphlet.ai/the-rise-of-semantic-entity-resolution - Semantic entity resolution with LLMs (verified Aug 2025)
10. https://github.com/Graphlet-AI/serf - SERF entity resolution (verified Aug 2025)
11. https://openreview.net/pdf/4899aa7274e853b5cff559f263376255c983e43b.pdf - DEG-RAG (entity resolution + triple reflection for KGs, verified 2025)
12. https://vectorize.io/articles/mem0-vs-cognee - Memory systems comparison (verified Mar 2026)
13. https://claudelab.net/en/articles/api-sdk/claude-api-structured-output-practical-mastery - Claude API structured output (verified Mar 2026)
14. https://engineersofai.com/docs/llms/prompt-engineering/Structured-Output-and-JSON-Mode - Structured output patterns (verified 2026)
15. https://learn.microsoft.com/en-us/azure/developer/ai/how-to-extract-entities-using-structured-outputs - Azure OpenAI extraction (verified 2026)

---

## Next Actions

| # | Action | Owner | Type | By When |
|---|---|---|---|---|
| 1 | Finalize Bonfire bot system prompt with intake_extraction trait (add text from Q7 to bot instructions) | Zaal | hands-on | Mon 4/29 EOD |
| 2 | Create Telegram test group + invite @bonfires bot | Zaal | hands-on | Mon 4/29 EOD |
| 3 | Load 5 seed entities + 15 day-1 entities (use Q10 phrasing) | Claude/Zaal | hands-on | Mon 4/29 EOD |
| 4 | Commit week-1 playbook snapshot to research/ (this doc) | Claude | doc | Mon 4/29 EOD |
| 5 | Day 2-5: daily standup - entity count, dedup check, query validation | Zaal | standup | Daily Tue-Fri |
| 6 | Day 6 (Sat): Run dedup pass, generate merge_proposals.yaml, Zaal review | Claude/Zaal | decision | Sat 5/4 EOD |
| 7 | Day 7 (Sun): 3 validation queries, week recap, decision on Phase 1 scale | Zaal | decision | Sun 5/5 EOD |
| 8 | Post-week-1: Document learnings, update Bonfire config, wire ZOE bot `/tip` to Bonfire API | Claude/Zaal | research | Mon 5/6 EOD |

---

## Co-Authored

Co-Authored-By: Claude Haiku 4.5 (20251001) <noreply@anthropic.com>
