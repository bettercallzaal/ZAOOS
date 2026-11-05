"""Experiment B: what SIGSTOP does to an idle process on this Mac, measured.
Starts stopper.js (120 MB touched heap, a unix socket, one child), then:
RSS before; SIGSTOP the parent only; child state; a socket request with a 5 s timeout;
RSS at +60 s and +180 s while stopped; SIGCONT; the same request and its latency.
Cleans up only the processes it started, by pid."""
import json, os, signal, socket, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
SOCK = f"/tmp/quidli-stop-{os.getpid()}.sock"   # macOS caps a unix socket path at 104 bytes

def rss_mb(pid):
    out = subprocess.run(["ps", "-o", "rss=", "-p", str(pid)], capture_output=True, text=True).stdout.strip()
    return round(int(out) / 1024, 1) if out else None

def state(pid):
    return subprocess.run(["ps", "-o", "stat=", "-p", str(pid)], capture_output=True, text=True).stdout.strip()

def ask(timeout):
    t0 = time.time()
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect(SOCK)
        connected = round((time.time() - t0) * 1000, 1)
        s.sendall(b"ping")
        data = s.recv(16)
        return {"connected_ms": connected, "reply": data.decode(), "reply_ms": round((time.time() - t0) * 1000, 1)}
    except Exception as e:
        return {"error": type(e).__name__, "after_ms": round((time.time() - t0) * 1000, 1)}
    finally:
        s.close()

p = subprocess.Popen(["node", os.path.join(HERE, "stopper.js"), SOCK], stdout=subprocess.PIPE, text=True)
info = json.loads(p.stdout.readline())
pid, child = info["pid"], info["child"]
time.sleep(2)
res = {"rss_before_mb": rss_mb(pid), "ask_running": ask(5)}
os.kill(pid, signal.SIGSTOP)
time.sleep(1)
res["state_parent_stopped"] = state(pid)
res["state_child_after_parent_stop"] = state(child)
res["ask_while_stopped"] = ask(5)
time.sleep(55); res["rss_stopped_60s_mb"] = rss_mb(pid)
time.sleep(120); res["rss_stopped_180s_mb"] = rss_mb(pid)
res["swap_at_180s"] = subprocess.run(["sysctl", "-n", "vm.swapusage"], capture_output=True, text=True).stdout.strip()
t0 = time.time(); os.kill(pid, signal.SIGCONT)
res["ask_after_cont"] = ask(10)
res["rss_after_cont_mb"] = rss_mb(pid)
for x in (child, pid):
    try: os.kill(x, signal.SIGTERM)
    except ProcessLookupError: pass
p.wait(timeout=10)
try: os.unlink(SOCK)
except FileNotFoundError: pass
print(json.dumps(res, indent=1))
