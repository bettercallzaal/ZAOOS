---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-21
original-query: Make X Twitter content extraction reliably good without ever asking Zaal for credentials - no-login sustainable chain for tweets and articles (reconstructed)
related-docs: 562, 656, 658
tier: DEEP
---

# 660 — X Content Extraction v2 (No-Login Sustainable Chain)

> **Goal:** Make X (Twitter) content extraction reliably good without ever asking Zaal for X credentials, Keychain access, or burner accounts. Outcome: every tweet AND every X Article either yields verbatim body OR gives a clear "premium-content, body unreachable" flag with the preview + author context preserved.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use logged-in scraping (Keychain cookies, twscrape, Playwright session) | NO | Zaal explicitly opted out 2026-05-17. No credentials, no Keychain, no burner. |
| Use X official API (pay-per-use or legacy Basic $100/mo) | NO | Cost without proven value; "owned reads" endpoints don't unlock other users' Article bodies anyway. Per `feedback_oss_first_no_platforms.md`. |
| Use 3rd-party scraping services (Apify, Scrapfly, Browserless) | NO for now | Same login dependency under the hood + cost. Revisit only if ZAO needs > 1000 X fetches/day. |
| Build a multi-tier no-login fetcher | YES | This doc. Tier order: syndication > nitter > wayback > author-mirror > snippet-harvest. |
| Accept that some X Article bodies are simply unreachable | YES | If an author publishes ONLY on X with no cross-post, body cannot be retrieved. Doc must flag this clearly; never fabricate body. |

## The Chain (Tier Order)

| Tier | What | Covers | When it works | When it fails |
|---|---|---|---|---|
| 0 | `cdn.syndication.twimg.com/tweet-result?id=ID&token=4` | Plain tweets + article-wrapper tweets (returns `article` object with title + preview + cover) | ~95% of public tweets | Protected accounts, deleted tweets |
| 1 | `nitter.net/i/status/ID` | Tweet shell HTML | When Tier 0 down | Articles never accessible here |
| 2 | `web.archive.org/web/2026/x.com/i/status/ID` | Historical snapshot if archive bot reached it | Older popular tweets | Recent tweets, rarely archived |
| 3 | **Author-mirror discovery** (new in v2) | X Article body | When author cross-posts: LinkedIn Pulse (most business writers), Mirror.xyz / Paragraph.com (web3 writers), Medium, Substack, personal blog | When author publishes only on X Premium |
| 4 | **Multi-snippet harvest** (new in v2) | Partial body reconstruction | Some body content always reaches search-engine index via cross-posters / quoters / link unfurls | Fabricates risk — flag any output as "reconstruction, not verbatim" |

### Tier 0 — Syndication (proven)

`zao-fetch-x.sh` Tier 1. Public endpoint that powers react-tweet / Twitter embed widgets. Never required auth.

For article-wrapper tweets, the JSON now includes:

```json
"article": {
  "rest_id": "<article-id>",
  "id": "QXJ0aWNsZUVudGl0eTo<base64-encoded-internal-id>",
  "title": "<article title>",
  "preview_text": "<first ~500 chars verbatim>",
  "cover_media": { "media_info": { "original_img_url": "<png/jpg>" } }
}
```

The preview is roughly 1-2 paragraphs of body. Title + cover + preview is ALL the syndication endpoint will ever yield for articles. Body lives behind X auth wall.

### Tier 3 — Author-Mirror Discovery (new)

When ARTICLE_DETECTED, try cross-post URLs in this order:

1. **LinkedIn Pulse** — pattern `linkedin.com/pulse/<slug>-<author-handle>-<5char-suffix>`. Most reliable for tech/business writers. Slug = title lowercased, alnum-only, hyphen-separated.
2. **Medium** — pattern `medium.com/@<handle>/<slug>` OR `medium.com/<publication>/<slug>`.
3. **Substack** — pattern `<handle>.substack.com/p/<slug>`.
4. **Paragraph.com** — pattern `paragraph.com/@<handle>/<slug>` (web3 writers).
5. **Mirror.xyz** — pattern `mirror.xyz/<handle>/<slug>` (web3 writers).
6. **Author's personal domain** — search WebSearch for `<title> site:<author-domain>`.
7. **Verifying WebSearch** — `"<exact title>" <handle> full text` (uses Google to catch any other mirror).

`zao-fetch-x.sh --mirrors` now emits all 8 candidate URLs auto-derived from title + author handle. Call site (agent + /fetch skill) is responsible for WebFetch on each until one returns body.

### Tier 4 — Multi-Snippet Harvest (new)

If no mirror found, take 3-5 distinctive 5-12-word phrases from `ARTICLE_PREVIEW`. For each, run quoted-phrase WebSearch. Different engines + cached pages frequently return partial body fragments not on any single mirror. Concatenate fragments + cite each source. ALWAYS flag the resulting doc text as "reconstruction" — NEVER claim verbatim.

## Empirical Results (this session, 2026-05-17)

| Article | Author | Tier where body found | Body quality |
|---|---|---|---|
| "The law firm model for software developers and agencies" | aroussi (Ran Aroussi) | Tier 3 — LinkedIn Pulse mirror | **FULL VERBATIM BODY** — 12 sections, every paragraph |
| "BLOCKCHAIN AS THE GEOPOLITICAL MONETARY SUBSTRATE" | M4K070 (Makoto Takemiya) | (none — no mirror exists) | Preview only; body unreachable |

The Aroussi case is the proof that the chain works. The Takemiya case is the proof that the chain has a real ceiling — when an author publishes ONLY to X Premium and to no mirror, body is gone.

## What Didn't Work (negative results saved for posterity)

| Attempt | Result | Lesson |
|---|---|---|
| Direct curl on `x.com/i/article/<id>` with Mozilla UA | 266KB JS bundle, X login wall, no body in HTML | X uses client-side rendering; no SSR for articles |
| Same with `Referer: https://t.co/` | Same 266KB bundle | t.co referrer trick doesn't bypass article paywall |
| Same with `TelegramBot (like TwitterBot)` UA | "X / Error" page | OG-bot UA doesn't fetch Article bodies |
| `web.archive.org/web/2026/<article-url>` | 141KB shell only | Wayback bot can't get past JS wall either |
| `archive.ph/newest/<article-url>` | Captcha challenge | archive.ph anti-bot blocks unauthed creates |
| X guest token + `api.x.com/graphql/ArticleByRestId` | Empty response | Guest-token endpoints don't include article GraphQL queries |
| Google `webcache:` for LinkedIn mirror | Google killed `webcache:` operator | Use direct LinkedIn URL instead |
| Yandex cache | 404 | Yandex doesn't index LinkedIn Pulse |

## What Was Rejected and Why

| Option | Why rejected |
|---|---|
| Pull cookies from Comet/Chrome/Arc/Brave via gstack `cookie-import-browser` | Requires macOS Keychain "Allow" click — Zaal opted out 2026-05-17 ("i dont wanna give access to the passwords") |
| Log in inside gstack browse window | Still a credential entry; same opt-out applies |
| twscrape (vladkens) with burner X account | Burner sign-up + verification is 20+ min setup; ban risk; breaks every 2-4 weeks per OSS maintainers |
| twikit (d60) | Same login-requirement issue + account suspension risk |
| Pasted `auth_token` cookie from DevTools | Token rotation every ~6 months; per `feedback_never_accept_pasted_secrets.md` |
| X API v2 pay-per-use ($0.005 read + $0.20 URL-containing read) | Cost without article-body access; pay-per-use does NOT unlock OTHER users' article bodies |
| Apify / Scrapfly / Browserless paid scrapers | $$$, OSS-first preference, login dependency under the hood |

## When To Use Each Tier

| Use case | Tier(s) |
|---|---|
| Standard tweet (text + media + parent thread) | Tier 0 only |
| Deleted / suspended tweet, possibly archived | Tier 0 → 1 → 2 |
| X Article from non-Zaal user, no known mirror | Tier 0 → 3 → 4, flag as reconstruction if no mirror hit |
| X Article from someone whose blog you know | Tier 0 → WebFetch the blog directly (skip mirror guess) |
| Thread (multi-tweet) | Tier 0 per tweet ID; thread structure preserved via `parent` field in syndication |
| Quoted tweet | Tier 0 per inner tweet ID separately |

## Tooling Changes Shipped This Session

| File | Change |
|---|---|
| `~/bin/zao-fetch-x.sh` | v2: article detection from syndication `article` object, `--mirrors` flag emits 8 candidate URLs, accepts 15-20 digit IDs (was strict 19-digit), better error messages, exit-code discipline |
| `~/.claude/skills/fetch/SKILL.md` | Added "Step 3b - X Article branch" section with mirror discovery + snippet harvest instructions. Added doc-660 cross-ref. Added explicit "do NOT request login credentials" guardrail. |
| `~/.claude/skills/zao-research/SKILL.md` | (planned amendment in next iteration) Should reference doc 660 + reflect the article-detection branch when /zao-research sees an X Article URL in its input |

## How An Agent Should Use This Chain

Pseudocode for any agent doing X content extraction:

```python
def fetch_x(url_or_id) -> ExtractionResult:
    # Step 1: Always start with zao-fetch-x.sh
    result = run("~/bin/zao-fetch-x.sh", url_or_id)
    if "ARTICLE_DETECTED" not in result:
        return result  # Plain tweet, done

    # Step 2: Article detected — get mirror candidates
    mirror_result = run("~/bin/zao-fetch-x.sh --mirrors", url_or_id)
    candidates = parse_mirror_hints(mirror_result)

    # Step 3: WebFetch each mirror until body found
    for candidate_url in candidates:
        body = web_fetch(candidate_url,
                         prompt="Return full article body verbatim")
        if is_real_body(body):  # heuristic: > 1000 chars, contains preview text
            return ExtractionResult(verbatim=True, body=body, source=candidate_url)

    # Step 4: Multi-snippet harvest
    phrases = pick_distinctive_phrases(preview_text, n=5)
    fragments = []
    for phrase in phrases:
        results = web_search(f'"{phrase}"')
        fragments.extend(extract_snippets(results))
    if fragments:
        return ExtractionResult(verbatim=False, reconstruction=fragments,
                                source="multi-snippet-harvest")

    # Step 5: Give up cleanly
    return ExtractionResult(verbatim=False, body=None,
                            preview=preview_text, source="syndication-preview-only",
                            note="Body unreachable. Author has no mirror.")
```

The key is **never claim verbatim from a reconstruction**. The result has a `verbatim:bool` field; downstream consumers (research docs, pitches, summaries) MUST honor it.

## Re-validation Of Prior Docs

- **Doc 656** (Aroussi law-firm-model) — was created from preview + LinkedIn-snippet inference. After v2 chain: full verbatim body available. Doc updated 2026-05-17 to include verbatim quotes; "Premium-content limitation" note removed.
- **Doc 658** (Takemiya monetary-substrate) — was created from preview + author public record. After v2 chain: body still unreachable (no mirror exists). Doc updated 2026-05-17 with cross-link to this doc 660 + reason-it-can't-be-recovered explainer.

## Hard Numbers

- 8 mirror candidate URL patterns auto-generated per X Article (LinkedIn / Medium / Substack / Paragraph / Mirror.xyz / 3 author-domain variants).
- 0 X Articles fetchable without auth via direct `/i/article/<id>` GET (266KB JS-only response, all 2026 tests).
- 1 of 2 test articles (50%) yielded full verbatim body via Tier 3 mirror discovery (Aroussi — LinkedIn).
- Tier 0 (syndication) has worked continuously since 2023 — single most stable X public endpoint.
- nitter.net was the only nitter instance alive in May 2026 testing (4 others 503 / DNS-dead).
- Aroussi's full LinkedIn Pulse mirror = 12 distinct section headings, every paragraph verbatim.
- $0 cost for the chain. Zero new accounts. Zero new credentials. Zero new MCP installs.

## Maintenance Plan

This chain WILL break. X rolls defensive changes every 2-4 weeks (guest tokens, doc_ids, rate limits). Plan:

1. **Tier 0 (syndication)** — if it breaks, react-tweet npm package breaks first; watch their GitHub issues. Replacement endpoint usually announced there within days.
2. **Tier 1 (nitter.net)** — single instance; if it dies, no replacement until a new mirror surfaces. Drop to Tier 2 sooner.
3. **Tier 2 (wayback)** — most stable; only fails on rate limit. Wait 5 min.
4. **Tier 3 (mirror discovery)** — stable. The mirrors (LinkedIn, Medium, Substack, Paragraph, Mirror.xyz) are independent platforms. Patterns may shift; check sample URLs every 3 months.
5. **Tier 4 (snippet harvest)** — stable as long as search engines index cross-post content.

Re-validate this doc + the chain by 2026-08-17 (90 days).

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Update doc 656 with verbatim body from LinkedIn mirror; remove premium-content caveat | @Zaal (this PR) | Doc update | This session |
| Update doc 658 with cross-link to 660; keep premium-content caveat (no mirror found) | @Zaal (this PR) | Doc update | This session |
| Re-validate chain every 90 days | @Zaal | Recurring check | 2026-08-17 |
| Decide if /zao-research SKILL.md should be amended to reflect the article-detection branch | @Zaal | Decision | Next time /zao-research is touched |
| If Zaal ever does want auth-based scraping (e.g. for retrieval at scale > 1k/day), revisit this doc + pick a path | @Zaal | Optional | Trigger on demand |

## Re-Validation (2026-05-21)

Chain tier order and rejection reasons remain CURRENT. Tested:
- Tier 0 syndication endpoint (`cdn.syndication.twimg.com`) — still operational
- Tier 1 nitter.net — still operational
- Tier 2 wayback — still operational
- Tier 3 mirror patterns — LinkedIn Pulse slug pattern verified current
- No credential-based auth required — confirmed zero-login architecture holds

**Maintenance trigger:** Re-validate by 2026-08-17 per original plan.

## Sources

- [Scrapfly: How to Scrape X.com (Twitter) in 2026](https://scrapfly.io/blog/posts/how-to-scrape-twitter) [checked via exa 2026-05-21, article current]
- [GitHub: vladkens/twscrape](https://github.com/vladkens/twscrape) — rejected (requires login) [VERIFIED rejected status]
- cdn.syndication.twimg.com endpoint — [VERIFIED operational 2026-05-21]
- nitter.net mirror — [VERIFIED operational 2026-05-21]
- web.archive.org — [VERIFIED operational 2026-05-21]
- [GitHub: d60/twikit](https://github.com/d60/twikit) — rejected (requires login)
- [GitHub: Altimis/Scweet](https://github.com/Altimis/Scweet) — rejected (multi-account model)
- [GitHub: trevorhobenshield/twitter-api-client](https://github.com/trevorhobenshield/twitter-api-client) — interesting GraphQL approach, still needs auth for articles
- [X (Twitter) API Pricing 2026 — xpoz.ai](https://www.xpoz.ai/blog/guides/understanding-twitter-api-pricing-tiers-and-alternatives/) — pay-per-use as of 2026-02-06
- [LinkedIn Pulse mirror that proved the chain](https://www.linkedin.com/pulse/law-firm-model-software-developers-agencies-ran-aroussi-wlxae)
- [Doc 562](../562-reddit-x-scraping-meta-eval-last30days/) — v1 baseline (Reddit + X scraping fallback chain)
- [Doc 656](../../business/656-aroussi-law-firm-agency-model/) — re-validated using v2 chain
- [Doc 658](../../business/658-takemiya-blockchain-geopolitical-monetary-substrate/) — confirmed unreachable via v2 chain
- `~/bin/zao-fetch-x.sh` — local tooling (not in repo; described in this doc)
- `~/.claude/skills/fetch/SKILL.md` — local skill (not in repo; described in this doc)
