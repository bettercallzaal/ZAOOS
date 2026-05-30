---
topic: identity
type: guide
status: research-complete
last-validated: 2026-05-29
superseded-by:
related-docs: 665, 669, 542, 544, 546, 548, 569, 581, 620, 673, 726, 754
original-query: "https://docs.fileverse.io/d/0200039b000d#k=vK13_Bm1s7JDW5bqpxtIuVMgp87ySuynflgRAe9I-SY"
tier: DEEP
---

# 771 — Bonfires Procedural Memory Kernel (FCG): "Beyond Prompt Engineering"

> **Goal:** Decode the Bonfires team's May-2026 architecture essay ("Beyond Prompt Engineering: Why Procedural Narrative [Extraction]", Fileverse E2E-encrypted dDoc) and cross-reference it DEEP against (a) the full ZAO Bonfire research cluster, (b) the actual NERDDAO public code, (c) how ZOE wires Bonfire today, and (d) the competitive agent-memory-graph landscape. Output: what genuinely changes for ZAO, with the kernel claims verified against real repos instead of inferred.

> **Two top-line corrections to the v1 (STANDARD) cut of this doc, made after the DEEP pass:**
>
> 1. **`trimtab` is NOT the FCG kernel.** v1 inferred it was. The actual `NERDDAO/trimtab` repo is a **Tracery-style grammar + n-gram + HDBSCAN** embedded-memory system - no FCG, no GLiNER, no typed artifacts. The inference was wrong. Corrected below.
> 2. **The full FCG kernel is NOT public.** Zero hits across all ~50 NERDDAO repos for `GLiNER`, `fluid construction grammar`, `RoleBoundEventFrame`, `TemporalEdge`, etc. The only public GLiNER usage is inside **`NERDDAO/graphiti`** - a FORK of `getzep/graphiti` (Apache 2.0) carrying a `examples/gliner2/gliner2_neo4j.py` demo. The kernel described in the essay runs on Bonfires' closed backend. Treat the essay as a roadmap/architecture statement, not shipped open code.

> **Source is the primary artifact.** The Fileverse dDoc Zaal sent is the Bonfires team's own essay, fetched FULL via headless browser (1838 words, "Built on Bonfires - May 2026"). This doc decodes it and grounds every claim against code + the competitive field.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Treat the new kernel as the canonical DIRECTION for ZAO's Bonfire integration | YES | Bonfires is ZAO's locked-in KG/memory partner (Docs 601, 665, 669). A kernel rewrite changes extraction quality/economics, not ZAO's ingest API. Track it; don't re-architect ZAO's side yet. |
| Keep ZAO's prose-episode ingest path unchanged | YES | ZOE posts natural-language prose to `POST /knowledge_graph/episode/create` (`bot/src/zoe/recall.ts:83`). The kernel is server-side; ZAO benefits automatically. No code change required. |
| **STOP citing `trimtab` as the kernel's home** | YES (correction) | `NERDDAO/trimtab` (Python, ~156KB, updated 2026-04-22) is Tracery grammars + n-gram extraction + HDBSCAN clustering + `real-ladybug` vector store. It is an embedded-memory toy, not the FCG kernel. Update Docs 665/669 repo notes too. |
| Re-frame ZAO episodes as "source material to compile", not "text to summarize" | YES | The kernel rewards typed, provenance-rich, recomposable input. The 15 extraction-discipline traits already in ZAO's Bonfire bot system prompt (Doc 581) directly improve procedural-kernel yield (clean titles, active-voice edges, dedupe-before-create, verbatim preservation). Keep them. |
| Run the Bonfires `/labeling/hybrid` pass so recall actually returns hits | YES, BLOCKER | ZOE's `searchVectorStore()` returns `count: 0` until an admin runs the gated `/labeling/hybrid` endpoint (`bot/src/zoe/recall.ts:12-13`). Until then every recall degrades to manual @zabal_bonfire relay. Ask Ryan/Rskagy to run it or expose it. This gates ALL automated read value, kernel or not. |
| Do NOT build ZOE's own GLiNER/FCG layer | YES, ride Bonfires | ZOE does zero structural extraction today (prose only). Building a parallel deterministic extractor in `bot/` duplicates Bonfires' core competency. Ride the backend kernel; only add a typed-artifact field to `remember()` IF/when Bonfires exposes a structured episode endpoint. |
| Position Bonfires' FCG+GLiNER kernel as genuinely novel in the landscape | YES | Deterministic-extraction is a real industry trend (LazyGraphRAG, FastGraphRAG, GraphRAG-V all moved off per-chunk LLM extraction for 75-700x cost cuts), BUT no other commercial agent-memory vendor operationalizes a LEARNABLE construction grammar (FCG) as the kernel. That is the differentiator, grounded in 2025-26 FCG-distributional academic work. |
| Note "Oral History of the World" bounded-remix pattern as a candidate ZAO primitive | YES, backlog | Wallet + story + map-pin + bounded remix + directed-influence graph. Adjacent to ZAO's wallet-gated contribution + remix patterns. Lore/recap/song-provenance remix candidate. |

## Part 1 — What The Essay Says (decoded)

### Thesis in one line

> Extraction should be **procedural, deterministic, traceable**. Generation stays LLM-assisted, expressive, graph-bounded. Separate the two.

### The problem with the OLD (LLM-based) extraction

Three structural failures (essay's framing):

1. **Unstable structure** - each extraction pass is a fresh inference. Different prompt/model/decoding/schema yields a different graph from the same text. Differences compound across a corpus until the graph is untrustworthy.
2. **Shallow provenance** - you can cite the source document, but not the exact extraction rule or grammatical construction that produced a given artifact.
3. **Recurring cost** - every retry, schema update, model migration, or re-index risks another full inference pass. "Infrastructure debt" at archive scale.

Fix is explicitly NOT "prompt harder" - it is to move the structural layer from stochastic generation to a procedural system that is versioned, audited, reused.

### The new kernel - layered procedural pipeline

| Layer | Tool / technique | Job |
|---|---|---|
| 1. Corpus signal | **n-grams** + discriminative set (embeddings furthest from corpus centroid) | Cheap repetition + outlier detection (specialized concepts, unusual framings). |
| 2. Semantic buckets | **Taxonomy generation** | Raw context -> coarse-but-structured buckets = provisional ontology. Each bucket gets local n-grams. |
| 3. Span routing | **GLiNER** (zero-shot NER) | Classify open-ended spans against the generated taxonomy WITHOUT freezing the schema early. |
| 4. Surface grammar | **spaCy** (POS, deps, noun chunks) + **WordNet** (categorical expansion) | Route language types (definitions, comparisons, causal claims, entity relations, temporal sequences, attribution) through distinct retrieval paths. "Grammar becomes a control surface." |
| 5. Formal construction system | **Fluid Construction Grammar (FCG)** | Grammar as a network of composable constructions (form-meaning bridges with typed slots). The kernel. |

### Deterministic 4-step extraction

1. **FCG comprehension** parses text against a construction library (transitive clauses, verb phrases, temporal relations, discourse cues) - formal patterns with typed slots, NOT prompts.
2. **Artifact emission** -> typed objects: `RoleBoundEventFrame`, `TemporalEdge`, `MentionCluster`, `SetIntersection`, `DiscourseRelation`.
3. **Construction trace** - each artifact records the exact grammatical pattern that produced it. A compiler-like proof of extraction, not a post-hoc probabilistic explanation.
4. **Scoring + attribution** preserve provenance at the artifact level (source story, contributor, location, timestamp, construction trace).

Key property: **same text + same construction library + same parser version + same artifact schema -> same artifacts every time.** Determinism within a versioned environment.

### What it unlocks

1. **Bounded generation** - typed artifacts constrain the narrative. Essay example:
   ```
   RoleBoundEventFrame(trickster, steals, crown)
   TemporalEdge(after=dusk)
   MentionCluster(king)
   ```
   LLM writes the prose; the graph holds roles, temporal order, lineage fixed.
2. **Artifact-level provenance** - attribution moves from document level to narrative-unit level.
3. **Durable corpus economics** - extract once, reuse forever. Becomes clean, schema-enforced, attributable training data.

### Product: Oral History of the World

Kernel stress test. Loop: connect wallet -> tell a story -> drop a map pin -> submit. System transcribes audio, extracts grammatical artifacts, absorbs structure. Explore by map/motif/character/place/NL query. Select artifact bundles -> bounded remix -> attribute sources -> resubmit. A **directed influence graph** emerges (Story A's trickster shows up in Remix Z; a flood myth shares structure with a migration story across regions).

## Part 2 — Grounding the claims against real code (NERDDAO org)

Inspected ~50 NERDDAO repos via `gh` + code search. Reality vs the essay:

| Repo | Updated | What it actually is | Kernel? |
|---|---|---|---|
| `NERDDAO/trimtab` | 2026-04-22 | Tracery-style grammar gen + n-gram extraction + HDBSCAN clustering + `real-ladybug` vector store. Python ~156KB. | NO - Tracery, not FCG. v1 inference corrected. |
| `NERDDAO/graphiti` | 2026-04-17 | **Fork of `getzep/graphiti`** (Apache 2.0, arXiv 2501.13956). Carries `examples/gliner2/gliner2_neo4j.py` - GLiNER2 (Fastino) NER + Gemini edge extraction + Neo4j, bi-temporal `valid_at`/`invalid_at`. | PARTIAL - the only public GLiNER usage, but it's Zep's code, not original NERDDAO. Likely the substrate Bonfires extends. |
| `NERDDAO/bonfires-sdk` | 2026-04-16 | Python CLI + SDK, default branch `canon`. Client to the closed backend. `chat`, `delve`, `kengram`, `ontology profile`. | NO - client only, backend proprietary. |
| `NERDDAO/bonfire-tools` | 2026-03-18 | `ingest.py` (pipe text/triplets/conversations), `server.py` (CORS proxy). | NO. |
| `NERDDAO/synthesis-frontend` | 2026-03-18 | Hyperblog/synthesis feed aggregator (HTML/JS). | NO. |
| `NERDDAO/obsidian-kengram` | 2026-03-17 | Obsidian plugin - canvas diff, graph export, sync queue (TS). | NO. |

**Zero hits, entire org**, for: `GLiNER` (outside the graphiti fork), `fluid construction grammar`, `RoleBoundEventFrame`, `TemporalEdge`, `MentionCluster`, `DiscourseRelation`, `SetIntersection`, `spacy`, `wordnet`, `construction trace`.

**Conclusion:** the FCG kernel + typed artifacts described in the essay are **proprietary / not-yet-public / research-stage**. The public footprint that matches the essay is (a) trimtab's n-gram + grammar + clustering layer (kernel layers 1-2 in spirit, different tech) and (b) the Graphiti-fork GLiNER2 NER demo (kernel layer 3). Layers 4-5 (spaCy/WordNet routing + FCG) are not in any public repo. Verify against backend when/if Ryan opens it.

### Old (pre-kernel) architecture, consolidated from the cluster

- **Ingest:** passive Telegram/Discord listeners + uploads (30+ connectors).
- **Processing:** ~20-min LLM batch extracts entities + relationships from buffered messages.
- **Stack:** Weaviate (vectors) + Graphiti/Neo4j (graph) + MongoDB (doc chunks). Free-form schema - LLM decides types on the fly.
- **kEngram:** content-addressed subgraph (SHA-256 + merkle root); types `session` (time-bounded) and `topic` (accrues). Export: canvas (Obsidian) / plan (Markdown) / owl (RDF) / json.
- **Known friction (Doc 546, ETHBoulder + Sanctuary):** 88K nodes / 7 days proved scale, but free-form schema fragments entities ("zabal" vs "ZABAL" vs "zabal-coin") - exactly the instability the new kernel attacks.

This is WHY the kernel exists: the 20-min LLM batch + free-form schema is the unstable/expensive/low-provenance system the essay critiques.

## Part 3 — How ZAO/ZOE wires Bonfire today (code reality)

All from `bot/src/zoe/` (cite file:line):

- **INGEST:** `remember()` (`recall.ts:83`) -> `POST {BONFIRE_API_URL}/knowledge_graph/episode/create`, Bearer `BONFIRE_API_KEY`, payload `{bonfire_id, name, episode_body, source:"text", source_description, reference_time}`, 15s timeout. Driven by `mirrorTurn()` (`recall.ts:219-293`), fire-and-forget after each concierge turn (`index.ts:615`). Captures/tasks/quests -> templated PROSE episodes named `zoe-capture:<ts>:<i>` etc.
- **Payload shape = prose. ZOE does ZERO structural extraction.** It dumps natural language; Bonfires' backend auto-labels. (`recall.ts` mirrorTurn templating.)
- **RECALL:** `recall()` (`recall.ts:187-207`) tries `searchVectorStore()` -> `POST /vector_store/search` `{bonfire_ref, search_string, limit}`, 10s timeout. **Returns `count: 0` until `/labeling/hybrid` is run** (`recall.ts:12-13`) -> falls back to `formatManualRelay()` (`recall.ts:170`): Zaal pastes `RECALL: <q>` to `@zabal_bonfire` DM and pastes the reply back.
- **Secret guard:** `containsSecret()` (`recall.ts:39-53`) blocks episodes containing keys/tokens before send.
- **Cross-bot relay:** `runBotRelayOps()` (`relay.ts:25-62`) sends `@zabal_bonfire_bot <msg>` into a group; fire-and-forget v1.
- **Env vars (names only):** `BONFIRE_API_KEY`, `BONFIRE_ID`, `BONFIRE_API_URL` (`bot/.env.example:11-13`), `BONFIRE_AGENT_ID` (`bot/AGENTS.md:117`, not yet used in code).

**Where a kernel artifact plugs in (if Bonfires exposes structured episodes):** inside `mirrorTurn()` episode-build loop (`recall.ts:226-283`), add an optional `kernel` field to the episode and a structured endpoint variant. But per Key Decisions, do NOT pre-build this - ride the prose path until the backend offers a typed intake.

## Part 4 — Competitive landscape (where this kernel sits)

| System | Extraction method | Provenance | Reproducible | Cost model |
|---|---|---|---|---|
| **GraphRAG** (Microsoft) | LLM entity+rel per chunk + Leiden communities + LLM summaries | entities/rels/communities | No (LLM variance) | $20-500+ per corpus indexing |
| **LazyGraphRAG** (MS, 2024) | NLP noun-phrase (spaCy/NLTK) at index; LLM deferred to query | concept graph | High (NLP core) | ~0.1% of GraphRAG index; ~700x cheaper queries |
| **FastGraphRAG** | NLP noun-phrase, no LLM descriptions | noun-phrase nodes + co-occurrence | High | ~75% cheaper than GraphRAG |
| **GraphRAG-V** (academic 2025) | none; community detection in embedding space | implicit | High | zero index-time LLM |
| **Zep / Graphiti** | LLM entity+rel, bi-temporal | temporal nodes (valid_at/invalid_at) | Partial | managed, query-time |
| **Mem0 (+graph)** | LLM (two-stage extractor->rel) | entities+edges | Partial | per-add extraction |
| **Letta (MemGPT)** | NONE (text memory blocks) | blocks + optional archival vectors | High (no extraction) | no extraction cost |
| **Strwythura** (DerwenAI, OSS) | spaCy -> GLiNER -> TextRank -> semantic walk, no LLM | lexical+semantic graph | High | local CPU, no LLM |
| **Bonfires (essay)** | FCG + GLiNER + spaCy/WordNet, typed artifacts + construction trace | artifact-level + construction trace | High (deterministic, versioned) | NLP core free; embeddings optional |

**Read:** deterministic extraction is NOT unique - it is a clear 2024-26 trend driven by GraphRAG's cost/instability. What IS unique to Bonfires is using a **learnable Fluid Construction Grammar** as the kernel (vs fixed spaCy noun-phrase rules). No other commercial agent-memory vendor does this. Academic grounding: FCG-distributional integration work (Beuls & Van Eecke 2025; CxGs-NLP 2025 workshop) argues "the future of construction grammar is neither symbolic nor numerical, but a combination of both" - Bonfires is the first to try operationalizing that for agent memory. The closest open analog is DerwenAI's Strwythura (spaCy->GLiNER, no FCG, no learnability).

**Community evidence the pain is real** (the thing Bonfires claims to fix):
- HN: "regardless how reliable llms are they will never be perfect, so graphrag will error when the RNG gods feel like ruining your day." (`news.ycombinator.com/item?id=40859530`)
- HN / KAG: "LLMs have a tendency to lose fidelity and consistency on edge naming... using LLM is not at all the right way [for KGs]." (`news.ycombinator.com/item?id=42545986`)
- Microsoft: "The bulk of the cost originates from entity extraction LLM calls per chunk... stop using LLMs during indexing entirely." (LazyGraphRAG)

## Findings

| Claim | Verification | Status |
|---|---|---|
| FCG is a real formalism | fcg-net.org + VUB AI lab (Steels), Babel/Lisp, `def-fcg-cxn`, comprehension/formulation by construction application, feature-structure unification | FULL |
| GLiNER does zero-shot span classification | urchade/GLiNER, NAACL 2024, BERT/DeBERTa-v3 encoder, ~50M smallest model, CPU, beats ChatGPT zero-shot on OOD. GLiNER2 (EMNLP 2025) adds multi-task + hierarchical extraction | FULL |
| `trimtab` is the kernel | FALSE - Tracery + n-gram + HDBSCAN, no FCG/GLiNER. v1 inference corrected | FULL (negative) |
| FCG kernel + typed artifacts are public code | FALSE - zero hits across ~50 NERDDAO repos; proprietary backend. Only public GLiNER = the `NERDDAO/graphiti` fork's gliner2 demo | FULL (negative) |
| Bonfires forked Graphiti | TRUE - `NERDDAO/graphiti` is a fork of `getzep/graphiti` (Apache 2.0) | FULL |
| Deterministic extraction is novel | PARTLY - it's a trend (LazyGraphRAG/FastGraphRAG/GraphRAG-V). FCG-as-learnable-kernel is the novel part | FULL |
| ZOE does structural extraction | FALSE - prose only; backend auto-labels (`recall.ts` mirrorTurn) | FULL |
| Recall works today | NO - `/vector_store/search` returns 0 until `/labeling/hybrid` runs; degrades to manual relay (`recall.ts:12-13`) | FULL |

## Also See

- [Doc 665](../../agents/665-bonfires-deep-dive-zao-integration/) - architecture deep dive, 6 integration vectors, kEngram CLI surface, episode-on-commit
- [Doc 669](../../agents/669-bonfires-everything-we-know/) - canonical landscape, NERDDAO repo map, $KNOW, positioning vs Mem0/Letta/Zep
- [Doc 544](../544-bonfires-sdk-zao-wiring/) - SDK capability matrix, `agent.sync()` + `kengram.batch()`, auth
- [Doc 546](../546-bonfires-real-world-deployments/) - ETHBoulder 88K-nodes/7-days, Sanctuary friction, schema fragmentation (the kernel's motivation)
- [Doc 548](../548-bonfire-first-week-context-teaching/) - extraction-discipline phrasing rules that improve kernel yield
- [Doc 581](../581-bonfire-graph-wipe-bot-hygiene/) - 15 production system-prompt traits enforcing extraction correctness
- [Doc 569](../569-yapz-bonfire-ingestion-strategy/) - stage-aware ingest (stream -> batch -> sync), speaker-as-node
- [Doc 620](../../agents/620-bonfire-push-everything/) - 9-step auto-ingest pipeline, dual-write, redact+dedup+audit
- [Doc 673](../../agents/673-zoe-bonfires-dialog-automation/) - ZOE Phase-2 bridge, 20-min auto-KG, `bonfire_query`/`bonfire_recent` tools, ~40% token savings via `graph_mode`
- [Doc 726](../726-bonfires-teaching-another-bot/) - `recall.ts` reference impl (recall/remember/mirrorTurn), REST surface
- [Doc 754](../../agents/754-meeting-bonfire-bridge-config-gap/) - key migration to `~/.zao/zao.env`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Correct `trimtab` notes in Docs 665 + 669 (it is Tracery/n-gram/HDBSCAN, NOT the FCG kernel) | @Zaal | Doc edit | This week |
| Ask Ryan/Rskagy to run / expose `/labeling/hybrid` so ZOE `searchVectorStore()` returns hits (unblocks ALL automated recall) | @Zaal | Partner ask | Next sync |
| Confirm where the FCG kernel actually lives (proprietary backend? unreleased repo?) + whether a structured-episode intake endpoint is planned | @Zaal | Research follow-up | Next Ryan sync |
| Audit `/meeting` + `/bonfire` + `mirrorTurn()` episode prose: enforce Doc 581's 15 extraction-discipline traits (clean titles, active-voice edges, dedupe, verbatim) to maximize procedural-kernel yield | @Zaal | Skill/code review | Next sprint |
| Decide: ride backend kernel only (recommended) vs add optional `kernel` field to `remember()` once a structured endpoint exists | @Zaal | Architecture | After backend opens |
| Capture "Oral History of the World" bounded-remix + directed-influence-graph as candidate ZAO content primitive | @Zaal | Idea | Backlog |
| Re-validate when kernel goes public (artifact schema + API may change) | @Zaal | Staleness | 2026-06-29 |

## Sources

### Primary
- [Beyond Prompt Engineering: Why Procedural Narrative (Extraction)](https://docs.fileverse.io/d/0200039b000d#k=vK13_Bm1s7JDW5bqpxtIuVMgp87ySuynflgRAe9I-SY) - Bonfires team, May 2026. `[FULL]` - fetched complete via gstack headless browser (Fileverse E2E-encrypted dDoc; WebFetch/exa strip the `#k=` decrypt fragment, headless browser with full key URL decrypts client-side). 1838 words.

### Code (NERDDAO org, via gh + code search)
- `NERDDAO/trimtab` (README + files) - `[FULL]` - Tracery + n-gram + HDBSCAN, NOT the kernel
- `NERDDAO/graphiti` `examples/gliner2/gliner2_neo4j.py` + README - `[FULL]` - fork of getzep/graphiti; GLiNER2 + Gemini + Neo4j bi-temporal
- `NERDDAO/bonfires-sdk` README (`canon` branch) - `[FULL]` - client CLI/SDK surface
- ZAO codebase `bot/src/zoe/recall.ts`, `relay.ts`, `index.ts`, `bot/.env.example`, `bot/AGENTS.md` - `[FULL]` - ZOE Bonfire ingest/recall reality

### Technology verification
- [Fluid Construction Grammar (fcg-net.org)](https://fcg-net.org/) + [Basics of FCG](https://fcg-net.org/demos/basics-of-fcg/) + [Babel wiki: Syntax/Semantics](https://emergent-languages.org/wiki/docs/recipes/fcg/syntax-and-semantics/) - `[FULL]`
- [urchade/GLiNER (GitHub)](https://github.com/urchade/gliner) + [GLiNER paper NAACL 2024](https://aclanthology.org/anthology-files/pdf/naacl/2024.naacl-long.300.pdf) + [GLiNER2 EMNLP 2025](https://aclanthology.org/2025.emnlp-demos.10.pdf) - `[FULL]`
- FCG-distributional integration: CxGs-NLP 2025 workshop ([1](https://aclanthology.org/2025.cxgsnlp-1.8.pdf), [2](https://aclanthology.org/2025.cxgsnlp-1.9.pdf)) - `[FULL]` - academic grounding for learnable construction grammar
- [Zep/Graphiti paper (arXiv 2501.13956)](https://arxiv.org/abs/2501.13956) + [getzep open source](https://www.getzep.com/product/open-source/) - `[FULL]`
- [DerwenAI/strwythura](https://github.com/DerwenAI/strwythura) - `[FULL]` - closest OSS analog (spaCy->GLiNER, no LLM)

### Competitive + community
- [Microsoft LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/) + [GraphRAG costs](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/graphrag-costs-explained-what-you-need-to-know/4207978) + [GraphRAG methods (FastGraphRAG)](https://microsoft.github.io/graphrag/index/methods/) - `[FULL]`
- [Mem0 graph memory](https://docs.mem0.ai/open-source/features/graph-memory) + [Mem0 paper (arXiv 2504.19413)](https://arxiv.org/html/2504.19413) - `[FULL]`
- [Letta memory blocks](https://docs.letta.com/guides/core-concepts/memory/memory-blocks/) - `[FULL]`
- HN: [LLM KG extraction reliability ("RNG gods")](https://news.ycombinator.com/item?id=40859530) + [KAG / edge-naming fidelity](https://news.ycombinator.com/item?id=42545986) + [Autoflow 6x cost](https://news.ycombinator.com/item?id=42210689) - `[FULL]` - community evidence of the LLM-extraction pain
- [Graphlit: LLM entity-extraction cost comparison](https://www.graphlit.com/blog/comparison-of-knowledge-graph-generation) - `[FULL]`
