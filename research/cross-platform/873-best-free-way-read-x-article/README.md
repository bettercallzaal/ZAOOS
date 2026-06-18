---
topic: cross-platform
type: decision
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: "822, 660, 564, 562, 319"
original-query: "https://x.com/heynavtoor/status/2067194761446920264 can we research this find the best free way to look at an x article"
tier: STANDARD
---

# 873 - Best Free Way to Read an X Article

> **Goal:** Find the best free way for a HUMAN to read an X long-form Article (the `/i/article/<id>` Premium+ feature), not just scrape it for a pipeline. Companion to doc 822 (which solved the programmatic side). Seed link was an X Article by @heynavtoor: "The Stanford STORM Method."

## TL;DR

Reading X Articles is **already free** - only WRITING them needs Premium+. The block you hit on a shared link is a no-login wall, not a paywall. Two clean free routes:

1. **Human, best UX:** open the link logged into ANY free X account. Full native article renders. Zero cost.
2. **No account / want raw text:** swap `x.com` -> `fxtwitter.com` in the URL, or hit `api.fxtwitter.com/status/<id>` for the full body as JSON. Verified live on the seed article: **81 content blocks, no login, no cookie, no key.**

Thread-reader tools (Xunroll, UnrollNow) DO NOT work on Articles - they unroll tweet threads, not `/i/article/` long-form. Skip them for this.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Human reading: USE a free X account, logged in** | X Articles are readable by any account at no cost. Reader pays nothing; only the author needs Premium+ to publish. Best fidelity (images, formatting, embeds) of any method. The login wall is the only barrier, and a free account clears it. |
| 2 | **No-account / programmatic: USE FxTwitter** (`fxtwitter.com/<user>/status/<id>` for a page, `api.fxtwitter.com/status/<id>` for the body) | Free, no auth, no cookie, returns the FULL article body as draft-js blocks. Verified live 2026-06-17 on the seed article: 81 blocks. This is the same Tier 0 already shipped in `~/bin/zao-fetch-x.sh` (doc 822). |
| 3 | **DO NOT use thread-reader tools (Xunroll, UnrollNow, TwitterShots) for Articles** | They unroll tweet THREADS, not `/i/article/` long-form. Hit-or-miss, usually miss. Wrong tool for X Articles. |
| 4 | **DO NOT use a session cookie or pay for X Premium just to READ** | Reading is free. A `auth_token`+`ct0` cookie carries ban/rotation risk and is unnecessary. Per doc 822 + `feedback_oss_first_no_platforms`. |
| 5 | **Archive snapshot is the no-account fallback if FxTwitter is down** | `archive.ph/newest/<article-url>` or `web.archive.org/web/<article-url>` - only works if someone already archived it. Rate-limited (429) at test time; retry later. |

## Findings - the free X-Article reading landscape (June 2026)

### Method comparison

| Method | Login? | Cost | Full body? | Reading UX | Verdict |
|--------|--------|------|-----------|------------|---------|
| Free X account, logged in | Free account | $0 | YES, native | Best - images, formatting, embeds | **Best for humans** |
| `fxtwitter.com` / `fixupx.com` page swap | None | $0 | Embed card + body | OK - clean, raw | **Best no-account** |
| `api.fxtwitter.com/status/<id>` (JSON) | None | $0 | YES (draft-js blocks) | Raw JSON, needs render | **Best for scripts** |
| `x2md` tool (community, draft-js -> markdown) | None | $0 | YES | Clean markdown | Good for archiving |
| Archive.ph / Wayback snapshot | None | $0 | Only if archived | Static HTML | Fallback only |
| Syndication (`cdn.syndication.twimg.com`) | None | $0 | NO - 195-char preview only | n/a | Title/preview only |
| Nitter / xcancel | None | $0 | NO - articles never render | n/a | Threads/tweets only |
| Thread readers (Xunroll/UnrollNow) | None | $0 | NO - threads only | n/a | Wrong tool |
| X Premium+ subscription | Paid login | ~$16+/mo | YES | Native | Only needed to WRITE, never to read |

### The key distinction most people miss

An X **Article** (`x.com/i/article/<id>`) is the Premium+ long-form editor product - distinct from a tweet **thread**. The seed link `x.com/heynavtoor/status/2067194761446920264` is a tweet that WRAPS an article (`x.com/i/article/2067171614580441089`, title "The Stanford STORM Method: How to Make Claude Research Like a PhD in Minutes," 1208 likes). Thread-reader tools target threads and silently fail on articles. That is why "how do I read an X article free" feels hard - people reach for thread tools that were never built for it.

### What was verified live (2026-06-17)

```bash
# Syndication: title + 195-char preview ONLY, no body
curl -s "https://cdn.syndication.twimg.com/tweet-result?id=2067194761446920264&token=4"
# -> article.preview_text = 195 chars, no body field

# FxTwitter: FULL body, no auth
curl -s "https://api.fxtwitter.com/status/2067194761446920264"
# -> tweet.article.content.blocks = 81 blocks, full "Stanford STORM Method" text

# fixupx human page renders (HTTP 200, no login)
curl -sSL "https://fixupx.com/heynavtoor/status/2067194761446920264" -o /dev/null -w "%{http_code}"
# -> 200

# Logged-out x.com = login wall
curl -sSL "https://x.com/i/article/2067171614580441089" | grep -i login
# -> login wall (multiple matches)
```

### Practical recipe (no account, any X Article)

1. Take the tweet/article URL.
2. Replace `x.com` with `fxtwitter.com` (or `fixupx.com`) and open it - clean page, no login.
3. For full machine-readable text: `curl -s "https://api.fxtwitter.com/status/<tweet-id>"` and read `tweet.article.content.blocks[].text`.
4. If FxTwitter is down: try `archive.ph/newest/<url>`, then `web.archive.org/web/<url>`.
5. If the author cross-posted (common for tech writers): search the title in quotes for a Substack / Medium / LinkedIn mirror.

### Caveat - FxTwitter dependency

FxTwitter (FxEmbed project) is a free community service; a June-2026 GitHub issue floated a "compromised" claim that was **confirmed false** (issue #1124). Still, a single free third party is a single point of failure. For a one-off human read, the logged-in free X account has zero such dependency and is the more durable answer.

## Also See

- [Doc 822](../../dev-workflows/822-x-scraping-without-login/) - FxTwitter as no-login fetcher, shipped to `zao-fetch-x.sh` (the programmatic companion to this doc)
- [Doc 660](../../dev-workflows/660-x-content-extraction-v2/) - X content extraction v2, no-login chain + article detection
- [Doc 564](../../dev-workflows/564-reddit-x-scraping-FIXED-implementation/) - Reddit/X scraping fixed implementation
- [Doc 319](../../dev-workflows/319-x-twitter-scraping-tools-2026/) - X/Twitter scraping tools survey

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a one-liner to the `/fetch` skill: "X Article + human wants to read it -> swap x.com -> fxtwitter.com" | @Zaal | Skill edit | Next skill pass |
| Read the seed article body (81 blocks) if STORM method is useful for zao-research tooling | @Zaal | Todo | Optional |
| Re-validate FxTwitter liveness when this doc passes 30 days | @Zaal | Calendar | 2026-07-17 |

## Sources

- [Seed X Article tweet - @heynavtoor "Stanford STORM Method"](https://x.com/heynavtoor/status/2067194761446920264) [FULL - fetched via syndication + FxTwitter, 81 article blocks read]
- [FxTwitter / FxEmbed GitHub - issue #1124 "compromised" claim CONFIRMED FALSE](https://github.com/FxEmbed/FxEmbed/issues/1124) [FULL - community source, liveness + trust signal]
- [Xunroll - thread reader (does NOT handle Articles)](https://xunroll.com/) [FULL]
- [UnrollNow - thread reader (does NOT handle Articles)](https://unrollnow.com/) [FULL]
- [api.fxtwitter.com live test on seed article](https://api.fxtwitter.com/status/2067194761446920264) [FULL - 81 blocks, no auth, verified 2026-06-17]
- archive.ph / web.archive.org snapshot route [PARTIAL - archive.ph returned 429 rate-limit at test time; route valid, retry later]
