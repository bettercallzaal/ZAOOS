---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-13
related-docs: 836, 841, 843, 844
original-query: "Capture this session's capabilities + reusable patterns as institutional memory: estate census tooling, adversarial audit workflows, the Estate Control Plane, CLAUDE.md alignment standard, and the hard-won friction-source learnings. Goal: future /zao-research sessions surface what we can now do and how."
tier: STANDARD
---

# 851 - ZAO Agent Capabilities Playbook

> **Goal:** What an AI coding agent can now DO in the ZAO estate, and the reusable patterns + friction-traps learned shipping it. Read this before a big multi-step task - it lists capabilities you might forget you have, and traps that already cost time once.

## Key Decisions (use these defaults)

| # | Capability / pattern | Use it when | Where |
|---|----------------------|-------------|-------|
| 1 | **Estate census** - read-only Vercel + Supabase inventory mapped to repos | "what infra are we paying for / what's dead" | `scripts/estate-audit/audit.sh` |
| 2 | **Adversarial audit workflow** - N finders -> independent refute-it verifiers | "thoroughly audit / find all bugs" | Workflow tool, see pattern below |
| 3 | **Estate Control Plane** - automated drift/zombie/quality checks + PR guardrail | keeping docs/counts/dead-code honest over time | `tools/estate-control-plane/` |
| 4 | **CLAUDE.md alignment standard** - two-layer model + template | onboarding a new/graduated repo to agent context | Doc 843 + its TEMPLATE.md |
| 5 | **Estate map** - canonical live/dead inventory | "what exists in the ecosystem" | Doc 844 |
| 6 | **gh REST fallback** - dodge GraphQL rate limits | `gh pr create` is rate-limited | `gh api --method POST /repos/<o>/<r>/pulls` |

## What we can now do (capabilities)

### Census the paid estate (Doc 836)
`scripts/estate-audit/audit.sh` lists every Vercel project (last-deploy age ->
dead flag, deduped by id, mapped to its git repo) and every Supabase project
(status -> paused flag), and prints a kill-candidate list. Read-only,
short-lived tokens at `~/.zao/estate-tokens.env` (off-repo, gitignored). API gap:
neither exposes per-project $ spend - cross-check the usage dashboards. 2026-06
run: 86 Vercel projects (54 dead), 4 Supabase (2 inactive).

### Run an adversarial multi-agent audit
The Workflow tool fans out finders (one per dimension: security, tests,
dead-code, deps, infra) then hands EVERY finding to an independent verifier whose
job is to REFUTE it. Only findings confirmed by reading the actual code survive.
Two rounds in this session produced 63 + 53 verified findings and **refuted 20
false positives** (rate-limiting that did exist, `Promise.all` over Supabase that
cannot reject, a theoretical bug with no live code path). Find-then-refute beats
single-agent findings. Cost: ~2-3M tokens per full run - opt-in only.

### Keep truth from rotting (Doc 844 + the control plane)
`tools/estate-control-plane/` is a checks engine that scans a repo and emits one
`estate-report.json` feeding three surfaces: a PR guardrail (sticky comment +
ratchet), a static dashboard, and a Telegram digest. Checks: drift (documented
counts/paths vs live repo), zombie (decommissioned/graduated code still present),
quality (untested domains, baselined npm audit, typecheck), estate (manual-scan
freshness). Propose-don't-act. `fix-drift.ts` mechanically corrects stale counts.
Repo-agnostic via `config.json` - point it at any ZAO repo.

### Align agent context across repos (Doc 843)
Two-layer model: global `~/.claude/CLAUDE.md` holds the brand glossary + output
rules (one home, never copied); per-repo CLAUDE.md holds what-this-is + project
map (with VERIFIED counts + a date stamp) + security + boundaries. AGENTS.md is
source of truth where both exist. TEMPLATE.md is the copy-paste starting point.

## Friction traps (do not re-discover these)

| Trap | Symptom | Fix |
|------|---------|-----|
| **npm `--prefer-offline` corruption** | leftover `.pkg-hash` staging dirs, missing `fdir`, no `.bin/vitest`, phantom typecheck errors | `rm -rf node_modules && npm install` clean. Phantom "HMS typecheck errors" were this, not real. |
| **gh GraphQL rate limit** | `gh pr create` fails "API rate limit exceeded" | REST endpoint uses the separate core limit: `gh api --method POST /repos/<o>/<r>/pulls -f title=... -f head=... -f base=main -f body=...` |
| **Actions secrets in `if:`** | `if: secrets.X != ''` never works | `secrets` is NOT in the `if` context. Map secret -> step `env:`, gate on `env.X`. |
| **vitest only scans src/** | "No test files found" for tools/ tests | dedicated `vitest.config.ts` with its own `include`, run `--config`. |
| **`vi.clearAllMocks()` leak** | a test passes alone, fails in suite | clearAllMocks does NOT drain `mockReturnValueOnce` queues; a test that over-queues leaks into the next. Use `mockReset()`. |
| **Workflow result-shaping** | a pipeline returns all-zeros despite agents running | a `pipeline` stage returning a bare array vs `{key:[]}` drops everything in the final flatMap. Wrap consistently; resume-from-cache replays instantly after the fix. |
| **`@types/node` readdir typing** | `Awaited<ReturnType<typeof readdir>>` breaks the build across versions | infer the Dirent type from the call: `await readdir(p,{withFileTypes:true}).catch(()=>null)`. |
| **Branch off main shows pre-merge state** | tools/docs look "wrong" on a fresh ws/ branch | a branch cut from origin/main lacks unmerged PRs; verify against the right base before "fixing". |

## Reusable workflow patterns

- **Estate census -> kill-list:** run `audit.sh`, dedupe by id, group dead projects by cluster, emit delete URLs. Quarterly.
- **Adversarial audit:** `pipeline(DIMENSIONS, finder, findings => parallel(verify-each))` with a refute-by-default verifier; keep only `isReal`. Wrap each stage's return as `{dimension, verified}` (see the shaping trap).
- **Fix -> re-audit -> fix:** after remediating, re-run the audit against the FIXED worktree to confirm fixes held + catch new issues. The re-audit refuted nothing new in the fixed files = proof.
- **Ratchet adoption:** when adding a check to a dirty codebase, fail only on debt INCREASE (baseline today's debt), or the check goes red day one and gets ignored.
- **Propose-don't-act autonomy:** auto-open PRs/issues, never auto-merge; the one auto-change is mechanical (count fixes).

## Also See

- [Doc 836](../../infrastructure/836-zaoos-repo-estate-census/) - estate census + tooling
- [Doc 841](../../security/841-zaoos-over-audit-2026-06/) - the adversarial over-audit (63 findings)
- [Doc 843](../843-claude-md-alignment-standard/) - CLAUDE.md alignment standard + template
- [Doc 844](../../infrastructure/844-zao-estate-map/) - the live estate map
- Session handoff: `research/events/session-2026-06-13-estate-overview-control-plane/`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| PR + merge `ws/fix-build-estate-fs-utils` (unbreaks Vercel build) | @Zaal | PR | Now |
| Drop `ratchetMaxFails` 7 -> 0 once docs drift is zero | @Zaal | PR | After build fix |
| Re-run `audit.sh` quarterly + reconcile Doc 844 | @Zaal | Manual | Quarterly |
| Carry the estate map + org hierarchy into ZAO101 onboarding | @Zaal | ZAO101 | Next session |

## Sources

- [FULL] This session (2026-06-13) - estate census, two adversarial audit workflows, P0/P1/P2 remediation, docs alignment, and the Estate Control Plane build. Primary source.
- [FULL] `scripts/estate-audit/audit.sh`, `tools/estate-control-plane/**`, Docs 836/841/843/844 - all shipped + merged this session.
- [FULL] `.github/workflows/estate-health.yml` - the CI guardrail + weekly sweep.
