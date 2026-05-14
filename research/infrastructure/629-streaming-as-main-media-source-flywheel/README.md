---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-05-09
related-docs: 627, 628, 626, 353, 354, 355, 351, 192, 215, 217, 233, 275, 311, 322, 562
tier: DEEP
---

# 629 - Streaming as Main Media Source: Live -> YouTube -> Short-Form Flywheel for ZAO

> **Goal:** Make live streaming the upstream content factory for the entire ZAO ecosystem media output. Every long-form video, podcast, short clip, social post, and newsletter cascades from a single live broadcast. Define the stack, AI pipeline, cross-posting layer, and ZAO-specific implementation. Doc 627 covers raw streaming. Doc 628 covers web3/token rails. This doc covers content repurposing - turning 1 hour live into 7 days of distributed media across 8+ surfaces.

> **Thesis (industry-validated 2026):** "Livestream is the raw material, not the output." Small creators who grow fastest spend 10% of time streaming and 90% repurposing into viral clips. ZAO must adopt this structurally - a single COC Concertz show should auto-cascade into YouTube long-form, 12-30 short-form clips across TikTok/Reels/Shorts/Farcaster, podcast audio drop, transcript newsletter, and quote-card socials.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Live studio** | USE StreamYard for shows with guests (browser-based, 4K local recording on paid plans, simultaneous YouTube + Twitch + LinkedIn + Facebook + X). USE OBS Studio + StreamElements browser-source for solo Zaal streams (free, low CPU - per Doc 627). SKIP Streamlabs Desktop for ZAO's cloud-first stack |
| **Multistream relay** | USE Restream as backup-fan-out only when StreamYard's native multistream caps don't cover Kick/niche platforms. Restream tiers cap at 2/3/5/8 simultaneous channels |
| **VOD storage** | USE Twitch VOD (14-day retention with Affiliate, free) AS PRIMARY -> auto-pull to YouTube for long-form. Mirror to Arweave (already wired in COC pipeline per Doc 353) for permanent archive |
| **Twitch -> YouTube automation** | USE n8n + CodelyTV's open-source `n8n-nodes-twitch` node (FOSS, self-hosted, free) - triggers on stream.online/offline, fetches VOD URL, uploads to YouTube via Data API v3 with AI metadata. SKIP Zapier (paid per-task, less control) |
| **AI clip generation** | USE Opus Clip ($15/mo Starter) as the workhorse - automated, fast, consistent. Vizard ($19/mo Creator) for transcript-precise edits when accuracy matters more than throughput. SKIP Spikes Studio - lower price ($13.99/mo) but smaller user base, fewer integrations |
| **Transcription** | USE OpenAI Whisper open-source self-host (free, runs on consumer GPU) for batch VOD transcription. USE AssemblyAI Universal-2 ($0.45/hr = $0.0075/min) for real-time live captions when accuracy matters (concerts with lyrics, technical streams). Deepgram Nova-3 ($0.0043/min batch) is cheaper but AssemblyAI wins on G2 quality |
| **Cross-posting orchestrator** | USE existing `src/lib/publish/` modules (per Doc 354 - 10 platform modules already shipped). EXTEND with a new `videoBroadcast()` function that handles per-platform video specs (9:16 for Reels/TikTok/Shorts, 16:9 for YouTube, etc) |
| **TikTok / Reels / Shorts** | USE TikTok Content Posting API (approved partner only) + Instagram Graph API 3-step container flow + YouTube Data API v3 for Shorts. ALWAYS strip platform watermarks - Instagram suppresses TikTok-watermarked videos. Generate per-platform captions from same transcript |
| **Farcaster video** | USE HLS streams via Cloudflare Stream (transcode .mp4 -> .m3u8). Frames v2 = Mini Apps now (rebrand confirmed). Embed clips as Mini App previews in cast feeds |
| **Newsletter from VOD** | EXTEND COC Concertz pipeline (Doc 353) to all ZAO surfaces - transcript -> Paragraph newsletter via existing infra. Doc 322 already wires Paragraph publishing |
| **Podcast audio extraction** | EXTRACT MP3 from VOD with ffmpeg, distribute via RSS to Apple Podcasts, Spotify, Pocket Casts, Overcast. Free + automatic |
| **Thumbnails** | USE Canva Magic Studio or Thumbsmith for AI-generated thumbnails from VOD frames. SKIP manual Photoshop workflow - costs Zaal hours per show |
| **Owner identity** | USE Farcaster verified address as universal creator ID across all surfaces. Cross-platform proof of authorship via EAS attestations (per Doc 628) |

---

## Part 1 - The Flywheel Thesis

```
                          [LIVE STREAM]
                       (1-2 hours, weekly)
                              |
                              | (raw material)
                              v
         +--------------------+--------------------+
         |                    |                    |
         v                    v                    v
   [YOUTUBE LONG-FORM]   [PODCAST AUDIO]    [VOD ARCHIVE]
   16:9, 30-90 min       MP3, RSS           Twitch + Arweave
         |                    |                    |
         |                    |                    |
         v                    v                    v
              [TRANSCRIPT VIA WHISPER / ASSEMBLYAI]
                              |
                              v
         +--------------------+--------------------+
         |                    |                    |
         v                    v                    v
   [12-30 SHORT CLIPS]   [NEWSLETTER]    [QUOTE CARDS]
   via Opus Clip / Vizard  via Paragraph    via Canva AI
         |                    |                    |
         v                    v                    v
      +--+--+--+--+--+      Email +         Farcaster +
      |  |  |  |  |  |      Substack         X + Bluesky +
      v  v  v  v  v  v      mirror           Threads + LinkedIn
      Farcaster              |
      X / Twitter            v
      TikTok                Subscribe -> back to live stream
      Instagram Reels
      YouTube Shorts
      LinkedIn video
      Bluesky video
                              |
                              v
                    [TRAFFIC BACK TO LIVE STREAM]
                       (loop closes - new viewers
                        from each downstream surface)
```

### Why this matters for ZAO

**Without flywheel:** 1 hour stream = 1 piece of content (Twitch VOD only). Decay starts day 1.

**With flywheel:** 1 hour stream = 30+ pieces of content across 8+ platforms over 7-30 days. Each piece is a new top-of-funnel for Twitch + ZAO ecosystem. Compounds week-over-week.

**Math:** ZAO has ~188 members in ZAO OS, ~13 promoters in COC. If each promoter does 1 stream/week with this flywheel, ZAO output = 13 * 30 = 390 pieces of content per week without 13x the work.

---

## Part 2 - The Stack

### Layer 1: Live Capture

| Tool | Cost | When |
|------|------|------|
| **StreamYard** | $25/mo Basic, $49/mo Professional | Multi-guest shows (COC concerts, ZAO panels), browser-based, 4K local recording |
| **OBS Studio + StreamElements** | Free | Solo Zaal streams (BCZ), low CPU (3-5%), full custom overlays per Doc 627 |
| **Restream** | $19-79/mo | Backup multistream relay when StreamYard caps don't cover Kick |

### Layer 2: VOD Capture + Storage

| Surface | Cost | Retention |
|---------|------|-----------|
| Twitch VOD | Free (Affiliate) | 14 days |
| YouTube VOD | Free | Indefinite |
| Arweave (perma-archive) | One-time ~$0.50/GB | Forever (already wired - Doc 353) |
| Cloudflare R2 | $0.015/GB/mo egress-free | Indefinite |
| Cloudflare Stream | $5/mo per 1000 min stored | HLS-ready for Farcaster + web embeds |

### Layer 3: Transcription

| Provider | Pricing (per min) | Strength | When |
|----------|-------------------|----------|------|
| **Whisper open-source** | Free (self-host) | Flexibility | Batch VOD on Zaal's machine or RunPod GPU |
| **AssemblyAI Universal-2** | ~$0.0075 ($0.45/hr) | Highest G2 quality, real-time | Live captions on premium streams |
| **Deepgram Nova-3** | $0.0043 batch / $0.0077 streaming | Cheapest streaming | High-volume real-time at scale |
| **OpenAI Whisper API** | $0.006 | Simple managed API | One-off, no self-host setup |

For ZAO scale (1-10 streams/week), Whisper open-source is plenty. AssemblyAI for premium concerts where caption quality matters.

### Layer 4: AI Clip Generation

| Tool | Pricing | Strength | When |
|------|---------|----------|------|
| **Opus Clip** | $15/mo Starter, $29/mo Pro | Speed, automation, bulk output | Default workhorse |
| **Vizard** | Free 5/mo + watermark, $19/mo Creator (30hr), $42/mo Pro (100hr HD) | Transcript-based precision editing | When accuracy matters (lyric clips, tech demos) |
| **Spikes Studio** | $13.99/mo | Lowest cost, real-time face detect | Fallback / budget |
| **Custom (Whisper + ffmpeg + GPT)** | ~$0 + dev time | Full control, no vendor lock | When ZAO scales > 50 streams/mo |

### Layer 5: Cross-Posting (already exists in `src/lib/publish/` per Doc 354)

| Module | Platform | Auth | Char Limit |
|--------|----------|------|------------|
| `auto-cast.ts` | Farcaster /zao channel | Neynar signer | 320 |
| `x.ts` | X | OAuth 1.0a | 280 |
| `bluesky.ts` | Bluesky | App Password | 300 |
| `threads.ts` | Threads | Graph API | 500 |
| `telegram.ts` | Telegram | Bot Token | 4096 |
| `discord.ts` | Discord | Webhook | 2000 |
| `lens.ts` | Lens | (scaffolded) | n/a |
| `hive.ts` | Hive | (scaffolded) | n/a |
| `normalize.ts` | All | n/a | per-platform |
| `broadcast.ts` | Telegram + Discord | n/a | n/a |

**Gap:** No video-specific publishers. New work needed:
- TikTok Content Posting API integration
- Instagram Graph API video container flow
- YouTube Data API v3 Shorts upload
- LinkedIn video API
- Farcaster video Mini App embed

### Layer 6: Newsletter + Long-Form

Already shipped per Doc 322 (Paragraph publish.new) + Doc 351 (YouTube SEO transcripts) + Doc 353 (COC pipeline).

---

## Part 3 - Per-Surface Mapping

For ONE live stream, here's what gets generated:

### YouTube (Long-Form)

| Output | Format | How |
|--------|--------|-----|
| Full VOD upload | 16:9 MP4, 30-180 min | n8n trigger on `stream.offline` -> fetch Twitch VOD -> YouTube Data API v3 |
| Auto chapters | Timestamps from transcript | Whisper segments -> chapter markers in description |
| AI metadata | Title, description, tags | Claude API generates from transcript (Doc 322 pattern) |
| Custom thumbnail | 1280x720 PNG | Canva Magic Studio API or manual |

### YouTube Shorts / TikTok / Instagram Reels (Short-Form)

| Output | Format | How |
|--------|--------|-----|
| 12-30 vertical clips | 9:16 MP4, 15-90 sec | Opus Clip auto-detects highlights from VOD |
| Auto-captions | Burned-in subtitles | Opus Clip generates, Vizard for premium |
| Per-platform captions | Hooks + hashtags | Per-platform GPT prompt, NOT same caption across all (algos detect) |
| Cross-post upload | Native API per platform | TikTok Content Posting API + Instagram Graph + YouTube Data v3 |

### Farcaster

| Output | Format | How |
|--------|--------|-----|
| Live indicator on `/zao` channel | Cast | Stream.online webhook -> `auto-cast.ts` |
| Highlight clip embed | HLS .m3u8 stream | Cloudflare Stream transcode + Mini App embed |
| Quote-card frame | Static image | Canva AI quote card from transcript |
| Tip-on-cast (per Doc 628) | Coinflow link | Auto-add Coinflow tip URL to live cast |

### X / Bluesky / Threads / LinkedIn

| Output | Format | How |
|--------|--------|-----|
| Live announcement | Text + thumbnail | Stream.online webhook -> `x.ts` + `bluesky.ts` + `threads.ts` |
| Quote tweets/casts/posts | Text + image | Pull-quotes from transcript, batch over 7 days |
| Video clips | Native upload (X), embed (others) | X video API; Bluesky video card; Threads video upload |
| LinkedIn long-form post | Article-style | Transcript -> editorial pass -> LinkedIn API |

### Newsletter (Paragraph)

| Output | Format | How |
|--------|--------|-----|
| Show recap | Long-form | Transcript -> Claude API rewrite -> Paragraph (Doc 322) |
| Embedded video | YouTube embed | After YouTube upload completes |
| Segment timestamps | Linked chapters | From Whisper segments |
| Quote highlights | Pull-quotes | Top 5 highlights from clip-detector |

### Podcast (RSS)

| Output | Format | How |
|--------|--------|-----|
| MP3 audio | 128kbps stereo | ffmpeg extract from VOD |
| Show notes | Text | Same transcript |
| RSS distribution | feed.xml | Self-host RSS or Anchor/Spotify for Podcasters |

---

## Part 4 - The AI Pipeline (Single Source of Truth)

```
[LIVE STREAM ENDS]
       |
       v
[Twitch VOD URL via EventSub stream.offline]
       |
       v
[Cloudflare Worker / n8n trigger]
       |
       +---> [ffmpeg extract audio MP3]
       |          |
       |          v
       |     [RSS podcast feed update]
       |
       +---> [Whisper transcribe (self-host or API)]
       |          |
       |          v
       |     [Transcript .json with timestamps]
       |          |
       |          +---> [Claude API: title + description + tags]
       |          |          |
       |          |          v
       |          |     [YouTube Data API v3 upload]
       |          |
       |          +---> [Claude API: newsletter draft]
       |          |          |
       |          |          v
       |          |     [Paragraph publish.new -> email]
       |          |
       |          +---> [Top 5 quotes -> Canva AI quote cards]
       |          |          |
       |          |          v
       |          |     [Cross-post via existing modules]
       |          |
       |          +---> [Chapter markers]
       |
       +---> [Opus Clip API: detect 12-30 highlights]
                  |
                  v
             [Vertical 9:16 clips with burned captions]
                  |
                  +---> [TikTok Content Posting API]
                  +---> [Instagram Graph API Reels]
                  +---> [YouTube Data API v3 Shorts]
                  +---> [Farcaster Mini App video embed via Cloudflare Stream]
                  +---> [X video upload]
                  +---> [LinkedIn video API]
                  +---> [Bluesky video card]
```

Total cost per stream: ~$0.50-2.00 (Whisper API or self-host + Opus Clip allocation + Cloudflare Stream).

---

## Part 5 - Cross-Posting Watermark + Caption Strategy

Critical: Instagram + Reels actively SUPPRESS competitor-watermarked content. TikTok with TikTok watermark gets crushed on Reels.

### Per-Platform Caption Variants (Same Transcript, Different Hooks)

| Platform | Format | Length | Hashtag Strategy | Hook Style |
|----------|--------|--------|------------------|------------|
| **TikTok** | Punchy 1-line + 3-5 trending hashtags | < 150 char ideal | Trending, broad | Pattern interrupt: "wait..." / "POV:" / question |
| **Instagram Reels** | Conversational + 20-30 hashtags | < 2200 char | Niche + broad mix | Story-driven, longer |
| **YouTube Shorts** | Title 60 char + #Shorts + descriptive desc | n/a | Topic + #Shorts | SEO keyword in title |
| **X video** | Tweet-style 1-2 sentence | 280 char | 1-2 max | Conversational, witty |
| **Farcaster** | Cast format + Mini App embed | 320 char | n/a (channels) | Insight-led, ZAO-aware |
| **Bluesky** | Conversational | 300 char | Sparing | Personal, narrative |
| **LinkedIn** | Professional, value-first | 700-1300 char | 3-5 | Insight + takeaway |

Implementation: per-platform Claude API prompt with platform-specific instructions and the same transcript chunk.

### Watermark Removal

- StreamYard local recording = clean (no watermark, paid plans)
- Twitch VOD = clean
- Opus Clip output = configurable (remove their logo on $29/mo Pro)
- ALWAYS strip TikTok / Reels native watermarks via re-export through ffmpeg or Pixflow before cross-posting

---

## Part 6 - ZAO-Specific Implementation

### BetterCallZaal (Personal)

**Cadence:** 1-2 streams/week (consulting AMAs, build-in-public)

**Stack:**
- OBS Studio + StreamElements (per Doc 627)
- Solo: no StreamYard needed
- VOD -> YouTube long-form ("BCZ Stream Vault")
- Opus Clip -> 12-15 shorts per stream
- Farcaster: live indicator on `bettercallzaal.com` + clip embeds via Mini App

**Cost:** ~$15/mo (Opus Clip Starter) + $0 streaming + ~$2/stream Cloudflare Stream

### COC Concertz (Concert Pipeline)

**Cadence:** 1-3 concerts/week, multi-segment shows

**Stack:**
- StreamYard Professional ($49/mo) - guests are artists
- Existing pipeline (Doc 353) extended with full automation:
  - Descript for editorial transcripts (already in workflow)
  - Add Opus Clip on top for shorts
  - Paragraph newsletter (already wired)
  - Per-segment YouTube uploads (chapter-driven)
- Cross-post per artist + COC channel

**Cost:** ~$80/mo (StreamYard + Opus Clip) - splits across 13 promoters = $6/promoter

### ZAO OS (Community Platform)

**Cadence:** 1-2 community streams/week (panels, ZOE updates, governance)

**Stack:**
- StreamYard for multi-guest panels
- Stream lives on Twitch + YouTube + auto-cast to /zao Farcaster channel
- ZOE bot mirrors highlights to Discord + Telegram

### FISHBOWLZ (Audio Rooms - paused)

**When unfrozen post-Juke:** layer streaming on top via Stream Video SDK (Doc 275). Audio extraction native. Visual flair lighter.

### WaveWarZ (Prediction Markets)

**Stream the bets:** every WaveWarZ debate becomes a livestream. Stream-time becomes the prediction-market activity window. Live markets resolve on-stream.

---

## Part 7 - Cost Model

### Per Active Streamer Per Month

| Component | Cost | Notes |
|-----------|------|-------|
| StreamYard (if multi-guest) | $25-49 | Skip for solo |
| OBS + StreamElements | $0 | Free |
| Whisper self-host | $0 + GPU electricity | One-time setup |
| Opus Clip Starter | $15 | $29 Pro for watermark removal |
| Cloudflare Stream | ~$10 | 1000 min storage |
| Canva Magic Studio | $13 | Thumbnails + quote cards |
| YouTube + TikTok + IG APIs | $0 | Free tier covers up to ~6 uploads/day |
| AssemblyAI live captions | ~$1-5/stream | Optional, premium streams |
| n8n self-hosted | $0 | Free, self-hosted |
| **Total per streamer** | **$53-92/mo** | Median ~$70 |

ZAO ecosystem at full deployment:
- 1 BCZ + 13 COC + 5 ZAO OS streamers = 19 active = ~$1330/mo across the entire ZAO content engine
- Output: 19 streams/week * 30 pieces of content = 570 pieces/week = 2280 pieces/month
- Cost per piece: $0.58

Compare to outsourcing to a content agency at $5-15K/mo: 18-30x cheaper with the flywheel.

---

## Part 8 - Vendor Comparison Tables

### Live Studio Comparison

| Tool | Cost | Multi-Guest | Multistream | Local Recording | Custom Overlays | Best For |
|------|------|-------------|-------------|-----------------|-----------------|----------|
| **StreamYard** | $25-49/mo | YES (10 guests Pro) | YES (paid) | 4K local (paid) | YES | Multi-guest shows, COC |
| **OBS Studio** | Free | No native (use Zoom) | Manual config | Local | Full custom (browser source) | Solo streams, BCZ |
| **Restream Studio** | $19-79/mo | YES | YES (30+ channels) | Cloud only | Limited | Multi-platform fan-out |
| **Riverside** | $24-99/mo | YES (8 guests) | YES (Magic Clips AI) | 4K per-track local | Yes | Podcast-first hybrid |
| **Streamlabs Desktop** | Free + paid | No native | Manual | Local | Yes (paid templates) | SKIP - heavier CPU |

### AI Clip Tool Comparison

| Tool | Pricing | Free Tier | Watermark | Transcript Edit | Speed | Best For |
|------|---------|-----------|-----------|-----------------|-------|----------|
| **Opus Clip** | $15-29/mo | Trial | Pro removes | Limited | Fast | Bulk default |
| **Vizard** | Free + $19-42/mo | 5 vids/mo (watermarked) | Creator removes | YES (powerful) | Medium | Precision editing |
| **Spikes Studio** | $13.99+/mo | n/a | Yes default | Limited | Fast | Budget |
| **Custom Whisper+ffmpeg** | ~$0 + dev time | n/a | None | YES (full) | Slow setup, fast run | Long-term scale |

### Transcription Comparison

| Provider | $/min | Streaming | Self-Host | Quality (WER) | Best For |
|----------|-------|-----------|-----------|---------------|----------|
| **Whisper open-source** | Free | No | YES | ~8% | Batch, ZAO scale |
| **AssemblyAI Universal-2** | $0.0075-0.012 | YES | No | ~7.9% | Live captions premium |
| **Deepgram Nova-3** | $0.0043-0.0077 | YES | No | ~7% | High-volume streaming |
| **OpenAI Whisper API** | $0.006 | No | YES (open-source variant) | ~8% | Managed batch |

---

## Part 9 - Community Sentiment Synthesis

From r/Twitch, r/streaming, creator economy blogs (Uscreen, NBH, Riverside, Marketing Agent Blog):

**Pro-flywheel consensus:**
- "Livestream is the raw material, not the output" (NBH, Riverside)
- Top-1% creators spend 10% time streaming, 90% repurposing (Cinna case study)
- 1 hour live = 1 week of content fed across surfaces
- Reduces single-algorithm dependency (don't bet farm on Twitch alone)

**Pro-cross-platform consensus:**
- Watermarks crush reach - always strip
- Per-platform captions, not copy-paste (algo penalty)
- Same content, different hooks per platform

**Anti-flywheel signal:**
- Burnout risk: 90% repurposing = grind without automation. AUTOMATION SOLVES THIS - hence this doc
- Cross-platform fatigue: viewers don't want same content across all surfaces. SOLVED via per-platform hooks
- Engagement dilution: posting more <> better engagement. SOLVED via highlight selection (Opus Clip / Vizard)

**Verdict:** Adopt the flywheel structurally - it's table-stakes for 2026 creator success. Without automation it's burnout fuel; with automation it's compounding leverage.

---

## Part 10 - Phase Plan

### Phase 0 (now) - Doc 627 baseline

- OBS + StreamElements working for BCZ
- Twitch + YouTube manual upload
- Existing cross-posting via Doc 354 modules

### Phase 1 (this month) - Capture + transcribe

1. Set up StreamYard for COC Concertz (replace any Restream-only flow)
2. Self-host Whisper on Zaal's machine (one-time, 1 day setup)
3. n8n self-host on existing Vercel/Fly infra OR dedicated cheap VPS
4. n8n workflow: stream.offline -> fetch VOD URL -> Whisper -> Supabase transcripts table

### Phase 2 (next month) - Auto-publish long-form

1. n8n: transcript -> Claude API -> YouTube Data API v3 upload with metadata
2. Auto-chapters from Whisper segments
3. Canva Magic Studio integration for thumbnails (or manual fallback)
4. Paragraph newsletter auto-draft from transcript (extends Doc 322)

### Phase 3 (Q3 2026) - Short-form factory

1. Opus Clip API integration (or upgrade to scripted ffmpeg+Whisper if scale > 50 streams/mo)
2. Per-platform caption generator (Claude API per-platform prompt)
3. Cross-posting `videoBroadcast()` extending Doc 354 modules
4. TikTok Content Posting API approval + Instagram Graph API + YouTube Shorts upload

### Phase 4 (Q4 2026) - Native social + Farcaster video

1. Cloudflare Stream integration for HLS transcoding
2. Farcaster Mini App video embed
3. X video native upload
4. LinkedIn video API
5. Bluesky video card
6. Threads video

### Phase 5 (2027) - Podcast + agent layer

1. ffmpeg audio extract + RSS feed publish
2. ZOE agent reads transcripts, surfaces patterns over time
3. Ecosystem-wide content calendar - all 19 ZAO streamers visible in one dashboard
4. Auto-attribution: every clip carries Farcaster verified address + EAS attestation (per Doc 628)

---

## Open Questions / Risks

| Question | Mitigation |
|----------|------------|
| TikTok Content Posting API approval timeline (1-3 weeks) | Apply early; fallback to manual upload until approved |
| YouTube Data API v3 quota (10,000 units/day default) | Each upload = 1600 units, so ~6 uploads/day; request quota increase if scaling |
| Whisper transcription on long concerts (3-hour shows) | Chunk into 10-min segments; merge transcripts |
| Opus Clip generic clip detection misses ZAO-specific moments (music drops, crowd reactions) | Layer custom highlight detection (audio peak, viewer-spike correlation) |
| Cross-post bot detection on aggressive automation | Throttle - max 2 posts/hour per platform; randomize timing slightly |
| n8n self-host reliability (single point of failure) | Mirror critical workflows in Cloudflare Workers; n8n only for orchestration |
| Storage cost compounding (every stream = 1-3GB VOD x 19 streamers x 4/mo) | Cloudflare R2 zero egress; archive cold to Arweave once published |
| Content cannibalization (clips pull from VOD watch) | Studies show clips drive +60% to long-form; net positive |

---

## Also See

### Streaming infra (upstream)
- [Doc 627 - Twitch + StreamElements](../../cross-platform/627-twitch-streaming-streamelements-integration/) - Live capture layer
- [Doc 192 - Multiplatform Streaming RTMP](../192-multiplatform-streaming-rtmp/) - RTMP fan-out
- [Doc 215 - OBS / Restream / Streamyard](../215-obs-restream-streamyard-feature-analysis/) - Tool comparison
- [Doc 217 - AV Quality Optimization](../217-av-quality-optimization-live-streaming/) - Bitrate, codec
- [Doc 233 - Spaces Streaming Audit](../233-spaces-streaming-full-audit/) - ZAO OS streaming surface
- [Doc 275 - Stream Video SDK](../275-stream-video-sdk-dashboard-configuration/) - GetStream.io

### Web3 + token (lateral)
- [Doc 628 - Web3 Streaming Bridge](../../business/628-web3-streaming-zabal-empire-bridge/) - ZABAL Empire scoring from stream events
- [Doc 626 - Empire Builder POIDH airdrop](../../business/626-empire-builder-zabal-poidh-airdrop/) - apiLeaderboards pattern

### Content pipeline (downstream)
- [Doc 351 - YouTube SEO concert transcripts](../../cross-platform/351-youtube-description-seo-concert-transcripts/) - YouTube description generation
- [Doc 353 - YouTube content pipeline COC](../../cross-platform/353-youtube-content-pipeline-automation/) - Existing COC workflow
- [Doc 354 - Cross-posting infrastructure audit](../../cross-platform/354-cross-posting-infrastructure-audit/) - 10 platform publish modules
- [Doc 355 - Autonomous social distribution](../../cross-platform/355-autonomous-social-distribution-2026/) - Distribution agent
- [Doc 322 - Paragraph publish.new newsletter agent](../../322-paragraph-publishnew-newsletter-agent-commerce/) - Newsletter automation
- [Doc 311 - Vibe-coded apps marketing playbook](../../311-vibe-coded-apps-marketing-playbook/) - Marketing patterns
- [Doc 562 - YapZ Bonfire ingestion](../../identity/569-yapz-bonfire-ingestion-strategy/) - Knowledge graph

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Phase 1 - StreamYard Professional account for COC Concertz | @Zaal | Subscribe | 2026-05-23 |
| Phase 1 - self-host Whisper on Zaal's M-series Mac (faster-whisper + GPU) | @Zaal | Setup | 2026-05-23 |
| Phase 1 - n8n self-host (Vercel free tier or $5/mo Hetzner VPS) | @Zaal | Deploy | 2026-05-23 |
| Phase 1 - n8n workflow: stream.offline EventSub -> VOD fetch -> Whisper -> Supabase transcripts | @Zaal | n8n flow | 2026-05-30 |
| Phase 2 - Claude API metadata generator (title/description/tags from transcript) | @Zaal | PR | 2026-06-06 |
| Phase 2 - YouTube Data API v3 OAuth + auto-upload | @Zaal | PR | 2026-06-13 |
| Phase 2 - Auto-chapter from Whisper segments | @Zaal | n8n flow | 2026-06-13 |
| Phase 2 - Paragraph newsletter auto-draft (extend Doc 322) | @Zaal | PR | 2026-06-20 |
| Phase 3 - Opus Clip Starter sub + API key | @Zaal | Subscribe | 2026-07-01 |
| Phase 3 - Per-platform caption generator (Claude per-platform prompt) | @Zaal | PR | 2026-07-15 |
| Phase 3 - Apply for TikTok Content Posting API access | @Zaal | TikTok dev | 2026-07-01 |
| Phase 3 - Build `src/lib/publish/tiktok.ts`, `instagram.ts`, `youtube-shorts.ts`, `linkedin-video.ts` | @Zaal | PR | 2026-07-30 |
| Phase 3 - Extend `broadcast.ts` with `videoBroadcast()` for parallel video upload | @Zaal | PR | 2026-07-30 |
| Phase 4 - Cloudflare Stream account + HLS transcode workflow | @Zaal | Setup | 2026-09-01 |
| Phase 4 - Farcaster video Mini App embed | @Zaal | PR | 2026-09-15 |
| Phase 4 - X video native upload via API | @Zaal | PR | 2026-09-15 |
| Phase 5 - Podcast RSS feed (ffmpeg + S3 + feed.xml) | @Zaal | PR | 2026-10-01 |
| Phase 5 - Ecosystem content calendar dashboard (all 19 streamers in one view) | @Team | PR | 2026-11-01 |
| Confirm n8n + Twitch CodelyTV node still maintained (last commit recent?) | @Zaal | Audit | 2026-05-16 |
| Apply for YouTube Data API v3 quota increase if uploads > 6/day | @Zaal | Google form | When relevant |

---

## Sources

### Streaming Tool Comparisons (2026)

- [StreamYard - Best Streaming Software 2026](https://streamyard.com/blog/streaming-software-2026-comparison) - Tool comparison guide. Verified 2026-05-09
- [StreamYard - Best Multistreaming 2026](https://streamyard.com/blog/best-multistreaming-software-2026) - Multistream landscape
- [StreamYard - Best Streaming Software for PC 2026](https://streamyard.com/blog/best-streaming-software-for-pc-streamyard-obs-streamlabs-riverside-restream) - PC-specific
- [Riverside - Best StreamYard Alternatives 2026](https://riverside.com/blog/best-streamyard-alternatives) - Competitor analysis
- [Whop - 7 Restream Alternatives 2026](https://whop.com/blog/restream-alternatives/) - Restream landscape
- [Contus - 10 Best StreamYard Alternatives 2026](https://www.contus.com/blog/best-streamyard-alternative/) - Comparison

### AI Clip Tools

- [Vizard - Best Opus Clip Alternative](https://vizard.ai/alternatives/opus) - Vizard pitch + comparison
- [Mirra - 10 Best OpusClip Alternatives 2026](https://www.mirra.my/en/blog/best-opusclip-alternatives) - Tool roundup
- [Vizard - 7 Alternatives to OpusClip](https://vizard.ai/blog/7-best-alternatives-to-opusclip-for-auto-video-highlights) - Feature comparison
- [Wavel - Opus Clip vs Vizard](https://wavel.ai/compare/opusclip-vs-vizard) - Side-by-side
- [PixelPanda - Vizard.ai Review 2026](https://pixelpanda.ai/review/vizard-ai) - Pricing + features
- [MakeShorts - Best AI Shorts Generators 2026](https://www.makeshorts.ai/blog/best-ai-shorts-generators-2026) - Landscape

### Automation + APIs

- [Zapier - Twitch + YouTube auto-upload](https://zapier.com/apps/twitch/integrations/youtube/1237351/upload-videos-to-youtube-from-new-twitch-live-streams) - Workflow template
- [n8n - YouTube integrations](https://n8n.io/integrations/youtube/) - n8n YouTube docs
- [n8n - automated YouTube uploads workflow](https://n8n.io/workflows/3906-automate-youtube-uploads-with-ai-generated-metadata-from-google-drive/) - Template
- [GitHub - n8n-nodes-twitch (CodelyTV)](https://github.com/CodelyTV/n8n-nodes-twitch) - FOSS Twitch node
- [TikTok Content Posting API](https://developers.tiktok.com/products/content-posting-api/) - Official docs
- [Phyllo - Automate Video Uploads YouTube/IG/TikTok](https://www.getphyllo.com/post/using-apis-to-automate-content-upload-on-youtube-instagram-tiktok) - API patterns
- [Zernio - TikTok Content Posting API Guide 2026](https://zernio.com/blog/tiktok-developer-api) - Implementation guide

### Transcription

- [AssemblyAI - Best Real-Time Speech APIs 2026](https://www.assemblyai.com/blog/best-api-models-for-real-time-speech-recognition-and-transcription) - Provider comparison
- [AssemblyAI - Speech-to-Text Pricing](https://www.assemblyai.com/blog/speech-to-text-api-pricing) - Pricing comparison
- [Gladia - Best Whisper Alternatives 2026](https://www.gladia.io/blog/best-whisper-alternatives-2026) - Whisper landscape
- [CodeSOTA - Speech Recognition 2026](https://www.codesota.com/guides/speech-recognition) - Whisper vs Gemini vs AssemblyAI vs Deepgram
- [BrassTranscripts - AI Transcription Services 2026](https://brasstranscripts.com/blog/best-ai-transcription-services-2025-tested-compared) - Tested comparison

### Farcaster Video

- [GitHub - streamethorg/video-frame](https://github.com/streamethorg/video-frame) - Video Frame spec
- [Farcaster Frames v2 Demo](https://frames-v2.vercel.app/) - Mini App demo
- [Farcaster Mini Apps - manifest vs embed guide](https://miniapps.farcaster.xyz/docs/guides/manifest-vs-embed) - Embed mechanics
- [dTech - Farcaster Cast Embeds](https://dtech.vision/farcaster/hubs/embeds/) - Video, image, link embeds

### Creator Economy + Repurposing Strategy

- [Uscreen - Creator Economy Statistics 2026](https://www.uscreen.tv/blog/creator-economy-statistics/) - Industry numbers
- [Upstream - How to Make Money Live Streaming 2026](https://upstream.so/blog/how-to-make-money-live-streaming-247/) - Monetization strategy
- [NBH - Livestreaming Trends 2026](https://www.nbh.co/learn/livestreaming-trends-in-2026-what-businesses-actually-need-to-know) - Trends + flywheel framing
- [StreamScharts - Best Streaming Platform Small Streamers 2026](https://streamscharts.com/news/best-streaming-platform-small-streamers-2026) - Small-creator angle
- [Marketing Agent - Twitch Marketing Strategy 2026](https://marketingagent.blog/2026/01/11/the-complete-twitch-marketing-strategy-for-2026-from-gaming-platform-to-creator-economy-powerhouse/) - Twitch growth playbook
- [OneStream - How Much Twitch Streamers Make 2026](https://onestream.live/blog/how-much-do-twitch-streamers-make/) - Revenue benchmarks
- [Stan Store - Cinna Streamer Bio 2026](https://stan.store/blog/cinna-creator-bio/) - Top-1% case study (10/90 split)

### Cross-Posting + Watermarks

- [Vidpal - Cross-Post Reels/Shorts/TikTok](https://www.vidpal.ai/blog/cross-post-instagram-youtube-tiktok-facebook-automation) - Watermark penalties
- [WoopSocial - TikTok to Reels Crossposting 2026](https://woopsocial.com/blog/tiktok-to-reels-crossposting-workflow) - Workflow guide
- [Socialync - Cross-Post TikTok to IG Reels 2026](https://www.socialync.io/cross-post/tiktok-to-instagram) - Implementation
- [Deliberate Directions - Best IG/TikTok Crossposting Tools 2026](https://deliberatedirections.com/instagram-tiktok-crossposting-tools/) - Tool comparison
