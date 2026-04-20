# AO Claude Code Dialog Block Forensics - Doc 451

**Date:** 2026-04-20  
**Status:** RESEARCH - Do Not Apply Yet  
**Affected Sessions:** zaoos-39, zaoos-40, zaoos-41  
**Root Cause:** Claude Code auto-updater dialog blocking stdin — sessions spawn correctly but hang waiting for dialog dismissal

---

## Key Findings

| Finding | Detail |
|---------|--------|
| Dialog Text | `Auto-update failed · Try claude doctor or npm …` |
| Blocker Type | User-facing dialog (not permission dialog) |
| Current Patch Applied | Yes — `--permission-mode acceptEdits` already in plugin |
| Env Var Name | `CLAUDE_AUTOUPDATER_DISABLE=1` (Anthropic default for CI) |
| Plugin File | `~/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-plugin-agent-claude-code/dist/index.js` |
| Plugin Version | @aoagents/ao-plugin-agent-claude-code v0.2.5 |
| Claude Code Version | 2.1.86 |

---

## Problem Statement

Sessions zaoos-40 and zaoos-41 are still alive (created Mon Apr 20 00:19:29-38 2026), but the Claude Code prompt is frozen. Tmux capture shows:

```
⏵⏵ accept edits on (shift ✗ Auto-update failed · Try claude doctor or npm …
```

The prompt is displayed but Claude Code never processes it. The dialog message appears to be from Claude's auto-updater check failing, not a permission issue. This is distinct from the earlier permission-dialog blocker fixed by the `--permission-mode acceptEdits` patch.

Cause: Claude Code spawns and shows the task context, but when it tries to present the next prompt, the auto-updater dialog appears. Since we can't interact with tmux dialogs in headless mode, the session hangs indefinitely.

---

## Exact Dialog Output

From `tmux capture-pane -t 2883535895a7-zaoos-40 -p -S -200`:

```
⏵⏵ accept edits on (shift ✗ Auto-update failed · Try claude doctor or npm …
```

This indicates:
- Claude Code CLI is running (`⏵⏵ accept edits on`)
- A dialog is blocking (shift key symbol)
- Auto-update check failed or was skipped
- User interaction required to dismiss

---

## Solution: Environment Variable Injection

**Env Var:** `CLAUDE_AUTOUPDATER_DISABLE=1`

Claude Code respects `CLAUDE_AUTOUPDATER_DISABLE` to skip the updater check entirely. This is the standard Anthropic pattern for CI/automation environments.

---

## Proposed Patch

File: `~/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-plugin-agent-claude-code/dist/index.js`

Location: `getEnvironment()` function around line 612.

```diff
         getEnvironment(config) {
             const env = {};
+            // Disable Claude Code auto-updater in orchestrator context (headless)
+            env["CLAUDE_AUTOUPDATER_DISABLE"] = "1";
             // Unset CLAUDECODE to avoid nested agent conflicts
             env["CLAUDECODE"] = "";
             // Set session info for introspection
             env["AO_SESSION_ID"] = config.sessionId;
```

This adds one line to the environment object returned by `getEnvironment()`, ensuring every spawned Claude Code session runs with the auto-updater disabled.

---

## Verification Steps

Once patched:

1. Kill current hung sessions (or let them timeout)
2. Run a new AO session spawn
3. Monitor tmux pane: `tmux capture-pane -t <name> -p -S -50`
4. Verify Claude Code processes prompt immediately (no "Auto-update failed" dialog)
5. Check session logs for successful tool invocation

Respawn command:
```bash
# On VPS, once patched:
curl -X POST http://localhost:3000/spawn-session \
  -H "Content-Type: application/json" \
  -d '{"agentName":"claude-code","task":"Your test prompt here"}'
```

---

## Why This Happens

- Claude Code v2.1.86 checks for updates on startup (networking call)
- In VPS headless environment, no TTY → dialog can't be dismissed
- Prompt is already rendered, waiting for user to hit a key → deadlock
- `--permission-mode acceptEdits` bypasses permission dialogs but NOT updater dialogs (separate system)

---

## Alternative: Source-Level Patch

If the above env var patch doesn't work, the AO plugin could also inject the env var at Claude spawn time using `execFileAsync()` options:

```typescript
// In getLaunchCommand or spawn logic
const env = { ...process.env, ...config.environment };
env["CLAUDE_AUTOUPDATER_DISABLE"] = "1";
execFileAsync("claude", [...args], { env });
```

But `getEnvironment()` is cleaner and follows the plugin's existing pattern.

---

## Files Involved

- Plugin source: `~/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-plugin-agent-claude-code/dist/index.js`
- Sessions: `~/.agent-orchestrator/2883535895a7-ZAOOS/`
- Tmux windows: `2883535895a7-zaoos-40`, `2883535895a7-zaoos-41`
- Lifecycle log: `~/.agent-orchestrator/2883535895a7-ZAOOS/lifecycle-worker.log`

---

## Timeline

- zaoos-40 created: 2026-04-20T00:19:29Z
- zaoos-41 created: 2026-04-20T00:19:38Z
- Hung state detected: ~00:20Z (right after spawn, before prompt processing)
- Status at forensics: Still alive, frozen on dialog (2026-04-20T09:15Z)

---

## Do Not Apply

This is research only. Wait for explicit instruction before patching the plugin file on the VPS. The hung sessions are safe to leave running and can be killed manually if needed.
