# ZAOville July 25 - Content Runbook

> **Event:** ZAOville (ZAO Festivals dry-run)
> **Date:** Saturday July 25, 2026
> **Location:** DCoop's house, Laurel, MD (private property)
> **Role for Zaal:** Arrive after drive from DC on Fri Jul 25; livestream + content capture + ZAO Festivals prep
> **Livestream Lead:** Ohnahji B (confirmed 2026-07-12)

---

## Key Decisions

| Decision | Answer |
|----------|--------|
| **Primary purpose** | Dry-run of ZAOstock livestream + production setup before Oct 3 |
| **Multistream platform** | Restream (YouTube + TikTok + X Live simultaneously) |
| **Content POV** | Zaal = ZAO community reporter; DCoop = host + performer |
| **Post-event deliverable** | 3 Reels/TikTok clips via FlowStage + 1 Farcaster recap post |
| **ZAO Festivals angle** | Every setup decision = a lesson for ZAOstock; log observations |

---

## Pre-Event Checklist (Day Before - Fri Jul 25)

- [ ] Confirm Restream account credentials loaded on Zaal's machine
- [ ] Confirm Restream destinations active: YouTube, TikTok, X Live
- [ ] Test Ohnahji B's streaming rig over Zaal's hotspot (different carrier from Ohnahji's phone)
- [ ] Charge all devices: Meta Ray-Ban glasses, phones, external battery packs
- [ ] Clear storage on phones (raw footage from shows can hit 20+ GB)
- [ ] Download Larix Broadcaster app as backup stream source on a secondary phone
- [ ] Coordinate stream keys with Ohnahji B: share the Restream RTMP URL + stream key
- [ ] Set up Restream channel titles: "ZAOville - ZAO Music Showcase - Laurel MD"
- [ ] Prep push notification draft in COC Concertz app (if applicable): "ZAOville is LIVE - WaveWarZ vibes from DCoop's house"

---

## Multistream Setup

### Restream Configuration

| Destination | Use | Notes |
|-------------|-----|-------|
| YouTube | Main VOD archive | Set title: "ZAOville Live - ZAO Music Showcase Jul 25 2026" |
| TikTok Live | Discovery reach | Keep stream under 4h (TikTok limit) |
| X Live | Farcaster cross-audience | Tweet/cast when live: "ZAOville is live - ZM [link]" |

### Signal Chain (VEC Sound In / Livestream)

VEC provides all sound equipment. Clean audio feed for stream:

```
PA mains → DI box (Whirlwind IMP 2 or equivalent) → USB audio interface 
(Behringer UMC202HD or equivalent) → laptop → OBS/Restream Studio
```

If VEC PA does not have a DI tap available: use XLR out from mixer → DI → USB interface.

### Connectivity

- **Primary:** Zaal's phone hotspot (Verizon or AT&T)
- **Backup:** Ohnahji B's phone hotspot (different carrier)
- **Minimum upload speed needed:** 6 Mbps for 1080p30 simultaneous Restream
- **Test before go-live:** Run `speedtest-cli` or fast.com from the streaming laptop

### Camera Angles

| Role | Device | Position |
|------|--------|----------|
| **Main stage** | Owned camera (clean HDMI → ATEM or direct to laptop) | Locked-off wide shot of performance area |
| **POV / social b-roll** | Meta Ray-Ban glasses | Zaal walking around, crowd reaction, artist moments |
| **Crowd / atmosphere** | Secondary phone (Larix → Restream as extra source) | Handheld, wide angle |

---

## Content Capture List

### During Event

| Moment | Who captures | How | Output |
|--------|-------------|-----|--------|
| **DCoop performance** | Ohnahji B (stream) + Zaal (Ray-Ban) | Camera + glasses | Full VOD on YouTube + POV b-roll |
| **Artist introductions** | Zaal | Phone video vertical | Instagram Stories / Reels raw |
| **Crowd reaction during WaveWarZ mention** | Zaal | Phone or Ray-Ban | Short clip for TikTok ("the people know WaveWarZ") |
| **Zaal talking to camera** | Selfie or Ohnahji | Vertical phone | "ZM from ZAOville - this is what a ZAO community event looks like" |
| **VEC sound setup** | Zaal | Phone | B-roll for ZAOstock production doc: "here's what zero-cost sound looks like" |
| **Post-show DCoop debrief** | Zaal + DCoop | Phone, casual | Clip: "what worked / what we'd do differently for ZAOstock" |

### Priority Clips (in order)

1. **DCoop performing** - min 60s of the best track. Clip for Reels/TikTok.
2. **ZAO community moment** - crowd, energy, vibe. 30s clip with Zaal voiceover "this is The ZAO in real life"
3. **Production/setup b-roll** - mic, board, speakers. Annotated for ZAOstock planning.
4. **Zaal-to-camera recap** - 60-90s straight-to-phone. What happened, why it matters for ZAOstock.

---

## ZAO Festivals Prep Angle

This event is explicitly a **livestream and production dry-run** for ZAOstock (Oct 3, 2026, Ellsworth ME). Log observations as you go:

### What to Observe + Document

| Observation | Log where |
|-------------|-----------|
| How fast did we get a clean stream signal? | `/ZAO-STOCK/planning/zaovil-lessons.md` (create if new) |
| Did Restream multi-destination work without lag? | Same file |
| What did VEC's sound setup look like vs. what we'll rent for ZAOstock? | Same file |
| How long was setup-to-stream? | Same file - target is under 45 min for ZAOstock |
| Chat engagement across YouTube / TikTok / X? | Note viewer counts |
| What did Ohnahji B need to troubleshoot? | Brief note for production team |

After the event: bring these observations into a ZAOstock planning update PR (add to `planning/timeline.md` or `planning/staffing.md`).

---

## Post-Event Content Pipeline

### Same Day (Jul 25 evening)

1. Upload raw clips to Restream clip storage or download from YouTube VOD
2. Pick 3 best moments (see Priority Clips above)
3. Run through FlowStage: audio from best DCoop track → aesthetic overlay → 30–60s render (see Doc 1169)
4. Schedule via Postiz: TikTok + Instagram Reels, post Sat evening or Sun morning

### Day After (Sun Jul 26 - drive back)

1. Post Farcaster recap: "ZM. ZAOville was real. [2-3 sentences about the energy]. ZAOstock is next - Oct 3. [YouTube VOD link]"
2. Cross-post via Firefly to X
3. Post to ZAO Discord + Telegram
4. Add viewer counts + key observations to `zaovil-lessons.md` before memory fades

### Week of Jul 26-Aug 1

1. FlowStage clips posted; check engagement (saves, shares, comments)
2. YouTube VOD: add timestamp chapters, ZAO-formatted description (see Doc 351/353)
3. PR `zaovil-lessons.md` to main → feeds ZAOstock planning

---

## Gated Items (Zaal must do)

- **Book return flight** from Jacksonville → BOS (or DCoop area → BOS) after Jul 25 event
- **Add DCoop ZAOville to calendar:** July 25, Laurel MD, arrive by 2pm, livestream starts target 4pm
- **Connect Restream destinations** if not already done (YouTube, TikTok, X Live stream keys)
- **Coordinate with Ohnahji B** before leaving FL: confirm he's confirmed for Jul 25, share Restream access

---

## Quick Reference

| Item | Value |
|------|-------|
| DCoop handle | @DCoopOfficial (X), @coopdville2000 (IG) |
| ZAOville budget | $450-$1,100 (venue + sound = $0 via VEC + private property) |
| Restream target | YouTube + TikTok Live + X Live |
| Minimum stream bitrate | 6 Mbps upload |
| FlowStage render time | 30-60 seconds (async, see Doc 1169) |
| ZAOstock date | October 3, 2026, Ellsworth ME |

---

## Sources

- Doc 1013: `research/business/1013-zaofestivals-budgets-zaostock-zaoville/README.md`
- Doc 1030: `research/events/1030-zaostock-livestream-media-production/README.md`
- Doc 232: `ZAO-STOCK/research/232-zao-stock-team-deep-profiles/README.md` (DCoop profile)
- Doc 1169: `research/cross-platform/1169-flowstage-music-shortform-api/` (FlowStage clips)
- Doc 1170: `research/cross-platform/1170-zao-platform-management-strategy/` (Postiz scheduling)
- Board task: `trip-jul` (cowork board, 2026-07-16)
