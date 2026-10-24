#!/usr/bin/env python3
"""Local-only HTTP server backing the /clipboard single-tab experience.

Serves an SPA shell at / that polls this server for the clip list and swaps
content client-side, so repeated /clipboard calls update the SAME already-
open browser tab instead of piling up a new tab per call. Reads directly
from the existing ~/.zao/clipboard/clip-*.html files clipboard-emit.sh
already writes - this is purely an index/API layer on top of what already
exists, not a new storage format. Nothing about the existing per-clip
files or index.html changes.

Binds 127.0.0.1 only - never expose this port externally.

Run standalone (clipboard-emit.sh starts it automatically if not already
running):
  python3 clipboard-server.py
"""
import http.server
import json
import re
import socketserver
import sys
import time
from pathlib import Path

CLIP_DIR = Path.home() / '.zao' / 'clipboard'
PORT_FILE = CLIP_DIR / 'server.port'
SHELL_FILE = Path(__file__).resolve().parent / 'clipboard-app-shell.html'

TITLE_RE = re.compile(r'<title>(.*?)</title>', re.DOTALL)
# Lazy capture anchored on BOTH closing </div>s (content's own, then its
# .container parent's) before the toast div - a plain greedy `(.*)</div>`
# backtracks to the LAST </div> in the file (the container's), swallowing
# the content div's own closing tag into the captured body. Requiring both
# in sequence disambiguates it.
CONTENT_RE = re.compile(
    r'<div class="content" id="content">(.*?)</div>\s*</div>\s*<div class="toast"', re.DOTALL
)
CLIP_ID_RE = re.compile(r'^clip-[0-9]{8}-[0-9]{6}-[a-z0-9-]*$')

last_poll_at = 0.0


def list_clips():
    files = sorted(CLIP_DIR.glob('clip-*.html'), key=lambda p: p.stat().st_mtime, reverse=True)
    return [{'id': f.stem, 'mtime': f.stat().st_mtime} for f in files]


def read_clip(clip_id):
    # clip_id must match our own generated filename shape - guards path traversal.
    if not CLIP_ID_RE.match(clip_id):
        return None
    f = CLIP_DIR / (clip_id + '.html')
    if not f.exists():
        return None
    raw = f.read_text(encoding='utf-8', errors='replace')
    tm = TITLE_RE.search(raw)
    cm = CONTENT_RE.search(raw)
    return {
        'id': clip_id,
        'title': tm.group(1) if tm else clip_id,
        'body_html': cm.group(1) if cm else '<p>(could not parse this clip)</p>',
    }


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # quiet - this runs as a detached background daemon

    def _json(self, obj, status=200):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        global last_poll_at
        if self.path == '/':
            shell = SHELL_FILE.read_text(encoding='utf-8').replace('CLIP_DIR_PLACEHOLDER', str(CLIP_DIR))
            body = shell.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == '/api/clips':
            last_poll_at = time.time()
            self._json({'clips': list_clips()})
        elif self.path == '/api/tab-alive':
            self._json({'alive': (time.time() - last_poll_at) < 90})
        elif self.path.startswith('/api/clips/'):
            clip = read_clip(self.path[len('/api/clips/'):])
            self._json(clip, status=200) if clip else self._json({'error': 'not found'}, status=404)
        else:
            self.send_response(404)
            self.end_headers()


class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    CLIP_DIR.mkdir(parents=True, exist_ok=True)
    httpd = None
    port = 8765
    for candidate in range(port, port + 20):
        try:
            httpd = ThreadingServer(('127.0.0.1', candidate), Handler)
            port = candidate
            break
        except OSError:
            continue
    if httpd is None:
        print('ERROR: no free port found in range 8765-8784', file=sys.stderr)
        sys.exit(1)
    PORT_FILE.write_text(str(port))
    httpd.serve_forever()


if __name__ == '__main__':
    main()
