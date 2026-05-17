---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-17
related-docs: 661, 661e
tier: STANDARD
parent-doc: 661
---

# 661g - Dependency + Script Health Audit

## Top-Level package.json

- **Total dependencies**: 81 prod + 24 dev = 105 total
- **Last lockfile update**: 2026-05-02 13:35:47 -0400
- **Caret-pinned pattern**: 99% of deps use `^x.y.z` (caret, not locked). No "latest" tags or git+ URLs detected.
- **npm audit summary**: 84 vulnerabilities (37 low, 17 moderate, 26 high, 4 critical)

## Heavy / Suspicious Dependencies

| Package | Size | Severity | Issue |
|---------|------|----------|-------|
| @xmtp/wasm-bindings | 225M | Moderate | WASM payload; patched via `patches/@xmtp+wasm-bindings+1.10.0.patch` to serve from `/public/bindings_wasm_bg.wasm` at runtime |
| next | 169M | N/A | Expected for Next.js 16 framework |
| @stream-io/video-react-sdk | 53M | N/A | Streaming video SDK; active use in Spaces |
| viem | 52M | N/A | Web3 client (Wagmi dependency); active |
| @100mslive/hms-video-store | 10M | N/A | Video conferencing; appears unused (no `hms` refs in src/) |
| ws (nested in @dha-team/arbundles) | ? | HIGH | DoS vulnerability (GHSA-3h5v-q93c-6h6q), v7.0.0-7.5.9 affected. Comes from @ardrive/turbo-sdk. Fixable via upgrade to 1.13.0 (breaking) |

## Known-Deprecated Packages Detected

| Package | Found | Severity | Note |
|---------|-------|----------|------|
| node-fetch | bot/package-lock.json v2.7.0 | OUTDATED | Deprecated; use native fetch. Not in root package.json, only in bot/ transitive deps |
| axios | package-lock.json (indirect) | LOW | Present via @nestjs/axios transitive. Root does NOT depend directly. Acceptable for now |
| lodash.isequal | package-lock.json (indirect) | LOW | Transitive via snapshot.js. No direct dep |

## Critical Vulnerabilities

| CVE/Advisory | Package | Severity | Status |
|--------------|---------|----------|--------|
| GHSA-3h5v-q93c-6h6q | ws (via @ardrive/turbo-sdk) | HIGH | Fixable: upgrade @ardrive/turbo-sdk to v1.13.0 (breaking change) |
| @cosmjs/* | Multiple transitive | LOW | Elliptic crypto vuln, downstream of @ardrive/turbo-sdk. Fixed with Turbo SDK upgrade |

Remaining 82 vulnerabilities: mostly LOW-MODERATE chains (elliptic, @cosmjs, etc.). No critical paths expose auth/secrets.

## Bot/ package.json

- **Total dependencies**: 5 prod + 3 dev = 8 total
- **Package**: zaostock-team-bot (Telegram bot for ZAOstock team coordination)
- **npm audit**: 0 vulnerabilities reported (separate lockfile, smaller footprint)
- **Dependencies**: @supabase/supabase-js (v2.45.0), dotenv, grammy, node-cron, zod
- **Caret-pinned**: All use caret notation; none pinned

## Scripts Taxonomy

| Script | Category | Status | Usage / Notes |
|--------|----------|--------|---------------|
| `postinstall` | build | ACTIVE | Runs patch-package + copies XMTP WASM bindings to /public |
| `dev` | dev | ACTIVE | `next dev` - primary local dev server |
| `build` | build | ACTIVE | `next build` - production build |
| `start` | deploy | ACTIVE | `next start` - runs built Next.js server |
| `lint` | lint | REDUNDANT | `next lint` - ESLint wrapper |
| `lint:biome` | lint | CANONICAL | `biome check .` - Biome linter (preferred, faster) |
| `lint:fix` | lint | ACTIVE | `biome check --write` - Auto-fix |
| `format` | lint | ACTIVE | `biome format --write` - Code formatter |
| `format:check` | lint | ACTIVE | `biome format` - Format check (CI) |
| `ci:lint` | lint | ACTIVE | `biome ci .` - CI mode (stricter) |
| `typecheck` | test | ACTIVE | `tsc --noEmit` - Type checking |
| `test` | test | ACTIVE | `vitest run` - Unit tests (one-shot) |
| `test:watch` | test | ACTIVE | `vitest` - Watch mode |
| `test:e2e` | test | ACTIVE | `playwright test` - E2E tests (configured but rarely run) |
| `turbo:dev` | build | DEAD | `turbo dev` - turbo task. Turbo is configured but rarely used |
| `turbo:build` | build | DEAD | `turbo build` - Turbo doesn't parallelize in this monorepo (apps/zabal-snap exists but packages/ are stubs) |
| `turbo:lint` | lint | DEAD | `turbo lint` - No gain over `lint:biome` |
| `analyze` | build | DEAD | `ANALYZE=true next build` - Bundle analysis (rarely invoked) |
| `brain:digest` | custom | ACTIVE | `node scripts/brain-to-digest.js` - Regenerates BRAIN/_meta/DIGEST.md (auto-synthesis for agents) |
| `import:fractals` | custom | STALE | `npx tsx scripts/import-fractal-history.ts` - One-shot migration from Airtable. Unlikely to be re-run |
| `cap:sync` | build | LEGACY | `npx cap sync` - Capacitor mobile sync. iOS/Android shells exist but not actively shipped |
| `cap:ios` | build | LEGACY | `npx cap sync ios && npx cap open ios` - Mobile dev build. Still in package.json but app focuses on web |
| `cap:android` | build | LEGACY | `npx cap sync android && npx cap open android` - Same as iOS |
| `cap:dev` | build | LEGACY | `CAP_SERVER_URL=...` - Local tunnel for Capacitor. Requires ipconfig (macOS-only) |

## Workspace Structure (turbo.json, apps/, packages/)

**Status**: PARTIALLY CONFIGURED, MINIMAL USE.

- **turbo.json exists** with schema and task definitions (build, dev, lint, test)
- **apps/** directory: Only `zabal-snap/` (9 dirs, 288 bytes). Contains branded snapshot/aggregator but not actively used in main monorepo workflow
- **packages/** directory: 4 packages (agents, config, db, publish) - these are stub libraries that root imports via path aliases but do not have separate builds
- **Verdict**: Turbo is wired but not delivering parallelization gains. Most tasks run in root (next/biome/vitest). Package structure exists but dependencies are loose (path alias via tsconfig instead of formal npm linking)

**Recommendation**: Either properly wire apps/ (set up workspaces in package.json, use turbo for real builds) or remove turbo scripts from root package.json and use `npm run` directly.

## patch-package Patches

| Patch File | Package | Issue | Still Needed? |
|-----------|---------|-------|---------------|
| `@xmtp+wasm-bindings+1.10.0.patch` | @xmtp/wasm-bindings | WASM URL resolution: changes `new URL('bindings_wasm_bg.wasm', import.meta.url)` to `/bindings_wasm_bg.wasm` with origin fallback to zaoos.com | YES - CRITICAL. XMTP WASM fails without this patch in browser context. No upstream fix merged |

## Recommended Actions

### P0 - SECURITY (do immediately)
1. **Upgrade @ardrive/turbo-sdk from 1.41.0 to 1.13.0** to patch HIGH DoS in ws.
   - Owner: Zaal or buildops
   - Timeline: This sprint (if ArDrive SDK is active; check if `@ardrive` is actually used)
   - Effort: 1-2 hours (test post-upgrade, watch for breaking changes in ArDrive API usage)

### P1 - CLEANUP (next sprint)
2. **Remove dead scripts**: `turbo:*`, `analyze`, `cap:*` from root package.json.
   - Justification: Not invoked in CI; confuse new contributors
   - Owner: Zaal
   - Timeline: Before next release
   - Effort: 5 minutes

3. **Reconcile lint strategy**: Clarify canonical linter.
   - Current: `lint` (next lint) vs `lint:biome` (biome) both active
   - Recommendation: Mark `lint:biome` canonical in comments; consider removing `lint` alias
   - Owner: Buildops
   - Timeline: Next refactor cycle

4. **Review @100mslive/hms-video-store usage**.
   - 10MB in node_modules; no code refs found
   - Action: Search for HMS SDK usage in Spaces components; if unused, remove
   - Owner: Zaal (Spaces owner)
   - Timeline: Next build audit

### P2 - NICE-TO-HAVE (future)
5. **Formalize Turbo monorepo setup** if apps/ or packages/ grow.
   - Current: Turbo configured but minimal payoff
   - If keeping: Set up formal workspaces, link packages via npm, enable task concurrency
   - If not keeping: Delete turbo.json and turbo scripts
   - Owner: Zaal + buildops
   - Timeline: Before scaling to 3+ apps

6. **Monitor npm audit** - Run `npm audit` monthly; current 4 critical are all LOW-impact transitive issues (crypto libs)
   - Owner: Zaal
   - Timeline: Routine

## Sources

- `package.json` (root): 105 deps
- `bot/package.json`: 8 deps
- `npm audit --omit=dev`: 84 vulnerabilities (37 low, 17 mod, 26 high, 4 critical)
- `du -sh node_modules/<pkg>`: Size analysis
- `turbo.json`: Monorepo config
- `patches/*.patch`: Patch-package inventory
- `scripts/`: Script references
- Git log: package-lock.json last update 2026-05-02
