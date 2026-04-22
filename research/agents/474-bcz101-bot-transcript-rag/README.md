# 474 - BCZ 101 Bot + Transcript RAG Best Practices

> **Status:** Research complete
> **Date:** 2026-04-22
> **Goal:** Blueprint a Farcaster-native BCZ 101 bot that answers questions about Better Call Zaal podcast episodes from a query-able `content/transcripts/` library. Fork the `atenger/gmfc101` architecture and port it to the ZAO OS stack (Next.js 16 + Supabase pgvector + Neynar).

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Reference architecture | USE `atenger/gmfc101` as blueprint - same problem (podcast RAG) + same bot surface (Farcaster via Neynar) + Apache 2.0 license + pushed 2026-04-22 (actively maintained, by warpee.eth) |
| Router pattern | USE 3-path LLM classifier (metadata / contextual / hybrid) - NOT naive "embed everything, retrieve N". GPT-5 routes the query, then the right path runs. Reduces latency + cost on simple queries. |
| Vector store | USE Supabase `pgvector` with HNSW index - `pinecone` is what gmfc101 uses but ZAO OS already runs Supabase. Skip the extra vendor. |
| Embedding model | USE OpenAI `text-embedding-3-small` (1536 dim, $0.02 / 1M tokens) - cheapest viable. Upgrade to `-large` (3072 dim) only if retrieval precision fails. |
| Chunking strategy | USE gmfc101 v2 strategy: ~350 tokens per chunk, ~15% overlap, pre-computed (no query-time expansion). 3x fewer retrievals than v1, same quality. |
| Generation model | USE Claude Opus 4.7 via Anthropic SDK (project already wired) with Minimax M2.7 fallback - mirrors `src/lib/fishbowlz/summarize.ts:19-40` pattern. |
| Transcript storage | USE `content/transcripts/<show>/YYYY-MM-DD-<guest>-<org>.md` (frontmatter + body) - git-versioned, grep-able, embeddable. No S3 needed until volume forces it. |
| Transcript format | USE Deepgram JSON for raw ingest (matches gmfc101 parser), then project into markdown+frontmatter for human review. Keep both. |
| Bot entry | USE Next.js route `src/app/api/bots/bcz101/webhook/route.ts` for Neynar webhook - matches existing ZAO OS route pattern (see `src/app/api/fishbowlz/transcribe/route.ts:1-50`). |
| Namespacing | USE `bots/bcz101/` under `src/app/api/` and `src/lib/` - leaves room for `bots/zoe101`, `bots/zao101`, etc. |
| Re-use | REUSE `src/lib/fishbowlz/summarize.ts` Minimax+Anthropic pattern for `core/respond_to_query`. Do NOT rewrite from scratch. |

---

## What gmfc101 actually does

`atenger/gmfc101` is an "AI assistant that answers questions based on podcast transcripts. Built for the GM Farcaster Network, it uses a retrieval-augmented generation (RAG) approach." Ships the exact bot that `@warpee.eth` runs on Farcaster. Apache 2.0.

### Repo anatomy (8 dirs, ~15 files)

```
gmfc101/
  api.py                           # Flask webhook entry (Neynar casts in)
  core/
    workflow_router.py             # LLM classifier: metadata | contextual | hybrid | ignore
    workflow_metadatapath.py       # Answer from show metadata only
    workflow_contextpath.py        # Pinecone semantic RAG across all episodes
    workflow_hybridpath.py         # Pull one full transcript when user names an episode
    respond_toquery.py             # Webhook handler, conversation history mgmt
    data_store.py                  # Abstract: local disk OR S3
    interaction_logger.py          # Analytics
    blacklist.py, blocked_keywords.py  # Safety filters
    utils.py
  scripts/
    download_transcripts.py        # One-shot S3 -> local sync
    update_transcripts.py          # Incremental
    check_transcripts.py           # Integrity
    test_cast_response.py          # Local test harness
  data/
    metadata.json                  # Episode listing (see schema below)
    transcripts/                   # Deepgram JSON per episode
    sample_transcripts/            # Dev fixtures
  prompts/                         # All LLM system prompts live here
  Procfile                         # Render deploy (gunicorn)
  requirements.txt                 # pinecone-client 5.0.1, openai 1.54.4, farcaster-py 0.1.6
```

### The 3-path router (the key idea to steal)

Most podcast RAG is "embed everything, retrieve top-k, stuff in prompt, generate." gmfc101 routes first because different query types need different retrieval:

```
User cast -> workflow_router (GPT-5 classifier)
                |
    +-----------+-----------+-----------+
    |           |           |           |
metadata    contextual    hybrid      ignore
    |           |           |           |
"who hosts" "what did X  "explain all  blocked
"how many   say about    of episode    words /
 episodes"  topic Y?"    200"          empty
    |           |           |
metadata.json  Pinecone    Full transcript
as context    semantic    JSON loaded
              search      whole
```

Classifier prompt lives in `prompts/workflow_prompts.ROUTING_PROMPT`. Returns one of 4 strings. `workflow_router.py:50-70` maps string -> path. On LLM timeout, falls back to `contextual` (safest default).

### Chunking: v1 vs v2

gmfc101 evolved its strategy:
- **v1 (original):** tiny chunks (1-3 sentences). At query time, expand ±15 sentences from match point. Lossy at boundaries, slower (file read per match).
- **v2 (current):** ~350-token passages with overlap, pre-chunked and embedded. Use directly, no expansion. Roughly 3x fewer retrievals needed for same recall.

`workflow_contextpath.py:130-145` shows the v2/v1 toggle still in code. V2 is the default going forward.

### Context assembly to LLM

Match results are formatted as XML-like blocks for the generator (`workflow_contextpath.py:156-180`):

```
<episode>
  <title>GM Farcaster, ep200</title>
  <metadata>
    Aired Date: 2025-01-10
    Hosts: NounishProf, adrienne, chaskin.eth
    Timestamp: 00:14:32
    YouTube: https://youtu.be/Us0kYDGLpug?t=872
    Companion blog: ...
  </metadata>
  <transcript>
    {chunk text, ~350 tokens}
  </transcript>
</episode>
```

Multiple `<episode>` blocks are concatenated and stuffed into the generator prompt. This formatting matters: gives the LLM enough structure to cite episode + timestamp in its answer (`?t=872` is the YouTube deep link).

### Metadata schema (`sample_metadata.json`)

```json
{
  "youtube_url": "https://youtu.be/Us0kYDGLpug",
  "episode": "ep200",
  "hosts": ["NounishProf", "adrienne", "chaskin.eth"],
  "series": "GM Farcaster",
  "companion_blog": "",
  "title": "GM Farcaster Ep200 Friday January 10, 2025",
  "aired_date": "2025-01-10",
  "transcript_path": "transcript_ep200.json"
}
```

Only 8 fields. `series` lets one bot answer across multiple shows ("GM Farcaster" + "The Hub" + "Farcaster 101" are all in the same index). For BCZ that means the same bot can later cover BCZ YapZ + a future BCZ cypher series, etc.

---

## Comparison of Options

### Vector store

| Option | Cost | Latency | ZAO OS fit | Verdict |
|--------|------|---------|-----------|---------|
| Pinecone Serverless | $0.15/GB/mo + $2/M reads | ~30ms | Adds vendor, already pay Supabase | SKIP |
| Supabase pgvector (HNSW) | Bundled in existing plan | ~50ms | Native, RLS works, no new key | **USE** |
| Weaviate Cloud | From $25/mo | ~40ms | Extra service | SKIP |
| Qdrant Cloud | From $0 free | ~25ms | Extra service | SKIP |

Supabase `pgvector` extension has shipped since 2023 and supports HNSW indexes (Postgres 15+). Every ZAO OS Supabase instance already has it - just `CREATE EXTENSION vector`.

### Embedding model

| Model | Dim | Price / 1M tokens | MTEB score | Verdict |
|-------|-----|-------------------|------------|---------|
| OpenAI text-embedding-3-small | 1536 | $0.02 | 62.3 | **USE** - cheapest viable |
| OpenAI text-embedding-3-large | 3072 | $0.13 | 64.6 | Upgrade only if small fails |
| Voyage voyage-3 | 1024 | $0.06 | 63.4 | Strong alt, extra vendor |
| Cohere embed-v3 | 1024 | $0.10 | 63.1 | Extra vendor |
| BGE-large (self-host) | 1024 | ~$0 (compute) | 64.2 | Skip - ops overhead |

### Chunking strategy

| Strategy | Chunk size | Overlap | Retrieval quality | Storage cost | Verdict |
|----------|-----------|---------|-------------------|--------------|---------|
| Sentence (gmfc101 v1) | 1-3 sent | 0 | Lossy boundaries, needs runtime expansion | Low | SKIP |
| Semantic (LangChain) | Variable | N/A | Good but slow to build | Medium | SKIP - over-engineered |
| Token-fixed (gmfc101 v2) | 350 tok | ~50 tok (15%) | Best recall/cost | Medium | **USE** |
| Sliding window (1000 tok) | 1000 tok | 200 tok | Higher cost, marginal quality gain | High | SKIP |

### Generator model

| Model | Cost /1M out tok | Latency | Quality | Verdict |
|-------|------------------|---------|---------|---------|
| Claude Opus 4.7 | $75 | 3-5s | SOTA | **USE (primary)** - project already imports `@anthropic-ai/sdk` |
| Claude Haiku 4.5 | $1.25 | 0.8s | Good enough | USE for routing classifier (replaces GPT-5 in gmfc101) |
| Minimax M2.7 | $0 (local pilot) | 2s | Solid | **USE (fallback)** - matches fishbowlz pattern |
| GPT-5 | ~$15 | 2s | SOTA | SKIP - project is Anthropic-first |
| GPT-5-mini | ~$1 | 1s | Good | SKIP |

---

## Transcript documentation schema (canonical)

Every episode in `content/transcripts/<show>/` MUST have these fields. Inheritable defaults per show in a `show.yaml` (future). This schema supersedes the one in `content/README.md` if they diverge.

### Required

| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| `title` | string | "BCZ YapZ w/Dish" | Display |
| `show` | string | "BCZ YapZ" | Series filter + namespace in vector index |
| `guest` | string | "Jack Dishman" | Entity extraction + citation |
| `date` | ISO date | 2026-04-22 | Chronological filter |
| `host` | string | "Zaal" | Multi-show host filter |
| `source.video` OR `source.audio` | string | relative path | Reproducibility |
| `summary` | string | one sentence | Generator context + newsletter draft |

### Retrieval-boosting (recommended)

| Field | Type | Purpose |
|-------|------|---------|
| `topics` | string[] | 3-8 tags | Faceted filter pre-embedding |
| `keywords` | string[] | Long-tail terms | Token-match boost alongside vector |
| `entities.orgs / people / projects` | string[] | Hybrid search + citation |
| `action_items` | string[] | Extract CTAs for newsletter/socials auto-draft |
| `guest_org` | string | Affiliation | Filter ("show me all FarmDrop eps") |
| `guest_links` | string[] | Socials | Citation surface |

### Optional

| Field | Notes |
|-------|-------|
| `episode` | Sequential number once we backfill |
| `duration_min` | Approx length |
| `language` | ISO 639-1 |
| `format` | video-podcast / audio / space / cypher |
| `status` | `raw` -> `cleaned` (human edited) -> `annotated` (entities extracted by LLM) |

### Body conventions

- Timestamp prefix per turn: `[00:14:32]` - lets chunker surface YouTube deep-links
- H2 separator `## Transcript` marks end of frontmatter + start of body
- No speaker labels in the current BCZ transcripts (Deepgram diarization off); add later if we re-run with diarization

---

## ZAO Ecosystem Integration

### File layout (proposed)

```
content/
  transcripts/
    bcz-yapz/
      2026-04-14-nikoline-hubs-network.md          # already shipped in this PR
      2026-04-22-dish-clanker.md                    # already shipped
      2026-04-22-hannah-farmdrop.md                 # already shipped

scripts/
  bots/
    bcz101-ingest.ts                                # walks content/transcripts/, chunks, embeds, upserts
    bcz101-backfill-entities.ts                     # LLM pass to enrich frontmatter

src/app/api/bots/bcz101/
  webhook/route.ts                                  # Neynar webhook (POST)
  health/route.ts                                   # liveness

src/lib/bots/bcz101/
  router.ts                                         # port of workflow_router.py
  paths/
    metadata.ts                                     # port of workflow_metadatapath.py
    contextual.ts                                   # port of workflow_contextpath.py (Supabase pgvector)
    hybrid.ts                                       # port of workflow_hybridpath.py
  respond.ts                                        # port of respond_toquery.py
  chunker.ts                                        # 350-token + overlap
  embedder.ts                                       # OpenAI text-embedding-3-small
  store.ts                                          # Supabase client for `bcz101_chunks` table
  safety.ts                                         # port of blacklist.py + blocked_keywords.py
  logger.ts                                         # interaction log (writes to `bcz101_interactions`)

scripts/
  004-create-bcz101-schema.sql                      # CREATE EXTENSION vector; CREATE TABLE bcz101_chunks...
```

### Supabase schema

```sql
-- scripts/004-create-bcz101-schema.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE bcz101_episodes (
  id TEXT PRIMARY KEY,                              -- slug, e.g. "2026-04-22-dish-clanker"
  show TEXT NOT NULL,
  title TEXT NOT NULL,
  guest TEXT NOT NULL,
  guest_org TEXT,
  host TEXT NOT NULL,
  aired_date DATE NOT NULL,
  duration_min INT,
  source_video TEXT,
  source_docx TEXT,
  summary TEXT,
  topics TEXT[],
  entities JSONB,
  action_items TEXT[],
  raw_frontmatter JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bcz101_chunks (
  id BIGSERIAL PRIMARY KEY,
  episode_id TEXT REFERENCES bcz101_episodes(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  start_sec INT,                                    -- for deep-link
  text TEXT NOT NULL,
  embedding vector(1536),                           -- text-embedding-3-small
  token_count INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON bcz101_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON bcz101_chunks (episode_id);
CREATE INDEX ON bcz101_episodes (show, aired_date DESC);
CREATE INDEX ON bcz101_episodes USING gin (topics);
CREATE INDEX ON bcz101_episodes USING gin (entities);

CREATE TABLE bcz101_interactions (
  id BIGSERIAL PRIMARY KEY,
  cast_hash TEXT UNIQUE,
  user_fid BIGINT,
  user_name TEXT,
  query TEXT,
  route TEXT,                                       -- metadata | contextual | hybrid | ignore
  retrieved_episode_ids TEXT[],
  response TEXT,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: service role only (server-side)
ALTER TABLE bcz101_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bcz101_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bcz101_interactions ENABLE ROW LEVEL SECURITY;
```

### Build order (how to actually ship it)

1. **Doc 474 merged** (this doc + content/ folder + 3 transcripts) - DONE in this PR
2. **Ingest script** - `scripts/bots/bcz101-ingest.ts` walks `content/transcripts/`, parses frontmatter, chunks, embeds, upserts. Idempotent on `episode_id`. Run locally first.
3. **Supabase migration** - `scripts/004-create-bcz101-schema.sql`. Ask Zaal before applying to prod.
4. **Router + paths** - port `workflow_router.py` -> `src/lib/bots/bcz101/router.ts` using Haiku 4.5 for classification.
5. **Webhook** - register Neynar webhook pointing at `api.zaoos.com/api/bots/bcz101/webhook`. Needs a dedicated bot FID (generate new app wallet via `scripts/generate-wallet.ts`, register via Neynar dashboard - follow pattern in `project_signer_research.md`).
6. **Test harness** - port `scripts/test_cast_response.py` -> `scripts/bots/bcz101-test.ts`. Run 10 sample queries through each path, eyeball quality.
7. **Deploy + announce** - first episode where `@bcz101` is tagged on Farcaster is the proof.

### What to re-use from the codebase

| Existing | Use for |
|----------|---------|
| `src/lib/fishbowlz/summarize.ts:19-73` | Minimax-primary + Anthropic-fallback LLM invocation - copy pattern into `src/lib/bots/bcz101/respond.ts` |
| `src/app/api/fishbowlz/transcripts/route.ts` | Reference for Zod validation + Supabase service role usage in a route handler |
| `src/lib/db/supabase.ts` | Existing Supabase client factory |
| `src/lib/auth/session.ts` | Not needed for bot (no session), but reference for how routes handle req context |
| `community.config.ts` | Already has admin FIDs - bot FID goes here once registered |
| `scripts/generate-wallet.ts` | Bot signer wallet generation (mirrors app wallet pattern) |

### What NOT to do

- **Don't put transcripts in Supabase Storage** - keep them git-versioned in `content/transcripts/`. Supabase stores only chunks + embeddings. Source of truth is the repo.
- **Don't skip the router** - naive "embed everything, retrieve top-5, stuff in prompt" wastes tokens on queries that could be answered from metadata alone (e.g. "who was the guest on April 14?").
- **Don't use GPT-5 for generation** - project is Anthropic-first per `research/dev-workflows/441-everything-claude-code-integration/`. Only use OpenAI for embeddings.
- **Don't embed raw transcript text with timestamps inline** - strip `[00:00:00]` markers from embedded text, store `start_sec` as a column. Timestamps pollute semantic search.
- **Don't auto-post** - start in `DRY_RUN_SIMULATION=true` mode (mirror gmfc101 env var). Log + human review for first 50 interactions before going live.
- **Don't forget safety** - port `blacklist.py` + `blocked_keywords.py` to `safety.ts` before webhook goes live. FIDs in blacklist, slurs/prompt-injection in keyword filter.

---

## Reference projects (2 alternatives to gmfc101)

### 1. `atmanistan/talkdb-rag` (Python, MIT)
End-to-end transcript RAG with `ChromaDB` + OpenAI. Useful ONLY for the transcript-chunking script, which does speaker-aware chunking (splits at speaker boundaries, not token windows). Worth reading for BCZ if we add diarization later.

### 2. `Yupp/podcast-rag-langchain` (TypeScript, Apache 2.0)
LangChain.js + Supabase + pgvector, already TypeScript. Smaller (~300 LOC), less sophisticated than gmfc101, no router, no bot surface. Useful as a ZAO-stack-aligned reference implementation for the pgvector + chunker + embedder wiring. Copy the migration SQL + embedder init code. Skip the generator layer.

Neither handles the bot/webhook surface - for that, gmfc101 is the only actively maintained reference. Port its Python to our TS.

---

## Sources

- [atenger/gmfc101 (GitHub)](https://github.com/atenger/gmfc101) - reference repo, pushed 2026-04-22
- [gmfc101 README.md](https://github.com/atenger/gmfc101/blob/main/README.md) - data store modes, env vars, Deepgram format
- [gmfc101 workflow_router.py](https://github.com/atenger/gmfc101/blob/main/core/workflow_router.py) - 3-path classifier reference
- [gmfc101 workflow_contextpath.py](https://github.com/atenger/gmfc101/blob/main/core/workflow_contextpath.py) - Pinecone query + context assembly (v1/v2 chunking)
- [Supabase pgvector docs](https://supabase.com/docs/guides/ai/vector-embeddings) - HNSW index, RLS patterns
- [OpenAI embeddings pricing](https://openai.com/api/pricing/) - text-embedding-3-small at $0.02/1M tokens
- [Neynar webhooks](https://docs.neynar.com/docs/webhooks) - mention-trigger pattern
- [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard) - embedding model comparison
- `src/lib/fishbowlz/summarize.ts` - existing Minimax+Anthropic pattern to reuse
- `src/app/api/fishbowlz/transcripts/route.ts` - existing route pattern
- Doc 282 - Privy auth (Neynar-adjacent)
- Doc 281 - Farcaster agents landscape
- Doc 288 - Agent squad monitoring (analytics pattern for interaction_logger.ts)

---

## Cross-links

- `content/README.md` - transcript schema (this doc supersedes for RAG-specific fields)
- `content/transcripts/bcz-yapz/` - the 3 seed transcripts ingested by this plan
- `research/agents/README.md` - agents topic index
- `src/lib/fishbowlz/summarize.ts` - reusable LLM invocation pattern
