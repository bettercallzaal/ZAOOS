# Estate Control Plane

Automated truth-keeping for the ZAO estate. Scans a repo, emits one
`estate-report.json`, and feeds three surfaces: a PR guardrail, a static
dashboard, and a Telegram digest. Propose-don't-act.

Design: `docs/superpowers/specs/2026-06-12-estate-control-plane-design.md`.
Estate map: `research/infrastructure/844-zao-estate-map/`.

## Run it

```bash
# human summary + estate-report.json
npx tsx tools/estate-control-plane/run-checks.ts

# CI ratchet (exit 1 only if fails exceed the accepted baseline)
npx tsx tools/estate-control-plane/run-checks.ts --ci --max-fails=7

# render surfaces
npx tsx tools/estate-control-plane/run-checks.ts \
  --dashboard=dash.html --digest=digest.txt --pr-comment=pr.md --baseline-fails=7

# include the heavy checks (npm audit + tsc; needs node_modules)
npx tsx tools/estate-control-plane/run-checks.ts --heavy
```

Flags: `--config=`, `--repo=`, `--out=`, `--dashboard=`, `--digest=`,
`--pr-comment=`, `--baseline-fails=`, `--ci`, `--max-fails=`, `--heavy`.
Repo can also be set via `ESTATE_REPO_ROOT`.

## Checks

| id | what | tokens |
|----|------|--------|
| drift | documented counts/paths vs live repo; stale docs | none |
| zombie | decommissioned/graduated code still present; half-built markers | none |
| quality | untested API domains; npm audit (baselined); typecheck (heavy) | none |
| estate | freshness of the last manual Vercel/Supabase scan | optional |

## Adoption safety

- **Ratchet** (`baseline.ratchetMaxFails`): existing debt is allowed; a PR fails
  only when it ADDS a failure. Lower the baseline as debt is burned down.
- **Audit allowlist** (`baseline.auditAllowlist`): known-deferred transitive CVEs
  are ignored; only new/fixable ones fire.
- **Change-only digests**: the Action only notifies when status changes.

## Repo-agnostic

`config.json` carries `repoRoot`, the doc-count pointers, and the denylists.
Point it at any ZAO repo (`--repo=` or `ESTATE_REPO_ROOT`) and it enforces the
same standard - see `research/dev-workflows/843-claude-md-alignment-standard/`.

## Tests

```bash
npx vitest run --config tools/estate-control-plane/vitest.config.ts
```

## Wired vs next

Wired (no setup needed - uses the built-in `GITHUB_TOKEN`):
- checks engine + all surface renderers
- PR guardrail: sticky comment + ratchet
- weekly sweep: auto count-fix PR for fixable drift (`fix-drift.ts`), Estate Health
  issue upsert, artifact upload

Wired but secret-gated (skipped cleanly until you add the secret):
- Dashboard deploy to Vercel - set `VERCEL_TOKEN` (+ `VERCEL_ORG_ID`,
  `VERCEL_ESTATE_PROJECT_ID`)
- Telegram digest (change-gated: silent when all-green) - set `TELEGRAM_BOT_TOKEN`,
  `TELEGRAM_CHAT_ID`

Intentionally manual (design decision, not a gap): the Vercel/Supabase estate scan
stays a manual `scripts/estate-audit/audit.sh` run - storing a long-lived cloud
token in CI is the concentration risk we are avoiding. `estate.ts` reports the
freshness of the last manual scan.

Later: trend history (health-score over time on the dashboard).
