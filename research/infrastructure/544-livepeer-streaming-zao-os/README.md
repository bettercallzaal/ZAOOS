---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-04-28
related-docs: 213, 215, 233
tier: STANDARD
---

# 544 — Livepeer Streaming for ZAO OS Spaces + Broadcast

> **Goal:** Lock the Livepeer integration path for ZAO OS streaming - Studio (live + VOD + multistream) is in production already; Daydream (real-time AI video) is a Phase 2 pilot; Orchestrator nodes are out of scope.

## Key Decisions / Recommendations

| Decision | Recommendation | Why |
|----------|----------------|-----|
| **Live + VOD + multistream provider** | USE Livepeer Studio | Already wired into `src/lib/livepeer/client.ts` + `/api/livepeer/stream` + `rtmpManager.ts` relay path. Free Sandbox covers dev (1,000 transcode min/mo). Pay As You Go from $100/mo cheaper than Mux at our volume. |
| **AI video effects (Phase 2)** | PILOT Daydream via ComfyStream | Real-time prompt-to-video transform on live streams. Use cases that map to ZAO: live translation/dubbing for international members, VTuber-style filters for shy artists, on-the-fly visualizers for music sets. |
| **Orchestrator GPU node** | SKIP for now | Supply-side play. Revisit only if we self-host the network. Doesn't ship streaming features any faster. |
| **Direct vs relay broadcast** | KEEP relay as default for >2 targets | Stream.io direct mode is per-target retry but caps real-world reliability. Livepeer relay = 1 push, N fan-outs, fail-soft per target. |
| **Recording** | KEEP `record: true` on every stream | $0.09 per 60 min storage. Cheap insurance. Unlocks clipping (already wired in `/api/livepeer/clip`). |
| **Env var** | SET `LIVEPEER_API_KEY` in Vercel before next ship | Currently empty in `.env.example`; production calls 500 on relay. Doc 233 P0 #2 still partly open. |
| **Webhook receiver** | BUILD `/api/livepeer/webhook` | Surface `stream.started`/`stream.idle`/`recording.ready` so dashboard reflects truth + clips become available automatically. |

## Current State in Repo (April 28, 2026)

| File | Function | Status |
|------|----------|--------|
| `src/app/api/livepeer/stream/route.ts` | POST: create multistream + stream with `record:true`; hardcoded ingest `rtmp://rtmp.livepeer.com/live` | Live, needs API key |
| `src/app/api/livepeer/stream/[id]/route.ts` | GET status, DELETE | Live |
| `src/app/api/livepeer/clip/route.ts` | POST: `livepeer.stream.createClip(playbackId, startTime, endTime)` | Live |
| `src/lib/livepeer/client.ts` | Browser-side wrapper over the routes | Live |
| `src/lib/spaces/rtmpManager.ts` | `startRelay()` pushes Stream.io RTMP into Livepeer ingest, fans out to N targets | Live |
| `.env.example` line 99 | `LIVEPEER_API_KEY=` | Empty - blocks production |
| Webhook handler | None | Missing |
| Clip GET endpoint | None | Missing |
| Recording playback page | None | Missing |
| Broadcast state persistence | None | Doc 233 P0 #3 still open |

## Pricing Comparison (Current as of April 28, 2026)

| Provider | Live (transcode) | Storage | Delivery | Multistream | Free Tier |
|----------|------------------|---------|----------|-------------|-----------|
| **Livepeer Studio Sandbox** | 1,000 min/mo free | 60 min/mo free | 5,000 min/mo free | Free | Yes - 30 concurrent viewers |
| **Livepeer Studio Pay As You Go** | $0.33 / 60 min | $0.09 / 60 min | $0.03 / 60 min | Free | $100/mo minimum spend |
| **Livepeer Studio Volume** | Custom | Custom | Custom | Free | $2,500/mo min, 15%+ off |
| **Mux** | $0.07 / min ($4.20/hr) | n/a | $0.025 / min ($1.50/hr) | Yes (paid) | Limited dev tier |
| **Cloudflare Stream** | Bundled (no encode fee) | $1 / 1,000 min stored | $5 / 1,000 min delivered | No native multistream | Limited |

**Per-hour math at our volume (a Saturday Spaces session, 50 listeners, 2 hours, 2 multistream targets):**
- Livepeer Sandbox: $0 (well under 1,000 min cap)
- Livepeer Pay As You Go: ~$0.66 transcode + ~$3 delivery + $0.18 storage = ~$3.84/session, but $100/mo minimum kicks in regardless
- Mux: ~$8.40 encode + ~$3 delivery = ~$11.40/session
- Cloudflare Stream: ~$0.60 storage + ~$1.50 delivery = ~$2.10/session, but no multistream

**Decision:** Stay on Livepeer Studio Sandbox until we reliably exceed 1,000 transcode min/mo. Switching to Pay As You Go only makes sense once we hit ~300 transcode min/mo on a sustained basis (cheaper than $100 minimum). Cloudflare Stream is cheaper for raw delivery but kills the relay-multistream play that powers cross-platform broadcasts.

## Daydream (Phase 2 - Real-Time AI Video)

| Property | Value |
|----------|-------|
| What it is | Realtime AI video playground built on ComfyStream + Livepeer compute network |
| Underlying tech | ComfyUI workflows running on GPU orchestrators, ultra-low latency |
| Access patterns | Pipelines marketplace at `pipelines.livepeer.org`, playground UI, API for programmatic use |
| Use cases pitched | Live translation/dubbing, VTubers, interactive livestreams, AI agents on video, closed captioning, security monitoring |
| ZAO fit | Live music shows with AI-generated visualizers; non-English members dubbed live; artist who don't want to show face can run a VTuber filter; cypher rooms with live AI captioning |
| Status | Public playground live; API + pipelines marketplace open |
| Cost | Not yet on Studio pricing page; assume separate compute billing |

**Suggested pilot (Phase 2, after Spaces stabilizes):**
1. Build a single hosted "ZAO Visualizer" pipeline in ComfyStream (audio-reactive Stable Diffusion).
2. Add a "Daydream effect" toggle on Host Room modal for music rooms.
3. Pipe Stream.io call output through Daydream pipeline before Livepeer multistream.
4. Limit to one room at a time until cost model is understood.

## Multistream Behavior (relevant for ZAO OS broadcast)

- Targets are RTMP URLs + stream keys per platform (Twitch, YouTube, Facebook, Kick, X, etc.).
- Fail-soft: a single dead target does not kill the source stream; other targets keep going.
- Multistream is FREE on Livepeer Studio (transcoding is the paid bit).
- Profile defaults to `source` (passthrough) - no extra transcode cost per target.
- Our `rtmpManager.ts:111-127` already creates one multistream target per platform and pushes a single RTMP from the Stream.io call to Livepeer, which is the recommended pattern.

## Gaps to Close (Action Bridge)

| Action | Owner | Type | Difficulty (1-10) |
|--------|-------|------|---------|
| Set `LIVEPEER_API_KEY` in Vercel production env (sandbox key from livepeer.studio) | @Zaal | Manual | 1 |
| Build `/api/livepeer/webhook` handler (stream.started, stream.idle, recording.ready) - persist to Supabase `stream_events` | Claude | PR | 4 |
| Persist `broadcastState` to localStorage + Supabase per `roomId` (Doc 233 P0 #3) | Claude | PR | 5 |
| Add `GET /api/livepeer/clip/[id]` so clip page can fetch by ID after creation | Claude | PR | 3 |
| Add `/spaces/recordings` page that lists prior `playbackId`s with HLS player | Claude | PR | 5 |
| Add Zod-validated `record` toggle on `POST /api/livepeer/stream` (currently hardcoded `record: true`) | Claude | PR | 2 |
| Document Daydream pilot in new research doc (Phase 2, after Spaces stable) | Claude | Doc | - |
| Add LIVEPEER_API_KEY to `secret-hygiene.md` watch list | Claude | Rule update | 1 |

## How to Try Livepeer Yourself (Zaal's TODO)

1. Go to `https://livepeer.studio/` -> sign up.
2. Project -> create -> grab API key.
3. Stash it in Vercel ZAO OS project as `LIVEPEER_API_KEY` (Production + Preview envs).
4. Hit `/spaces` -> create a Music room -> Host -> connect any RTMP target -> select "Relay" mode.
5. Watch `/dashboard/spaces/active` (admin) for the new stream + `playbackId`.
6. Try the developer docs: `https://docs.livepeer.org/v2/solutions/livepeer-studio/livestream/create-livestream`
7. Optional Daydream walkthrough: `https://pipelines.livepeer.org/playground/pip_f6PMBBXq44VZCFoQ`

## Also See

- [Doc 213](../../_archive/213-spaces-streaming-architecture-debug-guide/) - Spaces streaming architecture (archived but still useful for the Stream.io <-> Livepeer flow)
- [Doc 215](../215-obs-restream-streamyard-feature-analysis/) - OBS / Restream / StreamYard feature comparison; informs the multistream UX
- [Doc 233](../233-spaces-streaming-full-audit/) - Full streaming audit; this doc supersedes its Livepeer "MISSING ROUTES" finding (routes exist now)
- `_archive/163-multistreaming-platforms-integration` - earlier multistream provider scan

## Sources

- [Livepeer Studio Pricing](https://livepeer.studio/pricing) - verified 2026-04-28
- [Livepeer Docs - Multistream](https://docs.livepeer.org/v2/solutions/livepeer-studio/livestream/multistream)
- [Livepeer Docs - Livestream](https://docs.livepeer.org/v2/solutions/livepeer-studio/livestream/create-livestream)
- [Livepeer Docs - Daydream Overview](https://docs.livepeer.org/v2/solutions/daydream/overview)
- [Daydream blog post - "Glimpse into the Future of Realtime AI Video"](https://blog.livepeer.org/daydream-live-a-glimpse-into-the-future-of-realtime-ai-video-on-livepeer/)
- [ComfyUI and Real-Time Video AI Processing](https://blog.livepeer.org/comfyui-and-real-time-video-ai-processing/)
- [livepeer/studio repo](https://github.com/livepeer/studio)
- [Mux pricing comparison vs Cloudflare Stream](https://www.mux.com/compare/cloudflare-stream)
- [BuildMVPFast Video Streaming Pricing Comparison (April 2026)](https://www.buildmvpfast.com/api-costs/video)
- [Cloudflare Stream pricing](https://developers.cloudflare.com/stream/pricing/)

## Notes

- **Hallucination check:** `rtmp://rtmp.livepeer.com/live` ingest URL hardcoded in `src/app/api/livepeer/stream/route.ts:67` matches Livepeer's documented global ingest. SDK call shapes (`livepeer.stream.create`, `livepeer.multistream.create`, `livepeer.stream.createClip`) match the npm `livepeer` package surface.
- **Staleness check:** Livepeer Studio pricing pulled directly from `livepeer.studio/pricing` on 2026-04-28. Re-validate before any pricing-driven decision after 2026-05-28.
- **Docs link rot:** Two docs URLs returned 404 during research (`/sdks/javascript/getting-started`, `/livestream/multistream` direct path). The v2 versions in the Sources list resolve. Livepeer migrated docs paths in Q1 2026.
