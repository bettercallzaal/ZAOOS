#!/usr/bin/env bash
# extract-frames.sh - pull representative still frames from a meeting video.
#
# Scene-change detection catches slide flips and screenshare switches; a
# fixed-interval fallback covers static talking-head calls. Frames give the
# extraction passes visual context the audio cannot: shared slides, screenshares,
# whiteboards, and the call UI's participant name tags.
#
# Usage:  extract-frames.sh <video-path>
# Prints: the output directory path on success,
#         or the literal "NO_VIDEO" for audio-only input (caller skips frames).
set -euo pipefail

SRC="${1:?missing video path}"
if [[ ! -f "$SRC" ]]; then
  echo "ERROR: file not found: $SRC" >&2
  exit 2
fi

command -v ffmpeg  >/dev/null 2>&1 || { echo "ERROR: ffmpeg not installed (brew install ffmpeg)" >&2; exit 3; }
command -v ffprobe >/dev/null 2>&1 || { echo "ERROR: ffprobe not installed (brew install ffmpeg)" >&2; exit 3; }

# Audio-only input (m4a/mp3/wav/opus) has no video stream - nothing to extract.
HAS_VIDEO=$(ffprobe -v error -select_streams v -show_entries stream=codec_type \
  -of csv=p=0 "$SRC" 2>/dev/null | head -1)
if [[ "$HAS_VIDEO" != "video" ]]; then
  echo "NO_VIDEO"
  exit 0
fi

MAX_FRAMES="${MEETING_MAX_FRAMES:-24}"
SCENE_THRESHOLD="${MEETING_SCENE_THRESHOLD:-0.30}"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="/tmp/meeting-frames-$STAMP"
mkdir -p "$OUT"

echo "[extract-frames] scanning $SRC for scene changes (threshold $SCENE_THRESHOLD)" >&2

# Pass 1 - scene-change detection. Catches slide flips + screenshare switches.
# Frames scaled to 960px wide - cheap enough for a vision pass, legible enough
# to read slide text. -fps_mode vfr stops ffmpeg padding with duplicate frames.
ffmpeg -nostdin -loglevel error -i "$SRC" \
  -vf "select='gt(scene,${SCENE_THRESHOLD})',scale=960:-2" -fps_mode vfr -q:v 4 \
  "$OUT/scene-%04d.jpg" 2>/dev/null || true

COUNT=$(find "$OUT" -maxdepth 1 -name 'scene-*.jpg' | wc -l | tr -d ' ')

# Pass 2 - few/no scene cuts (static talking-heads call): sample on a timer so
# the extraction still sees the call UI - name tags, who joined or left.
if [[ "$COUNT" -lt 4 ]]; then
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC" 2>/dev/null | cut -d. -f1)
  DUR=${DUR:-600}
  STEP=$(( DUR / 12 )); [[ "$STEP" -lt 5 ]] && STEP=30
  echo "[extract-frames] only $COUNT scene cuts - adding interval frames every ${STEP}s" >&2
  ffmpeg -nostdin -loglevel error -i "$SRC" \
    -vf "fps=1/${STEP},scale=960:-2" -q:v 4 \
    "$OUT/interval-%04d.jpg" 2>/dev/null || true
fi

# Cap total frames - keep an evenly-spaced subset if over budget. A vision pass
# over 100 near-identical frames is wasteful; MAX_FRAMES is the budget.
TOTAL=$(find "$OUT" -maxdepth 1 -name '*.jpg' | wc -l | tr -d ' ')
if [[ "$TOTAL" -gt "$MAX_FRAMES" ]]; then
  KEEP_EVERY=$(( (TOTAL + MAX_FRAMES - 1) / MAX_FRAMES ))
  echo "[extract-frames] $TOTAL frames over budget $MAX_FRAMES - keeping 1 in $KEEP_EVERY" >&2
  i=0
  find "$OUT" -maxdepth 1 -name '*.jpg' | sort | while IFS= read -r f; do
    if (( i % KEEP_EVERY != 0 )); then rm -f "$f"; fi
    i=$((i+1))
  done
fi

FINAL=$(find "$OUT" -maxdepth 1 -name '*.jpg' | wc -l | tr -d ' ')
if [[ "$FINAL" -eq 0 ]]; then
  echo "ERROR: no frames extracted" >&2
  exit 4
fi
echo "[extract-frames] $FINAL frames -> $OUT" >&2
echo "$OUT"
