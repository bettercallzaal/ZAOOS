---
topic: identity
type: decision
status: research-complete
last-validated: 2026-05-05
related-docs: 549, 568, 569, 570, 581, 606, 611
tier: STANDARD
---

# 614 - Bonfire ontology: 10 entity classes for the Zabal bonfire

> **Goal:** Lock the ontology that ZOE proposes against when it auto-classifies inbox / capture / conversation content for Bonfire ingestion (doc 611 Phase 2). 10 classes, with required + optional fields, examples, and the routing rules ZOE uses.

## Key Decisions

| Decision | Action |
|----------|--------|
| 10 classes - Person, Project, Decision, Event, Source, Idea, Tool, Place, Quote, Risk | YES, locked. Each has a required-field set + 3-5 examples. |
| Classification confidence bands: 0.7+ auto-add, 0.4-0.7 ask, <0.4 dump to `unclassified` | YES. ZOE asks via Telegram inline keyboard when in the middle band. |
| Use Ollama llama3.1:8b for first-pass classification, escalate to Sonnet on ambiguity | YES per doc 612. Cuts Sonnet calls by ~70% for inbox volume. |
| All proposed entities go to `~/.zao/zoe/bonfire-queue/<date>.jsonl` first, batch-write at 9pm | YES per doc 611 Phase 2. Daily curate-or-drop gate. |
| Source class doubles as the "evidence anchor" for every other entity | YES. Every Person/Project/Decision references at least one Source via `source_ids` array. Same provenance pattern as doc 570. |
| Quotes get their own class instead of being a Source attribute | YES. Quotes get pulled into newsletters + posts. First-class queryable. |
| Risk class explicit (not buried in Decision) | YES. Active risk register surfaces in weekly retro. |

## The 10 classes

Each has: name, required fields, optional fields, 3 examples drawn from real Zaal context, and a one-line classification heuristic.

### 1. Person

Required: `name`, `relationship` (free text 1 sentence)
Optional: `roles[]` (musician, founder, dev, etc), `channels` (tg/fc/x/email/ens), `last_contact_date`, `bio`, `source_ids[]`

Heuristic: text mentions a real human by name or handle, or describes a relationship.

Examples:
- "Maceo - long-time friend, web3 OG, intro'd Matteo Tambussi for ZAO Italy bridge per doc 419. Last contact 2026-04-17."
- "Roddy Ehrlenbach - City of Ellsworth Parks/Rec, ZAOstock parklet venue contact. Met 2026-04-28."
- "Kenny @ POIDH - founder, BCZ YapZ ep 19 guest 2026-05-05."

### 2. Project

Required: `name`, `status` (active / paused / shipped / killed), `next_milestone`
Optional: `owner` (Person ref), `target_date`, `risks[]`, `decisions[]`, `source_ids[]`

Heuristic: a thing with a goal + a deadline + people working on it.

Examples:
- "ZAOstock 2026 - active. Next milestone: lineup published. Target: 2026-10-03 Franklin St Parklet, Ellsworth ME. Owner: Zaal."
- "BCZ Music Entity - active. Next milestone: BMI registration. Owner: Zaal + DCoop."
- "FISHBOWLZ - killed 2026-05-04. Juke partnership replaced it."

### 3. Decision

Required: `statement`, `rationale`, `date_made`, `confidence` (0.0-1.0)
Optional: `alternatives[]`, `reversible` (bool), `superseded_by` (Decision ref), `source_ids[]`

Heuristic: an explicit choice between alternatives, with a date.

Examples:
- "Use ZAO STOCK Supabase as single source of truth, deprecate efsxt. Made 2026-05-04. Confidence 0.95. Reversible: data still on efsxt. Rationale: 27 team members on both, only 1 row diff, simpler ops."
- "Hermes is canonical agent framework for ZAO. Made 2026-05-05. Confidence 1.0. Reversible: no, code locked-in. Rationale: Max plan = $0 marginal, no API key billing, simple ops."
- "ZAOstock cobuild Mondays 11:30am EST regular slot. Made 2026-05-05. Confidence 0.8. Reversible: yes."

### 4. Event

Required: `name`, `date_or_window`, `location`
Optional: `attendees[]` (Person refs), `outcome`, `prep_tasks[]`, `recap_url`, `source_ids[]`

Heuristic: scheduled, has a date, real-world or virtual.

Examples:
- "BCZ YapZ Ep 19 with Kenny POIDH - 2026-05-05 14:00 ET, virtual record."
- "ZAOstock 2026 festival - 2026-10-03, Franklin St Parklet Ellsworth ME."
- "Roddy parklet meeting - 2026-04-28 17:00, City Hall Ellsworth."

### 5. Source

Required: `kind` (cast / tweet / podcast / article / video / chatgpt / email / commit / meeting / voice_memo), `url_or_id`
Optional: `title`, `author`, `published_at`, `key_quote`, `extracted_at` (always set)

Heuristic: every other entity should have a Source backing its claim. Sources are the evidence layer.

Examples:
- "youtube_video https://youtu.be/HH0zCQgYgq0 - BCZ YapZ Ep 18 with Andy Minton, published 2026-05-04. Author: BetterCallZaal."
- "tweet https://x.com/zaal/status/abc - 'Won a Farcaster hackathon track', published 2026-05-04."
- "meeting 2026-05-05-zaostock-cobuild - notes at /memory/2026-05-05-meeting.md, attendees: Zaal, Cheeka, DCoop, Shawn."

### 6. Idea

Required: `summary` (1-3 sentences), `status` (brainstorm / exploring / paused / killed / promoted-to-project)
Optional: `originated_from` (Source ref), `connected_to[]` (Project / Idea / Person refs), `iterations[]` (timestamped revisions)

Heuristic: half-formed thought, no deadline yet, may or may not become a project.

Examples:
- "Recording + translation bot - replaces Craig with Whisper + Claude diarization, posts to TG topics. Status: paused. Originated from 2026-05-05 cobuild."
- "ZAO Jukebox - weekly mystery-mint music miniapp on FC. Status: brainstorm. From 2026-04-29 design-doc draft."
- "Voice mode for ZOE via LiveKit + Cartesia - status: exploring. Doc 605d covers."

### 7. Tool

Required: `name`, `purpose` (1 sentence), `status` (live / trialing / decommissioned / wishlist)
Optional: `cost_per_month`, `replaces` (Tool ref), `gotchas[]`

Heuristic: a service / SaaS / library / hardware that ZAO uses or considers.

Examples:
- "Granola - meeting transcript SaaS. Status: free tier active 2026-05-04. Cost: $0 (free tier 25 meetings lifetime, $14/mo unlimited)."
- "Bonfire - personal KG + agent platform. Status: live. Cost: Genesis tier wallet-gated. Replaces: Obsidian."
- "Limitless Pendant - ambient audio capture wearable. Status: wishlist. Cost: $199 hw + $0-29/mo."

### 8. Place

Required: `name`, `kind` (city / venue / studio / online_room)
Optional: `lat_lng`, `notes`, `events[]` (Event refs)

Heuristic: a physical or persistent virtual location.

Examples:
- "Ellsworth, Maine - city. Home base 2026."
- "Franklin St Parklet, Ellsworth - venue. ZAOstock 2026 venue, City Parks/Rec managed."
- "ZAO Festivals Discord - online_room. 6 forum topics matching 6 circles."

### 9. Quote

Required: `text`, `attributed_to` (Person ref OR string if not in graph), `source_id` (Source ref)
Optional: `context` (1 sentence about why it matters), `tags[]`

Heuristic: words spoken or written by someone, worth re-reading. Pulled into newsletters, casts, talks.

Examples:
- "'Web3 as a layer in the stack, not the whole meal.' - Andy Minton, BCZ YapZ Ep 18. Tag: web3-philosophy. Used in May 4 Firefly post."
- "'Quieter work than it sounds.' - Zaal on Wherever You Go Ch 2 reading. Tag: practice."
- "'You are loved by the universe. You are the universe.' - You Are a Badass calendar. Tag: badass-quote-may2026."

### 10. Risk

Required: `description`, `impact` (low / med / high), `likelihood` (low / med / high), `status` (open / mitigated / accepted / closed)
Optional: `owner` (Person ref), `mitigation_plan`, `connected_to[]` (Project refs), `last_reviewed`

Heuristic: a thing that could go wrong AND is worth tracking actively.

Examples:
- "Bonfire SDK key delay from Joshua.eth - impact: med, likelihood: low, status: open. Mitigation: manual relay path active. Connected: doc 611 Phase 1."
- "ZAOstock Oct 3 venue permit timing - impact: high, likelihood: low, status: open. Owner: Host circle. Mitigation: confirm with Roddy by August."
- "Subagent runaway cost - impact: high, likelihood: med, status: mitigated by $5 daily cap (doc 611 Phase 3)."

## Cross-class relationships (the graph shape)

Bonfire is graph-native. Relationships are explicit.

- `Person --> works_on --> Project`
- `Decision --> made_by --> Person, supersedes --> Decision, references --> Source`
- `Event --> attended_by --> Person, held_at --> Place, recorded_in --> Source`
- `Idea --> connected_to --> Project | Idea, supported_by --> Source`
- `Quote --> said_by --> Person, came_from --> Source`
- `Risk --> threatens --> Project, owned_by --> Person`
- `Source --> evidence_for --> any class`

## ZOE's auto-classification heuristic (Phase 2)

When ZOE proposes an entity from raw text:

1. Regex pre-pass:
   - Contains URL ending in `.mp4` or `youtu.be/` or `youtube.com/`: candidate Source kind=video
   - Contains `x.com/` or `twitter.com/`: candidate Source kind=tweet
   - Contains date pattern (`Mon May 5`, `2026-10-03`): consider Event
   - Contains "@<handle>" pattern: consider Person reference
   - Contains "decided to", "we will", "going to": consider Decision

2. Ollama classify against the 10 class names with 6-token cap (`bot/src/zoe/ollama.ts`). Returns one label.

3. If Ollama confidence implied below 0.7 (label is `unknown` or rare class), escalate to Sonnet which produces structured output: `{class, fields, confidence}`.

4. Land in `~/.zao/zoe/bonfire-queue/<date>.jsonl` with classification + confidence.

5. Daily 9pm reflection surfaces top 5 with Now/Later/Shelve buttons. Approved adds get pushed via Bonfire `/agents/{agent_id}/stack/add` API.

## When NOT to classify (skip the queue)

Some text isn't entity-worthy. ZOE drops to `recent.json` only:
- Greetings ("hi", "thanks", "lol")
- Free-form conversation that's already context for the current concierge thread
- Short reactions to ZOE's own outputs ("nice", "ship it")
- Anything under 30 chars without a URL or date

## Bootstrap pass: seed Bonfire from existing memory

Before Phase 2 ingestion goes live, do a one-time bootstrap:

1. Walk `~/.claude/projects/.../memory/project_*.md` files
2. Each one becomes 1-3 entities (typically a Person, Project, or Decision)
3. Walk recent `research/**/README.md` (last 30 days)
4. Each becomes a Source + 1-2 referenced entities
5. Walk `bot/src/zoe/persona.md` + `human.md` for Person + Project anchors

This makes `@recall` queries work day one. Without bootstrap, the bonfire is empty (the literal "tinder + kindling" reply Zaal got 2026-05-05).

Estimate: ~80-120 seed entities from existing memory. 1-time script, ~30 min ZOE wall-clock to write into queue, then Zaal approves over a few sittings.

## Codebase touchpoints (Phase 2)

- `~/.zao/zoe/bonfire-ontology.md` (new on VPS) - this doc's content as a runtime reference for Sonnet calls
- `bot/src/zoe/bonfire-pipeline.ts` (new) - propose / queue / write
- `bot/src/zoe/agents/inbox.ts` (Phase 1) - calls bonfire-pipeline.propose() per categorized email
- `bot/src/zoe/reflect.ts` (extend) - surface top 5 queued, inline Now/Later/Shelve
- `bot/scripts/bonfire-bootstrap.mjs` (new) - one-time seed script, walks memory + research

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Author `~/.zao/zoe/bonfire-ontology.md` on VPS from this doc | Claude | SSH | Phase 2 kickoff |
| 2 | Build bonfire-pipeline.ts (propose / queue / write) | Claude | PR | Phase 2 |
| 3 | Build bonfire-bootstrap.mjs + run it once | Claude | PR + run | After ontology lands |
| 4 | Extend reflect.ts with proposed-adds inline keyboard | Claude | PR | Phase 2 |
| 5 | Test classification accuracy with 50 real-world inputs | Zaal + Claude | Bot test | After Phase 2 ships |

## Sources

- [Doc 549 - Bonfire as personal second brain](../549-bonfire-personal-second-brain/) - foundation
- [Doc 568 - Aware brain local memory KG](../../agents/568-aware-brain-local-memory-knowledge-graph/) - alt KG patterns
- [Doc 569 - YapZ Bonfire ingestion strategy](../569-yapz-bonfire-ingestion-strategy/) - first ingestion experiment
- [Doc 570 - Zaal personal KG agentic memory](../570-zaal-personal-kg-agentic-memory/) - 16-corpus mapping with provenance schema (this doc consolidates to 10)
- [Doc 581 - Bonfire graph wipe + bot hygiene](../581-bonfire-graph-wipe-bot-hygiene/) - what NOT to claim about state
- [Doc 606 - Zaal second-brain operating system](../606-zaal-second-brain-system/) - daily rhythm
- [Doc 611 - ZOE autonomy v2](../../agents/611-zoe-autonomy-v2-inbox-bonfire-subagents/) - Phase 2 spec referencing this ontology
- Bonfire OpenAPI spec verified 2026-05-05 - `/agents/{agent_id}/stack/add` confirmed write endpoint
