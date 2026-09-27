---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-27
superseded-by:
related-docs:
original-query: "YouTube/ZAO growth: Pull retention-curve data from Zaal's own existing WaveWarZ and BetterCallZaal uploads in YouTube Studio and identify which hook type (question, bold-claim, preview) actually correlates with above-50%-at-15-seconds retention for this specific channel."
tier: STANDARD
---

# 2565 - YouTube/ZAO growth: Pull retention-curve data from Zaal's own existing

> Drafted by ZOE's research-worker from "YouTube/ZAO growth: Pull retention-curve data from Zaal's own existing WaveWarZ and BetterCallZaal uploads in YouTube Studio and identify which hook type (question, bold-claim, preview) actually correlates with above-50%-at-15-seconds retention for this specific channel.". Auto-committed to main for durability; review + deepen as needed.

Budget is nearly exhausted - synthesizing from what was fetched rather than using remaining fetches on additional calls.

---

## Findings

**The core constraint: Zaal's retention curves are behind an OAuth wall.** The YouTube Analytics API (`audienceWatchRatio` + `relativeRetentionPerformance` against the `elapsedVideoTimeRatio` dimension) is the correct endpoint for per-video retention curves, but it requires an authenticated token scoped to the specific channel. No agent can pull WaveWarZ or BetterCallZaal data without Zaal granting that access. This is not a tooling gap - it is the correct design.

**What ZAOOS already has.** The codebase (`src/app/api/auth/youtube/route.ts`) implements YouTube OAuth with `youtube` and `youtube.force-ssl` scopes, enough for live broadcasting but NOT for Analytics. To pull retention curves, the OAuth scope must add `https://www.googleapis.com/auth/yt-analytics.readonly`. This is a one-line change to the existing OAuth flow. Once added and Zaal re-authenticates, the channel connection in Supabase (`connected_platforms` table) will hold a token that can query the Analytics API.

**The exact API call once authenticated.** YouTube Analytics API `reports.query` endpoint:
- `ids=channel==MINE`
- `metrics=audienceWatchRatio,relativeRetentionPerformance`
- `dimensions=elapsedVideoTimeRatio`
- `filters=video=={videoId}`

This returns a curve: for each `elapsedVideoTimeRatio` value (0.0 to 1.0 at ~1-second granularity), what share of viewers who started the video were still watching. The 15-second mark on a 60-second video is `elapsedVideoTimeRatio=0.25`; for a 3-minute video it is `0.083`. The threshold the parent task names - above 50% at 15 seconds - means `audienceWatchRatio >= 0.50` at the video's 15s ratio.

**No existing retention research in the library.** Docs 1303, 2544, 2553 cover WaveWarZ YouTube strategy, artist roster, and channel separation, but none contain retention curve data. Doc 1073 covers CTR benchmarks (4-6% for niche web3 channels). Zero docs address hook type classification or the 15-second threshold. This research doc would be the first.

**Hook type research status: STANDARD tier is insufficient.** To answer "which hook type - question, bold-claim, preview - actually correlates with above-50%-at-15s retention on WaveWarZ and BCZ specifically," the data must come from those channels' own videos. External research on hook types from larger channels (100k+ subs channels studied by VidIQ, TubeBuddy) is not reliably predictive for a small web3 battle-music channel with sub-1k subs. The answer for Zaal's channels requires:

1. Pull the video list via YouTube Data API v3 (already in ZAOOS scope).
2. Manually or semi-automatically classify each video's opening 15 seconds by hook type (question / bold-claim / preview).
3. Pull `audienceWatchRatio` at the 15-second ratio for each video via the Analytics API.
4. Correlate. With 50+ VODs on WaveWarZ, this is a workable sample.

Generic benchmarks from external sources: question hooks average ~52-55% retention at 15s on sub-10k channels (vidIQ community data, TBD - not verified this run), bold-claim hooks average ~48-51%, preview hooks ~44-49%. These are directional and NOT verified against actual fetched sources this run - treat as UNVERIFIED.

---

## Recommended action

1. **Add `yt-analytics.readonly` scope to the YouTube OAuth flow** in `src/app/api/auth/youtube/route.ts` (one-line change). Have Zaal re-authenticate both WaveWarZ and BetterCallZaal channels. This unblocks all future retention work.

2. **Export the video list** for both channels using the existing YouTube Data API v3 integration and share it with Zaal to classify hook types manually - he knows his own videos and can label them in 30 minutes. A simple spreadsheet: video ID, title, hook type, and a timestamp of the hook's first 15 seconds.

3. **Once authenticated, run the Analytics query** per video and join the hook-type labels to get the actual correlation. Redispatch as DEEP tier with the resulting dataset if analysis beyond a simple sort/average is needed.

---

## Sources

- [PARTIAL - metrics confirmed, example query not shown] YouTube Analytics API audience retention docs - `developers.google.com/youtube/analytics/audience_retention` (liveness-verified 2026-09-27)
- [PARTIAL - overview only, full metric list not returned] YouTube Analytics API query reference - `developers.google.com/youtube/analytics/v2/reference/reports/query` (liveness-verified 2026-09-27)
- [FULL] ZAO research library grep - local filesystem scan, research/README.md and 155+ YouTube-tagged docs (liveness-verified 2026-09-27)
- [FULL] ZAOOS codebase YouTube integration - `src/app/api/auth/youtube/`, `src/app/api/platforms/youtube/` (liveness-verified 2026-09-27)

**Note:** The generic hook-type retention benchmarks (52-55% question, 48-51% bold-claim, 44-49% preview) are recalled from training data and marked UNVERIFIED - no fetch confirmed them this run. Do not act on those numbers without verification.

**Escalation signal:** This task requires DEEP tier for the actual correlation analysis once the OAuth scope is added and the video list is labeled. STANDARD tier can only tell you how to get the data - not what it says.
