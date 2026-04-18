# 433 - ZAO Media Capture Pipeline Spec

> **Status:** Research + spec, no code yet
> **Date:** 2026-04-18
> **Goal:** Design a structured media capture pipeline for ZAOstock and every future The ZAO event. Addresses one of the top gaps from doc 432 (Tricky Buddha master context): "Media loss - valuable content not captured, no structured ingestion pipeline."

---

## Problem Statement

Every ZAO event produces immense raw cultural value: live performances, cyphers, backstage moments, crowd energy, artist interactions. ZAOCHELLA lost most of this to the ether. Phone footage on 53 different devices that never gets uploaded. A few highlight reels emerge weeks later but 95% of the material sits in camera rolls.

For ZAOstock and every event after, we need a **structured pipeline** so media:
1. Gets uploaded quickly (ideally day-of)
2. Lands in a shared place
3. Gets tagged and searchable
4. Becomes raw material for promotion, artist marketing, and onchain artifacts

Tokenized incentives (ZABAL) reward contributors so uploading stops being friction.

---

## Key Decisions / Recommendations

| Decision | Choice |
|----------|--------|
| Storage backend | Arweave (permanent) via ArDrive for the official archive, plus R2/S3 warm cache for speed |
| Upload interface | Simple public `/stock/media` page + QR code posted around venue. Drag-drop or phone-camera picker. No login required for small files. |
| Auth for larger uploads | Rate-limited by IP + honeypot. Token-reward path requires a wallet or email. |
| Tagging | Auto-capture (upload time, device, IP region) + optional user tags (artist name, moment type) |
| Review flow | Content team (DaNici + Shawn + FailOften) flags public-ready vs private-only |
| Token reward | Flat ZABAL per approved upload (example: 10 ZABAL for a clip, 50 ZABAL for a cypher-quality clip) |
| Distribution | Weekly content drop to Farcaster channel + dedicated /stock/gallery page built from approved items |
| Storage cost | Arweave one-time ~$5/GB at current rates. Budget: $50-100 for ZAOstock (10-20GB total) |

## Comparison of Storage Options

| Option | Cost | Permanence | Ease of use | Web3 fit | Fit for ZAOstock |
|--------|------|-----------|-------------|----------|------------------|
| Arweave (via ArDrive) | $5-7/GB one-time | Permanent | Moderate (need wallet, turbo topup) | Native | USE (archive layer) |
| Cloudflare R2 | $0.015/GB/mo, no egress | Rented | Simple | No | USE (warm cache) |
| AWS S3 | $0.023/GB/mo + egress fees | Rented | Simple | No | SKIP (egress kills us) |
| IPFS + Pinata | $0.15/GB/mo | Dependent on pins | Moderate | Native | SKIP (IPFS content addressing less useful for our flow) |
| YouTube + Instagram | Free | Platform risk | Easy for users | No | USE (distribution layer, not archive) |
| Supabase Storage | Included in plan | Rented | Simple | No | SKIP for archive, OK for previews |

**Recommendation stack:** Arweave (archive) + R2 (warm cache + signed URLs for upload) + social platforms (distribution). Do not build our own CDN.

---

## Capture Points Throughout an Event

For ZAOstock specifically, these are the 8 moments that MUST be captured:

1. **Opening set** (Artist 1, 12:15-12:45) - full performance
2. **Each individual artist set** (Artists 2-4, mid-day) - 15-20 min each
3. **The Cypher** (~14:35, 30 min) - the day's signature artifact. Multi-cam preferred.
4. **WaveWarZ Round 1** (~15:10) - all 4 artists
5. **WaveWarZ Semi-Final** (~15:55) - top 2
6. **WaveWarZ Final + voting announcement** (~16:55-17:25)
7. **Closing set** (~17:30, 30 min) - winner plays the day out
8. **Partner / sponsor activations** - booth interactions, verbal credits, attendee reactions at sponsor booths

Plus continuous capture:
- Crowd wide shots every 15 min
- Attendee candid interactions
- Artist backstage prep
- The parklet itself filling up and emptying out across the day

---

## Three Contributor Tiers

**Tier 1: Official Production (owned, paid)**
- 1 videographer + 1 photographer hired or barterd
- Shoots main stage, cypher, WaveWarZ rounds in good quality
- Uploads raw to R2 end-of-day, transfers to Arweave post-event
- Content team has exclusive first-window access

**Tier 2: Volunteer Media Crew (earned rewards)**
- 3-5 volunteers with the content role (already a field in stock_volunteers)
- Shoot crowd, candid, sponsor booths, artist backstage
- Upload via /stock/media on their phones throughout the day
- Rewarded in ZABAL per approved upload

**Tier 3: Crowd / Public (discretionary rewards)**
- Anyone at the event can upload via /stock/media (or a QR code posted at the entrance)
- Content team reviews + keeps the good stuff
- Rewarded in ZABAL for each accepted upload
- Crowd-sourced angles that official team cannot cover

---

## Token Reward Model (ZABAL)

Simple payout tiers, paid post-event after review:

| Upload type | ZABAL reward |
|-------------|-------------|
| Approved photo | 5 |
| Approved short clip (<30s) | 10 |
| Approved full artist set clip (>1 min) | 50 |
| Approved cypher participant contribution | 100 |
| Approved content team work (video edit, highlight reel) | 500-2000 |

**Why tokens:**
- Turns a chore into a game
- Creates ongoing value to ZABAL holders
- Documents contribution for future ZAO roles
- Reusable for every future event

**Mechanics:**
- Upload form captures wallet address (or email to claim later)
- Content team approval triggers batch payout via a single transaction at end of month
- Public leaderboard shows top contributors per event (drives competition)

---

## Data Model

Suggested schema if we build this on Supabase:

```sql
CREATE TABLE IF NOT EXISTS event_media_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug TEXT NOT NULL,
  uploader_name TEXT DEFAULT '',
  uploader_wallet TEXT DEFAULT '',
  uploader_email TEXT DEFAULT '',
  tier TEXT CHECK (tier IN ('official','volunteer','crowd')) DEFAULT 'crowd',
  media_type TEXT CHECK (media_type IN ('photo','video','audio')) NOT NULL,
  -- Storage URLs
  r2_url TEXT,
  arweave_tx TEXT,
  thumbnail_url TEXT,
  -- Metadata
  captured_at TIMESTAMPTZ,
  captured_location TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  -- Review
  status TEXT CHECK (status IN ('pending','approved','rejected','public')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES stock_team_members(id),
  reviewed_at TIMESTAMPTZ,
  zabal_paid INT DEFAULT 0,
  zabal_paid_tx TEXT DEFAULT '',
  -- Housekeeping
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

One table, one event slug, scales to every future event.

---

## Build Phases

**Phase 1 (pre-event, by Aug 1):**
- Create the `event_media_uploads` table
- Build `/stock/media` upload form (public, optional wallet)
- Simple upload path to R2 via signed URL (no Arweave yet - batch later)
- Review queue in dashboard: new "Media" tab that shows pending uploads with approve/reject buttons
- Document the QR code for venue signage

**Phase 2 (day-of and post-event):**
- Content team posts QR codes around venue
- Volunteers and attendees upload throughout the day
- Review queue fills up; Zaal, DaNici, Shawn review over the following week
- Batch approved uploads to Arweave via ArDrive
- Compute ZABAL payouts, execute batch transaction

**Phase 3 (future events, by 2027):**
- Public gallery page per event at `/stock/gallery` or `/concertz/gallery` etc
- Farcaster channel auto-posts weekly highlights
- Leaderboard page ranking contributors across events
- API so agents (ZOE) can pull approved media for use in content
- Generalize to multi-event (COC Concertz, FISHBOWLZ, future)

---

## ZAO Ecosystem Integration

**Code files that would exist:**
- `scripts/event-media-uploads.sql` - schema
- `src/app/stock/media/page.tsx` + form - public upload
- `src/app/api/stock/media/route.ts` - signed URL issuer + save row
- `src/app/api/stock/media/review/route.ts` - team approval endpoint
- `src/app/stock/team/MediaReview.tsx` - dashboard tab for content team
- `src/lib/storage/r2.ts` + `src/lib/storage/arweave.ts` - storage helpers

**Who owns what:**
- FailOften: technical build of upload path + R2 + Arweave integration
- DaNici + Shawn: content review rubric + approve/reject decisions
- Zaal: ZABAL payout logic + content strategy direction
- DCoop: cypher-specific capture plan (multi-cam, audio feed from the board)

**Reward budget:**
If we hit ~100 approved uploads for ZAOstock (reasonable for a first event):
- 50 photos at 5 ZABAL = 250
- 30 short clips at 10 = 300
- 15 full clips at 50 = 750
- 5 cypher clips at 100 = 500
- 2 content-team edits at 1000 = 2000
- **Total: ~3,800 ZABAL per event, budgeted in advance**

This is cheap fuel compared to what it unlocks.

---

## Next Actions (before ZAOstock Oct 3)

1. **Tuesday Apr 21 meeting** - bring this doc. Decide if we build Phase 1 before event.
2. **April-May**: FailOften scopes the upload form + R2 integration (2-week estimate)
3. **May 15**: Phase 1 shipped; volunteer content crew trained on the flow
4. **June**: QR code signage designed by DaNici + Shawn for venue
5. **August**: First test upload + approval flow dry run
6. **Oct 3**: live capture. Content team runs review queue through the following week
7. **Oct 15**: ZABAL payout batch, public highlights drop

## Risks + Decisions to Make

| Risk | Mitigation |
|------|-----------|
| Too few uploads day-of | QR code signage + volunteer content crew pre-briefed with upload mission |
| Too many uploads, review backlog | Clear review rubric, approval can be fast (yes/no) |
| Low quality uploads | Filter at review stage, reject aggressively |
| Artist rights issues | Upload form has a checkbox: "I took this or am in it, I agree to share for ZAO use" |
| Arweave costs spike | R2-only for Phase 1, Arweave transfer as a post-event batch |
| Wallet UX kills uploads | Email-claim fallback; they give email, get ZABAL later |

## Sources

- Internal: doc 432 (Tricky Buddha Space master context) - identifies media loss as a top gap
- [ArDrive pricing](https://ardrive.io/pricing)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- Prior art: Paragraph's media pipeline, Paragraph article uploads
- ZAO existing: `stock_volunteers` table has `role='content'` category already

## Related Research

- [432 - ZAO Master Context (Tricky Buddha)](../../community/432-zao-master-context-tricky-buddha/)
- [418 - Birding Man Festival Analysis](../418-birding-man-festival-analysis/)
- [428 - ZAOstock Run-of-Show Program](../428-zaostock-run-of-show-program/)
