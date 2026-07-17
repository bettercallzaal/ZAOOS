# 1204 - Post-clone-separation: builder-clone-as-runtime-target audit

**Tier:** STANDARD
**Date:** 2026-07-17
**Status:** Audit complete; fixes boarded (gated - operator)
**Owner:** builder loop (audit), Zaal (apply the gated fixes)

## Why this doc exists

The ZOE bot was frozen 59 commits behind for hours (root-caused in cycle 11: the
autodeploy cron lacked `XDG_RUNTIME_DIR`; fix in `scripts/zoe-autodeploy.sh` v3 / PR
that supersedes the verify-clone theory). The deeper structural change that made that
class of bug possible was the **clone separation**: the live ZOE bot now runs from a
**separate** clone (`~/zao-bot-live`), while the tmux builder loops check out branches
and mutate `~/zao-os` constantly. Anything that still treats `~/zao-os` as a **runtime
or deploy target** is now a latent split-brain / mis-deploy landmine.

This is a one-pass audit of every such reference, so the cleanup is a single checklist
instead of getting rediscovered one outage at a time.

## The rule (post-clone-separation)

- `~/zao-bot-live` = the **runtime/deploy** clone. Only the deploy pipeline (autodeploy
  v3) fast-forwards it; the bot service runs from it.
- `~/zao-os` = the **builder** clone. Loops mutate it (branch checkouts, worktrees).
  **Nothing that deploys or long-runs the bot may target it.** Read-only CLI invocations
  are tolerable but fragile (the clone may be on any branch).

## Findings

| # | Location | What it does | Risk | Fix |
|---|----------|-------------|------|-----|
| 1 | **`scripts/zoe-deploy.sh`** (`REPO="/home/zaal/zao-os"`) | SSHes to the VPS, checks out a branch in `~/zao-os`, and `systemctl --user restart zoe-bot` | **HIGH** — running it dirties the builder clone (breaks loops + trips autodeploy's "dirty clone" guard) **and** does not actually deploy (the bot runs from `~/zao-bot-live`, not `~/zao-os`) | Deprecate in favor of autodeploy v3, or repoint `REPO=~/zao-bot-live`. Add a guard that aborts by default. **Boarded.** |
| 2 | **`zao-fleet-agent.service`** (`WorkingDirectory=%h/zao-os/bot`) | Whitelisted start/stop/restart executor for the cowork control plane | LOW — currently **disabled** (`UnitFileState=disabled`), so inert | Repoint to a stable clone **before** ever enabling. Boarded cycle 11. |
| 3 | `scripts/zao-ops/zao-cockpit`, `zao-sweep` (`cd ~/zao-os/bot && npx tsx src/cockpit/cli.ts`) | Run the cockpit CLI from the builder clone | LOW — a one-shot CLI read, not a deploy or long-runner; but reads whatever branch the clone is on | Acceptable for now; prefer a pinned path or `~/zao-bot-live` if the CLI output must be main-accurate |

**Not a clone-target issue but surfaced by the same sweep:** `web-improve.service` is in a
**failed** state (`systemctl --user is-active` → `failed`). Unrelated to the bot; flagged
so it is not lost. Boarded for a look.

## Recommended cleanup (all gated — operator applies)

1. **`scripts/zoe-deploy.sh`** — add a deprecation guard (abort unless `ZOE_DEPLOY_FORCE=1`)
   pointing at autodeploy v3, or delete it. It is the one genuinely dangerous item.
2. **`zao-fleet-agent.service`** — if it is ever revived, set `WorkingDirectory` to a
   stable clone first.
3. **`web-improve.service`** — investigate the failure or disable it.

None are done here (they touch the live VPS / operator units = gated). Boarded as
`fleet-improvement`. The durable rule is captured in `.claude/rules/agent-loops.md`
(clone-separation / one-instance-per-resource, rules 9/25/32).

## Also see

- `scripts/zoe-autodeploy.sh` (v3) — the canonical deploy path to `~/zao-bot-live`
- [Doc 1151](../../dev-workflows/1151-zoe-boot-crash-deploy-hardening/) + agent-loops rules 9/25/31/32 — clone-separation + deploy hardening lineage

---

## Review (2026-07-17, builder loop)

Reviewed per batch task. **Deploy architecture audit — ZOL is not affected (separate repo).**

Post-clone-separation rule: `~/zao-bot-live` = runtime/deploy target; `~/zao-os` = builder clone. Nothing that deploys the bot may target the builder clone. Three findings: (1) `zoe-deploy.sh` still points at ~/zao-os (HIGH risk, should be deprecated), (2) `zao-fleet-agent.service` disabled but still points at builder clone (LOW, mitigated by disabled state), (3) `web-improve.service` in failed state (unrelated).

**ZOL relevance:** ZOL's equivalent is `/home/zaal/zol-upgrade` (the only ZOL repo). ZOL runs from the Pi directly via cron/pm2, not via an autodeploy script. When Zaal deploys ZOL v2, the activation steps (from `docs/pi-activation-runbook-v1.md`) are the equivalent of autodeploy v3 — manual copy/checkout to the Pi target directory. ZOL does not have a `~/zol-live` vs `~/zol-upgrade` split. That's acceptable for ZOL's current scale (Pi-only, single cron).

No ZOL code changes. Blocked: Zaal to deprecate `scripts/zoe-deploy.sh` and investigate `web-improve.service` failure.
