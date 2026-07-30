---
topic: cross-platform
type: audit
status: research-complete
last-validated: 2026-07-29
related-docs: 606, 2132, 2134
original-query: "/zao-research more of my media and channels - comprehensive inventory of all Zaal's media + channels across every platform, state, and how to consolidate/preserve/repurpose. Grounds 'focus on all my content from everywhere'."
tier: DEEP
---

# 2135 - Zaal's media + channels inventory (the "content everywhere" map)

> **Goal:** One place that answers "where is all my content, what state is it in, and what do I do with it" - so the scatter becomes a plan (preserve / repurpose / find).

## Key Decisions (recommendations first)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | **PRESERVE first - your content is actively bleeding.** Two things lose content by default: Twitch VODs expire (~14 days) and 30GB+ of single-copy recordings sit only on the Mac. Back those up BEFORE any repurpose/build work. | Task 928 (URGENT: 64GB single-copy media, 30GB irreplaceable) + task 9023 (Twitch VODs expiring) are both open. Content lost is unrecoverable; everything else can wait. | @Zaal |
| 2 | **One archive, not scattered.** External drive (already partial: ZUSB backed up to SANDISK, task 1279) + Arweave/permaweb for the ZAO-canon ones (whitepaper task 579 already targets permaweb). Local recordings + Spaces `.mp4`s + downloaded VODs land there, indexed. | Turns "am I losing content everywhere?" into "it's all in one backed-up place." Ties to the second-brain (doc 606). | @Zaal |
| 3 | **Repurpose through ONE pipeline: `zaalclip` + Postiz.** You're already building it (tasks 939/940/1092/1093). One stream -> clips fanned to TikTok/IG Reels/YT Shorts/X. Don't build per-platform; finish the one router. | Firefly (team cross-poster) + Postiz + Livepeer/FlowStage are all in-flight. Consolidating on `zaalclip` avoids N half-built posters. Matches `[[feedback_firefly_only]]`. | @Zaal |
| 4 | **Fix the two account-integrity leaks now (cheap, time-sensitive):** the X @bettercallzaal display name (task 1090, deadline already passed 2026-07-20) and the squatted @wavewarz Instagram (task 1091, @wavewarsmusic). | Brand/handle integrity - a squatted handle + a wrong display name cost discoverability (ties to the GEO priority, task 724). Both are quick decisions, not builds. | @Zaal |
| 5 | **Farcaster is home; everything else is distribution.** Post native to Farcaster (@zaal + /zao channel), auto-fan everything else. Don't treat 13 platforms as 13 first-class homes. | You already live on Farcaster (zaalcaster is the whole thesis). One source, many mirrors, per the ICM-grounding "generate outward" model. | @Zaal |

## The full channel inventory

| Platform | Handle / URL | State | What's there | Risk / open task |
|----------|--------------|-------|--------------|------------------|
| **Twitch** | [@bettercallzaal](https://twitch.tv/bettercallzaal) | ACTIVE, AT-RISK | 62 past broadcasts (ZAO-VILLE LIVE, ZABAL GAMEZ, Solana TrencheZ, AI Music Tourney...) | VODs expire ~14d; no bulk-save (confirmed this session). Task 9023 | 
| **YouTube** | [@bettercallzaal](https://youtube.com/@bettercallzaal) | ACTIVE | Restream target, ZAO-VILLE LIVE, streams | Pull ZAO-VILLE off YT (1368); connect to Postiz for Shorts (1089) |
| **TikTok** | @zaoconcertz | NOT CREATED | (planned clipping account) | Create (1087) + Postiz (1093) |
| **Instagram** | @zaoconcertz (planned); **@wavewarz SQUATTED** | PARTLY BLOCKED | (planned Reels clip account) | Create @zaoconcertz (1088); @wavewarz taken by @wavewarsmusic - DECISION (1091) |
| **X / Twitter** | [@bettercallzaal](https://x.com/bettercallzaal) (+ @zaal, verify) | ACTIVE | posts, casts cross-posted, Spaces | Fix display name (1090, overdue); X longform drafts parked (611); Firefly cross-poster |
| **Farcaster** | **@zaal** (personal) + /zao channel + @thezao (org) | PRIMARY | casts, zaalcaster, the home base | Healthy - this is home |
| **Audius** | (account TBD) | DORMANT | music | "add music to audius" (598) |
| **Twitter Spaces** | via @bettercallzaal | ACTIVE (recorded) | `space_*.mp4` recordings on Mac | Songjam fork -> zaoos.com spaces (672); SongJam audio extension |
| **LinkedIn** | ZAO Festivals page | LOW-USE | event promo | Post ZAOstock promo (1249); Yulia cross-share |
| **Paragraph** | zaoonparagraph | ACTIVE | newsletter (5 drafts ready, PR #30) | Publish drafts (871); clean up flow (707); automation built (798) |
| **Hive** | (account TBD) | PLANNED | fractal content | Start weekly Monday fractal loop (1361) |
| **Facebook** | ZAOstock page | NOT CREATED | event | Create page (1250) + FB Event feeds Yodel calendar (655) |
| **Restream** | (tool) | ACTIVE | multi-platform stream router (Twitch+YT+X) | Setup done (887/891); the ingest layer |
| **Local (Mac)** | ~/Downloads + ~/Movies | AT-RISK | ~29 recordings + **30GB+ irreplaceable** | URGENT backup (928); partial SANDISK backup (1279) |

## The stack that ties it together (tools, not new platforms)

- **`zaalclip`** - the clip pipeline (Livepeer Agent MCP + Postiz + FlowStage): tasks 939/940/1092. This is the repurpose engine.
- **Postiz** - the scheduler that connects YouTube Shorts / TikTok / Instagram Reels for clip distribution: tasks 1089/1093.
- **Firefly** - team cross-poster (Farcaster/X/Bluesky) - `[[feedback_firefly_only]]`; a Firefly-alternative build is a parked decision (1256).
- **Restream** - the stream-out router (one live -> Twitch+YT+X).
- **Songjam / FlowStage** - Spaces audio capture + streaming.
- **`src/lib/publish/`** - the ZAO codebase's cross-platform posting (Farcaster, X, Bluesky) - the durable home for a consolidated poster.

## The three jobs (preserve / repurpose / find)

1. **PRESERVE (do first, content is bleeding):** back up the Twitch VODs + 30GB local + Spaces `.mp4`s to one archive (external drive + Arweave for ZAO-canon). Closes tasks 928, 9023, 9024.
2. **REPURPOSE (one pipeline):** finish `zaalclip` + Postiz so one stream fans to Shorts/Reels/TikTok/X automatically. The @zaoconcertz clip accounts (1087/1088) are the destinations.
3. **FIND (one index):** a single content map (extend doc 606 second-brain) listing every piece + where it lives + its clip status. This is the durable "all my content from everywhere" surface.

## Also See
- [Doc 606](../../identity/606-zaal-second-brain-system/) - the second-brain system (where the content index lives)
- [Doc 2134](../../events/2134-heart-of-ellsworth-promo-jul28/) - ZAO Stock content promo (Maryland content + org video reuse)
- `[[project_capture_triage_crush_loop]]`, `[[feedback_firefly_only]]`, `[[user_social_handles]]`, `src/lib/publish/`

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Back up the 30GB+ irreplaceable ~/Movies + at-risk Twitch VODs to one archive (external + Arweave for ZAO-canon) | @Zaal | preserve | 2026-08-05 |
| Finish `zaalclip` + Postiz so one stream auto-fans to Shorts/Reels/TikTok/X | @Zaal | build | 2026-08-15 |
| Create the @zaoconcertz TikTok + Instagram clip accounts (the repurpose destinations) | @Zaal | setup | 2026-08-10 |
| Decide the squatted @wavewarz Instagram (report/rebrand/ignore) + fix X @bettercallzaal display name | @Zaal | decision | 2026-08-05 |
| Build the one content index (extend doc 606) listing every piece + location + clip status | @Zaal | build | 2026-08-22 |

## Sources
- ZAO cowork board - 51 channel/media tasks queried live 2026-07-29 (Twitch/YT/TikTok/IG/X/Audius/Spaces/LinkedIn/Paragraph/Hive/Facebook/Restream/local + zaalclip/Postiz/Firefly) - `[FULL]`.
- This session's direct findings: Twitch @bettercallzaal Video Producer (62 past broadcasts, confirmed logged-in 2026-07-29), the ~29 Downloads recordings, the `space_*.mp4` files - `[FULL]`.
- `[[user_social_handles]]` (FC @bettercallzaal, X @zaal - handle inconsistency flagged), `[[feedback_firefly_only]]`, doc 606 - `[FULL]` (session memory).
- Channel URLs: [twitch.tv/bettercallzaal](https://twitch.tv/bettercallzaal), [youtube.com/@bettercallzaal](https://youtube.com/@bettercallzaal), [x.com/bettercallzaal](https://x.com/bettercallzaal) - `[PARTIAL]` - listed from board/memory; public-state not deep-crawled this pass (the at-risk ones were verified in-session).
