---
topic: wavewarz
type: decision
status: research-complete
last-validated: 2026-08-20
related-docs: 533, 625, 768, 1223, 1293, 2308
original-query: "QUICK tier: ground the WaveWarZ Twitch clip bounty (zpoidh R5) before launch. Questions: (1) current WaveWarZ facts as of Aug 2026 - stream schedule, channels, team handles, recent notable battles or moments worth pointing clippers at; (2) what poidh clip/video bounties have actually drawn the most claims and at what prize sizes, from poidh.xyz live data; (3) comparable clipping programs (Whop clipping campaigns, creator clipper programs) - typical pay per clip and rules, to calibrate 0.0125 ETH; (4) Twitch clip/VOD rights and reuse rules for non-affiliate channels; (5) the existing WaveWarZ Clippers program (t.me/wavewarzclipshq) current rules so the bounty stacks instead of contradicting. Output: concrete edits to rounds/r5/description.md, or confirmation it stands."
tier: STANDARD
---

# 2356 - WaveWarZ Twitch clip bounty: pre-launch grounding (zpoidh R5)

> **Goal:** Check the R5 clip bounty text against live poidh claim data, clipping-program pay norms, Twitch's clip/VOD rules, and WaveWarZ's live state, and ship the edits before Zaal creates it.

## Key Decisions

| Decision | Recommendation |
|---|---|
| Prize | **KEEP 0.0125 ETH seed, OPEN pot.** On poidh the 0.01-0.02 ETH band has the best claim engagement (median 4, mean 15 claims across 8 open content bounties); our R1/R2 at 0.0105 drew 11 and 8. Raising the seed buys quality signal, not volume. |
| Title | **USE "Best 60s clip from the WaveWarZ Twitch stream".** Format + platform in the title draws 8-17 claims on poidh vs 2-4 for generic "clip" asks (1166, 1145, 1093). Body keeps 20-90s. |
| Pot framing | **SAY the pot starts at 0.0125 ETH and grows.** Against clipping-market norms ($29 is a CPM-campaign rounding error; contest winners pay $100-1,000) the only thing that makes this credible is visible top-ups. Ask IKE and Kenny to add in public on day 1. |
| Twitch setting | **IKE turns ON "Allow viewers to directly post clips to YouTube, TikTok, and Instagram"** (default OFF) before launch. Without it entrants cannot push clips off Twitch, and the ToS licence to other users only applies when sharing is on. |
| Archive | **IKE highlights or exports each night's broadcast.** Non-affiliate VODs delete at 7 days; Highlights persist (100h cap); Export-to-YouTube is one click. |
| Finder tool | **LINK wavewarz.info/battles in the text.** Every battle with pool size and winner; biggest pools are where the flips happened. Gives clippers a map into 2-3h VODs. |
| Clippers program | **Keep "stacks with your points", claim nothing more.** Telegram channel has no public preview; rules unread (FAILED). |

## Findings

### 1. WaveWarZ live state (wavewarz.info public API, 2026-08-20)

- 1,419 battles total (52 main events, 168 main battles, 1,217 quick, 34 community). 901.01 SOL volume (~$78.7k at $87.32/SOL). 13.95 SOL paid to artists (1% of volume + settlement bonus, instant on-chain). 1,799 trader withdrawals.
- Last 50 battles (Aug 12-20) are all `quick` type, created 02:00-04:15 UTC, i.e. 10 pm to midnight ET, matching the Twitch VOD starts (01:26-01:57 UTC = about 9:30 pm ET). Twitch channel `wavewarzofficial` (id 1329490346): 39 followers, 6 VODs titled "WaveWarZ Song vs. Song BattleZ", 1.9-3h each, not Affiliate or Partner.
- Biggest pool of the week: SS Curator's Cut vs Dolphin Flippin, 0.66 SOL, Aug 15 (`wavewarz.info/battles/1786767089`). Also HuracánWavez x Hurric4n3Ike battle 0.449 SOL Aug 15.
- Official handles per wavewarz.info schema.org block: x.com/wavewarz, wavewarz.com, wavewarz.info. YouTube @wavewarz and Telegram @wavewarzclipshq per doc 1223.

### 2. poidh claim data (Base, 95 open/progress bounties, 62 content-type, queried via tRPC 2026-08-20)

| Band | Bounties | Median claims |
|---|---|---|
| under 0.01 ETH | 32 | 0 |
| 0.01-0.02 ETH | 8 | 3.5 (mean 15.4) |
| over 0.02 ETH | lower engagement | - |

Top content bounties by claims: 1145 "Engage with our video on X" 78 claims at 0.0135 ETH; 1310 "Best Sunrise Shot" 26 at 0.0053; 1315 photography 25 at 0.0418; 1309 B&W photo 22 at 0.0069; 1051 "Brian Armstrong tries poidh" 17 at 0.012. Ours: R1 1151 11 claims at 0.0105, R2 1166 8 at 0.0105, R3 1180 8 at 0.025, R4 1249 2 at 0.0138 (canceled). Only 8 open bounties mention streams or Twitch at all. Caveat: sample is open bounties, not completed ones, so claim counts are still growing.

### 3. Clipping-program pay norms (6 FULL sources, 2026)

| Program | Model | Figures |
|---|---|---|
| Whop Content Rewards | CPM | about $1 per 1k views, caps around $150 per clip; captions required |
| Kiip | CPM | $1-5 per 1k; test campaigns of $1k draw 30-80 clippers |
| ClipAffiliates case study (Jul 2026) | CPM | $0.73 real CPM, $1,100 spent, 225 joined, 109 posted |
| Luminaclippers managed | CPM | John Summit $1,050 for 32.4M views; 44% of clips pass review |
| iWantClips contests | winner-take-all | $1,000 first, $100 second per category |

Takeaway: $29 is far below market for a solo pot; it is fine as a seed only if top-ups are visible and the ask is tight. Standard rules everywhere: captions required, creator keeps ownership, brand gets reuse rights, 7-10 day windows, approval within 48-72h. R5 already matches all of those.

### 4. Twitch rules (help.twitch.tv + ToS section 8.a, fetched 2026-08-20)

- "All other broadcasters will have their past broadcasts saved for 7 days before they are deleted." Affiliates 14, Partners/Prime/Turbo 60.
- Clips: up to 60 seconds; survive VOD deletion; channel can delete them or disable creation; viewers can clip non-affiliate channels.
- "Allow viewers to directly post clips from your Twitch channel to their YouTube, TikTok, and Instagram accounts. By default, this setting is turned off." Once on, Twitch "are unable to assist in removing clips from third party sites".
- Highlights and uploads share a 100-hour storage cap and persist. Download and Export-to-YouTube exist per video, no bulk.

### 5. WaveWarZ Clippers program

`t.me/s/wavewarzclipshq` returns a page with zero messages (private or no web preview). Rules from doc 1293 (July 2026, reconstructed) remain the only source: 15-90s, captions, logo or @wavewarz, points to ZABAL. R5's captions + logo requirement matches them.

## Edits shipped to zpoidh `rounds/r5/description.md` (PR #101)

1. Title: "Best 60s clip from the WaveWarZ Twitch stream".
2. Opening line: pot starts at 0.0125 ETH and grows; 60s sweet spot.
3. Schedule line: most weeknights from about 9:30 pm ET.
4. wavewarz.info/battles as the finder.
5. "Vertical is welcome, not required."
6. README: two pre-launch taps for IKE (clip direct-post setting, nightly Highlight/export).

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| IKE flips the Twitch clip direct-post setting ON and confirms in chat | @Zaal (asks IKE) | DM | 2026-08-21 |
| Create R5 on poidh as OPEN, 0.0128 ETH, with the PR #101 text; bounty URL posted in /wavewarz, /poidh, X, Clippers TG | @Zaal | On-chain + posts | 2026-08-21 |
| IKE or Kenny public top-up on day 1 so the pot visibly grows | @Zaal (asks) | DM | 2026-08-22 |
| Merge zpoidh PR #101 so the text on main matches what was created | @Zaal | PR | 2026-08-21 |

## Also See

- [Doc 533](../../community/533-poidh-clipup-bounty-bcz-yapz-hannah/) - R1 template and Kenny's wording notes
- [Doc 625](../../community/625-poidh-zao-bounty-playbook/) - prize tiers
- [Doc 1293](../1293-wavewarz-clippers-program-guide-jul2026/) - Clippers program guide
- [Doc 1223](../1223-wavewarz-live-programming-community-jul2026/) - channels and schedule, July 2026
- zpoidh `rounds/r5/` - the bounty itself

## Sources

- [FULL, curl JSON] https://wavewarz.info/api/public/stats and /api/public/battles, 2026-08-20
- [FULL, Twitch GQL public client] channel `wavewarzofficial`, VOD list, affiliate flags, 2026-08-20
- [FULL, tRPC via scripts] poidh.xyz `bounties.fetchAll` + `claims.fetchBountyClaims`, Base, 95 bounties, 2026-08-20
- [FULL, curl] https://help.twitch.tv/s/article/video-on-demand
- [FULL, curl] https://help.twitch.tv/s/article/how-to-use-clips
- [FULL, curl] https://www.twitch.tv/p/legal/terms-of-service (section 8.a)
- [FULL, curl] https://whop.com/blog/content-rewards/ (2025-03-04)
- [FULL, curl] https://kiip.app/articles/clipping-campaign-budget-cpm-rates (2026-07-09)
- [FULL, curl] https://luminaclippers.com/blog/what-is-a-clipping-campaign (updated 2026-06-25)
- [FULL, curl] https://www.clipaffiliates.com/blog/podcast-clipping-campaign-case-study (2026-08-07)
- [FULL, curl] https://clippingatlas.com/en/blog/is-clipping-legit (2026-07-06)
- [FULL, search + fetch] https://blog.iwantclips.com/iwantclips-valentines-clip-contest-2026/ (2026-02-01)
- [FAILED, curl t.me/s preview returned 0 messages] https://t.me/wavewarzclipshq - channel rules unread
