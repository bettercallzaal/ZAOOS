#!/usr/bin/env python3
"""step-journal - a topic-threaded, severity-tagged event log agents append to and a
human can (a) watch by topic to see how an idea progressed, (b) reply to a specific
step to inject a correction. The reversible standalone primitive UNDER the TG pinned
mission-control (task #73 / doc 2226): agent-to-agent chatter + relay traffic land
here as steps; the pinned message renders a view of it; a reply routes back to a step.

Standalone: a JSONL store, no infra, no network. Append-only + reply = the substrate;
the live-bot rendering/routing is a separate, gated build.

CLI:
  step-journal.py append <topic> <actor> <severity 0-10> <text...> [--parent ID]
  step-journal.py thread <topic>            # how an idea progressed (ordered + replies)
  step-journal.py reply <step_id> <text...> # inject a correction on a step
  step-journal.py feed [--min-severity K]   # recent, priority-filtered (the notify>=7 rule)
  step-journal.py --selftest
Env: STEP_JOURNAL_PATH (default ~/.zao/step-journal/journal.jsonl)
"""
from __future__ import annotations
import argparse, json, os, sys
from datetime import datetime, timezone


def _path() -> str:
    p = os.environ.get("STEP_JOURNAL_PATH")
    if p:
        return p
    return os.path.join(os.path.expanduser("~"), ".zao", "step-journal", "journal.jsonl")


def _now_iso(now: str | None) -> str:
    return now or datetime.now(timezone.utc).isoformat()


def _read() -> list[dict]:
    try:
        with open(_path(), encoding="utf-8") as fh:
            return [json.loads(l) for l in fh if l.strip()]
    except OSError:
        return []
    except ValueError:
        # a corrupt line shouldn't take the whole feed down - skip bad lines
        out = []
        try:
            with open(_path(), encoding="utf-8") as fh:
                for l in fh:
                    if not l.strip():
                        continue
                    try:
                        out.append(json.loads(l))
                    except ValueError:
                        continue
        except OSError:
            return []
        return out


def _next_id(rows: list[dict]) -> str:
    return f"s{len(rows) + 1}"


def append(topic: str, actor: str, severity: int, text: str, parent: str | None = None,
           kind: str = "step", now: str | None = None) -> dict:
    rows = _read()
    sev = max(0, min(10, int(severity)))
    step = {"id": _next_id(rows), "ts": _now_iso(now), "topic": topic, "actor": actor,
            "severity": sev, "text": text, "parent": parent, "kind": kind}
    os.makedirs(os.path.dirname(_path()), exist_ok=True)
    with open(_path(), "a", encoding="utf-8") as fh:
        fh.write(json.dumps(step) + "\n")
    return step


def reply(step_id: str, text: str, actor: str = "human", now: str | None = None) -> dict | None:
    rows = _read()
    if not any(r["id"] == step_id for r in rows):
        return None  # never attach a reply to a step that does not exist
    target = next(r for r in rows if r["id"] == step_id)
    # a reply is a step whose parent is the target, kind=correction -> a live system
    # routes it back to re-run/fix that step. It inherits the target's topic.
    return append(target["topic"], actor, 8, text, parent=step_id, kind="correction", now=now)


def thread(topic: str) -> list[dict]:
    return [r for r in _read() if r.get("topic") == topic]


def feed(min_severity: int = 0) -> list[dict]:
    return [r for r in _read() if r.get("severity", 0) >= min_severity]


def _selftest() -> int:
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        os.environ["STEP_JOURNAL_PATH"] = os.path.join(td, "j.jsonl")
        a = append("panel-eval", "zoe", 5, "started shadow eval", now="2026-01-01T00:00:00Z")
        b = append("panel-eval", "critic", 7, "found a disagreement", parent=a["id"], now="2026-01-01T00:01:00Z")
        append("fc-discovery", "zoe", 3, "mining follows", now="2026-01-01T00:02:00Z")
        assert a["id"] == "s1" and b["id"] == "s2", "ids"
        assert b["severity"] == 7 and b["parent"] == "s1", "parent+sev"
        # thread = how the idea progressed (only its topic)
        t = thread("panel-eval")
        assert [r["id"] for r in t] == ["s1", "s2"], f"thread {t}"
        # feed priority filter (the notify>=7 rule)
        hot = feed(min_severity=7)
        assert [r["id"] for r in hot] == ["s2"], f"feed {hot}"
        # reply to a step -> a correction linked to it; reply to a missing step -> None
        r = reply("s2", "wrong - re-run with the frontier model", now="2026-01-01T00:03:00Z")
        assert r and r["kind"] == "correction" and r["parent"] == "s2" and r["topic"] == "panel-eval"
        assert reply("nope", "x") is None, "reply to missing step must be None"
        # severity clamps 0..10
        c = append("t", "x", 99, "clamp", now="2026-01-01T00:04:00Z")
        assert c["severity"] == 10, "clamp"
    print("selftest OK")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="step-journal - topic-threaded severity-tagged agent event log")
    sub = ap.add_subparsers(dest="cmd")
    pa = sub.add_parser("append"); pa.add_argument("topic"); pa.add_argument("actor")
    pa.add_argument("severity", type=int); pa.add_argument("text", nargs="+"); pa.add_argument("--parent")
    pt = sub.add_parser("thread"); pt.add_argument("topic")
    pr = sub.add_parser("reply"); pr.add_argument("step_id"); pr.add_argument("text", nargs="+")
    pf = sub.add_parser("feed"); pf.add_argument("--min-severity", type=int, default=0)
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return _selftest()
    if a.cmd == "append":
        out = append(a.topic, a.actor, a.severity, " ".join(a.text), parent=a.parent)
    elif a.cmd == "reply":
        out = reply(a.step_id, " ".join(a.text))
        if out is None:
            print(f"no step {a.step_id}", file=sys.stderr); return 1
    elif a.cmd == "thread":
        out = thread(a.topic)
    elif a.cmd == "feed":
        out = feed(a.min_severity)
    else:
        ap.print_help(); return 0
    if a.json:
        print(json.dumps(out, indent=2)); return 0
    rows = out if isinstance(out, list) else [out]
    for r in rows:
        pfx = "  \\_ " if r.get("parent") else ""
        print(f"[{r['id']}] {pfx}({r['topic']}) {r['actor']} sev{r['severity']} {r.get('kind','')}: {r['text']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
