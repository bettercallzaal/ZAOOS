#!/usr/bin/env bash
# transcribe.sh - transcribe a meeting recording (audio or video) to text.
#
# Local-first: mlx-whisper runs natively on Apple Silicon - fast, offline, no
# GPU server needed. Falls back to Whisper on Iman's VPS only when local tooling
# is absent (e.g. running from a non-Mac machine).
#
# Usage:   transcribe.sh <media-path> [--model <model>]
# Outputs: prints the local path to the .txt transcript on success. Also writes
#          a .json sidecar (same path stem) carrying segment timestamps - the
#          diarization step (diarize.sh) needs it to label speakers.
set -euo pipefail

SRC="${1:?missing media path}"
if [[ ! -f "$SRC" ]]; then
  echo "ERROR: media file not found: $SRC" >&2
  exit 2
fi

# Optional model override: --model <mlx-repo-or-whisper-model>
MODEL_OVERRIDE=""
if [[ "${2:-}" == "--model" && -n "${3:-}" ]]; then
  MODEL_OVERRIDE="$3"
fi

STAMP=$(date +%Y%m%d-%H%M%S)
LOCAL_OUT="/tmp/meeting-$STAMP.txt"

# ---------- Path A: local mlx-whisper (Apple Silicon, preferred) ----------
MLX_BIN="$(command -v mlx_whisper || true)"
if [[ -z "$MLX_BIN" && -x "$HOME/.local/bin/mlx_whisper" ]]; then
  MLX_BIN="$HOME/.local/bin/mlx_whisper"
fi

if [[ -n "$MLX_BIN" ]]; then
  MODEL="${MODEL_OVERRIDE:-${MLX_WHISPER_MODEL:-mlx-community/whisper-large-v3-turbo}}"
  OUTDIR="/tmp/meeting-$STAMP"
  mkdir -p "$OUTDIR"
  echo "[transcribe] local mlx-whisper - model $MODEL, input $(du -h "$SRC" | cut -f1)" >&2
  echo "[transcribe] first run for a model downloads it (~1.5GB); later runs are cached" >&2

  # mlx_whisper handles mp4/mov directly - ffmpeg strips the audio track.
  # --output-format all also emits transcript.json (segment timestamps),
  # which diarize.sh consumes to produce a speaker-labeled transcript.
  "$MLX_BIN" "$SRC" \
    --model "$MODEL" \
    --language en \
    --output-format all \
    --output-name transcript \
    --output-dir "$OUTDIR" >&2

  if [[ ! -f "$OUTDIR/transcript.txt" ]]; then
    echo "ERROR: mlx-whisper produced no transcript at $OUTDIR/transcript.txt" >&2
    exit 5
  fi
  cp "$OUTDIR/transcript.txt" "$LOCAL_OUT"
  # JSON sidecar (same stem) - segment timestamps for the diarization step.
  if [[ -f "$OUTDIR/transcript.json" ]]; then
    cp "$OUTDIR/transcript.json" "${LOCAL_OUT%.txt}.json"
  fi
  echo "[transcribe] done -> $LOCAL_OUT" >&2
  echo "$LOCAL_OUT"
  exit 0
fi

# ---------- Path B: VPS Whisper fallback ----------
echo "[transcribe] mlx-whisper not found locally - falling back to VPS Whisper" >&2
echo "[transcribe] (for the fast local path on Apple Silicon: uv tool install mlx-whisper)" >&2

VPS_HOST="${ZAOCOWORKING_VPS:-root@187.77.3.104}"
MODEL="${MODEL_OVERRIDE:-${WHISPER_MODEL:-base}}"

# Preflight - verify whisper + ffmpeg installed on VPS
PREFLIGHT=$(ssh -o ConnectTimeout=8 -o BatchMode=yes "$VPS_HOST" \
  'command -v whisper >/dev/null 2>&1 && command -v ffmpeg >/dev/null 2>&1 && echo OK || echo MISSING' 2>/dev/null || echo "SSH_FAIL")

if [[ "$PREFLIGHT" == "SSH_FAIL" ]]; then
  echo "ERROR: cannot SSH to $VPS_HOST. Check SSH key + host." >&2
  exit 3
fi

if [[ "$PREFLIGHT" != "OK" ]]; then
  cat >&2 <<EOF
ERROR: Whisper or ffmpeg not installed on $VPS_HOST.

One-time install (run from your mac):

  ssh $VPS_HOST 'apt-get update && apt-get install -y ffmpeg python3-pip && pip install openai-whisper'

Then re-run this script.
EOF
  exit 4
fi

BASENAME=$(basename "$SRC")
EXT="${BASENAME##*.}"
REMOTE_DIR="/tmp/meeting-$STAMP"
REMOTE_AUDIO="$REMOTE_DIR/input.$EXT"

echo "[transcribe] uploading $SRC ($(du -h "$SRC" | cut -f1)) to $VPS_HOST:$REMOTE_AUDIO" >&2

ssh "$VPS_HOST" "mkdir -p $REMOTE_DIR"
scp -q "$SRC" "$VPS_HOST:$REMOTE_AUDIO"

echo "[transcribe] running whisper --model $MODEL --language en (this can take minutes for long audio)" >&2

ssh "$VPS_HOST" "cd $REMOTE_DIR && whisper input.$EXT --model $MODEL --language en --output_format txt --output_dir . 2>&1 | tail -5" >&2

# Pull transcript back
scp -q "$VPS_HOST:$REMOTE_DIR/input.txt" "$LOCAL_OUT"

# Cleanup remote
ssh "$VPS_HOST" "rm -rf $REMOTE_DIR" || true

echo "[transcribe] done -> $LOCAL_OUT" >&2
echo "$LOCAL_OUT"
