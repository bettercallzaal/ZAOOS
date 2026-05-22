---
topic: events
type: guide
status: research-complete
last-validated: 2026-05-22
related-docs: "709, 711, 713, 714"
original-query: "recap of all work completed today 2026-05-22: meeting skill diarization build, Tyler meeting capture, drift fix"
tier: QUICK
---

# 715 - Session recap: /meeting skill upgrade + diarization (2026-05-22)

> **Goal:** Record the 2026-05-22 work session - the `/meeting` skill went from audio-only post-hoc transcription to a full local capture pipeline (transcription + video frames + speaker diarization), two meetings were captured, and a long-standing skill-drift bug was fixed.

## Key Outcomes

| # | Outcome | Where | State |
|---|---------|-------|-------|
| 1 | `/meeting` transcribes locally on Apple Silicon (mlx-whisper) + extracts video frames | PR #617 | merged |
| 2 | Doc 709 - meeting transcription pipeline audit | PR #617 | merged |
| 3 | Doc 711 - Arthur intro call recap (WaveWarZ Base) | PR #619 | merged |
| 4 | sherpa-onnx speaker diarization added as Step 3 of the skill | PR #622 | open |
| 5 | `sync-meeting-skill.sh` - fixes the two-copies skill drift | PR #622 | open |
| 6 | Doc 714 - Tyler x Zaal recap (ZABAL Games + road to ZAOstock), 9 actions to Supabase | PR #624 | open |

## What shipped

### Transcription pipeline (PR #617, merged earlier today)

`/meeting` was VPS-only for transcription (doc 673). It is now local-first: `mlx-whisper` with `whisper-large-v3-turbo` runs natively on Zaal's Apple Silicon mac - fast, offline, no upload, no Hugging Face token. The VPS remains a fallback for non-Mac machines. `extract-frames.sh` pulls scene-change + interval still frames from video calls so the extraction passes get visual context (slides, screenshares, name tags). Audited in doc 709, which also confirmed ZAOscribe (doc 674) is a separate planned Discord bot, not this skill.

### Speaker diarization (PR #622, open)

New Step 3: `diarize.sh` + `diarize.py` run `sherpa-onnx` offline speaker diarization, fully local, no Hugging Face token, no GPU. Two ONNX models (segmentation 7MB + 3dspeaker embedding 28MB) download once to `~/.zao/diarization-models/`. The diarization segments merge with the whisper transcript into a `[Speaker N]`-labeled transcript. `transcribe.sh` now emits a `.json` sidecar (segment timestamps) the merge needs.

Three bugs found and fixed during the build:
1. `sherpa_onnx` 1.13.2 has no top-level `read_wave` - replaced with a stdlib `wave` reader.
2. `uv run --python 3.13` mis-resolved numpy to a wheelless 1.26.4 build - the diarize env is pinned to python 3.12.
3. Auto-clustering over-clusters (8 speakers detected on a 2-person call). `SKILL.md` documents passing the known count via `ZAO_DIARIZATION_NUM_SPEAKERS` - forcing the count gave a clean 2-speaker result.

Diarization is mechanically verified (runs end to end on a real recording) but full-call quality validation is pending - see Open Items.

### Drift fix (PR #622, open)

The `/meeting` skill lives in two copies - the repo copy (`.claude/skills/meeting/`) and the copy Claude Code runs (`~/.claude/skills/meeting/`). They had drifted: a prior commit (60f95828) named a `sync-meeting-skill.sh` that was never actually committed, and autoresearch-iteration content (recap-template Verify section, `bonfire-episode.sh` key sourcing) only existed in the user copy. `sync-meeting-skill.sh` now does REPO -> USER sync with a `--check` drift detector, and the lost content is restored.

### Meetings captured

- **Doc 711 - Arthur intro call** (2026-05-19, WaveWarZ Base agentic build). Merged.
- **Doc 714 - Tyler x Zaal** (2026-05-22, ZABAL Games + road to ZAOstock). 6 decisions, 9 actions. The 9 actions were written directly into the unified Supabase cowork tracker (`legacy_source=meeting:tyler-zabal-may22`) - the first meeting whose actions landed in the live tracker rather than the dead `actions.json`.

## Open Items

- **Mac disk is critically full** - 460GB drive, was at 148MB free (100%). This OOM-killed full-call diarization. ~500MB of stale `/tmp` build clones were cleared to continue; Zaal needs to free real disk space.
- **Diarization full-call validation pending** - blocked by the disk-full OOM. Needs a re-run once space is freed; default clustering for the count-unknown case still needs tuning.
- **`/meeting` still writes to a dead tracker by default** - `append-actions.sh` targets the retired `actions.json`. Doc 713 specifies re-pointing it to Supabase; doc 714's actions were inserted manually as a stopgap.
- **Tracker should ping the owner when a to-do is assigned** - Zaal's request this session. Belongs to the cowork-bot proactive-DM build, not the `/meeting` skill.

## Also See

- [Doc 709](../../dev-workflows/709-meeting-transcription-pipeline-audit/) - transcription pipeline audit
- [Doc 711](../711-arthur-wavewarz-base-call-may19/) - Arthur meeting recap
- [Doc 713](../../dev-workflows/713-zao-ops-meeting-tracker-crm-bonfire/) - combined meeting/tracker/CRM/Bonfire system
- [Doc 714](../714-tyler-zabal-zaostock-may22/) - Tyler meeting recap

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Free Mac disk space (drive at ~100%) | @Zaal | Manual | Today |
| Re-run + validate full-call diarization once disk is clear | @Zaal | Test | After disk freed |
| Merge PR #622 (diarization) and PR #624 (doc 714) | @Zaal | PR review | Next session |
| Re-point `/meeting` action write from actions.json to Supabase | @Zaal | Build | Doc 713 step 1 |
| Tune diarization default clustering for count-unknown calls | @Zaal | Build | After PR #622 merge |

## Sources

- [PR #617 - mlx-whisper transcription + doc 709](https://github.com/bettercallzaal/ZAOOS/pull/617) [FULL - merged]
- [PR #619 - doc 711 Arthur recap](https://github.com/bettercallzaal/ZAOOS/pull/619) [FULL - merged]
- [PR #622 - sherpa-onnx diarization + sync script](https://github.com/bettercallzaal/ZAOOS/pull/622) [FULL - open]
- [PR #624 - doc 714 Tyler recap](https://github.com/bettercallzaal/ZAOOS/pull/624) [FULL - open]
- [sherpa-onnx (k2-fsa)](https://github.com/k2-fsa/sherpa-onnx) [FULL - diarization engine + ONNX model releases]
