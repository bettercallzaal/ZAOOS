---
topic: events/zaostock
type: STRATEGY
status: PLAN — finalize after permit (Jul 20) + lineup lock (Aug 1)
created: 2026-07-17
related-docs: 1228, 1329, 1336, 1337
owner: Zaal + Iman
---

# 1346 — ZAOstock Livestream + Virtual Attendance Strategy (Jul 2026)

> **Why this matters:** ZAOstock targets 200-300 in-person attendees in Ellsworth ME (population ~7,500). A good livestream multiplies reach by 5-10x, creates the permanent archive that press/grants/Wikipedia need, and gives WaveWarZ community members worldwide a way to experience the event.
>
> **Infrastructure:** ATEM Mini (video switching) + Restream (multi-platform distribution) already used for ZAOville broadcasts (doc 1228). ZAOstock is the same setup at a larger scale.

---

## Part 1: The Case for Livestreaming

### Audience math without livestream
- In-person: 200-300 (Ellsworth local + ZAO community who travel)
- X @wavewarz posts: ~400 follower reach
- Newsletter: ~500 subscribers
- Farcaster /zao: ~93 followers
- **Total event reach without livestream: ~1,000-1,200 touchpoints**

### Audience math with livestream
- In-person: 200-300
- YouTube Live concurrent viewers: 100-300 (estimate, early ZAO events)
- X Space simulcast: 200-500 listeners
- Farcaster cast engagement: 200-500 (cast per set)
- Post-event VOD views (30 days): 1,000-2,000
- **Total event reach with livestream: 2,000-3,500+ touchpoints**

### Grant and press value
- Press can cite "200 in-person + 500 virtual viewers" — stronger narrative
- The VOD becomes the Wikipedia-eligible video source (media coverage of a live event)
- Grant applications: "reached 2,000+ people across 15 states/countries" = compelling
- Arweave archive: permanent record of ZAOstock for history

---

## Part 2: Technical Setup

### Equipment Needed (from ZAOville doc 1228 precedent)

| Item | Status | Notes |
|------|--------|-------|
| ATEM Mini (or ATEM Mini Pro) | Own | Used for ZAOville |
| Laptop (Restream control) | Own | Zaal's laptop |
| HDMI capture card | Confirm | For stage camera feed |
| Stage camera (1-2) | Need to arrange | Wide shot + close-up |
| Audio feed from soundboard | Need to arrange | XLR → laptop |
| Restream account | Own | Multi-platform push |
| Stable internet at venue | CHECK FIRST | Key unknown |

### Internet at Venue (Key Blocker)

Ellsworth venue internet is the biggest unknown. Options:
1. **Venue WiFi** — if venue has fast enough uplink (need 5+ Mbps upstream for 720p stream)
2. **Mobile hotspot** — Verizon/AT&T hotspot as primary or backup
3. **Starlink portable** — best option for rural outdoor venue (rentable ~$50/day)

**Action:** When calling Suzanne McLean (Jul 20) about the permit, ask: "Does the venue have internet access we can use for livestreaming?"

### Streaming Platforms

| Platform | Why | Priority |
|----------|-----|----------|
| YouTube Live | Largest discovery, VOD stays permanently, press-friendly URL | Primary |
| X (Twitter) Live | Native to @wavewarz audience, Spaces-adjacent | Secondary |
| Farcaster | Native to ZAO community, /zao channel | Tertiary |

**Restream handles all three simultaneously from one ATEM output.**

### Stream Quality Targets

| Quality | Bitrate needed | Looks like |
|---------|---------------|-----------|
| 720p 30fps | 3-5 Mbps upstream | Professional, shareable |
| 1080p 30fps | 6-8 Mbps upstream | High quality (ideal) |
| 480p fallback | 1-2 Mbps upstream | Watchable if internet weak |

---

## Part 3: Production Plan

### Pre-event (Aug 1 – Sep 30)
```
□ Confirm internet solution (venue WiFi / hotspot / Starlink)
□ Recruit livestream operator (1 person dedicated to the stream)
□ Test full setup at least once before Oct 3 — use a ZAO Fractal session or MAIN event as test run
□ Build stream overlay in OBS/ATEM: ZAOstock logo, artist name lower-thirds, sponsor logos
□ Set up YouTube channel "ZAOstock" or use @wavewarz YouTube
□ Write stream schedule (8 sets × approx 30-45 min each with breaks)
```

### Day-of (Oct 3, from doc 1336)

**Stream operator checklist (before gates open 2pm):**
```
□ ATEM connected to stage camera(s) + soundboard audio feed
□ Restream active and multi-platform connected (YouTube/X/Farcaster)
□ Test stream running for 10 minutes — confirm no audio/video drift
□ Lower-thirds: confirm all 8 artist names spelled correctly
□ Internet speed test: confirm upstream > 5 Mbps
□ Spare hotspot device ready as backup
```

**During each set:**
```
□ Fade in artist lower-third when set starts
□ ZOE: post Farcaster cast "🔴 LIVE: [Artist] performing at ZAOstock — link in bio"
□ ZOE: post X thread update "[Artist] just started set #N at ZAOstock"
□ Operator: switch cameras between wide (crowd) and close-up (artist) on chorus
□ Fade out lower-third 2 min before set ends
```

**Between sets:**
```
□ Switch to holding screen: ZAOstock logo + "Next up: [Artist]" + ticket/charity QR codes
□ ZOE: Farcaster cast with charity donation reminder
□ Operator: check bitrate / buffer status
```

### Post-event (Oct 4+)

```
□ YouTube VOD published (stays permanently — do NOT delete)
□ Restream downloads available for each set (split by artist for individual sharing)
□ Artists receive their individual set clip — they can share on their social
□ Add YouTube VOD link to: doc 1337 (post-event report), doc 1330 (Wikipedia citation), doc 1340 (press map)
□ ZOE: newsletter #5 includes embedded YouTube link
□ Announce: "ZAOstock is fully archived — watch on YouTube"
```

---

## Part 4: Virtual Audience Engagement

### During the stream

**Pre-show (2-3pm):** ZOE posts to X and Farcaster: "🔴 ZAOstock is LIVE — join us virtually: [YouTube link]. 200 people at the venue in Ellsworth ME, thousands of you watching online."

**Per-set:**
- X post with live YouTube link + artist name
- Farcaster cast in /zao with "now playing" tag
- Donation CTA: "Enjoying the show? Donate to [charity] — QR in stream overlay"

**Chat moderation:**
- YouTube Live chat — Zaal or ZOE monitors and responds to key comments
- Farcaster recasts from viewers → community amplification

**Battle integration:**
- If a WaveWarZ MAIN event can be run during the festival break (between sets 4 and 5) → stream the battle live → "ZAOstock isn't just a festival, it's a battle"

### Virtual-only extras

For virtual attendees who can't be in Ellsworth:
1. **Virtual tipping:** QR code in stream overlay → charity donation or artist tipping
2. **WaveWarZ battle:** Run a community battle during intermission that virtual viewers can bet on (wavewarz.info accessible during stream)
3. **Farcaster live reaction thread:** Virtual audience posts reactions with #ZAOstock tag
4. **Virtual ticket:** Option to "buy a virtual ticket" for $5 → proceeds to charity → ticketholders get early access to the post-event VOD download

---

## Part 5: Arweave Permanent Archive

ZAOville episodes are archived on Arweave (doc 1228). ZAOstock should follow the same protocol:

1. After Oct 3: download the full stream recording from Restream/YouTube
2. Upload to Arweave using the same wallet/method as ZAOville
3. ZAOstock Arweave link = permanent, uncensorable archive
4. Add link to doc 1337 (post-event report) and doc 1345 (annual report)

**Why Arweave matters:** When citing ZAOstock in grant applications, press kit (doc 1296), or Wikipedia (doc 1330), an Arweave link = the source will never disappear. This is what makes "ZAOstock was a real, documented event" provable in perpetuity.

---

## Part 6: Estimated Virtual Attendance Targets

| Phase | Virtual viewers | Milestone |
|-------|----------------|-----------|
| Pre-event promotion (Sep 12–Oct 2) | 200 YouTube subscribers | "ZAOstock on YouTube" |
| Live on Oct 3 | 100-500 concurrent | Depends on promotion |
| VOD views (first 30 days) | 1,000-3,000 | Share per-artist clips |
| VOD views (3 months) | 3,000-10,000 | If artists share |

**Key driver:** Each of the 8 ZAOstock artists shares their clip to their audience. Even if each artist has 500 followers and 10% watch = 400 views × 8 artists = 3,200 views from artist channels alone.

---

## Part 7: ZOE Automation for Livestream Day

**TMP-LS01: Stream announcement**
```
🔴 ZAOstock is LIVE.

Watch the full event from anywhere in the world:
→ [YouTube link]

{N} people at the venue in Ellsworth ME.
You're next.

#ZAOstock #WaveWarZ
```

**TMP-LS02: Per-set live update**
```
🎵 Set {N}/8 — {artist_name} is ON.

Watch: [YouTube link]
Charity: [QR URL or link]

#ZAOstock
```

**TMP-LS03: Post-event VOD announcement**
```
ZAOstock is over. The archive isn't.

Watch all 8 sets on YouTube:
→ [YouTube link]

Arweave permanent archive: → [arweave URL]

8 artists. 1 day. Onchain forever.
```

---

## Part 8: Decisions Needed

1. **Internet solution:** Venue WiFi / hotspot / Starlink? Ask Suzanne McLean Jul 20.
2. **Livestream operator:** Who runs the stream? (Separate from Iman ops, Zaal MC) — budget for 1 dedicated tech volunteer or hire.
3. **YouTube channel:** Use existing @wavewarz YouTube or create @zaostockofficial?
4. **Virtual ticket:** Yes/No on the $5 virtual ticket for charity?
5. **WaveWarZ battle integration:** Run a community battle during intermission break on stream?

---

*Created: 2026-07-17 | Finalize after permit (Jul 20) + lineup lock (Aug 1) | Related: 1228 (ZAOville ATEM setup), 1329 (ZAOstock marketing), 1336 (day-of runbook), 1337 (post-event report template)*
