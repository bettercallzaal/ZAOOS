---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-06-08
superseded-by:
related-docs: "820, 830, 564, 562, 319, 660"
original-query: "is there any way other than an x session cookie that we can do that really think of the best ways to scrap x and then look online aswell"
tier: STANDARD
---

# 822 - Scraping X Without a Login (FxTwitter beats the session cookie)

> **Goal:** The 2 X items in the doc-819 inbox cluster came back body-less because they are X long-form *Articles*, and `zao-fetch-x.sh`'s syndication tier does not return article bodies. Find the best cookie-free way to get the full body. Answer: FxTwitter. Verified live, shipped to the script.

## TL;DR

`api.fxtwitter.com/status/<id>` returns the **full X Article body** as draft-js content blocks - **no login, no API key, no cookie, no browser, no proxy.** Verified live 2026-06-08 on both inbox articles (0xRicker: 88 blocks; 0xMorty: 50 blocks). Added as **Tier 0** of `~/bin/zao-fetch-x.sh`. The session cookie Zaal wanted to avoid is now unnecessary for reading public tweets + articles.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **USE FxTwitter (`api.fxtwitter.com/status/<id>`) as the primary X fetcher** | Free, no-auth, and the only free source that returns the full Article body (`tweet.article.content.blocks`, draft-js). Verified live on both inbox articles. The `x2md` tool (5.2k-line community project, 2026-05-25) is built on exactly this. Shipped as Tier 0 in `zao-fetch-x.sh`. |
| 2 | **Keep syndication (`cdn.syndication.twimg.com`) as Tier 1 fallback** | Still ~95% reliable for plain tweet text/media; it just lacks article bodies. Belt-and-suspenders if FxTwitter is down. |
| 3 | **DO NOT use a session cookie (`auth_token`+`ct0`) for reading** | The cookie tools (xfetch, bird, x-reader) work but require Zaal's live login + carry ban/rotation risk. FxTwitter removes the need. Reserve cookies only for actions that genuinely require auth (search >7 days, followers, posting) - none of which the inbox needs. |
| 4 | **Paid managed API (getxapi / xquik, ~$0.001/call) is the fallback-of-last-resort, not the default** | If FxTwitter ever dies, `xquik.com/api/v1/x/articles/<tweetId>` and `getxapi.com` both return article bodies by tweet ID for a tenth of a cent. Cheap insurance; no need to wire it now. |

## Findings - the cookie-free X landscape (June 2026)

### The winner: FxTwitter (verified, primary)

Live test 2026-06-08, no auth of any kind:

```bash
curl -s "https://api.fxtwitter.com/status/2062149859394585061"
# -> tweet.article.content.blocks = 88 draft-js blocks, full body of
#    "I gave Opus 4.8 an army of 300 agents and built a working SaaS in one afternoon"
```

- Returns `tweet.text` for normal tweets, `tweet.article.content.blocks` for Articles (draft-js: `unstyled`, `header-two`, `unordered-list-item`, `blockquote`, etc. - convertible to markdown), plus media URLs, author, like/reply/view counts.
- Handle-optional: `/status/<id>` works without the `@handle`, so a bare tweet ID is enough.
- This is the exact gap that doc 660 / the old script flagged as "body NOT in syndication payload - needs mirror search." FxTwitter makes mirror-hunting obsolete for articles.

### Why the syndication endpoint missed it

`cdn.syndication.twimg.com/tweet-result` (the old Tier 1) returns the article's `title` + `preview_text` + cover image but **not** the body - which is why doc 830 had to mark both X items PARTIAL. FxTwitter wraps X's richer internal data and exposes the full `content`.

### Full ranked landscape

| Rank | Method | Auth | Article body? | Cost | Source |
|------|--------|------|---------------|------|--------|
| 1 | **FxTwitter `api.fxtwitter.com`** | none | YES (verified) | free | x2md, x-tweet-fetcher |
| 2 | X API v2 `tweet.fields=note_tweet,article` | free bearer | YES (`article.plain_text`, to 100k chars) | free tier | mulmoclaude PR #1606 |
| 3 | Managed (getxapi / xquik) | api key | YES by tweet ID | ~$0.001/call | getxapi/xquik docs |
| 4 | Guest-token GraphQL (`TweetDetail`) | guest token | Note Tweets yes; Articles brittle | proxy cost | x-twitter-scraper, web-data-labs |
| 5 | Session cookie (`auth_token`+`ct0`) | your login | YES | free | xfetch, bird, x-reader |
| dead | Nitter | guest | no (Articles unsupported) | free | ntscraper - public instances dead 2026 |

Notes from the research:
- **Guest-token GraphQL** still fetches single tweets + Note Tweets (long-form >280 char posts) but datacenter IPs get flagged in 10-20 requests; needs residential rotation. Articles specifically are brittle on this path - FxTwitter is cleaner.
- **X API v2 free bearer** surprised the field: mulmoclaude PR #1606 (2026-06-03) verified `article.plain_text` (up to 100k chars) returns on the free bearer token by requesting `tweet.fields=note_tweet,article`, "contrary to public docs/forums." Good secondary if we ever get a dev account.
- **Nitter is dead** for our purposes - public instances shut down, and it never supported Articles anyway.
- **Headless browser (chrome-headless-shell)** does NOT work: tested live this session, X (and Reddit) fingerprint the headless shell and render a block page even from a residential IP. A real-browser cookie import would work but is the thing we're avoiding.

## ZAO Application

- **`~/bin/zao-fetch-x.sh` - PATCHED 2026-06-08** with FxTwitter as Tier 0 (article-body aware), syndication demoted to Tier 1. Verified on both inbox articles. `/inbox`, `/zao-research`, `/fetch` all call this script, so the fix propagates.
- **Doc 830** - both X sources upgraded PARTIAL -> FULL using the re-fetched bodies (see that doc's revision).
- **Companion to doc 820** (Reddit OAuth fix). Together they close the inbox fetch wall: Reddit via OAuth, X via FxTwitter. Both cookie-free where it counts.
- **Content signal:** 0xRicker's article body confirms the doc-819 read - Opus-4.8-as-planner + Kimi Agent Swarm (300 parallel sub-agents) is the org-chart pattern ZAO's Workflow/Hermes/ZOE already encode. 0xMorty's is a clean "build your first agent in 30 min" template - direct fuel for the ZABAL Games onboarding workshop (doc 778).

## Also See

- [Doc 820](../820-reliable-inbox-url-fetching/) - the Reddit half of the inbox fetch fix (OAuth)
- [Doc 830](../../agents/830-ai-coding-agent-discourse-inbox-cluster/) - the cluster whose X items this unblocks
- [Doc 660](../660-x-content-extraction-v2/) - prior X article "needs mirror search" workaround, now obsolete for bodies
- [Doc 319](../319-x-twitter-scraping-tools-2026/) - earlier X scraping tool landscape

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `zao-fetch-x.sh` Tier 0 FxTwitter patch - SHIPPED + verified | Claude | Done | 2026-06-08 |
| Upgrade doc 830 X sources PARTIAL -> FULL with re-fetched bodies | Claude | Done (this session) | 2026-06-08 |
| Update `/fetch` skill + doc 660 to point at FxTwitter for article bodies | @Zaal | Edit | Next sprint |
| If FxTwitter breaks, wire xquik/getxapi (`$0.001/call`) as Tier 2 article fallback | @Zaal | PR | On failure |
| Pull both article bodies into the ZABAL Games agentic-workflows curriculum | @Zaal | Content | Pre-June demo |

## Sources

- FxTwitter live test 2026-06-08 (`curl api.fxtwitter.com/status/2062149859394585061` + `/2061106244610408566`) `[FULL - primary; both returned full article.content.blocks, ran twice via ID and URL form through the patched script]`
- [yshmarov/x2md](https://github.com/yshmarov/x2md) `[FULL via exa highlight - README states it uses api.fxtwitter.com for "the full structured content of long-form X Articles, which the standard X embed APIs don't expose"]`
- [ythx-101/x-tweet-fetcher](https://github.com/ythx-101/x-tweet-fetcher) `[FULL via exa highlight - FxTwitter for single tweets always works zero-auth; browser backend for Articles]`
- [receptron/mulmoclaude PR #1606](https://github.com/receptron/mulmoclaude/pull/1606) `[FULL via exa highlight - X API v2 free bearer returns article.plain_text up to 100k chars via tweet.fields=note_tweet,article, 2026-06-03]`
- [Twitter/X Data Without the API: 2026 (web-data-labs)](https://web-data-labs.com/blog/twitter-x-scraper-without-api) `[FULL via exa highlight - guest-token GraphQL limits: ~150 req/token, datacenter flagged in 10-20]`
- [xquik Get Article API docs](https://docs.xquik.com/api-reference/x/get-article) `[FULL via exa highlight - GET /x/articles/<tweetId> returns article.contents blocks + body_text]`
- [GetXAPI Get Article docs](https://docs.getxapi.com/docs/articles/get-article) `[FULL via exa highlight - public read by wrapper tweet ID, $0.001/call]`
- [rrrrrredy/x-twitter-scraper](https://github.com/rrrrrredy/x-twitter-scraper) `[FULL via exa highlight - guest-token GraphQL incl Note Tweet long-form, no login]`
- [Apify Twitter/X Scraper input schema](https://apify.com/automation-lab/twitter-scraper/input-schema) `[FULL via exa highlight - guest auth for profiles/timelines; cookies for search/followers; $0.003/tweet]`
- xfetch / bird / x-reader (cookie-based GraphQL tools) `[FULL via exa highlight - all require auth_token+ct0; the path we explicitly avoid]`
