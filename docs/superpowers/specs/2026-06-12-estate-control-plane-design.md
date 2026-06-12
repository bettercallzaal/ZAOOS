# ZAO Estate Control Plane - Design Spec

Date: 2026-06-12
Status: approved (brainstorm), ready to build
Related: research/infrastructure/836 (census), 844 (estate map), dev-workflows/843 (CLAUDE.md standard), security/841 (over-audit)

## Problem

Truth rots faster than anyone fixes it by hand. This session alone found 6+ stale
counts, a phantom `contracts/` dir, 54 dead Vercel projects, and lingering
graduated/decommissioned code. Each was fixed manually; all will rot again. The
estate has no automated truth-keeping and no live map of what is actually alive.

## Goal

A checks engine that scans a repo, emits one `estate-report.json`, and feeds three
dumb surfaces (PR guardrail, dashboard, Telegram digest). Prevention + monitoring,
propose-don't-act. Repo-agnostic so the whole estate can adopt it.

## Architecture

```
tools/estate-control-plane/
  config.json            # data-driven: doc-count pointers, zombie denylist,
                         # staleness thresholds, baseline allowlists, repo paths
  types.ts               # CheckResult, Finding, Report
  run-checks.ts          # CLI entry: runs checks -> estate-report.json (+ exit code)
  checks/
    drift.ts             # documented counts/paths vs live repo reality
    zombie.ts            # graduated/decommissioned code still present
    quality.ts          # untested API domains, npm audit (baselined), typecheck
    estate.ts            # OPTIONAL token-gated Vercel/Supabase census
  surfaces/
    dashboard.ts         # report.json -> self-contained dashboard.html
    digest.ts            # report.json -> short Telegram/markdown digest (change-only)
    pr-comment.ts        # report.json -> sticky PR comment markdown
  __tests__/
    *.test.ts + fixtures/  # each check tested against fake-repo fixtures
.github/workflows/estate-health.yml   # PR guardrail + weekly cron
```

Data flow: `repo + config.json -> run-checks.ts -> estate-report.json ->
{pr-comment | dashboard.html | digest | tracking issue | count-fix PR}`.

## The report (single source of truth)

```ts
interface Finding { check: string; severity: 'fail'|'warn'|'info'; title: string; detail: string; file?: string; fixable?: boolean }
interface CheckResult { id: string; status: 'ok'|'warn'|'fail'|'skipped'; findings: Finding[]; counts?: Record<string,number> }
interface Report { repo: string; generatedAt: string; healthScore: number; checks: CheckResult[]; summary: { fail: number; warn: number; fixable: number } }
```

`healthScore` = 100 minus weighted penalties (fail=10, warn=3). Always emits even
if a check throws (each check wrapped; `Promise.allSettled`).

## Checks

### drift (token-free, the load-bearing one)
- Reads documented counts from config-listed files (CLAUDE.md, AGENTS.md, README.md,
  research/README.md) via labelled regexes, compares to live repo reality:
  - API routes (`src/app/api/**/route.ts`), domains, components, hooks, lib domains,
    research doc folders.
- Phantom paths: any directory named in a doc's project-map that does not exist
  on disk (catches the `contracts/` case).
- Staleness: research docs whose `last-validated` frontmatter is older than
  `staleness.maxDays` (warn).
- `fixable: true` on count mismatches (the cron can auto-correct + open a PR).

### zombie (token-free)
- Greps for `config.zombie.denylist` patterns (openclaw, composio, agent-zero,
  Magnetiq/AttaBotty leftovers, half-built "coming soon"/"not yet configured",
  duplicate route markers) under `src/`, `bot/`.
- Cross-checks `config.graduation` ledger: for each graduated entry, assert its
  code paths are gone (fail if still present) and a redirect exists (warn if not).

### quality (token-free)
- API domains with no `__tests__` dir -> warn (count, not per-file noise).
- `npm audit --json` critical/high count, MINUS `config.baseline.auditAllowlist`
  (the known-deferred web3 transitive CVEs) -> fail only on NEW/critical-not-allowlisted.
- `tsc --noEmit` error count -> fail if > `baseline.typecheckErrors`.

### estate (OPTIONAL, token-gated)
- If `VERCEL_TOKEN`/`SUPABASE_ACCESS_TOKEN` present, runs the existing
  `scripts/estate-audit/audit.sh` and folds dead-project/inactive-DB counts in.
- Else: `status: 'skipped'`, reports "last manual estate scan: N days ago" from a
  stamp file, warns if older than `staleness.estateMaxDays`.

## Adoption safety (so it gets used, not ignored)

- **Ratchet, not big-bang.** In PR mode the guardrail fails ONLY when `fail` count
  rises vs the base branch (existing debt allowed, new debt blocked). Baselines in
  `config.baseline` capture today's known debt.
- **Audit allowlist.** Known-deferred CVEs are listed; only new/fixable ones fire.
- **Notify-on-change only.** Telegram digest + tracking-issue update fire only when
  status changes or crosses a threshold - silence when steady. (Honors the
  decommissioned-bots no-nag lesson.)

## Surfaces

- **GitHub Action** (`estate-health.yml`):
  - on `pull_request`: run token-free checks, post sticky PR comment, set a check
    status, fail only on ratchet breach.
  - weekly `schedule`: run token-free checks, regenerate `dashboard.html`, deploy it,
    open/update ONE "Estate Health" issue, open a count-fix PR if drift is fixable,
    push a digest to Telegram if changed.
- **Dashboard:** self-contained static HTML (health score, per-check status,
  findings, last-run, estate-scan staleness). Deployed to a tiny Vercel project.
- **Telegram:** digest via the existing ZOE/vps send path; change-only.

## Autonomy

Propose-only. The single auto-generated change is the mechanical count-fix PR.
Everything else is an issue with a checklist. Never auto-merges.

## Repo-agnostic

`config.json` carries `repoRoot` + the doc-count pointers + denylists, so the
engine runs against any ZAO repo. Graduated repos drop in a config + the workflow
and inherit the same control plane (and the Doc 843 CLAUDE.md standard checks).

## Phasing

1. Engine: types, config, drift + zombie + quality checks, run-checks CLI, report.json, tests.
2. GitHub Action: PR guardrail (ratchet) + weekly cron + tracking issue + count-fix PR.
3. Dashboard: generator + deploy.
4. Telegram digest (change-only).
5. (later) estate check token-gating polish + trend history.

## Testing

Each check has a `__tests__` with `fixtures/` (a fake repo state -> expected
findings). Drift gets the most coverage (the load-bearing check). The engine runs
identically locally (`node tools/estate-control-plane/run-checks.ts`) and in CI.

## Non-goals (v1)

- No live interactive dashboard backend (static only).
- No auto-merge of any change.
- No auto-deletion of dead Vercel/Supabase projects (propose via issue only).
- Trend history deferred to a later phase.
