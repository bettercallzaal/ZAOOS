---
topic: events
type: runbook
status: active
last-validated: 2026-07-17
related-docs: "1036 (media plan), 1030 (ZAOstock production), 1032 (ZAOstock day-of plan)"
tier: DISPATCH
---

# 1228 — ZAOville Jul 25 Day-Of Operational Runbook

> **Event:** The VEC & ZAO Festivals presents "The ZAOville Pool Party" | Dcoop's house, Laurel MD | Saturday July 25 2026 | 11:00 AM – 10:00 PM | Free entry, free drinks | RSVP to @dcoopofficial

---

## TL;DR

ZAOville is the **dry run** for ZAOstock Oct 3 — same gear stack, lower stakes, private venue. The livestream is the new variable. Everything else is a summer pool party.

**Zaal's 3 pre-event gated actions** (must happen before Jul 25):
1. **WiFi speed test** at DCoop's house — if <15 Mbps upload, revert to phone-hotspot bonding
2. **Confirm VEC mixer has aux-send** — if not, plan alternative audio tap point
3. **Confirm 11AM–3PM coverage owner** — Trey and ELYVN already volunteered content; name who coordinates

---

## Day Arc

| Time | Phase | Location | Capture Priority |
|---|---|---|---|
| 10:00 AM | Crew arrives, setup | Indoors + deck | Setup docs only |
| 11:00 AM | Vibe Sesh / Grub Out | Pool area | Meta glasses, phone content |
| 12:00 PM | Open arrival + mixer | Pool area | Social clips, attendee shots |
| 3:00 PM | Open Mic | Stage area | Full switched stream starts |
| 5:00 PM | Performances begin | Stage area | Full stream, archiving |
| 7:00 PM | Lighting transition | Outdoor + indoor | Adjust exposure, add artificial light |
| 8:40 PM | Finale performance | Stage area | Priority capture |
| 9:30 PM | Night Swim DJ set | Pool / deck | Meta glasses POV, social posts |
| 10:00 PM | Wrap | All areas | Pack gear, post-event debrief |

---

## T-Minus Checklist

### T-7 days (Jul 18 — today, do now)
- [ ] WiFi test at DCoop's: run `fast.com` or speedtest.net (need ≥15 Mbps upload for stable stream)
- [ ] Confirm VEC mixer model — ask DCoop if it has an AUX SEND output
- [ ] Coordinate Trey/ELYVN pre-arrival content: confirm they'll film the drive-down, set a shared folder
- [ ] Zaal: check Restream credentials are saved in `~/.zao/private/restream.env`

### T-2 days (Jul 23)
- [ ] Charge all batteries: Meta glasses, phones, camera, spare packs
- [ ] Test ATEM Mini Pro with 2 camera sources — confirm HDMI out clean
- [ ] Pack checklist (see Gear list below)
- [ ] Restream: log in, verify ZAO stream key is correct, do a 5-min test stream

### Day-of setup (arrive by 10:00 AM, setup complete by 2:30 PM)
- [ ] Find the power circuit: plug in ATEM, audio interface, MacBook — NO tripping the breaker
- [ ] Set up fixed dry-control point AWAY from pool: ATEM + audio interface + MacBook indoors or under cover
- [ ] Confirm WiFi or cellular bonding is live (test with fast.com on the hotspot/WiFi)
- [ ] Run audio: VEC mixer aux-send → DI box → ATEM audio input
- [ ] Camera angles: Camera 1 (wide/stage), Camera 2 (crowd/artist POV)
- [ ] Restream test: push 30 seconds live to ZAO channel, confirm picture + audio
- [ ] Meta glasses: charge, unpair/re-pair to phone, test a 5-minute clip capture
- [ ] Designate "pool-side coordinator": one person owns Meta glasses + phone POV near water — NEVER the ATEM operator

---

## Gear List

| Item | Status | Notes |
|---|---|---|
| ATEM Mini Pro (switcher/encoder) | Required | $325 if not yet bought — doc 1030 decision |
| MacBook (streaming computer) | Required | Runs Restream, ATEM Software Control |
| Camera 1 (wide angle, HDMI out) | Required | Confirm clean HDMI output before arriving |
| Camera 2 (or phone on tripod) | Required | Second angle or crowd/artist POV |
| Meta Ray-Ban glasses | Required | POV/social b-roll, 5-min clips, charge in advance |
| DI box (audio interface) | Required | VEC mixer aux → DI → ATEM audio |
| XLR cable (10ft+) | Required | DI box to ATEM |
| HDMI cables (2x 6ft) | Required | Cameras to ATEM |
| Power strip + extension cord | Required | Fixed control point needs multi-outlet |
| Phone (Zaal's) | Required | Restream app backup + hotspot if WiFi fails |
| Spare batteries / power banks | Strongly recommended | Meta glasses drain fast, camera backup |
| Waterproof bag/case | Required | One for the ATEM at minimum — pool party |

---

## Stream Setup

**Platform:** Restream → simultaneous Twitch + YouTube (optional: Farcaster via ZAOS)

**Settings:**
- Resolution: 720p or 1080p (match to WiFi upload capacity)
- Bitrate: 3500–4500 kbps for 720p
- Audio: 44.1 kHz, stereo, AAC 128kbps

**Restream scene setup:**
1. "PRE-SHOW" — static ZAO/ZAOville graphic
2. "WIDE" — Camera 1 wide stage view
3. "ARTIST" — Camera 2 artist POV
4. "CROWD" — phone on tripod, crowd angle
5. "BRB" — between-set break graphic (use ZAO branding from doc 1033 photo calendar assets)

**ATEM settings:**
- Multiview monitoring: Cameras 1+2 + program + preview visible at all times
- Audio: mixer to ATEM line in, levels set before stream starts
- Record to SD: enable local recording for archive (primary archive is Restream; SD = backup)

---

## Audio Signal Chain

```
VEC DJ/PA mixer
       ↓ (AUX SEND or INSERT SEND — confirm model)
  DI Box (passive)
       ↓ XLR
ATEM Mini Pro (audio input)
       ↓
 Restream/stream encoder
```

**If VEC mixer has no aux-send:**
Option A: Splice from DJ controller headphone output → audio interface → USB → MacBook
Option B: Place a Shure SM57 near a speaker cab → DI → ATEM (accept some bleed)
Option C: Ask the DJ to provide a USB/USBC audio feed directly from their setup

---

## Lighting Transition Plan

**Issue:** The event runs 11AM → 10PM. Light changes dramatically around 7–8PM.

**Plan:**
- 11AM–6PM: Camera set to auto-exposure OR Manual at ISO 400, f/5.6, 1/60s
- 6PM: Aperture/ISO check — raise ISO, open aperture as ambient drops
- 7PM–10PM: If stage lights are available (ask VEC/DCoop), position one warm LED toward the artist face for the camera. Phone flashlights in a pinch.
- Meta glasses: switch to iPhone "night mode" equivalent for 7PM+ clips
- Restream "BRB" scene during any light adjustment — don't go live during exposure reset

---

## Roles

| Role | Person | Responsibility |
|---|---|---|
| Stream operator | Zaal | ATEM control, Restream monitoring, audio levels |
| Camera 1 | TBD (confirm) | Wide/stage angle, stationary on tripod |
| Camera 2 / POV | TBD (confirm) | Artist POV, moveable |
| Meta glasses / socials | Pool-side volunteer | POV near water, 5-min clips to shared folder |
| Artist/crowd coordinator | Trey | Coordinate with ELYVN, manage pre-arrival content |
| ZAO host | DCoop | MC, stage cues, intro/outro |

---

## Contingency Plans

| Failure | Response |
|---|---|
| WiFi drops mid-stream | Phone hotspot bonding (Moblin/Larix app, 2 carriers) |
| ATEM hardware failure | Phone directly to Restream via RTMP (degraded quality, single angle) |
| Audio feed lost | Switch Restream audio to phone mic or laptop mic (last resort) |
| Power circuit trips | Reduce load: unplug camera 2, reduce to single-angle stream |
| Restream service down | Go live to YouTube only via OBS or Streamlabs on MacBook |
| Meta glasses battery dead | Phone replaces for social POV clips |

---

## Post-Event (within 24h, Jul 26)

1. **Archive the stream** — download Restream cloud recording (retained 30 days)
2. **Restream clips** — export 3-5 highlight clips from the recording (best artist moments, crowd energy)
3. **Social posts** — post photos/clips to Farcaster, Instagram, Warpcast same night or next morning
4. **ZAO recap** — ZAI writes the recap (same workflow as COC #7)
5. **Lessons doc** — update doc 1030 (ZAOstock production) with ZAOville learnings before Oct 3

---

## Sources

- Board task `cf08df9e` (Prep for ZAOville DC livestream weekend)
- Doc 1036 (ZAOville Media & Livestream Plan — adapting doc 1030 for DCoop's house)
- Doc 1030 (ZAOstock Live Media Production: Field Broadcast Plan)
- Doc 1032 (ZAOstock Day-of Operations Plan — template for this runbook)
- ZAOville confirmed details (flyer, lineup page, Zaal confirmations Jul 11-12)
