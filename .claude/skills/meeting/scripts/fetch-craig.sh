#!/usr/bin/env bash
# fetch-craig.sh - Download Craig recording from craig.horse share URL.
# Usage: fetch-craig.sh "https://craig.horse/rec/<id>?key=<key>"
# Outputs: prints local path to downloaded audio (.flac) on stdout.

set -euo pipefail

URL="${1:?missing craig URL}"

if [[ ! "$URL" =~ ^https://craig\.horse/rec/ ]]; then
  echo "ERROR: not a craig.horse URL: $URL" >&2
  exit 2
fi

# Extract id from URL
ID=$(echo "$URL" | sed -E 's|.*craig\.horse/rec/([^/?]+).*|\1|')
KEY=$(echo "$URL" | sed -nE 's|.*[?&]key=([^&]+).*|\1|p')

if [[ -z "$ID" ]]; then
  echo "ERROR: could not parse recording id from URL" >&2
  exit 3
fi

STAMP=$(date +%Y%m%d-%H%M%S)
OUT="/tmp/craig-$ID-$STAMP.flac"

# Craig download endpoint: /rec/<id>.flac?key=<key>&container=flac
DL_URL="https://craig.horse/rec/${ID}.flac?key=${KEY}&container=flac"

echo "[craig] downloading $DL_URL -> $OUT" >&2

if ! curl -fsSL -A "Mozilla/5.0 ZAO-meeting-skill" "$DL_URL" -o "$OUT"; then
  echo "ERROR: download failed. Recording may be expired (Craig keeps 7 days) or key wrong." >&2
  rm -f "$OUT"
  exit 4
fi

if [[ ! -s "$OUT" ]]; then
  echo "ERROR: download was empty" >&2
  rm -f "$OUT"
  exit 5
fi

echo "[craig] done ($(du -h "$OUT" | cut -f1)) -> $OUT" >&2
echo "$OUT"
