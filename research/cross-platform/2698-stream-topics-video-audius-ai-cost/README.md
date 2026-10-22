---
topic: cross-platform
type: guide
status: research-complete
last-validated: 2026-10-21
superseded-by:
related-docs: cross-platform/2667-postiz-self-host-all-brands, events/2495-zaostock-facebook-promotion-17-days, infrastructure/215-obs-restream-streamyard-feature-analysis, dev-workflows/2675-claude-rate-limit-multi-tool-routing, agents/2204-cross-family-verification-99darwin-orchestrator
original-query: "can u kepe researching more on all of these topics using the seat" (Zaal, 2026-10-21, zao-media pane). Topics 10 to 12 as routed by the seat, batched into one doc: "10) Twitch features [0:23:12] (stories, clipping, Partner path), Meta Business Suite cross-posting [0:25:16], YouTube strategy across three channels [0:12:10]. 11) Audius API for the anthem in apps [1:41:15]. 12) AI coding cost and plan comparison [0:42:45], multi-model code review as audit [0:51:16]."
tier: QUICK
---

# 2698 - Three smaller stream topics, checked: video platforms, the Audius API, and what AI coding plans really give you

> **Goal:** Check the factual claims made on the 2026-10-21 B and Z Build stream about Twitch, Meta Business Suite, YouTube, the Audius API, Claude and Google AI plans, and multi-model code review. Point each one at the ZAO doc that already owns it.

This is a hub. Each row checks the stream claim with a fresh fetch, then links to the doc that already owns the topic. Stream: B and Z Build, 2026-10-21, https://www.youtube.com/watch?v=uEIT4rvgsNo. Timestamps are from its mlx-whisper transcript.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **The Claude Max multiplier is per 5-hour session, as Zaal said. His "only 2X on the weekly limit" is UNVERIFIED.** Pick the plan by how often the 5-hour limit stops you, not by the headline 20x. | claude.com/pricing (2026-10-21): Max gives "5x or 20x the usage of Pro per 5-hour session". Weekly limits are described as added "on top", with no multiplier published. The plans are Pro $20 monthly, and Max "From $100". The page says Max includes monthly API credits: $100 on Max 5x, $200 on Max 20x. Zaal's ladder ($20, $100, $200) matches [0:42:54-0:43:13]. |
| 2 | **Google AI Pro is a fair overflow plan, at $19.99 for 5 TB plus higher Antigravity limits.** Zaal's arithmetic was right. | one.google.com/about/plans: Google AI Plus is 2 TB at $9.99/mo and Google AI Pro is 5 TB at $19.99/mo. Zaal [0:44:06-0:44:17]: "I was already paying $10 for Google storage space. So it was only really $10 extra... from two terabytes to five". antigravity.google/pricing: Google AI Pro adds "More rate limits" and a "Flexible AI credit pool" over the free tier. No numbers are published. How to route lanes across tools is in doc 2675. |
| 3 | **USE the Audius API for the anthem and other ZAO tracks. ZAOOS already does.** | The public API answers at `https://api.audius.co` (`env: prod`). ZAOOS already resolves Audius URLs and builds stream URLs in `src/app/api/music/metadata/route.ts` (`${AUDIUS_API}/tracks/${track.id}/stream?app_name=...`) and `src/app/api/members/[username]/route.ts`. Audius's docs call it "a free, open, Spotify-alternative API where the music is permissionless". |
| 4 | **The anthem is on Audius, most likely as "BetterCallZaal by IMan Afrikah" (track `mOdAE2`, 142 s, on @thezaodao, 2026-07-04).** It streams through the API (HTTP 302 to a creator node). It is not downloadable and has no licence set, so ask the artist before using it in videos. | API search for "bettercallzaal". The stream's "I'm in Africa, made a banger of a song and anthem for me" [0:06:42] is very likely Whisper's spelling of IMan Afrikah. That the track Zaal meant at 1:41:15 is this one is **likely, not confirmed**. |
| 5 | **Multi-model review is already ZAO practice. No new doc.** | Zaal [0:51:16]: "the most important thing with ai coding is the ability to have multiple models reviewing code". The fresh-context evaluator lanes do this on every research PR, and cross-family verification is in doc 2204. |
| 6 | **YouTube across three channels is a strategy call for Zaal, not a research gap.** It stays an open question. | Zaal [0:12:10-0:13:12] wants to "lock in on youtube" across his own channel, the ZAO channel and ZAO Festivals, because "actual videos ai is just garbage". The blocker he names is editing time for "three... events worth of content". Nothing to fetch. |
| 7 | **Twitch "comments on stories... a new feature from like two weeks ago": UNVERIFIED.** | Stories itself dates from 2023 (Tubefilter, 2023-10-17). One search found no dated 2026 item about comments on stories. Twitch's blog returned an unreadable page to curl. The Partner path named in the topic list was not discussed in the transcript windows read. |
| 8 | **Meta Business Suite cross-posting: already covered.** | Ohnahji [0:25:16-0:25:45] likes it for posting to both Facebook and Instagram for the ZAO Festivals accounts. Cross-posting for all brands is in doc 2667 (Postiz) and the ZAOstock Facebook push in doc 2495. |

## What this means for The ZAO

Nothing in these three topics needs a new build. The Audius music path is already in ZAOOS. Multi-model review is already how the lanes work. The plan question comes down to one fact Anthropic does publish: the 20x is per 5-hour session. The open items are Zaal's: YouTube focus, and permission to use the anthem in videos.

## Also See

- [Doc 2667 - Postiz for all brands](../2667-postiz-self-host-all-brands/)
- [Doc 2495 - ZAOstock Facebook promotion](../../events/2495-zaostock-facebook-promotion-17-days/)
- [Doc 215 - OBS, Restream, StreamYard features](../../infrastructure/215-obs-restream-streamyard-feature-analysis/)
- [Doc 2675 - Claude rate limits and multi-tool routing](../../dev-workflows/2675-claude-rate-limit-multi-tool-routing/)
- [Doc 2204 - cross-family verification](../../agents/2204-cross-family-verification-99darwin-orchestrator/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ask IMan Afrikah whether "BetterCallZaal" may be used in ZAO videos, and say which track played at 1:41. Shipped when the answer is in this doc | Zaal | Message (outbound, his tap) | 2026-10-28 |
| Decide the YouTube focus: which of the three channels gets the first edited series. Shipped when the choice is on the board | Zaal | Decision | 2026-11-04 |
| Add the Max plan's monthly API credits ($100 or $200) to doc 2675's plan table, since they change the overflow maths. Shipped when the PR merges | bandzbuilds lane | PR | 2026-10-28 |

## Sources

- B and Z Build, 2026-10-21, https://www.youtube.com/watch?v=uEIT4rvgsNo, local mlx-whisper transcript, windows 0:11:50 to 0:13:25, 0:23:00 to 0:26:40, 0:42:30 to 0:45:00, 0:51:00 to 0:52:50, 1:40:40 to 1:41:30 [FULL]
- https://claude.com/pricing [FULL - WebFetch]
- https://support.claude.com/en/articles/11014257-about-claude-s-max-plan-usage [FAILED - HTTP 404 to WebFetch and to curl; the pricing page replaced it]
- https://one.google.com/about/plans [FULL - WebFetch]
- https://antigravity.google/pricing [FULL - WebFetch]
- https://api.audius.co (root, `/v1/tracks/search`, `/v1/tracks/mOdAE2`, `/v1/tracks/mOdAE2/stream`) [FULL - curl, raw JSON and the 302]
- https://docs.audius.co/developers/api [PARTIAL - curl and strip, 1,656 characters of text; the intro line quoted, no key or rate-limit text found]
- https://tubefilter.com/2023/10/17/twitch-hopes-its-new-story-feature-will-help-creators-audience-build-on-platform/ [PARTIAL - search result summary only; used only to date Stories to 2023]
- https://blog.twitch.tv/en/ [FAILED - 9,367 bytes of unreadable content to curl, with and without --compressed]
- ZAOOS `src/app/api/music/metadata/route.ts` and `src/app/api/members/[username]/route.ts` at origin/main [FULL]
