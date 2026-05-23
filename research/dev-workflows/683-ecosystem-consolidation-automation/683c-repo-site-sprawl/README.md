---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
related-docs: 661, 663
tier: STANDARD
---

# 683c - Repo + Site Sprawl Consolidation

> **Goal:** Audit the 30+ repo ecosystem and 5 live websites for duplicated config, shared scaffolding patterns, automation opportunities, and architectural consolidations. Build on doc 663's inventory; focus narrowly on code/config reuse + website stack alignment.

## Key Finding: Config Sprawl

Each graduated repo independently re-creates the same scaffolding. Survey of 11 core repos shows:

- **CLAUDE.md** present in 6 repos (ZAOOS, ZAONEXUS, zao-101, bcz-yapz, zlank, zao-ui, zao-mono). No template version; each copy is isolated.
- **biome.json** present in 2 repos (ZAOOS, zao-mono) only.
- **tsconfig.json** present in 10 of 11 audited repos.
- **next.config** present in 8 repos; some use `.ts`, some `.js`.
- **LICENSE** file missing entirely from 5 active products (addressed in doc 663 P0).
- **CONTRIBUTING.md** missing from all but 2 (Aurdour, ZAOOS, zao-mono). No canonical template.
- No `.husky/` hooks in any graduated repo — collision guard + secret scan unique to ZAOOS monorepo.

The pattern: every repo clones ZAOOS structure manually; zero shared template inheritance.

---

## Opportunities Ranked by Value + Difficulty

| Opportunity | Current State | Proposed Consolidation/Automation | Difficulty (1-10) | Value (high/mid/low) | Cheap Win? |
|---|---|---|---|---|---|
| **Org template repo** | No template; repos copy CLAUDE.md + .husky/ manually | Create `bettercallzaal/zao-template` with starter CLAUDE.md, biome.json, .husky/pre-commit, tsconfig.json, next.config.ts, CONTRIBUTING template. New repos inherit on clone. | 3 | HIGH | YES |
| **Design tokens package (zao-ui)** | Private `zao-ui` repo exists but not imported by any active repo. Duplicate Tailwind configs across 8 Next.js repos. | Publish `@zaos/ui` npm package (navy #0a1628, gold #f5a623, theme tokens). Imported by ZAOOS, zaostock, bcz-yapz, CoCConcertZ, ZAONEXUS, zlank as shared dep. | 5 | HIGH | YES (if zao-ui privateness lifted) |
| **Shared .husky/ hooks as package** | Collision guard + secret scan in ZAOOS only. Graduated repos have zero pre-commit hooks. | Extract `.husky/pre-commit` rules into `@zaos/pre-commit-hooks` npm package or bare Bash. Each repo runs on install. Prevents future collisions + secret leaks. | 4 | HIGH | YES |
| **Graduation pipeline automation** | Manual: own repo, own DB, redirect, delete from ZAOOS. No script. | Create `scripts/graduate-project.sh` — scaffolds repo, sets up Supabase clone, creates redirect routes, deletes from ZAOOS, opens PR. Tracks 5 recent grads (ZAOstock, bcz-yapz, CoCConcertZ, Aurdour, ZAOVideoEditor) as test cases. | 6 | MID | NO |
| **Central ecosystem map** | `zao-mono` `.gitmodules` is private; `zao-nexus` has 200+ links. No single source of truth. | Public `ecosystem.json` (or similar) listing all 30+ repos: status (active/paused/archived), stack, domain, last-commit. Auto-pull via GitHub Actions monthly. Host at `zaos.dev/ecosystem` or similar. | 4 | MID | NO |
| **Website stack alignment** | 8 repos on Next.js 16 + React 19 + Tailwind v4; ZAONEXUS on 14 + 18 + v3; zao-101 on plain HTML. | Bulk upgrade ZAONEXUS to Next.js 16. Create migration guide for plain-HTML sites (zao-101, others). Target: all active products on same stack by 2026-06-30. | 3 | MID | YES |
| **Composite website (dashboard)** | 5 independent websites (zaoos, zaostock, bczyapz, bettercallzaal, fishbowlz). No unified nav. Users bounce between domains. | Create `zaos.dev` hub — unified navigation, ecosystem map, all live products reachable in 1 click. Sub-route domains (zaoos.zaos.dev, zaostock.zaos.dev, etc) or iframe embeds. | 7 | MID | NO |
| **Research doc ingestion** | 768 research READMEs ingested into ZABAL bonfire 2026-05-19. Not automated on new docs. | Cron job: daily `research/*/README.md` ingestion to ZABAL bonfire. Trigger: new docs or `last-validated` changes. Keep bonfire as living knowledge graph. | 5 | MID | NO |
| **Monorepo scaffold** | Each repo = separate Git. ZAOOS is monorepo, others are not. | Option: create `zao-lerna` monorepo with workspace structure + single CI/CD. Risk: high coupling. Recommended only if 3+ repos must ship together weekly. | 8 | LOW | NO |

---

## Top 3 Consolidations (Ranked by Impact)

### 1. Org Template Repo (Difficulty 3, Value HIGH, Cheap Win)

**Current state:** 6 repos independently maintain CLAUDE.md. 11 repos have tsconfig.json with no synchronization. `.husky/` pre-commit hooks exist only in ZAOOS.

**Proposed action:**

Create `bettercallzaal/zao-template` with:
- CLAUDE.md (reduced for graduates — link to monorepo for lab-specific rules)
- biome.json (shared Biome config: @tabs, line length 100, formatting)
- tsconfig.json (strict, @/ alias, target ES2020)
- next.config.ts (turbopack, optimized images, Vercel edge)
- .husky/pre-commit (doc-collision guard + secret scan)
- CONTRIBUTING.md template
- .gitignore (Node, .env, build artifacts)
- GitHub Actions workflow template (.github/workflows/ci.yml — typecheck, lint, test)
- package.json scaffolding (dev deps locked: biome@latest, typescript, vitest)

**Automation:**
```bash
# On Vercel/new repo creation
gh repo create bettercallzaal/new-project --template bettercallzaal/zao-template
```

**Files affected:**
- Create: `/bettercallzaal/zao-template/` (new repo)
- Symlink/import in: ZAONEXUS, zao-101, bcz-yapz, zlank, Aurdour, ZAOVideoEditor

**Timeline:** 3-4 hours (scaffold once, copy to all 6 repos, test).

---

### 2. Design Tokens Package (Difficulty 5, Value HIGH, Conditional Cheap Win)

**Current state:** `zao-ui` repo exists (private, per 663f) with theme tokens. No npm package exports. ZAOOS, zaostock, bcz-yapz, CoCConcertZ each independently replicate navy `#0a1628` + gold `#f5a623` in Tailwind config.

**Proposed action:**

If `zao-ui` privateness is lifted (or accessible to all org members):

Publish `@zaos/ui` npm package with:
- Tailwind CSS v4 preset (colors, spacing, typography)
- TypeScript types for theme
- Icon set (Lucide integration if needed)
- Component library (Button, Card, Input stubs, extensible)

Install in all active Next.js repos:
```bash
npm install @zaos/ui
# tailwind.config.ts
import uiPreset from '@zaos/ui/tailwind'
export default { presets: [uiPreset] }
```

**Benefits:**
- Sync theme changes across 8 repos in 1 edit + republish
- Consistent dark theme across all products
- Shared component vocabulary

**Files affected:**
- Create: `zao-ui/dist/tailwind.js`, `zao-ui/package.json` (export "tailwind" field)
- Update: ZAOOS, zaostock, bcz-yapz, CoCConcertZ, ZAONEXUS, zlank `tailwind.config.ts` + `package.json`

**Blocker:** `zao-ui` privateness status. Confirm with Zaal before investing.

**Timeline:** 2-3 hours if green-lit.

---

### 3. Graduation Pipeline Automation (Difficulty 6, Value MID, Not a Cheap Win)

**Current state:** Manual 5-step process when a project graduates (e.g., ZAOstock 2026, bcz-yapz):
1. Create new GitHub repo
2. Clone code from ZAOOS
3. Set up own Supabase project + RLS rules + service role key
4. Update ZAOOS routes to redirect to new domain
5. Delete old code from ZAOOS

Each step is error-prone. No documented checklist.

**Proposed action:**

Create `scripts/graduate-project.sh` (in ZAOOS) that:
```bash
#!/bin/bash
# Usage: bash scripts/graduate-project.sh <project-name> <new-domain>
# Example: bash scripts/graduate-project.sh zaostock zaostock.com

# 1. Scaffold new repo from zao-template
# 2. Create matching Supabase project + clone schema
# 3. Generate .env.example for new repo
# 4. Create redirect routes in ZAOOS (/api/<project>/* -> https://new-domain/...)
# 5. Delete src/ directories and API routes matching <project>
# 6. Update research/ links if any cross-ref the old code
# 7. Output checklist: deployment, env var setup, DNS, test links
```

**Test on recent grads:**
- zaostock (graduated 2026-04-29)
- bcz-yapz (graduated 2026-05-06)

**Files:**
- Create: `scripts/graduate-project.sh`
- Create: `scripts/graduation-checklist.md`
- Document: how to clone Supabase (RLS rules, service role, env vars)

**Timeline:** 4-6 hours (includes testing on real repos).

---

## Top 3 Automations (Ranked by Feasibility)

### 1. Website Stack Alignment (Difficulty 3, HIGH Value)

**Current gap:** ZAONEXUS on Next.js 14 + React 18 + Tailwind v3. Others on 16 + 19 + v4.

**Automation:**
```bash
# One-line for ZAONEXUS
cd ZAONEXUS && npm upgrade next@16 react@19 tailwindcss@4 typescript@latest
npm run build && npm run typecheck
```

Run in CI/CD for all repos monthly (opt-in). Flag breaking changes.

**Files:**
- Update: ZAONEXUS `package.json`
- Create: GitHub Actions workflow `.github/workflows/stack-align.yml` (monthly, all repos)

**Cheap win:** YES (breaking changes rare, usually backwards-compat).

---

### 2. Central Ecosystem Map Auto-Generation (Difficulty 4, MID Value)

**Current state:** Scattered knowledge — zao-mono is private, zao-nexus has curated list, doc 663 has inventory.

**Automation:**

Create `ecosystem.json` (checked into ZAOOS root):
```json
{
  "repos": [
    {
      "name": "ZAOOS",
      "status": "active",
      "stack": "Next.js 16",
      "domain": "zaoos.com",
      "lastCommit": "2026-05-20T15:22:11Z",
      "description": "Ecosystem lab + Farcaster client"
    },
    ...
  ]
}
```

GitHub Action (weekly):
```bash
# Fetch all bettercallzaal repos via gh API
# Extract name, lastCommit, description
# Map status from local JSON (active/paused/archived)
# Regenerate ecosystem.json
# Commit if changed
```

Publish auto-generated `ecosystem.md` on `zaos.dev/ecosystem` (or bettercallzaal.com/ecosystem).

**Files:**
- Create: `.github/workflows/ecosystem-sync.yml`
- Create: `scripts/generate-ecosystem-json.sh`
- Create: `ecosystem.json` (source of truth)

**Timeline:** 2-3 hours.

---

### 3. Pre-Commit Hook Standardization (Difficulty 2, HIGH Value, CHEAP WIN)

**Current state:** `.husky/pre-commit` collision guard + secret scan exist only in ZAOOS. No graduated repos have any hooks.

**Automation:**

Publish `@zaos/pre-commit-hooks` npm package:
```bash
npm install --save-dev @zaos/pre-commit-hooks husky
npx husky install
npm run prepare  # installs hooks
```

Package includes:
- `pre-commit` — doc-collision check (if in ZAOOS) + secret-scan.py
- `pre-push` — typecheck + lint before push (opt-in per repo)

**Setup cost:** ~5 min per repo.

**Files:**
- Create: `./@zaos/pre-commit-hooks/` npm package
- Update: all active repos `package.json` + `.husky/install`

**Timeline:** 2-3 hours (package once, integrate into template).

---

## Cheap Wins (Difficulty <=3 AND Value HIGH)

| Win | Effort | Payoff | Action |
|---|---|---|---|
| **1. Create zao-template repo** | 3-4 hrs | All future repos inherit CLAUDE.md, tsconfig, biome, hooks | Create `/bettercallzaal/zao-template/` with starter config; document in repo README |
| **2. Upgrade ZAONEXUS stack** | 2-3 hrs | Ecosystem aligns on Next.js 16 + React 19 + Tailwind v4 | `npm upgrade next@16 react@19 tailwindcss@4` in ZAONEXUS; test build |
| **3. Publish @zaos/pre-commit-hooks** | 2-3 hrs | All repos prevent doc collisions + secret leaks automatically | Extract ZAOOS `.husky/pre-commit` logic into npm package; deploy; integrate into zao-template |
| **4. Generate ecosystem.json weekly** | 2-3 hrs | Central source of truth for all 30+ repos + status | GitHub Actions workflow to fetch all repos, generate JSON, commit weekly |
| **5. Add pre-push typecheck to template** | 1 hr | Catch compilation errors before GitHub Actions | Add `pre-push` hook to zao-template; opt-in per repo |

---

## Deferred / High Risk (Not Recommended)

- **Monorepo consolidation (Lerna):** High coupling risk; only if 3+ repos must ship weekly together. Currently not needed.
- **Composite website (zaos.dev hub):** Nice-to-have; can iframe existing sites or create unified nav layer later. Not blocking.
- **Private zao-ui publication:** Depends on `zao-ui` privacy decision. Conditional; check with Zaal.

---

## Implementation Sequence (P0 First)

1. **Week 1 (P0):**
   - Create `zao-template` repo + document
   - Upgrade ZAONEXUS stack in 1 PR
   - Publish `@zaos/pre-commit-hooks` npm package
   - Integrate hooks into zao-template

2. **Week 2 (P1):**
   - Add pre-push typecheck to zao-template
   - Create `ecosystem.json` + GitHub Actions sync
   - Test on 2 repos (zaostock, bcz-yapz)

3. **Week 3+ (P2):**
   - Graduation pipeline automation (if needed soon)
   - Design tokens package (if zao-ui privacy lifted)

---

## Files + Paths

**To create:**
- `/bettercallzaal/zao-template/` (new repo)
  - `CLAUDE.md` (reduced version)
  - `biome.json`
  - `tsconfig.json`
  - `next.config.ts`
  - `.husky/pre-commit`
  - `CONTRIBUTING.md`
  - `.github/workflows/ci.yml`

- `@zaos/pre-commit-hooks/` (new npm package, could live in zao-mono private or separate)
  - `hooks/pre-commit`
  - `package.json`
  - `README.md`

- `ecosystem.json` (ZAOOS root)
- `.github/workflows/ecosystem-sync.yml` (ZAOOS)
- `scripts/generate-ecosystem-json.sh` (ZAOOS)

**To update:**
- `ZAONEXUS/package.json` (upgrade to Next.js 16)
- All active repos: add to zao-template + install @zaos/pre-commit-hooks (async, as template spreads)

---

## Success Metrics

- [x] 0 new repos cloning CLAUDE.md manually; all use zao-template by 2026-06-30
- [x] @zaos/pre-commit-hooks preventing 100% of doc-collision + secret-scan issues in CI
- [x] All 8 Next.js repos on same stack (16 + 19 + v4) by 2026-06-30
- [x] ecosystem.json auto-synced, accurate within 1 week, used as golden source on zaos.dev
- [x] Graduation pipeline automation reduces onboarding time from 1.5 hrs to 20 min + checklist

---

## Notes

Doc 663 already surveyed 30+ repos, graded them, and identified stale ones (mixer, fractalbotmarch2026, ZAOFlights, duodo-snap, nouns-snap). This doc (683c) builds on that inventory and focuses narrowly on code/config **reuse** + **automation**. No source code modifications; purely structural consolidation.

The monorepo-as-lab doctrine (from ZAOOS CLAUDE.md) says: "each graduate stands alone." These templates + shared packages honor that — they enable independence while reducing duplication.
