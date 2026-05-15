#!/usr/bin/env bash
# zao-transcribe.sh - podcast / audio URL -> clean transcript markdown.
#
# Resolves a Spotify episode URL, a podcast RSS feed URL, or a direct audio
# URL to an audio file, transcribes it locally with whisper-ctranslate2
# (faster-whisper - no API cost, no sudo), and writes a markdown transcript.
#
# Usage:
#   zao-transcribe.sh <url> [model]
#     url   - open.spotify.com/episode/... | podcast RSS feed URL | direct audio URL
#     model - whisper model (default base.en; tiny.en = faster, small.en = better)
#
# Output: ~/.zao/transcripts/<slug>-<date>.md  (path also echoed to stdout)
#
# Deps (userspace, no sudo): uv + whisper-ctranslate2
#   curl -LsSf https://astral.sh/uv/install.sh | sh
#   uv tool install whisper-ctranslate2
#
# Design notes:
#   - NO `set -e`. v1 died silently because `set -e` + `$(python...)` kills the
#     script before the error-log line runs. Every failure path here calls die()
#     which LOGS then exits with a code.
#   - Spotify resolution searches iTunes by SHOW name (from og:description),
#     not the episode title, and validates the resolved feed actually matches.
#   - RSS episode matching requires a real word-overlap score, else it aborts
#     rather than downloading a random unrelated episode.
set -uo pipefail

URL_IN="${1:?usage: zao-transcribe.sh <url> [model]}"
URL="$URL_IN"
MODEL="${2:-base.en}"
OUT_DIR="$HOME/.zao/transcripts"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
mkdir -p "$OUT_DIR"
export PATH="$HOME/.local/bin:$PATH"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

log() { echo "[zao-transcribe] $*" >&2; }
die() { echo "[zao-transcribe] ERROR: $*" >&2; exit "${2:-1}"; }

AUDIO_URL=""
TITLE=""
SHOW=""

# --- 1. Spotify episode -> show name -> RSS feed ------------------------------
if [[ "$URL" =~ open\.spotify\.com/episode/ ]]; then
  log "Spotify episode - extracting metadata"
  PAGE="$(curl -sL -A "$UA" "$URL")" || die "could not fetch the Spotify page"
  TITLE="$(printf '%s' "$PAGE" | grep -oE '<meta property="og:title" content="[^"]*"' \
    | head -1 | sed -E 's/.*content="([^"]*)".*/\1/')"
  # og:description format: "<Show Name> - subtitle · Episode" -> take part before " · "
  SHOW="$(printf '%s' "$PAGE" | grep -oE '<meta property="og:description" content="[^"]*"' \
    | head -1 | sed -E 's/.*content="([^"]*)".*/\1/' | sed -E 's/ ·.*$//')"
  [[ -z "$TITLE" ]] && die "could not extract the episode title from the Spotify page"
  [[ -z "$SHOW"  ]] && die "could not extract the show name. Pass the RSS feed URL directly." 2
  log "episode: $TITLE"
  log "show:    $SHOW"

  # iTunes Search API - search by SHOW name, validate the match by word overlap.
  TERM="$(printf '%s' "$SHOW" | tr -cd '[:alnum:] ' | tr -s ' ' '+' | cut -c1-90)"
  RESOLVED="$(curl -sL "https://itunes.apple.com/search?media=podcast&entity=podcast&limit=10&term=${TERM}" \
    | python3 - "$SHOW" <<'PY'
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print("|"); sys.exit(0)
want = set(sys.argv[1].lower().split())
best_url, best_name, best_score = "", "", -1
for r in d.get("results", []):
    name = (r.get("collectionName") or "").lower()
    score = len(want & set(name.split()))
    if score > best_score and r.get("feedUrl"):
        best_url, best_name, best_score = r["feedUrl"], r.get("collectionName", ""), score
# require at least one shared word with the show name, else treat as no match
if best_score < 1:
    print("|"); sys.exit(0)
print(f"{best_url}|{best_name}")
PY
)"
  FEED="${RESOLVED%%|*}"
  FEED_NAME="${RESOLVED#*|}"
  [[ -z "$FEED" ]] && die "iTunes Search found no podcast matching show \"$SHOW\". Pass the RSS feed URL directly." 2
  log "resolved feed: ${FEED_NAME:-<unnamed>}"
  log "feed URL:      $FEED"
  URL="$FEED"
fi

# --- 2. direct audio URL? -----------------------------------------------------
if [[ "$URL" =~ \.(mp3|m4a|wav|aac|ogg|flac)(\?|$) ]]; then
  AUDIO_URL="$URL"
  TITLE="${TITLE:-$(basename "${URL%%\?*}")}"
else
  # --- 3. RSS feed -> match the episode enclosure ----------------------------
  log "parsing RSS feed"
  RSS="$(curl -sL -A "$UA" "$URL")" || die "could not fetch the RSS feed: $URL"
  [[ -z "$RSS" ]] && die "RSS feed was empty: $URL" 2
  # python prints "url|score" and never throws (catches all, prints sentinel).
  MATCH="$(printf '%s' "$RSS" | python3 - "${TITLE:-}" <<'PY'
import sys, re, html
try:
    rss = sys.stdin.read()
    want = set(sys.argv[1].lower().split()) if len(sys.argv) > 1 and sys.argv[1] else set()
    best_url, best_score = "", -1
    for it in re.findall(r'<item\b.*?</item>', rss, re.S):
        e = re.search(r'<enclosure[^>]*\burl="([^"]+)"', it)
        if not e:
            continue
        t = re.search(r'<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>', it, re.S)
        title = html.unescape(t.group(1)).strip().lower() if t else ""
        score = len(want & set(title.split())) if want else 0
        if score > best_score:
            best_url, best_score = e.group(1), score
    print(f"{best_url}|{best_score}")
except Exception:
    print("|-1")
PY
)"
  AUDIO_URL="${MATCH%%|*}"
  SCORE="${MATCH#*|}"
  [[ -z "$AUDIO_URL" ]] && die "no <enclosure> audio found in the RSS feed: $URL" 2
  # if we had a title to match, require a real overlap - else we grabbed a random episode
  if [[ -n "${TITLE:-}" && "${SCORE:-0}" -lt 2 ]]; then
    die "best RSS episode match for \"$TITLE\" was too weak (overlap=$SCORE). Wrong feed - pass the direct MP3 URL." 2
  fi
  log "matched episode (title overlap=$SCORE)"
fi

[[ -z "$AUDIO_URL" ]] && die "could not resolve an audio URL from: $URL_IN" 2
log "audio URL: $AUDIO_URL"

# --- 4. download --------------------------------------------------------------
AUDIO_FILE="$TMP_DIR/audio.bin"
log "downloading audio..."
curl -fSL -A "$UA" -o "$AUDIO_FILE" "$AUDIO_URL" || die "audio download failed: $AUDIO_URL"
[[ -s "$AUDIO_FILE" ]] || die "downloaded audio file is empty"
log "downloaded $(du -h "$AUDIO_FILE" | cut -f1)"

# --- 5. transcribe ------------------------------------------------------------
command -v whisper-ctranslate2 >/dev/null \
  || die "whisper-ctranslate2 not found. Run: uv tool install whisper-ctranslate2"
log "transcribing (model=$MODEL) - CPU, this can take a while..."
if ! whisper-ctranslate2 "$AUDIO_FILE" \
      --model "$MODEL" --output_format txt --output_dir "$TMP_DIR" \
      --task transcribe --language en >&2; then
  die "whisper-ctranslate2 failed"
fi
TXT_FILE="$(ls "$TMP_DIR"/*.txt 2>/dev/null | head -1)"
[[ -n "$TXT_FILE" && -s "$TXT_FILE" ]] || die "transcription produced no output"

# --- 6. write markdown --------------------------------------------------------
SLUG="$(printf '%s' "${TITLE:-transcript}" | tr '[:upper:]' '[:lower:]' \
  | tr -cd '[:alnum:] ' | tr -s ' ' '-' | cut -c1-60 | sed -E 's/^-//; s/-$//')"
DATE="$(date +%Y-%m-%d)"
OUT_FILE="$OUT_DIR/${SLUG:-transcript}-${DATE}.md"
{
  echo "# ${TITLE:-Transcript}"
  echo ""
  [[ -n "$SHOW" ]] && echo "- Show: $SHOW"
  echo "- Source: $URL_IN"
  echo "- Audio: $AUDIO_URL"
  echo "- Transcribed: $DATE via whisper-ctranslate2 (model=$MODEL)"
  echo ""
  echo "---"
  echo ""
  cat "$TXT_FILE"
} > "$OUT_FILE"
log "DONE -> $OUT_FILE"
echo "$OUT_FILE"
