# 93 — Missing Infrastructure: Testing, CI/CD, Monitoring, Design System, PWA

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Evaluate and recommend solutions for 5 infrastructure gaps in ZAO OS — testing strategy, CI/CD pipeline, error monitoring, design system documentation, and PWA support

---

## Key Decisions / Recommendations

| Gap | Recommendation | Effort | Cost |
|-----|---------------|--------|------|
| **Testing** | Table-driven Vitest tests for all 64 routes. Use `vi.mock()` (NOT MSW). Shared `test-utils/api-helpers.ts`. Target 80% coverage | ~4 hours CC | $0 |
| **CI/CD** | GitHub Actions: lint → typecheck → test → build. Let Vercel handle deploys. Branch protection on main | ~1 hour CC | $0 (free tier: 2,000 min/mo) |
| **Error monitoring** | Sentry free tier (5K errors/mo) + UptimeRobot free (50 monitors) | ~30 min CC | $0 |
| **Design system** | Run `/design-consultation` to generate DESIGN.md. Use Tailwind v4 `@theme` for navy/gold token scales. Skip Storybook for now | ~1 hour CC | $0 |
| **PWA** | Serwist (successor to next-pwa). Web Push via `web-push` library + Farcaster Mini App push | ~3 hours CC | $0 |

---

## 1. Testing Strategy

### Current State
- 11 test files for 64 API routes (~17% coverage)
- Vitest 3.2.4 installed
- MSW is NOT installed despite being in test conventions
- Existing tests use `vi.mock()` + `vi.hoisted()` pattern — this is correct and should continue

### What to Do

**Update `.claude/rules/tests.md`** — remove MSW recommendation, document the `vi.mock()` pattern that's actually used.

**Create shared test utilities** at `src/test-utils/api-helpers.ts`:
- `makeRequest(path, options)` — builds NextRequest
- `chainMock(result)` — reusable Supabase chain mock
- `mockAuthenticatedSession(overrides)` — default session data
- `mockUnauthenticatedSession()` — null session

**Use table-driven tests** for auth/validation layer (fastest path to coverage):
```typescript
describe.each(routeTests)('$method $path', ({ handler }) => {
  it('returns 401 when unauthenticated', async () => { ... });
  it('returns 400 on invalid input', async () => { ... });
});
```

**Priority order:**
1. Auth routes (8 routes) — security-critical
2. Chat routes (7 routes) — highest traffic
3. Admin routes (7 routes) — privilege escalation risk
4. Governance (3 routes) — already partially covered
5. Everything else

**Coverage targets:** 80% line, 70% branch, 90%+ for auth checks.

**Do NOT use:** MSW, snapshot testing for API responses, or Playwright for unit tests.

---

## 2. CI/CD Pipeline

### GitHub Actions Config

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm test
  build:
    runs-on: ubuntu-latest
    needs: [lint-typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run build
```

**Branch protection rules:** Require `lint-typecheck`, `test`, `build`, and Vercel checks to pass before merging to main.

**Free tier budget:** ~1,500 of 2,000 min/month at 10 pushes/day. Well within limits.

**Let Vercel handle deploys** — it already creates preview deployments for every PR. No need to duplicate this in GitHub Actions.

---

## 3. Error Monitoring

### Sentry (Primary — Error Tracking)
- **Free tier:** 5K errors/month, 1 user, performance monitoring
- **Install:** `npx @sentry/wizard@latest -i nextjs` — scaffolds config files automatically
- **What it covers:** Server components, route handlers, middleware, client components, source maps
- **Alert:** Slack/Discord webhook for new errors

### UptimeRobot (Secondary — Uptime)
- **Free tier:** 50 monitors, 5-min intervals, email/webhook alerts, free status page
- **Monitor:** zaoos.com, `/api/auth/session` (health check), Neynar webhook endpoint

### Vercel Analytics (Already Have)
- Keep for Web Vitals and traffic. Not a substitute for error tracking.

**Skip:** LogRocket (overkill), Highlight.io (less mature), BetterStack (logging only, not error tracking).

---

## 4. Design System

### What to Create: DESIGN.md

Use Tailwind v4 `@theme` directive for design tokens:

```css
@theme {
  --color-navy-900: #0a1628;    /* background */
  --color-navy-800: #14253f;    /* surface-raised */
  --color-navy-700: #1e3558;    /* surface-overlay */
  --color-gold-400: #f5a623;    /* accent */
  --color-gold-300: #f8c368;    /* accent-hover */
  --color-surface: var(--color-navy-900);
  --color-accent: var(--color-gold-400);
  --color-text-primary: #e8ecf2;
  --color-text-secondary: #9eafca;
}
```

### DESIGN.md Should Include
1. Design principles (3-5)
2. Color system (navy scale, gold scale, semantic tokens)
3. Typography (font stack, sizes, weights)
4. Spacing (4px/8px grid)
5. Component inventory (buttons, cards, forms, nav, modals)
6. Dark theme rules (lighter = higher elevation, no pure white)
7. Motion/animation guidelines

**Skip Storybook** — overhead too high for 1-2 person team. A well-written DESIGN.md with code examples is more valuable.

**Use `/design-consultation`** (gstack skill, already installed) to generate the initial DESIGN.md.

---

## 5. Progressive Web App

### Library: Serwist
- Successor to next-pwa. First-class Next.js 16 + Turbopack support.
- Install: `npm i @serwist/next serwist`
- Create `src/app/sw.ts` + wrap `next.config.ts` with `withSerwistInit()`
- **Bundle impact: zero** — service worker loads separately

### Push Notifications Strategy
1. **Farcaster Mini App push** (already have SDK) — for users inside Farcaster clients
2. **web-push with VAPID keys** (~15KB) — for standalone PWA users
3. Store subscriptions in Supabase `push_subscriptions` table

### Offline Strategy
- Precache app shell (automatic via Serwist `defaultCache`)
- NetworkFirst for API calls (cached data shown instantly)
- StaleWhileRevalidate for images/artwork
- Offline fallback page: `src/app/~offline/page.tsx`
- Do NOT cache XMTP (E2E encrypted, should not be in service worker cache)
- Queue outbound actions with `BackgroundSyncQueue`

### iOS Safari Notes
- Push notifications work on iOS 16.4+ (Home Screen only)
- No background sync — queued actions replay on reopen
- 50MB storage quota (fine for 100 users)
- iron-session cookies persist across PWA launches

---

## Implementation Priority

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| **P0** | CI/CD pipeline | 1 hour | Prevents broken deploys |
| **P0** | Sentry error monitoring | 30 min | Catches production errors |
| **P1** | Test utilities + auth tests | 2 hours | Security baseline |
| **P1** | DESIGN.md via `/design-consultation` | 1 hour | Design consistency |
| **P2** | Full test coverage (64 routes) | 4 hours | Production confidence |
| **P2** | PWA + service worker | 3 hours | Mobile experience |
| **P3** | UptimeRobot + status page | 10 min | Uptime awareness |
| **P3** | Web Push notifications | 2 hours | Engagement |

---

## Sources

- [Vitest Docs](https://vitest.dev)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [UptimeRobot](https://uptimerobot.com)
- [Serwist Next.js](https://serwist.pages.dev/docs/next/getting-started)
- [web-push npm](https://www.npmjs.com/package/web-push)
- [Tailwind CSS v4 @theme](https://tailwindcss.com/docs/theme)
- [Shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
