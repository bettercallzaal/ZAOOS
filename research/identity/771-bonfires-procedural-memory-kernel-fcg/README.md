---
topic: identity
type: guide
status: research-complete
last-validated: 2026-05-30
superseded-by:
related-docs: 665, 669, 542, 544, 546, 569, 726, 754
original-query: "https://docs.fileverse.io/d/0200039b000d#k=vK13_Bm1s7JDW5bqpxtIuVMgp87ySuynflgRAe9I-SY"
tier: STANDARD
---

# 771 — Bonfires Procedural Memory Kernel (FCG): "Beyond Prompt Engineering"

> **Goal:** Decode the Bonfires team's May-2026 architecture essay "Beyond Prompt Engineering: Why Procedural Narrative [Extraction]" (Fileverse dDoc, end-to-end encrypted) and translate it into what changes for ZAO's Bonfire knowledge-graph integration. The essay announces a new Bonfires **memory kernel** that moves structural extraction OFF the LLM and onto a deterministic grammar pipeline.

> **Source is the primary artifact.** The Fileverse dDoc Zaal sent is the Bonfires team's own architecture essay, fetched FULL via headless browser (1838 words, 11 min read, "Built on Bonfires - May 2026"). This doc is the decode + ZAO-impact layer on top of it.

> **Correction note (2026-05-30):** The first merged cut (PR #731) inferred that NERDDAO `trimtab` was the kernel's likely home. A DEEP cross-ref pass (4-agent fan-out over ~50 NERDDAO repos + the public Graphiti fork + the competitive landscape) **refuted that**. `trimtab` is Tracery + n-gram + HDBSCAN, NOT FCG; the FCG kernel is proprietary/unreleased. Those corrections are now folded into the Key Decisions, Findings, and Next Actions below.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Treat the new kernel as the canonical direction for ZAO's Bonfire integration | YES | Bonfires is ZAO's locked-in KG/memory partner (Doc 601, 665, 669). A kernel rewrite changes what we ingest into and read out of zabal.bonfires.ai. Track it, don't re-architect ZAO's side yet. |
| Keep ZAO's Phase-1 subprocess-CLI ingest path unchanged for now | YES | The kernel change is internal to Bonfires extraction. ZAO posts natural-language episodes; the kernel decides how to structure them. No ZAO-side code change required to benefit. Doc 665/669 ingest path stands. |
| Re-frame ZAO episodes as "source material to compile", not "text to summarize" | YES | The kernel rewards typed, provenance-rich, recomposable input. Meeting recaps, decisions, captures with explicit who/what/when/why extract into cleaner artifacts (RoleBoundEventFrame, TemporalEdge, MentionCluster). The `/meeting` + `/bonfire` skills already write prose summaries - keep them structured. |
| The FCG kernel is proprietary / not in any public NERDDAO repo - do NOT chase `trimtab` | CORRECTED 2026-05-30 | DEEP cross-ref of ~50 NERDDAO repos found ZERO public FCG/GLiNER/typed-artifact code. `trimtab` is NOT the kernel: it is Tracery-style grammar gen + n-gram extraction + HDBSCAN clustering + a `real-ladybug` vector store (~156KB Python, updated 2026-04-22; verified via `gh repo view` + code search). The only public GLiNER footprint is `NERDDAO/graphiti` (a fork of getzep/graphiti, Apache 2.0), so Bonfires likely extends Graphiti as the substrate. Treat the essay as a roadmap/architecture statement, not shipped code. |
| Expect "Oral History of the World" as the kernel's public stress-test product | YES | Essay names it: wallet-gated, story + map-pin submission, audio transcription, artifact extraction, bounded remix, directed influence graph. A folklore corpus. ZAO has an adjacent surface pattern (wallet-gated contribution + remix) worth noting. |
| Adopt the procedural-vs-generative split as a ZOE memory principle | INVESTIGATE | ZOE's own memory (Letta 4-block + Bonfires) could borrow the separation: deterministic structure for durable recall, LLM only for expressive output. Open question whether ZOE needs its own GLiNER/FCG layer or just rides Bonfires'. |

## What The Essay Actually Says (decoded)

### The thesis in one line

> Extraction should be **procedural, deterministic, and traceable**. Generation can stay LLM-assisted, expressive, and graph-bounded. Separate the two.

### The problem with the old (LLM-based) extraction

Bonfires' previous stack did episodic extraction with LLM calls. It worked but had three structural failures:

1. **Unstable structure** - every extraction pass is a fresh inference. Different prompt / model version / decoding path / schema revision yields a different graph from the same text. Differences compound across a corpus until the graph is untrustworthy.
2. **Shallow provenance** - you can cite the source document, but not the exact extraction rule or grammatical construction that produced a given artifact.
3. **Recurring cost** - every retry, schema update, model migration, or re-index risks another full round of inference across the corpus. "Infrastructure debt" at archive scale.

The fix is explicitly NOT "prompt harder." It is to move the structural layer from stochastic generation to a procedural system that can be versioned, audited, reused.

### The new kernel - layered procedural pipeline

The essay describes a bottom-up stack, each layer fixing the one below:

| Layer | Tool / technique | Job |
|---|---|---|
| 1. Corpus signal | **n-grams** + discriminative set (embeddings furthest from corpus centroid) | Cheap repetition + outlier detection. Outliers = specialized concepts, unusual framings. |
| 2. Semantic buckets | **Taxonomy generation** | Turn raw context into coarse-but-structured buckets = a provisional ontology. Each bucket gets its own local n-grams. |
| 3. Span routing | **GLiNER** | Classify open-ended spans against the generated taxonomy WITHOUT freezing the schema early. Bridge between open language and structured graph. |
| 4. Surface grammar | **spaCy** (POS, dependencies, noun chunks) + **WordNet** (categorical expansion) | Route language types (definitions, comparisons, causal claims, entity relations, temporal sequences, attribution) through distinct retrieval paths. "Grammar becomes a control surface." |
| 5. Formal construction system | **Fluid Construction Grammar (FCG)** | Grammar as a network of composable constructions (form-meaning bridges with typed slots). The kernel. |

### How extraction works once the kernel is in place

A deterministic 4-step pipeline:

1. **FCG comprehension** parses text against a construction library (transitive clauses, verb phrases, temporal relations, discourse cues). These are formal patterns with typed slots, NOT prompts.
2. **Artifact emission** converts matched constructions into typed objects: `RoleBoundEventFrame`, `TemporalEdge`, `MentionCluster`, `SetIntersection`, `DiscourseRelation`.
3. **Construction trace** - every artifact records the exact grammatical pattern that produced it. A "compiler-like proof of extraction", not a post-hoc probabilistic explanation.
4. **Scoring + attribution** preserve provenance at the artifact level (source story, contributor, location, timestamp, construction trace).

The key property: **given the same text, construction library, parser version, and artifact schema, the kernel emits the same artifacts every time.** Determinism within a versioned environment.

### What it unlocks (3 things LLM-only can't reliably do)

1. **Bounded generation** - typed artifacts with known slots constrain the narrative. Example from the essay:
   ```
   RoleBoundEventFrame(trickster, steals, crown)
   TemporalEdge(after=dusk)
   MentionCluster(king)
   ```
   An LLM still writes the prose, but the graph constrains roles, temporal order, and source lineage. Style/voice/scene texture vary; the facts don't drift.
2. **Artifact-level provenance** - attribution moves from document level to narrative-unit level.
3. **Durable corpus economics** - once extracted, the graph is a reusable asset. New models generate from it, search it, remix it - no need to re-discover the grammar. Also becomes clean, schema-enforced, attributable training data.

### The product: Oral History of the World

The kernel's stress test. A "planetary folklore survey":

- Loop: connect wallet -> tell a story -> drop a pin on a map -> submit.
- System transcribes audio, extracts grammatical artifacts, absorbs structure into the graph.
- Explore by map, motif, character, place, or natural-language query.
- Select artifact bundles -> generate a bounded remix -> attribute sources -> submit back into the corpus.
- Over time a **directed influence graph** emerges (Story A's trickster appears in Remix Z; a flood myth shares structure with a migration story across regions).

## Findings

| Claim in essay | Verification | Status |
|---|---|---|
| Fluid Construction Grammar is a real formalism | Verified - fcg-net.org + VUB AI lab (Luc Steels lineage), Babel framework, Lisp-based, `def-fcg-cxn` macro, comprehension/formulation via construction application. Constructions = form+meaning feature structures with typed slots and variable unification. | FULL |
| GLiNER does zero-shot span classification against arbitrary labels | Verified - urchade/GLiNER, NAACL 2024 (Zaratiana et al.), bidirectional encoder (BERT/DeBERTa-v3), treats Open NER as matching entity-type embeddings to span embeddings. Smallest model ~50M params, runs on CPU, beats ChatGPT zero-shot on OOD benchmark, supports joint entity+relation extraction. | FULL |
| spaCy + WordNet for surface grammar + categorical expansion | Well-established NLP tooling; no verification needed. spaCy = production dependency parser; WordNet = lexical database. | FULL (background) |
| The kernel lives in NERDDAO `trimtab` | REFUTED 2026-05-30 (DEEP pass): `trimtab` is Tracery + n-gram + HDBSCAN + a `real-ladybug` vector store (verified via `gh repo view` + code search), NOT FCG. Zero hits for GLiNER / fluid construction grammar / RoleBoundEventFrame / TemporalEdge / MentionCluster across ~50 NERDDAO repos. The FCG kernel is proprietary / unreleased. | CORRECTED |
| The only public GLiNER usage is `NERDDAO/graphiti` | Verified - a fork of getzep/graphiti (Apache 2.0, arXiv 2501.13956) carrying `examples/gliner2/gliner2_neo4j.py` (GLiNER2 by Fastino + Gemini edge extraction + Neo4j bi-temporal `valid_at`/`invalid_at`). Likely the substrate Bonfires extends. | FULL |
| Deterministic extraction is a real 2024-26 trend | Verified - LazyGraphRAG, FastGraphRAG, GraphRAG-V all moved off per-chunk LLM extraction (75-700x cost cuts). What is NOVEL to Bonfires is a *learnable* FCG kernel (vs fixed spaCy noun-phrase rules) - no other commercial agent-memory vendor does this. Closest OSS analog = DerwenAI/Strwythura (spaCy -> GLiNER -> TextRank). Academic grounding: Beuls & Van Eecke 2025. | FULL |
| Old (pre-kernel) Bonfires arch = Weaviate + Graphiti/Neo4j + MongoDB + ~20-min LLM batch extraction | Verified via Doc 546, which logged the motivating symptom: entity fragmentation ("zabal" vs "ZABAL" vs "zabal-coin") at 88K nodes / 7 days (ETHBoulder). The kernel exists to fix exactly that instability. | FULL |
| Essay is genuinely from Bonfires team, May 2026 | Footer "Built on Bonfires - May 2026"; hosted on Fileverse with E2E-encryption key Zaal holds; aligns with Ryan Kagy / NERDDAO public direction (Docs 648, 669, 682). | FULL |

### Why this matters to ZAO specifically

- ZAO posts to `zabal.bonfires.ai` via natural-language episodes (`/meeting`, `/bonfire`, meeting-bridge on VPS - Docs 717, 754). The kernel change is **server-side inside Bonfires** - ZAO benefits automatically without code change, BUT input quality matters more now.
- Structured prose wins. A meeting recap with explicit actors, decisions, timestamps, and causal links extracts into cleaner typed artifacts than a wall of summary text. ZAO's recap skills already lean this way - keep them disciplined.
- Provenance + determinism reduce ZAO's vendor-lock fear: a versioned, traceable, exportable graph (kEngram export to Canvas/OWL/Markdown per Doc 669) is safer than an opaque LLM-rebuilt one.
- The "bounded remix" + directed-influence-graph pattern is a candidate primitive for ZAO content (e.g. remixing community lore, event recaps, song provenance) once the kernel ships publicly.

## Codebase Touchpoints

| Path | Relevance |
|---|---|
| `bot/src/zoe/memory.ts` | ZOE's memory layer - candidate to consume kernel-structured artifacts; today writes/reads via Bonfires + Letta blocks. |
| `bot/src/zoe/recall.ts` | ZOE recall path - reads from the graph; benefits from cleaner artifact structure. |
| `bot/src/zoe/index.ts`, `types.ts` | Bonfire wiring + types. No change needed for kernel adoption (server-side). |
| `bot/.env.example` | Bonfire API key config (key migration landed 2026-05-24, Doc 754). |

## Also See

- [Doc 665](../../agents/665-bonfires-deep-dive-zao-integration/) - Bonfires architecture deep dive + 6 ZAO integration vectors + `trimtab`/kEngram detail
- [Doc 669](../../agents/669-bonfires-everything-we-know/) - canonical Bonfires landscape, NERDDAO repo map, $KNOW economy
- [Doc 542](../542-bonfires-ai-knowledge-graph-bcz-strategies/) - knowledge-graph entry point
- [Doc 544](../544-bonfires-sdk-zao-wiring/) - SDK wiring
- [Doc 569](../569-yapz-bonfire-ingestion-strategy/) - ingestion strategy
- [Doc 726](../726-bonfires-teaching-another-bot/) - teaching another bot via the graph
- [Doc 754](../../agents/754-meeting-bonfire-bridge-config-gap/) - meeting->Bonfire bridge config + key migration

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm where the FCG kernel actually runs (proprietary backend vs unreleased repo) + whether a structured-episode intake endpoint is planned; ask Ryan/Rskagy directly. NOT `trimtab` (refuted). Update Doc 665/669 repo map | @Zaal | Research follow-up | Next Ryan/Rskagy sync |
| Read `NERDDAO/graphiti` `examples/gliner2/gliner2_neo4j.py` + `bonfires-sdk` `canon` branch in full - the only public substrate matching the essay | Claude/@Zaal | Research follow-up | Backlog |
| Audit `/meeting` + `/bonfire` skill output: ensure episodes carry explicit actor/decision/timestamp/causal structure (compile-ready, not summary-blob) | @Zaal | Skill review | Next sprint |
| Decide if ZOE needs its own GLiNER/FCG layer or rides Bonfires' kernel entirely | @Zaal | Architecture decision | After kernel public |
| Note "Oral History of the World" bounded-remix pattern as a candidate ZAO content primitive (lore/recap/song provenance remix) | @Zaal | Idea capture | Backlog |
| Re-validate this doc when the kernel goes public (artifact schema, API surface may change) | @Zaal | Staleness | 2026-06-29 |

## Sources

- [Beyond Prompt Engineering: Why Procedural Narrative (Extraction)](https://docs.fileverse.io/d/0200039b000d#k=vK13_Bm1s7JDW5bqpxtIuVMgp87ySuynflgRAe9I-SY) - Bonfires team, May 2026. `[FULL]` - fetched complete via gstack headless browser (Fileverse E2E-encrypted dDoc; WebFetch/exa stripped the `#k=` decryption fragment, headless browser with full key URL rendered + decrypted client-side). 1838 words.
- [Fluid Construction Grammar (fcg-net.org)](https://fcg-net.org/) + [Basics of FCG](https://fcg-net.org/demos/basics-of-fcg/) - `[FULL]` - FCG home + worked comprehension/formulation examples (transitive/ditransitive constructions, feature-value unification).
- [FCG Syntax and Semantics - Babel Wiki](https://emergent-languages.org/wiki/docs/recipes/fcg/syntax-and-semantics/) + [Getting Started](https://emergent-languages.org/wiki/docs/recipes/fcg/getting-started/) - `[FULL]` - transient structures, `def-fcg-cxn` macro, predicate-calculus meaning representation, meta-layer learning.
- [urchade/GLiNER (GitHub)](https://github.com/urchade/gliner) - `[FULL]` - zero-shot generalist NER, CPU-optimized, joint entity+relation extraction.
- [GLiNER paper (NAACL 2024)](https://aclanthology.org/anthology-files/pdf/naacl/2024.naacl-long.300.pdf) - `[FULL]` - Zaratiana et al., bidirectional-encoder Open NER, ~50M smallest model, beats ChatGPT zero-shot on OOD benchmark.
- [NERDDAO/trimtab (GitHub)](https://github.com/NERDDAO/trimtab) - `[FULL]` - DEEP-pass verification (`gh repo view` + code search): Tracery grammar gen + n-gram + HDBSCAN + `real-ladybug` vector store, ~156KB Python, updated 2026-04-22. NOT the FCG kernel - refutes the v1 inference.
- [NERDDAO/graphiti (GitHub)](https://github.com/NERDDAO/graphiti) - `[FULL]` - fork of [getzep/graphiti](https://github.com/getzep/graphiti) (Apache 2.0, arXiv 2501.13956); `examples/gliner2/gliner2_neo4j.py` = GLiNER2 + Gemini + Neo4j bi-temporal. Only public GLiNER footprint across ~50 NERDDAO repos.
- Beuls & Van Eecke 2025 (CxGs-NLP 2025 workshop) - academic grounding for the learnable-FCG novelty claim. `[PARTIAL - surfaced by the DEEP competitive-landscape pass; not independently re-fetched this session, no canonical URL verified - confirm before citing externally]`.
