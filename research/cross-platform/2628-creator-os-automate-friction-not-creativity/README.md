---
topic: cross-platform
type: guide
status: research-complete
last-validated: 2026-10-07
related-docs: "629, 353, 2135, 992, 1402"
original-query: "https://youtu.be/AmKFWYcfTKo?is=yspWkkYa1U7QjSkz can we /zao-research this please and move to a fresh lane"
tier: STANDARD
---

# 2628 - Creator OS: automate friction, not creativity (Raven Trammell's 35-video packaging pipeline, applied to ZAO)

> **Goal:** Read what Raven Trammell's "Creator OS" actually does (upload -> AI packaging -> human approve -> publish -> filtered clip fan-out), measure it against what ZAOOS already has in `src/lib/autocliper/` and the YouTube broadcast route, and decide which of its three lessons change what The ZAO, WaveWarZ, ZAOstock, POIDH and BetterCallZaal build next.

**Credit:** the source is [How Creator OS Automated 35 Videos (And Saved Me 35 Hours)](https://www.youtube.com/watch?v=AmKFWYcfTKo) by **Raven Trammell** ([youtube.com/@raven.trammell](https://www.youtube.com/@raven.trammell)), founder of [Culture Shift](https://cultureshift.xyz), published 2026-09-17, 12:02 long. Every quote below is from the auto-generated English captions pulled with yt-dlp on 2026-10-07 (2,055 words, ASR, so wording can be off by a word). Creator OS is their build; the ZAO mapping is ours.

## Key Decisions

| Decision | Recommendation |
|---|---|
| **Long-form packaging step** | **BUILD** the one piece ZAOOS does not have: on a new long-form upload, generate title + description + tags from the transcript and send the whole package to Zaal's ZOE DM with Approve / Edit buttons, then publish via the existing `src/app/api/platforms/youtube/broadcast/route.ts` OAuth path. The human approval layer is the point of the video, not an add-on, and it matches `feedback_buttons_always`. Flag OFF by default, PR-only. |
| **Clipping** | **EXTEND** `src/lib/autocliper/` + `scripts/live-clipper/detect-candidates.ts` (doc 992 spike), do NOT subscribe to Opus Clip yet. The video's 12-30 clips per long-form is the ranked-candidate output ZAOOS already produces; what it lacks is the FILTER the video says was the biggest lesson. |
| **The filter cap** | **ADD** a per-video, per-platform clip cap to `clipperConfig` (the video pulled back from "ship it and clip it" to selective distribution). Default 3 per platform; the number is Zaal's, reversible in one config line. |
| **Draft persistence** | **MOVE** `draftStore` out of the in-memory `Map` in `src/lib/autocliper/drafts.ts` into Supabase before any approval flow runs unattended. Today a restart loses every pending approval, which is the one state a human-gate pipeline cannot lose. Migration = ask-first (CLAUDE.md). |
| **Platform targets** | **SKIP** TikTok / Instagram / Shorts fan-out until the `@zaoconcertz` TikTok and Instagram accounts exist (doc 2135 tasks 1087/1088, still NOT CREATED). `postizConfig.platforms` is `warpcast, x, bluesky, discord` today; adding video platforms is Zaal's gate (outbound). |
| **Measure like the video** | **REPORT** two numbers per month: long-form videos packaged by the pipeline, and minutes of manual packaging removed (the video's 35 videos / 35+ hours). Print it next to `zao-spend` so cost per packaged video is visible, not inferred. |
| **Build in public** | **USE** the video's "in process" pattern: each packaging run writes one line of what changed or broke into the YouTube description and the newsletter changelog. Zaal already builds in public; this is the per-upload form of it. |

## What the video says (from the captions)

**The problem.** After making a video there is "this whole second job waiting for me. Titles, descriptions, tags, thumbnails, all the metadata, and also clips and distributing everything across different platforms." Before Creator OS the creator bounced between four tools: YouTube for upload, vidIQ for titles and descriptions, Canva for the thumbnail, Opus for clipping. "None of these tasks felt individually massive, but together they were eating hours of my time and quite a bit of my capacity." Capacity is literal here: the creator has an arm and hand injury and no production team.

**The question.** The experiment started as "Ghost Producer": "Could I build a system that handles the repetitive production work after I make something without automating the creativity itself?" Idea, story, filming and creative control stay human.

**The pipeline, as shown.**

1. Upload a long-form video to YouTube. That is the trigger.
2. Creator OS analyzes the content and generates title, description, tags and thumbnail.
3. "I intentionally kept a human approval layer. I didn't want AI just shipping any and everything." The package is sent to the creator; they edit or hit Approve.
4. On approve, the system publishes the packaged video.
5. The long-form then enters a clipping workflow where Opus "identifies potential short-form moments," 12 to 30 per video.
6. Originally "ship it and clip it." That was reversed: "just because you can automate something doesn't necessarily mean you should." Filtering and distribution logic were added so the system is selective about what publishes and where. Current targets: TikTok, Instagram, Facebook, YouTube Shorts. TikTok is treated as a discoverability surface, YouTube as a placement surface.

**The numbers, as stated in the video (as of its 2026-09-17 publish date).**

| Figure | Value |
|---|---|
| Long-form videos processed | 35 |
| Manual packaging hours removed | at least 35, long-form workflow only, clipping not counted |
| Publishing cadence reached | 3 long-form videos per week |
| Clip candidates per long-form | 12 to 30 |
| Faith Training Live season zero | 12-session beta, 454 views, 92 new viewers |
| Season one planned | 40 days |

**The three lessons, verbatim shape.**

1. "Automate friction, not creativity." AI handles repetitive work so there is "more capacity to be human."
2. "More automation doesn't automatically mean better." The clipping workflow could produce "an absurd amount of content" that did not serve the goal, so the creator "had to pull back, filter more aggressively, and ask what I actually wanted the system to accomplish."
3. "Capacity changes what you're able to imagine. When your entire day isn't consumed by maintaining what already exists, you have more room to notice what wants to exist next."

**What the hours went to.** Not more content. Family ("Uncle Mode", a grandmother with Alzheimer's), Culture Shift, and testing Faith Training Live. The creator's own framing: "Creator OS didn't just give me more output, it gave me capacity. And there is a difference."

**What the video does NOT disclose.** The orchestration layer is never named. Opus is the only tool named inside the live pipeline; vidIQ and Canva are named only as the pre-automation manual tools. Whether the approval message is email, Slack, a dashboard, or something else is not shown in words (the captions say "sends me the package" and "I hit this approve button here"). Any claim about what Creator OS is built on is UNVERIFIED and this doc makes none.

## Ground truth: what ZAOOS already has (read 2026-10-07, this worktree at origin/main `97ada3c05`)

| Piece in the video | ZAOOS today | Gap |
|---|---|---|
| Human approval layer with stages | `src/lib/autocliper/types.ts` line 10: `ClipStage = 'draft' \| 'approved' \| 'published' \| 'rejected'`; routes `src/app/api/autocliper/{ingest,drafts,approve,publish,status}/route.ts`, session-guarded (`approve/route.ts` returns 401 without `getSessionData()`). Added 2026-07-14 in PR #1382. | **Not durable.** `drafts.ts` line 8: `const draftStore = new Map<string, ClipMetadata>()`. A restart drops every pending approval. |
| Clip candidate detection | `scripts/live-clipper/detect-candidates.ts` (doc 992 spike): mlx-whisper transcript -> ranked clip candidates. | Not wired to autocliper ingest. No cap on how many candidates become drafts. |
| Fan-out scheduler | `src/lib/autocliper/config.ts`: Postiz, `platforms: ['warpcast','x','bluesky','discord']`, `rateLimitPerHour: 90`, `captionMustMention: '/wavewarz'`. | No TikTok / Instagram / Shorts. The caption rule is WaveWarZ-only, so the lib cannot package a ZAOstock or BetterCallZaal clip without an edit. |
| YouTube publish | `src/app/api/platforms/youtube/broadcast/route.ts`: Zod schema `title` (1-100 chars) + `description`, OAuth refresh against `oauth2.googleapis.com`. | Creates broadcasts; there is no "update an uploaded video's title/description/tags" step, which is the video's step 2. |
| Status honesty | `src/app/api/autocliper/status/route.ts` reports `ffmpegAvailable: true, storageReady: true` as literals. | A status that cannot be false (`silent-failure-guard.md` rule 7). Fix in the same PR as persistence. |
| The whole flywheel on paper | Doc 629 (DEEP, 2026-05-21) already specified live -> YouTube -> 12-30 clips -> TikTok/Reels/Shorts/Farcaster, priced Opus Clip Starter at $15/mo (as of 2026-05-21, not re-checked today). Doc 2135 (2026-07-29) consolidated on one router, `zaalclip` + Postiz, tasks 939/940/1092/1093, with `@zaoconcertz` TikTok/IG accounts as tasks 1087/1088. | Doc 629's Next Actions were dated 2026-08-10 to 2026-08-22 and the accounts are still NOT CREATED. The video is evidence for finishing the one router rather than widening it. |

So the honest shape is `agent-loops.md` rule 3: this is not "build Creator OS", it is "autocliper exists at about 60 percent; the missing 40 percent is the long-form packaging step, durable drafts, and the filter cap."

## How it applies, brand by brand

**The ZAO / ZAO-VILLE LIVE.** Every live show on `youtube.com/@bettercallzaal` (the Restream target, doc 2135) is the long-form input the video describes. The packaging step is the second job Zaal currently does by hand or skips. The video's cadence number (3 long-form per week from one person) is reachable only because packaging was removed, which is the argument for building the packaging step before buying any clipping tool.

**ZAOstock.** The 3 October 2026 festival footage is the single highest-value long-form input the estate has this quarter. One recap upload, packaged and approved through the DM, then capped clips per act (seven acts played; the doc that records the bill is 2588) is exactly the "selective, not flooding" lesson. ZAOstock is spinning out, so the pipeline lives in ZAOOS and the spinout calls it, not the other way round.

**WaveWarZ.** `captionMustMention: '/wavewarz'` shows autocliper was built for battle clips. The filter cap matters most here: a battle round produces many candidate moments and the video's warning about flooding every platform is the WaveWarZ TikTok risk doc 1402 already names.

**POIDH.** Doc 2522's clip rounds (R6 and R7 at 0.0125 ETH pots, tracker row research-action:2522) are human-made clips rewarded on chain. The pipeline should feed POIDH candidates, never auto-submit, because submission is outbound and on chain (gated).

**BetterCallZaal.** The video is a one-person channel, build-in-public, documenting bugs in descriptions. That is the BetterCallZaal format. Adopting the "in process" one-liner per upload costs nothing and compounds the job-track profile (`project_job_track_profile_is_the_hiring_link`).

## Community signal (what people outside say)

**Hacker News, Launch HN: Mosaic (YC W25) Agentic Video Editing, 2025-11-19, 148 points, 134 comments** (full thread via the Algolia items API). The useful comment is from cjbarber: creators "who have hours of awesome footage but have to spend dozens of hours cutting it down need this," and the pushback from Forgeties79 that scrubbing and trimming are already one click in Premiere or Resolve. Read together: the market pain is the HOURS of post-production, not the editing primitives, which is the same split the video makes between friction and creativity. The thread is about editing agents, not packaging, so it supports the direction and nothing more specific.

**Reddit: FAILED.** Arctic Shift (`arctic-shift.photon-reddit.com/api/posts/search`) returned `Timeout. Maybe slow down a bit` on three attempts across r/NewTubers and a global query on 2026-10-07; the Claude-in-Chrome route is not available to this lane. No Reddit thread is cited and none is paraphrased.

## Risks and what would make this wrong

- **ASR captions.** Every quote is from auto-generated captions. Numbers were checked against the creator's own description text ("35 long-form videos", "at least 35 hours", "12-30 short-form moments", "3 videos per week") and they agree.
- **One creator, one month of data.** 35 videos is a real sample but it is one channel with 40 views on this video at fetch time. The lessons are the transferable part; the hours-saved figure is theirs, not a forecast for ZAO.
- **YouTube Data API quota.** Doc 353 measured 6 uploads per day on the free quota (as of 2026-04-13). Updating title/description/tags on an existing video is a cheaper call than an upload but still counts; verify the quota before the packaging step runs for every ZAO-VILLE show.
- **The approval surface has to be where Zaal already taps.** The video's approve button works because it is in the creator's path. For Zaal that is the ZOE DM with buttons, never a dashboard he has to open.

## Also See

- [629 - Streaming as Main Media Source flywheel](../../infrastructure/629-streaming-as-main-media-source-flywheel/) (DEEP, the full spec this video is a lived instance of)
- [353 - YouTube Content Pipeline Automation for COC Concertz](../353-youtube-content-pipeline-automation/) (the Data API v3 quota and vidIQ decision)
- [2135 - Zaal's media + channels inventory](../2135-zaal-media-channels-inventory/) (one router: `zaalclip` + Postiz; the uncreated clip accounts)
- [992 - Live clipper agent for ZAO streams](../../agents/992-live-clipper-agent-creator-ops/) (the candidate-detection spike)
- [1402 - WaveWarZ TikTok Strategy](../../wavewarz/1402-wavewarz-tiktok-strategy-jul2026/)
- Tracker: `meeting:braindump-2026-08-16` "Download 5 convos, stage for repo + YouTube" (todo, due 2026-10-06) is a long-form backlog this pipeline would package.
- Tracker: `research-action:2522` "Keep R6 and R7 as clip rounds" (todo, due 2026-10-06).

## Next Actions

Every row is reversible: PR-only, flag OFF, or a config line. Nothing here posts, spends or goes on chain.

| Action | Owner | Type | By When |
|---|---|---|---|
| Ship PR: move `draftStore` to a Supabase `autocliper_drafts` table (migration as ask-first), and make `status` report real ffmpeg + storage checks. Shipped = PR open with tests green, drafts survive a restart in the test. | Zaal (approve migration), a ZAOOS code lane (PR) | PR | 2026-10-14 |
| Ship PR: `clipperConfig.maxClipsPerPlatform = 3` and enforce it in `ingest` so detect-candidates output above the cap stays `rejected` with reason `cap`. Shipped = config line + test. | a ZAOOS code lane | PR | 2026-10-14 |
| Ship PR, flag OFF: long-form packaging job in `bot/src/zoe/` that takes a YouTube video id, drafts title/description/tags from the transcript, sends the package to Zaal's DM with Approve / Edit buttons, and on Approve calls the YouTube `videos.update` path. Shipped = PR open, `featureRan` line on the approve path, flag `ZOE_YT_PACKAGING` defaults off. | a ZAOOS code lane; Zaal flips the flag | PR | 2026-10-21 |
| Decide: cap value and which brand goes first (recommend ZAOstock recap, then ZAO-VILLE LIVE). One A/B/C line in the grill. | Zaal | Grill decision | 2026-10-10 |
| Decide: create the `@zaoconcertz` TikTok + Instagram accounts (doc 2135 tasks 1087/1088) or drop Shorts/TikTok fan-out from scope for Q4. Reversible either way; nothing posts until an account exists. | Zaal | Grill decision | 2026-10-10 |
| Run the packaging job once on the ZAOstock recap upload and record videos-packaged and minutes-saved in the vault daily note; first measured data point. | Zaal (approve), the lane that owns the recap | Measurement | 2026-10-24 |
| Re-validate this doc: re-read the video's view count and check whether the creator published a follow-up naming the stack; update the UNVERIFIED line. | the next research lane | Re-research | 2026-11-06 |

## Sources

- [How Creator OS Automated 35 Videos (And Saved Me 35 Hours)](https://www.youtube.com/watch?v=AmKFWYcfTKo) - Raven Trammell, published 2026-09-17, 722 seconds, 40 views at fetch. `[FULL - method: curl of the watch page HTML, 1.26 MB, title/channel/description/length/publishDate parsed from the embedded player JSON; verified 2026-10-07]`
- Transcript of the same video. `[FULL - method: yt-dlp 2026.02.21, auto-generated English captions (`kind: asr`), VTT -> 2,055 words; the only caption track YouTube serves for this video; fetched 2026-10-07]`
- [Raven Trammell on YouTube](https://www.youtube.com/@raven.trammell) - channel id UCGxM8CnKm6ZpMr4vPlpu9nQ. `[FULL - method: curl of the channel page, HTTP 200; the subscriber count is not present in the served HTML, so it is not quoted]`
- [Culture Shift](https://cultureshift.xyz) - the creator's studio, four pillars (Practice, Story, Community, Products), Faith Training Journal. `[FULL - method: curl, redirected to /home, HTTP 200, 1,538 characters of visible text]`
- [Launch HN: Mosaic (YC W25) Agentic Video Editing](https://news.ycombinator.com/item?id=45980760) - 148 points, 134 comments, 2025-11-19. `[FULL - method: hn.algolia.com/api/v1/items/45980760, whole comment tree read, 134 comments]`
- [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) - the scheduler autocliper already targets. Snapshot 2026-10-07 via `zao-research-snapshot`: 36,827 stars, 7,127 forks, 225 open issues, 70 contributors, licence AGPL read from the LICENSE file, last activity 2026-10-07. `[FULL - method: gh api through the snapshot tool]`
- Reddit (r/NewTubers and global search for Opus Clip / AI clipping). `[FAILED - method: Arctic Shift posts/search, three attempts 2026-10-07, each returned "Timeout. Maybe slow down a bit"; Chrome route not available to this lane]`
- ZAOOS code at origin/main `97ada3c05`, read 2026-10-07: `src/lib/autocliper/{index,config,types,drafts}.ts`, `src/app/api/autocliper/*/route.ts`, `src/app/api/platforms/youtube/broadcast/route.ts`, `scripts/live-clipper/detect-candidates.ts`. `[FULL - method: sed/grep in this worktree]`
- ZAOOS research docs 629, 353, 2135, 992, 1402 (paths above, each resolved with `find` on 2026-10-07; 353 and 992 are ambiguous numbers, the cross-platform and agents copies are the ones cited). `[FULL]`
