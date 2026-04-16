# 405 -- ZAO OS Monorepo Migration Plan

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** Convert ZAO OS from a bloated 13GB single repo to a clean monorepo with pnpm workspaces + Turborepo

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Monorepo tool** | USE pnpm workspaces + Turborepo. pnpm saves ~60% disk with symlinked node_modules. Turborepo adds caching + parallel builds. Vercel deploys monorepos natively. Next.js 16 has official Turborepo template |
| **Remove broken submodules** | REMOVE `duodo-snap` and `nouns-snap` git submodule refs immediately -- they're `160000 commit` entries with no `.gitmodules` file. Broken, taking space in every clone. `zabal-snap` is a real directory, keep |
| **Remove large files** | REMOVE `public/logo.png` (12MB -- replace with optimized version <500KB), all PDFs from `ZAO-STOCK/research/ellsworth-pdfs/` and `ellsworth info/`, test mp3 files |
| **Package structure** | SPLIT into: `apps/web` (main Next.js app), `apps/zabal-snap` (Farcaster snap), `packages/agents` (shared agent modules), `packages/publish` (cross-posting), `packages/config` (shared config) |
| **Research stays in root** | KEEP `research/` in root -- it's read by agents across packages. Not a buildable package. Just markdown files |
| **git-filter-repo** | USE to rewrite history and permanently remove large files from .git (142MB). Reduces clone time significantly |
| **SKIP Nx** | Turborepo is simpler, Vercel-native, and sufficient for our scale (2-3 apps, 3-5 packages) |

---

## Current Repo Audit

| Item | Size | Tracked | Action |
|------|------|---------|--------|
| `duodo-snap` | 139MB | YES (broken submodule ref) | **REMOVE** -- `git rm duodo-snap` |
| `nouns-snap` | 129MB | YES (broken submodule ref) | **REMOVE** -- `git rm nouns-snap` |
| `public/logo.png` | 12MB | YES | **REPLACE** with <500KB optimized |
| `ZAO-STOCK/research/ellsworth-pdfs/` | ~12MB | YES | **REMOVE** from git, keep locally |
| `ellsworth info/` | 13MB | YES | **REMOVE** from git, keep locally |
| `test-instrumental.mp3` | ? | NO (untracked) | **ADD to .gitignore** |
| `test-voice-clone.mp3` | ? | NO (untracked) | **ADD to .gitignore** |
| `zabal-snap/node_modules/` | 128MB | NO (gitignored) | OK -- stays gitignored |
| `package-lock.json` | 1.3MB | YES | Replace with `pnpm-lock.yaml` after migration |

## Comparison: Monorepo Tools

| Tool | Setup Complexity | Caching | Vercel Native | pnpm Support | ZAO Fit |
|------|-----------------|---------|---------------|-------------|---------|
| **Turborepo + pnpm** | LOW -- `npx create-turbo@latest` | YES (local + remote) | YES (built by Vercel) | YES (recommended) | **BEST** |
| **Nx** | HIGH -- heavier, enterprise-focused | YES (local + remote) | Partial | YES | Overkill |
| **pnpm workspaces only** | VERY LOW -- just `pnpm-workspace.yaml` | NO | YES | YES | Good for start, add Turbo later |
| **Lerna** | MEDIUM -- legacy, partially deprecated | Via Nx | NO | YES | SKIP -- outdated |
| **npm workspaces** | LOW | NO | YES | N/A (npm not pnpm) | SKIP -- pnpm is better |

---

## Target Monorepo Structure

```
zaoos/
├── apps/
│   ├── web/                  # Main Next.js 16 app (current src/)
│   │   ├── src/
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── zabal-snap/           # Farcaster snap (current zabal-snap/)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── agents/               # Agent modules (current src/lib/agents/)
│   │   ├── runner.ts
│   │   ├── wallet.ts
│   │   ├── swap.ts
│   │   ├── ...
│   │   └── package.json
│   ├── publish/              # Cross-posting (current src/lib/publish/)
│   │   ├── telegram.ts
│   │   ├── x.ts
│   │   ├── ...
│   │   └── package.json
│   ├── config/               # Shared config + types
│   │   ├── community.config.ts
│   │   ├── index.ts
│   │   └── package.json
│   └── db/                   # Supabase client + helpers
│       ├── supabase.ts
│       ├── package.json
│       └── tsconfig.json
├── research/                 # 360+ research docs (not a package, just files)
├── scripts/                  # SQL migrations, setup scripts
├── docs/                     # Plans, specs, briefs
├── contracts/                # Solidity (staking, bounty board)
├── .claude/                  # Claude skills + settings
├── turbo.json                # Turborepo config
├── pnpm-workspace.yaml       # Workspace definition
├── package.json              # Root package.json
└── tsconfig.json             # Root TypeScript config
```

---

## Migration Steps (Order Matters)

### Phase 1: Clean Up (30 min, immediate savings)

```bash
# 1. Remove broken submodule refs
git rm duodo-snap nouns-snap
git commit -m "chore: remove broken duodo-snap + nouns-snap submodule refs"

# 2. Remove large files
git rm public/logo.png  # replace with optimized version after
git rm -r "ZAO-STOCK/research/ellsworth-pdfs/"
git rm -r "ellsworth info/"
git rm -r "csv import/"
git commit -m "chore: remove large tracked files (PDFs, 12MB logo)"

# 3. Add to .gitignore
echo "*.mp3" >> .gitignore
echo "*.pdf" >> .gitignore
echo "ellsworth info/" >> .gitignore
git add .gitignore && git commit -m "chore: gitignore mp3s, pdfs, ellsworth"

# 4. Optimize logo
# Convert 12MB PNG → <500KB WebP or optimized PNG
# Add back as public/logo.webp
```

**Savings: ~280MB from tracked files**

### Phase 2: Install Turborepo + pnpm (1 hour)

```bash
# 1. Install pnpm globally
npm install -g pnpm

# 2. Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 3. Create turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
EOF

# 4. Convert from npm to pnpm
rm -rf node_modules package-lock.json
pnpm install
```

### Phase 3: Move Files to Package Structure (2-3 hours)

```bash
# 1. Create apps/web from current root
mkdir -p apps/web
# Move: src/, public/, next.config.ts, postcss.config.mjs, etc.

# 2. Move zabal-snap
mv zabal-snap apps/zabal-snap

# 3. Create packages/agents
mkdir -p packages/agents
# Move: src/lib/agents/*.ts → packages/agents/src/

# 4. Create packages/publish
mkdir -p packages/publish
# Move: src/lib/publish/*.ts → packages/publish/src/

# 5. Create packages/config
mkdir -p packages/config
# Move: community.config.ts → packages/config/

# 6. Update imports across all files
# @/lib/agents/... → @zaoos/agents/...
# @/lib/publish/... → @zaoos/publish/...
```

### Phase 4: Clean Git History (Optional, 1 hour)

```bash
# Use git-filter-repo to permanently remove large files from history
pip install git-filter-repo

# Remove files that were tracked but shouldn't have been
git filter-repo --path duodo-snap --invert-paths
git filter-repo --path nouns-snap --invert-paths
git filter-repo --path "ellsworth info/" --invert-paths
git filter-repo --path "ZAO-STOCK/research/ellsworth-pdfs/" --invert-paths

# Force push (destructive -- all collaborators must re-clone)
git push origin main --force
```

**WARNING:** git-filter-repo rewrites ALL commit hashes. Everyone must re-clone. Do this LAST, after everything else is stable.

---

## Vercel Deployment (Monorepo)

Vercel natively supports monorepos. Configure in project settings:

```
Root Directory: apps/web
Build Command: cd ../.. && pnpm turbo build --filter=web
Install Command: pnpm install
```

Or use `vercel.json`:
```json
{
  "buildCommand": "pnpm turbo build --filter=web",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

Turborepo caching means unchanged packages skip rebuild. Deploy time drops significantly for small changes.

---

## Package.json Changes

### Root package.json (new)

```json
{
  "name": "zaoos",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2",
    "typescript": "^5"
  },
  "packageManager": "pnpm@10.0.0"
}
```

### apps/web/package.json

```json
{
  "name": "web",
  "dependencies": {
    "@zaoos/agents": "workspace:*",
    "@zaoos/publish": "workspace:*",
    "@zaoos/config": "workspace:*",
    "next": "16.2.2",
    "react": "19.2.4"
  }
}
```

### packages/agents/package.json

```json
{
  "name": "@zaoos/agents",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@privy-io/node": "latest",
    "@zaoos/config": "workspace:*"
  }
}
```

---

## ZAO Ecosystem Integration

### Codebase Files Affected

| Current Path | New Path |
|-------------|----------|
| `src/` | `apps/web/src/` |
| `public/` | `apps/web/public/` |
| `src/lib/agents/` | `packages/agents/src/` |
| `src/lib/publish/` | `packages/publish/src/` |
| `community.config.ts` | `packages/config/community.config.ts` |
| `zabal-snap/` | `apps/zabal-snap/` |
| `research/` | `research/` (stays in root) |
| `scripts/` | `scripts/` (stays in root) |
| `contracts/` | `contracts/` (stays in root) |
| `package.json` | Root + `apps/web/package.json` + package.jsons |

### Import Path Changes

```typescript
// Before:
import { TOKENS } from '@/lib/agents/types';
import { publishToTelegram } from '@/lib/publish/telegram';

// After:
import { TOKENS } from '@zaoos/agents';
import { publishToTelegram } from '@zaoos/publish';
```

---

## Sources

- [Turborepo + Next.js Guide](https://turborepo.dev/docs/guides/frameworks/nextjs)
- [Vercel Monorepo Template](https://vercel.com/templates/next.js/monorepo-turborepo)
- [pnpm Workspaces Monorepo (Medium)](https://medium.com/@oxm/how-i-built-a-professional-full-stack-monorepo-with-next-js-node-js-and-pnpm-workspaces-2026-1b8f5ac66bf9)
- [Monorepo Tools 2026 Comparison](https://viadreams.cc/en/blog/monorepo-tools-2026/)
- [Frontend Monorepo Architecture (DEV)](https://dev.to/malloc72p/frontend-monorepo-architecture-a-practical-guide-with-pnpm-workspaces-and-turborepo-4dbk)
