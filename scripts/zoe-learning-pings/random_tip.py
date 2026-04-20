#!/usr/bin/env python3
"""
ZOE random learning pings.

Picks a random doc from the ZAO OS research library + ADRs, extracts a
1-line actionable tip via Claude Haiku, sends to Zaal via Telegram bot.

Designed to run every 30 minutes via cron during waking hours (9am-9pm ET).

Environment variables required:
  - ANTHROPIC_API_KEY: Claude API key (Haiku tier is sufficient + cheap)
  - TELEGRAM_BOT_TOKEN: ZOE's existing bot token
  - TELEGRAM_CHAT_ID: Zaal's user/chat ID
  - ZAO_OS_REPO: path to the ZAO OS V1 git checkout on the host
                 (default: /opt/zao-os)
  - QUIET_HOURS_START: hour to skip starting from (default: 21 = 9pm ET)
  - QUIET_HOURS_END: hour to resume (default: 9 = 9am ET)

State file: ~/.cache/zoe-learning-pings/sent.json
  Tracks last 7 days of sent doc paths so we don't repeat the same tip.
"""

from __future__ import annotations

import json
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable
from urllib import request as urllib_request
from urllib import error as urllib_error

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
ZAO_OS_REPO = Path(os.environ.get("ZAO_OS_REPO", "/opt/zao-os"))
STATE_FILE = Path(os.environ.get(
    "ZOE_PINGS_STATE",
    str(Path.home() / ".cache" / "zoe-learning-pings" / "sent.json"),
))
QUIET_START = int(os.environ.get("QUIET_HOURS_START", "21"))
QUIET_END = int(os.environ.get("QUIET_HOURS_END", "9"))
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
HAIKU_MODEL = os.environ.get("ZOE_TIP_MODEL", "claude-haiku-4-5-20251001")
MAX_DOC_CHARS = 3500
MAX_TIP_CHARS = 240
COOLDOWN_DAYS = 7

DOC_GLOBS = [
    "research/dev-workflows/*/README.md",
    "research/agents/*/README.md",
    "research/infrastructure/*/README.md",
    "research/community/*/README.md",
    "research/governance/*/README.md",
    "research/farcaster/*/README.md",
    "research/identity/*/README.md",
    "docs/adr/*.md",
]


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def in_quiet_hours(now_local: datetime) -> bool:
    """Return True if the current ET hour is inside the quiet window."""
    h = now_local.hour
    if QUIET_START < QUIET_END:  # e.g. 9..21 = active 9-21
        return not (QUIET_START <= h < QUIET_END)
    return QUIET_START <= h or h < QUIET_END  # default 21..9 = quiet 9pm-9am


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {"sent": []}
    try:
        return json.loads(STATE_FILE.read_text())
    except Exception:
        return {"sent": []}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def prune_old(state: dict, days: int = COOLDOWN_DAYS) -> dict:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    state["sent"] = [s for s in state["sent"] if s.get("at", "") > cutoff]
    return state


def list_candidate_docs() -> list[Path]:
    docs: list[Path] = []
    for g in DOC_GLOBS:
        docs.extend(ZAO_OS_REPO.glob(g))
    return docs


def pick_doc(state: dict) -> Path | None:
    candidates = list_candidate_docs()
    if not candidates:
        return None
    recent = {s["path"] for s in state["sent"]}
    pool = [d for d in candidates if str(d.relative_to(ZAO_OS_REPO)) not in recent]
    if not pool:
        # Everything sent in last week — open the floodgates.
        pool = candidates
    return random.choice(pool)


def extract_tip(doc_text: str, doc_title: str) -> str | None:
    """Call Claude Haiku to extract 1 actionable tip. Returns None on failure."""
    if not ANTHROPIC_API_KEY:
        print("ANTHROPIC_API_KEY not set; cannot extract tip", file=sys.stderr)
        return None

    prompt = (
        "You are ZOE, Zaal's concierge agent. Extract ONE actionable tip from the "
        f"following ZAO OS research doc titled '{doc_title}'.\n\n"
        f"Constraints:\n"
        f"- Max {MAX_TIP_CHARS} characters total.\n"
        "- Make it concrete and immediately useful TODAY (no abstract advice).\n"
        "- Reference the doc's specific recommendation, not a generic principle.\n"
        "- Speak directly to Zaal in second person.\n"
        "- No preamble, no quotes, no markdown — just the tip text.\n"
        "- If the doc has no actionable tip (pure history/log), respond with exactly: SKIP\n\n"
        f"--- DOC START ---\n{doc_text[:MAX_DOC_CHARS]}\n--- DOC END ---"
    )

    body = json.dumps({
        "model": HAIKU_MODEL,
        "max_tokens": 256,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")

    req = urllib_request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        method="POST",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )

    try:
        with urllib_request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
    except urllib_error.HTTPError as e:
        print(f"Claude API error {e.code}: {e.read().decode('utf-8', errors='replace')}",
              file=sys.stderr)
        return None
    except Exception as e:
        print(f"Claude API call failed: {e}", file=sys.stderr)
        return None

    blocks = data.get("content", [])
    if not blocks:
        return None
    tip = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
    if not tip or tip.upper().startswith("SKIP"):
        return None
    return tip[:MAX_TIP_CHARS]


def send_telegram(text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set; printing instead",
              file=sys.stderr)
        print(text)
        return False

    body = json.dumps({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "disable_web_page_preview": True,
    }).encode("utf-8")

    req = urllib_request.Request(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        data=body,
        method="POST",
        headers={"content-type": "application/json"},
    )

    try:
        with urllib_request.urlopen(req, timeout=15) as resp:
            data = json.load(resp)
            return bool(data.get("ok"))
    except Exception as e:
        print(f"Telegram send failed: {e}", file=sys.stderr)
        return False


def doc_title_from(path: Path) -> str:
    """Pull the first H1 (or H3 for ADR style) from the doc as a title."""
    try:
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            stripped = line.strip()
            if stripped.startswith("#"):
                return stripped.lstrip("# ").strip()
    except Exception:
        pass
    return path.stem


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
def main() -> int:
    # ZOE pings respect Eastern Time waking hours.
    now_local = datetime.now()  # Host TZ (set host TZ to America/New_York or use TZ env)
    if in_quiet_hours(now_local):
        print(f"Quiet hours ({QUIET_START}-{QUIET_END}); skipping.", file=sys.stderr)
        return 0

    state = prune_old(load_state())
    doc = pick_doc(state)
    if doc is None:
        print(f"No candidate docs found under {ZAO_OS_REPO}", file=sys.stderr)
        return 1

    title = doc_title_from(doc)
    rel = doc.relative_to(ZAO_OS_REPO)
    text_body = doc.read_text(encoding="utf-8", errors="replace")
    tip = extract_tip(text_body, title)
    if not tip:
        print(f"No tip extractable from {rel}", file=sys.stderr)
        return 0  # silent miss; try again in 30 min

    msg = f"[ZOE TIP] {title}\n\n{tip}\n\n>> {rel}"
    if send_telegram(msg):
        state["sent"].append({
            "path": str(rel),
            "title": title,
            "at": datetime.now(timezone.utc).isoformat(),
        })
        save_state(state)
        print(f"Sent: {rel}")
        return 0
    else:
        print("Telegram send failed; not recording in state", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
