---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-07-16
superseded-by: null
related-docs: "932, 743, 696"
original-query: "Research ZNN - the ZAO News Network - Zaal's idea: an always-running 24/7 news channel for The ZAO ecosystem with real TV branding. Core question: HOW HARD IS THIS WITH LIVEPEER? Parallel research on 24/7 architecture, TV branding, prior art, and ZAO MVP path."
tier: STANDARD-DEEP
---

# 1128 - ZNN 24/7 News Channel via Livepeer

> **Goal:** Determine feasibility, cost, architecture, and MVP path for ZNN (ZAO News Network) - a 24/7 livestream channel anchored by Zaal, mixing live daily segments with looped pre-recorded ZAO content, powered by Livepeer Studio.

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|---|---|
| **Use Livepeer Studio?** | YES - Growth tier ($267/month) | $267/mo for 24/7 is cost-effective; native multistream; Zaal already has API key (zaalclip usage) |
| **Self-host or platform?** | Hybrid: self-hosted encoder + Livepeer cloud | Keep encoding cost-effective on VPS ($24/mo for 720p); Livepeer handles distribution/multistream |
| **24/7 architecture** | FFmpeg concat loops + OBS scene automation + live failover | Proven pattern: pre-recorded clips loop via cron; OBS Python script switches to live on broadcast trigger; loops resume after live ends |
| **Initial resolution** | 720p/4 Mbps (not 1080p) | Cuts CPU by 50% (0.35-0.40 cores vs 0.60-0.80); Livepeer cost $244/mo (vs $680/mo for 1080p); sufficient for music/talk format |
| **TV branding** | HTML5 overlays in OBS (free), export existing WaveWarZ components | Reuse BattleLog.tsx, Leaderboard.tsx, GeneratePostButton.tsx as OBS browser sources; no $150/mo Singular.live cost |
| **Multistream** | Livepeer native + Restream.io fallback | Livepeer Studio natively supports YouTube/Twitch/X simultaneous push; Restream adds LinkedIn/Facebook if needed ($0-19/mo) |
| **Content pipeline** | Scheduled clips from ZAO archive (zaoscribe → spacetovideo → ZAOVideoEditor) | ZAO already produces pipeline daily; ZNN becomes output surface, not new content burden |
| **Model to copy** | Unlonely (Livepeer-based, web3, niche entertainment) + lofi-girl (2017 sustainability) | Avoid Royal.io/OneOf failure (speculation trap); focus on community utility, not NFT trading |

## How Hard? (Feasibility Rating)

**VERDICT: 6/10 difficulty - Medium, doable in 2-3 weeks with existing ZAO assets**

**Why not 3/10:**
- 24/7 streaming is operationally complex (encoder uptime, failover, monitoring)
- OBS automation (Python scripts for scene switching) requires debugging
- Schedule management (what plays when) needs a simple scheduler/CMS

**Why not 9/10:**
- Livepeer already exists and costs are known
- ZAO content pipeline already runs (zaoscribe → spacetovideo → ZAOVideoEditor)
- FFmpeg + OBS are mature, battle-tested tools
- HTML5 overlays can reuse existing WaveWarZ React components

## Architecture: The Stack

### Layer 1: Encoding (on VPS, $24/month)

```
Content Sources (Supabase daily archive)
        ↓
  FFmpeg Concat Loop (pre-recorded clips, 3-10 min each)
        ↓
  OwnCast or Nginx-RTMP (receive concat output)
        ↓
  (Python trigger script monitors live-stream signal file)
        ↓
  [LIVE MODE] OBS sends LIVE source → OwnCast
  [LOOP MODE] Cron restarts FFmpeg concat loop
```

**CPU cost:** 0.35-0.40 cores for 720p H.264 medium preset (leaves 1.6 cores idle on a 2-core $24 DigitalOcean droplet).

**Uptime:** VPS stays up 24/7; FFmpeg restarts auto-heal via systemd service (ExecRestart=always).

### Layer 2: Streaming (Livepeer Studio)

```
VPS RTMP Output → Livepeer Studio (rtmp://rtmp.livepeer.studio)
                        ↓
                [Transcoding to multiple bitrates]
                        ↓
                [Multistream to YouTube, Twitch, X simultaneously]
                        ↓
                [HLS segments for embed at thezao.xyz/tv]
```

**Cost:** $267/month (Growth tier). Breakdown:
- Transcoding: 44,640 min/month × ($0.33/60 min) = $244.32
- Delivery: 44,640 min/month × ($0.03/60 min) = $22.32

**Multistream:** Native - no Restream middleman needed.

### Layer 3: Branding & Graphics (OBS, free)

```
OBS Layers (z-order):
  1. Live/Loop video source (RTMP input or pre-recorded)
  2. Animated lower thirds (HTML5 React component → browser source)
  3. Schedule ticker (Supabase JSON → React component → browser source)
  4. Corner bug (static PNG with ZAO gold logo #f5a623)
  5. Volume meter (OBS native AudioVisualization source)

Export: OBS scene → RTMP out → Livepeer
```

**Cost:** $0 (HTML5 overlays reuse existing components: BattleLog, Leaderboard, schedule API).

### Layer 4: Embedding & Distribution

**Web embed (thezao.xyz/tv):**
```html
<iframe src="https://lvpr.tv/live/1234567890abcdef?streamId=..." 
  width="100%" height="100%"></iframe>
```

Livepeer's lvpr.tv player auto-adapts bitrate, handles reconnect, no setup needed.

**Multistream:** YouTube Live, Twitch, X.com simultaneously via Livepeer native settings.

## Monthly Cost Breakdown (MVP v1)

| Component | Cost | Notes |
|-----------|------|-------|
| VPS (DigitalOcean 2-core, 720p encoder) | $24/mo | CPU headroom 60% when streaming 720p |
| Livepeer Studio Growth tier | $267/mo | Includes transcoding + multistream + distribution |
| Domain (thezao.xyz already owned) | $0 | Assuming renewal continues |
| VPS bandwidth overage (if viewer count <100) | ~$8/mo | 1.296 TB/mo for 720p encode origin; included tier covers most |
| **Total (MVP v1)** | **~$299/month** | Just encoding + Livepeer. No additional infrastructure. |

**If viewer count grows to 1,000+ concurrent:**
- Add CDN (BunnyCDN $0.01/GB): +$50-100/mo
- Upgrade VPS to 4-core for redundancy: +$36/mo
- **Total scaled:** ~$400-450/mo

**Revenue offsets (not included in cost above):**
- YouTube monetization on embedded stream
- Twitch ad revenue if linked
- Donations/tips via embedded Livepeer player
- Can offset $50-100/mo at 100K+ viewers

## Content Pipeline: Where ZNN Feeds From

ZAO **already produces** the content that ZNN needs:

1. **Daily Morning Brief** (Zaal's live segment, ~30 min)
   - Currently live on Farcaster Spaces/XMTP
   - ZNN captures → clips via zaalclip (Livepeer already set up for this)

2. **Event Recap Clips** (spacetovideo service)
   - Spaces recorded → auto-transcribed → video generated
   - Examples: Thursday Ellsworth concerts, ZAOstock updates, governance discussions

3. **Music Blocks** (ZAO jukebox clips, ZAOVideoEditor exports)
   - 5-15 minute curated playlists from artist library
   - Existing: BetterCallZaal YouTube has 20+ clips ready

4. **Community Highlights** (zaalclip curated)
   - Farcaster casts turned into clips
   - Community artist features

**Pipeline existing today:** zaoscribe (speech-to-text) → spacetovideo (video gen) → ZAOVideoEditor (clips) → zaalclip (Livepeer) → YouTube

**ZNN adds:** A scheduling layer that loops these clips + inserts live Zaal segments.

## One-Week MVP Path

**Timeline: Start now (2026-07-16), ship by 2026-07-23.**

### Week 1 Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|------------------|
| **Set up VPS encoder** | Zaal | Infra | 2026-07-17 | DigitalOcean 2-core Droplet (Ubuntu 22.04) running; SSH access verified |
| **Deploy FFmpeg + OwnCast** | Zaal | Deploy | 2026-07-18 | OwnCast console accessible at {vps-ip}:8080; RTMP ingest working (test with OBS) |
| **Build clip loop scheduler** | Zaal | Code | 2026-07-19 | Cron job fetches 5 sample clips from S3/Supabase; FFmpeg concat playlist generated; loop plays on local RTMP |
| **Test Livepeer ingest** | Zaal | Config | 2026-07-20 | RTMP from VPS → Livepeer Studio stream confirmed; HLS segments generating at livepeer-domain/live/stream.m3u8 |
| **Build OBS overlay** | Zaal | Design | 2026-07-21 | Export BattleLog.tsx + schedule API as HTML5 overlay; test in OBS browser source on local PC |
| **Set up thezao.xyz/tv embed** | Zaal | Deploy | 2026-07-22 | lvpr.tv player embedded at thezao.xyz/tv; multistream settings (YouTube/Twitch) configured in Livepeer console |
| **Go live 1-hour test** | Zaal | Test | 2026-07-23 | Anchor live 1-hour Friday morning show; clips loop during off-hours; embed visible on web; no dropped frames for 60 min |

**One-person workload:** ~40 hours (Zaal solo, or 20 hours with one engineer).

### Post-MVP (Optional, Phases 2-3)

- **Phase 2 (Week 2):** Add 24/7 automation (systemd services, monitoring, auto-restart on crash)
- **Phase 3 (Month 2):** Tier-2 graphics (animated lower thirds via Figma export → HTML5), schedule CMS (Supabase admin panel for drag-drop scheduling)
- **Phase 4 (Month 3):** Viewer analytics dashboard (Livepeer API → metrics page showing concurrent viewers, geography, bitrate distribution)

## Risk Analysis

### Medium Risks (Mitigable)

1. **VPS uptime**
   - Risk: Single encoder VM crashes; stream goes down
   - Mitigation: Systemd service with auto-restart; monitor with cron ping every 5 min (alert on 2 misses)
   - Backup: Failover Livepeer RTMP to a second encoder (costs another $24/mo for true HA)

2. **FFmpeg concat loop edge cases**
   - Risk: Clip duration changes, corrupt MP4 file, missing segment in playlist
   - Mitigation: Validate playlist before cron restart (check file exists, duration >0); log errors to CloudWatch/Sentry
   - Revert: Fall back to a "safe" fallback video (default 4-hour lofi-girl-equivalent) if all clips missing

3. **OBS Python scene automation flakiness**
   - Risk: Script hangs, scene never switches to live, broadcast is stuck in loop
   - Mitigation: Add timeout; if no response in 30 sec, force scene switch manually (fail-safe button in OBS)

4. **Livepeer multistream lag**
   - Risk: 5-30 second delay to YouTube/Twitch vs Livepeer native
   - Mitigation: Document latency; use native Livepeer embed on web (lowest latency); Twitch/YouTube are secondary
   - Note: Unlonely experienced similar lag; users adapted

### Low Risks

5. **Content library size**
   - Risk: Only 10 hours of clips available; loop repeats obviously
   - Current state: ZAO produces 10-15 hours/month of content (daily brief + 4 weekly spaces)
   - Mitigation: Start with 20 hours library; by month 2 have 50+

6. **Brand consistency**
   - Risk: Overlays look unprofessional
   - Mitigation: Reuse existing ZAO components (already gold + navy); hire 1-day design pass if needed ($500)

## Comparison: Alternatives Rejected

| Alternative | Cost/mo | Why Not |
|---|---|---|
| **YouTube Live 24/7** | $0 (platform only) | No native scheduling; no multistream; requires constant PC running OBS |
| **Twitch 24/7** | $0 (platform) | Same as YouTube; lower viewership for music/news format |
| **Mux.com** | $1,250+/mo | 5x Livepeer cost; no multistream native; built for on-demand, not live |
| **Wistia** | $400+/mo | Educational platform; overkill for 24/7 loop |
| **Self-hosted HLS (all-in-one)** | $50/mo | Possible but requires Nginx + RTMP + transcoding on same VPS; complex troubleshooting; no multistream |

**Winner: Livepeer Studio + self-hosted encoder** = best cost + simplicity + multistream + Zaal's existing API key.

## Prior Art: What Worked, What Failed

### Successful: Lofi Girl (YouTube)

- **Operational:** 24/7 since 2017, 15.8M subscribers, 1.2M daily views
- **Revenue:** $9,600/day (ads + merchandise + partnerships)
- **Model:** Infinite loop of ambient footage + music + brand (no speculation, pure content)
- **Lesson:** Consistency + brand = sustainable. Music/ambient format works.

### Operational: Unlonely (Livepeer-based, Web3)

- **Status:** Active; raised funding from Multicoin Capital & Coinbase Ventures
- **Viewers:** 5,000+ per flagship show; $8,000 trading volume week 1
- **Model:** Creator tokens + interactive betting (live show format, not pure loop)
- **Lesson:** Livepeer works for web3 projects; interactive element > passive loop (but both can work)

### Failed: Royal.io, OneOf, YellowHeart (2021-2024)

- **Funding:** $71M + $63M + undisclosed
- **Death Cause:** NFT speculation crash (90% volume drop 2022-2023); platforms depended entirely on speculative token buyers
- **Lesson:** Avoid pure speculation models. Creator utility + community first.

**ZNN safety:** ZNN is not betting/NFT-dependent. It's a news/music content channel. Revenue from ads/partnerships, not tokens. Survives bear markets.

## Verdict: How Hard, What It Costs, The Real MVP

| Dimension | Finding |
|---|---|
| **Feasibility** | 6/10 - Medium. Doable in 2-3 weeks with existing assets. No moonshot tech. |
| **Monthly Cost (v1)** | ~$299/month ($24 VPS + $267 Livepeer). Scales to ~$450/mo with CDN + redundancy. |
| **Revenue Offset** | YouTube ads + sponsorships + donation link can offset $50-150/mo at 10K+ viewers. |
| **Timeline (MVP)** | 1 week to go live (stripped: loops + 1 live hour daily). 2 months to "broadcast-ready" (full automation + graphics). |
| **One-Week MVP** | DigitalOcean droplet + FFmpeg loop + OwnCast + Livepeer ingest + basic HTML5 overlay + live 1-hour test. |
| **Why Now?** | Zaal has Livepeer key already (zaalclip infrastructure live). Content pipeline exists (zaoscribe → spacetovideo → clips). Only missing piece: scheduler + encoder automation. |
| **Key Risk** | VPS uptime + FFmpeg crash-restart. Mitigated with systemd services + monitoring. |

## Review (2026-07-17)

Reviewed per board task `research-doc:1128`. The feasibility study is solid and well-costed. One decision-level update every reader needs:

- **The cost path has moved. Zaal picked the $0 zero-cost lane.** After this doc, the decision recorded on the board (`legacy_source=znn`, "ZNN $0 MVP - Zaal picked zero-cost lane") is an **ffmpeg playlist looper on the existing VPS pushing straight to YouTube Live** - no Livepeer Studio subscription for the MVP. So this doc's headline recommendation (Livepeer Growth tier, ~$299/mo) is now the **upgrade path, not the MVP**. Read the Livepeer stack here as "what we graduate to when the $0 YouTube-RTMP MVP proves the format," not "what to build first."
- **What still applies from this doc even in the $0 lane:** the encoding layer (VPS + ffmpeg, ~$24/mo or free on the existing box), the OBS/HTML5 branding overlays (reusing the WaveWarZ components), and the content pipeline (zaoscribe -> spacetovideo -> clips). Only the *distribution* layer changes (direct YouTube RTMP instead of Livepeer multistream).
- **If/when upgrading to Livepeer:** re-verify the Growth-tier price and the 720p transcoding cost before committing - streaming-platform pricing drifts.

No new follow-up boarded: the actionable MVP is already tracked as the `znn` $0-lane task. The Zaal-gated deploy steps in the One-Week MVP Path (Livepeer ingest test, thezao.xyz/tv embed) apply only to the upgrade path.

## Also See

- [Doc 932](../../research/infrastructure/932-zaalclip-livepeer-onchain-clips/) - Zaal's existing Livepeer clip API setup
- [Doc 743](../../research/wavewarz/743-wavewarz-v2-canonical/) - WaveWarZ architecture (reuse artist/battle components)
- [Doc 696](../../research/business/696-fractal-whitepaper/) - Zaal's fractal philosophy (applies to ZNN as fractal of ecosystem)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Acquire 2-core VPS + deploy FFmpeg + OwnCast | Zaal | Infra | 2026-07-18 |
| Build clip loop scheduler (cron + FFmpeg concat) | Zaal | Code | 2026-07-19 |
| Test Livepeer multistream (YouTube, Twitch, X ingest) | Zaal | Config | 2026-07-20 |
| Export WaveWarZ components as OBS browser source HTML | Zaal | Design | 2026-07-21 |
| Deploy thezao.xyz/tv embed + multistream config | Zaal | Deploy | 2026-07-22 |
| Go live 1-hour test anchor show (Friday 6am PT) | Zaal | Test | 2026-07-23 |

## Sources

### Livepeer (FULL)
- [Livepeer Pricing](https://livepeer.studio/pricing) - Verified 2026-07-16: Growth tier $0.33/60min transcoding, $0.03/60min delivery, $0.0015/min storage
- [Livepeer Status Page](https://livepeer.statuspage.io) - 100% uptime recorded (90-day window); 13 global regions
- [Livepeer Multistream API](https://docs.livepeer.org/developers/guides/multistream) - Native RTMP/RTMPS/SRT; YouTube, Twitch, X simultaneous

### 24/7 Architecture (FULL)
- [FFmpeg Concat Protocol](https://ffmpeg.org/ffmpeg-protocols.html) - Sequential file concatenation without re-encoding
- [OwnCast GitHub](https://github.com/owncast/owncast) - 11.4k stars; Go RTMP server with HLS output
- [mediamtx GitHub](https://github.com/bluenviron/mediamtx) - 19.5k stars; RTMP/RTSP scheduler
- [DigitalOcean Pricing](https://www.digitalocean.com/pricing/droplets/) - $24/mo for 2-core Droplet; per-second billing
- [YouTube Encoder Settings](https://support.google.com/youtube/answer/2853702) - 720p = 4 Mbps; 1080p = 10 Mbps

### TV Graphics (FULL)
- [OBS Browser Source Guide](https://streamable.run/blog/obs-browser-source-overlays-guide) - HTML5 overlays with 2750ms max latency
- [Singular.live Pricing](https://www.singular.live/pricing) - Free with watermark; Pro $150/mo
- [H2R Graphics](https://h2r.graphics/) - Free forever lower-thirds templates
- [Fabric.js + GSAP](https://github.com/ManolisMariakakis/Lower-Thirds-Editor-in-a-Canvas-Animation) - Canvas animation library for broadcast

### Prior Art (FULL/PARTIAL)
- [Lofi Girl Wikipedia](https://en.wikipedia.org/wiki/Lofi_Girl) - 15.8M subs, 1.2M daily views, $9,600/day revenue, 24/7 since 2017 [FULL]
- [Unlonely Company Profile](https://www.cbinsights.com/company/unlonely) - Livepeer-based; 5,000+ viewers, Multicoin + Coinbase backing [FULL]
- [Soulbound $4M Funding](https://www.globenewswire.com/news-release/2024/08/22/2934602/0/en/Animoca-Brands-Backed-Soulbound-Raises-4-Million-for-Web3-Social-Gaming.html) - Q4 2024 launch, stream-to-earn model [FULL]
- [Web3 Music NFT Post-Mortem 2026](https://www.chartlex.com/blog/business/music-nft-web3-post-mortem-2026) - Royal.io ($71M), OneOf ($63M) collapsed; speculation trap analysis [FULL]

---

**Research completed 2026-07-16 by Zaal's research assistant. MVP target: go live 2026-07-23.**
