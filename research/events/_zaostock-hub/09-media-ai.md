# 09 - Media Production Assist (Photo/Video/Caption)

> **Status:** AI-assist research for ZAOstock
> **Date:** 2026-04-23
> **Festival:** Oct 3, 2026 · Ellsworth ME · 163 days out
> **Goal:** Design AI-powered media curation, captioning, editing, and distribution pipeline. Transform raw footage from multiple cameras + crowd captures into social-ready clips, captions, and archives within 48 hours of festival. Builds on doc 433 (media capture pipeline spec).

---

## Executive Summary: 80/20 Moves

**Top 3 AI wires to ship first:**

1. **Batch photo captioning** (Claude Haiku vision) - all approved photos from stock_attachments get auto-captions (1 sentence each, inspiring + specific). Ingest 50 photos at 10 parallel, cost ~$0.10, output 50 captions in 5 minutes. Team edits top 10 for hero shots.
2. **Highlight reel auto-edit** (Runway Gen-3 or Pika 2.0 for short-form video) - feed Runway the video files + captions, request 3 x 30-sec reels (opening, cypher, WaveWarZ final). Cost $20-50 in Runway credits. Ship by Oct 5.
3. **Artist claim-token system** (simple UUID per artist + claim form) - each artist in the festival gets a private claim URL (e.g., `/stock/media/claim/<artist_id>/<token>`). They see their clips + performances, can download or share. No AI here, just UX + auth scaffolding.

**Skip these (vanity/overkill at our 50-150 person scale, first event):**
- Multi-camera temporal sync (if Shawn + Hurric4n3 + volunteer all shoot, auto-align) - too much engineering. Manual editorial is fine for Year 1.
- Live stream (Twitch/YouTube) - small venue, outdoor parklet, no stage lighting. Audio quality will be poor. Wait for indoor venue Year 2.
- ISRC + full distribution (register every performance for broadcast royalties) - requires rights clearance from each artist. Doc 314 covers this; post-event workflow for Year 2.

---

## Problem Statement

ZAOstock Oct 3 will have:
- 1 hired videographer (Shawn or similar, full day)
- 2-3 volunteer camera operators (from stock_volunteers, via doc 03 volunteer matching)
- 50+ crowd captures (phones, selfies, candids)
- Potential for Spotify/streaming release (Cipher performance)

**Today's media problem (from doc 433):**
- Raw footage lands in 4+ different places (three camera cards, Arweave, R2, YouTube auto-upload)
- No auto-captioning; social posts require manual writing
- No structured clip extraction; artist performances sit in 45-min takes
- No artist attribution system; if artist wants their clip, they manually ask

**New process we want:**
- All footage → unified stock_attachments (done in Phase 1)
- Approved media → batch auto-caption (Claude vision)
- Videos → auto-clip extraction (ML or manual keyframe)
- Artists → easy claim system (tokens + download)
- Team → weekly short-form clips ready to post (Farcaster, X, TikTok)

---

## Key Decisions & Recommendations

| Decision | Choice | Why |
|----------|--------|-----|
| Photo curation | Claude Haiku vision (batch scoring 1-5) + human top-10 selection | Score all 50-100 photos for shareability ("Is this good for Instagram?"). Haiku costs $0.001/image (~1000 tokens). Rank by score, team picks top 10 "hero shots" manually. |
| Auto-captioning | Claude Haiku vision (one-sentence per photo) + human editing | "Describe in 1 sentence what's happening, inspire the reader" → Haiku generates 50 captions in <5min for $0.05. Team edits top 10 for brand voice + accuracy. |
| Video clipping | Keyframe detection (FFMPEG + manual or ML) → Runway Gen-3 for polish | Hire editor for 4 hours (get 3-5 short reels) OR use FFMPEG to find scene cuts (auto-extract 30-sec chunks around "peak" moments like cypher start). Polish in Runway Gen-3 ($20 in credits). Hybrid: editor handles raw cut, Runway adds transitions + music. |
| Short-form generation | Runway Gen-3, Pika 2.0, or Luma Dream Machine (parallel test) | Oct 1-3: request 3 short reels from each tool as A/B test. Runway = most mature, fastest. Pika = cheaper. Luma = newest. Pick winner for production. |
| Highlight reel concept | 3 x 30-sec clips: (1) Opening/energy, (2) Cypher performance, (3) WaveWarZ final + crowd | These are the 3 most shareable moments. Vertical format (TikTok/IG Reels). Text overlays: artist names, energy emoji (ENERGY, VIBE, CHAOS). |
| Watermark/branding | Logo + watermark on every frame (Zaal branding, Art of Ellsworth, sponsor logos) | Use Davinci Resolve or FFmpeg overlay. Simple PNG watermark in corner. Cost: 1 afternoon of template setup, then apply to all exports. |
| Artist claim system | UUID token per artist + simple form (name, email, wallet, which performances) | No complex auth needed. Artist gets /stock/media/claim/taylor-made/<token>, enters email, downloads zip of their clips. Store claim log in stock_artist_claims table. |
| Multi-camera sync | Manual editorial (have Shawn = lead camera, others are B-roll) vs. temporal auto-align | Auto-align is complex (requires timecode sync or audio waveform matching). Manual is simpler: edit = "show lead camera for main performance, cut to volunteer 2 for crowd reaction, back to lead for chorus". |
| B-roll + A-roll | Descript or CapCut AI to auto-edit + optimize | If we get raw 45-min takes from Shawn, Descript can auto-transcribe + auto-punctuate, then export as "good clips". CapCut AI can do auto-editing (auto-cut silence, auto-captions). Cost: $15/mo Descript or free CapCut. |
| Live stream | Skip for Year 1 (outdoor, no pro audio, small crowd). Recommend for Year 2 indoors. | Streaming setup costs $200+ (camera + encoder + license). Audio will be poor outdoors. Archive video is more valuable than live. |
| Music metadata (ISRC) | Defer to post-festival (doc 314 music metadata spec) | Requires rights from each artist, BMI/ASCAP clearance, DistroKid or similar. Out of scope for Oct 3 festival. Plan for Year 2 if artists want distribution. |
| Distribution channels | Farcaster + X (weekly posts) + TikTok + YouTube Shorts (async) | Weekly clip drops keep momentum going. TikTok/Shorts go live async (no 1-week delay). Use Opus Clip or Submagic to auto-adapt vertical format. |

---

## Integration Points: Database & Dashboard

**Existing foundation (doc 433, doc 477):**
- `stock_attachments` table: file_url, uploader_fid, caption, approval_status, tags
- `/stock/media` upload page (Phase 1)
- Phase 2: will add stock_attachments enhancements (approval workflow)

**New schema additions:**

```sql
-- Photo + video metadata
ALTER TABLE stock_attachments ADD COLUMN (
  media_type TEXT, -- 'photo', 'video', 'audio'
  duration_sec INT, -- for video/audio
  dimensions_px TEXT, -- "1920x1080"
  shareability_score INT, -- 1-5 (Claude auto-scored)
  auto_caption TEXT, -- Claude-generated
  manual_caption TEXT, -- Team override
  featured BOOLEAN DEFAULT false, -- Hero shot?
  artist_tagged TEXT[], -- Artist names mentioned
  moment_type TEXT -- 'performance', 'cypher', 'crowd', 'sponsor', 'backstage'
);

-- Artist claim tokens
CREATE TABLE stock_artist_claims (
  id UUID PRIMARY KEY,
  artist_name TEXT,
  artist_fid INT, -- if known
  claim_token UUID UNIQUE,
  email TEXT,
  wallet TEXT,
  claimed_at TIMESTAMPTZ,
  clips_count INT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- 90 days
);

-- Clip references (short-form extracted from video)
CREATE TABLE stock_clips (
  id UUID PRIMARY KEY,
  source_attachment_id UUID REFERENCES stock_attachments,
  start_sec INT,
  end_sec INT,
  duration_sec INT,
  clip_concept TEXT, -- 'opener', 'cypher', 'wavewarz_final'
  export_url TEXT, -- S3 or Arweave
  editor_notes TEXT,
  created_at TIMESTAMPTZ
);

-- Short-form reel exports (final polished clips)
CREATE TABLE stock_reels (
  id UUID PRIMARY KEY,
  title TEXT,
  concept TEXT, -- 'opening_energy', 'cypher_vibe', 'finale_chaos'
  duration_sec INT,
  video_url TEXT,
  thumbnail_url TEXT,
  exported_by TEXT, -- tool: 'runway', 'pika', 'luma'
  export_timestamp TIMESTAMPTZ,
  featured BOOLEAN,
  posted_to TEXT, -- 'farcaster', 'x', 'tiktok' (comma-separated)
  created_at TIMESTAMPTZ
);
```

**API routes to add (to `/api/stock/media/`):**

```
POST /api/stock/media/photo/score
  - Input: batch of attachment IDs (max 20)
  - Calls Claude Haiku vision on each
  - Scores 1-5 for shareability
  - Returns: [{ id, score, suggested_caption }]
  - Creates/updates stock_attachments.shareability_score

POST /api/stock/media/captions/batch
  - Input: attachment IDs to caption (already approved, shareable ≥3)
  - Calls Claude Haiku vision: "Describe in 1 inspiring sentence what's happening here. Be specific: artist names, action, energy."
  - Returns: [{ id, caption }]
  - Upserts stock_attachments.auto_caption

POST /api/stock/media/clips/extract
  - Input: video attachment ID + optional keyframe times
  - If no keyframes: auto-detect scene cuts (FFMPEG or ML model)
  - Returns: [{ start_sec, end_sec, confidence }]
  - Team reviews, picks 3-5, creates stock_clips records

POST /api/stock/media/reels/generate
  - Input: clip IDs + concept (e.g., "opening_energy")
  - Calls Runway Gen-3 API (or Pika): "Create 30-sec vertical video from these clips. Add transitions + uplifting music. Overlay artist names + text: ENERGY. Style: vibrant, festival vibe."
  - Returns: { reel_id, export_url, processing_status }
  - Polls for completion, stores in stock_reels

GET /api/stock/media/clip/<artist_id>/<claim_token>
  - Validates token (must exist, not expired, matches artist_id)
  - Returns: { artist_name, clips: [{ title, url, download_link }] }
  - Team can later add "I claim this performance" form

POST /api/stock/media/artist-claim/request
  - Input: { artist_name, email, wallet, fid (optional) }
  - Generates UUID claim_token
  - Emails artist: "Your ZAOstock media is ready! Claim your clips here: /stock/media/claim/<artist_id>/<token>"
  - Creates stock_artist_claims record

GET /api/stock/media/reels/feed
  - Returns latest stock_reels, ordered by created_at DESC
  - Supports filtering by concept, posted_to
  - Used by /stock/gallery page + Farcaster bot scheduled posts
```

**Dashboard updates to `/stock/team`:**

- **Media Curation tab** (new): Shows all stock_attachments with shareability scores. Filter by score, type, artist. Bulk select to batch-caption.
- **Clip editor** (new, basic): Lists stock_clips extracted from videos. Drag to reorder, edit in/out times, preview in player.
- **Reel builder** (new, read-only for now): Shows stock_reels. Links to Runway/Pika dashboard for editing. One-click "post to Farcaster" (triggers bot).
- **Artist claims** (new): Shows stock_artist_claims with token status + claimed/unclaimed counts.
- **Content calendar** (new): Week view of planned posts (Farcaster + X + TikTok). Drag clips onto dates.

---

## Reference Tools & Open Source

**Photo Curation & Captioning:**
- [Claude Haiku vision API](https://docs.anthropic.com/vision/overview) — Batch photo scoring + caption generation. Cost: $0.001 per image (~1000 tokens). No setup.
- [Clarifai image understanding](https://www.clarifai.com/) — Alternative, pre-trained models. Free tier up to 5000 images/month. Less customizable.
- [ImageAI](https://github.com/OlafenwaMoses/ImageAI) — Open source Python lib for object/scene detection + captioning. Requires self-hosted GPU. Free but setup cost.

**Video Clipping & Editing:**
- [Descript](https://www.descript.com/) — Transcribe + auto-edit video by transcript. $15/mo. Great for extracting "good parts" from 45-min takes.
- [FFmpeg](https://ffmpeg.org/) — Open source, do-it-all video tool. Learn curve steep; worth it for batch processing. Free.
- [CapCut API](https://www.capcut.com/) — Mobile first, but desktop version + API (limited). Free tier OK for small volume.
- [Adobe Premiere Pro](https://www.adobe.com/products/premiere.html) — Industry standard. $20/mo. Too heavy for our needs.

**Short-form Reel Generation:**
- [Runway Gen-3](https://runwayml.com/) — Text-to-video + video editing. $10-50/mo depending on usage. Mature, fast, excellent for 30-sec reels.
- [Pika 2.0](https://pika.art/) — Competing product, similar price + quality. Younger but fast iteration.
- [Luma Dream Machine](https://lumalabs.ai/) — Newest, best quality, but pricier ($50+). Test in Oct for Year 2 comparison.
- [ElevenLabs video feature (beta)](https://elevenlabs.io/) — If voice-over needed. Excellent synthesis.

**Watermarking & Branding:**
- [FFmpeg drawtext filter](https://ffmpeg.org/ffmpeg-filters.html#drawtext-1) — Command-line watermark overlay. Free.
- [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve/) — Professional color + title grading. Free tier good. $295 Studio version.
- [CapCut](https://www.capcut.com/) — Built-in watermark/branding tools. Easy for non-technical.

**Short-form Adaptation (Vertical):**
- [Opus Clip](https://opus.pro/) — Auto-extract & adapt long-form to short-form vertical clips. $10/mo. Excellent.
- [Submagic](https://www.submagic.co/) — AI captions + auto-shorts. $15/mo.
- [Veed.io](https://www.veed.io/) — All-in-one: captions, effects, format conversion. Free + $10/mo plans.

**Distribution Scheduling:**
- [Buffer](https://buffer.com/) — Schedule posts to Farcaster + X + TikTok. Integrates well. $35/mo.
- [Later](https://www.later.com/) — Similar. $20/mo.
- DIY: Farcaster bot (already exists in doc 473 for sponsor posts). X API v2 + scheduled posts (free tier limited).

---

## Data Flow: 6 Days Before to 30 Days After

```
Sep 27 (Wed): Setup
  - Brief Shawn + volunteers on recording plan (doc 433: 8 capture points)
  - Pre-load Runway + Pika accounts with Oct credits ($50 test budget)
  - Set up artist claim email template
  - Test Claude vision on sample photos (from past ZAO events, if available)

Sep 30 (Sat): Tech rehearsal
  - Shawn shoots 10 min of test footage
  - Upload to stock_attachments
  - Test /api/stock/media/clips/extract on test video
  - Test Claude caption on 5 sample photos
  - Verify Arweave + R2 upload paths

Oct 3 (Wed): Festival
  - 12:00-17:30: Continuous capture (Shawn, 2-3 volunteers, crowd)
  - 17:30: All footage uploaded to stock_attachments (or next morning)
  - Team tagging (artist names, moment type, approval)

Oct 4 (Thu): First-pass curation
  - Morning: Run /api/stock/media/photo/score on all photos
  - Rank by shareability, team picks top 20
  - Run /api/stock/media/captions/batch on top 20, team edits
  - Post 5 hero shots to Farcaster + X with captions (organic engagement)

Oct 5 (Fri): Video processing
  - Load Shawn's raw videos into Descript (auto-transcribe)
  - Extract key moments: opening 2 min, each artist set start, cypher, WaveWarZ rounds
  - Create stock_clips records for each
  - Request 3 reels from Runway: "opening energy", "cypher vibe", "finale chaos"
  - Runway processing starts (ETA: 24h)

Oct 6 (Sat): Artist claims
  - Generate claim tokens for each performing artist (5-7 artists)
  - Email claim links to artists: "Download your ZAOstock performance clips"
  - Create /stock/media/claim/<artist_id>/<token> landing page

Oct 7 (Sun): Reel distribution
  - Runway reels ready
  - Team reviews, adds voiceover (optional), tweaks in CapCut
  - Export 3 x vertical (TikTok/IG Reels) + 3 x 16:9 (YouTube Shorts)
  - Schedule posts: Farcaster (Sun 6pm), X (Mon 9am), TikTok (Tue 2pm)
  - Watermark all exports with ZAOstock logo + Art of Ellsworth credit

Oct 8 (Mon): Spotify release (optional, if rights cleared)
  - If Cipher performance will be released: register ISRC with DistroKid
  - Upload audio file + cover art
  - (Requires artist + label coordination; doc 314)

Oct 14-31 (Weekly drops):
  - Every Tuesday: new clip from weekly TikTok/Shorts queue
  - Every Thursday: behind-the-scenes photo + caption to Farcaster
  - Monitor engagement (reach, likes, shares)
  - Compile metrics for sponsor report (doc 07)

Nov 1+: Archive
  - All media locked to Arweave (immutable archive)
  - R2 cache aged out (1 month retention)
  - Artists have 90-day claim window (expires Jan 3)
  - Post-mortem: best-performing clips → portfolio for Year 2 teaser
```

---

## Cost Breakdown

| Item | Est. Cost | Notes |
|------|-----------|-------|
| Claude Haiku (photo scoring + batch captions) | $0.15 | 100 photos x 1500 tokens avg = 150K input tokens → $0.015 * 10 = ~$0.15 |
| Claude Haiku (video moment analysis, optional) | $0.10 | Analyze 10 video clips for "good moments" → 50K tokens |
| Runway Gen-3 (3 x 30-sec reels) | $30-50 | $10-20 per reel export depending on resolution + features |
| Pika 2.0 (test alternate, 1 reel) | $10-20 | A/B test vs Runway |
| Descript (1 month trial or basic) | $0-15 | Free tier covers 1h transcription. Otherwise $15/mo |
| CapCut (watermark overlay + tweaks) | $0 | Free desktop version |
| FFmpeg batch watermark (DIY script) | $0 | Open source, self-hosted |
| Clarifai (optional, if Claude not sufficient) | $0-20 | Free tier covers photo curation; paid if we need scale |
| Opus Clip (optional, for viral adaptation) | $0-10 | Free tier OK, $10/mo for more exports |
| Artist claim token system (coding) | $0 | 2-3 hours dev, in-scope |
| Buffer or Later (post scheduling) | $0-35 | DIY Farcaster bot covers Farcaster + X. Skip Buffer. |
| **Total** | **~$50-150** | Depends on reel polish + whether we do Spotify release |

---

## Success Metrics

By Oct 31, 2026:

1. **Photo archive**: ≥50 photos uploaded, ≥40 approved, ≥5 captioned + featured (hero shots)
2. **Video archive**: ≥3 key performance videos (opening, cypher, finale) archived to Arweave
3. **Reel production**: 3-5 short-form reels generated + posted (Farcaster, X, TikTok)
4. **Artist claims**: ≥80% of performing artists (5-7) receive claim token + claim ≥1 clip
5. **Engagement**: ≥100 impressions per reel on Farcaster (typical for community of 300 active Farc users)
6. **Turnaround time**: Hero shots posted within 48h of festival, reels within 72h
7. **Reusability**: ≥3 clips from ZAOstock are repurposed for Year 2 teaser / sponsorship pitches

---

## Timeline to Ship

**This week (Apr 23-25):**
- Design stock_attachments schema additions (shareability_score, auto_caption, etc.)
- Deploy /api/stock/media/photo/score endpoint (test with sample images)
- Deploy /api/stock/media/captions/batch endpoint
- Brief Zaal on Runway vs Pika vs Luma (recommend Runway as first choice)

**By May 15:**
- /api/stock/media/clips/extract live
- /api/stock/media/reels/generate live (connected to Runway API)
- Artist claim token system live (/api/stock/media/artist-claim/request)
- Dashboard tabs (Media Curation, Clip Editor, Artist Claims) ready

**By Aug 1:**
- Test suite: run all endpoints on sample Oct 2025 ZAO event footage (if available) or borrowed footage
- Descript + CapCut licensed (if not already in use)
- Runway + Pika accounts topped up with credits
- Team trained on curation workflow

**Sep 27 (pre-festival):**
- Final tech check: Shawn + volunteers record 10 min test
- Process through full pipeline (score, caption, clip, reel)
- Fix any bugs
- Finalize captions + watermark templates

**Oct 3+:**
- Execute per data flow timeline above

---

## What This Feeds Into

- **Doc 433 (Media Capture Pipeline)**: Upstream; this doc implements distribution + curation
- **Doc 477 (Dashboard)**: New media curation + artist claims views
- **Doc 07 (Analytics)**: Photo reach metrics from social engagement
- **Sponsor reports**: Use hero shots + reel clips in sponsor PDFs
- **Year 2 ZAOstock marketing**: Best clips become teaser video + sponsorship deck
- **Doc 314 (Music metadata, future)**: If performances are released, ISRC + DistroKid integration

---

## Open Questions

1. **Live-streaming Year 1?** Audio will be poor outdoors. Recommend skip, archive video only. Save for Year 2 if indoor venue.
2. **Spotify release of Cipher?** Requires ISRC + BMI/ASCAP clearance from each artist. Out of scope for Oct 3. Plan post-event if artists agree.
3. **Artist rights consent**: Do we need signed media release from each performing artist? (Recommend: yes, add to artist agreement email in doc 472)
4. **Watermark finality**: Should watermark show "Art of Ellsworth" or just "ZAOstock" or both? Sponsor logos? (Recommend: ZAOstock primary, Art of Ellsworth secondary, no sponsor logos on every frame—too cluttered)
5. **Video archive retention**: Keep clips on R2 forever, or rotate to cold storage after 1 year? (Recommend: Arweave = permanent, R2 = 1-year then delete)

---

## Sources

- [Claude Vision API Guide](https://docs.anthropic.com/vision/overview)
- [Runway Gen-3 Documentation](https://docs.runwayml.com/)
- [Descript Workflow Guide](https://www.descript.com/guides)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [ZAO Media Capture Pipeline Spec (doc 433)](../433-zao-media-capture-pipeline-spec/) — Upstream capture design
- [Dashboard Notion-Replacement Build (doc 477)](../477-zaostock-dashboard-notion-replacement/) — Dashboard integration
- [Artist Lockin Timeline (doc 472)](../472-zaostock-artist-lockin-timeline/) — Artist coordination
- [Run-of-Show Program (doc 428)](../428-zaostock-run-of-show-program/) — Festival schedule for key moments
- [Opus Clip Vertical Video Guide](https://opus.pro/blog/vertical-video)
