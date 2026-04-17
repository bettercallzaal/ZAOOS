# Contributing to ZAO OS

ZAO OS is open source (MIT). Contributions welcome — whether you're fixing a bug, adding a feature, or forking it for your own community.

## Quick Start

```bash
git clone https://github.com/bettercallzaal/zaoos.git
cd zaoos
npm install
cp .env.example .env.local    # fill in required env vars
npm run dev                    # localhost:3000
```

See [FORK.md](./FORK.md) for full setup instructions including database and app wallet.

## Development Workflow

1. **Fork the repo** and create a feature branch from `main`
2. **Make your changes** following the conventions below
3. **Run checks** before submitting:
   ```bash
   npx biome check .    # Lint (Biome)
   npm run typecheck    # TypeScript
   npm run test         # Vitest
   npm run build        # Next.js build
   ```
4. **Open a PR** against `main` with a clear description of what and why

## Code Conventions

### Files & Naming

| Type | Convention | Location |
|------|-----------|----------|
| Components | `PascalCase.tsx` | `src/components/{feature}/` |
| Hooks | `use*.ts` | `src/hooks/` |
| API routes | `route.ts` | `src/app/api/{feature}/{action}/` |
| Utilities | `camelCase.ts` | `src/lib/{domain}/` |
| Tests | `*.test.ts(x)` | Next to source file in `__tests__/` |
| Types | `*.ts` | `src/types/` |

### Imports

Always use the `@/` path alias:
```typescript
import { getSession } from '@/lib/auth/session';
```

### Components

- Add `"use client"` directive if it uses hooks, event handlers, or browser APIs
- Mobile-first — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- Dark theme: navy `#0a1628` bg, gold `#f5a623` primary
- Use `next/dynamic` with `{ ssr: false }` for heavy components
- Tailwind CSS v4 — no inline styles or CSS modules

### API Routes

Every route handler must:
1. Validate input with Zod `safeParse`
2. Check session with `getSession()` for authenticated endpoints
3. Wrap logic in try/catch
4. Return `NextResponse.json(...)` — never raw Response
5. Never expose server-only env vars in responses

### State Management

- React Query (`@tanstack/react-query`) for server state
- React hooks + context for client state
- No Redux, Zustand, or other state libraries

### Testing

- **Framework:** Vitest (`describe`, `it`, `expect`)
- **Mocking:** `vi.mock()` + `vi.hoisted()` — not MSW or raw fetch mocks
- **Location:** `src/app/api/foo/__tests__/route.test.ts` (co-located)
- **Coverage:** Test both success and error paths
- **Data:** Never connect to production or staging databases — use mocks/fixtures

## Security Rules

These are non-negotiable:

- **Never** store, log, or access user wallet private keys
- **Never** use `dangerouslySetInnerHTML`
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, or `APP_SIGNER_PRIVATE_KEY` to the browser
- Validate all user input with Zod before processing
- Use Supabase service role only server-side (API routes)

## What to Contribute

### Good first issues
- UI/UX improvements (dark theme refinements, mobile polish)
- New Farcaster channel integrations
- Music platform provider additions
- Documentation improvements

### Feature areas
- **Music:** New platform providers, playback features, curation algorithms
- **Governance:** Voting UI improvements, proposal workflows
- **Social:** Profile enhancements, social graph features
- **Cross-posting:** New platform integrations (Lens, Hive, Nostr)

### Bug reports
File issues at [github.com/bettercallzaal/zaoos/issues](https://github.com/bettercallzaal/zaoos/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/device info
- Console errors (if any)

## Community

- **App:** [zaoos.com](https://zaoos.com)
- **Farcaster:** [/zao channel](https://farcaster.xyz/~/channel/zao)
- **Discord:** [discord.thezao.com](https://discord.thezao.com)
- **Builder:** [@zaal on Farcaster](https://farcaster.xyz/zaal)

## License

MIT — see [LICENSE](./LICENSE).
