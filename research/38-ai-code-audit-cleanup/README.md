# 38 — AI Code Audit, Cleanup Agents & Codebase Efficiency

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Best practices for auditing AI-written code, using agents for cleanup, and maintaining code health

---

## The Problem with AI-Generated Code

| Issue | How Much Worse Than Human Code |
|-------|-------------------------------|
| Logic/correctness errors | **1.75x** more |
| Code quality/maintainability | **1.64x** more |
| Security findings | **1.57x** more |
| Performance issues | **1.42x** more |
| XSS vulnerabilities | **2.74x** more |
| Insecure object references | **1.91x** more |
| Improper password handling | **1.88x** more |

**45% of AI-generated code contains security flaws** — and this rate has NOT improved even as models get better at syntax.

**19.7% of AI-suggested packages don't exist** — enables "slopsquatting" attacks.

**76% of developers** report rewriting at least half of AI-generated code.

---

## 1. AI Code Review Checklist

1. **Functional correctness** — Does it actually do what was requested?
2. **Hallucination check** — Do all imports, APIs, and methods exist? Run `npm info <package>`.
3. **Security scan** — Unsanitized inputs, hardcoded secrets, dependency risks?
4. **Logic verification** — Edge cases, off-by-one, null handling?
5. **Performance** — N+1 queries, unnecessary allocations, missing indexes?
6. **Code style** — Matches project conventions, or invents new patterns?
7. **Deleted validations** — Did AI silently remove error handling, auth checks, guards?
8. **Dependency versions** — Current and not end-of-life?
9. **License compliance** — Is generated code copying GPL/restrictive code?
10. **Test coverage** — Tests exist and test meaningful behavior (not just happy path)?

---

## 2. Security Scanning Tools

| Tool | What It Does | Cost |
|------|-------------|------|
| **ESLint + eslint-plugin-security** | Catches eval, non-literal require, etc. | Free |
| **TypeScript strict mode** | Catches null errors, implicit any, unchecked index | Free |
| **Snyk** | Dependency vulnerability scanning + dashboard | Free tier |
| **npm audit** | Built-in dependency vulnerability scanning | Free |
| **Socket.dev** | Behavioral analysis, catches supply chain attacks | Free tier |
| **GitHub Dependabot** | Auto-PRs for vulnerable/outdated deps | Free |
| **TruffleHog** | Scans git history for 800+ secret types, verifies if live | Free |
| **git-secrets** | Pre-commit hook to prevent committing secrets | Free |
| **SonarCloud** | 6,000+ static analysis rules, dashboards | Free for public |

---

## 3. AI Agents for Code Cleanup

### Claude Code (Recommended Primary)

- **CLAUDE.md** is the most impactful config — define conventions, structure, naming
- **Plan mode** (`/plan`) before complex tasks — reduces architecture errors by 45%
- **XML tags** in prompts produce up to 39% better results
- **Code Review Plugin:** `claude plugin install code-review@claude-code-marketplace`
  - Examines correctness, security, performance, style, testing
  - Customize with `REVIEW.md` to control verbosity
- **Security Review GitHub Action:** `anthropics/claude-code-security-review` — analyzes PR diffs

**Effective cleanup prompts:**
- "Review this file for dead code, unused imports, and functions to extract into hooks."
- "Identify security issues in this API route — check auth, input validation, error handling."
- "Refactor this component: extract data fetching into a hook, split UI into smaller components."

### Other Agents

| Agent | Best For |
|-------|----------|
| **Cursor** | Multi-file refactoring, agentic tasks, speed |
| **Aider** | Terminal-based pair programming, targeted refactoring |
| **Cody (Sourcegraph)** | Large codebase-scale refactoring, symbol renaming |
| **Sweep AI** | Automated cleanup PRs on recurring schedule |

### Review Workflow
1. AI suggests changes in a branch/PR
2. Automated checks run (lint, type check, tests)
3. Human reviews the diff
4. Iterate if needed → Merge

---

## 4. Code Quality Tools for ZAO OS

### ESLint Config (Recommended)

```
eslint-config-next (includes Core Web Vitals)
@typescript-eslint/recommended + @typescript-eslint/strict
eslint-plugin-security (eval, non-literal require)
eslint-plugin-no-secrets (hardcoded API keys)
```

### TypeScript Strict Config

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`noUncheckedIndexedAccess` is NOT included in `strict` but catches a huge class of runtime errors (adds `| undefined` to array/object index access).

### Dead Code Detection

**Knip** — finds unused files, exports, dependencies in one pass. Understands Next.js, Vitest, ESLint natively.

```bash
npx knip  # zero config for most projects
```

### Bundle Analysis

- `@next/bundle-analyzer` for HTML reports
- `optimizePackageImports` in `next.config.js` for icon/UI libraries
- `bundlephobia.com` before installing new packages

### Testing

**Vitest** over Jest — 30-70% faster, native TypeScript/ESM, built-in coverage.

---

## 5. Automated CI Pipeline

### Pre-Commit Hooks (Husky + lint-staged)

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### GitHub Actions Pipeline

```yaml
name: Code Health
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx tsc --noEmit              # Type check
      - run: npx eslint .                  # Lint
      - run: npx vitest run --coverage      # Tests
      - run: npx next build                # Build check
      - run: npx knip                      # Dead code
      - run: npm audit --audit-level=high  # Security
      - run: trufflehog git file://. --only-verified  # Secrets
```

---

## 6. Web3-Specific Auditing

### Secret Scanning
- **TruffleHog** classifies 800+ secret types, verifies if live
- Run as pre-commit hook AND CI step
- `trufflehog git file://. --only-verified`

### Wallet/Signing Code Review
- Never store private keys in frontend or `NEXT_PUBLIC_` vars
- Neynar API key = server-side only
- Verify all message signatures server-side
- Audit transaction signing flows for skipped confirmations

### Supabase Audit
- Verify RLS enabled on ALL tables with user data
- `anon` key (public) only accesses what RLS allows
- Never use `service_role` key client-side
- Review RLS policies for overly permissive conditions

---

## 7. Refactoring Strategies for Next.js

### Component Extraction
- Push `'use client'` boundary as far down as possible
- Extract interactive parts into small Client Components
- Use private folders (`_components/`) for co-located components

### Hook Consolidation
- Dedicated `/hooks` directory
- Split components using `useSearchParams` into inner component + `<Suspense>` wrapper

### Supabase Query Optimization
- Server Components for initial fetch, React Query for client cache
- `supabase-cache-helpers` for automatic QueryKey management
- `staleTime: 60000` minimum (not 0 everywhere)
- `Promise.all` for independent queries
- Include all variables in `queryKey`

### State Management
- Server Components + React Query + `useState`/`useReducer` for most apps
- Zustand only for cross-component client state not from server queries
- Remove redundant state management layers

---

## 8. Priority Action Plan for ZAO OS

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | **Enable TypeScript strict mode** | Highest — catches most bugs for free | Small |
| 2 | **Add Knip** — find/remove dead code | High — clean up accumulated cruft | Small |
| 3 | **Set up Husky + lint-staged** | High — quality gates on every commit | Small |
| 4 | **Add TruffleHog to CI** | Critical — scan for leaked keys | Small |
| 5 | **Install Vitest** — test auth flows + data mutations | High — safety net for refactoring | Medium |
| 6 | **Add bundle analysis** | Medium — track client JS size | Small |
| 7 | **Set up SonarCloud** | Medium — ongoing quality dashboards | Small |
| 8 | **Configure Claude Code review plugin** | Medium — always-available reviewer | Small |

### Consolidating 65 Repos

Don't do a full monorepo migration. Instead:
1. Identify reusable code across repos with GitHub code search
2. Extract shared utilities into a `packages/shared` npm package
3. Archive repos not touched in 6+ months and not deployed
4. Use Turborepo only if 3+ actively developed packages share code
5. ZAO OS stays as single repo. Future services (ZID, Respect, Taste) as separate repos with shared types

---

## Sources

- [CodeRabbit: AI vs Human Code Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
- [Veracode: AI Code Security Risks](https://www.veracode.com/blog/ai-generated-code-security-risks/)
- [Endor Labs: AI Code Vulnerabilities](https://www.endorlabs.com/learn/the-most-common-security-vulnerabilities-in-ai-generated-code)
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/en/)
- [OpenSSF: AI Code Assistant Security Guide](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions)
- [GitHub: Review AI-Generated Code](https://docs.github.com/en/copilot/tutorials/review-ai-generated-code)
- [Claude Code: Common Workflows](https://code.claude.com/docs/en/common-workflows)
- [Claude Code: Security Review Action](https://github.com/anthropics/claude-code-security-review)
- [Knip](https://knip.dev/)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)
- [Vitest Coverage](https://vitest.dev/guide/coverage)
- [TypeScript TSConfig](https://www.typescriptlang.org/tsconfig/)
- [Supabase Security Testing](https://supabase.com/docs/guides/security/security-testing)
- [Next.js App Router Patterns 2026](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146)
- [SonarQube](https://www.sonarsource.com/products/sonarqube/)
- [Husky + GitHub Actions CI/CD](https://www.freecodecamp.org/news/how-to-set-up-a-ci-cd-pipeline-with-husky-and-github-actions/)
