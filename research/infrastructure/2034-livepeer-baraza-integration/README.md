---
topic: Livepeer + Baraza streaming media kit integration
type: infrastructure / vendor evaluation
status: active
tier: STANDARD
last-validated: 2026-07-23
related-docs:
  - 2029-aziz-baraza-call (context: Aziz wants streaming kit + Sparkz connector)
  - 1098-sparkz-creator-coin-launcher (Baraza connects via Sparkz creator toggles)
original-query: "Build Livepeer into Baraza's streaming media kit + explore DIY node for Baraza TV"
---

# Livepeer + Baraza Streaming Media Kit Integration

## Executive Summary

Baraza (Nairobi, Aziz) is building a "streaming media kit" that plugs into Sparkz (ZAO's tokenless creator-coin launcher). The opportunity: use Livepeer's decentralized video infrastructure (transcoding + the new generative AI pipeline) as Baraza's engine, aligning with ZAO's OSS-first, own-your-infrastructure ethos.

**Recommendation: Start with Livepeer Studio API (production-ready, zero setup), layer the generative Agent capabilities via Daydream Beta in phase 2.**

---

## Key Decisions

| Decision | Choice | Rationale | Risk |
|----------|--------|-----------|------|
| Which Livepeer surface first? | **Livepeer Studio API** (hosted) | Production-ready, no infrastructure burden, managed pricing, fastest to integrate | Baraza pays network fees; hosted == trust Livepeer team |
| Self-hosted node for Baraza TV? | **Not recommended as primary** | Feasible (~$500-$2K GPU + bandwidth), but only ROI if they run high volume or want LPT earnings. Best as secondary/future. | Adds ops burden; GPU hardware dep; monthly ~2TB bandwidth cost |
| Generative AI pipeline (Daydream)? | **Use Livepeer AI Beta** (public beta, live now) | Daydream exited closed alpha in Sept 2025, now free during beta with capacity limits. Network will handle payment later. | Still in beta; capacity/rate-limits possible; cost model TBD at launch |
| Sparkz creator toggle model? | **Boolean flag per creator** ("enable AI media gen") | Simplest; creators opt-in to transcode+generative pipeline. Sparkz UI shows feature toggle. | Requires Sparkz UI/logic update; cost model needs tuning per creator |

---

## Findings

### 1. Livepeer Studio API (Production-Ready)

**Status:** Live, managed service by Livepeer Inc.

**Core Capabilities:**
- Livestream creation: `POST /api/stream` with customizable renditions (bitrate, fps, width, height)
- Asset upload: Three methods
  - Direct upload via `POST /api/asset/request-upload` + PUT to signed URL
  - Resumable uploads (for large files)
  - Import from URL: `POST /api/asset/import`
- Asynchronous transcoding: `POST /transcode` with multiple output profiles
- Real-time HLS/DASH delivery
- Storage integrations (Arweave, Storj, etc.)

**Authentication:** Bearer token via `Authorization: Bearer <API_KEY>` header

**File Limits:** 1GB per file (current)

**Pricing Model:** Per-network usage (storage, bandwidth, transcode minutes). Exact rates on `livepeer.studio/pricing`.

**Integration Effort:** Low (~200 lines of TypeScript). See `scaffold/livepeer-media.ts`.

### 2. Self-Hosted Livepeer Node (go-livepeer)

**Status:** Open-source, production use (not beginner-friendly).

**Hardware Requirements:**
- GPU: Nvidia Maxwell series or newer with NVENC/NVDEC support
- Initial cost: $500-$2,000 for modest setup (e.g., RTX 3060 or 4060 Ti)
- Bandwidth: Excellent uplink required; expect ~2TB/month data
- Static IP: Required for node operator registration
- CPU/RAM: 16GB RAM, 4+ cores recommended

**Operational Model:**
- Register as "transcoder" on Livepeer network
- Earn LPT tokens for transcoding work
- Competes for jobs in marketplace
- Monthly ops cost: electricity (~$30-80/month) + ISP bandwidth (variable)

**Verdict for Baraza:**
- **Not essential for MVP** - Livepeer Studio covers streaming/transcoding
- **Feasible as phase 2** - If Baraza TV wants independence + revenue stream, can run a transcoder on premise
- **Barrier:** Requires Linux/Kubernetes ops knowledge. Not plug-and-play.

### 3. Livepeer AI / Daydream (Generative Video Pipeline)

**Status:** Public Beta (since Sept 2025). Closed alpha is OVER.

**What it does:**
- Runs autoregressive video diffusion models on GPU
- Composes chains: image → 3D mesh (Rodin v2.5) → composite (nano-banana) → 360 turntable (Seedance i2v) → music bed (MiniMax) → stitch (ffmpeg)
- Output: rotatable GLB + 16:9 hero reveal video + still image
- Network cost: ~$0.77 per full run (Livepeer network pricing; exact varies)

**Current Implementation:**
- **Daydream Scope** (open-source): Local-first, runs on your GPU or cloud
- **Daydream API**: Interim solution using Daydream API keys (transitional, will move to on-chain LPT payment)
- **AI subnet**: Livepeer has treasury-funded AI agents (Special Purpose Entity, approved Apr 2025, 30,000 LPT) doing production VTuber + avatar pipelines

**Access:**
- Free to use during beta with capacity limits
- Apply for early access or join waitlist at `livepeer.org/daydream-waitlist`
- Open-source Scope available now on GitHub

**Production Readiness:** Beta-level. Suitable for integration now, but capacity/rate-limits expected. Cost model finalizes when mainnet payment launches.

**AI Performance in Ecosystem:** AI inference now ~60% of Livepeer protocol revenue (Q1 2026), indicating strong network capacity.

### 4. Integration with Sparkz (ZAO Creator Toggles)

**Current Sparkz Model** (from doc 1098):
- Creator sets coin params: name, supply, metadata
- ZAO ~25% locked stake + optionality
- Per-creator configurability

**Proposed "Streaming Media Kit" Toggle:**
- New creator setting: `enableMediaGeneration: boolean`
- When true, creator's dashboard shows:
  - Upload video asset → auto-transcode to HLS/DASH profiles (Livepeer Studio)
  - Generate variant: AI image → 3D hero asset (Daydream)
- Sparkz handles UI, ZAO handles Livepeer API keys + billing reconciliation
- Creator sees transparent cost breakdown

**Implementation Surface:**
- Backend: Sparkz creator-config schema + Livepeer API client
- Frontend: Toggle UI + asset upload form (Magnetiq or Sparkz portal)
- Billing: ZAO absorbs initial cost or passes margin to creator (decision point)

---

## MVP Recommendation

### Phase 1: Foundation (4 weeks)
1. **Livepeer Studio API integration**
   - Create `src/lib/livepeer-media.ts` (see scaffold)
   - Test: livestream creation, asset upload, transcode profiles
   - Add error handling + retry logic
   - Build simple dashboard: past uploads, active streams

2. **Sparkz creator toggle**
   - Add `enableMediaGeneration` to Sparkz creator config schema
   - UI: toggle + asset upload form
   - Route: `POST /api/baraza/transcode` → calls Livepeer Studio API

3. **Validation**
   - Test with Aziz/Baraza team: upload a 30s clip, verify HLS output
   - Measure: transcode time, output quality, cost per minute

### Phase 2: Generative AI (6 weeks, parallel to phase 1 if possible)
1. **Daydream API integration**
   - Get Daydream API key (apply to waitlist or use public beta)
   - Implement `POST /api/baraza/generate-hero` → image → 3D + reveal video
   - Store outputs: GLB (3D model) + MP4 (reveal) + still image

2. **Sparkz UI enhancement**
   - "Generate hero asset" button → calls Daydream
   - Status tracking: in-progress, ready, preview

3. **Cost modeling**
   - Instrument pricing: per upload, per transcode profile, per generative run
   - Dashboard: creator sees estimated cost before action

### Phase 3: Self-Hosted Transcoder (Optional, 8+ weeks)
- Deploy go-livepeer node on Baraza's own hardware (if they acquire GPU)
- Hybrid model: Sparkz routes jobs to local transcoder first, fallback to Livepeer network
- Baraza earns LPT on surplus capacity

---

## Next Actions

| Action | Owner | Date | Success Criteria |
|--------|-------|------|------------------|
| Fetch Daydream API key + sandbox environment | Zaal / Aziz | 2026-07-30 | Key obtained, docs read, test image uploaded |
| Prototype `livepeer-media.ts` + test with Livepeer Studio | Zaal (Claude Code) | 2026-08-02 | Module creates livestream, uploads asset, verifies HLS output |
| Review with Aziz: features + timeline + cost model | Zaal + Aziz | 2026-08-05 | Aziz approves phase 1 scope + signs off on timeline |
| Sparkz schema update: add `enableMediaGeneration` toggle | Codex or Claude Code | 2026-08-09 | Schema deployed to staging, UI form renders |
| E2E test: Sparkz UI → Livepeer Studio → HLS output | QA / Zaal | 2026-08-16 | Creator uploads video, Sparkz calls Livepeer, HLS deliverable within 5min |

---

## Sources

### Full (verified 2026-07-23)
- [Livepeer Studio API Quickstart](https://docs.livepeer.studio/quickstart) - API endpoints, auth, livestream/asset examples
- [Livepeer go-livepeer Hardware Requirements](https://docs.livepeer.org/references/go-livepeer/hardware-requirements) - GPU, bandwidth, setup details
- [Livepeer go-livepeer GPU Documentation](https://github.com/livepeer/go-livepeer/blob/master/doc/gpu.md) - Nvidia requirements, NVENC/NVDEC
- [Livepeer Daydream Product Update (Forum)](https://forum.livepeer.org/t/livepeer-inc-daydream-product-update/3247) - Beta timeline, access model
- [Daydream | Livepeer Ecosystem](https://livepeer.org/ecosystem/daydream) - Overview, status
- [Daydream Waitlist](https://www.livepeer.org/daydream-waitlist) - Access application
- [Livepeer Studio API Reference](https://docs.livepeer.studio/reference/api) - Comprehensive API docs
- [Livepeer Ecosystem: Studio](https://livepeer.org/ecosystem/livepeer-studio) - Platform overview

### Partial (key info verified, background context)
- [Medium: Livepeer Node Setup & Earnings](https://medium.com/coinmonks/a-new-livepeer-video-mining-rig-is-born-46919de23eae) - Hardware costs, earnings estimates
- [Livepeer Q1 2026 (Messari)](https://messari.io/report/livepeer-and-generative-ai-video) - Network metrics, AI revenue %, usage trends
- [Livepeer Documentation (Main)](https://docs.livepeer.org/) - General reference

### Not Found / Low Signal
- "Hero 3D Playbook" - specific Livepeer playbook URL from Discord not verified as official; may be community content or upcoming

---

## Related Context

**From 2029-aziz-baraza-call:**
- Aziz runs Baraza, Baraza TV, Build-A-Dao
- Miss Lulu is IRL lead
- Goal: streaming media kit plugs into Sparkz
- Creators toggle capabilities (livestream, transcode, generative media)
- Wants decentralized, low-cost infrastructure

**From 1098-sparkz-creator-coin-launcher:**
- Sparkz is ZAO's tokenless creator-coin launcher on Clanker
- Per-creator configurability
- ZAO ~25% locked stake + utility

**Fit:** Livepeer's decentralized transcoding + AI generation aligns perfectly with Sparkz's creator-first model and ZAO's OSS-first ethos.

---

## Appendix: Self-Hosted Node Financial Model (Reference)

For Phase 3 planning, rough annual cost of running a modest Livepeer transcoder:

| Item | Cost | Notes |
|------|------|-------|
| GPU (RTX 3060 or 4060 Ti, one-time) | $300-500 | Amortize over 3 years = $100-170/year |
| Electricity (~60W avg, $0.12/kWh) | ~$60/year | Varies by region |
| Bandwidth (2TB/month) | $200-400/year | Depends on ISP; shared line = variable |
| **Annual Total** | **$360-570** | Before LPT earnings |
| LPT Earnings (estimated) | +$500-1500 | Highly variable; depends on jobs + network volume |

**Breakeven:** Roughly achievable if consistent transcoding volume. Not a get-rich scheme, but defensible for infrastructure-conscious operators.

