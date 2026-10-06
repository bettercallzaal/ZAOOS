---
topic: events
type: decision
status: research-complete
last-validated: 2026-10-05
superseded-by:
related-docs: "events/1041-zaostock-post-event-plan, events/1727-zaostock-post-event-ops, events/1033-zaostock-photo-promo-calendar, events/1030-zaostock-livestream-media-production"
original-query: "lets keep researhcing and reviweing waht would get our zaofestivals content the most reach (Zaal, poidhz pane, 2026-10-05, following his ask for ten $10 poidh bounties closing 1 to 4 weeks out now that ZAOstock is done)"
tier: STANDARD
---

# 2588 - ZAOstock after the festival: where the reach actually is, and what ten $10 bounties should ask for

> **Goal:** Zaal wants ten $10 poidh bounties cast today, closing one to four weeks out, built from ZAOstock 2026's footage. Before writing them: measure where zaofestivals content gets seen now, and shape the asks around the audiences that actually exist.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **SAVE THE SIX STREAM RECORDINGS BEFORE SAT 10 OCT.** USE Twitch Highlights (Twitch keeps them indefinitely, no disk) or a local download (about 4.8 GB at 720p, the source quality). | twitch.tv/zaofestivals is neither Affiliate nor Partner (Twitch GQL, 2026-10-05), so past broadcasts are kept 7 days. All six were broadcast 3 Oct, so they are due to be deleted around 10 Oct unless the broadcasting account has Prime or Turbo, which is not publicly visible. Every footage bounty needs them. |
| 2 | **BORROW AUDIENCES; do not count on our own.** Every owned channel is small: Instagram @zaofestivals 258 followers, Twitch 4 followers, Farcaster /zao 120 followers, the six recordings 104 views between them. | A bounty that ends with an entrant posting to their own account reaches 9 to 178 views per post (round four entrants on X, rounds/daily/d04/PICK.md in bettercallzaal/poidhz). The audiences that are bigger than ours belong to the eight acts, Star 97.7, and Ellsworth. |
| 3 | **USE Instagram Collab posts as the delivery mechanism.** Each bounty asks the entrant to post a Reel and invite @zaofestivals and the act as collaborators. | Instagram's own help: an accepted collab post "will also show on their profile and be distributed to their followers in Instagram feed". Up to five collaborators. Instagram also names follower count as a ranking signal, which is exactly what a 258-follower account lacks. |
| 4 | **ONE BOUNTY PER ACT for eight of the ten.** "Best clip of [act]'s set", each sent to that act. | Gives each act a reason to share the bounty itself and the winning clip. YouTube's music blog (Jan 2023): fan-created Shorts raised the average artist's unique-viewer audience by more than 80%. |
| 5 | **COLLECT THE ACTS' INSTAGRAM HANDLES FIRST.** Only 2 of 8 are on file. | ZAODEVZ/ZAOstock `src/lib/lineup-fallback.ts`: Acadia Rising (instagram.com/acadia.rising) and DCoop (@dcoopofficial) have handles; The Crown Vics, OPEN X, Grass Rug, Michael Anderson, LyonsDen Rez Muzik and Tom Fellenz do not. Without a handle, the collab lever does not exist. |
| 6 | **POST TO TIKTOK AND YOUTUBE SHORTS AS WELL as Reels, and SKIP picking one "best" platform.** | The 2026 benchmarks contradict each other for small accounts (Findings, section 3). TikTok and Shorts both push to non-followers; Reels leans on followers. Cross-posting costs one upload. |
| 7 | **KEEP $10, and spend the effort on a boost instead.** | Our own record: on poidh, prize size showed no effect and $6 to $15 is the weakest band (33% drew entries, n=21), while a pot boosted by someone other than the issuer drew a median 5.5 entries against 1.5 (n=552). Ask Kenny and the acts to add to the pots. |

## Findings

### 1. Our own channels, measured 2026-10-05 09:20 EDT

| Surface | Measured | How |
|---|---|---|
| Twitch twitch.tv/zaofestivals | 4 followers; not Affiliate, not Partner; 0 clips ever made | Twitch GQL (public client id) |
| The six ZAOstock recordings, 3 Oct | 205 s, 565 s, 442 s, 7,250 s, 3,843 s, 9,051 s (5 h 56 min in all); 7, 13, 7, 27, 14, 36 views (104 in all) | yt-dlp and Twitch GQL |
| Instagram @zaofestivals | 258 followers, 59 following | Zaal's Chrome, logged-out profile page; per-post numbers were not visible (Instagram's API refused: "Please wait a few minutes") |
| Farcaster /zao | 120 followers, 4 members, lead FID 19640 | api.warpcast.com/v1/channel |
| Entrants' own posts, round four | X views 9, 48, 84, 128, 178 | bettercallzaal/poidhz rounds/daily/d04/PICK.md, measured 29 Sep |

Not measured: X @thezaodao and YouTube @thezaodao follower counts, Star 97.7's own social accounts, and each act's following.

### 2. The recordings are on a 7-day clock

Twitch's help page: "Twitch Partners, Prime and Twitch Turbo users will have past broadcasts saved for 60 days before being deleted. Twitch Affiliates have their past broadcasts saved for 14 days. All other broadcasters will have their past broadcasts saved for 7 days before they are deleted." The clock does not apply to Highlights, Uploads or Clips (vodfetch.com, citing Twitch Support on X, May 2025). zaofestivals has neither programme flag, so 7 days is the floor; Prime or Turbo on the broadcasting account would extend it to 60, and that cannot be seen from outside.

### 3. Which short-video platform, for an account this small: the sources disagree

| Source (2026) | Accounts | Small-account finding |
|---|---|---|
| Socialinsider, 69M videos, Jan 2025 to Jul 2026 | under 5K followers | Shorts 15,160 average views, Reels 625, TikTok 350 |
| Metricool, 6.18M videos, 375K accounts | under 2K followers | TikTok "nearly doubles YouTube Shorts in views per video and also outperforms Instagram" |
| Conbersa, citing Influencer Marketing Hub | under 10K followers | TikTok 300 to 1,000 median, Reels 200 to 600, Shorts 100 to 400 |

**Contradiction unresolved:** Socialinsider puts Shorts first by a factor of 24 over Reels; the other two put Shorts last. Averages (Socialinsider) are pulled up by a few viral Shorts, medians (Conbersa) are not, which may explain it, but none of the three publishes both. What the platforms themselves document is structural, not numeric: Instagram names follower count among its ranking signals and tests a Reel on a small audience before widening it; TikTok's For You explainer names no follower signal (Aubrium, quoting both platforms' docs, retrieved 18 Aug 2026). For a 258-follower account that points away from relying on Reels alone, and toward collabs where Reels is used.

### 4. What a recap should be

From r/videography (score 87, 57 comments): the most practical comment (23 points) is "the one that sells is the 90 second recap without too many 'pretentious' stuff"; another says "burned in subs are what the kids want", answered by "these are too small to read on a phone". Matches our own round-eight bar (vertical, under 90 s, captions large enough to read muted).

### 5. What our poidh history adds

From bettercallzaal/poidhz `docs/what-draws-entries-2026-10-01.md`: rounds that handed entrants our own recording and asked for a cut drew 7 to 10 wallets over one to two weeks, the most reliable shape we have run; asking for a link back to your post had no effect (24% against 26% reaching ten entries, n=600); naming one room to post in had a median of 11.5 entries against 3 (n=10). Six people have entered three or more rounds and three of them have cut video from our audio before. Round eight drew 12 claims from 8 people in two days on a cut-the-radio-session ask.

## The slate this points to (for Zaal to cut)

All require: vertical, under 90 s, captions, posted as an Instagram Collab inviting @zaofestivals and the act, also on TikTok or Shorts, file link in the claim.

| # | Closes | Ask |
|---|---|---|
| 1 to 8 | 12 Oct for four acts, 19 Oct for four | Best clip of one act's set, one bounty per act, sent to that act |
| 9 | 19 Oct | The whole day in 90 seconds |
| 10 | 2 Nov | The worst possible ad for ZAOstock 2027 (an inverted ask; Hivemind's worst-ad bounty drew 66 entries, n=1) |

The footage rounds close first because of section 2, even with the recordings saved.

## Also See

- [Doc 1041 - ZAOstock post-event plan](../1041-zaostock-post-event-plan/) - set a 2 to 3 week timeline for the highlight reel; this doc moves the cutting to poidh entrants.
- [Doc 1030 - ZAOstock live media production](../1030-zaostock-livestream-media-production/) - the recording setup these files came from.
- [Doc 1033 - ZAOstock photo and promo calendar](../1033-zaostock-photo-promo-calendar/)
- [Doc 1727 - ZAOstock post-event ops](../1727-zaostock-post-event-ops/) - written in July around Eventbrite and WaveWarZ stats that did not happen as planned; read with care.
- bettercallzaal/poidhz `docs/what-draws-entries-2026-10-01.md` and `rounds/daily/d08/` (round eight, the radio cut).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Save all six 3 Oct recordings: Highlights created on twitch.tv/zaofestivals, or the 720p files downloaded and copied off the Mac; shipped when six files or six Highlights exist | Zaal | Task | 2026-10-08 |
| Get Instagram handles for the six acts with none on file, written into ZAODEVZ/ZAOstock `lineup-fallback.ts` socials; shipped when 8 of 8 have one | Zaal | PR | 2026-10-07 |
| Cut or approve the ten-bounty slate above; shipped when Zaal names the list in the poidhz pane | Zaal | Decision | 2026-10-05 |
| Write the approved bounty texts through the poidhz checks (validate-bounty-description.py) and put each on a cast page; shipped when every text passes and the cast page is on the clipboard | poidhz lane | PR | 2026-10-06 |
| Message each act the link to its own bounty after casting; shipped when eight messages are sent | Zaal | Task | 2026-10-07 |

## Sources

- Twitch GQL `user(login:"zaofestivals")` followers, roles, videos, clips - [FULL, method: raw JSON, 2026-10-05]
- yt-dlp metadata for twitch.tv/videos/2890837517, 2890841510, 2890850258, 2890857550, 2890969100, 2891031137 - [FULL, method: raw metadata, 2026-10-05]
- [Instagram @zaofestivals](https://www.instagram.com/zaofestivals/) - [PARTIAL - follower and following counts read in Chrome logged out; per-post numbers not shown; the API route returned a rate-limit refusal twice]
- [Farcaster /zao channel API](https://api.warpcast.com/v1/channel?channelId=zao) - [FULL, method: raw JSON]
- [Twitch Help, On-Demand Content](https://help.twitch.tv/s/article/video-on-demand) - [PARTIAL - the page is a JS shell to curl and exa fetch; the quoted retention sentence comes from exa search's extract of the page, and matches two independent explainers below]
- [vodfetch, How long do Twitch VODs last](https://vodfetch.com/blog/how-long-do-twitch-vods-last) - [PARTIAL - exa search extract; curl returns HTTP 436 (bot block); used only for "the clock does not apply to Highlights, Uploads or Clips"]
- [Instagram Help, About collab posts](https://www.facebook.com/help/instagram/291200585956732) - [PARTIAL - exa search extract of the help text; the quoted sentence is from it]
- [Hootsuite, Instagram collab post](https://blog.hootsuite.com/instagram-collab-post/) - [PARTIAL - exa extract; used for the five-collaborator limit]
- [Socialinsider, TikTok vs Reels vs Shorts 2026](https://www.socialinsider.io/blog/tiktok-vs-reels-vs-shorts/) - [PARTIAL - exa extract; table of average views by follower bracket quoted]
- [Metricool, State of short-form social media 2026](https://metricool.com/the-state-of-short-form-social-media-in-2026/) - [PARTIAL - exa extract]
- [Conbersa, Shorts vs Reels vs TikTok reach](https://www.conbersa.ai/learn/shorts-vs-reels-vs-tiktok-reach) - [PARTIAL - exa extract]
- [Aubrium, Where a clip travels furthest](https://aubrium.com/blog/where-a-clip-travels-furthest) - [PARTIAL - exa extract; carries the YouTube music-blog figures quoted in Key Decision 4, which were not read at YouTube directly]
- [r/videography, Tired of seeing the same old event wrap-up videos](https://www.reddit.com/r/videography/comments/1rwcxsh/tired_of_seeing_the_same_old_event_wrapup_videos/) - [FULL, method: Arctic Shift via zao-fetch-reddit.sh, 64 comments]
- ZAODEVZ/ZAOstock `src/lib/lineup-fallback.ts` - [FULL, method: gh api]
- bettercallzaal/poidhz `docs/what-draws-entries-2026-10-01.md`, `rounds/daily/d04/PICK.md` - [FULL, local repo]

**On the PARTIAL marks:** the benchmark and help pages were read through exa's search extracts, not fetched whole. They are used for one quoted figure or sentence each, the three benchmarks are reported as contradicting rather than averaged, and no decision above rests on a single one of them.
