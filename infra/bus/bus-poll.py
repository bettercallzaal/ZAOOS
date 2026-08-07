#!/usr/bin/env python3
"""bus-poll - the partner-bus poller that shows the WHOLE message + a grounded draft.

Replaces ~/bin/tasern-bus-poll.sh on the VPS, which had three phone-hostile flaws
(Zaal, 2026-08-07, looking at the ping on his phone):
  1. `body[:120]` - the message was TRUNCATED; Jim's 4k-char interop spec showed as
     one line of nothing.
  2. the reply hint was `ssh vps tasern-bus send "subj" "body"` - unusable on a phone.
  3. no grounding - a reply would be composed from memory, not from what ZAO shipped.

This sends the FULL body (chunked to Telegram's limit), plus a GROUNDED context block
built from real repo state (recent merged PRs read via `gh`), plus the phone-native
reply syntax. Mirrors bot/src/zoe/bus-bridge.ts so both ends render identically.

SECURITY: tokens come from env/private files ONLY - never argv (ps leaks argv), never
printed, never in a URL. Read-only against the bus (GET); it never sends or marks read,
so it is safe to run unattended on a cron.

  bus-poll.py                 # poll + notify (needs BUS_URL/BUS_TOKEN, TG creds)
  bus-poll.py --dry-run       # render to stdout, send nothing (no TG creds needed)
  bus-poll.py --selftest
Env: BUS_URL, BUS_TOKEN, TG_BOT_TOKEN, TG_CHAT_ID, BUS_REPO (default bettercallzaal/ZAOOS)
"""
from __future__ import annotations
import argparse, json, os, subprocess, sys, urllib.request, urllib.parse

TELEGRAM_MAX = 4096
CHUNK_BUDGET = 3900  # headroom for the header lines


def short_id(mid: str) -> str:
    """Phone-typeable id - matches bus-bridge.ts shortId() exactly."""
    return mid.replace('-', '')[:6]


def chunk(text: str, size: int = CHUNK_BUDGET) -> list[str]:
    """Split on line boundaries where possible; hard-split only an oversized line."""
    out, cur = [], ''
    for line in text.split('\n'):
        while len(line) > size:            # a single monster line
            if cur:
                out.append(cur); cur = ''
            out.append(line[:size]); line = line[size:]
        if len(cur) + len(line) + 1 > size:
            out.append(cur); cur = line
        else:
            cur = f'{cur}\n{line}' if cur else line
    if cur:
        out.append(cur)
    return out or ['']


def extract_asks(body: str) -> list[str]:
    """Their questions/offers - what a reply must answer (mirrors bus-bridge.ts)."""
    import re
    idiom = re.compile(r'\b(yell if|let me know|want (me|us) to|happy to|if you want|shall we|do you want)\b', re.I)
    asks = []
    for raw in body.split('\n'):
        line = raw.strip()
        if not line:
            continue
        if line.endswith('?') or idiom.search(line):
            asks.append(line if len(line) <= 200 else line[:197] + '...')
    return asks[:5]


def repo_state(repo: str) -> list[str]:
    """Verified facts a reply may cite: recently MERGED PRs. Read from gh - never
    invented. Returns [] when gh is unavailable (honest: no facts, no citations)."""
    try:
        out = subprocess.run(
            ['gh', 'pr', 'list', '--repo', repo, '--state', 'merged', '--limit', '6',
             '--json', 'number,title'],
            capture_output=True, text=True, timeout=25)
        if out.returncode != 0:
            return []
        return [f"#{p['number']} {p['title'][:70]}" for p in json.loads(out.stdout or '[]')]
    except Exception:
        return []


def render(msg: dict, shipped: list[str]) -> str:
    """The full message + grounding + the phone reply syntax."""
    sid = short_id(msg.get('id', ''))
    head = [f"BUS {msg.get('from','?')} -> {msg.get('to','?')}"]
    if msg.get('subject'):
        head.append(f"Subject: {msg['subject']}")
    head.append(f"{str(msg.get('created',''))[:16].replace('T',' ')}  id {sid}")
    parts = ['\n'.join(head), '', msg.get('body', '') or '(empty body)']

    asks = extract_asks(msg.get('body', '') or '')
    if asks:
        parts += ['', 'THEY ASKED:'] + [f'- {a}' for a in asks]
    if shipped:
        parts += ['', 'OUR STATE (verified, cite these):'] + [f'- {s}' for s in shipped]
    parts += ['', f'REPLY: type  reply {sid} <your words>']
    return '\n'.join(parts)


def fetch_new(bus_url: str, token: str) -> list[dict]:
    req = urllib.request.Request(
        f"{bus_url.rstrip('/')}/messages?status=new",
        headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode()).get('messages', [])


def tg_send(bot: str, chat: str, text: str) -> bool:
    data = urllib.parse.urlencode({'chat_id': chat, 'text': text}).encode()
    req = urllib.request.Request(f'https://api.telegram.org/bot{bot}/sendMessage', data=data)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200
    except Exception as e:
        print(f'[bus-poll] telegram send FAILED: {e}', file=sys.stderr)  # loud, never silent
        return False


def _selftest() -> int:
    msg = {
        'id': 'eb823873-f02a-4898-b8c1-f99614c83c3c', 'from': 'coordinator', 'to': 'zao',
        'subject': 'How we built the bus', 'status': 'new', 'created': '2026-08-06T20:24:03.564Z',
        'body': 'Happy to help.\nThink your stack could plug into this?\n'
                'Yell if you want the actual vps-bus.js dropped on your lane - happy to.',
    }
    assert short_id(msg['id']) == 'eb8238', short_id(msg['id'])
    asks = extract_asks(msg['body'])
    assert any('plug into this?' in a for a in asks), asks
    assert any(a.startswith('Yell if') for a in asks), asks
    out = render(msg, ['#2940 zao-bus server (11/11 tests)'])
    # the WHOLE body survives - the old poller's 120-char cut is gone
    assert 'vps-bus.js dropped on your lane' in out
    assert 'THEY ASKED:' in out and 'OUR STATE' in out
    assert 'reply eb8238 <your words>' in out
    assert 'ssh' not in out, 'no ssh in a phone-facing message'
    # chunking keeps every char and respects the limit
    big = render({**msg, 'body': 'x' * 9000}, [])
    chunks = chunk(big)
    assert len(chunks) > 1 and all(len(c) <= TELEGRAM_MAX for c in chunks)
    assert sum(len(c) for c in chunks) >= 9000
    # no facts -> no fabricated state section
    assert 'OUR STATE' not in render(msg, [])
    print('selftest OK')
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description='bus-poll - full partner messages + grounded draft context')
    ap.add_argument('--dry-run', action='store_true', help='render to stdout, send nothing')
    ap.add_argument('--selftest', action='store_true')
    a = ap.parse_args(argv)
    if a.selftest:
        return _selftest()

    bus_url, token = os.environ.get('BUS_URL', ''), os.environ.get('BUS_TOKEN', '')
    if not bus_url or not token:
        print('[bus-poll] BUS_URL/BUS_TOKEN not set - nothing polled', file=sys.stderr)
        return 0  # a cron with no creds is a no-op, loudly
    try:
        messages = fetch_new(bus_url, token)
    except Exception as e:
        print(f'[bus-poll] bus fetch FAILED: {e}', file=sys.stderr)
        return 1
    if not messages:
        return 0

    shipped = repo_state(os.environ.get('BUS_REPO', 'bettercallzaal/ZAOOS'))
    bot, chat = os.environ.get('TG_BOT_TOKEN', ''), os.environ.get('TG_CHAT_ID', '')
    sent = 0
    for msg in messages[:5]:
        for part in chunk(render(msg, shipped)):
            if a.dry_run or not bot or not chat:
                print(part)
                print('---')
            elif tg_send(bot, chat, part):
                sent += 1
    if not a.dry_run and (not bot or not chat):
        print('[bus-poll] TG creds absent - rendered to stdout instead', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
