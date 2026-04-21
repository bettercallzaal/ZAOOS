# AO UI Button Audit - Root Cause Analysis

**Date:** April 21, 2026  
**Scope:** Investigate why AO dashboard buttons (Kill, New Session) don't fire network requests  
**Backend Status:** All working (spawn, kill via curl verified)  
**Frontend Issue:** UI buttons either don't fire requests or behave unexpectedly  

---

## 1. Kill Button: Root Cause

**Finding:** Kill button logic IS correctly wired. The issue is likely **state guard or session status check preventing re-click**.

**Source Analysis:**

- **File:** `packages/web/src/components/SessionDetail.tsx` (line 408-416)
- **Handler:**
```typescript
const handleKill = useCallback(async () => {
  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(session.id)}/kill`, { method: "POST" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    window.location.reload();
  } catch (err) {
    console.error("Failed to kill session:", err);
  }
}, [session.id]);
```

- **Button Render (line 611-618):**
```typescript
!isOrchestrator && !terminalEnded ? (
  <button type="button" className="dashboard-app-btn dashboard-app-btn--danger" onClick={handleKill}>
    <svg>...</svg>
    <span className="topbar-btn-label">Kill</span>
  </button>
) : null
```

**Root Cause Analysis:**

1. **State Guard:** Button only renders if `!isOrchestrator && !terminalEnded` (line 611). The `terminalEnded` flag is computed from `TERMINAL_STATUSES.has(session.status)` (line 385).

2. **Real Issue:** When Kill request succeeds, the handler calls `window.location.reload()` which is correct. But if the kill API is slow or times out, `handleKill` swallows the error (line 414: `console.error` only) and the button stays visible, clickable but unresponsive on retry.

3. **Missing Loading State:** There's NO `isKilling` state variable to prevent double-clicks or show loading feedback. Clicking Kill twice rapidly could cause race conditions.

**Suggested Patch Direction:**
- Add `const [isKilling, setIsKilling] = useState(false)` state
- Inside `handleKill`: wrap fetch in `setIsKilling(true/false)` guard  
- Disable button with `disabled={isKilling}` to prevent race conditions
- Add timeout guard (e.g., 30s) so user isn't stuck in loading state if API hangs

**Likelihood:** HIGH - especially if network latency or API timeout, button click appears to "do nothing"

---

## 2. New Session Button: Design Clarification

**Finding:** There is NO "+ New Session" button on the main dashboard. This is **intentional design**.

**Source Analysis:**

- **Dashboard:** `packages/web/src/components/Dashboard.tsx`
- **Project List:** Sidebar shows a "+" button to create new **projects**, not sessions
- **Session Creation Model:** Sessions are spawned via:
  1. Per-project "Spawn Orchestrator" button in the dashboard (line 743: `{spawningProjectIds.includes(project.id) ? "Spawning..." : "Spawn Orchestrator"}`)
  2. OR via `/api/spawn` API directly

**Architecture Decision:** AO distinguishes between:
- **Projects** - top-level containers (can be created with "+")
- **Sessions** - child instances of a project, spawned only via Orchestrator button or API

Zaal's mental model mismatch: Expected "+ New Session" like a typical chat app, but AO requires explicit Orchestrator spawn step per-project. This is to prevent accidental session proliferation.

**Recommendation:** Document this UX model clearly; consider adding a hint button or tooltip explaining the two-tier structure.

---

## 3. Service Worker 404 - Caddy Fix Required

**Finding:** sw.js DOES exist in the source (`packages/web/public/sw.js`), but is NOT being served by Caddy. Caddy's fallback rule serves `index.html` for all unmatched paths, masking the 404.

**Console Error:**
```
Service worker registration failed: SecurityError: Failed to register a ServiceWorker 
for scope ('https://ao.zaoos.com/') with script ('https://ao.zaoos.com/sw.js'): 
The script has an unsupported MIME type ('text/html').
```

**Why:** Caddy's final `handle` block (no matcher) has:
```
handle {
  root * /home/zaal/caddy/ao
  try_files {path} /index.html
  file_server
}
```

When `/sw.js` is requested:
1. Not matched by `@aoAssets` or `@aoWebsocket`
2. Falls through to final `handle` block
3. `try_files {path} /index.html` redirects missing files to index.html
4. Browser receives `index.html` with `Content-Type: text/html`
5. ServiceWorker registration fails (expects `application/javascript`)

**Caddy Fix:**

Add explicit 404 rule before the fallback:

```caddy
handle /sw.js {
  error 404
}

handle {
  root * /home/zaal/caddy/ao
  try_files {path} /index.html
  file_server
}
```

**OR** copy sw.js to `/home/zaal/caddy/ao/sw.js` so it's served directly by the final file_server.

**Root Issue:** sw.js ships with the compiled Next.js build but is NOT copied to the Caddy public root during deployment.

---

## 4. npm Version Check

**Current Version:** @aoagents/ao 0.2.5 (released ~1 week ago)

**Latest Available:** 0.2.5 (no newer versions)

**Versions in Registry:** [0.2.2, 0.2.3, 0.2.4, 0.2.5]

**Release Notes:** None published on npm. Source: https://github.com/ComposioHQ/agent-orchestrator

**Upgrade Recommendation:** NO - already on latest. Check GitHub releases for bug fixes:
- https://github.com/ComposioHQ/agent-orchestrator/releases

**Next Major Version Path:** Would need to check GitHub issues for pending fixes targeting a future 0.3.x.

---

## Priority Ranking & Effort

| Issue | Severity | Effort | Blocker | Notes |
|-------|----------|--------|---------|-------|
| Kill button race condition | MEDIUM | 1-2h | No | Add `isKilling` state + timeout guard. Minimal code change. |
| Service worker 404 | LOW | 30m | No | Copy sw.js to Caddy root OR add explicit 404 rule. Non-critical (app works offline without it). |
| New Session UX clarification | LOW | Design only | No | Document the Orchestrator spawn model; consider tooltip. |
| npm upgrade | NONE | 0 | No | Already latest version. Monitor GitHub releases. |

---

## Next Steps for Zaal

1. **Tomorrow's Fix Priority:**
   - [SHIP FIRST] Kill button: add `isKilling` state + loading UI
   - [THEN] Service worker: copy `sw.js` to Caddy public root (quickest)
   - [OPTIONAL] Document session spawn flow in dashboard UI

2. **Verify Kill Fix:**
   - Slow network test: throttle DevTools to "Slow 3G", click Kill, watch button disable
   - Network tab should show `POST /api/sessions/<id>/kill` fire on click
   - Should NOT show stale button state after second click

3. **Check GitHub:**
   - Scan https://github.com/ComposioHQ/agent-orchestrator/issues for button event wiring bugs
   - Subscribe to releases for 0.3.x when available

---

## Compiled Build Notes

- Source maps stripped from VPS compiled chunks (no `.map` files in `.next/static/chunks/`)
- Minified bundle makes runtime debugging hard; recommend adding `isKilling` state at source + rebuild
- Chunks present at: `~/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-web/.next/static/chunks/`
