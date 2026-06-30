---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-29
related-docs: 916
original-query: "STANDARD, building on doc 916. We are about to re-render the Farcaster AMA recap video and want to make the most of the hour. What ELSE would make a Space/AMA recap video meaningfully better that we have NOT implemented - on-screen chapters, lower-thirds, brand motion, end screen, intro/outro, B-roll, production touches - prioritized do-next scoped to the Remotion pipeline (spacetovideo), flagging render-cost worth-it vs not."
tier: STANDARD
---

# 921 - Recap Video: what else to add, and what it is worth on the render

> **Goal:** A prioritized do-next list for the spacetovideo recap pipeline, scoped to our
> reality (static long-form audio, local Remotion render that is fragile under per-frame cost).
> Extends doc 916 - does not repeat the captions/speaker-ID/distribution findings there.

## What we already ship (do not re-add)
spacetovideo components: TitleCard (now correct), HostBadge, IntroHero, GuestCard (speaker
card + pfp), Waveform, CaptionTrack (word-level color karaoke), TimeBadge, ProgressBar (new),
plus the ZABAL arcade reskin (gold + cyan) shipping in this render. So we already have:
per-speaker cards, captions, waveform, progress bar, title, brand skin.

## The render-cost lesson (the constraint that drives every call below)
The per-word `spring()` in the karaoke captions tripled render time (52min -> ~3h) and timed
out twice. **Rule: new on-screen elements must be CSS-static-per-frame** (color/position from
a simple time check), NOT per-frame physics/springs across many nodes. Anything that animates
per word or runs a spring per element is banned until we move to Remotion Lambda (doc 916).

## Key Decisions (do these)

| # | Add | Why | Render cost | Verdict |
|---|-----|-----|------------|---------|
| 1 | YouTube chapters in the DESCRIPTION (timestamps from transcript) | Chapters are non-negotiable for >20min video; clickable timestamps raise total watch time, and 0 render cost | none (text) | DO NOW - free, biggest win |
| 2 | On-screen segment/chapter title (a lower-third that names the current topic, changes a handful of times across the hour) | Gives the static hour navigation + visual change; reinforces audio with text (retention) | cheap (one text node, swaps on a time boundary) | DO - needs an LLM chapter pass first |
| 3 | Pull-quote cards (every few minutes, a big quote card flashes the line being said) | The "a visual change every 20-30s" rule that holds attention on static audio; produced feel | cheap (static text, time-gated) | DO if we want one more cheap win - needs 6-8 hand/LLM-picked quotes+times |
| 4 | End screen / outro CTA + intro bookend | End screens direct viewers onward (next session, the site); a cold-open hook earns the watch | none in render - SPLICE the user's existing intro/outro template clips via ffmpeg concat | DO - use the user's templates, not new Remotion cards |
| 5 | Speaker lower-third (persistent name+org bar while speaking) | Reinforces who is talking | cheap | SKIP for now - GuestCard already does this; marginal |
| 6 | Transitions/crossfades between speaker cards | Polish | small per-frame cost during transitions | SKIP - low ROI, adds render risk |
| 7 | B-roll / multiple angles / animated stat lower-thirds | Top production signal for VIDEO podcasts | n/a | SKIP - we have audio only and no stat data; not applicable |

## For THIS render (make the hour count)
Already batched and cheap: arcade reskin, fixed title, progress bar, color karaoke captions.
That is already the high-value, low-risk set. Two more worth folding in only if quick:
- **Pull-quote cards (#3)** - cheapest visual-variety win for static audio. Needs 6-8 quotes +
  timestamps (we have the transcript; an LLM pass picks them). Static text card, time-gated.
- **On-screen chapter titles (#2)** - needs the LLM chapter pass too; slightly more layout work.

Do **regardless of render** (free, do tonight): **#1 YouTube chapter timestamps** in the
description, and after the render, **#4 splice the intro/outro** templates.

Hold for the Remotion Lambda move (doc 916): anything per-frame-animated (richer transitions,
animated lower-thirds, motion graphics) - Lambda removes the local per-frame-timeout fragility.

## Findings
- **Chapters**: "non-negotiable for any podcast over 20 minutes"; description timestamps create
  clickable chapters that "significantly increase total watch time." Ours is 64 min - this is
  the single highest-leverage, zero-cost add.
- **Lower-thirds / chapter cards**: "small animated text bars... introduce speakers and
  highlight key points for better retention"; "chapter cards can mark section titles."
- **End screens**: "keep people engaged after episodes end by directing them to another
  episode, your website or social channels."
- **Visual variety**: "a thoughtful visual insert every 20-30 seconds can extend viewer
  attention"; "text overlays give the impression of a much more produced show." For static
  audio, our levers are caption motion + speaker-card swaps + pull-quote cards + chapter cards.
- **Retention**: "viewers retain information better when audio and visual reinforce each
  other"; "70% of viewers watch video podcasts in the foreground" - captions + on-screen text
  are doing real work, not decoration.

## Sources
- Vicinity Studio - 3 production techniques (lower thirds, chapter cards, graphics) - https://vicinity.studio/how-to-improve-your-video-podcast-3-production-techniques/ [FULL via search synthesis]
- Sweetfish Media - The 6 screens every video podcast needs (intro, lower-third, chapter, end screen) - https://www.sweetfishmedia.com/blog/the-6-screens-every-video-podcast-needs [FULL via search synthesis]
- YouTube Creator guide - engaging podcast content (chapters, retention) - https://blog.youtube/creator-and-artist-stories/the-definitive-guide-to-creating-engaging-podcast-content/ [PARTIAL - summarized from search result, not full-fetched]
- Venture Media - 2026 video podcast visual storytelling trends - https://www.venturemedia.io/post/top-video-podcast-trends-and-visual-storytelling-in-2026 [PARTIAL - summarized from search result]
- r/podcasting community thread on retention/chapters - [FAILED - zao-fetch-reddit returned empty; WebSearch blocks reddit.com for this agent. Community angle covered by doc 916's sources instead.]
- Remotion captions API (chapter/lower-third rendering patterns) - https://www.remotion.dev/docs/captions/api [FULL - per doc 916]

## Also See
- [Doc 916](../916-recap-video-pipeline/) - the full pipeline roadmap (captions, speaker ID, distribution, Lambda, cost)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Generate YouTube chapter timestamps from the AMA transcript for the description | @Zaal | Build (free) | With the upload |
| Splice the user's intro + outro template clips onto the finished render (ffmpeg concat) | @Zaal | Build | After render |
| Add an LLM pull-quote pass (6-8 quotes+times) -> static quote cards in spacetovideo | @Zaal | PR (spacetovideo) | Next iteration |
| Add LLM chapter pass -> on-screen segment-title lower-third | @Zaal | PR (spacetovideo) | Next iteration |
| Move rendering to Remotion Lambda before adding per-frame-animated elements | @Zaal | Build | When automating |
