#!/usr/bin/env bash
# clipboard-emit.sh - write a clipboard page + update the history index + open it.
#
# Each /clipboard call writes a timestamped HTML file at
# ~/.zao/clipboard/clip-<ts>-<slug>.html, copies it to /tmp/clipboard.html
# (the back-compat default `open` opens), and regenerates the index of all
# saved clips so you can scroll back through prior pastes.
#
# Usage:
#   echo "$BODY_HTML" | clipboard-emit.sh <title> <slug>
#
# Where:
#   - title = human-readable header (max ~60 chars)
#   - slug  = filename-safe identifier (kebab-case, no spaces)
#   - BODY_HTML = the inner <div class="content"> markup, on stdin
#
# Caller is expected to have already HTML-escaped the body and applied any
# `<h2>` / `<strong>` formatting. This script wraps it in the standard
# template (header bar, copy button, toast, nav back to index).
#
# Auto-prunes anything older than the newest 50 clips.

set -uo pipefail

TITLE="${1:-Clipboard}"
SLUG="${2:-clip}"

HOME_DIR="$HOME/.zao/clipboard"
mkdir -p "$HOME_DIR"

# Read body from stdin (whole file).
BODY=$(cat)
if [[ -z "$BODY" ]]; then
  echo "ERROR: empty body on stdin" >&2
  exit 2
fi

TS=$(date +%Y%m%d-%H%M%S)
SLUG_CLEAN=$(echo "$SLUG" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+|-+$//g' | cut -c1-50)
CLIP_FILE="$HOME_DIR/clip-${TS}-${SLUG_CLEAN}.html"

# Escape TITLE for HTML attribute / text contexts. Body is caller-trusted.
ESC_TITLE=$(printf '%s' "$TITLE" | python3 -c 'import sys, html; print(html.escape(sys.stdin.read()), end="")' 2>/dev/null || printf '%s' "$TITLE")

cat > "$CLIP_FILE" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$ESC_TITLE</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a1628; color: #e2e8f0; padding: 20px; line-height: 1.55; }
  .container { max-width: 760px; margin: 0 auto; }
  .navbar { display: flex; gap: 10px; align-items: center; font-size: 11px;
    color: rgba(255,255,255,0.45); margin-bottom: 12px; padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.06); }
  .navbar a { color: #f5a623; text-decoration: none; }
  .navbar a:hover { color: #ffd700; }
  .header { display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .header h1 { font-size: 16px; color: #f5a623; flex: 1; padding-right: 12px; }
  .copy-btn { background: #f5a623; color: #000; border: none; padding: 9px 20px;
    border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;
    white-space: nowrap; }
  .copy-btn:hover { background: #ffd700; }
  .copy-btn.copied { background: #22c55e; color: #fff; }
  .content { background: #0d1b2a; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 22px; white-space: pre-wrap; font-size: 14px;
    cursor: text; user-select: text; }
  .content h2 { color: #f5a623; margin: 16px 0 6px; font-size: 14.5px;
    display: flex; align-items: center; gap: 8px; }
  .content h2:first-child { margin-top: 0; }
  .content strong { color: #fff; }
  .jump-nav { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .jump-nav a { font-size: 11px; color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 5px 10px;
    text-decoration: none; }
  .jump-nav a:hover { color: #f5a623; border-color: rgba(245,166,35,0.35); }
  .step-section { transition: opacity 0.15s ease; }
  .step-section.done { opacity: 0.42; }
  .step-section.done h2 { text-decoration: line-through; }
  .step-check { appearance: none; -webkit-appearance: none; width: 16px; height: 16px;
    flex: 0 0 auto; border: 1.5px solid rgba(245,166,35,0.5); border-radius: 4px;
    cursor: pointer; position: relative; background: transparent; }
  .step-check:checked { background: #f5a623; border-color: #f5a623; }
  .step-check:checked::after { content: "\2713"; position: absolute; left: 2px; top: -2px;
    color: #000; font-size: 12px; font-weight: 700; }
  .content .note { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.25);
    border-left: 3px solid #3b82f6; border-radius: 8px; padding: 10px 14px 12px;
    margin: 10px 0 14px; font-size: 13px; }
  .content .note::before { content: "Note"; display: block; font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; color: #60a5fa; margin-bottom: 4px; }
  .content .warn { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
    border-left: 3px solid #ef4444; border-radius: 8px; padding: 10px 14px 12px;
    margin: 10px 0 14px; font-size: 13px; }
  .content .warn::before { content: "Heads up"; display: block; font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; color: #f87171; margin-bottom: 4px; }
  .content pre, .content .snippet { background: #050d18;
    border: 1px solid rgba(245,166,35,0.18); border-radius: 8px; padding: 14px 16px;
    margin: 10px 0 14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px; line-height: 1.5; overflow-x: auto; position: relative;
    white-space: pre-wrap; word-break: break-word; }
  .snippet-wrap { position: relative; margin: 10px 0 14px; }
  .snippet-wrap pre, .snippet-wrap .snippet { margin: 0; padding-right: 86px; }
  .snippet-copy { position: absolute; top: 8px; right: 8px; background: rgba(245,166,35,0.15);
    color: #f5a623; border: 1px solid rgba(245,166,35,0.35); padding: 4px 10px;
    border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;
    font-family: -apple-system, sans-serif; }
  .snippet-copy:hover { background: rgba(245,166,35,0.25); }
  .snippet-copy.copied { background: #22c55e; color: #fff; border-color: #22c55e; }
  .toast { position: fixed; bottom: 24px; left: 50%;
    transform: translateX(-50%) translateY(100px); background: #22c55e; color: #fff;
    padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;
    transition: transform 0.3s ease; z-index: 100; }
  .toast.show { transform: translateX(-50%) translateY(0); }
</style>
</head>
<body>
<div class="container">
  <div class="navbar">
    <a href="file://$HOME_DIR/index.html">&larr; all clips</a>
    <span>&middot;</span>
    <span>saved $TS</span>
  </div>
  <div class="header">
    <h1>$ESC_TITLE</h1>
    <button class="copy-btn" onclick="copyAll()">Copy All</button>
  </div>
  <div class="content" id="content">$BODY</div>
</div>
<div class="toast" id="toast">Copied!</div>
<script>
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg || 'Copied!';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
function copyText(text, btn, originalLabel) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      btn.textContent = 'Copied!'; btn.classList.add('copied');
      setTimeout(() => { btn.textContent = originalLabel; btn.classList.remove('copied'); }, 2000);
    }
    showToast('Copied!');
  }).catch(() => {
    showToast('Copy blocked - select + Cmd+C');
  });
}
function copyAll() {
  const el = document.getElementById('content');
  const btn = document.querySelector('.copy-btn');
  copyText(el.innerText, btn, 'Copy All');
}
// Turn each top-level <h2> section into a checkable step: wraps the heading
// + everything up to the next <h2> in a .step-section, adds a checkbox that
// dims + strikes through the section when checked, and persists state in
// localStorage keyed by this file's own path so reopening the same clip
// remembers progress. Skips single-heading pages (nothing to track).
(function makeStepsCheckable() {
  const content = document.getElementById('content');
  if (!content) return;
  const children = Array.from(content.childNodes);
  const h2Indices = [];
  children.forEach((n, i) => { if (n.nodeType === 1 && n.tagName === 'H2') h2Indices.push(i); });
  if (h2Indices.length < 2) return;

  const storeKey = 'clip-steps:' + location.pathname;
  let state = {};
  try { state = JSON.parse(localStorage.getItem(storeKey) || '{}'); } catch (e) {}

  const preamble = children.slice(0, h2Indices[0]);
  const groups = h2Indices.map((start, g) => {
    const end = g + 1 < h2Indices.length ? h2Indices[g + 1] : children.length;
    return children.slice(start, end);
  });

  content.innerHTML = '';
  preamble.forEach((n) => content.appendChild(n));

  const headingEls = [];
  groups.forEach((group, i) => {
    const section = document.createElement('div');
    section.className = 'step-section';
    group.forEach((n) => section.appendChild(n));
    const h2 = section.querySelector('h2');
    headingEls.push(h2);

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'step-check';
    cb.checked = !!state[i];
    if (cb.checked) section.classList.add('done');
    cb.addEventListener('change', () => {
      section.classList.toggle('done', cb.checked);
      state[i] = cb.checked;
      localStorage.setItem(storeKey, JSON.stringify(state));
    });
    if (h2) h2.insertBefore(cb, h2.firstChild);
    content.appendChild(section);
  });

  // Jump nav only earns its keep on longer, multi-step pages.
  if (headingEls.length >= 3) {
    const nav = document.createElement('div');
    nav.className = 'jump-nav';
    headingEls.forEach((h2, i) => {
      if (!h2) return;
      const id = 'step-' + i;
      h2.id = id;
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = h2.textContent.trim();
      nav.appendChild(a);
    });
    content.parentNode.insertBefore(nav, content);
  }
})();
// Wrap every <pre> (or .snippet) in the content area with its own Copy button.
// Lets users grab just the snippet without the surrounding instructions.
(function attachSnippetCopyButtons() {
  const content = document.getElementById('content');
  if (!content) return;
  const targets = content.querySelectorAll('pre, .snippet');
  targets.forEach((node) => {
    if (node.dataset.copyAttached === '1') return;
    node.dataset.copyAttached = '1';
    const wrap = document.createElement('div');
    wrap.className = 'snippet-wrap';
    node.parentNode.insertBefore(wrap, node);
    wrap.appendChild(node);
    const btn = document.createElement('button');
    btn.className = 'snippet-copy';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => copyText(node.innerText, btn, 'Copy'));
    wrap.appendChild(btn);
  });
})();
</script>
</body>
</html>
HTML

# Copy to /tmp for back-compat (`open /tmp/clipboard.html` still hits the latest).
cp "$CLIP_FILE" /tmp/clipboard.html

# Auto-prune: keep newest 50 clips, drop older.
# shellcheck disable=SC2012
ls -1t "$HOME_DIR"/clip-*.html 2>/dev/null | tail -n +51 | xargs rm -f 2>/dev/null || true

# Regenerate index.
INDEX="$HOME_DIR/index.html"
{
  cat <<'TOP'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Clipboard history</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a1628; color: #e2e8f0; padding: 20px; line-height: 1.55; }
  .container { max-width: 760px; margin: 0 auto; }
  h1 { font-size: 17px; color: #f5a623; margin-bottom: 18px; padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08); }
  .clip { display: block; padding: 12px 14px; background: #0d1b2a;
    border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
    margin-bottom: 8px; text-decoration: none; color: inherit; transition: all 0.15s; }
  .clip:hover { border-color: rgba(245,166,35,0.4); background: #102234; }
  .clip-title { font-size: 14px; color: #fff; font-weight: 600; }
  .clip-meta { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 4px; }
  .footer { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 18px;
    padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
</style>
</head>
<body>
<div class="container">
  <h1>Clipboard history</h1>
TOP

  for f in $(ls -1t "$HOME_DIR"/clip-*.html 2>/dev/null); do
    base=$(basename "$f")
    # base = clip-YYYYMMDD-HHMMSS-<slug>.html
    ts_date=$(echo "$base" | sed -E 's/^clip-([0-9]{8})-([0-9]{6})-.*\.html$/\1 \2/')
    yyyy=${ts_date:0:4}
    mm=${ts_date:4:2}
    dd=${ts_date:6:2}
    hh=${ts_date:9:2}
    mi=${ts_date:11:2}
    pretty_ts="${yyyy}-${mm}-${dd} ${hh}:${mi}"
    # title = pulled from <title> tag of the file
    page_title=$(grep -oE '<title>[^<]+</title>' "$f" | head -1 | sed -E 's/<\/?title>//g')
    [[ -z "$page_title" ]] && page_title="(no title)"
    slug=$(echo "$base" | sed -E 's/^clip-[0-9]{8}-[0-9]{6}-(.*)\.html$/\1/')
    cat <<CLIP
  <a class="clip" href="file://$f">
    <div class="clip-title">$page_title</div>
    <div class="clip-meta">$pretty_ts &middot; $slug</div>
  </a>
CLIP
  done

  cat <<'BOT'
  <div class="footer">Latest auto-opens via /tmp/clipboard.html. Older clips persist at ~/.zao/clipboard/ until the newest-50 prune.</div>
</div>
</body>
</html>
BOT
} > "$INDEX"

# --- Single-tab live-update server -----------------------------------------
# Reuses one already-open browser tab across calls instead of piling up a new
# tab per /clipboard invocation. Purely additive: reads the same clip-*.html
# files written above, no new storage format. If anything here fails, falls
# straight back to the old per-call `open` behavior so a clipboard call never
# hard-fails just because the server plumbing had a bad day.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PY="$SCRIPT_DIR/clipboard-server.py"
PORT_FILE="$HOME_DIR/server.port"
CLIP_ID="$(basename "$CLIP_FILE" .html)"

server_port() {
  [[ -f "$PORT_FILE" ]] && cat "$PORT_FILE" 2>/dev/null
}

server_alive() {
  local port="$1"
  [[ -n "$port" ]] && curl -s -m 1 "http://127.0.0.1:${port}/api/clips" >/dev/null 2>&1
}

ensure_server_running() {
  local port
  port="$(server_port)"
  if server_alive "$port"; then
    echo "$port"
    return 0
  fi
  # Not running (or stale port file) - start it detached, quiet, survives
  # this shell exiting. nohup + disown so it isn't a child of this script.
  if [[ -x "$(command -v python3 2>/dev/null)" ]] && [[ -f "$SERVER_PY" ]]; then
    nohup python3 "$SERVER_PY" >/dev/null 2>"$HOME_DIR/server.log" &
    disown 2>/dev/null || true
    for _ in $(seq 1 20); do
      sleep 0.1
      port="$(server_port)"
      if server_alive "$port"; then
        echo "$port"
        return 0
      fi
    done
  fi
  return 1
}

PORT="$(ensure_server_running || true)"

if [[ -n "${PORT:-}" ]]; then
  TAB_ALIVE="false"
  if resp=$(curl -s -m 1 "http://127.0.0.1:${PORT}/api/tab-alive" 2>/dev/null); then
    # Parse properly rather than string-match the JSON - python's json.dumps
    # emits "alive": true (space after colon), which a naive *'"alive":true'*
    # glob silently never matches.
    if python3 -c "import json,sys; sys.exit(0 if json.loads(sys.argv[1]).get('alive') else 1)" "$resp" 2>/dev/null; then
      TAB_ALIVE="true"
    fi
  fi
  APP_URL="http://127.0.0.1:${PORT}/#${CLIP_ID}"
  if [[ "$TAB_ALIVE" == "true" ]]; then
    echo "OK saved $CLIP_FILE"
    echo "    index $INDEX"
    echo "    live tab already open - it will pick this up automatically ($APP_URL)"
  else
    open "$APP_URL" 2>/dev/null || open "$CLIP_FILE" 2>/dev/null || open /tmp/clipboard.html
    echo "OK saved $CLIP_FILE"
    echo "    index $INDEX"
    echo "    opened $APP_URL"
  fi
else
  # Server plumbing unavailable for some reason - old per-call-tab behavior.
  open "$CLIP_FILE" 2>/dev/null || open /tmp/clipboard.html
  echo "OK saved $CLIP_FILE"
  echo "    index $INDEX"
fi
