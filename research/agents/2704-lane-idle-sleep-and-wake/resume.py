"""Experiment A: the wake cost of exit plus `claude --resume`, measured on this Mac.
In a scratch directory: 3 cold `claude -p` runs and 3 `claude -p --resume <id>` runs on
the session the first cold run made. Each records wall time and Claude Code's own
duration_ms / duration_api_ms, so local startup (wall - api) is split from model time.
Haiku keeps the cost small. Headless -p is a proxy for an interactive resume: same
process start, plugins and MCP servers, no TUI."""
import json, os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
WD = os.path.join(HERE, "resume-wd")
os.makedirs(WD, exist_ok=True)

def run(args):
    t0 = time.time()
    p = subprocess.run(["claude", "-p", *args, "--model", "haiku", "--output-format", "json"],
                       cwd=WD, capture_output=True, text=True, timeout=240)
    wall = round((time.time() - t0) * 1000)
    try:
        j = json.loads(p.stdout.strip().splitlines()[-1])
    except Exception:
        return {"rc": p.returncode, "wall_ms": wall, "error": (p.stderr or p.stdout)[-300:]}
    return {"rc": p.returncode, "wall_ms": wall, "duration_ms": j.get("duration_ms"), "api_ms": j.get("duration_api_ms"),
            "local_ms": wall - (j.get("duration_api_ms") or 0), "session_id": j.get("session_id"),
            "cost_usd": j.get("total_cost_usd"), "result": (j.get("result") or "")[:40]}

out = {"cold": [], "resume": []}
first = None
for i in range(3):
    r = run(["Reply with the single word ok."]); out["cold"].append(r)
    first = first or r.get("session_id")
for i in range(3):
    out["resume"].append(run(["--resume", first, "Reply with the single word ok."]))
print(json.dumps(out, indent=1))
