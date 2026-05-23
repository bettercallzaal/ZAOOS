#!/usr/bin/env bash
# diarize.sh - speaker diarization for a meeting recording, via sherpa-onnx.
#
# Whisper (mlx or VPS) emits one unlabeled block - no speaker turns. This adds
# them: who spoke when. High value on 3+ person calls where owner attribution
# from content alone is unreliable; low value but harmless on a 1-2 person call.
#
# Fully local + offline. sherpa-onnx is pulled on demand via `uv run` (cached
# after first use); the two ONNX models download once to
# ~/.zao/diarization-models/ - no Hugging Face token needed (doc 709).
#
# Usage:   diarize.sh <media-path> [whisper-json]
#   no whisper-json  -> prints a TSV of [start, end, speaker] segments
#   with whisper-json -> prints a speaker-labeled transcript (.txt)
# Outputs: result path on stdout; speaker count + progress on stderr.
set -uo pipefail

SRC="${1:?missing media path}"
WHISPER_JSON="${2:-}"
if [[ ! -f "$SRC" ]]; then
  echo "ERROR: media file not found: $SRC" >&2
  exit 2
fi

command -v ffmpeg >/dev/null 2>&1 || { echo "ERROR: ffmpeg not installed (brew install ffmpeg)" >&2; exit 3; }

UV_BIN="$(command -v uv || true)"
if [[ -z "$UV_BIN" && -x "$HOME/.local/bin/uv" ]]; then
  UV_BIN="$HOME/.local/bin/uv"
fi
if [[ -z "$UV_BIN" ]]; then
  echo "ERROR: uv not installed - diarization needs it." >&2
  echo "       install: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  exit 3
fi

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIARIZE_PY="$SKILL_DIR/scripts/diarize.py"
if [[ ! -f "$DIARIZE_PY" ]]; then
  echo "ERROR: diarize.py missing next to this script" >&2
  exit 3
fi

# ---------- models: download once, then cached ----------
MODEL_DIR="${ZAO_DIARIZATION_MODELS:-$HOME/.zao/diarization-models}"
mkdir -p "$MODEL_DIR"
SEG_MODEL="$MODEL_DIR/sherpa-onnx-pyannote-segmentation-3-0/model.onnx"
EMB_MODEL="$MODEL_DIR/3dspeaker_speech_campplus_sv_zh_en_16k-common_advanced.onnx"

SEG_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-segmentation-models/sherpa-onnx-pyannote-segmentation-3-0.tar.bz2"
EMB_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recongition-models/3dspeaker_speech_campplus_sv_zh_en_16k-common_advanced.onnx"

if [[ ! -f "$SEG_MODEL" ]]; then
  echo "[diarize] downloading segmentation model (~7MB, one-time)" >&2
  curl -fsSL "$SEG_URL" -o "$MODEL_DIR/seg.tar.bz2" \
    || { echo "ERROR: segmentation model download failed" >&2; exit 4; }
  tar -xjf "$MODEL_DIR/seg.tar.bz2" -C "$MODEL_DIR" && rm -f "$MODEL_DIR/seg.tar.bz2"
fi
if [[ ! -f "$EMB_MODEL" ]]; then
  echo "[diarize] downloading speaker-embedding model (~28MB, one-time)" >&2
  curl -fsSL "$EMB_URL" -o "$EMB_MODEL" \
    || { echo "ERROR: embedding model download failed" >&2; exit 4; }
fi
if [[ ! -f "$SEG_MODEL" || ! -f "$EMB_MODEL" ]]; then
  echo "ERROR: diarization models missing after download attempt" >&2
  exit 4
fi

# ---------- extract 16kHz mono wav (sherpa needs exactly this) ----------
STAMP=$(date +%Y%m%d-%H%M%S)
WAV="/tmp/meeting-diar-$STAMP.wav"
echo "[diarize] extracting 16kHz mono wav from $(basename "$SRC")" >&2
ffmpeg -nostdin -v error -y -i "$SRC" -ac 1 -ar 16000 -c:a pcm_s16le "$WAV" </dev/null
if [[ ! -f "$WAV" ]]; then
  echo "ERROR: ffmpeg produced no wav" >&2
  exit 5
fi

# ---------- run diarization ----------
SEGS_TSV="/tmp/meeting-diar-$STAMP.tsv"
echo "[diarize] running sherpa-onnx diarization (a few minutes for a long call)" >&2
NUM_SPK=$("$UV_BIN" run --quiet --with sherpa-onnx --with numpy --python 3.12 python "$DIARIZE_PY" diarize \
  --wav "$WAV" --seg "$SEG_MODEL" --emb "$EMB_MODEL" --out "$SEGS_TSV" \
  --num-speakers "${ZAO_DIARIZATION_NUM_SPEAKERS:-0}")
DIAR_RC=$?
rm -f "$WAV"
if [[ $DIAR_RC -ne 0 || ! -s "$SEGS_TSV" ]]; then
  echo "ERROR: diarization failed (rc=$DIAR_RC)" >&2
  exit 6
fi
echo "[diarize] detected ${NUM_SPK:-?} speaker(s)" >&2

# ---------- merge with whisper transcript, if one was given ----------
if [[ -n "$WHISPER_JSON" && -f "$WHISPER_JSON" ]]; then
  LABELED="/tmp/meeting-labeled-$STAMP.txt"
  python3 "$DIARIZE_PY" merge \
    --whisper-json "$WHISPER_JSON" --segments "$SEGS_TSV" --out "$LABELED" >&2
  if [[ -s "$LABELED" ]]; then
    echo "$LABELED"
    exit 0
  fi
  echo "[diarize] merge produced nothing - returning raw segments instead" >&2
fi

echo "$SEGS_TSV"
