---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-09
related-docs: 2213, 2239, 2244, 2135, 2136, 319, 822, 1089
original-query: "how do i improve the zoe do deep research i want the zoe to make me a new agent with the best stuff possible right now to help me with my bettercallzaal x account"
tier: DEEP
---

# 2651 - An X desk for @bettercallzaal, built into ZOE

> **Goal:** Decide the best agent we can build right now to help Zaal run his
> personal X account, @bettercallzaal, grounded in what ZOE already has and in
> X's platform rules and prices as of 2026-10-09.

Reddit was not reachable on any route this run (Arctic Shift returned 522
twice, `zao-fetch-reddit.sh` has no OAuth file, reddit's own JSON returned a
403 block page). Community signal below comes from the X developer forum and
Hacker News only. Read the community findings with that gap in mind.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **BUILD it as a ZOE capability, the "X desk", not a new bot.** It gets its own persona block and worker modules under `bot/src/zoe/`, reached from the same Telegram DM. | CLAUDE.md: "no new bots without doc", and new voices are "a persona block in ZOE's runtime memory ... NOT a new bot." ZOE already has the draft, judge and button machinery (`bot/src/zoe/posts/`, 1,708 lines across 13 files). |
| 2 | **Human tap on every post, forever.** The desk drafts. Zaal posts. | X Developer Policy: services that post "must follow the Automation Rules", including "Always get explicit consent before sending people automated replies". A tapped draft is a person posting, so the account stays a human account and needs no bot label. |
| 3 | **Phase 1 needs no X API, no money and no new credentials. Paste an X link into the ZOE DM, get three reply drafts in Zaal's voice with Copy buttons, and post from the X app.** | Since Feb 2026, API replies "will only be permitted if the replier has been explicitly summoned by the original post's author". So the API cannot post most of the replies Zaal would want anyway. Reading a public post is keyless: the app already has `fetchXContent` in `src/lib/scrape/x-fetch.ts` (FxTwitter, then syndication). Phase 1 reuses it rather than writing a third reader. |
| 4 | **Phase 2 adds a mentions inbox through the official API, only after Zaal funds a pay-per-use app for @bettercallzaal.** | Reading your own mentions is an "Owned Read" at $0.001 per resource. Replying to a mention is a summoned reply at $0.010. Both are cheap. Funding the app is money and a credential, so it is Zaal's step. |
| 5 | **Do not wire the existing POST button to @bettercallzaal. It posts somewhere else.** | `src/lib/publish/x.ts` lines 125, 132 and 247 hardcode `https://x.com/thezao/status/<id>`. The comment in `bot/src/zoe/posts/buttons.ts` line 236 says "Not Zaal's personal X". Which account the app's tokens actually belong to is UNKNOWN from code, and only Zaal can confirm it. |
| 6 | **Learn the voice from Zaal's own posts and his taps.** Seed it now from `scrapeXUserTimeline` in `src/lib/scrape/x-timeline.ts`, which returns roughly his latest 100 posts with no login and no key, then deepen it with his X archive export. Then use every Copy, Edit and Skip as the signal for which drafts work. | The one reply-bot design worth copying says "The model never decides *who* to reply to", meaning targets are chosen by rules and the model only writes. The voice comes from his real posts, not a generic prompt. 46.4K posts exist to learn from (doc 2136, measured 2026-07-29). |
| 7 | **SKIP scraper clients (twikit, twscrape, browser-driven posting) and SKIP Postiz for this.** | A reply-bot README warns its browser-posting path "can violate the X Terms of Service and may get accounts suspended". Postiz is AGPL-3.0 and a whole platform, which is too heavy for one founder account. |
| 8 | **Let the desk's messages through ZOE's send budget.** | The repo default is `DEFAULT_DAILY_SEND_CAP = 20` (`bot/src/zoe/send-budget.ts` line 197), but the running bot reads `ZOE_DAILY_SEND_CAP=3`. Receipt: `/proc/<MainPID>/environ` on the VPS, read 2026-10-09T20:25:12Z. In `journalctl --user -u zoe-bot` from 2026-10-08 09:00 to 2026-10-09 09:00 there are 52 `[zoe/send-budget] deferred` lines (33 digest, 19 status) and 2 `relay from zaalpanthaki deferred by send budget` lines, also read 2026-10-09T20:25Z. A reply draft that arrives tomorrow morning is useless, so desk cards must count as `reply`, not `status`. This is the same fix as the parked talk-budget thread. |

## What ZOE already has (read from origin/main 96b677c1c, 2026-10-09)

| Piece | Where | State |
|---|---|---|
| Post slate: drafters, best-of judge, POST/REGEN/SKIP buttons | `bot/src/zoe/posts/` (`drafters.ts`, `select-best.ts`, `buttons.ts`) | Live. Drafts for Firefly cross-post, 280-char cap, voice rules in `SHARED_VOICE` (`drafters.ts` line 9) |
| Real publish behind a flag | `bot/src/zoe/posts/publish.ts`, calls `POST /api/publish/compose` | Built, flag `ZOE_POST_PUBLISH` OFF. Receipt, read by ssh on 2026-10-09 before 20:25Z (the exact time was not stamped): `grep -cE '^(X_|TWITTER)' ~/zao-bot-live/bot/.env` printed 0, and `grep -cE '^TELEGRAM|^ZOE_'` on the same file printed 25 as the positive control. A check of the running process environment at 20:25Z also found 0 `X_*` names, but that check proves less because the TELEGRAM control also read 0 there (the bot loads `.env` itself) |
| X client and metrics | `src/lib/publish/x.ts`, `src/lib/publish/x-insights.ts` (ZAOOS app, not the bot) | OAuth 1.0a, "shared ZAO app account". The URL is hardcoded to @thezao |
| `twitter-api-v2` | root `package-lock.json` pins 1.29.0; npm latest is 1.29.1 (published 2026-08-04, Apache-2.0) | **Not in `bot/package.json`** (grep count 0). Phase 2 adds it to the bot, which is a new dependency and an ask-first item |
| Keyless X read (ZAOOS app) | `src/lib/scrape/x-fetch.ts` (`fetchXContent`: one post or article, FxTwitter then syndication) and `src/lib/scrape/x-timeline.ts` (`scrapeXUserTimeline`: about the latest 100 posts of a handle, syndication embed). Callers: `src/lib/scrape/bcz-profile.ts`, `src/lib/scrape/index.ts` | **Reuse.** Phase 1 reads links with `fetchXContent` and seeds voice from `scrapeXUserTimeline`. Both sit in the app tree, not `bot/src`, so the build shares or ports them rather than writing new ones. Also: the FxTwitter route in `research-worker.md`, and `~/bin/zao-fetch-x.sh` on the Mac |
| Voice and brand | `bot/src/zoe/brand.md` (112 lines), `SHARED_VOICE`, global no-emoji and no-em-dash rules | Reuse. Do not write a second voice file |
| Reading @bettercallzaal **mentions** | none found | Scope: a grep of `bot/src` for twitter, x.com, mentions and fxtwitter, plus a grep of `src` and `bot/src` for `userMentionTimeline` and `/mentions` (0 files). The only X readers are the two scrape modules above. They read timelines and single posts, not mentions, and mentions need login or the API. This is the real gap. (Corrected after review: an earlier version said timeline reads were also missing, from a search of `bot/src` alone) |

## Findings: the X platform as of 2026-10-09

| Finding | Source |
|---|---|
| The API is pay-per-use only: "The X API uses pay-per-usage pricing with no subscriptions." | docs.x.com pricing [FULL] |
| Post create costs $0.015. With a URL it costs $0.200. A summoned reply costs $0.010. | docs.x.com pricing [FULL] |
| Owned Reads (your own mentions, posts, bookmarks) cost "$0.001 per resource (1,000 resources for $1)". | docs.x.com pricing [FULL] |
| Pay-per-use is capped at 3 million post reads per month. | docs.x.com pricing [FULL] |
| Since Feb 2026, API replies are blocked unless the author mentioned or quoted the replier. This covers "legacy Free, Basic, Pro subscriptions, and Pay-per-use packages". | devcommunity topic 257909, staff post [FULL] |
| Forum staff say a mention-only bot that is labelled and sends no unsolicited replies "generally fits within the automation guidelines". This is a staff forum reply, not policy text. | devcommunity topic 277704 [FULL] |
| For You ranking weights committed on main: reply 5.0, quote 5.0, share 2.0, repost 1.0, like 0.5, link open 0.2, report -234.0. These are the committed values, not proven production values. | xai-org/x-algorithm `param.rs` [FULL] |
| Posts older than 48 hours are filtered out before scoring. Out-of-network replies are discounted. | xai-org/x-algorithm README [FULL] |
| No Premium boost and no long-post weight were found in the README or `param.rs`. Scope: those two files. | same [FULL] |
| New pay-per-use apps report 401, 403 and 500 errors on OAuth 1.0a and on posting (topics 273823, 274069, 276108). Each is one user report. | devcommunity [FULL] |

What this means for drafting: replies and quotes carry ten times the committed
weight of a like, so a draft that invites a real reply is worth more than one
that only collects likes. A link costs $0.200 to post through the API and has a
low committed weight (0.2), so put links in a self-reply or post them by hand.
The 48-hour filter means a draft for a conversation that is two days old is a
wasted draft.

## Options compared

| Option | Stars (2026-10-09) | Last push | Licence (from LICENSE file) | Verdict |
|---|---|---|---|---|
| ZOE X desk on `twitter-api-v2` (this doc) | 1,556 (the library) | 2026-08-04 | Apache-2.0 | **USE.** Official API, TypeScript, already used by the app |
| elizaOS `plugins/plugin-x` | 19,558 (eliza repo) | 2026-10-09 | MIT | SKIP as a dependency, because it is a whole agent OS. Copy its stance: "Autonomous posting/actions are opt-in" |
| GenAIwithMS/twitter-mcp | 25 | 2026-10-01 | MIT | Reference only. Never give the drafting model its post tools |
| rafaljanicki/x-twitter-mcp-server | 35 | 2026-05-24 | MIT | Reference. Uses API keys, "avoiding the username/password hack to minimize the risk of account suspensions" |
| twikit / twscrape | 4,717 / 2,848 | 2026-03-10 / 2026-10-05 | MIT / MIT | SKIP. Scraping X's internal API puts a founder account at risk |
| slightlyuseless/ai-twitter-crypto-reply-bot | 41 | 2026-06-25 | MIT | SKIP its browser posting. **Copy its rule:** targets are scored by rules and the model only writes |
| Typefully MCP (pepuscz) | 6 | 2025-09-23 | MIT | SKIP for now. It adds a paid third-party queue we do not need |
| Postiz | 36,938 | 2026-10-09 | AGPL-3.0 | SKIP. Heavy and share-alike (doc 1089 covers it for multi-platform scheduling) |

## The design

```
 Zaal's phone (ZOE DM)
   |  paste an x.com link            |  /x  (mentions, Phase 2)
   v                                 v
 x-desk/read.ts  -- FxTwitter (free) / owned read $0.001 (Phase 2)
   |
 x-desk/pick.ts  -- rule-based: age < 48h, not already answered, author tier
   |
 x-desk/draft.ts -- Claude CLI, voice = brand.md + SHARED_VOICE + top approved examples
   |
 Telegram card: 3 drafts  [Copy 1] [Copy 2] [Copy 3] [Edit] [Skip]   (send class: reply)
   |
 Zaal posts in the X app (Phase 1)  or  [Post] -> summoned reply $0.010 (Phase 2, own app)
   |
 x-desk/learn.ts -- log copy/edit/skip; weekly: x-insights on his own posts
```

Biological map (doc 2239's organism): this is the Mouth growing a second voice.
The Eyes (`read.ts`) see a conversation. The Cortex (`draft.ts`) proposes words.
The human hand is the only muscle that moves them out.

Cost estimate from the published unit prices, Phase 2 only: 3,000 mention reads
a month is $3.00, and 100 summoned replies a month is $1.00. Phase 1 costs
nothing on X, and drafting runs on Claude Max through the CLI that the posts
slate already uses.

## Gates (Zaal's, not the lane's)

1. **Approve this doc as the "new agent" doc.** It is a ZOE capability, so no new bot process.
2. **Your fact:** which X account do the ZAOOS app's `X_ACCESS_TOKEN` credentials post as? The code hardcodes @thezao in the URL.
3. **Your fact and your hand, optional for phase 1:** request your X archive (Settings, Your account, Download an archive). It seeds the voice examples. The archive holds DMs too, so it goes to `~/.zao/private/` and never into a repo.
4. **Money and credential (Phase 2):** a pay-per-use X developer app on @bettercallzaal, a spending limit, and its tokens in a mode-600 env file on the VPS.
5. **Send budget:** the desk needs the `reply` class, which is in code, or a higher `ZOE_DAILY_SEND_CAP`, which is your env.

## Also See

- [2213 agentic social posting](../2213-agentic-social-posting-deep-research/) - the draft-approve-post pattern, verified in code
- [2239 ZOE capability map](../2239-zoe-capability-map/)
- [2244 posting platform decision](../../cross-platform/2244-posting-platform-decision/)
- [2135 media channels inventory](../../cross-platform/2135-zaal-media-channels-inventory/)
- [2136 Zaal deep profile](../../identity/2136-zaal-deep-profile-social-brands/) - @bettercallzaal 4,990 followers, 46.4K posts as of 2026-07-29
- [319 X scraping tools](../../dev-workflows/319-x-twitter-scraping-tools-2026/), [822 X without login](../../dev-workflows/822-x-scraping-without-login/)
- [1089 Postiz](../../infrastructure/1089-postiz-social-api-clip-engine/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Approve or decline this doc as the X desk spec. Shipped means a ruling recorded on the board card | @Zaal | decision | 2026-10-12 |
| Build Phase 1: link-to-three-reply-drafts in the ZOE DM behind `ZOE_X_DESK=1` (default off), with a red control and tests. Shipped means a PR is open | zoe lane | PR | 2026-10-12, after approval |
| Classify X desk cards and Zaal's relays as the `reply` send class. Shipped means a PR is open | zoe lane | PR | 2026-10-12 |
| Request the X archive and save it to `~/.zao/private/` | @Zaal | his hand | 2026-10-16 |
| Confirm which handle the ZAOOS X tokens post as. Shipped means the answer is written on the card | @Zaal | his fact | 2026-10-12 |
| Phase 2 (mentions inbox): fund the pay-per-use app, then PR the reader. Shipped means a PR is open | @Zaal, then zoe lane | money, then PR | wontfix until gate 4 is done |
| Re-run the Reddit sentiment pass once `~/.zao/private/reddit.env` exists | zoe lane | research | wontfix until the credential exists |

## Sources

Raw copies were saved during research to the session scratchpad. Methods: curl
plus an HTML strip, official JSON APIs, and `gh api`.

- Liveness re-check at commit time, 2026-10-09: docs.x.com and github.com returned 200. devcommunity.x.com returned 403 to curl for both the HTML and the .json form, so its topic links could not be re-verified at commit. They were read as Discourse JSON earlier in the same run, and the raw copies are in the scratchpad.
- [X API pay-per-use pricing](https://docs.x.com/x-api/getting-started/pricing) [FULL, curl+strip]
- [X Developer Policy](https://developer.x.com/en/developer-terms/policy) [FULL, curl+strip]
- [X API v2 update: addressing LLM-generated spam, topic 257909](https://devcommunity.x.com/t/257909) [FULL, Discourse JSON]
- [Mention-only AI reply bot, staff answer, topic 277704](https://devcommunity.x.com/t/277704) [FULL, Discourse JSON]
- [Topic 277741](https://devcommunity.x.com/t/277741), [277743](https://devcommunity.x.com/t/277743), [277749](https://devcommunity.x.com/t/277749), [262170](https://devcommunity.x.com/t/262170), [262681](https://devcommunity.x.com/t/262681), [260565](https://devcommunity.x.com/t/260565), [277689](https://devcommunity.x.com/t/277689) [FULL, Discourse JSON]
- [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) and [param.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/params/param.rs) [FULL, curl; main branch at fetch time]
- [twitter-api-v2 on npm](https://registry.npmjs.org/twitter-api-v2) [FULL, registry JSON], [plhery/node-twitter-api-v2](https://github.com/plhery/node-twitter-api-v2) [FULL, gh api + LICENSE]
- [elizaos/eliza plugins/plugin-x](https://github.com/elizaos/eliza/tree/main/plugins/plugin-x) [FULL, gh api README + package.json]
- [GenAIwithMS/twitter-mcp](https://github.com/GenAIwithMS/twitter-mcp), [rafaljanicki/x-twitter-mcp-server](https://github.com/rafaljanicki/x-twitter-mcp-server), [EnesCinr/twitter-mcp](https://github.com/EnesCinr/twitter-mcp), [mbelinky/x-mcp-server](https://github.com/mbelinky/x-mcp-server) [PARTIAL, README first 60 lines; metadata and LICENSE FULL]
- [d60/twikit](https://github.com/d60/twikit), [vladkens/twscrape](https://github.com/vladkens/twscrape) [PARTIAL, README head; metadata and LICENSE FULL]
- [slightlyuseless/ai-twitter-crypto-reply-bot](https://github.com/slightlyuseless/ai-twitter-crypto-reply-bot) [PARTIAL, README head; quotes taken from the fetched part]
- [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) [FULL README, gh api]
- [pepuscz/typefully-mcp-server](https://github.com/pepuscz/typefully-mcp-server) [PARTIAL, README head]
- [HN 40236859, reply AI dissent](https://news.ycombinator.com/item?id=40236859) [FULL, Algolia API]: "Reddit is the most astroturfed place on the internet"
- [HN 44168058, AI ghostwriter voice](https://news.ycombinator.com/item?id=44168058) [FULL, Algolia API]
- [HN 46922158, X API pay-per-use launch](https://news.ycombinator.com/item?id=46922158) [FULL, Algolia API; 2 points, thin]
- [X Automation Rules](https://help.x.com/en/rules-and-policies/x-automation) [FAILED, curl 403 and exa unavailable. The rules text is UNVERIFIED; the Developer Policy above quotes its key duties]
- [X AI-generated content policy](https://help.x.com/en/rules-and-policies/ai-generated-content) [FAILED, curl 403]
- Reddit (r/webdev, r/micro_saas, r/vibecoding threads on X API cost and reply tools) [FAILED, Arctic Shift 522, no OAuth, reddit 403. Exa snippets were seen but are not quoted here]
- ZAOOS code at origin/main 96b677c1c: `bot/src/zoe/posts/*`, `src/lib/publish/x.ts`, `bot/src/zoe/.claude/agents/research-worker.md`, `package-lock.json` [FULL, read directly]
- VPS `~/zao-bot-live/bot/.env` variable names only, 2026-10-09 [FULL, ssh grep with a positive control]
