---
topic: agents
type: audit
status: research-complete
last-validated: 2026-06-20
superseded-by:
related-docs: "774, 864, 880, 881, 831"
original-query: "do an audit of everything (ZAOscout), close the redundant PR, dig into all of it, then figure out how to do more (reconstructed)"
tier: DEEP
---

# 882 - ZAOscout: Full Audit + How To Do More

> **Goal:** Audit the current state of ZAOscout (`github.com/ZAODEVZ/ZAOscout`), reconcile it against the redundant work that accumulated, confirm what is actually wrong vs already-solved, and lay out the prioritized roadmap for "doing more." ZAOscout is the renamed, evolved successor to farscout (doc 774).

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **`ZAODEVZ/ZAOscout` is the ONE canonical repo. Retire the duplicates.** | It already surpasses everything else: keyless fetch trio (Reddit/Redlib, X/FxTwitter full Articles, Farcaster/Haatz), watch/digest/share, MCP server, tiered HTTP API, GitHub Actions scheduled digest, fly.io deploy, a Claude skill, 26 passing tests. `bettercallzaal/farscout` (old bot) and `bettercallzaal/ZAOscout` (a scraper-only repo spun up 2026-06-19) are both superseded. Farscout PR #13 (a FxTwitter deep-read change) was closed - ZAOscout already does it via `bin/scout-x`. |
| 2 | **The "noise" problem (drone/yoga/market-report tangents) is already SOLVED by architecture - do not re-fix it.** | Those tangents came from OLD farscout's open-ended topic-extraction + web search. ZAOscout is **watchlist-anchored**: `scout watch` reads a curated `watchlist.json` (specific subreddits / Farcaster handles / X authors), grounds the FULL post body via the keyless fetchers, and Exa web grounding is OFF by default (`search.js` returns '' with no `EXA_API_KEY`). Off-topic market reports cannot enter. |
| 3 | **Fix the local path collision NOW: the `scout` skill points at `~/Desktop/repos/ZAOscout`, which currently holds the redundant scraper repo, not the real one.** | `skills/scout/SKILL.md` runs `~/Desktop/repos/ZAOscout/bin/scout`. That path has the wrong repo, so the skill is broken locally. Replace it with a clone of `ZAODEVZ/ZAOscout`. |
| 4 | **The single highest-value "do more" lever is turning on real synthesis: add the OpenRouter key as a GitHub secret so the scheduled digest produces briefs, not link lists.** | The engine, two-pass cite-or-drop digest, and CI cron are all already shipped. Without `OPENROUTER_API_KEY` in repo secrets the digest is link-only. One command flips it to real "why it matters" briefs. |

## What ZAOscout Is (the audit)

A keyless social research scout for the ZAO ecosystem. It reads Reddit, X (including long-form Articles), and Farcaster with **no API keys / OAuth / login**, by reaching each platform through a free first-party-looking mirror. On top of that keyless read layer it adds an optional BYOK synthesis layer (per-item "why it matters", a connected daily brief, social-post drafts) with memory that compounds across runs. Same engine, three surfaces: CLI, MCP server, HTTP API. Runs locally or free+serverless on GitHub Actions. v1.13 + CI digest, 26 tests green (node 18/20/22 + shellcheck).

### Architecture (file paths = ground truth)

| Area | Files | Role |
|------|-------|------|
| Keyless fetchers | `bin/scout`, `bin/scout-reddit` (Redlib), `bin/scout-x` (FxTwitter, full Article bodies), `bin/scout-farcaster` (Haatz), `bin/scout-health` | Route a URL/handle to the right no-key mirror; return full body + comments/article. ~616 LOC. |
| Scout cycle | `scout/watch.js` (read watchlist -> triage -> deliver), `scout/triage.js` (novelty + source diversity + engagement), `scout/ground.js` (full-body via `bin/scout`), `scout/digest.js` (one connected two-pass cite-or-drop brief), `scout/share.js` (review-first social drafts), `scout/notify.js`, `scout/memory.js` + `scout/state.js` (theme memory + dedup, committed to `state/`) | ~643 LOC. The standing-feed loop. |
| Brain (BYOK) | `scout/brain.js` | Provider-agnostic synthesis: OpenRouter / Anthropic / OpenAI / Ollama auto-detected; OpenRouter free-model rotation with 429-aware retry. No key -> link-only, still useful. |
| Web grounding (optional) | `scout/search.js` | Exa BYOK only; **off by default**. The one non-free dependency. |
| Agent + service surfaces | `mcp/server.js` (zero-dep stdio: `scout_fetch`, `scout_digest`), `api/server.js` + `api/tiers.js` + `api/identity.js` + `api/usage.js` (`/fetch /digest /claim /me /chart /health`), `skills/scout/SKILL.md` | The same engine for AI agents and over HTTP. |
| Tiers (social-capital gating) | `api/tiers.js` | anon (50/day, 6 sources) / fc_basic (300, 20, memory) / fc_pro (1500, 50, +synthesis+recurring) / respect (5000, 200). Farcaster gating is keyless via Haatz; ZAO Respect outranks raw followers. |
| Deploy / schedule | `Dockerfile`, `fly.toml`, `.github/workflows/digest.yml` (daily + manual), `.github/workflows/ci.yml` | Free serverless digest on GH Actions (state committed back to `state/`); container deploy ready for multi-tenant. |
| Push-discovery | `workflows/mine.js` | A Claude Code Workflow: one agent per author -> exa semantic search for their best content -> cluster. For going beyond the watchlist feed. |

## Findings

1. **Three artifacts collapse into one.** farscout (doc 774, the original bot) -> evolved + renamed to ZAOscout with the keyless trio, MCP, API, tiers, deploy. The scraper-only `bettercallzaal/ZAOscout` and farscout PR #13 from 2026-06-19 were parallel reinventions of capabilities ZAOscout already had (FxTwitter full-Article reading is `bin/scout-x`). Net: retire both; keep `ZAODEVZ/ZAOscout`.
2. **The noise complaint is stale.** It described old farscout's web-search-driven digests. ZAOscout's watchlist-anchored design structurally prevents it. The lever now is watchlist *curation* and synthesis *quality*, not a relevance filter.
3. **Everything for "more helpful" is already built and just not switched on.** The scheduled digest runs but emits link lists because no `OPENROUTER_API_KEY` secret is set; Discord delivery falls back to committing `state/feed.md` because no `DISCORD_WEBHOOK`; the `share` cron and the public API are intentionally parked. These are config flips, not builds.
4. **One genuine bug:** the local skill path (`~/Desktop/repos/ZAOscout`) holds the wrong (redundant scraper) repo, so `skills/scout` is broken on this machine until the real repo is cloned there.

## How To Do More (prioritized roadmap)

| Priority | Action | Effort | Payoff |
|----------|--------|--------|--------|
| 1 | Set `OPENROUTER_API_KEY` as a `ZAODEVZ/ZAOscout` repo secret; fire `gh workflow run "scout digest"`. | 1 command | Scheduled digest becomes real two-pass briefs instead of link lists. |
| 2 | Replace `~/Desktop/repos/ZAOscout` with a clone of `ZAODEVZ/ZAOscout` so the `scout` skill works locally. | 2 commands | The skill + CLI work on this machine again. |
| 3 | Tune `watchlist.ci.json` to ZAO-relevant sources (the curation lever that controls signal). | minutes | Higher signal, on-target. |
| 4 | Set `DISCORD_WEBHOOK` secret for channel delivery; optionally add a second cron for `scout share` (review-first drafts to `state/drafts.md`). | 1-2 commands | Pushes land in Discord; draft social posts surface for review. |
| 5 | Use `workflows/mine.js` to go beyond the watchlist - point it at a topic/author set and write the clustered findings into a research doc or knowledge graph (the "point it somewhere and it keeps learning" ask). | medium | On-demand deep mining, compounding into memory. |
| 6 | When/if multi-tenant: deploy the API (`Dockerfile`/`fly.toml`), stand up the Respect ledger endpoint, point `RESPECT_URL`. | large | Other people/agents hit your instance with Respect-gated tiers. |

## Also See

- [Doc 774](../../farcaster/774-farscout-autonomous-research-scout/) - the original farscout architecture this evolved from
- [Doc 864](../864-farscout-scout-bot-integration/) - farscout on the board + watched by ZOE
- [Doc 831](../../dev-workflows/831-keyless-forkable-fetch-trio/) - the keyless fetch trio pattern ZAOscout productionized
- [Doc 880](../../dev-workflows/880-zao-scrape-subsystem-and-silent-failure-fixes/) - the (now-superseded) ZAO OS scrape subsystem + the redundant scraper repo
- [Doc 881](../../dev-workflows/881-x-post-backlog-claude-agent-techniques/) - the inbox X-backlog recovered with the same FxTwitter technique

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Close farscout PR #13 (done 2026-06-20) + archive `bettercallzaal/ZAOscout` as superseded | @Zaal | Repo admin | Now |
| `git clone ZAODEVZ/ZAOscout ~/Desktop/repos/ZAOscout` (replace the redundant repo) so the skill works | @Zaal | Setup | Now |
| `grep OPENROUTER_API_KEY .env | cut -d= -f2- | gh secret set OPENROUTER_API_KEY -R ZAODEVZ/ZAOscout` then `gh workflow run "scout digest" -R ZAODEVZ/ZAOscout` | @Zaal | Config | This week |
| Tune `watchlist.ci.json` to ZAO sources | @Zaal | Edit | This week |
| Rename the Discord bot farscout -> zaoscout (Developer Portal) | @Zaal | Discord | In progress |

## Sources

- `ZAODEVZ/ZAOscout` repo (STATUS.md, README, scout/*.js, bin/scout-*, mcp/server.js, api/tiers.js, skills/scout/SKILL.md, .github/workflows/digest.yml, fly.toml, watchlist.example.json) cloned + read 2026-06-20 [FULL - the code is the source of truth; 26/26 tests verified green; bin/scout-x live-verified recovering the STORM article full body]
- Old `bettercallzaal/farscout` repo + PR #13 (closed redundant) [FULL]
- Doc 774 farscout architecture [FULL - internal]
