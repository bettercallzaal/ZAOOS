---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-06-09
superseded-by:
related-docs: 836, 778, 741
original-query: "Audit github.com/bettercallzaal/ZAOVideoEditor - full repo audit, identify what exists, what is broken, what is missing, surface PR-worthy fixes. Then: make the goal a clean video editor with all functions for ZAO and ZAO OS to distribute media from livestreams, best-in-class clipping for all."
tier: STANDARD
---

# 837 - ZAO Video Editor: Audit + Livestream-to-Clips Roadmap

> **Goal:** Audit `bettercallzaal/ZAOVideoEditor` as-is, then chart the path to make it THE clean editor ZAO/ZAO OS uses to turn livestreams into distributed, multi-platform clips.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | KEEP the repo. It is a real FastAPI + React app with 18 routers and 40 services, not a stub. Build on it, do not restart. | Transcription, captions, diarization, highlight detection, clip export, content gen, batch, Quick Process pipeline all implemented and wired. Verified by reading the code. |
| 2 | SHIP the two audit PRs first (security #2, hygiene #3), then build the livestream + vertical-clip layer. | Path-traversal hole (arbitrary dir delete via `DELETE /api/projects/{name}`) is the one true CRITICAL. Fix before adding any public/multi-user surface. |
| 3 | The product gap is INGEST + DISTRIBUTION, not editing. The editing core exists. What is missing: livestream pull, 9:16 vertical reframing, per-platform export presets, and push-to-platform. | Today the only input is a manual file upload (`POST /api/projects/{name}/upload`). "Distribute media from livestreams" needs the front and back ends of the pipeline, not the middle. |
| 4 | Vertical auto-clip (16:9 -> 9:16 with speaker-tracked crop + burned captions) is the single highest-leverage feature for "best clipping for all". | Every distribution surface ZAO uses for clips (Farcaster, X, TikTok, Reels, Shorts) is vertical-first. The repo already detects highlights and burns captions; it cannot yet reframe. |
| 5 | Restream is the livestream source of record. Pull VODs/recordings from Restream + YouTube Live + Twitch rather than re-build streaming. | Per ZAO glossary, Restream is the ZABAL Games default streaming surface. Do not rebuild ingest ZAO already pays for. |

## Current State (verified by reading the repo, commit 8ec4a74)

Stack: FastAPI backend (`backend/`, 18 routers, ~40 service modules), React 19 + Vite + Tailwind v4 frontend (`frontend/`), local-first (ffmpeg + faster-whisper, no cloud required). MIT licensed.

What works (implemented, not stubbed):

| Capability | Where | Notes |
|-----------|-------|-------|
| Project CRUD + chunked upload (10 GB cap, disk-space guard, auto-remux to mp4) | `routers/projects.py` | Upload is the ONLY ingest path today. |
| Transcription, 3 engines | `routers/transcription.py`, `services/whisper_service.py`, `whisperx_service.py`, `groq_service.py` | faster-whisper (local), whisperx, groq (cloud). `auto` picks best available. |
| Timestamp refinement | `services/stable_ts_service.py` | Optional stable-ts post-process. |
| Speaker diarization | `services/diarization.py` | pyannote, needs `HF_TOKEN`. |
| Correction dictionary (ZAO terms pre-loaded) | `services/dictionary.py`, `shared/dictionary.json` | ZAO, ZABAL, WaveWarZ, SongJam, Farcaster seeded; auto-learns from edits. |
| Captions, 6 styles, burn-in | `routers/captions.py`, `services/caption_gen.py`, `ffmpeg_service.py` | SRT/ASS, pillow + moviepy renderers. |
| Silence / filler removal | `routers/silence.py`, `fillers.py`, `services/auto_editor_service.py`, `filler_detection.py` | auto-editor based. |
| Highlight detection + clip export | `routers/clips.py`, `services/highlights.py` | LLM-scored clippable moments -> ffmpeg clip cut. Horizontal only. |
| Content generation (recap, show notes, social posts, clip suggestions) | `routers/content.py`, `services/content_gen.py` | Ollama-first, OpenAI fallback. |
| YouTube metadata + SEO checklist + transcript grabber | `routers/youtube.py`, `metadata.py`, `services/youtube_service.py` | 3-tier transcript fetch. |
| NotebookLM export, Google Drive upload | `routers/export.py`, `services/gdrive_service.py` | |
| Batch + one-click Quick Process pipeline | `routers/batch.py`, `pipeline.py` | Full pipeline assemble->transcribe->correct->polish->content->captions->metadata. |
| Background task system with polling | `services/task_manager.py` | `GET /api/tasks/{id}`. |
| Extra AI tools (thumbnails, upscale, bg-removal, TTS, music-gen, video-gen, scene-detect) | `routers/ai_tools.py`, `services/*` | Tiered by CPU/GPU availability. |

What is broken / weak (from the audit, see PRs):

| Issue | Severity | Status |
|-------|----------|--------|
| Path traversal in `project_name` (create/delete/upload/read build raw `PROJECTS_DIR / name`, no containment) -> arbitrary dir create/delete/read | CRITICAL | Fixed in PR #2 |
| String-prefix containment checks (`str.startswith`) on download/serve routes -> sibling-prefix bypass | MEDIUM | Fixed in PR #2 |
| `Content-Disposition` header injection via `project_name` | MEDIUM | Fixed in PR #2 (validation closes it) |
| README "Private project" vs committed MIT LICENSE; no `.env.example`; `GROQ_API_KEY`/`HF_TOKEN`/`OPENAI_API_KEY` undocumented | LOW | Fixed in PR #3 |
| No tests, no CI, no CONTRIBUTING | LOW | Open (roadmap below) |
| `backend/requirements.txt` has unpinned deps (openai, rapidfuzz, gtts, google-*); dual requirements files | LOW | Open |
| Frontend: `setTimeout`/copy-state handlers without cleanup; one missing hook dep (`CaptionPanel`) | LOW | Open (React 19 no longer warns on unmounted setState; cosmetic) |

## Gap Analysis: from "upload editor" to "livestream distribution engine"

The pipeline today is `upload -> edit -> export file`. The goal pipeline is `pull livestream -> auto-clip vertical -> caption -> push to N platforms`. Three missing layers:

### 1. Ingest layer (missing entirely)
- Pull a finished livestream/VOD by URL: Restream recording, YouTube Live VOD, Twitch VOD, raw HLS/`.m3u8`, direct mp4.
- New router `routers/ingest.py` + `services/ingest_service.py` using `yt-dlp` (handles YouTube/Twitch/HLS/generic) to download into a project's `input/` - reuse the existing project structure so everything downstream just works.
- This is the single biggest unlock: it turns every ZAO livestream into a project automatically.

### 2. Vertical clipping layer (partial - horizontal clips only)
- Today `clips.py` cuts horizontal clips at highlight timestamps. "Best clipping for all" = vertical 9:16 clips ready for Farcaster/X/TikTok/Reels/Shorts.
- Add a reframe stage: 16:9 -> 9:16 via ffmpeg crop, with optional active-speaker tracking (diarization data already exists) so the crop follows whoever is talking.
- Burn the existing branded captions onto each vertical clip automatically (caption burn already exists; wire it into the clip export path).
- Output presets: square 1:1, vertical 9:16, original 16:9 - one highlight -> three aspect ratios.

### 3. Distribution layer (partial - Drive/NotebookLM only)
- Today export = files + Google Drive + NotebookLM. Missing: push clips to the surfaces ZAO actually distributes on.
- Generate the per-clip caption/title/hashtags (content_gen already drafts social posts - point it at each clip) and hand off to the existing ZAO distribution path: the `/socials` skill + Firefly for Farcaster/X. Keep the editor's job "produce the clip + the copy", let ZAO's posting stack publish.

## Proposed Roadmap (PR-sized)

| Phase | PR | Scope |
|-------|----|-------|
| 0 | #2, #3 (open) | Security + hygiene. Merge first. |
| 1 | ingest router | `yt-dlp` pull from URL -> project `input/`. Restream/YouTube/Twitch/HLS/mp4. Background task + progress. |
| 2 | vertical reframe | ffmpeg 16:9->9:16 crop service + aspect-ratio param on clip export. Speaker-tracked crop using diarization as a fast-follow. |
| 3 | auto-captioned clips | wire caption burn into clip export; one highlight -> 3 aspect ratios, captions burned. |
| 4 | per-clip copy | content_gen drafts title + caption + hashtags per clip; expose in ClipsPanel for one-click copy into `/socials`. |
| 5 | tests + CI | pytest smoke tests on project CRUD + ingest + clip; GitHub Actions lint+test on PR. Hardens it for multi-user. |

## Also See

- [Doc 836](../836-zaoos-repo-estate-census/) - repo estate census (where ZAOVideoEditor sits in the ZAO repo map)
- [Doc 778](../../) - ZABAL Games Magnetic build (Restream as default streaming surface)
- [Doc 741](../../) - LiveKit pick (real-time media infra, adjacent)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review + merge security PR #2 (path traversal) | @Zaal | PR | Before any shared/public deploy |
| Review + merge hygiene PR #3 (license + .env.example) | @Zaal | PR | Next pass |
| Confirm livestream sources to support (Restream + YouTube Live + Twitch?) | @Zaal | Decision | Before Phase 1 |
| Build Phase 1 ingest router (`yt-dlp` URL pull) | @Claude | PR | After #2/#3 merge |
| Build Phase 2 vertical reframe (9:16 clip export) | @Claude | PR | After Phase 1 |

## Sources

- [bettercallzaal/ZAOVideoEditor @ 8ec4a74](https://github.com/bettercallzaal/ZAOVideoEditor) [FULL - cloned and read backend/ (18 routers, 40 services), frontend/, README, requirements, configs; verified each capability claim against the code]
- [PR #2 - security: path-traversal hardening](https://github.com/bettercallzaal/ZAOVideoEditor/pull/2) [FULL - authored this session]
- [PR #3 - docs: license + env vars](https://github.com/bettercallzaal/ZAOVideoEditor/pull/3) [FULL - authored this session]
- yt-dlp (`github.com/yt-dlp/yt-dlp`) - supported extractors for YouTube/Twitch/generic HLS [PARTIAL - cited from prior knowledge as the Phase 1 ingest tool; not re-fetched this session]
- ZAO glossary (project `CLAUDE.md`) - Restream as ZABAL Games default streaming surface [FULL - in-repo]
