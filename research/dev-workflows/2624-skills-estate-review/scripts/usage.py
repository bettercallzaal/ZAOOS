#!/usr/bin/env python3
"""Read-only skill usage + follow-on measurement over Claude Code transcripts.

usage.py <days> <out.json>
Counts, inside the window (by each record's own timestamp, never file mtime):
  TOOL   assistant tool_use with name == "Skill"           (deduped by tool_use id)
  SLASH  user record whose content carries <command-name>/x (deduped by record uuid)
         split into typed vs scheduled (scheduledTaskId present = a /loop re-fire)
For each invocation it also records what followed in the same file until the
next human-typed prompt: tool calls, tool errors, interrupts, and that prompt.
"""
import json, os, re, sys, subprocess
from datetime import datetime, timedelta, timezone
from multiprocessing import Pool

DAYS = int(sys.argv[1]); OUT = sys.argv[2]
ROOT = os.path.expanduser("~/.claude/projects")
NOW = datetime.now(timezone.utc)
CUT = (NOW - timedelta(days=DAYS)).strftime("%Y-%m-%dT%H:%M:%S")
CMD = re.compile(r"<command-name>/?([^<\s]+)</command-name>")
NOT_HUMAN = ("<command-", "<local-command", "<system-reminder", "<task-notification", "Caveat:",
             "[Request interrupted", "<bash-", "<user-prompt-submit-hook", "Another Claude session",
             "<cross-session-message", "This session is being continued", "<teammate-message",
             "[Cross-session", "<scheduled", "Stop hook feedback", "<tick>")


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(i.get("text", "") for i in content if isinstance(i, dict) and i.get("type") == "text")
    return ""


def scan(path):
    try:
        with open(path, "rb") as fh:
            blob = fh.read()
    except OSError:
        return {"path": path, "err": "unreadable", "inv": []}
    if b'"name":"Skill"' not in blob and b"<command-name>" not in blob:
        return {"path": path, "inv": [], "skipped": True}
    recs = []
    bad = 0
    for line in blob.split(b"\n"):
        if not line.strip():
            continue
        try:
            recs.append(json.loads(line))
        except Exception:
            bad += 1
    inv = []
    rel = os.path.relpath(path, ROOT)
    project = rel.split(os.sep)[0]
    sub = "subagents" in rel.split(os.sep)
    for idx, r in enumerate(recs):
        ts = r.get("timestamp") or ""
        if ts[:19] < CUT:
            continue
        m = r.get("message") if isinstance(r.get("message"), dict) else {}
        c = m.get("content")
        found = []
        if r.get("type") == "assistant" and isinstance(c, list):
            for it in c:
                if isinstance(it, dict) and it.get("type") == "tool_use" and it.get("name") == "Skill":
                    found.append(("TOOL", str((it.get("input") or {}).get("skill", "")).lstrip("/"), it.get("id"),
                                  str((it.get("input") or {}).get("args", ""))[:200]))
        elif r.get("type") == "user" and not r.get("toolUseResult"):
            t = text_of(c)
            if "<command-name>" in t[:600]:
                mm = CMD.search(t[:600])
                if mm:
                    kind = "SCHED" if (r.get("scheduledTaskId") or r.get("scheduledFireId")) else "SLASH"
                    am = re.search(r"<command-args>(.*?)</command-args>", t, re.S)
                    found.append((kind, mm.group(1), r.get("uuid"), (am.group(1)[:200] if am else "")))
        for kind, name, key, args in found:
            e = {"kind": kind, "skill": name, "key": key, "ts": ts, "project": project, "file": rel,
                 "sidechain": bool(r.get("isSidechain")) or sub, "session": r.get("sessionId"),
                 "cwd": r.get("cwd"), "args": args,
                 "launch_ok": None, "launch_msg": "", "tools": 0, "errors": 0, "interrupted": False,
                 "next_human": None, "next_human_secs": None, "reinvoked_in_window": False, "err_samples": []}
            for r2 in recs[idx + 1: idx + 1 + 400]:
                m2 = r2.get("message") if isinstance(r2.get("message"), dict) else {}
                c2 = m2.get("content")
                if r2.get("type") == "assistant" and isinstance(c2, list):
                    for it in c2:
                        if isinstance(it, dict) and it.get("type") == "tool_use":
                            if it.get("name") == "Skill" and str((it.get("input") or {}).get("skill", "")).lstrip("/") == name:
                                e["reinvoked_in_window"] = True
                            e["tools"] += 1
                elif r2.get("type") == "user":
                    if isinstance(c2, list) and any(isinstance(i, dict) and i.get("type") == "tool_result" for i in c2):
                        for it in c2:
                            if not (isinstance(it, dict) and it.get("type") == "tool_result"):
                                continue
                            s = it.get("content")
                            s = s if isinstance(s, str) else json.dumps(s)[:400]
                            if it.get("tool_use_id") == key:
                                e["launch_ok"] = not it.get("is_error")
                                e["launch_msg"] = (s or "")[:160]
                            elif it.get("is_error"):
                                e["errors"] += 1
                                if len(e["err_samples"]) < 3:
                                    e["err_samples"].append((s or "")[:200])
                        continue
                    t2 = text_of(c2)
                    if "[Request interrupted" in t2:
                        e["interrupted"] = True
                        continue
                    if r2.get("isMeta") or r2.get("isSidechain") or r2.get("isCompactSummary"):
                        continue
                    st = t2.lstrip()
                    if not st or st.startswith(NOT_HUMAN):
                        if "<command-name>" in st[:600]:
                            mm = CMD.search(st[:600])
                            if mm and mm.group(1) == name:
                                e["reinvoked_in_window"] = True
                        continue
                    e["next_human"] = st[:400]
                    try:
                        a = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                        b = datetime.fromisoformat((r2.get("timestamp") or ts).replace("Z", "+00:00"))
                        e["next_human_secs"] = int((b - a).total_seconds())
                    except Exception:
                        pass
                    break
            inv.append(e)
    return {"path": path, "inv": inv, "bad": bad}


if __name__ == "__main__":
    # find, not a shell glob: `ls */*.jsonl` overflows the arg list here and reads as zero files
    cutoff_m = (NOW - timedelta(days=DAYS + 1)).timestamp()
    files = []
    total = 0
    for base, dirs, fs in os.walk(ROOT):
        for f in fs:
            if f.endswith(".jsonl"):
                total += 1
                p = os.path.join(base, f)
                try:
                    if os.path.getmtime(p) >= cutoff_m:
                        files.append(p)
                except OSError:
                    pass
    with Pool(8) as pool:
        res = pool.map(scan, files, chunksize=20)
    seen = set(); inv = []; dup = 0
    for r in res:
        for e in r["inv"]:
            k = (e["kind"], e["key"])
            if e["key"] and k in seen:
                dup += 1
                continue
            seen.add(k)
            inv.append(e)
    meta = {"days": DAYS, "window_start_utc": CUT, "now_utc": NOW.isoformat(), "jsonl_total": total,
            "jsonl_in_mtime_window": len(files), "files_with_invocations": sum(1 for r in res if r["inv"]),
            "files_skipped_no_marker": sum(1 for r in res if r.get("skipped")),
            "files_unreadable": sum(1 for r in res if r.get("err")),
            "bad_json_lines": sum(r.get("bad", 0) for r in res), "duplicates_dropped": dup,
            "invocations": len(inv)}
    json.dump({"meta": meta, "inv": inv}, open(OUT, "w"))
    print(json.dumps(meta, indent=1))
