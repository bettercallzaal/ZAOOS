#!/usr/bin/env bash
# transcribe.sh - SCP audio file to Iman VPS, run Whisper, SCP transcript back.
# Usage: transcribe.sh <local-audio-path> [--model base|small|medium]
# Outputs: prints local path to .txt transcript on success.

set -euo pipefail

VPS_HOST="${ZAOCOWORKING_VPS:-root@187.77.3.104}"
MODEL="${WHISPER_MODEL:-base}"
SRC="${1:?missing audio path}"

if [[ ! -f "$SRC" ]]; then
  echo "ERROR: audio file not found: $SRC" >&2
  exit 2
fi

# Parse optional model flag
if [[ "${2:-}" == "--model" && -n "${3:-}" ]]; then
  MODEL="$3"
fi

# Preflight - verify whisper installed on VPS
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
STAMP=$(date +%Y%m%d-%H%M%S)
REMOTE_DIR="/tmp/meeting-$STAMP"
REMOTE_AUDIO="$REMOTE_DIR/input.$EXT"
LOCAL_OUT="/tmp/meeting-$STAMP.txt"

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
