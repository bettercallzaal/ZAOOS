---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-06-08
superseded-by:
related-docs: "564, 562, 319, 693, 306"
original-query: "/zao-research the best way to parse these urls i feel like many inboxed items were not indexed well and researched"
tier: STANDARD
---

# 820 - Reliable Inbox URL Fetching (Reddit OAuth + /s/ resolve + X article reality)

> **Goal:** The 2026-06-08 inbox cluster (doc 830) fetched almost nothing - 4 Reddit threads came back title-only, 2 X articles body-less. Diagnose exactly why and ship the durable fix so inbox/research runs stop indexing off titles.

## TL;DR

The `old.reddit.com + .json + Mozilla UA` technique that doc 564 shipped on 2026-05-21 as "FIXED + TESTED" **is now dead.** Reddit tightened the gate in the ~3 weeks since. Every server-side fetcher in the ladder (curl, exa web_fetch, Jina Reader, WebSearch's UA) is blocked, and the local Playwright bridge isn't installed. The fix is **authenticated access via a free Reddit OAuth script-app** - auth defeats both gates Reddit now enforces. Separately, `/s/` mobile share links were never resolved to canonical first, so they'd fail even if the gate were open.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Add a Reddit OAuth script-app; rewrite `~/bin/zao-fetch-reddit.sh` to use `oauth.reddit.com` with a bearer token** | Reddit now gates on IP reputation AND TLS/client fingerprint at once. Authenticated `client_credentials` requests bypass both. Free tier = 100 QPM, no residential proxy, no browser. This is the only path that is not fragile. |
| 2 | **Resolve `/s/` share links to the canonical `/comments/ID/slug` URL BEFORE fetching** | `old.reddit.com` 403s on `/s/` paths; the share URL must be followed on `www.reddit.com` first, then the query string dropped. The current script appends `.json` to the `/s/` URL directly - it can never work. Done manually in doc 830 (grep the interstitial for `/comments/`); automate it. |
| 3 | **X long-form articles are login-walled - stop trying to fetch the body unauthenticated** | The syndication endpoint returns tweet text + article title + preview thesis, NOT the article body. Jina/exa return the X login shell. Either accept title+thesis (doc 830 did) or import a logged-in X session cookie via the `setup-browser-cookies` skill. Do not write a doc pretending the body was read. |
| 4 | **Retire doc 564's "FIXED" claim; this doc is the current source of truth** | Doc 564 is now a historical postmortem of a fix that lasted ~3 weeks. Anyone trusting it will silently index off blocked HTML. |

## Findings - Why the inbox under-indexed

### Reddit: the gate is now double-locked (June 2026)

Two independent, simultaneous checks (per dev.to teardown 2026-06-04 + yt-dlp PR #16839 2026-05-30):

1. **IP reputation** - datacenter IPs (AWS/GCP/Hetzner) are blocked outright; residential ISP IPs pass.
2. **TLS / client fingerprint** - even from a residential IP, a plain HTTP client (`curl`, `node-fetch`, `python-requests`) gets challenged. Reddit fingerprints the TLS handshake and headers and tells a real browser from a script.

> "A datacenter IP + a real browser still 403s. A residential IP + curl still gets challenged. You need both: a residential IP and a real browser." - dev.to, 2026-06-04

**Why my run failed:** Zaal's mac is a residential IP (passes check 1), but `curl`/`exa`/`Jina` are not real browsers (fail check 2). So every rung of the ladder returned the `theme-beta` HTML shell. yt-dlp confirms `www.reddit.com` now serves a CAPTCHA and `.json` is dead for unauthenticated clients; even `old.reddit.com` now needs a session cookie obtained by first loading an HTML page.

**The fix that beats both gates: authentication.** An OAuth bearer token is checked before the IP/fingerprint heuristics bite. Application-only OAuth (no user login) is enough for reading public threads:

```bash
# One-time: create a "script" app at https://www.reddit.com/prefs/apps
#   -> yields REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET (store in ~/.zao/zao.env)

# 1. Get a 1-hour app-only token (client_credentials grant):
TOKEN=$(curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
  -u "$REDDIT_CLIENT_ID:$REDDIT_CLIENT_SECRET" \
  -A "macos:zao-inbox-fetch:v1.0 (by /u/<zaal-handle>)" \
  -d "grant_type=client_credentials" | python3 -c 'import json,sys;print(json.load(sys.stdin)["access_token"])')

# 2. Hit oauth.reddit.com (NOT www/old) with the token + same descriptive UA:
curl -s -H "Authorization: Bearer $TOKEN" \
  -A "macos:zao-inbox-fetch:v1.0 (by /u/<zaal-handle>)" \
  "https://oauth.reddit.com/r/ClaudeCode/comments/1typ8fb/.json?raw_json=1&limit=200&sort=top"
```

- Free tier: ~100 QPM (app-only). 429s carry `Retry-After`; back off, watch `X-Ratelimit-Remaining`.
- No refresh token for app-only - re-mint when the hour expires.
- The UA must be descriptive (`platform:appid:version (by /u/handle)`); generic UAs get rejected even with a valid token.

### `/s/` share links: resolve before fetch

Mobile shares look like `reddit.com/r/ClaudeCode/s/2GOWNPuOwf`. `old.reddit.com` (and even `oauth.reddit.com`) 403 on `/s/` paths. Resolve first (the 4DPocket fix, commit `01bba3d`, 2026-06-01 does exactly this):

```bash
# Follow the redirect on www.reddit.com, extract the canonical comments path, drop query:
canon=$(curl -sL -A "Mozilla/5.0 (Macintosh)" "$SHARE_URL" \
  | grep -oiE '/r/[a-zA-Z0-9_]+/comments/[a-z0-9]+/[a-z0-9_]+' | head -1)
# -> /r/ClaudeCode/comments/1typ8fb/has_anyone_actually_replaced_claude_code_codex
```

This is the manual step doc 830 used; fold it into `zao-fetch-reddit.sh` as a pre-pass whenever the URL matches `/r/[\w-]+/s/\w+`.

### X long-form articles: tweet text yes, article body no

The 2 inbox X items were X *articles* (the tweet is just a `t.co` link to `x.com/i/article/<id>`). `~/bin/zao-fetch-x.sh` tier-1 syndication (`cdn.syndication.twimg.com`) returns: author, date, fav/reply counts, tweet text, and for articles the `article.title` + `preview_text` - but NOT the body. Jina/exa on the article URL return the X login wall ("Continue with Google/Apple"). The body is gated behind a logged-in session.

Practical posture:
- **Tweets** (not articles): syndication works, keep it.
- **Articles**: either accept title + `preview_text` thesis (sufficient for inbox triage / clustering), or import a logged-in X cookie via `setup-browser-cookies` + a real browser. The X API v2 article endpoint is paid. Do not claim the body without one of those.

### The other ladder rungs, for the record

| Rung | Result on Reddit today |
|------|------------------------|
| WebFetch / `curl` www+old | `theme-beta` HTML shell (fingerprint block) |
| `~/bin/zao-fetch-reddit.sh` (doc 564) | same shell - the technique regressed |
| exa `web_fetch_exa` | `SOURCE_NOT_AVAILABLE` |
| Jina Reader (`r.jina.ai`) | 403 "blocked by network security" (datacenter IP) |
| WebSearch (`allowed_domains: reddit.com`) | "domains not accessible to our user agent" |
| Playwright MCP | extension bridge not installed |
| Wayback | no snapshot (threads <1 week old) |

Only authentication changes the outcome.

## ZAO Application

- `~/bin/zao-fetch-reddit.sh` - rewrite per Decisions 1 + 2. Add `/s/` resolve pre-pass + OAuth token mint + `oauth.reddit.com` host. Keep the HTML-shell sniff as a hard error, not a silent pass.
- `~/.zao/zao.env` - add `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` (sits beside the AgentMail/Bonfire/Supabase keys; survives repo re-clones, unlike `.env.local`).
- `/inbox` + `/zao-research` + `/fetch` skills - all call the same script, so the fix propagates automatically. Update doc 564's status line to point here.
- Fetch-quality gate (doc 693, Hard Req #11) already forces FULL/PARTIAL/FAILED marking - doc 830 obeyed it. This doc removes the reason FAILED happens at all for Reddit.

## Also See

- [Doc 564](../564-reddit-x-scraping-FIXED-implementation/) - the now-stale "FIXED" implementation this supersedes
- [Doc 562](../562-reddit-x-scraping-meta-eval-last30days/) - original block discovery + last30days eval
- [Doc 319](../319-x-twitter-scraping-tools-2026/) - X/Twitter scraping tool landscape
- [Doc 693](../693-zao-research-fetch-quality-audit/) - fetch-quality gate (FULL/PARTIAL/FAILED)
- [Doc 830](../../agents/830-ai-coding-agent-discourse-inbox-cluster/) - the under-indexed cluster that triggered this

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create Reddit script app at reddit.com/prefs/apps, put CLIENT_ID + SECRET in ~/.zao/zao.env | @Zaal | Setup | Next session |
| Rewrite ~/bin/zao-fetch-reddit.sh: /s/ resolve pre-pass + OAuth token + oauth.reddit.com | @Zaal | PR | After creds exist |
| Update doc 564 status -> "superseded by 820 for Reddit" | @Zaal | Edit | With the script PR |
| Decide X-article posture: accept thesis-only, or wire setup-browser-cookies for logged-in body | @Zaal | Decision | When an article actually needs the body |
| Re-run doc 830 cluster fetch once OAuth lands, upgrade FAILED sources to FULL | @Zaal | Research | After script PR |

## Sources

- [How we built a Reddit comment-tree scraper through a residential proxy (dev.to, 2026-06-04)](https://dev.to/james_taylor_037c857e0299/how-we-built-a-reddit-comment-tree-scraper-that-returns-upvote-scores-through-a-residential-proxy-565d) `[FULL - the two-gate diagnosis (IP + TLS fingerprint) + warm-browser-then-in-page-fetch alternative]`
- [How to Scrape Reddit Without the API after 2023 (dev.to, 2026-05-31)](https://dev.to/odeeb/how-to-scrape-reddit-without-the-api-after-the-2023-price-changes-3nhm) `[FULL - .json dies on datacenter + CORS; old.reddit HTML partial; ~250 search cap; Pushshift gone]`
- [How to Get a Reddit API Key in 2026 (hackread, 2026-06-01)](https://hackread.com/how-to-get-reddit-api-key-2026-step-by-step-guide/) `[FULL - script-app creation, client_credentials grant, 100 QPM, UA format, token POST endpoint]`
- [yt-dlp PR #16839 - work around anonymous JSON API deprecation (2026-05-30)](https://github.com/yt-dlp/yt-dlp/pull/16839) `[FULL - primary confirmation: .json dead unauth, www serves CAPTCHA, old.reddit needs session cookie]`
- [4DPocket commit 01bba3d - scrape via old.reddit HTML, handle /s/ share links, retry 403s (2026-06-01)](https://github.com/onllm-dev/4DPocket/commit/01bba3d90bb0fc894ad7433fbac84557d3e1b759) `[FULL - canonical /s/ resolve pattern + drop query string, the exact code shape for Decision 2]`
- [paradite/url-to-json-markdown - Reddit OAuth client_id/secret mode](https://github.com/paradite/url-to-json-markdown) `[FULL - reference lib showing credentialed mode is "more reliable" than UA fallback]`
- Live ladder test this session (2026-06-08) on 4 inbox Reddit threads + 2 X articles `[FULL - reproduced every block in the ladder table above]`
