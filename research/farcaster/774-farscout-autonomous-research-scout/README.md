---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-30
superseded-by:
related-docs:
original-query: "farscout - the free autonomous Farcaster research scout we built (~/Documents/farcaster/farscout, github.com/bettercallzaal/farscout, running 24/7 on VPS 187.77.3.104). Research and document the whole project: architecture, the free-tool stack it uses (Warpcast API, Jina grounding, Dexscreener enrichment, OpenRouter free models, Bonfire memory, Discord delivery), the research-agent patterns it implements (two-pass synthesis, novelty triage, grounding/cite-or-drop, adaptive cadence), how it compares to 2026 best practices (GPT Researcher, STORM, deep-research patterns), and a roadmap of next improvements."
tier: DEEP
---

# 774 — farscout: A Free Autonomous Farcaster Research Scout

> **Goal:** Document farscout end-to-end - architecture, its all-free tool stack, the research-agent patterns it implements, how it measures against 2026 deep-research best practices, and the next-improvement roadmap.

## Key Decisions

| Decision | Call | Why |
|----------|------|-----|
| Reasoning backend | USE OpenRouter `:free` models with rotation + retry; require a small paid credit (~$10) to lift free rate limits | Free models are a shared, saturated pool; $10 credit moved success from ~1/6 models to reliable. Verified live: 60 tests, 3/3 brain calls at 1.7-3s. |
| Farcaster reads | USE `api.warpcast.com` (free, no auth) for user casts + cast search; Neynar key only for channels | No free unauthenticated channel feed exists on Warpcast or HAATZ (both 200 with empty lists). Verified live across both providers. |
| Web grounding | USE Jina (`s.jina.ai` search + `r.jina.ai` reader), free no-auth, DuckDuckGo as last-resort fallback | DDG HTML scraping is fragile; Jina returns clean LLM-ready content. Biggest quality+robustness lever found in research. |
| Crypto enrichment | USE Dexscreener (`/latest/dex/search`, free, no key) for $ticker price/liq/vol/FDV | Farcaster is full of token talk; web search can't see live market data. Injected as citable sources. |
| Synthesis quality | USE two-pass (extract claims -> synthesize across them) on the largest free models led by `gpt-oss-120b:free` | Research consensus: two-pass + bigger model is the #1 quality lever for small models. Live: turned "restates the cast" into cross-source insight. |
| Hosting | USE a systemd `--user` service on the existing Hostinger VPS (187.77.3.104), `enable-linger` for 24/7 | Survives reboots, auto-restarts on crash, independent of the operator's mac. One instance avoids Discord token conflicts. Verified: 0 restarts, 38MB RAM. |
| Memory | USE ZABAL Bonfire knowledge graph for durable episodes + local JSON cache for dedup keys | Reuses existing ZAO infra ($0); fuzzy dedup (canonical + token overlap) prevents re-researching. Live write verified. |
| SSRF posture | USE host-literal allowlist (`isPublicHttpUrl`) + `redirect: 'manual'` | The bot fetches URLs pulled from untrusted casts. Two audit rounds closed decimal/octal/hex/IPv6-mapped/trailing-dot/userinfo and 3xx-redirect bypasses. |

## What farscout Is

A free, mostly-autonomous Farcaster research scout for the ZAO ecosystem. It reads Farcaster, extracts the topics the operator and network are discussing, grounds each topic in real sources, synthesizes cited insight findings with a free LLM, remembers what it learned in a knowledge graph, and delivers to Discord on an engagement-scaled cadence. v1 is read-only (it never posts to Farcaster).

- **Repo:** github.com/bettercallzaal/farscout (public)
- **Local:** `~/Documents/farcaster/farscout`
- **Live:** systemd service `farscout.service` on VPS `187.77.3.104`, head `5bdc32e`
- **Scale (verified 2026-05-30):** 28 commits, 11 lib modules, ~1310 LOC, 60 unit tests passing, 3 runtime deps (`discord.js`, `dotenv`, `undici`), 38MB resident RAM.

## Architecture (the tick loop)

```
tick -> read Farcaster (own casts + channels + watched FIDs)
     -> rank by engagement -> extract topics (light model) + standing topics
     -> NOVELTY TRIAGE (traction + novelty + token-signal, dedup, top 3)
     -> per topic: GROUND (cast search + Jina web search + URL/Jina-reader fetch
                            + Dexscreener $ticker enrichment + Frame/MiniApp detect)
     -> TWO-PASS SYNTHESIS (extract claims [light] -> synthesize insights [heavy])
     -> cite-or-drop (finding without a real source index is discarded)
     -> deliver to Discord (findings + sources + mini-apps + 1 question)
     -> push learnings to Bonfire -> set next cadence -> persist -> weekly digest
```

### Module map (file paths = ground truth)

| File | Role |
|------|------|
| `index.js` | Orchestrator: boot, Discord command surface (`/now`, `/dig`, `/digest`, `/pause`, `/resume`), tick loop, digest, cadence persistence |
| `config.js` | Env config + `requireConfig` (Ollama-OR-OpenRouter validation) |
| `lib/reader.js` | Warpcast reads (`/v2/casts`, `/v1/channel-casts` via Neynar), `normalizeCast`, `castWeight` engagement ranking |
| `lib/search.js` | Grounding: cast search, web search (Exa->Jina->DDG chain), `fetchUrl` (+ Jina Reader), `detectFrame` |
| `lib/enrich.js` | Crypto enrichment: `extractTickers`, Dexscreener `marketFacts` |
| `lib/triage.js` | Novelty triage: `scoreTopic`, `triage` (traction + novelty + dedup) |
| `lib/research.js` | `gatherSignal`, `gatherSources`, `researchTopic` (two-pass), `runCycle` |
| `lib/brain.js` | Model router: Ollama (if tunnel) else OpenRouter free-model rotation + body-429 handling + retry |
| `lib/memory.js` | Bonfire episode push + fuzzy `isKnown` dedup + bounded retry queue + secret guard |
| `lib/http.js` | `fetchWithBackoff` (429/5xx + timeout), `isPublicHttpUrl` SSRF guard, `htmlToText` |
| `lib/util.js` | `parseJson` (brace-matching, fence-stripping), `toLines`, `toSlugs`, `canonicalize`, `tokenOverlap` |
| `lib/cadence.js` | Adaptive interval (30 min floor, 24 h ceiling, 6 h start) |

## The All-Free Tool Stack

| Layer | Tool | Free-tier | Auth | Endpoint example |
|-------|------|-----------|------|------------------|
| Farcaster read | Warpcast API | free, public | No | `GET https://api.warpcast.com/v2/casts?fid=19640&limit=25` |
| Cast search | Warpcast | free | No | `GET /v2/search-casts?q=clanker&limit=8` |
| Channels (optional) | Neynar v2 | free key, 300 rpm | Yes | `GET https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=zao` |
| Web search | Jina `s.jina.ai` | 10M free tokens | No | `GET https://s.jina.ai/?q=farcaster+mini+apps` |
| Page read | Jina `r.jina.ai` | shared free tokens | No | `GET https://r.jina.ai/https://docs.farcaster.xyz/` |
| Crypto data | Dexscreener | free, ~300 rpm | No | `GET https://api.dexscreener.com/latest/dex/search?q=clanker` |
| Reasoning | OpenRouter `:free` | free models (+ ~$10 credit lifts limits) | Yes | `POST https://openrouter.ai/api/v1/chat/completions` model `openai/gpt-oss-120b:free` |
| Memory | ZABAL Bonfire | existing ZAO key | Yes | `POST https://tnt-v2.api.bonfires.ai/knowledge_graph/episode/create` |
| Delivery | Discord (discord.js) | free | bot token | DM to operator |
| Hosting | Hostinger VPS systemd | existing box | SSH | `systemctl --user … farscout.service` |

Running cost: ~$0 plus a one-time ~$10 OpenRouter credit to escape free-tier 429s. Reads, grounding, enrichment, memory, hosting all $0.

## Research-Agent Patterns Implemented

1. **Grounding / cite-or-drop** (`lib/research.js`): every finding must cite a real in-range source index or it is discarded. Sources come from cast search + web + fetched page text + market data. This is the core anti-hallucination guarantee - a finding with no source URL never ships.
2. **Two-pass synthesis** (`researchTopic`): pass 1 (cheap light model) extracts concrete claims+citations from sources; pass 2 (stronger heavy model) synthesizes insights ACROSS those claims. Live result: shifted output from restating a single cast to cross-source pattern/implication/"so what".
3. **Novelty triage** (`lib/triage.js`): before spending research budget, candidate topics are scored by corpus traction (mention count), novelty vs memory, and token-signal, then deduped, then top-N taken. Skips low-signal noise.
4. **Engagement weighting** (`castWeight`): corpus ranked by likes + 2x recasts so high-traction casts drive topic extraction.
5. **Fuzzy memory dedup** (`lib/memory.js`): `isKnown` matches on canonical form + Jaccard token overlap (>=0.8), so "mini-apps"/"miniapp"/"Mini Apps" collapse while a genuine narrower subtopic stays researchable.
6. **Adaptive cadence** (`lib/cadence.js`): interval halves on operator engagement, doubles on silence, bounded 30 min - 24 h. The more you reply, the faster it returns.
7. **Robust free-model routing** (`lib/brain.js`): rotates the free-model list, treats OpenRouter's HTTP-200-with-`{error:{code:429}}` body as a miss, and retries the rotation up to 3 rounds with backoff.
8. **Resilient JSON parsing** (`lib/util.js`): small free models append reasoning after the JSON; `parseJson` strips fences and brace-matches the first balanced object so trailing rambling does not zero out findings.

## How It Compares to 2026 Deep-Research Best Practices

Researched against GPT Researcher (Apache 2.0, ~26K stars), Stanford STORM (NAACL 2024), and open deep-research patterns.

| Best practice | farscout today | Gap / roadmap |
|---------------|----------------|---------------|
| Plan -> retrieve -> synthesize -> **reflect** loop | Single grounded two-pass per topic | No self-critique/gap pass yet (roadmap #1) |
| Perspective-guided decomposition (STORM) | One topic = one query | Add 2-3 sub-questions per topic (roadmap #3) |
| Citation-aware retrieval + "cite or drop" | Implemented (cite-or-drop) | No semantic claim<->source verification pass (roadmap #2) |
| Memory / knowledge graph to avoid re-research | Bonfire + fuzzy dedup | No recency-decay or storyline tracking (roadmap #4) |
| Topic triage by novelty/importance | Implemented (heuristic) | Could add an LLM novelty scorer (NoveltyRank-style) |
| Structured JSON output reliability | Brace-matching parser + strict prompt | Could adopt OpenRouter `response_format: json_schema` on supporting free models |
| Tiered delivery (daily/weekly/monthly) | Per-tick + weekly digest | No weekly storyline rollup yet (roadmap #5) |
| Self-eval before delivery (groundedness, confidence) | None | Add confidence label / claim verification (roadmap #2) |

Net: farscout already covers grounding, triage, memory, and two-pass synthesis - the high-value cheap patterns. The remaining gaps are the iterative-reflection and self-eval layers that the best deep-research systems add.

## Roadmap (free, ranked by leverage)

1. **Reflection / gap pass** - after synthesis, ask "what's missing?", retrieve more, re-synthesize once. Biggest quality lever still unimplemented.
2. **Self-eval before delivery** - parse findings into claims, verify each against sources (entailed/contradicted/silent), attach a confidence label, hold or mark "preliminary" below threshold.
3. **Perspective decomposition** - per topic, generate 2-3 angle sub-questions (market/technical/social), ground each in parallel, synthesize. +10-25% coverage per STORM eval.
4. **Temporal memory** - recency decay on graph entities + storyline tracking ("3rd mention of X this month") to surface trends, not just facts.
5. **Weekly storyline rollup** - group the week's findings by entity/theme, show arcs, deliver a Monday brief.
6. **NodeRPC public hub** - unlimited free trending/channel reads from a public Farcaster hub, removing the Neynar-key dependency for channels.

## Verification Notes (this doc)

All architecture claims are grounded in the live repo at head `5bdc32e` (read directly, not from memory): 11 `lib/*.js` modules, 60 passing `node --test` tests, 3 deps. Live behavior (Warpcast reads, Jina grounding, Dexscreener enrichment, OpenRouter brain, Bonfire write, two-pass synthesis output, systemd uptime) was each exercised on the VPS during the build session 2026-05-29/30. External free-tier limits (Jina 10M tokens, Neynar 300 rpm, Dexscreener ~300 rpm, OpenRouter free-pool 429s) are from the build-session web research and are high-churn - re-validate within 30 days.

## Also See

- farscout repo: github.com/bettercallzaal/farscout
- Build-session context lives in the farscout git history (28 commits, 8 merged PRs).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Implement reflection/gap pass (roadmap #1) | @Zaal | PR | Next session |
| Add self-eval + confidence label before delivery (roadmap #2) | @Zaal | PR | Next session |
| Overnight autonomous-tick test (confirm 6h loop fires unprompted) | @Zaal | Test | Within 2 days |
| Re-validate external free-tier limits (Jina/Neynar/Dexscreener/OpenRouter) | @Zaal | Research | 2026-06-29 |
| Decide whether to add NodeRPC hub for free channels/trending | @Zaal | Decision | Backlog |

## Sources

- [farscout repository](https://github.com/bettercallzaal/farscout) [FULL - read the live working tree at head 5bdc32e]
- [Warpcast API reference](https://docs.farcaster.xyz/reference/warpcast/api) [FULL - endpoints verified live from the VPS during build]
- [Neynar API rate limits](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis) [FULL]
- [Jina Reader](https://jina.ai/reader/) [FULL]
- [Dexscreener API reference](https://docs.dexscreener.com/api/reference) [FULL]
- [OpenRouter structured outputs / models](https://openrouter.ai/docs) [FULL]
- [GPT Researcher](https://github.com/assafelovic/gpt-researcher) [FULL]
- [Stanford STORM](https://storm-project.stanford.edu/research/storm/) [FULL]
- [NodeRPC free Farcaster hub endpoint](https://www.noderpc.xyz/blog/posts/free-farcaster-hub-endpoint) [PARTIAL - blog read via search summary; endpoint not yet exercised by farscout]
