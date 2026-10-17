"""Control: the Aug method (every usage line summed, old table), same 7-day window."""
import json, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
OLD = {"opus": (15, 75, 18.75, 1.5), "sonnet": (3, 15, 3.75, .3), "haiku": (1, 5, 1.25, .1), "fable": (3, 15, 3.75, .3)}
now = datetime.now(timezone.utc); since = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
lines = ids = 0; cost = 0.0
for f in (Path.home() / ".claude" / "projects").rglob("*.jsonl"):
    if datetime.fromtimestamp(f.stat().st_mtime, timezone.utc) < since: continue
    seen = set()
    for line in f.open(errors="replace"):
        if '"usage"' not in line: continue
        try: d = json.loads(line)
        except json.JSONDecodeError: continue
        msg = d.get("message") or {}; u = msg.get("usage"); ts = d.get("timestamp", "")
        if not (u and ts): continue
        if datetime.fromisoformat(ts.replace("Z", "+00:00")) < since: continue
        m = (msg.get("model") or "").lower(); r = next((v for k, v in OLD.items() if k in m), (3, 15, 3.75, .3))
        t = (u.get("input_tokens", 0) or 0, u.get("output_tokens", 0) or 0, u.get("cache_creation_input_tokens", 0) or 0, u.get("cache_read_input_tokens", 0) or 0)
        if not any(t): continue
        lines += 1; cost += sum(a * b for a, b in zip(t, r)) / 1e6
        if msg.get("id") not in seen: ids += 1; seen.add(msg.get("id"))
print(f"lines {lines}  unique-ids {ids}  old$ {cost:.2f}  old$/line {cost/lines:.3f}  old$/unique-turn {cost/ids:.3f}")
