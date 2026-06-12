---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-06-12
superseded-by:
related-docs: 837, 836, 778, 814, 759, 734
original-query: "ZAOVideoEditor (the Recordings Studio we just built) - position it in the overall ZAO ecosystem, define next steps + roadmap, and surface what else it can do to help ZAO. Where does this tool fit alongside ZAOOS, COC Concertz, ZABAL Gamez, ZAOstock, the Hermes/ZOE agent stack, Bonfire knowledge graph, and the recordings/distribution workflow? What should we build next and how does it plug into ZAO's distribution + memory."
tier: STANDARD
---

# 848 - ZAO Video Editor: Ecosystem Fit + Build-Out Roadmap

> **Goal:** Position the Recordings Studio (github.com/bettercallzaal/ZAOVideoEditor) inside the ZAO ecosystem, and decide what to build next so it becomes ZAO's content-distribution + memory engine, not a standalone tool. Companion to the founding spec, [Doc 837](../837-zao-video-editor-livestream-distribution/).

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | The Studio is **ZAO's content-distribution engine** - the "record once, distribute everywhere" middle layer. Treat it as core ecosystem infrastructure, not a side project. | Every ZAO surface produces recordings (ZABAL Gamez workshops, COC Concertz, ZAOstock, Spaces, X Spaces). Nothing today turns them into clips + transcripts + posts + pages at scale. The Studio is the missing middle. |
| 2 | **Build Bonfire memory ingest NEXT (highest leverage).** Every processed recording posts a recap + decisions episode to the ZABAL Bonfire knowledge graph. | This turns each workshop/concert into queryable institutional memory - directly serves Zaal's stated goal of "AI-queryable ZABAL Games transcripts" ([[project_zaal_builder_series_devcon]], Doc 827). The transcript already exists; the episode is one POST. |
| 3 | **Wire the agent stack to the `/api/studio/full` endpoint.** ZOE/Hermes trigger the pipeline; Zaal approves drafts. | The automation hook already exists (PR #16, one-call pipeline). Hermes-pattern (claude CLI, zero cost) already powers the Studio's LLM steps, so the agent stack and the Studio share the same brain. This is how it becomes hands-off. |
| 4 | **Unify the glossary** - the Studio's `transcript-corrections.json` and zabalgames' canonical file become one shared ZAO brand asset. | Brand casing (WaveWarZ, ZABAL Gamez, Stilo World) must be identical everywhere. The "teach-the-glossary" UI (PR #15) makes every editor improve the shared asset. |
| 5 | **It graduated already** - own repo, MIT, `./run.sh` portable. Keep it standalone (clone, no deps), per the Monorepo-as-Lab graduation rule. | Matches the ZAO graduation pattern ([[project_zaoos_monorepo_as_lab]]). The Studio is public-ready and attracts new users (any creator can run it). |

## What exists today (verified - 16 PRs, built 2026-06-09 to 06-12)

The Studio is a working FastAPI + vanilla-JS local app (`./run.sh`), and a Next.js+Supabase team UI scaffold for later. Pipeline:

recording or link in -> fast transcript (brand-corrected, teachable glossary) -> in-page editor (video synced to an editable transcript, delete-a-line cuts the video, visible cut toggles, speaker rename) -> LLM-ranked vertical clips with burned captions + per-clip copy -> key moments (recap/chapters/quotes) -> drafted Farcaster/X posts -> one-click publish (Farcaster/X/YouTube) -> recordings library.

| Capability | Where | Status |
|-----------|-------|--------|
| Transcribe (fast default, Groq auto, large-v3 optional) | `backend/services/recordings_pipeline.py` | done. **4.4 min for a 17-min recording** (3.9x realtime) on the base model; was ~3 hours on large-v3 |
| Brand glossary + teach-a-term | `backend/services/glossary.py` | done |
| Editor (text-edits-video, cuts, speakers, fonts) | `backend/static/studio.html` | done |
| Non-destructive cut render | `backend/services/render_service.py` | done |
| LLM-ranked vertical clips + captions + copy | `backend/services/recordings_export.py`, `clip_service.py` | done |
| Key moments (recap/chapters/quotes) | `backend/routers/studio.py` `/insights` | done |
| Social drafts (Farcaster/X) | `backend/services/social_gen.py` | done |
| Publish (Farcaster/X/YouTube) | `backend/services/publishers.py` | done, needs Zaal's creds to fire |
| Recordings library | `/api/studio/projects` | done |
| One-call automation API | `/api/studio/full` | done |
| Hermes (claude CLI, zero cost) for all LLM steps | `backend/services/hermes.py` | done |

Stats: 16 merged PRs, 111 tests, the founding roadmap is Doc 837.

## Where it fits in the ecosystem

```
INPUTS (recordings)                 ENGINE                         OUTPUTS / DISTRIBUTION + MEMORY
ZABAL Gamez workshops (Restream,    ┌──────────────────────┐       Farcaster + X  (publishers.py + Firefly + /socials skill)
  Craig multitrack)        ───────▶ │  Recordings Studio   │ ────▶ YouTube        (publishers.py)
COC Concertz recordings    ───────▶ │  transcribe·correct· │ ────▶ /recordings/N  (zabalgames pages + recaps)
ZAOstock content           ───────▶ │  edit·cut·clip·      │ ────▶ Bonfire        (knowledge graph memory)  ◀── BUILD NEXT
ZAO Spaces / X Spaces      ───────▶ │  caption·insights·   │ ────▶ ZAO NEXUS / newsletter
  (SongJam audio)                   │  social·publish      │
Twitch / YouTube Live VOD  ───────▶ └──────────────────────┘
                                         ▲        │
                          ZOE / Hermes ──┘        └──▶ ZOE / Hermes (drafts for Zaal approval)
                          trigger via /api/studio/full
```

- **vs the `/meeting` skill:** `/meeting` does decisions/action-items extraction for calls (audio, lightweight). The Studio is the heavier video version (clips, captions, publish). They should share the Bonfire-episode format so memory is uniform.
- **vs the `/socials` skill + Firefly:** `/socials` drafts posts for any content; the Studio now drafts + posts for recordings specifically. The Studio should hand off to the existing distribution path, not duplicate it.
- **vs ZABAL Gamez:** the Studio is the engine that turns every workshop into the AI-queryable transcript library Zaal wants (Doc 827). This is the single most aligned use.
- **vs the agent stack (ZOE/Hermes, Doc 759/734):** they share the Hermes/claude-CLI brain. The Studio is a tool ZOE can call; ZOE is the orchestrator that decides when.

## What else it can do (build-out suggestions, ranked)

1. **Bonfire memory ingest** - per recording, POST a recap + decisions episode to `zabal.bonfires.ai`. Reuse the `/bonfire` skill + the PII-scan pattern (Doc 734). Turns the archive into recall. (Highest leverage.)
2. **Agent-triggered pipeline** - ZOE watches the shared Drive (info@thezao), fires `/api/studio/full`, posts drafts to Zaal in Telegram for one-tap approval. Removes the human from ingest entirely.
3. **zabalgames publish PR** - auto-open the `/recordings/N` page + recap + transcript PR (stage H of Doc 837). Needs repo push access.
4. **Cross-recording search** - "what did we say about WaveWarZ tokenomics across all workshops" over the transcript library (vector search or Bonfire delve, Doc 740).
5. **ZABAL Gamez transcript library** - batch-process the existing workshop backlog into the public, searchable, brand-correct corpus (the Doc 827 vision).
6. **COC Concertz / WaveWarZ clip modes** - concert-recording clip presets; stats-forward WaveWarZ arena captions.
7. **Animated caption upgrade** - the Hormozi/Opus-style word-by-word style from the caption spec, for higher clip engagement.

## Build-out roadmap

| Phase | What | Unblocks |
|-------|------|----------|
| A | **Bonfire ingest** - recording -> recap/decisions episode | Memory: every recording becomes recall |
| B | **Agent trigger + Drive watcher** - ZOE fires `/api/studio/full` on new Drive files | Hands-off operation |
| C | **zabalgames publish PR** - auto `/recordings/N` | Public pages without manual steps (needs repo access) |
| D | **Cross-recording search + team UI live** (Supabase/Vercel) | Multi-editor + queryable corpus |
| E | **Backlog batch + ZABAL Gamez corpus** | The AI-queryable transcript library |

## Also See

- [Doc 837](../837-zao-video-editor-livestream-distribution/) - the founding spec + the 4-phase build
- [Doc 836](../836-zaoos-repo-estate-census/) - where ZAOVideoEditor sits in the repo estate
- [Doc 778](../../) - ZABAL Gamez build (the primary input source)
- [Doc 759](../../) - ZOE orchestrator (the agent that should trigger the Studio)
- [Doc 734](../../) - Bonfire memory adapter + PII scan (the pattern for memory ingest)
- [[project_zaal_builder_series_devcon]] - the AI-queryable ZABAL Games transcripts goal

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build Bonfire ingest: recording -> recap/decisions episode | @Claude | PR (ZAOVideoEditor) | Next session |
| Wire ZOE to call /api/studio/full + Drive watcher | @Claude | PR (bot + ZAOVideoEditor) | After Bonfire ingest |
| Unify glossary with zabalgames transcript-corrections.json | @Zaal | Decision + PR | Next pass |
| Refresh the ZAOVideoEditor README to reflect Studio v5 | @Claude | PR (ZAOVideoEditor) | Now (doc-only) |
| Confirm zabalgames push access for the /recordings publish PR | @Zaal | Decision | Before Phase C |

## Sources

- [github.com/bettercallzaal/ZAOVideoEditor](https://github.com/bettercallzaal/ZAOVideoEditor) - the repo, 16 PRs read/authored this build [FULL - built and verified end-to-end this session]
- [Doc 837 - founding spec](../837-zao-video-editor-livestream-distribution/) [FULL - in-repo]
- ZAO ecosystem context - project `CLAUDE.md` (Primary Surfaces, Monorepo-as-Lab, brand glossary) [FULL - in-repo]
- Memory: `project_zaal_builder_series_devcon`, `project_zao_video_editor`, `project_zoe_orchestrator_locked` [FULL - in-repo]
- [Descript](https://www.descript.com/) - the category incumbent the Studio replaces for ZAO [PARTIAL - cited as category reference from prior knowledge, not re-fetched this session]
- [Opus Clip](https://www.opus.pro/) - the auto-clip category reference (LLM-ranked highlights + animated captions) [PARTIAL - cited as category reference from prior knowledge, not re-fetched this session]
