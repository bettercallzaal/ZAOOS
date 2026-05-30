---
topic: identity
type: guide
status: research-complete
last-validated: 2026-05-29
superseded-by:
related-docs: 665, 669, 542, 544, 569, 726, 754
original-query: "https://docs.fileverse.io/d/0200039b000d#k=REDACTED-fileverse-share-key"
tier: STANDARD
---

# 771 — Bonfires Procedural Memory Kernel (FCG): "Beyond Prompt Engineering"

> **Goal:** Decode the Bonfires team's May-2026 architecture essay "Beyond Prompt Engineering: Why Procedural Narrative [Extraction]" (Fileverse dDoc, end-to-end encrypted) and translate it into what changes for ZAO's Bonfire knowledge-graph integration. The essay announces a new Bonfires **memory kernel** that moves structural extraction OFF the LLM and onto a deterministic grammar pipeline.

> **Source is the primary artifact.** The Fileverse dDoc Zaal sent is the Bonfires team's own architecture essay, fetched FULL via headless browser (1838 words, 11 min read, "Built on Bonfires - May 2026"). This doc is the decode + ZAO-impact layer on top of it.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Treat the new kernel as the canonical direction for ZAO's Bonfire integration | YES | Bonfires is ZAO's locked-in KG/memory partner (Doc 601, 665, 669). A kernel rewrite changes what we ingest into and read out of zabal.bonfires.ai. Track it, don't re-architect ZAO's side yet. |
| Keep ZAO's Phase-1 subprocess-CLI ingest path unchanged for now | YES | The kernel change is internal to Bonfires extraction. ZAO posts natural-language episodes; the kernel decides how to structure them. No ZAO-side code change required to benefit. Doc 665/669 ingest path stands. |
| Re-frame ZAO episodes as "source material to compile", not "text to summarize" | YES | The kernel rewards typed, provenance-rich, recomposable input. Meeting recaps, decisions, captures with explicit who/what/when/why extract into cleaner artifacts (RoleBoundEventFrame, TemporalEdge, MentionCluster). The `/meeting` + `/bonfire` skills already write prose summaries - keep them structured. |
| Watch NERDDAO `trimtab` repo as the kernel's likely home | YES | `trimtab` is described in Doc 665/669 as "context-aware grammar generation with cascading embedding search" - that matches the FCG-kernel-as-retrieval-strategy thesis in this essay almost exactly. Likely where the construction library + retrieval composition lives. |
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
| The kernel likely lives in / relates to NERDDAO `trimtab` | Inference from Doc 665/669: `trimtab` = "context-aware grammar generation with cascading embedding search." Matches the essay's FCG-as-retrieval-kernel + cascading-embedding-search description. NOT confirmed by the essay itself. | PARTIAL - flagged |
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
| Confirm whether the FCG kernel ships in NERDDAO `trimtab` or a new repo; update Doc 665/669 repo map | @Zaal | Research follow-up | Next Ryan/Rskagy sync |
| Audit `/meeting` + `/bonfire` skill output: ensure episodes carry explicit actor/decision/timestamp/causal structure (compile-ready, not summary-blob) | @Zaal | Skill review | Next sprint |
| Decide if ZOE needs its own GLiNER/FCG layer or rides Bonfires' kernel entirely | @Zaal | Architecture decision | After kernel public |
| Note "Oral History of the World" bounded-remix pattern as a candidate ZAO content primitive (lore/recap/song provenance remix) | @Zaal | Idea capture | Backlog |
| Re-validate this doc when the kernel goes public (artifact schema, API surface may change) | @Zaal | Staleness | 2026-06-29 |

## Sources

- [Beyond Prompt Engineering: Why Procedural Narrative (Extraction)](https://docs.fileverse.io/d/0200039b000d#k=REDACTED-fileverse-share-key) - Bonfires team, May 2026. `[FULL]` - fetched complete via gstack headless browser (Fileverse E2E-encrypted dDoc; WebFetch/exa stripped the `#k=` decryption fragment, headless browser with full key URL rendered + decrypted client-side). 1838 words. NOTE: the `#k=` decryption key was redacted from this doc (2026-05-30) because ZAOOS is a public repo - Zaal holds the live share link.
- [Fluid Construction Grammar (fcg-net.org)](https://fcg-net.org/) + [Basics of FCG](https://fcg-net.org/demos/basics-of-fcg/) - `[FULL]` - FCG home + worked comprehension/formulation examples (transitive/ditransitive constructions, feature-value unification).
- [FCG Syntax and Semantics - Babel Wiki](https://emergent-languages.org/wiki/docs/recipes/fcg/syntax-and-semantics/) + [Getting Started](https://emergent-languages.org/wiki/docs/recipes/fcg/getting-started/) - `[FULL]` - transient structures, `def-fcg-cxn` macro, predicate-calculus meaning representation, meta-layer learning.
- [urchade/GLiNER (GitHub)](https://github.com/urchade/gliner) - `[FULL]` - zero-shot generalist NER, CPU-optimized, joint entity+relation extraction.
- [GLiNER paper (NAACL 2024)](https://aclanthology.org/anthology-files/pdf/naacl/2024.naacl-long.300.pdf) - `[FULL]` - Zaratiana et al., bidirectional-encoder Open NER, ~50M smallest model, beats ChatGPT zero-shot on OOD benchmark.
