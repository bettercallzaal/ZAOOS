#!/usr/bin/env python3
"""
ZOE random learning pings (no-LLM mode).

Picks a random doc from the ZAO OS research library + ADRs + BRAIN/,
extracts the title + opening summary, sends to Zaal via Telegram.

Designed to run every 30 minutes via cron during waking hours (9am-9pm ET).

Environment variables required:
  - TELEGRAM_BOT_TOKEN: ZOE's Telegram bot token (auto-wired from ~/.env.portal)
  - TELEGRAM_CHAT_ID: Zaal's user/chat ID (default: 1447437687)
  - ZAO_OS_REPO: path to the ZAO OS V1 git checkout on the host
                 (default: /home/zaal/zao-os)

Optional:
  - ANTHROPIC_API_KEY: if set, uses Claude Haiku to synthesize a 1-line tip
                       instead of the doc's opening summary. Costs ~$3-4/mo.
                       Default off — shipped as no-LLM to start (doc 462 plan).
  - QUIET_HOURS_START: hour to skip starting from (default: 21 = 9pm)
  - QUIET_HOURS_END: hour to resume (default: 9 = 9am)

State file: ~/.cache/zoe-learning-pings/sent.json
  Tracks last 7 days of sent doc paths so we don't repeat.
"""

from __future__ import annotations

import json
import os
import random
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib import request as urllib_request
from urllib import error as urllib_error

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
ZAO_OS_REPO = Path(os.environ.get("ZAO_OS_REPO", "/home/zaal/zao-os"))
STATE_FILE = Path(os.environ.get(
    "ZOE_PINGS_STATE",
    str(Path.home() / ".cache" / "zoe-learning-pings" / "sent.json"),
))
QUIET_START = int(os.environ.get("QUIET_HOURS_START", "21"))
QUIET_END = int(os.environ.get("QUIET_HOURS_END", "9"))
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
HAIKU_MODEL = os.environ.get("ZOE_TIP_MODEL", "claude-haiku-4-5-20251001")
MAX_DOC_CHARS_FOR_LLM = 3500
MAX_TIP_CHARS = 240
MAX_SUMMARY_CHARS = 420
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
    "BRAIN/projects/*.md",
    "BRAIN/people/*.md",
]

# Placeholders in env file that mean "not yet configured"
PLACEHOLDER_PREFIXES = ("PASTE_", "YOUR_", "TBD", "REPLACE_")


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def in_quiet_hours(now_local: datetime) -> bool:
    h = now_local.hour
    if QUIET_START < QUIET_END:
        return not (QUIET_START <= h < QUIET_END)
    return QUIET_START <= h or h < QUIET_END


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


def doc_title_from(path: Path, text: str) -> str:
    """Extract the first heading (# or ###) as the title."""
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("# ").strip().strip(">").strip()
    return path.stem


def doc_summary_from(text: str, max_chars: int = MAX_SUMMARY_CHARS) -> str:
    """
    Extract an opening summary. Strips frontmatter + title, then keeps
    everything else up to max_chars, cleaning whitespace. Forgiving — if the
    doc starts with tables or subheadings, those get included.
    """
    lines = text.splitlines()
    # Strip YAML frontmatter block
    if lines and lines[0].strip() == "---":
        try:
            end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
            lines = lines[end + 1 :]
        except StopIteration:
            pass

    # Skip until we're past the title
    past_title = False
    content_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not past_title:
            if stripped.startswith("#"):
                past_title = True
            continue
        # Skip horizontal rules; they contribute nothing
        if stripped == "---":
            continue
        content_lines.append(stripped)

    # Join, collapse whitespace, clip
    summary = " ".join(ln for ln in content_lines if ln).strip()
    summary = re.sub(r"\s+", " ", summary)
    # Strip markdown artifacts that read weird in Telegram
    summary = re.sub(r"\*\*([^*]+)\*\*", r"\1", summary)  # **bold** -> bold
    summary = re.sub(r"`([^`]+)`", r"\1", summary)         # `code` -> code
    if len(summary) > max_chars:
        summary = summary[: max_chars - 1].rsplit(" ", 1)[0] + "…"
    return summary


def extract_tip_via_claude(doc_text: str, doc_title: str) -> str | None:
    """Call Claude Haiku for a 1-line synthesis. Only runs if ANTHROPIC_API_KEY set."""
    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY.upper().startswith(PLACEHOLDER_PREFIXES):
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
        f"--- DOC START ---\n{doc_text[:MAX_DOC_CHARS_FOR_LLM]}\n--- DOC END ---"
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
    if TELEGRAM_BOT_TOKEN.upper().startswith(PLACEHOLDER_PREFIXES):
        print("TELEGRAM_BOT_TOKEN is still a placeholder; printing instead",
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


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
def main() -> int:
    now_local = datetime.now()
    if in_quiet_hours(now_local):
        print(f"Quiet hours ({QUIET_START}-{QUIET_END}); skipping.", file=sys.stderr)
        return 0

    state = prune_old(load_state())
    doc = pick_doc(state)
    if doc is None:
        print(f"No candidate docs found under {ZAO_OS_REPO}", file=sys.stderr)
        return 1

    rel = doc.relative_to(ZAO_OS_REPO)
    text_body = doc.read_text(encoding="utf-8", errors="replace")
    title = doc_title_from(doc, text_body)

    # Prefer Claude Haiku synthesis IF a real key is configured, else fall back
    # to a plain summary extracted from the doc itself (no-LLM mode, $0 cost).
    tip = extract_tip_via_claude(text_body, title)
    mode = "llm"
    if not tip:
        tip = doc_summary_from(text_body)
        mode = "summary"

    if not tip:
        print(f"No tip extractable from {rel}", file=sys.stderr)
        return 0

    # GitHub URL for tap-to-open.
    github_url = f"https://github.com/bettercallzaal/ZAOOS/blob/main/{rel}"

    # Act URL: one-tap portal page that spawns an AO agent to work on THIS doc.
    # Portal hosts act.html + POSTs to /api/spawn-agent (spawn-server.js).
    from urllib.parse import quote
    act_url = (
        "https://portal.zaoos.com/act"
        f"?doc={quote(str(rel), safe='/')}"
        f"&title={quote(title[:80])}"
    )

    msg_parts = [
        f"[ZOE TIP] {title}",
        "",
        tip,
        "",
        f"Read: {github_url}",
        f"Act:  {act_url}",
    ]
    msg = "\n".join(msg_parts)

    if send_telegram(msg):
        state["sent"].append({
            "path": str(rel),
            "title": title,
            "mode": mode,
            "at": datetime.now(timezone.utc).isoformat(),
        })
        save_state(state)
        print(f"Sent ({mode}): {rel}")
        return 0
    else:
        print("Telegram send failed; not recording in state", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
