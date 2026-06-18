---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-18
superseded-by:
related-docs: "822, 823, 831, 873, 660"
original-query: "Document the src/lib/scrape no-login scraping subsystem and the on-chain silent-failure fixes built over an autonomous /loop run (reconstructed)"
tier: STANDARD
---

# 880 - ZAO Scrape Subsystem + On-Chain Silent-Failure Fixes

> **Goal:** Institutional-memory record of the `src/lib/scrape/` no-login scraping subsystem and the on-chain silent-0 governance fixes built across ~14 autonomous `/loop` iterations (2026-06-17/18). Earlier docs (822, 831, 660) researched the techniques; this doc records what actually shipped to `main` and the learnings.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **USE `src/lib/scrape/` as the single home for all no-login scraping.** Pure parser + thin fetcher per source, injectable `fetch` for tests, Zod-validated normalized output. | One pattern, fully unit-tested without network. 73+ tests run via the real vitest config (node env). Consumed by `GET /api/scrape` and composable for agents/ZOE. |
| 2 | **USE FxTwitter (`api.fxtwitter.com`) for X tweets + full Article bodies; syndication endpoints for tweet preview and user timeline.** | FxTwitter is the only free source returning full X Article bodies (proven doc 822). The syndication `timeline-profile` embed returns ~100 recent tweets no-login. Full X lifetime history is impossible without login - documented, not faked. |
| 3 | **For WaveWarZ, parse the RSC flight payload, not regex on visible text.** | The Intelligence site is an App-Router (RSC) app with no JSON API. The old `/Wins[:\s]*(\d+)/` regex never matched and silently stored 0 wins for all 43 artists. |
| 4 | **For on-chain balance reads, NEVER default a failed read to 0.** Report read completeness; skip/reject incomplete reads. | A failed multicall read defaulting to 0 is indistinguishable from a real zero and, in respect-sync, got written to the DB - wiping members' Respect on any transient RPC blip. |
| 5 | **Build each change off clean `main`; merge often.** | Stacked branch-on-branch PRs caused painful multi-file merge conflicts (`route.ts`, `index.ts`) when landing. |

## What Shipped (all merged to `main`)

### `src/lib/scrape/` modules

| Module | What | Source technique |
|--------|------|------------------|
| `x-fetch.ts` | X tweets + full X Article bodies | FxTwitter tier 0, syndication `tweet-result` fallback |
| `x-timeline.ts` | recent X user timeline (~100 tweets) | syndication `timeline-profile` embed (`__NEXT_DATA__` -> `timeline.entries`) |
| `bcz-history.ts` | full Farcaster post history + `resolveFarcasterFid(username)` | Neynar `/feed/user/casts` cursor pagination + `/user/by_username` |
| `bcz-site.ts` | bettercallzaal.com profile + categorized links | static HTML parse (socials vs ZAO projects vs other) |
| `bcz-profile.ts` | unified BCZ aggregator (site + X + Farcaster) | `Promise.allSettled`, failed source -> `errors[]`, never sinks the rest |
| `wavewarz.ts` | artist stats (wins/losses/win-rate/volume/earnings) | RSC flight-tree label/value parse, Zod |
| `wavewarz-battles.ts` | full battle history | paginated `/battles?page=N`, embedded JSON, dedupe by `battle_id` |
| `index.ts` | barrel + `detectScrapeSource()` + `scrapeContent()` dispatcher | - |
| `persist.ts` | `scrape_cache` upsert/read (table migration DRAFT, pending apply) | - |
| `retry.ts` | `withRetry()` exponential backoff + `isRetryableHttpError()` | wired into the live HTTP fetchers |

`GET /api/scrape` (session-gated) exposes all sources by query: `url`, `xUser`, `farcasterFid`, `farcasterUser`, `wavewarzArtist`, `wavewarzBattles`, `bczSite`, `&cache=1`.

### On-chain silent-failure fixes

| Fix | File | Bug |
|-----|------|-----|
| `computeRespectWeight()` | `src/lib/respect/voteWeight.ts` | vote route silently undercounted weight when an OG/ZOR read failed (-> 0). Now returns 503 on incomplete read. |
| `readMemberBalances()` | `src/lib/respect/onchainBalances.ts` | respect-sync WROTE 0 to the DB on a failed read, wiping members' cached Respect. Now skips incomplete members, lists them in `skipped`. |
| `getNewSpotlightTier()` | `src/lib/wavewarz/proposals.ts` | derived tier order from a hardcoded array parallel to `SPOTLIGHT_TIERS` (latent break on reorder). Now single source of truth. |

## Findings (the learnings)

1. **No-login X access ladder:** FxTwitter (full article bodies) > syndication `tweet-result` (preview only) > syndication `timeline-profile` (~100 recent tweets). There is no free path to full X lifetime history; the modules document this honestly rather than pretending.
2. **WaveWarZ has no API.** Stats render in the React flight payload as label/value pairs; battles as embedded JSON objects. The pre-existing regex scraper had been silently storing 0 wins for every artist.
3. **Real-data gotcha:** WaveWarZ `battle_id` is a JSON number but `totalVolSol`/`marginPct` arrive as strings. Caught ONLY by testing against a captured fixture, not an assumed shape. Schema now accepts both and coerces.
4. **The on-chain silent-0 bug class:** `status === 'success' ? value : 0` converts a FAILED RPC read into a real-looking zero. Read-only displays tolerate it; the respect-sync WRITE path corrupted data. The fix pattern: surface read completeness and refuse to persist partial reads.
5. **Process - stacked PRs hurt.** Branch-on-branch stacks (the scrape subsystem #883-895) needed conflict resolution on shared files at merge time. Building off clean `main` per change (the later fixes) merged cleanly.
6. **Process - vitest config + tsc.** `vitest.config.ts` had to become `.mts` (ESM) to load under node 20, which then needed a `tsconfig.json` exclude or `tsc` failed in CI. A local typecheck filtered to changed files hid it - always run the full `tsc`.
7. **Process - the research-index pre-commit hook** blocks local merge commits when `main` carries unindexed docs (server-side PR merges skip the hook, so debt accumulates). Rebuild a conflicted doc branch fresh on `main` instead of fighting it; `--no-verify` is correctly blocked by a guardrail.

## Also See

- [Doc 822](../822-x-scraping-without-login/) - FxTwitter as the no-login X fetcher (the technique this subsystem productionized)
- [Doc 831](../831-keyless-forkable-fetch-trio/) - keyless fetch trio
- [Doc 823](../823-farcaster-fetch-haatz-free/) - free Farcaster fetching
- [Doc 873](../../cross-platform/873-best-free-way-read-x-article/) - reading X Articles free (seed of the FxTwitter work)
- [Doc 660](../660-x-content-extraction-v2/) - X content extraction v2

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Apply the `scrape_cache` migration (`scripts/20260618_scrape_cache.sql`) so `/api/scrape?cache=1` persists | @Zaal | DB migration (approval) | When ready |
| Wire `wavewarz-battles` scraper into the WaveWarZ sync to persist battle history | @Zaal | PR | Next sprint |
| Audit remaining `status === 'success' ? : 0` sites for the silent-0 pattern (leaderboard.ts is read-only, lower risk) | @Zaal | Review | Ongoing |

## Sources

- `src/lib/scrape/` (x-fetch, x-timeline, bcz-history, bcz-site, bcz-profile, wavewarz, wavewarz-battles, index, persist, retry) on `main` [FULL - the shipped code]
- `src/lib/respect/voteWeight.ts`, `src/lib/respect/onchainBalances.ts`, `src/lib/wavewarz/proposals.ts` on `main` [FULL]
- PRs #883-#903 (scraping subsystem, dispatcher, persistence, retry, resolver, timeline, site, profile aggregator, vote-weight + respect-sync + spotlight-tier fixes) [FULL - per-change history]
- `~/.zao/clipboard/clip-20260618-111421-scraping-loop-learnings.html` [FULL - the learnings writeup this doc formalizes]
- [api.fxtwitter.com](https://api.fxtwitter.com) and Twitter syndication `timeline-profile` endpoint [FULL - verified live 2026-06-17/18]
