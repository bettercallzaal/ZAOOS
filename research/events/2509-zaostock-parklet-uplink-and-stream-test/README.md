---
topic: events
type: guide
status: research-complete
last-validated: 2026-09-19
superseded-by:
related-docs: "1030, 1036, 1040, events/1073-zaostock-oct3-readiness, 986, 2108"
original-query: "Keep working on open things that need research (Zaal, 2026-09-19) - scoped to the ZAOstock parklet uplink and the stream test Zaal ruled for 19-21 September, since the ZAOstock repo shows link 5 (uplink) 'untested by anyone' and nothing confirms the test has run"
tier: STANDARD
---

# 2509 - ZAOstock parklet uplink and stream test

> **Goal:** ZAOstock livestreams Saturday 3 October 2026, noon-6pm, from the Franklin Street Parklet in downtown Ellsworth, Maine - a City-owned outdoor space with no venue network. The ZAOstock repo's own chain doc marks the uplink (link 5) "No. Untested by anyone" and the ingest key (link 6) still owed by Aziz since 22 August. Zaal ruled a stream test for this weekend, 19-21 September; nothing on disk confirms it ran. This doc gives the uplink options, the headroom math, a one-hour test checklist one person can run at the parklet, day-of rules, and this week's asks - grounded in the encoder setting already proven (OBS, h264_nvenc, CBR 6000 kbps, 1080p30, AAC 160 kbps, ~6.3 Mbps total).

## Key Decisions

| Recommendation | Why |
|---|---|
| **Test wired-from-Black-Moon first, cellular second, and treat Starlink Mini as the $199 armed backup, not the primary** | A short wired run from the adjacent building avoids the carrier-upload uncertainty entirely (Section 1a). If Black Moon's line is unusable or unavailable, cellular is free to test (owned phones) but current crowdsourced medians for Ellsworth put AT&T, Verizon and T-Mobile's upload at 3.3-5.9 Mbps - at or below the 6.3 Mbps encode bitrate, before headroom (Section 1b). Starlink Mini is $199, ships fast, and real-world upload (8-16 Mbps typical) clears the bar with room, but its 30-day return doesn't get money back before Oct 3, so budget it as a keep, not a rental (Section 1d). |
| **A coverage map is not a measurement, and this doc caught two of them disagreeing with each other** | The same class of source (crowdsourced carrier-coverage aggregator) gave upload numbers in July 2026 (T-Mobile 14.32 Mbps, AT&T 16.15 Mbps, Verizon 7.40 Mbps - doc 1030) and September 2026 (T-Mobile 3.9, AT&T 5.9, Verizon 3.3 - this doc, Section 1b) that differ by 2-4x on the same three carriers in the same town, two months apart. Neither number is wrong for what it is - a rolling median of other people's phones - but neither is a stream provisioning number. Only an on-site test this weekend answers the real question. |
| **Run the sustained test for at least 15 minutes, not a 10-second speed test** | RTMP rides on TCP: packet loss doesn't corrupt the picture, it forces retransmission, and OBS reports the backup as "dropped frames (network)" only once the send buffer can't drain fast enough (OBS forum, Section 3). A quick speed test measures peak throughput; a 15-minute push measures whether that throughput survives real jitter and a Saturday midday cell-tower load. The two answers are often different numbers. |
| **Build the fallback ladder into OBS now, as saved profiles, not as a decision to make live on Oct 3** | 1080p30 at 6000 kbps needs roughly 8.5-9 Mbps sustained to clear a 1.4x headroom floor; 720p30 at 3500-4000 needs roughly 5-5.5 Mbps; 720p30 at 2500 needs roughly 3.5-4 Mbps (Section 2). Three pre-built OBS profiles mean the day-of call is "switch profile," not "guess at settings while the stream is already degrading." |
| **The test needs Aziz's ingest URL and key for topology A (OBS -> Cloudflare -> Restream), but does not need it for topology B (OBS -> Restream direct) or for the uplink test itself** | The uplink and headroom questions this doc answers are upstream of both topologies - they are about the pipe out of the parklet, not about which platform receives it. A private YouTube or Twitch test stream, or a bare `ffmpeg`-to-`iperf3` push, proves the uplink with zero dependency on Aziz's still-owed key (Section 3). |

## Findings

### 1. Uplink options, ranked for this event

**(a) Borrow wired or Wi-Fi internet from the adjacent business or the City**

Black Moon Public House sits directly next to the Parklet (between Elizabeth's Fine Goods and Black Moon, per ZAO OS research doc 986) and already hosts the after-party from 6pm - it is the closest possible source of a wired line, likely under 100 feet from the stage position. The City runs the Parklet itself through Parks, Recreation & Facilities (Director Roddy Ehrlenbach, per doc 986) - the City relationship is about power and any municipal network, not a business connection.

- **What to ask for**: not "can we use your Wi-Fi" but "can we run a cable from your router, and what's your upload speed." A restaurant's guest Wi-Fi and its wired router uplink are the same internet connection; asking for the cable skips Wi-Fi entirely.
- **A long ethernet run vs. a point-to-point bridge**: standard Ethernet (Cat5e/Cat6) is only rated to 100 meters (328 ft) before signal degrades; if Black Moon's router is within that distance of the stage position, a single cable run - taped down, covered with a cable ramp across any walkway, done with the City's and Black Moon's sign-off since it's a public space - is simpler, cheaper (a $20-40 cable, maybe a $30-60 outdoor-rated cable protector) and has fewer failure modes than a wireless bridge. A point-to-point bridge (e.g., a pair of Ubiquiti airMax or similar units, roughly $150-300 for a pair) needs a clear line of sight and a mounting point on both buildings, more setup time, and its own RF variables outdoors - only worth it if the cable-run distance or a walkway obstruction rules out a physical cable.
- **Why guest Wi-Fi is risky**: a restaurant's guest network is typically consumer-grade, asymmetric (upload is usually a fraction of download on residential/small-business cable or DSL plans), shared with every patron's phone on a Saturday - the highest-load day of the week for a bar/restaurant - and often behind a captive portal that can silently re-prompt and drop the stream's connection mid-show. A wired hop into the same router's LAN side skips the captive portal and the Wi-Fi contention entirely, even if the upstream internet plan itself is still the limiting factor - which is why Black Moon's actual plan speed still has to be asked for and, ideally, tested.
- **Cost / setup time / failure modes / in-hand by Oct 1**: cost is near zero (a cable and possibly a bridge kit); setup is an afternoon once permission is granted; failure modes are "Black Moon's own plan is too slow" (ask their upload speed first) and "the physical run isn't safe or isn't allowed across the space" (needs City sign-off, since the Parklet is public right-of-way during the seasonal closure). Realistically in hand for the test this weekend if Black Moon says yes this week.

**(b) Cellular**

Coverage maps are a starting point, not an answer, and this doc found two of them disagreeing with each other by a wide margin - see the boxed warning in Key Decisions. Fetched 2026-09-19 from **coveragemap.com** (`https://coveragemap.com/coverage/us/maine/hancock/ellsworth`), which reports median values from crowdsourced speed tests for the Ellsworth area:

| Carrier | Download (median) | Upload (median) | Reliability | Coverage area (FCC-based) | Sample size |
|---|---|---|---|---|---|
| AT&T | 36.2 Mbps | **5.9 Mbps** | 5.3/10 | 74.8% | 500+ tests |
| T-Mobile | 79.2 Mbps | **3.9 Mbps** | 5.6/10 | 65.2% | 100+ tests |
| Verizon | 27.2 Mbps | **3.3 Mbps** | 6.1/10 | 93.2% | 100+ tests |

Every one of those upload medians is at or below the 6.3 Mbps the encoder already needs, before any headroom. This is a genuinely different picture from the same class of source two months earlier: ZAO OS research doc 1030 (2026-07-11, via bestneighborhood.org / coveragemap.com at the time) reported T-Mobile 14.32 Mbps up, AT&T 16.15 Mbps up, Verizon 7.40 Mbps up - 2 to 4x higher, and with a different carrier in the lead. Both figures are honestly reported crowdsourced medians; neither is a measurement of the parklet on a Saturday. **State plainly: a coverage map is a map. It is not a substitute for the test in Section 3.**

The **FCC National Broadband Map** (`broadbandmap.fcc.gov`) is a separate, address-level lookup of what each carrier *claims* to cover, drawn from provider-submitted data - useful only to confirm which carriers say they serve the Parklet's address at all, never as a speed number (this doc's direct fetch of the FCC map was blocked by the site's own edge protection, HTTP 403, 2026-09-19 - it is an interactive tool a person has to open, not a page that can be quoted; not escalated further since no number was going to come from it regardless).

- **Phone hotspot vs. a dedicated 5G/LTE router with an external antenna**: a phone hotspot is free (already owned), works in minutes, but has a small internal antenna, competes for the phone's radio with its own calls/notifications, and many plans throttle hotspot data after a cap. A dedicated router (a basic MiFi/Nighthawk-class hotspot at $100-200, or a Peplink-class 5G router at $400-700+ hardware, per Section 1c) paired with an external MIMO or panel antenna mounted up on a pole or the stage canopy can meaningfully improve a marginal signal and sustains 6+ hours of continuous duty better than a phone's battery and thermal envelope.
- **Data needed for six hours at 6.3 Mbps, as arithmetic**: 6.3 Mbps = 6,300 kbps = 787.5 KB/s = 0.7875 MB/s. Over 6 hours (21,600 seconds): 0.7875 x 21,600 = 17,010 MB, about **16.6 GB** for the encode stream alone. Real TCP/RTMP overhead and retransmits typically add another 10-20%, so budget roughly **20 GB** for a single 6-hour run on one uplink, and more if two uplinks are running simultaneously as primary + armed backup, or if the test itself (this weekend) runs multiple candidate uplinks back to back. A 100GB data plan or Starlink Roam tier covers this with margin; a capped 15-25GB phone plan does not.
- **Cost / setup / failure modes / in-hand by Oct 1**: free-to-minutes for a phone hotspot (already owned); a dedicated router with antenna is a same-week Amazon-class purchase, in hand well before Oct 1. Failure mode for both: crowd density at a public event measurably degrades a shared cell tower's per-user throughput - the coverage-map numbers above are not measured under a Saturday festival load, which is a second reason the on-site test (Section 3) must be run at a realistic time of day.

**(c) Bonding several links**

| Option | What it does | Price, as of 2026-09-19 | Setup time | Realistic by Oct 1 |
|---|---|---|---|---|
| **Speedify** | Software VPN-style bonding on the streaming laptop itself - combines Wi-Fi + a tethered phone + a USB dongle into one logical connection, no extra hardware | $14.99/mo single device (monthly), $89.99/yr ($7.49/mo), $179.99 for 3 years ($4.99/mo) - fetched directly from speedify.com/pricing/ | App install + account, roughly 15-30 minutes | Yes - it is software; sign up and test this weekend on the cheapest monthly plan |
| **Peplink / similar bonding router** | Hardware router that bonds 1-2 SIMs plus Wi-Fi/Ethernet WAN via SpeedFusion; protects every device on site, not just one laptop | No public day-rate found. eTechRentals (`etechrentals.com/event-wifi/5g-wifi-rentals/pepwave-max-5g-router/`, fetched 2026-09-19) advertises "Daily/Weekly/Monthly" rental cadence for a Pepwave MAX 5G router but the price is quote-only ("GET A QUOTE IN MINUTES"). Buying outright runs into the hundreds to low thousands per 5gstore.com's own 2026-04-27 price-increase notice (found via search, not independently fetched) - no confirmed current retail number | SIM provisioning + antenna mounting, more than a phone or Speedify | Rental: only if a quote comes back fast and ships in days - not confirmed possible this week. Buying: overkill for a one-day test |
| **LiveU Solo** | Purpose-built bonding encoder (LiveU Reliable Transport), the professional-broadcast answer to the same problem | Doc 1030 (2026-07-11) cited $795-1,995. Re-checked 2026-09-19: the product line has moved upmarket - LiveU's own site (`liveu.tv/products/create/liveu-solo`, fetched FULL) now centers a cloud-bonding subscription at $450/yr or $45/mo on top of hardware; B&H Photo's current listing shows the hardware itself now sold as "Solo Pro" at **$2,595-$3,045** (found via WebSearch against bhphotovideo.com; the B&H page itself returned HTTP 403 to two different fetch attempts, so this price is **[PARTIAL]** - re-verify by opening the page directly before buying) | Device setup + SIM provisioning, similar to Peplink | No - $2,595+ and a still-unconfirmed exact SKU is not a one-day-test purchase |

**Given the cost and lead-time spread, Speedify is the only bonding option realistically in hand and testable this weekend; Peplink and LiveU Solo are both real categories (doc 2108 already reached the same "cheaper-first" conclusion for ZAO's broader livestream-every-festival goal) but neither clears a same-week timeline for Oct 3 at their current prices.**

**(d) Starlink Mini or Roam**

Fetched 2026-09-19 from satelliteinternet.com (`starlink-mini-review/` and `starlink-trial-refund-policy/`, both FULL) and trioflatmount.com (`understanding-starlink-pricing-and-plans`, FULL, dated "Updated September 2026"):

- **Price**: Starlink Mini hardware is **$199** outright (down from a $599 launch price), or $16/mo for 12 months at 0% financing, when bought with a Roam plan. Roam service: **100GB $55/mo, 300GB $80/mo, Unlimited $175/mo** - the 100GB and 300GB tiers became domestic-only after a July 2026 policy change, which doesn't matter for a Maine event.
- **Portability**: Roam plans have no fixed-address requirement and are designed to travel; the Mini is small, lightweight, and self-powered from a standard outlet or a power bank/battery.
- **Real-world upload speeds**: this doc's direct fetches did not carry a specific upload number (the satelliteinternet.com review page discusses download and latency in detail but not upload figures). A WebSearch pass surfaced several independent 2026 reviews (Broadband Now, Speedcast, HighSpeedInternet.com, Digital Nomad Lifestyle) converging on roughly **8-16 Mbps typical upload** - this figure is **[PARTIAL]**, assembled from WebSearch result summaries rather than a full fetch of any one review, and should be treated as a rough expectation, not a number to plan the show around, until it is tested on-site.
- **Obstruction needs**: Starlink needs a genuinely clear view of the sky; trees and buildings block or badly degrade the signal, and Starlink's own app has a built-in obstruction map that should be checked at the actual mounting spot before relying on it. Downtown Ellsworth's Franklin Street Parklet sits between buildings on a city street - obstruction risk is real and specific to wherever the dish is actually placed, not a given.
- **Buying and returning, or renting, inside 14 days**: Starlink's own 30-day return policy (fetched FULL) lets a kit ordered directly from Starlink be returned within 30 days of *delivery* for a full refund "for any reason, including inability to receive Services due to field-of-view issues" - but the refund itself takes **10-15 business days to process** after the return ships. Ordering now (2026-09-19) and testing this weekend is realistic if shipping is prompt; getting the **money** back before Oct 3 is not realistic on that timeline. No Starlink-specific one-day rental price was found in this pass (not fetched - a real gap, not a finding). **Practical read: budget the $199 as a small, permanent purchase that becomes ZAO's armed backup uplink for this and future outdoor festivals (doc 2108 already frames "livestream every festival" as a standing goal), not as a return-before-the-event line item.**

### 2. How much upload is enough

Two sourced rules of thumb, both fetched FULL 2026-09-19, point the same direction:

- **Restream's own OBS guide** (`restream.io/learn/obs-studio/the-best-obs-settings-for-streaming/`): "the general recommendation for the upload speed is around 5 Mbps" against their own suggested 4000 kbps 1080p30 baseline - roughly **1.25x** headroom as Restream's stated floor.
- **The OBS project's own forum** (`obsproject.com/forum/threads/what-does-exact-meaning-of-dropped-frames-and-how-it-is-calculated.184013/`): the community-standard fix cited there is to keep the stream bitrate "below 75% of your upload speed" - i.e., the pipe should be at least **1.33x** the encode bitrate as a floor.

For ZAOstock's proven **6.3 Mbps** (6000 kbps video + 160 kbps audio + protocol overhead) on an outdoor, likely-cellular link with real variance - not a wired office connection - this doc recommends a **minimum sustained uplink of 8.5-9 Mbps** (roughly 1.4x) and a comfortable target of **10+ Mbps**.

**What packet loss and jitter actually do to RTMP(S)**: RTMP rides on TCP, so lost packets don't corrupt the picture the way they would over raw UDP - TCP retransmits them. The cost shows up as buffering: if the encoder's send buffer fills faster than the network can drain it, OBS has to discard frames rather than let the buffer grow without bound, and that shows up as "dropped frames (network)" in OBS's own Stats window. High jitter (variable latency) produces the same effect even at a nominal 0% packet-loss reading, because TCP's congestion control backs off when round-trip time varies - which is exactly why a 10-second speed test and a 15-minute sustained push can report two different numbers for the same link (Section 3).

**Bitrate fallback ladder**, with the OBS settings for each:

| Tier | Video bitrate | Resolution/fps | Audio | Total | Needed sustained uplink | OBS settings |
|---|---|---|---|---|---|---|
| **Primary (proven)** | 6000 kbps | 1080p30 | AAC 160 kbps | ~6.3 Mbps | ~8.5-9 Mbps | Output > Advanced > Encoder h264_nvenc, Rate Control CBR, Bitrate 6000 Kbps, Keyframe Interval 2s; Video > Output (Scaled) Resolution 1920x1080, Common FPS 30 |
| **First fallback** | 3500-4000 kbps | 720p30 | AAC 160 kbps | ~3.7-4.2 Mbps | ~5-5.5 Mbps | Same encoder/CBR/keyframe settings; Bitrate 3500-4000 Kbps; Output Resolution 1280x720 (Downscale filter: Lanczos); FPS unchanged at 30 |
| **Second fallback / emergency** | 2500 kbps | 720p30 | AAC 128 kbps | ~2.6 Mbps | ~3.5-4 Mbps | Same as above; Bitrate 2500 Kbps; Audio Bitrate dropped to 128 Kbps |

**Which platforms via Restream care**: per the same Restream OBS guide, Twitch's own guideline is 6000 Kbps for 1080p60 and roughly 4500 Kbps for lower resolutions/frame rates - ZAOstock's proven 1080p30/6000 kbps setting sits inside Twitch's ceiling (and the 20 August test already pushed it successfully) but leaves no room to go up, only down. Restream itself transcodes for its multi-platform fan-out, so OBS's contribution bitrate sets the ceiling every destination can receive from - the fallback ladder above is what actually protects Twitch, X and the other Restream destinations when the parklet's uplink can't hold the primary tier, not a per-platform OBS setting.

### 3. The test procedure

**Run this at the Franklin Street Parklet, Saturday 19, Sunday 20, or Monday 21 September, at a Saturday-midday-equivalent load if at all possible** - specifically midday-to-early-afternoon, when downtown Ellsworth's shops, Black Moon, and surrounding cell towers are under their heaviest realistic weekend load, not a quiet weekday evening. The 20 August encoder test already proved the encode itself works; this test is entirely about what happens between the laptop and the internet.

**What you need**: a laptop with OBS installed (per the ZAOstock repo's proven config), a phone per carrier being tested, and this checklist.

**Step 1 - Two independent speed tests, three runs each (about 10 minutes)**

Run each of two independent services three times, a few minutes apart, on each uplink candidate you're testing (Black Moon's cable, each cellular carrier's hotspot, Starlink if in hand). Use Ookla's Speedtest (speedtest.net or its CLI) and a second, independent service such as Cloudflare's speed test (speed.cloudflare.com) - two different services matter because a single test only tells you about that service's own nearby server, not the general path out. Record for each run: **download, upload, latency (ms), jitter (ms), packet loss (%)**.

**Step 2 - A sustained upload test, at least 15 minutes, two methods**

*Method A - iperf3 against a public server (no ingest key needed, tests raw upload capacity):*

```
iperf3 -4 -c speedtest.us.novoserve.com -p 5201 -t 900 -i 60
```

This is a confirmed live public iperf3 server on the US East Coast (NovoServe, New Jersey, `speedtest.us.novoserve.com`, fetched FULL 2026-09-19 from `novoserve.com/speedtest-us`, ports 5201-5206). Client-to-server mode (no `-R` flag) measures upload from the parklet; `-t 900` runs 15 minutes; `-i 60` reports every 60 seconds so you can see whether throughput holds steady or degrades over time. iperf.fr's public server list (fetched FULL, `iperf.fr/iperf-servers.php`) is almost entirely European and had no confirmed US entry in this pass - NovoServe is the one used here for a Maine-appropriate round-trip.

*Method B - ffmpeg pushing a test pattern at the production bitrate, real RTMP behavior:*

```
ffmpeg -re -f lavfi -i testsrc=size=1920x1080:rate=30 \
  -f lavfi -i sine=frequency=1000:sample_rate=48000 \
  -c:v libx264 -preset veryfast -b:v 6000k -maxrate 6000k -bufsize 12000k \
  -pix_fmt yuv420p -g 60 -keyint_min 60 \
  -c:a aac -b:a 160k -ar 48000 \
  -t 900 -f flv "<RTMP(S) ingest URL and key - never paste this into a doc or chat>"
```

This needs a destination. **Since Aziz's Cloudflare ingest URL and key are still owed, do not wait on them for this test.** Instead, create a *private or unlisted* test stream on a platform you already control - a YouTube "unlisted" live stream, or a Twitch account's own stream - copy that platform's own server URL and stream key from its own dashboard (never shared, never pasted into this doc, chat, or anywhere outside OBS/ffmpeg's local settings), and push there for the 15-minute run instead. This proves the exact same uplink and RTMP behavior the real event will use, without depending on a key that hasn't arrived.

**Step 3 - Read OBS's own indicators**

With OBS actually streaming (to the same private test destination), open **View > Stats**. Per the OBS project's own forum explanation (fetched FULL, Section 2), there are three separate frame-loss counters, and they mean different things:

- **Frames missed due to rendering lag** - a local GPU/CPU problem, not a network problem.
- **Skipped frames due to encoding lag** - also local (CPU overload on software encoding, GPU overload on hardware encoding like `h264_nvenc`).
- **Dropped frames (network)** - the one that matters for this test. This climbs when the network can't drain OBS's send buffer fast enough; it is the real-time equivalent of the packet-loss/jitter effects described in Section 2.

Also check **Settings > Advanced > Network > "Dynamically change bitrate to manage congestion"** - enabling this lets OBS quietly lower bitrate under congestion instead of dropping frames outright, which is useful for the live show but should be **disabled during this test** so the dropped-frames counter reflects the raw uplink, not OBS already compensating for it.

**Step 4 - Test each candidate separately, then test failover**

Run Steps 1-3 on each candidate uplink alone (Black Moon's cable, each cellular carrier, Starlink if available) before testing any combination. Then, with two candidates both live (for example Black Moon's cable as primary and a cellular hotspot as the armed backup), manually pull the primary mid-stream and time how long it takes to reconnect on the backup - this is the same failover the day-of rules in Section 4 depend on, and it should be timed and written down, not assumed.

**Step 5 - Walk the site for cellular signal**

Before settling on a cellular candidate's fixed test spot, walk the Parklet's footprint with a phone's signal-strength indicator (or a network-monitor app) and note where each carrier is strongest - next to a building, out in the open, near either end of the block. The stage position is fixed by the run-of-show, but if a cellular link is the backup, knowing the single best spot for an external antenna is worth five minutes now.

**PASS / MARGINAL / FAIL**, built from the headroom rule in Section 2:

| | Sustained upload (15-min average) | Packet loss | Jitter | OBS dropped frames (network) | Action |
|---|---|---|---|---|---|
| **PASS** | >= 9 Mbps, no dip below 7 Mbps | < 1% | < 30 ms | Near zero over the 15-minute run | Use as Primary tier (1080p30/6000 kbps) |
| **MARGINAL** | 5-9 Mbps average | 1-3% | 30-60 ms | Occasional, recovers on its own | Drop to First Fallback (720p30/3500-4000 kbps) and re-test at that bitrate against the same bar |
| **FAIL** | < 5 Mbps average | > 3% | > 60 ms | Frequent / stream stalls | Try Second Fallback (720p30/2500 kbps) and re-test; if it still fails, this uplink is not usable as a live source on Oct 3 |

**One-page results table - print and fill by hand:**

| Uplink candidate | Test date/time | Speed test 1 (down/up/lat/jitter/loss) | Speed test 2 (down/up/lat/jitter/loss) | Speed test 3 (down/up/lat/jitter/loss) | iperf3 15-min avg up | ffmpeg 15-min OBS dropped frames (network) | Verdict (PASS/MARGINAL/FAIL) | Best physical spot on site |
|---|---|---|---|---|---|---|---|---|
| Black Moon wired | | | | | | | | |
| AT&T hotspot | | | | | | | | |
| Verizon hotspot | | | | | | | | |
| T-Mobile hotspot | | | | | | | | |
| Starlink Mini (if in hand) | | | | | | | | |
| Primary + backup failover time | | n/a | n/a | n/a | n/a | n/a | | |

### 4. Day-of rules

- **Local recording is always on.** OBS's local record starts alongside the stream (the ZAOstock run sheet already schedules this at 11:55, ten minutes after going live) and stays running through every uplink problem below - a dropped stream never means a lost set, only a lost broadcast.
- **A second uplink is armed, not improvised.** Whichever candidate passes as Primary in Section 3's test, a second candidate that also passed (at least MARGINAL) is physically connected and powered at the stage position for the whole show, with its own OBS profile pre-built - the switch on the day is "select the other profile," not "find a cable."
- **One named person watches stream health continuously**, eyes on OBS's Stats window (View > Stats, Section 3) for the whole show - the run sheet's current "rig lead" role, whoever Zaal has on that job on the day, since the 15 September call moved that ownership to Zaal-with-the-venue-AV-team rather than a single named individual.
- **What to cut first when the link degrades**: bitrate before audio, video before switching uplinks, uplink switch before going to a card. Concretely: (1) switch to the First Fallback OBS profile (720p30, 3500-4000 kbps) - audio stays at 160 kbps because it costs little bandwidth and matters most to the online audience; (2) if still degrading, drop to the Second Fallback/emergency profile (720p30, 2500 kbps); (3) if still failing, switch to the armed backup uplink; (4) only after all three fail, follow the ZAOstock run sheet's existing procedure - cut to the BRB card, post one line to the Telegram chat, keep local recording rolling, cut back to STAGE WIDE on the next downbeat once restored. **This doc adds the bitrate-ladder step before BRB; the run sheet as it stands today jumps straight to BRB with no ladder in between.**
- **The point at which you stop streaming and just record**: when the Second Fallback/emergency tier (720p30/2500 kbps, needing only ~3.5-4 Mbps) fails the same PASS bar from Section 3's test, or when both the primary and armed-backup uplinks are simultaneously in FAIL state. At that point, stop attempting to push out - local recording needs no network and keeps running regardless - and rely on the run sheet's existing Telegram notice so remote viewers aren't left staring at a frozen or repeatedly failing picture.

### 5. What to ask other people this week - scripts, not sent

None of these have been sent; do not contact anyone from this doc. They are ready for Zaal to use himself.

**Black Moon Public House** (booking/ownership contact, via doc 986's finding that Black Moon curates the adjacent concert series and sits directly on the Parklet):
> "Hi [name] - we're livestreaming ZAOstock from the Parklet on Oct 3, and running internet tests this weekend (Sept 19-21). Would it be possible to run an ethernet cable from your router for about six hours during the test, and again on the day? And do you happen to know roughly what upload speed your internet plan is rated for? We'd tape the cable down safely and stay out of your way."

**The City contact for the Parklet** (Roddy Ehrlenbach, Director, Parks, Recreation & Facilities, per doc 986):
> "Hi Roddy - as we finalize the livestream setup at the Parklet for Oct 3, two quick questions: is there power we can plug into at the Parklet itself, and is there any City Wi-Fi or network there, or is it purely an outdoor space with no network at all? Want to plan around what's actually there rather than assume."

**Aziz** (owed the rtmps ingest URL and stream key since 22 August, per the ZAOstock repo's own chain doc):
> "Hey Aziz - we're running the parklet uplink/stream test this weekend (Sept 19-21) ahead of Oct 3. Could you send the rtmps ingest URL and stream key for the Cloudflare Live Input this week? And is there a window you're free if we need you live to test the Cloudflare hop specifically (topology A)?"

**Steve Peer** (bringing the PA, desk model currently UNSET):
> "Hey Steve - for the livestream audio, which mixer/PA desk are you bringing to the Parklet on Oct 3? Want to pick the right audio interface ahead of time (what connects your desk's output to our streaming laptop) instead of guessing at the connector."

## Also See

- [Doc 1030 - ZAOstock Live Media Production: Field Broadcast Plan](../1030-zaostock-livestream-media-production/) - the owned-gear field-production plan this doc's uplink section directly updates; its July 2026 carrier-upload numbers are the ones this doc found disagreeing with September 2026's
- [Doc 1036 - ZAOville Media & Livestream Plan](../1036-zaoville-media-livestream-plan/) - the same gear stack tested at a private-venue dry run in July; confirms a private router is easier than this doc's outdoor case
- [Doc 1040 - ZAOstock Weather Contingency](../1040-zaostock-weather-rain-contingency/) - the adjacent go/no-go decision (rain, not uplink); this doc's day-of rules assume the show is happening
- [Doc events/1073 - ZAOstock Oct 3 Readiness: Dated Execution Plan](../1073-zaostock-oct3-readiness/) - the whole-event critical path; its Finding 5 media timeline is the one this doc's test closes out
- [Doc 986 - Ellsworth local intel for ZAOstock](../986-ellsworth-local-intel-zaostock/) - source of the Parklet address, Black Moon's adjacency, and the City Parks & Rec contact used in Section 1a and Section 5
- [Doc 2108 - TVU One IRL streaming backpack](../../business/2108-tvu-one-irl-streaming-backpack/) - the cheaper-first bonding ladder (phone+Restream -> consumer bonding -> broadcast-grade) this doc's Section 1c follows for the same reason

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Run the Section 3 test procedure at the Franklin Street Parklet during a midday load - shipped when the one-page results table has recorded numbers and a PASS/MARGINAL/FAIL verdict for at least two uplink candidates | Zaal | Test | 2026-09-21 |
| Ask Black Moon Public House for a six-hour ethernet run and their upload speed (Section 5 script) - shipped when an answer is on record | Zaal | Ask | 2026-09-22 |
| Ask Roddy Ehrlenbach (City Parks & Rec) about Parklet power and any municipal network (Section 5 script) - shipped when an answer is on record | Zaal | Ask | 2026-09-22 |
| Ask Aziz for the rtmps ingest URL/key and a joint test window (Section 5 script) - shipped when the ZAOstock repo's chain doc link 6 changes from "No, owed since 22 Aug" to a dated "Yes" | Zaal | Ask | 2026-09-22 |
| Ask Steve Peer which PA desk he's bringing (Section 5 script) - shipped when the desk model replaces "UNSET" in the ZAOstock repo's chain doc | Zaal | Ask | 2026-09-24 |
| If Section 3's test comes back MARGINAL or FAIL on every wired/cellular candidate, buy the Starlink Mini ($199) as the armed backup before the 2 October soundcheck - shipped when the device is ordered, received, and obstruction-checked on-site | Zaal | Purchase | 2026-09-26 |
| Update the ZAOstock repo's `docs/av/livestream-chain-2026-10-03.md` link 5 (uplink) with this weekend's test result - shipped when that PR merges in the ZAOstock repo (separate from this doc's own PR) | Zaal | PR | 2026-09-22 |

## Sources

- [ZAOstock repo, `docs/av/livestream-chain-2026-10-03.md`](https://github.com/ZAODEVZ/zaostock/blob/510253ca465384263455f7e10dd728f34b89bc0f/docs/av/livestream-chain-2026-10-03.md) (origin/main @ `510253c`, read via `git show`, not checked out or edited) - [FULL] - source of the proven encoder settings, the "link 5 untested" and "link 6 owed since 22 Aug" facts, and the two OBS topologies
- [ZAOstock repo, `docs/av/stream-run-sheet-2026-10-03.md`](https://github.com/ZAODEVZ/zaostock/blob/510253ca465384263455f7e10dd728f34b89bc0f/docs/av/stream-run-sheet-2026-10-03.md) (origin/main @ `510253c`, read via `git show`, not checked out or edited) - [FULL] - source of the stream-test window ("19 to 21 September, ruled 2026-09-18"), the existing "if it drops" BRB procedure, and the day-of schedule this doc's rules extend
- [coveragemap.com - Ellsworth carrier performance](https://coveragemap.com/coverage/us/maine/hancock/ellsworth) - [FULL, curl+strip, 2026-09-19] - September 2026 crowdsourced upload/download/reliability/coverage medians for AT&T, Verizon, T-Mobile
- [Speedify pricing](https://speedify.com/pricing/) - [FULL, curl+strip, 2026-09-19] - current monthly/yearly/3-year bonding-VPN pricing
- [iPerf - Public iPerf3 servers](https://iperf.fr/iperf-servers.php) - [FULL, curl+strip, 2026-09-19] - confirms the public server list is almost entirely European, with no confirmed US entry in this pass
- [NovoServe US speedtest / iperf3](https://novoserve.com/speedtest-us) - [FULL, curl+strip, 2026-09-19] - the New Jersey iperf3 server and command used in Section 3
- [Restream - The Best OBS Settings for Streaming](https://restream.io/learn/obs-studio/the-best-obs-settings-for-streaming/) - [FULL, curl+strip, 2026-09-19] - source of the 5 Mbps upload rule of thumb and the Twitch 6000/4500 Kbps guideline
- [eTechRentals - Pepwave Max 5G Router Rental](https://etechrentals.com/event-wifi/5g-wifi-rentals/pepwave-max-5g-router/) - [FULL, curl+strip, 2026-09-19] - confirms the rental exists but is quote-only, no public day rate
- [LiveU Solo product page](https://www.liveu.tv/products/create/liveu-solo) - [FULL, curl+strip, 2026-09-19] - source of the $450/yr, $45/mo LRT cloud-bonding subscription figure
- [B&H Photo - LiveU Solo pricing](https://www.bhphotovideo.com/c/buy/liveu-encoders/ci/50737) - [PARTIAL - direct fetch blocked HTTP 403 on two different user agents; $2,595/$3,045 figures are WebSearch-result-derived, not read from the raw page. Re-verify before buying.]
- [SatelliteInternet.com - Starlink Mini Review 2026](https://www.satelliteinternet.com/providers/starlink/starlink-mini-review/) - [FULL, curl+strip, 2026-09-19] - $199 hardware price, Roam plan pricing table
- [SatelliteInternet.com - How to Return Your Starlink For a Full Refund](https://www.satelliteinternet.com/resources/starlink-trial-refund-policy/) - [FULL, curl+strip, 2026-09-19] - the 30-day-from-delivery return window and the 10-15 business day refund processing time
- [Trioflatmount - Understanding Starlink Pricing and Plans (Updated September 2026)](https://www.trioflatmount.com/blogs/news/understanding-starlink-pricing-and-plans) - [FULL, curl+strip, 2026-09-19] - confirms Mini $199 / $16 mo, Roam 100GB $55, 300GB $80, Unlimited $175, domestic-only capped tiers since July 2026
- [OBS Forums - What does exact meaning of "Dropped Frames" and how it is calculated?](https://obsproject.com/forum/threads/what-does-exact-meaning-of-dropped-frames-and-how-it-is-calculated.184013/) - [FULL, curl+strip, 2026-09-19] - community source; the three-frame-loss-counter explanation (rendering lag / encoding lag / network) used in Section 3
- [FCC National Broadband Map](https://broadbandmap.fcc.gov/) - [FAILED - direct fetch blocked HTTP 403 by the site's edge protection; described generically as an address-level, provider-self-reported coverage lookup, never a speed measurement, since no number was fetchable regardless]
- ZAO OS research doc 1030, doc 1036, doc 1040, doc events/1073, doc 986, doc 2108 (internal, all read in full this session) - [FULL]

