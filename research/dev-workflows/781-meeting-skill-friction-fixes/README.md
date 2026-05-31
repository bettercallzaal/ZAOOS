---
topic: dev-workflows
type: skill-iteration
status: shipped
last-validated: 2026-05-31
related-docs: "676, 673, 709, 739, 715"
tier: STANDARD
---

# 781 - /meeting skill friction fixes (4-run empirical pass)

> **Goal:** Record the four `/meeting` skill improvements made 2026-05-31 after running the skill four times back-to-back (docs 776, 777, 778, 780) and hitting the same friction every run. The skill files live in `~/.claude/skills/meeting/` (local-only, not git-tracked), so this doc is the institutional record of the change.

## Why now

Four meetings processed in one session - Duo Do (776), Telamon (777), Tyler/Magnetic (778), Adrian (780). The same papercuts recurred on nearly every run. Cross-checked the live friction against the documented backlog (doc 709 audit, doc 739 efficiency, doc 715 session) - the two sources agreed on the big ones. Zaal picked all four fixes.

## The four fixes

### 1. Whisper loop auto-trim (`scripts/trim-loops.sh`, NEW)

**Problem:** `whisper-large-v3-turbo` repeats a single line dozens-to-hundreds of times on long silences / music / outros (docs 709, 738, 739). Hit on all four runs - "Cheers" x100+ (Tyler), "I'm better after 5pm" x16 (Duo Do). Each was hand-trimmed.

**Fix:** New `trim-loops.sh` collapses any run of >=3 identical consecutive lines to one line + a `[repeated Nx, trimmed]` marker. Operates on the `.txt` only - never touches segment timestamps, so it is safe to run before diarization (the `.json` sidecar is left intact). Blank lines and legit 1-2x repeats pass through. `transcribe.sh` calls it automatically on both the mlx and VPS paths.

Chose post-process collapse over the doc-739 ffmpeg `silenceremove` preprocess because silence-stripping shifts timestamps and would break diarization alignment. The collapse is deterministic and quality-risk-free. (`silenceremove` remains a future option for an opt-in denoise flag.)

### 2. Skip diarization on 1-2 person calls (`SKILL.md` Step 3)

**Problem:** Diarization runs sherpa-onnx for minutes. On a 2-person call the labeled output is a nice-to-have (host vs guest is unambiguous from content). Zaal declined the wait twice in the session.

**Fix:** SKILL.md Step 3 now says to SKIP diarization on 1-2 person calls - detectable from the filename (`Tyler x zaal`, `AdrianxZaal`, `Duo do`, any `A x B` / `AxB`), attendee count, or a skim - and only run it for 3+ person calls (where action ownership gets ambiguous) or on explicit request.

### 3. Single-feed frame check (`SKILL.md` Phase 1/2 + `extract-frames.sh`)

**Problem:** All four recordings were single-feed captures of Zaal's own camera, so the only name tag ever visible is "Zaal Panthaki." Extracting + reading 21-24 frames per run gave zero attendee-identity value.

**Fix:** Default frame budget trimmed 24 -> 12 in `extract-frames.sh`. SKILL.md Phase 1/2 now instruct: `Read` frame 1 ONLY; if it is a single talking head (just Zaal, no slides / screenshare / participant gallery), STOP and resolve identities via content + a Phase 2.5 question. Read the rest only when frame 1 reveals slides, a screenshare, a whiteboard, or multiple named tiles.

### 4. Tracker creds soft-fallback (`scripts/append-actions.sh`)

**Problem:** `~/.zao/cowork-tracker.env` is not on the mac (creds live on Iman's VPS). The script hard-failed (exit 4), which would abort a `/meeting` run's tracker step. Hit on doc 778. Also, external owners (Tyler, Adrian) don't resolve against `team_members`.

**Fix:** When creds are missing, `append-actions.sh` now prints a paste-block of the actions + the `/coworkvps` route and exits 0 (best-effort, mirroring `bonfire-episode.sh`) instead of hard-failing. Added a warning that lists action owners not found in `team_members` (they insert with `owner_id=null`).

## Files touched

```
~/.claude/skills/meeting/scripts/trim-loops.sh      (NEW)
~/.claude/skills/meeting/scripts/transcribe.sh      (call trim-loops on both paths)
~/.claude/skills/meeting/scripts/extract-frames.sh  (MAX_FRAMES 24 -> 12)
~/.claude/skills/meeting/scripts/append-actions.sh  (soft-fallback + unresolved-owner warning)
~/.claude/skills/meeting/SKILL.md                   (Step 3 skip rule, single-feed frame check, scripts list)
```

All four scripts pass `bash -n`. `trim-loops.sh` verified on a synthetic loop (collapsed "Cheers" x5 -> 1 + marker, left "Yeah" x2 intact). `append-actions.sh` soft-fallback verified against `/tmp/extracted-778.json` (printed the paste-block, exit 0).

## Not done (deliberately)

- ffmpeg `silenceremove` preprocess (doc 739) - skipped to preserve diarization timestamp alignment; the post-process collapse covers the visible symptom.
- `/autoresearch` on the skill - wrong tool. autoresearch loops on a measurable metric; skill-engineering edits have no clean fitness signal to iterate against. These were targeted edits, not a search.
- Auto-detecting "single feed" from ffprobe - unreliable; the read-frame-1-first heuristic is simpler and robust.

## Known remaining backlog (from doc 709 / 715, unchanged)

- VPS Whisper fallback produces no `.json` sidecar -> no diarization on non-Mac path.
- Doc-numbering collisions tolerated (guard blocks new ones).
- Decision deferred: post `/meeting` frames to Bonfire as image episodes (after doc 680 read-side).
