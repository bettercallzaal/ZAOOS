#!/usr/bin/env bash
# znn-stream.sh - ZNN $0 MVP: loop a playlist of local videos 24/7 to YouTube Live
# via ffmpeg. The zero-cost lane (no Livepeer spend) chosen by Zaal; see
# research/infrastructure/1128 for the architecture and the Livepeer upgrade path.
#
#   znn-stream.sh [--dry-run]
#
# LOOP-SAFE: this script contains NO keys and starts NO stream by itself in a loop
# context. The YouTube stream key is read from the environment / a private env
# file at run time and NEVER written here. Zaal starts the stream by hand (see
# scripts/znn/README.md). --dry-run prints the exact ffmpeg command (key redacted)
# and validates inputs without streaming - use it to preview safely.
#
# Env (from $ZNN_ENV, default ~/.zao/private/znn.env - chmod 600, never committed):
#   YOUTUBE_STREAM_KEY   required to actually stream (absent => dry-run only)
#   ZNN_PLAYLIST         path to the concat playlist (default: scripts/znn/playlist.txt)
#   ZNN_RTMP_BASE        default rtmp://a.rtmp.youtube.com/live2
#   ZNN_VIDEO_BITRATE    default 4000k       (720p-friendly; see 1128)
#   ZNN_RESOLUTION       default 1280x720
#   ZNN_FPS              default 30
set -uo pipefail

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

ZNN_DIR="$(cd "$(dirname "$0")" && pwd)"
ZNN_ENV="${ZNN_ENV:-$HOME/.zao/private/znn.env}"
if [ -f "$ZNN_ENV" ]; then set -a; . "$ZNN_ENV"; set +a; fi

PLAYLIST="${ZNN_PLAYLIST:-$ZNN_DIR/playlist.txt}"
RTMP_BASE="${ZNN_RTMP_BASE:-rtmp://a.rtmp.youtube.com/live2}"
BITRATE="${ZNN_VIDEO_BITRATE:-4000k}"
RES="${ZNN_RESOLUTION:-1280x720}"
FPS="${ZNN_FPS:-30}"
KEY="${YOUTUBE_STREAM_KEY:-}"

# --- validation ---
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "znn: ffmpeg not installed. Install it first: sudo apt-get update && sudo apt-get install -y ffmpeg" >&2
  [ "$DRY_RUN" = 1 ] || exit 1
fi
if [ ! -f "$PLAYLIST" ]; then
  echo "znn: playlist not found at $PLAYLIST (see playlist.example.txt for the format)" >&2
  exit 1
fi
if ! grep -qE "^\s*file\s+" "$PLAYLIST"; then
  echo "znn: $PLAYLIST has no 'file ...' entries - it must be an ffmpeg concat playlist" >&2
  exit 1
fi

# GOP = 2s (YouTube wants a keyframe every <=4s); half-bitrate audio is plenty for talk/music.
GOP=$(( FPS * 2 ))
build_cmd() {
  local dest="$1"
  echo ffmpeg -re -stream_loop -1 -f concat -safe 0 -i "$PLAYLIST" \
    -s "$RES" -r "$FPS" \
    -c:v libx264 -preset veryfast -pix_fmt yuv420p -b:v "$BITRATE" -maxrate "$BITRATE" \
    -bufsize "$(( ${BITRATE%k} * 2 ))k" -g "$GOP" -keyint_min "$GOP" \
    -c:a aac -b:a 128k -ar 44100 \
    -f flv "$dest"
}

if [ "$DRY_RUN" = 1 ]; then
  echo "# ZNN dry-run - the command that WOULD run (stream key redacted):"
  build_cmd "$RTMP_BASE/<YOUTUBE_STREAM_KEY>"
  echo
  echo "# playlist: $PLAYLIST  ($(grep -cE "^\s*file\s+" "$PLAYLIST") entries)"
  echo "# stream key present: $([ -n "$KEY" ] && echo yes || echo 'no - set YOUTUBE_STREAM_KEY in '"$ZNN_ENV")"
  exit 0
fi

if [ -z "$KEY" ]; then
  echo "znn: YOUTUBE_STREAM_KEY not set (put it in $ZNN_ENV, chmod 600). Refusing to start." >&2
  exit 1
fi

# --- 24/7 resilience: restart ffmpeg if it dies, backing off a little ---
DEST="$RTMP_BASE/$KEY"
echo "znn: starting 24/7 loop of $PLAYLIST -> YouTube Live ($RES @ ${FPS}fps, $BITRATE)"
while true; do
  # shellcheck disable=SC2046
  $(build_cmd "$DEST") || echo "znn: ffmpeg exited ($?); restarting in 5s" >&2
  sleep 5
done
