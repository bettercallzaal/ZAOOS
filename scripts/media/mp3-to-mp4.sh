#!/usr/bin/env bash
# mp3-to-mp4.sh - turn an audio file into a YouTube-ready mp4.
#
#   mp3-to-mp4.sh <input.mp3> [output.mp4] [--image cover.jpg] [--title "..."] [--dry-run]
#
# Two modes:
#   --image FILE : hold that still image for the whole track (podcast/fireside cover)
#   (no image)   : render a live WAVEFORM over a solid ZAO-navy background ("random
#                  audio video" - the default)
#
# Feeds the content pipeline: firesides, Spaces, and customer-service loops become
# mp4s for YouTube / the ZNN 24/7 looper (scripts/znn). LOOP-SAFE: pure local
# ffmpeg, no keys, no upload - it writes a file; publishing is a separate (gated)
# step. --dry-run prints the exact ffmpeg command without running it.
set -uo pipefail

IN="" OUT="" IMAGE="" TITLE="" DRY_RUN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --image) IMAGE="${2:?--image needs a path}"; shift 2;;
    --title) TITLE="${2:?--title needs text}"; shift 2;;
    --dry-run) DRY_RUN=1; shift;;
    -*) echo "mp3-to-mp4: unknown flag $1" >&2; exit 2;;
    *) if [ -z "$IN" ]; then IN="$1"; elif [ -z "$OUT" ]; then OUT="$1"; fi; shift;;
  esac
done

[ -n "$IN" ] || { echo "usage: mp3-to-mp4.sh <input.mp3> [output.mp4] [--image cover.jpg] [--title ...] [--dry-run]" >&2; exit 2; }
[ "$DRY_RUN" = 1 ] || [ -f "$IN" ] || { echo "mp3-to-mp4: input not found: $IN" >&2; exit 1; }
[ -z "$IMAGE" ] || [ "$DRY_RUN" = 1 ] || [ -f "$IMAGE" ] || { echo "mp3-to-mp4: image not found: $IMAGE" >&2; exit 1; }
OUT="${OUT:-${IN%.*}.mp4}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "mp3-to-mp4: ffmpeg not installed. sudo apt-get install -y ffmpeg" >&2
  [ "$DRY_RUN" = 1 ] || exit 1
fi

NAVY="0x0a1628"   # ZAO brand navy
RES="1280x720"

# Optional title overlay (drawtext) - escaped for ffmpeg's filter parser.
draw=""
if [ -n "$TITLE" ]; then
  esc=${TITLE//:/\\:}; esc=${esc//\'/}
  draw=",drawtext=text='${esc}':fontcolor=0xf5a623:fontsize=42:x=(w-tw)/2:y=h-90"
fi

if [ -n "$IMAGE" ]; then
  # Still-image mode: loop the image for the audio's length.
  CMD=(ffmpeg -loop 1 -i "$IMAGE" -i "$IN"
       -c:v libx264 -tune stillimage -pix_fmt yuv420p -vf "scale=${RES/x/:}${draw}"
       -c:a aac -b:a 192k -shortest "$OUT")
else
  # Waveform mode: showwaves over a navy background, gold wave, optional title.
  CMD=(ffmpeg -f lavfi -i "color=c=${NAVY}:s=${RES}:r=30" -i "$IN"
       -filter_complex "[1:a]showwaves=s=${RES}:mode=cline:colors=0xf5a623[w];[0:v][w]overlay=format=auto${draw}"
       -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$OUT")
fi

if [ "$DRY_RUN" = 1 ]; then
  echo "# mp3-to-mp4 dry-run - the command that WOULD run:"
  printf '%q ' "${CMD[@]}"; echo
  echo "# mode: $([ -n "$IMAGE" ] && echo 'still image' || echo 'waveform')  ->  $OUT"
  exit 0
fi

echo "mp3-to-mp4: $IN -> $OUT ($([ -n "$IMAGE" ] && echo image || echo waveform) mode)"
"${CMD[@]}"
echo "mp3-to-mp4: wrote $OUT"
