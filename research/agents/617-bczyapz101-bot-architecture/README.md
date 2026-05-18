---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-06
related-docs: 474, 569, 616
tier: STANDARD
---

# 617 — bczyapz101 bot architecture (gmfc101 fork plan)

> **Goal:** Stand up an `@bczyapz` Farcaster bot that answers questions about the 18 BCZ YapZ episodes by forking and adapting Adrienne's gmfc101 / Warpee.eth codebase, with a clear delta of what to keep vs change.

## TL;DR — fork gmfc101 as-is, swap data, ship

| Decision | Choice | Why |
|---|---|---|
| Source | Fork `github.com/atenger/gmfc101` (Apache 2.0) | Public, MIT-friendly license, battle-tested by Adrienne in production as Warpee.eth, dual-mode (legacy router + agentic skills). |
| New repo | `github.com/bettercallzaal/bczyapz101` | Stand-alone, mirrors how bcz-yapz graduated. No drift. |
| Data source | `content/transcripts/*.md` from `bettercallzaal/bcz-yapz` | Single source of truth. Use the future `/feed.xml` from Doc 616 for incremental updates. |
| Deploy | Render free hobby tier (same as gmfc101) | Adrienne already runs Warpee here. Cold starts OK for chat-latency tolerance. Skip Vercel Functions (cold start + timeout risk on agentic loops). |
| Vector DB | Pinecone (gmfc101 default) | Already wired. Free tier covers 18 episodes easily. Could swap to Supabase pgvector later (existing ZAO infra) - not worth it for v1. |
| LLM | OpenAI gpt-5-mini (gmfc101 default) | Adrienne's prompts tuned for it. Switch only if cost becomes an issue. |
| Bot strategy v1 | `BOT_STRATEGY=legacy` (3-path router) | Lower complexity than agentic. Get it answering questions first, swap to agentic later. |
| Identity | New Farcaster account `@bczyapz`, fresh FID + Neynar signer | Don't reuse Zaal's @zaal FID (signing risk). |

## What gmfc101 / Warpee actually is

Source: github.com/atenger/gmfc101 (Apache 2.0, Python/Flask). Same codebase runs Warpee.eth in agentic mode via env var.

**Stack:**
- Python 3 + Flask 3.1 + Gunicorn 23 (HTTP)
- OpenAI gpt-5 / gpt-5-mini (LLM) + text-embedding-ada-002 (embeddings)
- Pinecone 5.x (vector DB, dual-index: transcripts + episodes)
- boto3 1.34 (S3 transcript storage)
- Neynar webhook + signer for Farcaster I/O
- Render (deployment, free tier)

**Key files (from public repo):**
- `api.py` — Flask app, three webhook endpoints (v2 sync, v3 async with background thread, test)
- `core/agent.py` — `BotAgent` class with tool-calling, 5-iteration cap, agentic mode
- `core/workflow_router.py` — LLM-routed dispatch to metadata | contextual | hybrid | ignore
- `core/workflow_contextpath.py` — RAG with semantic search + context-window expansion (~22KB)
- `core/workflow_hybridpath.py` — full-episode transcript retrieval
- `core/workflow_metadatapath.py` — answers from `metadata.json` (guest lists, ep counts)
- `core/respond_toquery.py` — webhook handler, Neynar conversation history, cast curation (~30KB)
- `core/data_store.py` — abstract S3/local transcript fetcher
- `prompts/` — modular prompt files (router, agent, response generator)
- `scripts/download_transcripts.py` + `update_transcripts.py` — Deepgram JSON ingestion pipeline
- `data/samples/` — example Deepgram transcript JSON

**Webhook flow:**
1. User casts on Farcaster mentioning `@bczyapz`
2. Neynar fires HMAC-SHA512 signed webhook to our `/webhook_v3`
3. Flask returns 200 immediately; spawns background thread; in-memory dedupe by cast hash
4. Worker thread: route -> retrieve -> respond -> sign + post via Neynar signer

## What needs to change for bczyapz101

**Keep verbatim:**
- Webhook + signature verification (`api.py`)
- Background-thread + dedupe pattern (`/webhook_v3`)
- Router/agent/response prompt structure (`prompts/`)
- Pinecone dual-index (transcripts + episodes)
- Deepgram JSON intermediate format (gives us speaker + sentence boundaries)
- Render deployment (Procfile + env vars)

**Swap:**

1. **Transcript ingestion** — gmfc101 reads Deepgram JSON from S3. Our transcripts are markdown with frontmatter + `[HH:MM:SS]` inline timestamps.
   - New script: `scripts/bcz_ingest.py` reads `bczyapz.com/feed.xml` (or directly clones `bettercallzaal/bcz-yapz` and walks `content/transcripts/*.md`).
   - Convert each transcript to gmfc101's expected Deepgram-shape JSON: split on timestamp markers, fake speaker assignment from "Zaal:" / guest-name prefixes if present, otherwise leave as single speaker.
   - Push JSON to S3 (or skip S3 - use git as the store, since 18 small files is nothing).
   - Run gmfc101's existing `update_transcripts.py` to chunk + embed + upsert to Pinecone.

2. **Metadata schema** — gmfc101's `metadata.json` has GM Farcaster fields (host names, podcast type, episode number on YT). Ours needs:
   ```json
   {
     "ep_id": "2026-04-26-andy-minton-hangry-animals",
     "title": "BCZ YapZ ep 18 - Andy Minton (Hangry Animals)",
     "guest": "Andy Minton",
     "guest_org": "Hangry Animals",
     "date": "2026-04-26",
     "duration_min": 28,
     "youtube_url": "...",
     "youtube_video_id": "...",
     "topics": ["nft", "art", "..."],
     "summary": "..."
   }
   ```
   Generated at build time from our zod schema in `bcz-yapz/src/lib/types.ts`.

3. **Chunk size** — gmfc101 default is 500 chars. Our convo segments are conversational (longer pauses, more context per turn). Bump to 800-1000 chars + keep gmfc101's "+10 sentence context expansion" on retrieval. Tune empirically after first ingest.

4. **Response format** — gmfc101 replies with YouTube link + `?t=NN`. We do the same but ALSO link `https://bczyapz.com/ep/<slug>#t-NN` so users land on our archive (richer chapter context, related eps).

5. **System prompt** — Adrienne's prompt is tuned to "GM Farcaster educational vibe." Ours needs ZAO/music/web3-builder voice. New `prompts/system_prompt.py`:
   ```
   You are bczyapz101, a knowledge agent over the BCZ YapZ podcast hosted by Zaal.
   The show is long-form interviews with web3 builders, music-first founders, and
   coordination misfits The ZAO collects. Episodes are 25-30 min, drop Tuesdays.
   Answer questions by retrieving from the 18-episode transcript library. Always
   cite the episode + timestamp. Voice: plain, builder-to-builder, no hype words.
   Say "Farcaster" not "Warpcast." Never use emojis or em dashes.
   ```

6. **Bot identity** — register a new Farcaster account `@bczyapz`. Get FID, generate Neynar signer UUID, store in env. Never use Zaal's @zaal FID (one bug = one Zaal-impersonation cast).

**Skip for v1:**
- Agentic mode (start with legacy router, swap later when we have specific tool needs like "find quotes by speaker X")
- Custom skills like `find_quotes_by_speaker` - gmfc101's hybrid path already handles this via Pinecone metadata filters
- Bonfire knowledge graph integration (Doc 569) - separate concern, layer later

## Costs (estimate, 2026-05-06)

| Line item | Monthly | Source |
|---|---|---|
| Pinecone serverless free tier | $0 | Up to 2M vectors, 18 episodes ~50k chunks total, well under cap |
| OpenAI gpt-5-mini | ~$5-15 | Depends on cast volume; gmfc101 reports <$10/mo at 50-100 casts/day |
| OpenAI ada-002 embeddings | <$1 | One-time per transcript, near zero recurring |
| Render hobby tier | $0 | Free tier sleeps after 15 min idle (cold start ~30s) |
| Neynar API | $0 | Free tier covers 10k webhook events/mo |
| Total | **~$5-15/month** | |

If we exceed Render free tier, $7/month for always-on dyno.

## Implementation steps

| # | Step | Output |
|---|---|---|
| 1 | Fork `atenger/gmfc101` to `bettercallzaal/bczyapz101` | Empty fork |
| 2 | Update README + LICENSE attribution | docs commit |
| 3 | Write `scripts/bcz_ingest.py` reading `bczyapz.com/feed.xml` | New script |
| 4 | Generate `data/metadata.json` for 18 eps from bcz-yapz frontmatter | One-time script |
| 5 | Convert each markdown transcript to Deepgram-shape JSON | Output to `data/transcripts/` |
| 6 | Run `update_transcripts.py` to chunk + embed + upsert to Pinecone | Filled vector DB |
| 7 | Update `prompts/system_prompt.py` with ZAO voice | Prompt commit |
| 8 | Register `@bczyapz` Farcaster account + Neynar signer | New FID |
| 9 | Configure Render with env vars + deploy | Live `/webhook_v3` |
| 10 | Configure Neynar webhook -> Render URL | Webhook live |
| 11 | Test cast `@bczyapz what did Hannah say about Farm Drop?` | Reply with timestamp |
| 12 | Add cron (GitHub Action) that re-runs ingest on bcz-yapz repo push | Auto-update on new ep |

## Risks + mitigations

| Risk | Mitigation |
|------|-----------|
| Render cold start makes first reply slow (~30s) | Acceptable for v1. Upgrade to $7/mo always-on if users complain. |
| Pinecone free tier deprecation | Adrienne already migrated; their prod is on free tier. Plan B = Supabase pgvector (we already use it). |
| OpenAI rate limits at high cast volume | Adrienne hasn't hit it; we won't either. |
| Neynar webhook spam / abuse | gmfc101's HMAC verification + cast hash dedupe + in-memory rate limit cover this. |
| Hallucinated episode content | gmfc101's prompts already enforce citation + don't-know-when-not-in-context. Inherit them. |
| Drift between bcz-yapz transcripts + bot's vector DB | Step 12 - GitHub Action cron re-ingests on push. |

## Sources

- atenger/gmfc101 - https://github.com/atenger/gmfc101 (Apache 2.0, verified 2026-05-06)
- Adrienne's writeup "How I Built GMFC101" - https://paragraph.com/@adrienne/how-i-built-gmfc101-a-farcaster-ai-agent-trained-on-video-content-without-eliza
- Adrienne's part-2 "Building a Farcaster AI Agent" - https://someofthethings.substack.com/p/building-a-farcaster-ai-agent-part
- Pinecone serverless pricing - https://www.pinecone.io/pricing/ (verified 2026-05-06)
- Neynar webhook docs - https://docs.neynar.com/docs/webhooks
- Render free tier - https://render.com/pricing (verified 2026-05-06)

## Codebase grounding

- bcz-yapz transcripts: `bettercallzaal/bcz-yapz/content/transcripts/*.md` (18 eps as of 2026-05-06)
- bcz-yapz frontmatter zod schema: `bettercallzaal/bcz-yapz/src/lib/types.ts` (`EpisodeFrontmatterSchema`)
- bcz-yapz chapter parser: `bettercallzaal/bcz-yapz/src/lib/chapters.ts` (already extracts timestamps)
- Existing description skill: `~/.claude/skills/bcz-yapz-description/SKILL.md` produces structured ep summaries we can feed into bot system prompt for episode-level context
- Future RSS feed: per Doc 616, will live at `https://bczyapz.com/feed.xml` - bot ingest reads from there

## Also see

- [Doc 474 - BCZ 101 bot transcript RAG blueprint](../474-bcz101-bot-transcript-rag/) - earlier exploration of the same idea, predates Adrienne's public release
- [Doc 569 - YapZ Bonfire ingestion](../../identity/569-yapz-bonfire-ingestion-strategy/) - parallel knowledge graph approach, complementary not competing
- [Doc 616 - BCZ YapZ archive UI/UX](../../dev-workflows/616-bcz-yapz-archive-ui-best-practices/) - the RSS feed + per-ep page work in 616 unblocks step 3 of this plan

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship `/feed.xml` in bcz-yapz (prereq, see Doc 616) | @Zaal | bcz-yapz PR | This sprint |
| Fork atenger/gmfc101 -> bettercallzaal/bczyapz101 | @Zaal | GitHub action | After Doc 616 RSS lands |
| Write `scripts/bcz_ingest.py` adapter | Claude | bczyapz101 PR | Same sprint |
| Register @bczyapz Farcaster account + Neynar signer | @Zaal | Manual | Same sprint |
| Stand up Render deployment | @Zaal | Deploy | Same sprint |
| Wire Neynar webhook | @Zaal | Config | Same sprint |
| Add bcz-yapz GitHub Action to trigger bot re-ingest on push | Claude | Action | Polish phase |
| Add bot reply links to `bczyapz.com/ep/<slug>#t-NN` | Claude | bczyapz101 PR | Once per-ep pages exist |
