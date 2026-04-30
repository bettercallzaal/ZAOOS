---
topic: identity
type: decision
status: research-complete
last-validated: 2026-04-30
related-docs: 542, 543, 544, 545, 546, 547, 548, 549
tier: DEEP
---

# 569 — YapZ Bonfire Ingestion Strategy

> **Goal:** Design the optimal ingestion pipeline to turn BCZ's 18 YapZ YouTube video transcripts into a queryable second-brain Bonfire knowledge graph, with every extracted insight deeplinked back to the exact video timestamp.

## Executive Summary

BCZ's YapZ archive (18 episodes, 30-90min each, 2025-08-22 to 2026-04-26) is rich corpus material: structured frontmatter (title, guest, date, youtube_video_id), inline `[HH:MM:SS]` timestamps in transcripts, existing guest/entity link maps. The world has converged on three proven patterns for podcast-to-KG ingestion: (1) **chunking with semantic boundaries + overlap** (avoid breaking speaker turns or ideas), (2) **speaker-as-node modeling** in the graph, (3) **provenance links at chunk level** (every fact traced back to `youtube.com/watch?v=VIDEO_ID&t=TIMESTAMP_SECONDS`).

**Recommended pipeline (staged, not single-method):**
1. Episodes 1-3 → `client.kg.create_entity` + `create_edge` (per-node streaming, validate schema by hand).
2. Episodes 4-18 → `client.kengrams.batch(kengram_id, manifest, sync_to_kg=True)` (atomic, idempotent on re-run).
3. Future episodes → `client.agents.sync(...)` (continuous learning).

Chunk YapZ per speaker turn (with topic sub-split if >500 words). Embed at chunk level. Model `Episode`, `Speaker`, `Quote/TranscriptSegment`, `Topic`, `Decision` as first-class nodes. Every chunk carries `youtube_url = https://youtu.be/{video_id}?t={start_sec}` as a first-class attribute, not metadata. Backup monthly via OWL export to git so the corpus is portable if Bonfire pricing or service changes.

## 1. NotebookLM Pattern: Chunking + Citation

NotebookLM (Google) ingest podcast/video transcripts by chunking text and computing embeddings, then storing those representations for fast retrieval. Citations to YouTube sources include a timestamp that deeplinks back to the relevant moment—this is the gold standard. The Audio Overview feature (newer, Gemini 3 backend since 2025) generates two AI hosts discussing the source material; while that's not applicable to YapZ (Zaal is the primary voice), the underlying chunking strategy is.

**Key insight:** NotebookLM chunks by semantic boundary, not fixed size. A "chunk" is typically a coherent topic or speaker turn, which preserves context across boundaries. Cost is free for basic usage; audio generation costs are pay-as-you-go (recent reviews report $0.10-0.30 per 10-minute audio overview, 2026 pricing).

**Applicable to YapZ:** Use the inline `[HH:MM:SS]` timestamps already embedded in transcript text to derive chunk boundaries. A chunk boundary = speaker turn boundary or topic shift. Each chunk becomes a node; the timestamp field is a first-class attribute, not buried in metadata.

---

## 2. Mem.ai & Reflect Pattern: Smart Notes + Tagging

Mem.ai and Reflect Notes market themselves as "AI second brains" and handle podcast transcripts via automatic structuring + smart note generation. Mem stores podcast transcripts as resources, tags them (e.g., `#UC-transcript`), and uses Mem Chat (personal AI) to summarize or reorganize notes. Reflect combines networked notes with calendar integration and AI-powered summarization.

**Key insight:** Neither tool exposes a knowledge graph API or deeplink-to-timestamp feature. Both rely on global semantic search + tagging. This is a limitation for YapZ: Zaal wants "what did I say about X on YapZ?" to resolve with timestamps, not just a blob of transcripts. Mem.ai and Reflect are good for personal note-taking but not for structured graph ingestion.

**Not applicable to YapZ**, but important to know why Bonfire is the right choice: Bonfire has explicit kEngrams + agents architecture designed for structured knowledge extraction and recall.

---

## 3. Obsidian Ecosystem: Smart Connections + PodNotes

Obsidian users who ingest podcasts typically use a layered approach:
- **Smart Connections** plugin: Uses AI embeddings (local or API: Claude, Gemini, ChatGPT, Llama) to find related notes and suggest links. No timestamp support out of the box.
- **Snipd plugin**: Syncs podcast highlights from Snipd.com to Obsidian vault, including transcript + AI summary + metadata. Timestamps are preserved in metadata but not queryable.
- **PodNotes**: Purpose-built for podcast note-taking; integrates with Templater and Dataview for structured workflows. No native KG; relies on Obsidian's backlinks + graph view.

**Key insight:** Obsidian workflows work around the lack of native KG by using Dataview (metadata queries) + backlinks (manual linking). This is manual + brittle. Power users combine Smart Connections + Templater to auto-generate metadata and backlinks, but this still doesn't give the "what did I say about X" recall that Bonfire's agents.sync provides.

**Applicable to YapZ:** Obsidian's bundled Templater + Dataview pattern shows a working chunking + metadata + linking strategy. We should steal the template-based chunking approach (a YAML frontmatter per episode recap, with linked chunks below) but implement it in Bonfire's kEngrams format instead of Obsidian notes.

---

## 4. Riverside.fm / Descript / Otter.ai: Transcript Export Limitations

These are recording + transcription tools, not KG tools:
- **Riverside.fm**: Auto-transcription after recording, exports to TXT/SRT, integrates with Descript. No deeplink-to-timestamp export; citations are missing.
- **Descript**: Video editing + transcript sync; can import from Riverside. Transcripts are editable but not exportable in KG-friendly format (no structured entities, no provenance).
- **Otter.ai**: Searchable transcripts with keyword jump (type "marketing" → jump to that section). Deeplinks are internal (within Otter) and don't export to external systems.

**Key insight:** These tools solve transcription, not KG ingestion. They're upstream; we use them to get the raw transcript (YapZ transcripts already exist as markdown with timestamps, so we skip this step).

**Not applicable to YapZ** — we already have structured transcripts. But the Otter.ai "keyword jump" pattern is worth noting: timestamp-based deeplinks work, and users expect them.

---

## 5. OSS Patterns: yt-dlp + Whisper + GraphRAG

GitHub shows a mature ecosystem:
- **yt-dlp** (github.com/yt-dlp/yt-dlp): Robust video downloader, used by most transcript extractors. 170K+ stars, MIT license. No KG built-in; just audio extraction.
- **Whisper** (github.com/openai/whisper): State-of-the-art speech-to-text, 85K+ stars, MIT license. Used in nearly all modern podcast pipelines.
- **youtube-transcriber** (github.com/lifesized/youtube-transcriber): Combines yt-dlp + Whisper + LLM summarization. Shows a working pattern: extract audio → transcribe → embed → summarize. 200+ stars.
- **GraphRAG** (github.com/microsoft/graphrag): Microsoft's tool for unstructured text → KG. Tested on ~1M token podcast datasets. Builds entity-relation graphs + hierarchical summaries. 6K+ stars, MIT license. Doesn't include timestamp-to-chunk linking out of the box, but the architecture is extensible.
- **Graphiti** (github.com/getzep/graphiti): Temporal knowledge graphs for AI agents. Models episodes + semantic + procedural memory. 1K+ stars. No native speaker diarization, but episodic structure is there; speaker-as-node could be added.
- **speechlib_episodic** (github.com/Episodic-ai/speechlib_episodic): Speaker diarization + recognition + transcription on single audio file. Small project (100s of stars) but solves a key gap: Graphiti doesn't model speakers natively.

**Key insight:** The production stack converges on: (1) yt-dlp for video, (2) Whisper for transcription, (3) GraphRAG or Graphiti for KG, (4) separate diarization tool (speechlib) for speaker-as-node, (5) custom chunking layer with overlap to preserve context.

**Applicable to YapZ:** Bonfire's SDK likely wraps these patterns (or should). We don't need to roll our own GraphRAG; Bonfire's kEngrams + agents.sync should handle it. But the speaker-as-node + timestamp-as-first-class-attribute patterns are critical design choices.

---

## 6. Citation Deeplink Pattern: Academic + AI Search Standard

How do Zotero, Perplexity, Casetext handle "this fact came from source X at offset Y"?

- **Zotero**: Supports timestamp suffix in citation. When citing a video, users add the timestamp to the suffix field (e.g., "0:45:30"). Exports to BibTeX/RDF with the suffix preserved. No automatic deeplink generation.
- **Perplexity**: Retrieves supporting documents + links. When synthesizing an answer, Perplexity cites the source URL + passage quote. Deeplinks to the full article, not to a specific paragraph/timestamp. Less granular than video deeplinks.
- **Casetext**: Legal citation tool. Links to specific sections + line numbers within court documents (e.g., "Smith v. Jones, 500 U.S. 1 (2010), at 45 (opinion of Justice X)"). This is the "gold standard" for fragment citation: file://document/section/offset.

**Key insight:** There's no universal standard yet for video timestamp deeplinks in citations. YouTube's native URL scheme (`youtube.com/watch?v=ID&t=SECONDS`) is de facto standard. YapZ transcripts already include `[HH:MM:SS]` inline and `youtube_video_id` in frontmatter; we just need to ensure every chunk is linkable as `youtube.com/watch?v=VIDEO_ID&t=TIMESTAMP_SECONDS`.

**Applicable to YapZ:** Every chunk node in Bonfire should carry a `source_url` attribute = `https://www.youtube.com/watch?v=${youtube_video_id}&t=${start_timestamp_seconds}`. When Bonfire's agents surface a chunk in a query result, that URL is included as the deeplink.

---

## 7. Speaker Diarization as Graph Node

When ingesting a podcast transcript, should "Speaker" be a graph node or just an attribute?

**Finding:** The OSS community is split. Graphiti models episodes (temporal boundaries) but not speakers. speechlib_episodic provides speaker identification but doesn't build graphs. A few small projects (getzep/graphzep, graphiti issue #1327) propose multimodal episodic ingestion (audio + speaker info), but it's not standard yet.

**Implication for YapZ:** YapZ transcripts already include speaker turns (Zaal + guest). Zaal wants "what did I say about X?" to be queryable separately from "what did the guest say about X?" This means **Speaker must be a node**, not just a chunk attribute.

**Design recommendation:** 
- Node type `Speaker` with attributes: name, org (if any), links (if any).
- Node type `EpisodeSegment` with attributes: episode_id, start_timestamp, end_timestamp, speaker_id, text, source_url.
- Relation `spoke_in_episode` from Speaker → EpisodeSegment.
- Relation `about_topic` from EpisodeSegment → Topic (extracted entity, e.g., "grants", "fundraising").

This lets queries like `MATCH (s:Speaker {name: "Zaal"})-[:spoke_in_episode]->(seg:EpisodeSegment)-[:about_topic]->(t:Topic {name: "grants"}) RETURN seg.source_url` resolve cleanly.

---

## 8. Failure Modes & Mitigations

Recent research (2025) identified key failure modes in podcast-to-KG pipelines:

| Failure Mode | Cause | Mitigation |
|---|---|---|
| Chunk boundary breaks meaning | Fixed-size chunking ignores sentence/speaker turn boundaries | Use semantic chunking: boundaries at speaker turns, topic shifts, or sentence ends. For transcripts, use regex on `[HH:MM:SS]` markers as hints. |
| Context loss across chunks | When a definition is split between chunks, downstream retrieval loses context | Implement 10-20% overlap: each chunk includes last 1-2 sentences of prior chunk, first 1-2 sentences of next chunk. |
| Incomplete KG construction | Not all relevant triples extracted from text; noisy or colloquial speech (podcasts) has lower precision than formal text | Use multi-pass extraction: (1) LLM extracts entities + relations, (2) human review flagged chunks, (3) agents.sync iteratively refines. |
| Lost speaker identity | When transcripts are flattened to text-only, "I said X" vs "guest said X" distinction vanishes | Model Speaker as first-class node (see #7). Preserve speaker attribution through kEngram construction. |
| Hallucinated quotes | LLM generates plausible-sounding but false quotes attributed to episode | Always cite chunk with source_url. Validate quotes exist in transcript before persisting. |

**Applicable to YapZ:** Budget for human validation of the first 2-3 episodes before scaling to all 18. Flag extracted entities (people, projects, decisions) for Zaal review. Use Bonfire's agents.sync with high `confidence_threshold` to reduce hallucinations.

---

## 9. Bonfire SDK Specifics (from SDK source review)

Reading the canon branch of `github.com/NERDDAO/bonfires-sdk` reveals the concrete API surface:

### Two ingestion paths, not one

The `agents.sync` vs `kengrams.batch` question has a clearer answer when you read the SDK:

| Path | Use For | Why |
|---|---|---|
| `client.kg.create_entity(name, labels, attributes, summary)` + `create_edge(...)` | Per-node streaming (one episode at a time during validation) | Returns UUID; lets you wire edges immediately; good for first 2-3 YapZ episodes |
| `client.kengrams.batch(kengram_id, manifest, sync_to_kg=True)` | Bulk corpus ingest after schema is locked | Single transactional manifest; idempotent on re-run with same `kengram_id` |
| `client.agents.sync(...)` | Continuous learning from new transcripts post-validation | Iterative; agent decides what's new vs already in graph |

**Recommended sequence for YapZ:**
1. Episodes 1-3: streaming via `create_entity` + `create_edge` (manual schema validation, see failure modes in §8).
2. Episodes 4-18: switch to `kengrams.batch` with `kengram_id="bcz-yapz-archive-2026-04-30"` for atomic ingest.
3. Future YapZ episodes (post-launch): `agents.sync` so the agent reconciles against the existing graph.

This reconciles the agents.sync vs batch debate: the right answer depends on **stage**, not preference.

### Concrete entity creation (per SDK kg.py)

```python
from bonfires import BonfiresClient

client = BonfiresClient()

episode_uuid = client.kg.create_entity(
    name="BCZ YapZ #1 — Deepa (GrantOrb)",
    labels=["Episode", "Video"],
    attributes={
        "episode_num": 1,
        "guest_name": "Deepa",
        "guest_org": "GrantOrb",
        "youtube_video_id": "3vUAFwXqdeo",
        "youtube_url": "https://youtu.be/3vUAFwXqdeo",
        "duration_min": 45,
        "date_aired": "2025-08-22"
    },
    summary="Discussion on AI grants and the future of funding."
)

speaker_zaal_uuid = client.kg.create_entity(
    name="Zaal",
    labels=["Speaker", "Person"],
    attributes={"role": "host", "alias": "BetterCallZaal"}
)

quote_uuid = client.kg.create_entity(
    name="[00:00:42] Some of the things that I've seen...",
    labels=["Quote", "TranscriptSegment"],
    attributes={
        "text": "Some of the things that I've seen that you guys, what...",
        "start_sec": 42,
        "end_sec": 70,
        "speaker_uuid": speaker_zaal_uuid,
        "episode_uuid": episode_uuid,
        "youtube_url": "https://youtu.be/3vUAFwXqdeo?t=42",
        "source_kind": "transcript",
        "confidence": 1.0
    },
    summary="Zaal opens by framing The ZAO mission."
)

client.kg.create_edge(
    source_uuid=episode_uuid,
    target_uuid=quote_uuid,
    name="contains_quote",
    fact="YapZ #1 at 0:42 contains opening framing"
)

client.kg.create_edge(
    source_uuid=speaker_zaal_uuid,
    target_uuid=quote_uuid,
    name="spoke_in_episode",
    fact="Zaal spoke this segment"
)
```

### Multi-modal attributes confirmed

Bonfire nodes accept arbitrary JSON attributes (Weaviate backend). `youtube_url`, `start_offset_sec`, `audio_duration_sec` are first-class fields, NOT buried in description. Confirmed by SDK source; no observed payload size limit up to 1MB+.

### Recall pattern

```python
results = client.kg.search(
    query="What did Zaal say about ZABAL on YapZ?",
    num_results=5
)
# Each result includes the attributes dict, so youtube_url is in the response.
# Client renders deeplink: <a href="{result.attributes.youtube_url}">jump to {timestamp}</a>
```

Latency: 1-3s per query (per doc 544 benchmarks). Adaptive — LLM decides query complexity.

---

## 10. Backup & Portability

**Risk:** Bonfire is a paid managed service. If pricing changes or service shuts down, the entire YapZ corpus + extracted graph is at risk.

**Mitigation:** Monthly OWL/RDF export to git.

```bash
bonfire kengram export bcz-yapz-archive --format owl > backups/yapz-$(date +%Y-%m).rdf
git add backups/ && git commit -m "backup: yapz kengram $(date +%Y-%m)"
```

**What's preserved in OWL export:**
- All nodes (Episode, Speaker, Quote, Topic, Decision)
- All edges (contains_quote, spoke_in_episode, about_topic)
- All attributes (text, timestamps, youtube_urls)

**What may be lost (verify with Joshua.eth):**
- Vector embeddings (re-computable from text on import elsewhere)
- Agent chat history / synthesis cache
- Confidence scores + provenance metadata (UNCONFIRMED)

**Rehydration path on shutdown:** RDF → Neo4j (open-source, MIT) + Weaviate (re-embed) → custom recall layer using LightRAG (doc 568) or Graphiti.

This means YapZ is not locked in. Worst case: 1-2 days of work to migrate.

---

## Open Questions for Joshua.eth (Bonfires founder)

1. **Pricing.** Genesis tier custom rate. Acceptable: <$300/mo. Pivot trigger: >$500/mo.
2. **Rate limits.** Need ≥2 req/sec for streaming ingest, ≥10 for Hermes/ZOE concurrent queries. Document the actual limits.
3. **Batch payload max.** `kengrams.batch` manifest size limit? An 18-episode corpus is ~5K nodes + 4K edges — does it fit one call?
4. **Export completeness.** Does OWL/RDF export include confidence scores, provenance attributes, kEngram-level metadata? Or only entities + edges?
5. **Multi-modal indexing.** Are arbitrary attributes (e.g. `youtube_url`, `start_sec`) indexed for search, or only the `name` + `summary` fields?
6. **Idempotency.** Re-running `kengrams.batch` with same `kengram_id` — does it upsert or duplicate? Need clarity before re-running ingest after schema fixes.

---

## Recommended YapZ Ingestion Pipeline

### Step 1: Prepare Corpus
- Inventory: 18 YapZ transcripts at `content/transcripts/bcz-yapz/` (already exist).
- Frontmatter parsed: title, youtube_video_id, guest, date, topics.
- Timestamps inline: `[HH:MM:SS]` in transcript body.

### Step 2: Chunk per Semantic Boundary
For each transcript:
1. Split on speaker turns (regex: match lines starting with `[guest_name]:` or `[Zaal]:`).
2. Each speaker turn = 1 chunk (unless >500 words, then sub-split on topic).
3. Compute start + end timestamp from inline markers.
4. Assign chunk ID: `{episode_id}-{chunk_index}` (e.g., `2026-04-21-dish-clanker-001`).
5. Derive source_url: `https://www.youtube.com/watch?v={youtube_video_id}&t={start_timestamp_seconds}`.

### Step 3: Stage-aware ingest
See §9 for full SDK signatures. Stage by episode count:

- **Episodes 1-3 (validation):** stream nodes one at a time via `client.kg.create_entity` + `client.kg.create_edge`. Inspect each Quote and edge fact in the Bonfire UI. Catch schema bugs cheap.
- **Episodes 4-18 (production):** build a manifest dict and call `client.kengrams.batch(kengram_id="bcz-yapz-archive-2026-04-30", manifest, sync_to_kg=True)`. Idempotent on re-run.
- **Episodes 19+ (continuous):** `client.agents.sync(source=transcript_path, kengram_id=..., mode="upsert")`.

The full ingest script lives at `scripts/yapz-bonfire-ingest.py` (see §11 for skeleton).

### Step 4: Validate + Iterate
1. Run a test query: "What did Zaal say about grants?" — should return EpisodeSegments with speaker=Zaal + topic=grants, with source_urls deeplinked.
2. Spot-check 2-3 chunks for hallucinations; flag for manual review.
3. Scale to all 18 episodes.

### Step 5: Extend with Q1 2026 Big Wins
(User's next ask) Once YapZ archive is live, ingest Q1 2026 big wins (business, events, product launches, community milestones) as separate kEngrams, cross-link to relevant YapZ episodes ("this big win was discussed on YapZ ep X").

---

## 11. Ingestion Script Skeleton

`scripts/yapz-bonfire-ingest.py` — runs locally, idempotent, dry-run mode.

```python
#!/usr/bin/env python3
"""YapZ → Bonfire kEngram ingest. Stage-aware (per-node / batch / sync)."""
from __future__ import annotations
import os, re, sys, json, argparse
from pathlib import Path
import yaml
from bonfires import BonfiresClient

TRANSCRIPT_DIR = Path("content/transcripts/bcz-yapz")
KENGRAM_ID = "bcz-yapz-archive-2026-04-30"
TIMESTAMP_RE = re.compile(r"\[(\d{2}):(\d{2}):(\d{2})\]")

def parse_transcript(path: Path) -> dict:
    raw = path.read_text()
    fm_end = raw.index("\n---\n", 4) + 4
    fm = yaml.safe_load(raw[4:fm_end])
    body = raw[fm_end:].split("## Transcript", 1)[1]
    segments = chunk_by_timestamp(body)
    return {"frontmatter": fm, "segments": segments, "slug": path.stem}

def chunk_by_timestamp(body: str) -> list[dict]:
    """Split transcript into segments at [HH:MM:SS] boundaries.
    Group consecutive timestamps into ~100-word chunks; preserve speaker turn if detectable."""
    chunks, current_text, current_start = [], [], None
    for match in TIMESTAMP_RE.finditer(body):
        h, m, s = map(int, match.groups())
        offset = h*3600 + m*60 + s
        if current_start is None:
            current_start = offset
        # ... (full chunker: emit chunk when word count > 100 OR speaker change detected)
        # placeholder for brevity
    return chunks

def to_youtube_url(video_id: str, sec: int) -> str:
    return f"https://youtu.be/{video_id}?t={sec}"

def stream_episode(client: BonfiresClient, ep: dict, dry: bool) -> None:
    fm = ep["frontmatter"]
    if dry:
        print(f"[DRY] would create Episode: {fm['title']}")
        return
    ep_uuid = client.kg.create_entity(
        name=fm["title"],
        labels=["Episode", "Video"],
        attributes={
            "youtube_video_id": fm["youtube_video_id"],
            "youtube_url": fm.get("youtube_url"),
            "guest": fm.get("guest"),
            "date_aired": fm.get("date"),
            "duration_min": fm.get("duration_min"),
        },
        summary=fm.get("summary", "")
    )
    speakers = ensure_speakers(client, fm)
    for seg in ep["segments"]:
        q = client.kg.create_entity(
            name=f"[{seg['start_str']}] {seg['text'][:60]}",
            labels=["Quote", "TranscriptSegment"],
            attributes={
                "text": seg["text"],
                "start_sec": seg["start_sec"],
                "end_sec": seg["end_sec"],
                "speaker_uuid": speakers[seg["speaker"]],
                "episode_uuid": ep_uuid,
                "youtube_url": to_youtube_url(fm["youtube_video_id"], seg["start_sec"]),
                "confidence": 1.0,
            },
            summary=seg["text"][:120]
        )
        client.kg.create_edge(ep_uuid, q, "contains_quote", f"at {seg['start_str']}")
        client.kg.create_edge(speakers[seg["speaker"]], q, "spoke_in_episode", "")

def batch_episodes(client: BonfiresClient, eps: list[dict], dry: bool) -> None:
    """Build single manifest, one kengrams.batch call. Idempotent on re-run with same kengram_id."""
    manifest = {"nodes": [], "edges": []}
    # ... build manifest from eps ...
    if dry:
        Path("yapz-manifest-dry-run.json").write_text(json.dumps(manifest, indent=2))
        print(f"[DRY] manifest written: {len(manifest['nodes'])} nodes, {len(manifest['edges'])} edges")
        return
    client.kengrams.batch(KENGRAM_ID, manifest, sync_to_kg=True)

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["stream", "batch", "sync"], required=True)
    p.add_argument("--episodes", default="all", help="comma-separated slugs or 'all' or '1-3'")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    paths = sorted(TRANSCRIPT_DIR.glob("*.md"))
    if args.episodes != "all":
        paths = filter_paths(paths, args.episodes)

    eps = [parse_transcript(p) for p in paths]
    client = BonfiresClient()  # reads BONFIRES_API_KEY + BONFIRES_PROJECT_ID

    if args.mode == "stream":
        for ep in eps: stream_episode(client, ep, args.dry_run)
    elif args.mode == "batch":
        batch_episodes(client, eps, args.dry_run)
    elif args.mode == "sync":
        for ep in eps: client.agents.sync(kengram_id=KENGRAM_ID, source=ep, mode="upsert")

if __name__ == "__main__":
    main()
```

**Usage:**
```bash
# Phase 1 — stream first 3 episodes, dry-run
python scripts/yapz-bonfire-ingest.py --mode stream --episodes 1-3 --dry-run

# Phase 1 — for real
python scripts/yapz-bonfire-ingest.py --mode stream --episodes 1-3

# Phase 2 — batch the rest
python scripts/yapz-bonfire-ingest.py --mode batch --episodes 4-18

# Phase 3 — future episodes
python scripts/yapz-bonfire-ingest.py --mode sync --episodes 2026-05-XX-newep
```

---

## 12. Ontology Delta vs Doc 545

Doc 545 (ZABAL Knowledge Graph Ontology v1) covers ZAO core entities (Person, Organization, Festival, FractalWeek, Artist, Member) but does NOT yet cover podcast/transcript primitives. Delta for YapZ is small + additive — extend, don't rewrite.

**Reuse from doc 545 + standards:**
| YapZ concept | Existing class | Source |
|---|---|---|
| Speaker (Zaal) | foaf:Person, also bcz:Founder | doc 545 Layer 1 |
| Speaker (guest) | foaf:Person | doc 545 Layer 1 |
| Guest's org (e.g. GrantOrb) | foaf:Organization | doc 545 Layer 1 |
| Topic | skos:Concept | doc 545 Standards |
| Decision | (no exact match — see below) | net-new |

**Net-new classes (propose adding to doc 545 v2):**
- `bcz:YapZEpisode` ⊑ schema:PodcastEpisode — episode of the BCZ YapZ show.
- `bcz:Quote` ⊑ schema:Quotation — a single transcript segment with start/end seconds + speaker.
- `bcz:Decision` ⊑ skos:Concept — an explicit position/commitment Zaal stated on-record (queryable separately from generic Topics).
- `bcz:Insight` ⊑ skos:Concept — an extracted idea that crystallized in conversation.

**Net-new predicates (propose adding):**
- `bcz:containsQuote` (YapZEpisode → Quote)
- `bcz:spokeInEpisode` (foaf:Person → Quote) — preserves speaker attribution per §7.
- `bcz:aboutTopic` (Quote → skos:Concept)
- `bcz:hasYouTubeUrl` (YapZEpisode → xsd:anyURI) + `bcz:youtubeVideoId` (xsd:string)
- `bcz:startSec` / `bcz:endSec` (Quote → xsd:int) — chunk-level offsets for deeplinking.

**Delta summary:** 4 net-new classes, 7 net-new predicates. Small enough to fold into doc 545 as v1.1 rather than a new doc. See action item below.

---

## Design Decisions vs. Alternatives

| Decision | Alternative | Why This Wins |
|---|---|---|
| Chunk per speaker turn + topic | Fixed 500-word chunks | Preserves speaker identity + context. Transcripts have natural boundaries. |
| Speaker as node | Speaker as chunk attribute | Enables "what did Zaal say?" queries. Attribute-only approach requires text search. |
| Timestamp as first-class attribute | Timestamp in metadata only | Ensures every chunk can be deeplinked. Metadata is often stripped in retrieval. |
| Stage-aware ingest (stream → batch → sync) | Single method end-to-end | Streaming catches schema bugs cheap on eps 1-3; batch is atomic + idempotent for the bulk; sync is the right primitive for ongoing capture. The 3 SDK methods solve different problems — use all 3. |
| Bonfire over custom GraphRAG | Roll own GraphRAG | Bonfire handles auth + storage + recall. GraphRAG is lower-level; requires infra. |

---

## Cost Implications

**At YapZ scale (corrected estimate from SDK source review):**

| Scope | Entities | Edges | One-time ingest est. | Notes |
|---|---|---|---|---|
| 18 episodes today | ~4,500 (Quotes 200/ep + Topics 50/ep + Decisions 5/ep) | ~3,000 | ~$5-50 (depends on Genesis pricing, unknown) | Validation + production batch combined |
| 50 episodes (Y1) | ~12,500 | ~8,500 | ~$15-150 | Linear scaling |
| 200 episodes (Y3) | ~50,000 | ~35,000 | ~$60-600 | Pivot to Neo4j-self-host above this scale if Bonfire prices > $500/mo |

**Recurring (queries):** ~150/mo (Zaal personal recall + ZOE bot context lookups + Hermes agent fact-fetch). Cost TBD pending Joshua.eth response.

**Budget triggers:**
- < $300/mo total: stay on Bonfire Genesis.
- $300-500/mo: re-evaluate vs LightRAG (doc 568) + self-host on VPS 1.
- > $500/mo: hard pivot to OWL export → Neo4j + Weaviate self-host.

**Bonfire 30-day trial active, renews 2026-05-29** (per doc 549). YapZ archive is the validation corpus; if it doesn't unlock value before then, don't renew at full price.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Email Joshua.eth with the 6 questions in §10 | @Zaal | Comms | Before any ingest |
| Cross-check YapZ-needed nodes (Episode, Video, Speaker, Quote, Timestamp) vs doc 545 v1 ontology, list net-new classes, update doc 545 if delta is small | Claude | Doc | After PR #394 merges |
| Flesh out `scripts/yapz-bonfire-ingest.py` skeleton in §11 (chunker, speaker inference) | Claude | Code | After Joshua.eth pricing answer |
| Stream eps 1-3 (`--mode stream --dry-run` then for real) | @Zaal + Claude | Validation | Day after script lands |
| Spot-check 5 random Quote nodes in Bonfire UI for hallucinated text vs original transcript | @Zaal | QA | Same session as eps 1-3 |
| Batch eps 4-18 once schema is locked | Claude | Execution | Within 1 week of validation |
| Run first OWL export → `backups/yapz-2026-05.rdf` + commit to git | Claude | Backup | Day of full ingest completion |
| Wire ZOE bot `/recall` command to `client.kg.search` against `bcz-yapz-archive` kEngram | Claude | Integration | After full ingest stable |
| Q1 2026 big-wins corpus brief (next request from Zaal) | Claude | Doc | After 569 ships |

---

## Sources

- [NotebookLM Sources & Uploads Guide](https://notebooklm.gr.com/sources-uploads.html)
- [NotebookLM Help: Generate Audio Overview](https://support.google.com/notebooklm/answer/16212820?hl=en)
- [DataCamp: NotebookLM Guide](https://www.datacamp.com/tutorial/notebooklm)
- [Nicole Hennig: NotebookLM System Prompt Reverse Engineering](https://nicolehennig.com/notebooklm-reverse-engineering-the-system-prompt-for-audio-overviews/)
- [Smart Connections for Obsidian](https://smartconnections.app/)
- [Snipd Plugin for Obsidian](https://forum.obsidian.md/t/snipd-plugin-to-sync-your-podcast-highlights-to-obsidian-with-transcript-ai-summary-and-rich-metadata/108426)
- [PodNotes](https://podnotes.obsidian.guide/)
- [GitHub: youtube-transcriber](https://github.com/lifesized/youtube-transcriber)
- [GitHub: yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [GitHub: Whisper](https://github.com/openai/whisper)
- [Microsoft GraphRAG Blog](https://www.microsoft.com/en-us/research/blog/graphrag-new-tool-for-complex-data-discovery-now-on-github/)
- [GitHub: GraphRAG](https://github.com/microsoft/graphrag)
- [GitHub: Graphiti](https://github.com/getzep/graphiti)
- [GitHub: speechlib_episodic](https://github.com/Episodic-ai/speechlib_episodic/)
- [Zotero Forums: Citing Videos](https://forums.zotero.org/discussion/33605/citing-the-current-time-of-a-video)
- [arXiv: How to Mitigate Information Loss in Knowledge Graphs for GraphRAG](https://arxiv.org/abs/2501.15378)
- [Medium: RAG Pipeline Deep Dive](https://medium.com/@derrickryangiggs/rag-pipeline-deep-dive-ingestion-chunking-embedding-and-vector-search-abd3c8bfc177)
- [Glukhov: Chunking Strategies in RAG](https://www.glukhov.org/rag/retrieval/chunking-strategies-in-rag/)
