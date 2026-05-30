---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-29
related-docs: "759, 601, 605, 734, 758"
original-query: "lets recap what we learned and then audit and zao research all the files in github"
tier: STANDARD (independent code-reviewer sub-agent + parent verification of routing/budget math)
scope: "bot/src/zoe/{approvals,dispatch,workers,runs,learn,index,scheduler,relay}.ts on main after PR #728/#727/#729"
---

# 770 - ZOE orchestrator code audit (post-merge, pre-trust)

> **Goal:** Audit the ZOE orchestrator that merged via PR #728 (doc 759 Gaps 1-5) + the relay from #727, before it is trusted with autonomous, cost-incurring runs. Diagnose why the first live smoke test bypassed the orchestrator. Produce a prioritized fix list.

## Method

An independent `code-reviewer` sub-agent audited the eight orchestrator files on `main`, verifying routing regexes and budget math empirically (Node one-liners) rather than by eye. The parent (this session, which wrote the code) independently traced the `handlePrivateMessage` routing order and confirmed the headline findings. Findings the parent could not verify from code alone (CLI tool-lockdown semantics under `permissionMode: 'auto'`) are tagged **needs-verification**.

## Context: the smoke test

Two live `plan:`-style DMs both returned a normal **concierge** answer (ACK `"Got it. Working on this one"`), never the orchestrator (ACK `"Decomposing into a routed plan"`). ZOE *talked* like an orchestrator (offered to "dispatch comms-drafter / hand PR 1 to Hermes") because the persona ROUTING block describes workers — but the dispatch loop never ran.

**Diagnosis (two independent causes, both real):**

1. **Most likely for the observed symptom: stale deploy.** The merged source routes `plan:` correctly (`index.ts:511-513`); a concierge answer with the concierge ACK is what pre-#728 code produces. "Merged on GitHub" != "deployed on the VPS." Confirm with `git log --oneline -1` (want `bac9c4d`) + `systemctl restart zoe-bot`.
2. **A real latent routing bug regardless: the `await-reflection` swallow** (HIGH-1 below). Would not produce *this* symptom (it yields a reflexion reply, not a concierge answer), but will eat `plan:` DMs in a large nightly window once the new code is live.

---

## HIGH severity — fix before any trusted live run

### H1. `await-reflection` unconditionally consumes the next DM (index.ts:455 + scheduler.ts:95)
The evening reflection arms an `await-reflection` pending with a **14h TTL** (`scheduler.ts:30,95`). `handlePrivateMessage` (`index.ts:455`) consumes the *next* DM as the reflection answer **regardless of content** — so a `plan:` (or any command) sent in that ~14h window is swallowed into `handleReflectionAnswer` and never reaches `handlePlanCommand`.
**Fix:** check command prefixes (`PLAN_PREFIX`, `NOTE_PREFIX`, nudge toggle) *before* the pending-interception block, or exempt command-prefixed messages from `await-reflection` capture.

### H2. One pending slot per `'private'` scope — concurrent flows silently clobber (approvals.ts:118)
`pendingByScope` holds exactly one item per scope and every DM is scope `'private'`. An armed `await-reflection` + a new `plan:` → the plan's `setPending` (`index.ts:688`) silently overwrites the reflection pending (or a scheduler learn-cycle overwrites a live plan-gate). Last writer wins, the other flow is lost with no notice. No per-flow ownership token.
**Fix:** either key pending by `(scope, kind)` with a small set, or refuse to arm a new pending when one is live (tell Zaal "you have a pending X — resolve or cancel first").

### H3. Per-plan budget is a post-wave tripwire + unbounded wave parallelism (dispatch.ts:224-262)
The whole `runnable` wave runs concurrently via `Promise.allSettled`; cost is summed and `totalCost > budget` is checked **only after the wave settles** (`:260`). There is **no parallelism cap and no subtask-count ceiling** (verified: `decompose.ts` has neither). 8 parallel `research-worker` subtasks (each $1 cap) can spend ~$8 against a $5 budget in one wave — and spawn 8 concurrent `claude` processes. A malformed 30-subtask plan spawns 30. The "hard per-plan budget" (dispatch.ts:9) is not actually hard.
**Fix:** cap wave concurrency (e.g. 3), add `MAX_SUBTASKS` in decompose, and pre-flight the wave's summed `workerMaxBudget` against remaining budget before launching.

### H4. Read-only lockdown is a leaky Bash denylist under `permissionMode: 'auto'` (workers.ts:52-59,270) — needs-verification
`READ_ONLY_DISALLOW` blocks `Edit`/`Write`/`Bash(git push*|git commit*|git reset*|rm*)` but not `mv`, shell redirection (`> file`), `git clean`, `chmod`, `curl -o`, `npx`/`node` (which can write). `data-runner` explicitly allows `Bash(curl -s*)`. Denylists for `Bash` are inherently leaky, and the read-only guarantee depends entirely on what `permissionMode: 'auto'` does for tools not explicitly denied.
**Fix:** verify CLI semantics; prefer an **allowlist** of exact Bash patterns over a denylist; confirm before granting real spend/write.

### H5. `resolvePendingApproval` / `runApprovedPlan` have no try/catch (index.ts:711-800)
`runApprovedPlan` has no try/catch. `dispatchPlan` never throws by contract, but `ctx.reply` / `replyChunked` / `setPending` (disk write) can. A throw propagates to the grammY handler — grammY logs it, **the user sees nothing**, and pending was already cleared (`:737`) so the plan is silently lost. `dispatchConcierge` has a try/catch; the approval path does not.
**Fix:** wrap the approval-resolution path in try/catch that replies on error; clear pending *after* the side effect succeeds (or re-arm on failure).

---

## MED severity

- **approvals.ts:122 — `parseApprovalReply` misclassifies natural approvals.** `EDIT_RE` matches leading `wait`/`actually`/`change`/`instead`. `"actually yes do it"` → edit; `"change nothing, ship it"` → edit; `"wait"` alone → edit with empty text → re-decompose with empty revision. Reject-first precedence: `"no but go ahead"` → reject.
- **approvals.ts:190 — expiry persist race.** `getPending` does `delete` then `void persist()`; `persist` snapshots the Map at await-time, can interleave with a concurrent `setPending` and write stale. TTL self-heals; low blast radius.
- **dispatch.ts:211 — loop bound assumes unique ids.** `completed` is a `Set`; duplicate subtask ids (decompose doesn't dedupe) make size never reach length → returns `'failed'` with a misleading "dependency unsatisfiable" diagnostic; `outputsById` also collides.
- **dispatch.ts:110 — Hermes runs report `costUsd: 0`.** Hermes spend is tracked in its own DB, so a plan routing subtasks to Hermes runs effectively unbounded against ZOE's plan budget.
- **workers.ts:262-300 — critic-fail silently doubles the cap.** A failing critique triggers a second full `call(feedback)`, each with its own `maxBudgetUsd`. Effective ceiling ≈ `2×maxBudget + 2×criticCost`, not `maxBudget`.
- **index.ts:930 / workers.ts:176 — learnings grow the worker prompt unboundedly.** Approved `learning` text is appended verbatim with no cap/dedupe and spliced into every future worker system prompt → silently rising input-token cost. Zaal approves a summary, not the literal prompt delta.
- **scheduler.ts:69-74 — sentinel idempotency races the send.** `alreadyFired` → work → `markFired`; a restart mid-minute can double-send. Write the sentinel before the side-effecting send (atomic `wx`).
- **relay.ts:37 — group match is case-insensitive substring, first-match-wins.** `"ZAO"` matches `"ZAO Devz"`, `"ZAO Civilization"`, etc. A model-emitted `bot_relay_op` can post to the wrong group with no second confirmation (header asserts external sends are "implicitly approved").

## LOW severity
- `runs.ts` — `void recordRun` (best-effort, can lose on crash); non-atomic JSONL append for long lines; UTC day-boundary clipping in the learn window.
- `learn.ts:144` — `coerceProposals` brace-matching can mis-extract (guarded by `try/JSON.parse`, worst case = no proposals); filename sanitization blocks traversal but allows collisions.
- `workers.ts:236` — unchecked `as ClaudeWorkerKind` cast (defensive gap; dispatch routes hermes away).
- `index.ts:744 / 457` — `clearPending` before the side effect strands reflexion patches / reflection answer on a write failure (user is told, but cannot retry with `y`).
- `approvals.ts:179` — `loadPending` doesn't validate `kind`/payload shape; a corrupt file can produce a malformed pending the resolver mishandles.
- `scheduler.ts:177` — Devz tip cron is a no-op stub logging hourly (Phase-4 placeholder).
- Secondary: `plan:`/nudge/note prefixes are **DM-only** — `handleGroupMessage` (`index.ts:520`) sends everything except `note:` straight to concierge. Undocumented; a plausible "plan: went to concierge" source if a test ran in a group.

---

## Recommended fix order
1. **H1 + H5** (smallest, highest impact): command prefixes bypass the pending block; wrap the approval path in try/catch. Unblocks reliable `plan:` + stops silent plan loss.
2. **H3**: wave concurrency cap + `MAX_SUBTASKS` + pre-flight budget. The real cost/safety guard.
3. **H4**: verify/replace the Bash denylist with an allowlist before granting write/spend.
4. **H2**: per-(scope,kind) pending or refuse-when-busy.
5. MED batch: `parseApprovalReply` tightening, decompose id-dedupe, learnings cap/dedupe, relay exact-match, sentinel-before-send.

## Verification status
Static audit only — no typecheck/tests run, nothing modified. The 69 unit tests cover pure logic (resolver, dispatch scheduling on zero-CLI plans, summarization) but **none of these HIGH findings are exercised by the existing tests** (they need live CLI + concurrent Telegram traffic). Each fix should ship with a regression test where pure (e.g. an `await-reflection`-plus-`plan:` routing test, a duplicate-id dispatch test, a budget-pre-flight test).
