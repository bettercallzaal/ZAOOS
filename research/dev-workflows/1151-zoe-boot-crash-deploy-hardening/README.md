---
topic: dev-workflows
type: incident-postmortem
status: research-complete
last-validated: 2026-07-16
related-docs: 928, 994, 601
original-query: "/zao-research the problem that just happened and many solutions and try them all (the ZOE bot boot-crash from a union-merged code conflict + a vacuous boot-verify)"
tier: STANDARD
---

# 1151 - ZOE Boot-Crash Postmortem + Deploy Hardening

> **Goal:** Document the 2026-07-16 incident where ZOE (the orchestrator bot) went offline because broken code shipped to the live VPS, root-cause the three stacked failures, and record the fixes that were built and deployed so it cannot recur.

## What happened (timeline)

1. A Telegram-feature PR (#1518) had a git conflict inside `bot/src/zoe/tg-interactions.ts`.
2. The conflict was resolved with a **union merge** (concatenate both sides, drop duplicate lines) - a resolution strategy that is only safe for append-only prose.
3. On code, the union merge duplicated blocks and dropped braces inside `handleReplyRoute`, producing an invalid file. esbuild/tsx reported `Unexpected "catch"` at line 329.
4. A boot-verify step "passed" - but it ran `npx esbuild`, esbuild was not installed, and the missing-binary code path exited 0. Nothing was actually verified.
5. The broken code was deployed. ZOE crashed on boot and stopped polling `@zaoclaw_bot`. The whole ZOE surface (the bot Zaal talks to) went silent.

## Root cause - three independent failures, stacked

Any ONE of these alone would have caught the bug. All three failed at once, so broken code reached a running service.

| # | Failure | Why it slipped |
|---|---------|----------------|
| 1 | **Union-merged a CODE conflict** | Union (dedupe-lines) is only valid for append-only prose (markdown). On code it silently corrupts structure. This was a manual resolution choice, not a git `merge=union` driver (there is no `.gitattributes` in the repo - verified). |
| 2 | **Boot-verify passed vacuously** | It shelled `npx esbuild`; esbuild absent; the not-found path exited 0. A verifier that cannot run has verified nothing, but the pipeline read exit 0 as "green". |
| 3 | **Verified the LIVE clone in place, deployed without a real check** | The bad edit was already on the live clone before any verify ran; the restart loaded it. No fresh-checkout gate between "code" and "running bot". |

Underlying theme (doc 928 rule 1): *ground truth over confidence.* A change is only done when the real bundler is green and the bot boots clean - `tsc` passing, or a verify step that no-ops, is not proof.

## Solutions considered - and which were applied ("try them all")

The directive was "many solutions and try them all." Each candidate below was evaluated; the applied set is everything that hardens the pipeline without adding fragility.

### Applied

1. **Hand-resolve code conflicts; never union-merge code.** Durable rule (agent-loops.md #26). Union stays for `research/**` + `*.md` only. For shell-hostile content, use a `.py` repair script (agent-loops rule 18) - which is exactly how the live file was repaired (`fix-tg.py`: replace the mangled `handleReplyRoute` span between the function decl and the `// Feature 5` marker with the known-correct function, with sanity guards that abort if markers are missing or `<<<<<<` remains).

2. **Boot-verify HARD-FAILS on a missing verifier.** `zoe-autodeploy.sh` v2 uses the repo-local binary by explicit path `./bot/node_modules/.bin/esbuild`, asserts it is executable, attempts a local `npm install esbuild` if absent, and if it still cannot be obtained it ABORTS the deploy and pages (`zao-status`) rather than passing. A missing tool is never a green. (agent-loops.md #27)

3. **Verify on a FRESH checkout of the target commit, restart the live bot onto it only on green.** v2 clones origin/main to `/tmp/zoe-verify`, boot-verifies there, and only on a clean esbuild bundle does it ff the live clone + `npm install` + restart + 12s health-check + auto-rollback to the prior SHA on any boot error. The live clone is never edited/verified in place. (agent-loops.md #28)

4. **The fix must be COMMITTED in origin/main, not an uncommitted edit on the live clone.** The in-place `fix-tg.py` repair left the live clone dirty (HEAD on the broken commit, working-tree file fixed) - the exact dirty-clone trap agent-loops rule 11 warns about, where a later `git checkout` reverts the fix. Resolution: land the fix as a committed PR (#1544, merged to origin/main as `4cb0bb4b`), then `git stash` the redundant local edit + `git checkout -B main origin/main` + `stash drop` so the live clone sits clean on the fixed commit.

5. **A manual pause switch.** `touch /tmp/zoe-autodeploy.HOLD` stops deploys without editing cron; a `flock` guards against overlapping runs.

### Considered, not applied (with reasoning)

- **A `.gitattributes` `merge=union` driver scoped to `research/**`.** Would automate the safe path for prose merges, but the failure was a manual choice, not a misconfig, and a mis-scoped union driver would *increase* code-corruption risk. The behavioral rule (#21) is the safer fix. Revisit only if prose-merge friction recurs.
- **`tsc --noEmit` as the verify.** Rejected as insufficient (doc 928 rule 1): esbuild bundles the actual boot graph and catches structural breakage tsc's looser parse passes. esbuild-bundle is the verify of record.
- **Blue/green two-instance deploy.** Overkill for a single-token bot where only one instance may poll (project_zoe_one_instance_409). The fresh-checkout verify + auto-rollback gives the same safety without split-brain risk.

## Verification (ground truth, not confidence)

- Live clone `~/zao-os`: HEAD = `4cb0bb4b` (the fix commit), working tree clean, `grep -c` confirms the repaired `handleReplyRoute` line is on disk.
- `./bot/node_modules/.bin/esbuild` bundles `bot/src/zoe/index.ts` clean (no error).
- `systemctl --user is-active zoe-bot` = active; journal shows `[zoe/index] polling as @zaoclaw_bot`, no `TransformError`.
- Hardened `zoe-autodeploy.sh` v2 on the VPS, cron every 10 min re-enabled.

## Also See

- [Doc 928](../928-agent-loop-best-practices/) - agent loop rules; this incident added #26-28.
- [Doc 994] - "the loop is the product" - self-improving loop lessons.
- `.claude/rules/agent-loops.md` #11 (dirty clone), #18 (py-script edits), #26-28 (this incident).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge this doc PR to main | @Zaal | PR review | 2026-07-17 |
| Confirm `zoe-autodeploy.sh` v2 blocks a deliberately-broken commit in a dry run (touch HOLD, stage a bad edit on a throwaway branch, watch it page not deploy) | @Zaal | Verify | 2026-07-18 |
| Fold #26-28 into ZOE's own coder/critic prompts so its autonomous fix-PRs never union-merge code | @Zaal | Bot config | 2026-07-20 |

## Sources

- FULL - the live incident: `bot/src/zoe/tg-interactions.ts` on the VPS, the `fix-tg.py` repair, PR #1544, journalctl for zoe-bot (2026-07-16, this session).
- FULL - `.claude/rules/agent-loops.md` (rules 1, 11, 18) - prior loop-ops lessons this incident extends.
- FULL - `~/bin/zoe-autodeploy.sh` v2 (deployed this session) - the hardened pipeline.
