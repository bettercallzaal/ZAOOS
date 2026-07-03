---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-03
superseded-by:
related-docs: 942, 896, 863, 897, 898
original-query: "DEEP. H2 2026 growth plan: take the ZAO/ZABAL content engine from today's footprint to 100,000 total people reached by Dec 31 2026, across ALL surfaces combined: the daily Paragraph newsletter (Year of the ZABAL, paragraph.com/@thezao), X account, Farcaster account (@bettercallzaal FID 19640 + /zabal channel), Instagram, Substack (evaluate: start one or mirror?), Whop (evaluate as distribution/monetization), Magnetiq (app.magnetiq.xyz/brand/zabal collectible/registration surface), plus any other high-leverage channel (YouTube given the workshop library, TikTok/Reels given the clip engine, LinkedIn, Telegram, Discord, Luma calendar). Cover reached-definition per channel + target stack to 100k; repurposing flywheel tactics per platform; cross-posting vs native-first; Paragraph vs Substack; Farcaster mini-app growth mechanics; X algorithm; short-form video engine; Whop + Magnetiq roles; measurement. Deliver per-channel H2 playbook with weekly cadence table, 3 highest-leverage moves, monthly milestone ladder to 100k."
tier: DEEP
---

# 957 - 100k total reach by Dec 31 2026: the H2 channel playbook

> **Goal:** Get the ZABAL/ZAO content engine to 100,000 people reached per month (summed per-platform monthly reach, reported honestly as non-deduplicated) by December 31, 2026. Grounded in the real stack: daily Paragraph newsletter + 7-platform socials pack (auto-drafted by the session loop), 30-recording workshop library (`zabalgamez` `data/recaps.json`), Remotion clip pipeline (spacetovideo: recap + 5 clips + 5 verticals + thumbnails per recording), Season Run mini-app game (`quest.html`), submission platform, `api/daily-cast.mjs` cron, /zabal channel, 100+ member ZAO.

## Key Decisions (do these)

| # | Decision | Why (evidence) |
|---|----------|----------------|
| 1 | DEFINE "reached" = sum of per-platform MONTHLY platform-reported reach/uniques, disclosed as "combined, not deduplicated." | This is the honest industry standard; true cross-platform dedup costs $50k+/yr (Comscore/Nielsen) and no affordable alternative exists in 2026. |
| 2 | TURN ON THE VIDEO ENGINE AT FULL VOLUME - this is the #1 lever. 5-7 shorts/week to TikTok + YouTube Shorts + Reels (watermark-free native uploads) + 1 long-form workshop/week to YouTube with chapters + transcripts. | Short-form is the only surface where a small account can reach tens of thousands cold: TikTok tests every video on 200-300 non-followers and can explode; YT Shorts adds a 3-6 week search tail; the Remotion pipeline already produces the assets, so marginal cost is scheduling. Long-form niche educational compounds via search (AI/dev tutorials = fastest-growing niche, 18x YoY). |
| 3 | FIX X: buy Premium, stop naked links, go 70/30 replies-to-posts, use native video. | Since March 2026 non-Premium link posts get ZERO median engagement; Premium = 2-4x in-network reach; replies are weighted 13.5-150x a like and the algorithm now actively boosts <5k-follower accounts with high engagement. The current Firefly cross-post-with-link pattern is algorithmically dead on X. |
| 4 | MIRROR TO SUBSTACK (keep Paragraph canonical). Post 3+ Notes/week, set up 5+ recommendation swaps, add a referral loop. | ~50% of new free Substack subs come from Substack's own network (Notes/recommendations); one tracked creator got 62% from Notes (11 -> 5,800 subs in 6 months). Paragraph has NO native discovery (bring-your-own-audience + Farcaster sync only). Dual-publish captures a network Paragraph cannot give. |
| 5 | USE Farcaster as the SEED ENGINE - the launch surface for half-baked drops. Ship small apps/tokens/frames at cadence (target: one drop every ~2 weeks, ~10 across H2); each drop reliably pulls ~100 wallet-connected, high-intent users (operator ground truth: every ZABAL builder to date - ghostmintops, cashlessman, kenny, the POIDH pot - arrived via Farcaster; zero via X/IG). | Network is only 40-60k DAU, so it is not the reach engine - but it is the only network where a rough draft is a feature (build-in-public culture), mini apps are the documented growth loop (breakouts grew "almost entirely through frame embeds"), and notification tokens re-engage (batch 100/request, Neynar analytics). Season Run was drop #1 of this pattern. The three-engine model: Farcaster seeds (~100 real users/drop), video scales (each drop becomes the clips), newsletter retains (Day-N compounds the story). Drop users are fuel, not reach - they build, submit, and become the story the reach channels amplify. |
| 6 | LINKEDIN: post 3-5x/week, lead with document/PDF-carousel posts. | Documents = 6.60% engagement (highest format); accounts with an active LinkedIn newsletter get 2.1x reach on regular posts; organic reach is down 60% but small consistent topical accounts still 5-15x over 12 months. The daily newsletter gives you the carousel source material for free. |
| 7 | TELEGRAM: promote the group everywhere - highest reach-rate surface you own. | 60-90% of Telegram subscribers see each post (vs 2-9% IG Stories). 10k Telegram subs ~ 100k IG-equivalent reach. Every 100 members added is ~70 guaranteed daily reach. |
| 8 | SKIP Whop for H2 growth; revisit for monetization in 2027. KEEP Magnetiq as capture-only. | Whop = 3% fee infrastructure with 4M-visitor marketplace but "bring your own audience" discovery; no free-distribution evidence. Magnetiq = owned-experience capture surface (no public audience/discovery data at all). Neither moves reach; both can hold products later. |
| 9 | INSTRUMENT NOW: enable Vercel Web Analytics, adopt the UTM convention below, and keep a monthly reach ledger (one row per channel). | Vercel Web Analytics supports UTM params natively; without the ledger the 100k claim is unverifiable. Newsletter metric = unique opens BUT Apple MPP inflates opens 15-20 points - track CTR alongside. |
| 10 | AUGUST FINALS = the spike event. Plan the whole month's content arc around it (WaveWarZ-Base market, mentor picks, winner reveal) across every channel simultaneously. | Case studies show combined-reach breakouts almost always ride one moment/channel; Finals is the season's built-in moment. Buffer's systematic repurposing = +400% reach; the Finals arc is the repurposing engine's stress test. |

## The honest verdict
**100k followers by December is not realistic organically; 100k monthly combined reach is - if the video engine actually runs.** The math only closes with short-form video doing half the work (TikTok + Shorts + Reels are the only cold-start-friendly surfaces), YouTube long-form compounding underneath, X fixed (Premium + replies + no naked links), and Substack's network effects layered onto the newsletter. Farcaster, Telegram, Discord, Magnetiq, and the website are conversion and community surfaces that add the last ~20k and turn reach into builders. The single biggest risk is that the clip pipeline produces assets nobody schedules - the engine exists (`spacetovideo` dashboard), the discipline is the missing piece.

## The target stack (December 2026, monthly, platform-reported)

| Channel | Honest metric | Dec target | How it gets there |
|---------|--------------|-----------:|-------------------|
| TikTok | monthly reach (unique accounts) | 22,000 | 5-7 clips/wk from the pipeline; 45-90s cuts; hooks in first 3s; most generous cold-start |
| YouTube (Shorts + long-form) | Monthly Audience (unique viewers) | 25,000 | 5 Shorts/wk + 1 long-form workshop/wk; chapters + transcripts (already generated); library compounds via search |
| X | est. uniques (impressions / ~2) | 15,000 (~30-35k impressions) | Premium, 1-3 quality posts/day + 20-50 strategic replies/day, native video, links in bio/reply only |
| Instagram | monthly reach | 8,000 | 3-5 Reels/wk (7-15s), 60/40 reels/carousels, keywords in caption, 3-5 niche hashtags |
| Farcaster | est. cast viewers + mini-app users | 8,000 | daily casts + /zabal + Season Run recast loop + mini-app notification tokens |
| Website (zabalgamez.com) | unique visitors (Vercel) | 10,000 | all channels funnel here; UTM per channel; game + board + newsletter links |
| Newsletter (Paragraph + Substack) | unique opens (track CTR too) | 4,000 (list ~7-8k) | Substack Notes + 5 rec swaps + referral loop + lead magnet (llms.txt / playbook) |
| LinkedIn | members reached | 5,000 | 3-5 posts/wk, document carousels from newsletter content, LinkedIn newsletter mirror |
| Telegram | subscribers x 0.7 | 1,500 (group ~2k) | promote in every newsletter + cast; 60-90% reach rate |
| Discord + Luma + Magnetiq | members/RSVPs/collectors | 1,500 | community surfaces; Finals events on Luma; Magnetiq = season registration capture |
| **TOTAL** | **combined monthly reach (non-deduplicated)** | **~100,000** | |

## Monthly milestone ladder

| Month | Combined monthly reach | Gate to hit it |
|-------|----------------------:|----------------|
| Jul | 6,000 | Instrumentation live (Vercel Analytics + UTM + ledger); video engine ships first 20 shorts; X Premium + reply protocol starts; Substack mirror live |
| Aug | 15,000 | FINALS ARC: daily content spike, WaveWarZ market moment, winner reveal clips; first TikTok/Shorts breakout attempt; 3 rec swaps live |
| Sep | 30,000 | YouTube library fully uploaded (all 30 recordings + chapters/transcripts); shorts cadence steady 15+/wk across 3 platforms; LinkedIn carousels weekly |
| Oct | 50,000 | YT search compounding visible (return-viewer >10%); newsletter list 4k+; second breakout attempt (season-2 announce content) |
| Nov | 72,000 | Cross-promo blitz (5+ newsletter swaps, FC collab casts, guest podcasts); Telegram 1.5k |
| Dec | 100,000 | Year-of-the-ZABAL wrap arc (day 365 approaching): retrospective series, best-of clips, season 2 teaser across all channels |

## Weekly cadence table (the operating rhythm)

| Day | Newsletter | X | Farcaster | Shorts (TT/YT/IG) | YouTube long | LinkedIn | Telegram/Discord |
|-----|-----------|---|-----------|-------------------|--------------|----------|------------------|
| Mon | Day-N issue + Notes post | 1-2 posts + 20 replies | daily cast + /zabal | 1 clip x3 platforms | - | document carousel | newsletter link |
| Tue | Day-N + Notes | 1-2 posts + 20 replies | cast + mini-app push (if news) | 1 clip x3 | - | - | - |
| Wed | Day-N + Notes | native video post + replies | cast | 1 clip x3 | WORKSHOP UPLOAD (chapters+transcript) | text post | workshop link |
| Thu | Day-N | 1-2 posts + replies | cast + recast community builds | 1 clip x3 | - | carousel #2 | - |
| Fri | Day-N + week recap | thread OR longform article | cast | 1 clip x3 | - | - | week recap |
| Sat | Day-N (light) | 1 post | cast | optional clip | - | - | - |
| Sun | Day-N (light) | 1 post + replies | Season Run share prompt | optional clip | - | - | - |

Rules baked into the rhythm: X links only in bio/replies (never naked in post body); shorts uploaded natively per platform (no watermarks - 40-70% penalty); newsletter drafts continue auto-generating via the session loop; every link carries `?utm_source=<channel>&utm_medium=<format>`.

## The 3 highest-leverage moves (if only three things happen)

1. **Run the clip engine on schedule (15+ shorts/week across TikTok + YT Shorts + Reels, native uploads).** It is the only path to tens of thousands of cold reach, the assets already auto-generate, and the 30-recording backlog is ~6 months of content sitting on disk.
2. **Fix X this week: Premium + 70/30 replies + native video + links out of post bodies.** The current pattern (cross-posted text + newsletter link, no Premium) earns literally zero median engagement under the March 2026 rules. This is the cheapest fix with the most immediate delta.
3. **Mirror to Substack and work its network (3 Notes/week + 5 recommendation swaps + referral).** Half of Substack growth is network-driven; Paragraph gives none of that. Keep Paragraph canonical for Farcaster-native distribution and onchain collects - publish to both (the loop can draft both from the same Day-N source).

## Findings by dimension (condensed, all sourced)

**Newsletter platforms.** Substack: ~50% of new free subs from its network; 62%-from-Notes case study (11->5,800 in 6 mo); writers posting 3+ Notes at launch gain 50% more subs; 5M paid subs platform-wide, 67% YoY. Paragraph: $6.7M raised (Coinbase Ventures, USV), Farcaster follower-sync + auto-cast bot, NO discovery engine. Tactics: lead magnets convert 3-5x generic forms; referral programs = 35% faster growth ($0.03-2/sub via SparkLoop); cross-promo swaps = 50-100+ subs each; niche newsletters average 2.5%/mo list growth executing normally; ~6-9 months to first 1,000. Daily cadence: only ~5% of newsletters send daily; 69% of unsubscribes cite "too many emails" - daily works only when content quality justifies it (the Day-N format's shipped-work density is the justification; watch per-send unsub rate, healthy = 0.1-0.5%).

**Farcaster.** 650k registered but 40-60k DAU, DAU/MAU 0.2, ~4,400 power-badge-quality accounts; monthly protocol revenue collapsed 99% from peak. Mini apps are the growth mechanic that works: documented breakouts grew almost entirely through frame embeds; the loop is post -> action -> identity -> re-engagement; notification tokens batch 100/request with Neynar analytics. Channels: a 2,000-member engaged channel beats a bigger generic audience. Weekly creator reward pools >$25k. Season Run + submission platform are precisely this playbook - the missing piece is prompting shares (the game's Cast pills) and notification pushes on real news.

**X.** Algorithm open-sourced Jan 2026 (Grok-based ranking, May 2026 update lets anyone run the For You ranker). Reply weighting 13.5x (base) to 150x (author-replied threads) vs a like; bookmarks 10x, profile clicks 12x. First 30-60 min velocity decides distribution. Small (<5k) accounts get an active boost when engagement is high (3-6% engagement typical vs 0.5-1.5% for 200k+ accounts). Native video strongest format (15-60s, captions - 80% watch muted). Links: non-Premium link posts = zero median engagement since March 2026; Premium = 2-4x in-network. Communities posts now surface in For You (Feb 2026) - posting into a 100k-member community outreaches your follower count. Best windows Wed-Fri 9-11am audience-local.

**Short-form + YouTube.** Cold-start generosity: TikTok (200-300 test pool, hours-to-millions possible, 70%+ completion gate) > YT Shorts (50-500 test pool, 65% retention gate <30s, 3-6 week search tail, sub-15s Shorts collapse in 2026) > Reels (median 200-600 views for new accounts). Watermarked cross-posts: -40-70% reach; clean-file native uploads carry no penalty (IG still favors "original" +40-60%). Monetization: YT entry tier 500 subs + 3M Shorts views/90d. Niche dev/AI long-form: fastest-growing category, 18x YoY; chapters indexed as Key Moments (+7% retention), transcripts = the top video SEO input (+7% watch time); year-1 niche channel reality: ~50 views video 1, ~500 by video 10, 15-25%/mo growth, 90-day/12-15-video profiling period; consistent 1-3/week beats batch-dumping. Auto-clip reality check: hybrid wins - AI selects candidate moments, human polishes the top ones; podcast/workshop clips drive 20-40% of new audience when the source is recorded with clipping in mind.

**Instagram.** 55% of Reels views come from non-followers (best discovery format); carousels win engagement (10.15% vs 6%); mix 60/40 reels/carousels; 3-5 reels/week (daily low-effort posting reads as filler); 7-15s optimal; hashtags capped at 5 and demoted to classification - but sub-5k accounts still get ~36% lift from caption hashtags; keywords in the first two caption lines are the real signal. Realistic: 0-1k accounts gain 500-2k followers/30 days executing well.

**LinkedIn.** Organic reach down 60% since Nov 2024; typical 1-5k-follower post = ~527 impressions, great = 2,720. Formats: document/PDF carousels 6.60% engagement (2.5x shares), multi-image 5.7%, native video 5.6% (subtitles +40%). Dwell time is the strongest signal (15s+ read = +40% reach); topic consistency compounds; 3-5 posts/week; LinkedIn-newsletter accounts get 2.1x reach on regular posts.

**Whop.** 14-18M users (sources conflict), $100M+/mo transactions, Tether invested $200M at $1.6B (Feb 2026), 3% fee, 4M monthly Discover visitors - but bring-your-own-audience: discovery helps bootstrapping sales, not free-content reach. Verdict: monetization infrastructure for 2027 (paid workshop library / community tier), not an H2 reach channel.

**Magnetiq.** Event/experience platform (luxury-brand clientele on .io; collectible "magnets" on .xyz via Flow); zero public audience or discovery data; positioning is "owned experience." Verdict: keep as the season registration + collectible capture surface it already is; do not budget reach against it.

**Measurement.** Reach = unique people (per platform); impressions >= reach always; X only reports impressions (halve for a unique estimate and say so); YouTube's 2026 "Monthly Audience" = rolling-28-day uniques; newsletter opens inflated 15-20 points by Apple MPP (report CTR alongside); Telegram reaches 60-90% of subs; Vercel Web Analytics = daily-reset unique visitors with native UTM support. Honest aggregate = sum of platform monthly reach + "not deduplicated" disclosure. UTM convention: `utm_source` in {newsletter, substack, x, farcaster, instagram, tiktok, youtube, linkedin, telegram, discord, luma}, `utm_medium` in {email, cast, post, reel, short, video, carousel, bio}.

## Contradictions (flagged, not smoothed)
- X link penalties: removed Oct 2025, reinstated/intensified March 2026 - current state (zero median engagement for non-Premium links) is the operative fact.
- Threads vs longform on X: threads = more total engagement; single longform = 40-60% more impressions. Use longform for reach plays, threads for discussion plays.
- Whop user count: 14.2M vs 18M across sources - unresolved.
- Farcaster "millions of users" ecosystem claims vs 650k registered / 40-60k DAU - the DAU number is the planning number.
- "0-50k in 3 weeks" style case studies: headline-only, no mechanics - excluded from the model. The ladder above uses conservative per-channel benchmarks instead.

## Also See
- [Doc 942 - Unlock embeds + proof-of-submission](../942-unlock-embeds-proof-of-submission-zabalgamez/) - collectible layer that gates/gamifies the same funnel.
- [Doc 896 - Unlock Events + Luma](../../events/896-unlock-events-luma-setup/) - event-layer distribution.
- [Doc 863 - Unlock event ticketing](../863-unlock-protocol-event-ticketing/) - Base ticketing rails for Finals events.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Enable Vercel Web Analytics + adopt the UTM convention + start the monthly reach ledger | @Zaal | Dashboard + doc | Jul 7 |
| Buy X Premium; switch to 70/30 replies protocol; strip naked links from the socials pack templates (link in bio/first reply) | @Zaal + loop | Account + template PR | Jul 7 |
| Stand up the Substack mirror (import list, set 5 recommendation targets, first 3 Notes) | @Zaal | Platform | Jul 12 |
| Schedule the first 20 shorts from the existing clip backlog (TikTok + YT Shorts + Reels, native uploads) | @Zaal (+ spacetovideo pipeline) | Content ops | Jul 12 |
| Upload all 30 workshop recordings to YouTube with chapters + transcripts (batch, 5/week) | @Zaal | Content ops | Aug 31 |
| Update the daily socials-pack generator: X cut loses naked link, gains native-video slot; add LinkedIn carousel source block | loop | Template change | Jul 10 |
| Plan the August Finals content arc (daily beats across all channels) | @Zaal + loop | Editorial calendar | Jul 25 |
| Wire Season Run share prompts + mini-app notifications to real news moments (new builder, stage completions) | @Zaal approval, then build | Build (needs api) | Aug |
| Set the H2 DROP CADENCE: one half-baked Farcaster app/token/frame drop every ~2 weeks (~10 drops; each seeds ~100 users + a week of clip content) - maintain a running drop-ideas list | @Zaal + loop | Editorial + build | Standing from Jul |
| Revisit Whop for paid workshop library / community tier | @Zaal | Decision | Q4 |

## Sources
Newsletter: [FULL] on.substack.com/p/how-publishers-are-using-notes-to-grow; [FULL] thrivewithcarrie.substack.com/p/substack-notes-strategy-2026; [FULL] on.substack.com/p/recommendations; [PARTIAL - timeframe of 32M claim unverified] accio.com/business/substack_the_trend_report; [FULL] pitchbook.com/profiles/company/512151-85 (Paragraph); [FULL] docs.paragraph.com/docs/integrations/farcaster; [FULL] extole.com/blog/referral-stats-to-know-in-2026; [FULL] sparkloop.app; [FULL] clickminded.com/newsletter-statistics; [FULL] beehiiv.com/blog/the-state-of-paid-newsletters-2026; [FULL] retentioncheck.com/churn-benchmarks/news-subscriptions; [FULL] newsletrix.com/blog/newsletter-unsubscribe-rate-benchmarks.
Farcaster/Whop/Magnetiq: [FULL] blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox; [FULL] farcaster.network; [FULL] medium.com/@bhagyarana80/5-farcaster-frames-growth-loops-worth-stealing; [FULL] miniapps.farcaster.xyz/docs/guides/notifications; [FULL] docs.neynar.com/docs/send-notifications-to-mini-app-users; [FULL] superbcrew.com/what-is-whop-and-how-to-use-it (Tether $200M); [FULL] insightraider.com/en/blog/whop-marketplace-guide; [FULL] forkoff.xyz/blog/clipping/whop-review-deep-dive; [PARTIAL - magnet mechanics undocumented] magnetiq.xyz / magnetiq.io.
X/LinkedIn: [FULL] sproutsocial.com/insights/twitter-algorithm; [FULL] opentweet.io/blog/how-twitter-x-algorithm-works-2026; [FULL] bisonary.com/blog/how-to-grow-on-twitter-with-replies-in-2026; [FULL] fireply.ai/blog/x-algorithm-2026-explained; [FULL] buffer.com/resources/x-premium-review; [FULL] socialmediatoday.com/news/x-formerly-twitter-testing-links-in-app-link-post-penalties/803176; [FULL] postory.io/blog/grow-on-x-after-communities-shutdown; [FULL] outx.ai/blog/good-number-linkedin-impressions; [FULL] dataslayer.ai/blog/linkedin-algorithm-february-2026-whats-working-now; [FULL] getathenic.com/blog/linkedin-organic-reach-crisis-tactics-2026; [FULL] sproutsocial.com/insights/linkedin-algorithm.
Video: [FULL] socialync.io/blog/youtube-shorts-algorithm-2026; [FULL] istantcalc.com/blog/tiktok-algorithm-2026-guide; [FULL] shortsync.app/resources/youtube-shorts-vs-tiktok-vs-reels-2026; [FULL] socialync.io/blog/avoid-content-duplication-penalties-cross-posting-2026; [FULL] unkoa.com/youtube-shorts-monetization-requirements; [FULL] humbleandbrag.com/blog/new-youtube-channel-average-views; [FULL] coralbees.com/youtube-seo; [FULL] choppity.com/blog/how-to-repurpose-podcast-into-shorts; [FULL] cutback.video/blog/batch-filming-editing-the-creator-s-secret-to-posting-consistently.
Instagram/measurement: [FULL] creatorflow.so/blog/instagram-content-formats-guide; [FULL] loopexdigital.com/blog/instagram-reels-statistics; [FULL] later.com/blog/ultimate-guide-to-using-instagram-hashtags; [FULL] sproutsocial.com/insights/reach-vs-impressions; [FULL] vidiq.com/blog/post/youtube-monthly-audience-metric; [FULL] meltwater.com/en/blog/what-are-twitter-impressions-reach; [FULL] newsletter.supply/blog/good-newsletter-open-rate-2026.html; [FULL] demandsage.com/telegram-statistics; [FULL] vercel.com/changelog/utm-parameter-support-in-web-analytics; [FULL] vercel.com/docs/analytics/using-web-analytics; [PARTIAL - headline without mechanics, excluded from model] sociallifemagazine.com 0-50k case study; [PARTIAL - aggregate only] shno.co/marketing-statistics/content-repurposing-statistics (Buffer +400%).
