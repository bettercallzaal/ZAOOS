---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-06-08
superseded-by:
related-docs: "820, 822, 823, 830, 564"
original-query: "can you find another way instead of using env variables i wanna make these shareable and easily forkable without much extra work"
tier: STANDARD
---

# 831 - Keyless, Forkable Fetch Trio (X + Farcaster + Reddit, no env vars)

> **Goal:** Make the inbox/research fetchers clone-and-run. No API keys, no OAuth apps, no `~/.zao/zao.env`. Anyone can fork the three scripts and they work immediately.

## TL;DR

All three social fetchers now read through **free public mirrors that emulate or mirror the source's own client** - so there is nothing to configure. Clone the script, run it. Zero env vars.

| Source | Script | Free public read path | Why it bypasses the block |
|--------|--------|-----------------------|---------------------------|
| **X / Twitter** | `zao-fetch-x.sh` | **FxTwitter** `api.fxtwitter.com` | Wraps X's own data incl. full Article bodies; no login |
| **Farcaster** | `zao-fetch-farcaster.sh` | **Haatz** `haatz.quilibrium.com` | Public Snapchain hub read mirror; standard hub HTTP API, no auth |
| **Reddit** | `zao-fetch-reddit.sh` | **Redlib** (public instances) | Emulates the official Reddit Android app, so Reddit serves it normally |

All verified live 2026-06-08 on real content. The earlier OAuth recommendation for Reddit (doc 820) is demoted to an optional power-user upgrade.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Reddit: read through Redlib (keyless), NOT OAuth, by default** | OAuth creds = env vars = not forkable, which is the exact thing to avoid. Redlib instances emulate the official Reddit Android app's headers/tokens, so Reddit serves them without the IP/fingerprint gate that 403s curl. `zao-fetch-reddit.sh` v3 tries a list of public instances until one returns the thread. Zero config. |
| 2 | **Keep the trio's design uniform: free public mirror, multi-endpoint fallback, no secrets** | FxTwitter (X) and Haatz (Farcaster) were already keyless. Reddit was the odd one out needing OAuth - now fixed. All three scripts share the shape: hardcoded list of public endpoints, try until one works, parse, emit. A fork works with `git clone` + `chmod +x`. |
| 3 | **Hardcode a vetted instance list in each script; allow an env override but never require one** | `REDLIB_INSTANCES` / `FARCASTER_HUB` env vars can override the defaults, but the defaults are baked in so the unconfigured case works. Refresh Reddit's list from `github.com/redlib-org/redlib-instances` if all die. |
| 4 | **OAuth / API keys become the documented OPTIONAL upgrade, not the default** | A forker who wants higher reliability than flaky public instances can add a Reddit OAuth app (doc 820) or a Neynar key (doc 823) - but nothing breaks without them. Graceful, not gated. |

## Findings

### The unifying insight: emulate the source's own client

Each platform blocks generic scrapers but trusts its own first-party client. The free mirrors all exploit that:

- **Redlib** "pretends to be the official Reddit Android app. It sends the same HTTP headers, uses the same authentication tokens, and mirrors the app's behavior. As a result, Reddit believes the requests are coming from its own app" (dev research, 2026). This is why Redlib returns full threads where our `curl .json` got the `theme-beta` block - same residential IP, but a trusted client signature.
- **FxTwitter** wraps X's internal data path and exposes `article.content.blocks` that the public syndication embed omits (doc 822).
- **Haatz** simply IS a Farcaster hub (Snapchain) - reading it is reading the protocol, no gate to bypass (doc 823).

### Verified live (2026-06-08)

| Script | Test | Result |
|--------|------|--------|
| `zao-fetch-reddit.sh` | `/s/` share link + canonical URL, all 4 doc-819 threads | FULL - bodies + comment trees (173 / 45 / 11 / 5). Working instance: `redlib.perennialte.ch` |
| `zao-fetch-x.sh` | both doc-819 X articles | FULL - 88 + 50 article blocks via FxTwitter |
| `zao-fetch-farcaster.sh` | dwr.eth cast + profile + FID | FULL - cast text, embeds, profile, via Haatz |

### Reddit v3 mechanics (`zao-fetch-reddit.sh`)

1. `/s/` share link -> resolve to canonical `/comments/ID/slug` via the interstitial (keyless).
2. Try each Redlib instance in the baked-in list; accept first `HTTP 200` with `>4KB` and a `post_` marker.
3. Parse the no-JS, server-rendered HTML: title, author, subreddit, post body, up to 25 comments.
4. Hard-error (exit 2) only if every instance fails, with a pointer to refresh the list.

Tradeoff vs OAuth: public Redlib instances are rate-limited and Reddit periodically blocks them, so the list needs occasional refresh (same maintenance shape as the X tier fallbacks). The multi-instance loop absorbs single-instance outages. For a fork that needs guaranteed uptime, the OAuth upgrade (doc 820) is there.

### Forkability checklist (what a clone needs)

| Requirement | Before | After |
|-------------|--------|-------|
| Reddit env vars | OAuth client id + secret | **none** |
| X env vars | none | none |
| Farcaster env vars | (would have been Neynar key) | **none** |
| Runtime deps | `curl`, `python3` (stdlib only) | same |
| Setup steps | register Reddit app, write `.env` | **`git clone` + `chmod +x`** |

## ZAO Application

- The three scripts are now independently shareable - drop them in any repo, ZABAL Games starter kit, or a gist. No secret-management story needed.
- `/inbox`, `/zao-research`, `/fetch` skills call them, so the whole inbox pipeline is keyless end to end.
- Reconciles with the secret-hygiene rule: fewer secrets on disk = smaller leak surface. The only fetcher that still benefits from a key (Reddit OAuth, for reliability) is opt-in.
- Pairs with doc 822 (X), doc 823 (Farcaster), and supersedes doc 820's OAuth-first stance.

## Also See

- [Doc 822](../822-x-scraping-without-login/) - X via FxTwitter
- [Doc 823](../823-farcaster-fetch-haatz-free/) - Farcaster via Haatz
- [Doc 820](../820-reliable-inbox-url-fetching/) - Reddit diagnosis + OAuth (now the optional upgrade)
- [Doc 830](../../agents/830-ai-coding-agent-discourse-inbox-cluster/) - all 6 items now FULL via this trio

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `zao-fetch-reddit.sh` v3 Redlib (keyless) - SHIPPED + verified on all 4 threads | Claude | Done | 2026-06-08 |
| Route `/fetch` skill: reddit->zao-fetch-reddit.sh, x->zao-fetch-x.sh, farcaster->zao-fetch-farcaster.sh | @Zaal | Edit | Next sprint |
| Quarterly: refresh Redlib instance list from redlib-org/redlib-instances if hits drop | @Zaal | Maintenance | Ongoing |
| Optional: document the OAuth/Neynar upgrade path in each script's header for forkers who need uptime | @Zaal | Docs | When sharing publicly |

## Sources

- Live tests 2026-06-08 of all three scripts (Redlib on 4 threads, FxTwitter on 2 articles, Haatz on dwr.eth) `[FULL - primary; reproduced in this session]`
- [Redlib instances list](https://github.com/redlib-org/redlib-instances) `[FULL via exa highlight - machine-readable instances.json; the live public-instance registry]`
- [redlib-org/redlib](https://github.com/redlib-org/redlib) `[FULL via exa highlight - "private front-end for Reddit," Rust, no-JS server-rendered HTML]`
- [Libreddit is Redlib - Reddit Frontends 2026 (simple-web.org)](https://simple-web.org/guides/libreddit-is-redlib-reddit-frontends-for-privacy-2026) `[FULL via exa highlight - Redlib emulates the official Reddit Android app's headers/tokens, which is why it isn't IP-blocked]`
- [n8n-nodes-redlib](https://registry.npmjs.org/n8n-nodes-redlib) `[FULL via exa highlight - confirms Redlib HTML parses to Reddit-API-shaped JSON; lists working instances]`
- [Devthatdoes/redlib-mcp-server](https://github.com/Devthatdoes/redlib-mcp-server) `[FULL via exa highlight - reference MCP that parses Redlib post + top comments, "no Reddit API keys required"]`
