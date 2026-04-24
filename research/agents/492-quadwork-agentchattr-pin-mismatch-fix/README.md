# 492 — QuadWork v1.12.0 ↔ AgentChattr Pin Mismatch (Setup Bug + Fix)

> **Status:** Root-caused, patched, documented
> **Date:** 2026-04-24
> **Goal:** Explain why QuadWork's new-project wizard produces a broken AgentChattr install, document the exact fix, and update the `/quad` skill so this doesn't hit future projects.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Immediate fix (already applied to `quad-sandbox`) | USE `git checkout <pin>` in the per-project AC dir to roll back the wizard's main-branch clone to the pin QuadWork actually supports. |
| Should we upgrade QuadWork or AC instead? | SKIP for now. Bug is a wizard/doctor mismatch inside v1.12.0 — fix per-project, file upstream later. |
| `/quad` skill update? | USE — add `/quad fix-pin <project-id>` sub-command that runs the stash + checkout + reinstall + restart flow automatically. |
| Doctor as first-line diagnostic | USE — `quadwork doctor` correctly identifies `[DIFF]` per-project installs. Make it part of `/quad status`. |
| Operator action when wizard runs on future project | After each `quadwork add-project`, run `quadwork doctor` and if `[DIFF]` appears, run the fix below **before** the first batch. |

## Comparison of Options

| Fix approach | Reversibility | Upgrade-safe | Complexity | Verdict |
|---|---|---|---|---|
| `git checkout <pin>` in per-project AC | High — reversible via `git checkout main` | Yes — survives QuadWork upgrade | Low | **USE** |
| Delete + re-clone at pin | Medium | Yes | Medium | Fallback if checkout fails |
| Patch QuadWork source (`--config` → `--port`) | Low — lost on `npm i -g quadwork` | No | High | SKIP |
| Patch AC v0.4.0 to accept `--config` | Low — lost on re-clone | No | High | SKIP |
| File upstream issue + wait | Free | Yes | Zero effort | Do this in parallel |

## Symptoms (what you see)

1. Dashboard at `http://127.0.0.1:8400` loads fine.
2. Chat panel shows `Loading messages...` forever.
3. Red banner: `Failed to fetch` or `Send failed: 502`.
4. Sidebar shows: `Backend offline`.
5. QuadWork process crashes shortly after browser opens with:
   ```
   Error: Failed to register head: register head: fetch failed
       at buildAgentArgs (server/index.js:401:15)
       at spawnAgentPty (server/index.js:529:17)
   ```
6. `lsof -iTCP:8300` shows nothing listening even though server log says `✓ AgentChattr started`.

## Root Cause

**Version mismatch between QuadWork v1.12.0 and the AgentChattr version its wizard cloned.**

### Evidence

QuadWork expects AC at pin `3e71d4267572579e7ffeb83576645f90932c1849` (confirmed via `quadwork doctor`):

```
Expected pin: 3e71d4267572579e7ffeb83576645f90932c1849
[OK  ] global: 3e71d42... branch=pinned  (/Users/.../.quadwork/agentchattr)
[DIFF] project:quad-sandbox: 0440f5d99b56421958ee3d020e9029a7ae87a3b6 branch=main
```

The wizard's `quadwork init` clones AC at the pin into `~/.quadwork/agentchattr/` (global) — correct. But the per-project wizard (`/setup` flow) clones AC's **main branch HEAD** into `~/.quadwork/<project-id>/agentchattr/` — incorrect. As of 2026-04-24, main is at commit `0440f5d` (v0.4.0).

QuadWork spawns AC like this (`server/index.js` line 824):
```js
const extraArgs = (projectConfigToml && fs.existsSync(projectConfigToml))
  ? ["--config", projectConfigToml]
  : ["--port", chattrPort];
```

AC v0.4.0's `run.py` has a strict `argparse` that rejects unknown flags. `--config` is NOT in its arg list — AC crashes at import with:

```
run.py: error: unrecognized arguments: --config /path/to/config.toml
```

AC at the pinned version (`3e71d42`) has NO argparse at all in `run.py` — it reads `ROOT/config.toml` directly and silently ignores extra `sys.argv` entries. QuadWork's `--config <path>` is harmless to the pin, breaks v0.4.0.

`stdio: "ignore"` on the spawn hides the crash from the log, so QuadWork reports success while the child is already dead. The health monitor fires, notices AC is down, triggers reset, the reset fails, and when the browser opens a WebSocket and tries to spawn an agent terminal the uncaught error crashes the whole Node server.

## The Fix (exact commands, past-tense — already applied to `quad-sandbox`)

```bash
# 1. Stop everything
pkill -f quadwork
pkill -f 'python.*run\.py'

# 2. Roll the per-project AC back to the pin QuadWork expects.
#    The wizard leaves QuadWork's own patches dirty in the worktree
#    (config.toml + static/chat.js + static/style.css), so stash first.
cd ~/.quadwork/quad-sandbox/agentchattr
git stash push -u -m "quadwork-local-patches"
git checkout 3e71d4267572579e7ffeb83576645f90932c1849

# 3. Reinstall deps against the pinned requirements
.venv/bin/pip install -r requirements.txt

# 4. Restart QuadWork (detached so it survives)
cd ~ && nohup quadwork start > ~/.quadwork/server.log 2>&1 &
disown

# 5. Verify
sleep 8
lsof -iTCP:8300,8400 -sTCP:LISTEN -P
curl -s -o /dev/null -w "dashboard: %{http_code}\nagentchattr: %{http_code}\n" \
  http://127.0.0.1:8400/ http://127.0.0.1:8300/
quadwork doctor
```

Expected `doctor` after fix: `[DETACH] project:<id>: 3e71d42... branch=(detached)` — detached head but on correct SHA. Per the legend "`[DETACH]` on pin but in detached HEAD (re-run quadwork start to auto-migrate)" — auto-migrates to the `pinned` branch name on next cycle.

## `/quad fix-pin <project-id>` — New Sub-Command

Add to `~/.claude/skills/quad/SKILL.md` so this is a one-liner next time:

```bash
PROJ="$1"
AC="$HOME/.quadwork/$PROJ/agentchattr"
pkill -f quadwork 2>/dev/null
pkill -f 'python.*run\.py' 2>/dev/null
sleep 2
cd "$AC" || exit 1
git stash push -u -m "quadwork-local-patches-$(date +%s)" 2>/dev/null
EXPECTED=$(quadwork doctor 2>&1 | awk '/Expected pin:/ {print $3}')
git checkout "$EXPECTED" || exit 2
.venv/bin/pip install -q -r requirements.txt
cd ~ && nohup quadwork start > ~/.quadwork/server.log 2>&1 &
disown
sleep 8
quadwork doctor
```

## Specific Numbers

- **QuadWork version:** `1.12.0` (npm, published 2 days before this doc).
- **Expected AC pin:** `3e71d4267572579e7ffeb83576645f90932c1849`.
- **Bad wizard clone:** `0440f5d99b56421958ee3d020e9029a7ae87a3b6` (v0.4.0 bump commit).
- **Affected flag:** `--config <path>` — accepted by global AC (silent ignore), rejected by v0.4.0 (argparse error).
- **Crash site:** `server/index.js:401` in `buildAgentArgs`, fired from `spawnAgentPty` (line 529), triggered by browser WebSocket.
- **Diagnosis tool:** `quadwork doctor` shows `[DIFF]` row for affected project.
- **Fix time:** under 1 minute per project.

## Applied To

- `quad-sandbox` — 2026-04-24 — confirmed dashboard + AC both 200 after fix. Doctor shows `[DETACH]` on correct SHA (auto-migrates to `pinned` branch).

## Follow-ups / Upstream

- File upstream issue at https://github.com/realproject7/quadwork with this writeup. Either:
  - The wizard's per-project clone should `git checkout <pin>` after `git clone`, OR
  - QuadWork should stop passing `--config` when AC version doesn't support it, OR
  - v0.4.0 AC should accept and ignore unknown flags (safer upgrade path).
- Watch for repeat hits when we add `zao-chat` and `zao-brain` to QuadWork (doc 491). Run `quadwork doctor` immediately after each `add-project`.

## ZAO Ecosystem Integration

- `~/.claude/skills/quad/SKILL.md` — add `fix-pin` sub-command per above
- `~/.quadwork/<project-id>/agentchattr/` — per-project clone, the thing that breaks
- `.claude/rules/` — no change; this is agent infra, not ZAO OS rule surface
- Related: doc 487 (QuadWork general eval), doc 491 (install plan for 3-repo split)
- No impact on ZAO OS repo directly. Only impacts projects added to QuadWork.

## Sources

- [QuadWork 1.12.0 on npm](https://www.npmjs.com/package/quadwork)
- [QuadWork GitHub](https://github.com/realproject7/quadwork)
- [AgentChattr GitHub](https://github.com/bcurts/agentchattr)
- [AgentChattr pin 3e71d42](https://github.com/bcurts/agentchattr/commit/3e71d4267572579e7ffeb83576645f90932c1849)
- [AgentChattr v0.4.0 bump 0440f5d](https://github.com/bcurts/agentchattr/commit/0440f5d99b56421958ee3d020e9029a7ae87a3b6)
- Local log: `~/.quadwork/server.log`
- Doctor output: `quadwork doctor`
