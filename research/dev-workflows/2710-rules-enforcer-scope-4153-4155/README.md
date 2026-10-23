---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-23
superseded-by:
related-docs: "dev-workflows/2706-claims-check-enforcer-scope (ZAOOS #4157, unmerged), dev-workflows/2709-lane-state-check-scope (ZAOOS #4163, unmerged)"
original-query: "Scope ZAOOS issues #4153 (script and handler design), #4154 (spend and repeated work) and #4155 (content and format) the same way as #4151 and #4152: research and spec only, narrowest mechanism per rule, measured; batch small follow-ups into one PR per topic. (messenger-69 relays, 23 Oct 2026, with prior art from the dreamnet and bandzbuilds lanes)"
tier: QUICK
---

# 2710 - Scoping enforcers for issues #4153, #4154 and #4155

> **Goal:** Three more groups from the 2026-10-23 rules mechanism audit, scoped in one doc per the seat's batch rule: the narrowest mechanism per rule, what already exists to extend, and what was measured. Nothing is built and no rule file is edited (lane-quality owns them).

## Key Decisions

| Issue | Decision | Why (measured 2026-10-23; the two lanes' prior art was re-read and spot-checked, see Sources) |
|---|---|---|
| #4153 silent-failure-guard | **WIRE what is built before writing more.** `bin/zao-chain-guard` is on dotfiles main and appears 0 times in `claude/settings.json` (git show origin/main). Then the pipefail check already in flight: dotfiles #726 (open, `hook-pipefail-test`, cites #4153). | A built, unwired guard protects nothing (`vanishing-dependencies.md` rule 7). October MISTAKES: shape chain-commits-past-a-failed-step, 7 entries; green-results-that-cannot-go-red, 1. Of 162 shebang shell scripts in dotfiles `bin/`, 66 have a `set ... pipefail` line (my count: first line `#!...sh`, then a line matching `^\s*set [^#]*pipefail`). The bandzbuilds lane's 34 of 163 counts `set ... pipefail` only within each script's first 15 lines (its status entry, vault 555fcd3a), so both counts hold: 34 set it near the top, 66 set it somewhere. The same entry counts 93 `|| true` lines in 36 files, not yet sorted into load-bearing and benign. |
| #4153 liveness-probe-guard, first-handler-wins | **EXTEND the ZOE bot's existing CI tests**, which already cover routing order (`command-routing-order.test.ts`), the user-text matcher registry (`swallow-registry.test.ts`), `featureRan` (`feature-ran.test.ts`, `feature-ran-coverage.test.ts`) and liveness (`zoe/__tests__/heart-liveness.test.ts`, `devz/__tests__/liveness.test.ts`); all six files are on ZAOOS origin/main and the bot's `npm test` runs in `.github/workflows/ci.yml`. No `probeHealthWithBackoff` exists in code (bandzbuilds, 555fcd3a). No new mechanism until an instance is logged. | No October MISTAKES entry carries a busy-probe or handler-order shape. |
| #4153 code-restraint (new dependencies) | **A claims-gate line in `zao-pr-open`:** a diff touching `package.json` dependencies, `requirements*.txt` or `pyproject.toml` must have a "why this dependency" sentence in the body. | No CI step or hook gates new dependencies (bandzbuilds, 555fcd3a: `ci.yml` has none); the glue-first skill is the advisory form. The claims gate already reads the body against the diff, so it is the narrowest host. |
| #4154 agent-spend, code-over-inference | **EXTEND `zao-spend`; do not build a new meter.** Add a per-lane daily ceiling that prints OVER and exits non-zero, for the seat's tick to read; the third-repeat detector comes later. | `zao-spend` exists and only reports (`--hours --days --by-lane --ledger --history`; "What the agent work cost"). Caps that stop something exist, each for one subsystem: Hermes `FLEET_DAILY_USD_CAP` at `bot/src/hermes/runner.ts:34` (default 20) and a per-call `--max-budget-usd` refusal at `bot/src/hermes/claude-cli.ts:154-155`; `MAX_DAILY_CAP = 500` at `bot/src/helper/gate.ts:37`; per-member edit and regen limits and ZOE's send budget (dreamnet, 289797ba). `vps/fleet-spend-guard.sh` pauses cheap loops at `FLEET_DAILY_CAP` (default 5) but its header says "NOT DEPLOYED FROM HERE" (dotfiles origin/main, line 4); its live state on the VPS is unverified. None caps a Claude Code lane. A repeat detector was searched for and not found (dreamnet's terms: noop streak, consecutive no-change, third repeat, recurrence). No October MISTAKES shape tracks spend, so nothing about lane spend is measured as broken; this is a ceiling, not a fix. |
| #4155 icm-grounding | **A check in the brand-work path that the box was read from the master** (`context.thezao.com` or zao-icm `boxes/`), not useicm.com. | One October instance: the brand lane "read the frozen useicm.com box as the live master" (22 Oct, shape trusted-my-own-unexamined-input) and reported "ZABAL Games" where the master said Gamez. |
| #4155 documentation-in-repo | **No new check yet.** No October instance is an artifact used as the only copy; the one related instance (19 Oct, a live recording kept only in a scratchpad and lost on restart, shape scratchpad-holds-what-outlives-the-session) is a scratchpad case, which `handoff-discipline.md` rule 8 covers. |
| #4155 dreamnet-communication-standard, skill-enhancements | **Template checks hosted in `zao-rules-lint`** (dotfiles #645 and #659, both open), once those merge. | None of the four #4155 checks exists (dreamnet, 289797ba, searched ZAOOS at e86864932 and dotfiles). Spot-checked: `context.thezao.com` appears in dotfiles `bin/zao-mirror-reconcile` only, and nowhere in ZAOOS `scripts`, `.github` or `bot/src`. No October MISTAKES instance names either rule. |

## Batch note

Per the seat's rule (one PR per lane per topic), #4153 to #4155 are one doc. #4151 is doc 2706 and #4152 is doc 2709.

## Next Actions

| Action | Owner | Type | Gate |
|---|---|---|---|
| Wire `zao-chain-guard` into `claude/settings.json` | Zaal | settings line | Zaal's |
| Merge dotfiles #726 (pipefail test) | merge lane or Zaal | review | per its class |
| `zao-pr-open` claims-gate line for new dependencies | a lane | dotfiles PR | merge guard adjacent: check class |
| `zao-spend --ceiling <usd> --by-lane` printing OVER, exit 1 | a lane | dotfiles PR | merge-lane |
| Box-source check in the brand-work path | a lane | dotfiles PR | merge-lane |
| Comment on #4153, #4154, #4155 linking this doc | quidli | issue comments | none |

## Sources

- ZAOOS issues #4153, #4154, #4155 [FULL, `gh issue view`]
- dotfiles origin/main: `claude/settings.json`, `bin/` shebangs and pipefail lines, `bin/zao-chain-guard` presence [FULL, `git show` and `git ls-tree`]
- dotfiles PRs #726, #645, #659 state [FULL, `gh pr view`]
- `zao-spend --help` [FULL, run]
- ZAOOS `bot/src/hermes/runner.ts` lines 34 to 47 [FULL, `git grep` on origin/main]
- Vault `MISTAKES.md` October shapes, origin/main 2137c6a5 [FULL]
- Vault status entries 555fcd3a (bandzbuilds, 12:50 EDT) and 289797ba (dreamnet, 12:48 EDT) [FULL, `git show`]; their load-bearing citations spot-checked on origin/main: the six bot test files, the `npm test` CI step, `claude-cli.ts:154-155`, `gate.ts:37`, `vps/fleet-spend-guard.sh` lines 4 and 30, and the `context.thezao.com` grep
