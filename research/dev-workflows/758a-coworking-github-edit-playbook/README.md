---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-26
related-docs: "758, 758b, 758c, 758d, 758e"
original-query: "best ways to edit the coworking github (ZAODEVZ/ZAOcowork) safely without breaking the 4-user live app, given solo-dev context"
tier: STANDARD
---

# 758a - Coworking GitHub Edit Playbook (ZAODEVZ/ZAOcowork)

> **Goal:** Stop breaking the 4-user cowork tracker mid-edit. Solo-dev safety net without enterprise friction.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **USE GitHub branch protection on main with CI-only checks** (typecheck + lint), NO required reviews | Solo dev = false choice between "code review by nobody" or "no gate at all"; CI-only is the unlock |
| 2 | **USE Vercel preview deploys as the QA gate** for feature PRs; users click preview URLs to test before merge | Free on Vercel free tier, zero extra work, makes 3 non-dev users actual QA |
| 3 | **KEEP direct-push-to-main for hotfixes**; PR + preview for new features | Hybrid matches a 4-user blast radius - sub-minute fixes when Iman is live |
| 4 | **USE `supabase migrate new`** for every schema change; never hand-edit applied migrations | RLS-rename silently breaks permissions; the cli + diff review is the only safety net |
| 5 | **ADD one Playwright smoke test** (Kanban loads + tasks render); SKIP unit coverage | 80% of user pain is "app doesn't load"; full coverage is over-engineering for 4 users |
| 6 | **ADD Husky pre-commit**: `typecheck && lint:biome` only | 8 sec / commit, catches type breaks before push. Skip Prettier auto-format |
| 7 | **SKIP separate staging Supabase project** | Adds maintenance overhead a 4-user app doesn't pay back |

## Findings

For a 4-user internal Next.js + Supabase app maintained by one developer (Zaal), the key tension is speed-to-change vs safety-for-users-logged-in-live. Three scaling regimes: direct push (risky but necessary for solo), branch + preview + user QA (safe for small teams), full CI gates (over-engineered for 4 users). The "best way" is the hybrid below.

### Branch protection: skip required reviews, require CI checks

GitHub branch protection has a false choice for solo devs: either require a "code review" (nobody else to review) or protect nothing. Unlock the CI-only path. Set main to require:
- TypeScript `npm run typecheck` passing
- Linting `npm run lint:biome` passing
- Optional: one Playwright smoke test

Do NOT require code reviews. Do NOT require a separate reviewer. ~3 min per PR. Prevents "types broken, nobody sees it until next person opens the app." Source: `josheche/monolith-industries` + `vibestackdev/vibe-stack` document this exact pattern.

### PR vs direct push: sliding scale

- **Hotfix (Iman reports a bug at 2pm):** Direct push to main, Vercel deploys in ~30 sec, Iman tests in 1 min. Keep this.
- **Feature (new task filter, Kanban redesign):** PR + Vercel preview URL. Share `zaos-tracker-feature-xyz.vercel.app` with Iman/Samantha/ThyRev. They click, QA, then merge.

Chayuto's Supabase CI/CD post: preview deploys are "nearly free" (same Docker build, no prod env vars). Vercel docs confirm preview URLs are accessible by default and shareable.

### Vercel preview deploys as the QA gate

Workflow: `git push to feature/x` -> GitHub creates PR -> Vercel auto-generates unique preview URL -> share with the 3 ops users -> they test live -> merge. No manual build step. Cost: one-time OAuth setup; ongoing: free.

### Supabase migration safety

`.sql` files in `supabase/migrations/`. Direct SQL edits in IDE work until they break RLS or cascade incorrectly.

1. **Always `supabase migrate new <name>`** - timestamped file. Never hand-edit an applied migration.
2. **Test locally:** `npm run db:reset` (runs migrations + seed).
3. **RLS-specific:** every table needs RLS + at least one policy. `supabase db push` diffs local against remote, generates a migration. Review SQL before prod.
4. **Seed data:** keep `supabase/seed.sql` minimal (static reference data only).

The Chayuto post warns: "If you migrate without testing RLS, you don't know if authenticated users can still only see their own data." ZAOcowork `tasks` has `owner_id` with RLS `auth.uid() = owner_id`. Renaming to `user_id` without updating policy silently breaks - Iman would see all tasks, not just his own.

### CI tests for 4-user scale: smoke test only

Minimum viable:

```typescript
// e2e/kanban.spec.ts
import { test, expect } from '@playwright/test'

test('Kanban loads and displays tasks', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('[data-testid="task-grid"]')
  const tasks = await page.locator('[data-testid="task-card"]').count()
  expect(tasks).toBeGreaterThan(0)
})
```

~50 lines. Run before push, run as a GH Actions check. 30 sec / CI run. Catches "app doesn't load" regressions. Skip 100% coverage.

### Husky pre-commit (minimal)

```bash
# .husky/pre-commit
npm run typecheck && npm run lint:biome
```

8 sec / commit. Skip full test suite (breaks flow state) and Prettier auto-format (causes spurious changes).

### CODEOWNERS

```
* @bettercallzaal
```

Symbolic - makes PRs self-documenting. No extra setup.

### Rapid hotfix when Iman is logged in

For urgent bugs: fix locally, push to main, Vercel deploys ~30 sec, message Iman to refresh. Works because 4-user clear owner (Zaal) + clear operator (Iman) means breaks surface immediately. Limit to actual emergencies; nice-to-haves use a PR.

### Migration vs feature-flag for breaking changes

For a 4-user internal app: **always migration**. Sub-minute downtime, users refresh, no flag logic to clean up. The flag pattern is only worth it at 10k+ users.

### What NOT to do

- Don't require code reviews when you're the only developer
- Don't set up Kubernetes-style canary deploys for a 4-user app
- Don't mandate 100% test coverage; smoke-test core flows
- Don't create separate staging / production Supabase projects yet
- Don't use Redux / Zustand for a Kanban (React hooks + Supabase Realtime is plenty)

## Recommended Playbook (5 steps, tomorrow morning)

1. **Enable Vercel preview deploys + GitHub auto-integration** (10 min) - Vercel project Settings > Git, ensure "Automatic deployments from Git" is on for all branches.
2. **Add CI typecheck + lint workflow** (15 min) - `.github/workflows/ci.yml` with two jobs. Set branch protection on main: require CI status checks, no review.
3. **Set up Husky pre-commit** (5 min) - `npx husky install` + `npx husky add .husky/pre-commit "npm run typecheck && npm run lint:biome"`.
4. **Migration discipline** (ongoing) - `supabase migrate new <feature>` for any schema change. `npm run db:reset` locally. Review `supabase db diff --linked` before prod.
5. **One Playwright smoke test** (20 min) - `e2e/kanban.spec.ts` + add to CI.

Total tomorrow-morning sprint: ~50 min of focused work.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add GH branch protection on main (CI checks required, no review) | @Zaal | repo config | 2026-05-28 |
| Create `.github/workflows/ci.yml` (typecheck + lint jobs) | @Zaal | PR to ZAODEVZ/ZAOcowork | 2026-05-28 |
| Install Husky + add pre-commit hook | @Zaal | PR | 2026-05-28 |
| Document Supabase migration workflow in cowork README | @Zaal | PR | 2026-05-30 |
| Add Playwright smoke test (Kanban renders) | @Zaal | PR | 2026-05-30 |

## Also See

- Doc 758 (hub) - parent of this sub-doc
- Doc 717 - hermes-orchestrator architecture (sibling pattern for solo-dev CI)
- Doc 754 - meeting-bonfire-bridge (similar Supabase-safety topic)

## Sources

- [FULL] Chayut Orapinpatipat - Supabase Local Testing + CI/CD for Next.js 16 - https://chayuto.com/blog/supabase-local-testing-cicd
- [FULL] josheche/monolith-industries - one-person Next.js infra - https://github.com/josheche/monolith-industries
- [FULL] Asymmetric-al/core - Next.js 16 Turborepo monorepo - https://github.com/Asymmetric-al/core
- [FULL] Vercel - Promoting a preview deployment to production - https://vercel.com/docs/deployments/promote-preview-to-production
- [PARTIAL - light on ZAOcowork specifics] Vercel - Locking down deployments - https://vercel.com/kb/guide/locking-down-deployments
- [FULL] vibestackdev/vibe-stack - 29 architecture rules - https://github.com/vibestackdev/vibe-stack
- [PARTIAL - high-level, not solo-dev specific] Supabase CLI - Migrations + schema safety - https://supabase.com/docs/guides/local-development/overview
- [FULL] Next.js Testing Adapters - https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/07-adapters/04-testing-adapters.mdx
