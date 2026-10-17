"""Cost per turn (one deduplicated API message) by UTC day, at the new zao-spend
rates (PR #538 head e56da4c) and at the old table, plus quartiles of the longest session.
usage: python3 -I turn.py <path-to-new-zao-spend> <days>"""
import sys, json, importlib.machinery, importlib.util
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

loader = importlib.machinery.SourceFileLoader("zs", sys.argv[1])
spec = importlib.util.spec_from_loader("zs", loader); zs = importlib.util.module_from_spec(spec); loader.exec_module(zs)
DAYS = int(sys.argv[2])
OLD = {"opus": (15, 75, 18.75, 1.5), "sonnet": (3, 15, 3.75, .3), "haiku": (1, 5, 1.25, .1), "fable": (3, 15, 3.75, .3)}
def old_cost(model, u):
    m = (model or "").lower(); r = next((v for k, v in OLD.items() if k in m), (3, 15, 3.75, .3))
    t = (u.get("input_tokens", 0) or 0, u.get("output_tokens", 0) or 0, u.get("cache_creation_input_tokens", 0) or 0, u.get("cache_read_input_tokens", 0) or 0)
    return sum(a * b for a, b in zip(t, r)) / 1e6

now = datetime.now(timezone.utc); since = (now - timedelta(days=DAYS)).replace(hour=0, minute=0, second=0, microsecond=0)
day = defaultdict(lambda: {"n": 0, "new": 0.0, "old": 0.0, "unpriced": 0})
model = defaultdict(lambda: {"n": 0, "new": 0.0})
sessions = {}
for f in zs.PROJECTS.rglob("*.jsonl"):
    try:
        if datetime.fromtimestamp(f.stat().st_mtime, timezone.utc) < since: continue
    except OSError: continue
    by_id, noid = {}, []
    with f.open(errors="replace") as fh:
        for line in fh:
            if '"usage"' not in line: continue
            try: d = json.loads(line)
            except json.JSONDecodeError: continue
            ts = zs.parse_ts(d.get("timestamp", "")); msg = d.get("message") or {}; u = msg.get("usage")
            if not (u and ts and ts >= since): continue
            item = (ts, msg.get("model") or "unknown", u)
            if msg.get("id"): by_id[msg["id"]] = item
            else: noid.append(item)
    items = sorted(list(by_id.values()) + noid, key=lambda x: x[0])
    seq = []
    for ts, m, u in items:
        acc = {"tok": [0, 0, 0, 0], "cost": 0.0, "models": set(), "unpriced": defaultdict(int)}
        zs.price_message(m, u, acc)
        if not any(zs.usage_parts(u)): continue
        k = ts.date().isoformat(); dd = day[k]
        dd["n"] += 1; dd["new"] += acc["cost"]; dd["old"] += old_cost(m, u); dd["unpriced"] += sum(acc["unpriced"].values())
        lab = zs.rate_for(m)[0]; model[lab]["n"] += 1; model[lab]["new"] += acc["cost"]
        seq.append(acc["cost"])
    sessions[f] = seq

print(f"window from {since.isoformat()} to {now.isoformat()}, PROJECTS={zs.PROJECTS}")
print("day         turns    new$      new$/turn  old$       old$/turn  unpriced")
T = {"n": 0, "new": 0.0, "old": 0.0, "unpriced": 0}
for k in sorted(day):
    d = day[k]; [T.__setitem__(x, T[x] + d[x]) for x in T]
    print(f"{k}  {d['n']:6d}  {d['new']:9.2f}  {d['new']/d['n']:8.3f}  {d['old']:9.2f}  {d['old']/d['n']:8.3f}  {d['unpriced']}")
print(f"TOTAL       {T['n']:6d}  {T['new']:9.2f}  {T['new']/T['n']:8.3f}  {T['old']:9.2f}  {T['old']/T['n']:8.3f}  {T['unpriced']}")
print("\nmodel        turns    new$/turn")
for k, v in sorted(model.items(), key=lambda kv: -kv[1]["n"]):
    print(f"{k:12s} {v['n']:7d}  {v['new']/v['n'] if v['n'] else 0:8.3f}")
f, seq = max(sessions.items(), key=lambda kv: len(kv[1]))
q = len(seq) // 4
print(f"\nlongest session in window: {len(seq)} turns; $/turn by quarter:",
      [round(sum(seq[i*q:(i+1)*q]) / q, 3) for i in range(4)] if q else "too short")
