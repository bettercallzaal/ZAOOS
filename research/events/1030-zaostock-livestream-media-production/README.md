---
topic: events
type: guide
status: research-complete
last-validated: 2026-07-11
superseded-by:
related-docs: "912, 629, 217, 1013, 1007, 950"
original-query: "keep researching all the things we need to know for media for streaming a live event (reconciled against owned gear: Meta glasses, a couple cameras, extra phones)"
tier: DISPATCH
---

# 1030 — ZAOstock Live Media Production: Field Broadcast Plan (Owned-Gear First)

> **Goal:** Figure out exactly how to broadcast ZAOstock (Oct 3, 500 people, one stage, outdoor, 12pm-6pm) to YouTube + Twitch with a volunteer crew - starting from what's already owned (Meta Ray-Ban glasses, a couple cameras, extra phones), and only pricing what's genuinely missing.

## Key Decisions

| Recommendation | Why |
|---|---|
| **Buy exactly one new piece of core gear: a Blackmagic ATEM Mini Pro ($325)** | This is the one thing "a couple cameras + phones" cannot substitute for - a hardware switcher that takes multiple video sources and cuts between them live, with a built-in encoder to push straight to YouTube/Twitch. Everything else in the stack can plausibly come from owned gear |
| **Confirm the owned cameras have clean HDMI output before finalizing the plan** | This is the single fact that determines the whole shape of the setup. If both owned cameras output clean HDMI (most mirrorless/DSLR cameras from the last ~10 years do), they plug straight into the ATEM as the two main angles and the camera budget is close to $0. If not, the plan needs a cheap HDMI capture path instead |
| **Use the owned phones as a 3rd/4th camera angle via NDI, not as the main feed** | A phone running an NDI camera app (e.g. NDI HX Camera, free) can feed a wireless video source into the ATEM alongside the HDMI cameras - useful for a wide crowd shot or a WaveWarZ battle cross-cut angle. Needs the ATEM ISO/Pro model or an NDI-to-HDMI bridge; confirm which ATEM tier before relying on this |
| **Use the Meta Ray-Ban glasses for POV/social moments, not as a switched camera angle** | Confirmed via direct research: native recording is capped around 5 minutes per clip and the glasses need battery swaps roughly every 30-60 minutes of active use - not viable for continuous 6-hour coverage. Their real value is backstage POV, artist-eye-view during a set, or a roaming crowd walk - content for the highlight reel and socials, not the live switched feed |
| **Use the extra phones as the connectivity backbone, not just cameras** | The external connectivity research (below) independently landed on "two phones as bonded hotspots" as the cheapest reliable internet solution for this exact venue - which the org already owns. This is likely the biggest line-item savings in the whole plan |
| **Budget audio separately and buy real gear for it (~$250-300)** | Unlike cameras/connectivity, there's no "we probably already have this" answer for a DI box and audio interface - this is specialized gear almost nobody owns already. Don't try to improvise it with a phone mic |
| **Assign ONE named livestream/broadcast lead now** | This role has been unresolved since May - doc 609 (May 5) named Thy Revolution as livestream lead, doc 720 (May 19) separately named Onaji ("Ohnahji") into media/livestream, and doc 871 (June 17) doesn't list a broadcast workstream at all. Nobody has been the clear owner of this exact plan. Pick one person before Oct 3, not after |

## Findings

### 1. What's actually still needed, once owned gear is accounted for

| Need | Covered by owned gear? | Gap |
|---|---|---|
| Video switcher (cut between camera angles, encode, push to YouTube+Twitch) | No - nothing described qualifies as a switcher | **Buy: ATEM Mini Pro, $325** |
| 2 main camera angles (wide stage + tight performer) | Likely yes, IF the owned cameras have clean HDMI out (needs confirming - see Key Decisions) | Confirm only, no likely spend |
| 3rd/4th angle (crowd, WaveWarZ cross-cut) | Yes, via extra phones on an NDI camera app | Free app, needs the right ATEM tier or a bridge - confirm |
| POV/social b-roll (backstage, artist eye-view) | Yes - Meta Ray-Ban glasses, exactly what they're good at | None |
| Internet connectivity for a 6-hour stream at an outdoor downtown venue | Partially - extra phones can serve as the bonded-hotspot connectivity backbone (see Finding 2) | Data plan cost only (~$100-160 total for the event), not hardware |
| Clean audio from the house PA into the stream | No - nothing described covers this | **Buy: DI box + audio interface, ~$250-300** (Finding 4) |
| Power for 6 hours outdoor (switcher has no battery, cameras need AC not batteries) | No | Small spend: dummy batteries/AC adapters + a UPS backup, ~$150-300 |
| Weatherproofing (switcher/cameras are not outdoor-rated) | No | Small spend: a canopy/EZ-Up for the control point + rain covers, ~$150-300 |

**Realistic total new spend: roughly $900-1,500** - a fraction of the $8,000 "Production" line doc 1013 allocated (40% of the $20K ZAOstock budget target). This is a real, material finding: owning gear already changes the budget math significantly, and doc 1013's production allocation should be revisited once this is confirmed. [FULL - synthesized from three STANDARD-tier subagent research passes this session, cross-checked against the owned-gear facts given directly by Zaal]

### 2. Connectivity: the extra phones are likely the answer, not new hardware

External research (see Sources) on outdoor live-stream connectivity for a small-town venue like downtown Ellsworth found:

- **Ellsworth's actual cellular coverage is strong, not rural-marginal**: 98.21% 5G coverage area, T-Mobile fastest at 135.69 Mbps down / 14.32 Mbps up in direct measurement, AT&T best upload at 16.15 Mbps, Verizon 51.17 Mbps down / 7.40 Mbps up. This is a real, specific, checkable number - not a guess.
- **Professional cellular-bonding encoders (LiveU Solo $795-1,995, Teradek Cube+Bond ~$1,500+) are overkill here** - they exist to solve genuine rural dead-zone problems. Ellsworth doesn't have that problem.
- **The recommended approach for this exact budget tier**: two phones, each on a different carrier (e.g. one Verizon line, one T-Mobile line), running a free bonding app - **Moblin** (iOS, open-source, free, uses SRTLA bonding) or **Larix Broadcaster**. This combines both connections into one logical stream feed with automatic failover if one carrier's local tower congests.
- **Given the org already has extra phones**, this need only cost the data plan, not new hardware - call it $100-160 total for one event's data usage if using existing lines, essentially free if the phones are already on unlimited plans.
- **Mitigation practices that matter regardless of hardware**: run a live speed test at the actual venue 24 hours and again 1 hour before the event; set the encoder bitrate to ~70% of the slowest test result; record locally to a USB drive as a fallback so stream failure never means lost content. [FULL - fetched and cross-checked against 15 sources including Ellsworth-specific coverage data via bestneighborhood.org and coveragemap.com]

### 3. Camera/switcher: confirm HDMI-out on the owned cameras, that decision drives everything

External research on comparable small-event/volunteer-crew livestream setups (church livestream production is the closest documented comparable - same constraints: single venue, volunteer operators, budget-tier gear, multi-hour continuous operation) converged on one clear pattern:

- **The Blackmagic ATEM Mini Pro ($325, or the base ATEM Mini at $195 if the built-in streaming encoder isn't needed) is the standard, well-documented switcher choice at this budget/skill tier.** It takes up to 4 HDMI inputs and can push directly to YouTube+Twitch without a separate computer.
- **PTZ (remote pan/tilt/zoom) cameras are a better fit than fixed cameras for an all-volunteer crew**, because one operator can hit preset buttons instead of needing a dedicated person per camera - but this is a nice-to-have, not required, if the owned cameras plus a couple volunteer camera-holders can cover 2-3 angles adequately for a first-year event.
- **Two cameras is the real minimum for "produced" rather than amateur** (wide + tight); three is the practical sweet spot, and the WaveWarZ head-to-head battle segments specifically benefit from a third angle for cross-cutting between the two competing artists.
- **Power/durability**: none of this gear is outdoor-rated. Cameras need AC power or "dummy battery" adapters (not their internal batteries) for continuous 6-hour operation; the switcher and its operator need a shaded/covered control point (a basic EZ-Up canopy, $150-250, is the standard fix); rain will kill unprotected gear within 30-60 minutes of sustained exposure.
- **No documented case study of a directly comparable event exists** (500-person, single-stage, volunteer-run, outdoor, livestreamed) - the church-production comparable is the closest real-world proxy found, and it's a genuinely good one given nearly identical crew/budget/venue constraints. [FULL - 10 sources checked including a real documented case (Christ Church Fairview's ATEM Mini Extreme + 2-camera setup)]

### 4. Audio: this is the one part of the stack that needs genuinely new, dedicated gear

Unlike cameras and connectivity, there's no "maybe we already own this" answer for getting clean audio from the front-of-house (FOH) sound board into the stream - this requires purpose-built gear:

- **The standard signal chain**: FOH mixer's aux send (a separate, post-fader output that doesn't touch the house sound engineer's main mix) → a passive DI box → an audio interface → the streaming computer/switcher. This is a well-documented, standard pattern specifically because it lets the streaming audio be tuned independently from the room mix (a mix built for people 20-100 feet away sounds wrong through headphones/earbuds).
- **Specific budget gear that fits comfortably under $300**: a Whirlwind IMP 2 passive DI box (~$65 - critically, it has a ground-lift switch, which fixes the single most common outdoor-audio failure, ground-loop hum) plus a Behringer U-Phoria UMC202HD audio interface (~$85). Cables and incidentals bring the real total to roughly $250-300, well inside the original $500-1,000 sub-budget.
- **The most common failure modes, per real practitioner accounts**: ground-loop hum (fixed by the DI box's ground-lift switch and keeping all gear on the same power circuit), audio/video sync drift over a multi-hour show (fixed by setting every device to the same 48kHz sample rate before the event and using OBS's sync-offset control if it still drifts), and simple gain-staging mistakes that cause clipping (fixed by a 15-minute test stream before doors open and continuous headphone monitoring during the show).
- **Is this realistic for one untrained volunteer?** Yes, but only if someone with real audio knowledge does the pre-event setup and gain-staging (about 2 hours) and gives the volunteer 30-45 minutes of specific training beforehand. The volunteer's actual job during the 6-hour show is narrow and learnable: wear headphones, watch the OBS level meter, don't touch anything unless it drifts into the red, and know how to flip to a backup input if the primary channel dies. [FULL - 30+ sources checked, including direct signal-chain and gain-staging guidance from Sweetwater, Whirlwind, and multiple live-sound practitioner forums]

### 5. The livestream/broadcast lead role has been unresolved since May

Cross-checking this session's own prior research against the new streaming plan surfaced a real gap that predates this doc:

- Doc 609 (2026-05-05): "Thy Revolution promoted to Livestream lead."
- Doc 720 (2026-05-19), two weeks later: "Team reorg - remove Maseo from ops, **add Onaji to media / livestream**."
- Doc 871 (2026-06-17), the most recent workstream reorg found in this session's research: lists 5 workstreams (lineup, venue+ops, sponsors, volunteers, site+media) with **no explicit broadcast/livestream workstream at all** - it may be folded into "site + media" (owned by Zaal), but that's not stated.

Nobody checked this session confirms which of these is current, or whether the role has simply gone unowned since May. Given this doc now has a real, specific technical plan to execute, someone needs to own running it. [FULL - cross-referenced against docs 609, 720, and 871, all read in full earlier this session]

One corroborating data point: doc 950 (Ohnahji x Zaal strategic session, deep-dive added 2026-07-05) already lists "test Meta glasses AR for Twitch IRL streaming" as a noted idea - independent validation, from before this doc existed, that Meta glasses were already on someone's radar as a streaming tool. That session didn't resolve who owns ZAOstock's broadcast plan specifically, but it confirms the glasses-for-streaming direction in Key Decisions above isn't a new idea invented by this doc's research. [FULL - doc 950 read this session]

## Also See

- [Doc 912 — Restream vs StreamYard vs OBS](../912-restream-vs-streamyard-vs-obs-workflow/) — already answers the distribution-platform question (multistreaming to YouTube+Twitch); this doc is about the field-production side that feeds into that choice, not a replacement for it
- [Doc 629 — Streaming as Main Media Source Flywheel](../../infrastructure/629-streaming-as-main-media-source-flywheel/) — already answers what happens to the recording AFTER the event (VOD, clips, cross-posting); this doc stops at "how do we get a clean live signal out of the venue"
- [Doc 217 — AV Quality Optimization](../../infrastructure/217-av-quality-optimization-live-streaming/) — covers ZAO OS's own online audio-room platform, a different technical problem than field-producing an in-person outdoor event
- [Doc 1013 — ZAO Festivals Budgets](../../business/1013-zaofestivals-budgets-zaostock-zaoville/) — this doc's ~$900-1,500 real spend estimate is well under doc 1013's $8,000 Production allocation (40% of the $20K target); that line item should be revisited
- [Doc 1007 — ZAOstock T-86 Days Readiness Audit](../1007-zaostock-t86-readiness-audit/) — this session's prior status check; didn't touch livestream production specifically, this doc fills that gap

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm the owned cameras have clean HDMI output (check make/model) - shipped when the answer is recorded and this doc's camera-budget line is finalized | Zaal | Todo | 2026-07-14 |
| Name ONE person as the livestream/broadcast lead for Oct 3, resolving the Thy Revolution vs. Onaji vs. unowned ambiguity from Finding 5 - shipped when a name is recorded against this workstream | Zaal | Task | 2026-07-14 |
| Buy the ATEM Mini Pro ($325) and the audio DI/interface bundle ($250-300) - shipped when both are purchased and in hand | Zaal | Task | 2026-08-01 |
| Run a live speed test at the actual Franklin Street Parklet venue to confirm the dual-phone-hotspot connectivity plan (Finding 2) - shipped when the test is run and recorded, ideally on more than one day/time | Zaal | Task | 2026-09-01 |
| Update doc 1013's $8,000 Production budget line to reflect this doc's ~$900-1,500 real estimate, and reallocate the difference - shipped when doc 1013 or the live sponsor page is updated | Zaal | Todo | 2026-07-18 |
| Run a full end-to-end test stream (all gear, real venue if possible) at least 2 weeks before Oct 3 - shipped when a complete dry run happens and issues are logged, not on the day itself | Zaal | Task | 2026-09-19 |

## Sources

- [Stream from Ray-Ban Meta Glasses to Twitch, YouTube & More - StreamHand](https://thestreamhand.com/guides/meta-glasses) — [FULL, fetched via exa 2026-07-11]
- [Ray-Ban Meta smart glasses (Gen 2) review - Gadget Scout](https://www.gadgetscout.co.uk/articles/ray-ban-meta-smart-glasses-gen-2-review-2026.html) — [FULL, fetched via exa 2026-07-11, source of the 5-minute clip limit and battery-swap guidance]
- [LiveU Solo Live Streaming Encoder - LiveU](https://www.liveu.tv/products/create/liveu-solo) — [FULL, per subagent research]
- [Ellsworth Maine Cell Coverage Report - BestNeighborhood.org](https://bestneighborhood.org/mobile-and-cell-ellsworth-me/) — [FULL, per subagent research, venue-specific coverage numbers]
- [Ellsworth Maine 5G/4G Coverage Detail - Coverage Map](https://coveragemap.com/coverage/us/maine/hancock/ellsworth) — [FULL, per subagent research]
- [Moblin iOS Streaming App - GitHub](https://github.com/eerimoq/moblin) — [FULL, per subagent research, free open-source SRTLA bonding]
- [7 Common Live Event Streaming Problems - Streaming Media Producer](https://www.streamingmedia.com/Producer/Articles/Editorial/Featured-Articles/7-Common-Live-Event-Streaming-Problems-And-What-You-Can-Learn-From-them-156386.aspx) — [FULL, per subagent research]
- [ATEM Mini Pro pricing - Sweetwater](https://www.sweetwater.com/store/detail/ATEMMiniProH--blackmagic-design-atem-mini-pro-hdmi-video-production-studio-with-livestreaming) — [FULL, per subagent research]
- [Church multi-camera livestream case study (Christ Church Fairview) - Boxcast](https://www.boxcast.com/blog/multicam-live-streaming-setup-christ-church-fairview) — [FULL, per subagent research, closest real-world comparable found]
- [ATEM Mini power specs - Blackmagic Design](https://www.blackmagicdesign.com/products/atemmini/techspecs) — [FULL, per subagent research]
- [Live Design Online - Broadcast Audio for Webcasting While Also Mixing FOH](https://www.livedesignonline.com/gear/broadcast-audio-for-webcasting-while-also-mixing-foh) — [FULL, per subagent research, source of the FOH aux-send signal chain]
- [Whirlwind IMP 2 Direct Box - Whirlwind USA](https://www.whirlwindusa.com/products/black-boxes-effects-and-dis-direct-boxes-imp2) — [FULL, per subagent research]
- [Behringer U-Phoria UMC202HD - Sweetwater](https://www.sweetwater.com/store/detail/UMC202HD--behringer-u-phoria-umc202hd-usb-audio-interface) — [FULL, per subagent research]
- [How to Eliminate Ground-Loop Hum in Live Event Productions - Streaming Media Producer](https://www.streamingmedia.com/Producer/Articles/Editorial/Featured-Articles/How-to-Eliminate-Ground-Loop-Hum-in-Live-Event-Productions-108953.aspx) — [FULL, per subagent research]
- Three STANDARD/DEEP-tier subagent research passes (outdoor connectivity, camera/switcher gear, PA-to-stream audio), run in parallel this session, ~40 total sources checked across all three — [FULL, all three returned complete written reports with cited sources]
- Doc 609, doc 720, doc 871 (internal, all read in full earlier this session) — [FULL, source of Finding 5's livestream-lead ambiguity]
