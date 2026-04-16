# 367 - Biome Migration, Microservice Decomposition, Keyboard UX & Shared UI Patterns

> **Status:** Research complete
> **Date:** 2026-04-15
> **Goal:** Concrete implementation details for 4 patterns: Biome over ESLint, Nook's microservice split, Herocast keyboard shortcuts, MakerKit shared UI

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Biome over ESLint | USE - ZAO OS is pure TypeScript/React/Next.js, Biome covers this perfectly. 32-68x faster lint, 22-58x faster format. Herocast and Nook both already use Biome |
| eslint-config-next handling | KEEP `next lint` for Next.js-specific rules (Image, Link, metadata). Run Biome for everything else. Hybrid approach until Biome adds full Next.js plugin |
| Microservice split | SKIP for now - ZAO OS has ~50 API routes, not enough volume to justify splitting. When any single domain hits 20+ routes, extract to separate service |
| Nook's @nook/common pattern | USE concept - ZAO already has `src/lib/` as the shared layer. Formalize with stricter boundaries: components never import Supabase directly |
| Keyboard shortcuts | EXPAND - ZAO already has `src/hooks/useKeyboardShortcuts.ts` with 5 shortcuts. Add cmdk command palette like Herocast for power-user navigation |
| react-hotkeys-hook | SKIP - ZAO's custom hook is simpler and works. Herocast uses react-hotkeys-hook but it's unnecessary dep for 10-15 shortcuts |
| cmdk command palette | USE - Herocast's Cmd+K palette is the killer UX pattern. Install cmdk (1KB), wire to ZAO's SearchDialog. Already have Cmd+K bound |
| Shared UI package (@zao/ui) | USE - already created at bettercallzaal/zao-ui. Next step: extract actual components from ZAO OS, not just tokens |

## 1. Biome Migration (ESLint --> Biome)

### Why Biome

| Metric | ESLint | Biome | Improvement |
|--------|--------|-------|-------------|
| Lint 10,000 files | 45.2s | 0.8s | 56x faster |
| Format 10,000 files | 12.1s | 0.3s | 40x faster |
| Config files needed | .eslintrc + .prettierrc + plugins | biome.json (1 file) | Simpler |
| Install size | ~100MB (eslint + plugins) | ~10MB | 10x smaller |
| Total rules (v2.3) | Varies by plugins | 423 | Growing fast |
| Next.js specific rules | eslint-config-next | Not yet (use next lint) | Hybrid needed |

### Migration Steps for ZAO OS

```bash
# Step 1: Install Biome
cd zaoos/
pnpm add -D -E @biomejs/biome

# Step 2: Auto-migrate ESLint rules
npx @biomejs/biome migrate eslint --write

# Step 3: Update package.json scripts
# Keep "lint": "next lint" for Next.js rules
# Add biome scripts alongside
```

**package.json changes:**
```json
{
  "scripts": {
    "lint": "next lint",
    "lint:biome": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

**biome.json** (already created at `zao-mono/biome.json`, copy to each sub-repo):
- `noDangerouslySetInnerHtml: "error"` - ZAO security rule enforced at lint level
- `noUnusedVariables: "warn"` - catch dead code
- `noExplicitAny: "warn"` - improve type safety
- Single quotes, semicolons, trailing commas, 2-space indent, 100 char width

### What to Keep from ESLint

| Keep | Why |
|------|-----|
| `next lint` script | Next.js-specific rules (Image optimization, Link usage, metadata) |
| eslint-config-next dep | Required by `next lint` |

| Remove | Why |
|--------|-----|
| eslint (standalone) | Replaced by Biome |
| .eslintrc.* config | Rules in biome.json now |
| prettier (if installed) | Biome formats too |
| .prettierrc config | Not needed |

### Gotchas

1. **Import sorting differs** - Biome's import organization is opinionated. First run will reorder imports. Commit separately.
2. **Formatter output varies slightly** - Run `biome format --write .` once, commit the diff, then it's stable.
3. **eslint-plugin-jsx-a11y** - Not fully in Biome yet. If using a11y rules, keep ESLint for those files only.
4. **CI command** - Use `biome ci .` not `biome check .` in CI - it's non-interactive and fails on violations.

### Who Else Uses Biome

- **Herocast** (Farcaster client) - `@biomejs/biome ^2.3.12` with husky pre-commit hooks
- **Nook** (Farcaster client, defunct) - Biome in devDependencies
- **Farcaster Hub** - TurboRepo + Biome for formatting
- Biome itself is used by 20,000+ projects on npm

## 2. Nook's Microservice Decomposition

### Architecture

Nook split their Farcaster client into 15 packages under a monorepo:

```
nook-client/
├── apps/
│   ├── expo/           # React Native mobile app
│   └── next/           # Next.js web app
├── packages/
│   ├── common/         # Shared types, Prisma clients, queues, utils
│   ├── api/            # Core API
│   ├── farcaster/      # Farcaster protocol logic
│   ├── farcaster-api/  # Farcaster-specific REST endpoints
│   ├── content-api/    # Content serving
│   ├── notifications/  # Notification logic
│   ├── notifications-api/  # Notification REST endpoints
│   ├── signer-api/     # Farcaster signer management
│   ├── list-api/       # Lists/collections
│   ├── swap-api/       # Token swap endpoints
│   ├── scheduler/      # Cron/scheduled jobs
│   ├── events/         # Event processing (webhooks, blockchain)
│   ├── scripts/        # Data import, maintenance
│   ├── app/            # Shared app logic
│   └── app-ui/         # Shared UI components
```

### @nook/common - The Shared Foundation

Most valuable pattern. One package holds:
- **7 separate Prisma schemas** (user, farcaster, notifications, content, signer, lists, nook)
- **BullMQ queues** - job processing across all services
- **Shared types** - TypeScript interfaces used everywhere
- **Clients** - reusable API/protocol clients
- **Utils** - helper functions

### What ZAO Can Learn (Without Splitting)

ZAO OS doesn't need 15 microservices. But the **boundary pattern** is valuable:

| Nook Pattern | ZAO Equivalent | Action |
|-------------|----------------|--------|
| `@nook/common` | `src/lib/` | Already exists. Enforce: components NEVER import from `@supabase/supabase-js` directly |
| `farcaster-api/` | `src/app/api/farcaster/` | Already organized by feature |
| `notifications/` | `src/app/api/notifications/` | Already exists |
| `scheduler/` | Could use Trigger.dev | Future: extract cron jobs when volume justifies |
| `events/` | `src/app/api/webhooks/` | Already exists (Stream, Neynar) |
| `app-ui/` | `@zao/ui` | Just created |

**When to actually split:** When any single API domain has 20+ routes AND needs independent scaling. ZAO OS has ~50 routes total across all domains - not there yet.

## 3. Herocast Keyboard Shortcuts UX

### Their Stack

| Library | Version | Purpose |
|---------|---------|---------|
| `react-hotkeys-hook` | ^5.1.0 | Keyboard shortcut binding |
| `cmdk` | ^1.0.4 | Command palette (Cmd+K) |
| `zustand` | ^4.5.6 | State management |
| `@dnd-kit` | various | Drag and drop |

### cmdk Command Palette

The killer pattern. `cmdk` is a 1KB unstyled command menu component:

```bash
pnpm add cmdk
```

```tsx
import { Command } from 'cmdk';

function CommandPalette() {
  return (
    <Command>
      <Command.Input placeholder="Search..." />
      <Command.List>
        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => router.push('/chat')}>Chat</Command.Item>
          <Command.Item onSelect={() => router.push('/music')}>Music</Command.Item>
          <Command.Item onSelect={() => router.push('/governance')}>Governance</Command.Item>
        </Command.Group>
        <Command.Group heading="Actions">
          <Command.Item>New Post</Command.Item>
          <Command.Item>Search Members</Command.Item>
        </Command.Group>
      </Command.List>
    </Command>
  );
}
```

### ZAO Already Has

File: `src/hooks/useKeyboardShortcuts.ts`

| Shortcut | Action | Status |
|----------|--------|--------|
| `Cmd+K` | Open search | Working |
| `Escape` | Close panels | Working |
| `/` | Focus compose | Working |
| `Cmd+B` | Toggle sidebar | Working |
| `M` | Toggle music | Working |

### Shortcuts to Add

| Shortcut | Action | Source |
|----------|--------|--------|
| `G then H` | Go to Home | Herocast pattern (vim-style) |
| `G then C` | Go to Chat | Herocast |
| `G then M` | Go to Music | Herocast |
| `G then S` | Go to Spaces | Herocast |
| `G then E` | Go to Ecosystem | Herocast |
| `N` | New post/cast | Herocast |
| `J/K` | Navigate up/down in lists | Herocast (vim-style) |
| `?` | Show keyboard shortcuts help | Herocast |

### Implementation Plan

1. Install `cmdk` (1KB, zero deps)
2. Convert existing `SearchDialog` to use cmdk for the command palette
3. Add navigation commands (Go to Chat, Music, etc.)
4. Add action commands (New Post, Search Members)
5. Wire `Cmd+K` to open it (already bound)
6. Add `?` shortcut to show help overlay listing all shortcuts

## 4. Shared UI Package (@zao/ui)

### Current State

Already created at `bettercallzaal/zao-ui` with design tokens + Tailwind presets.

### MakerKit Pattern (Reference)

MakerKit's shared UI uses TurboRepo workspace imports:
```json
{
  "dependencies": {
    "@kit/ui": "workspace:*"
  }
}
```

ZAO uses git submodules instead. To import from `@zao/ui`:

**Option A: npm link (simplest)**
```bash
cd zaoos/
pnpm link ../ui
```

**Option B: Local path in package.json**
```json
{
  "dependencies": {
    "@zao/ui": "file:../ui"
  }
}
```

**Option C: Publish to npm (most robust)**
```bash
cd ui/
npm publish --access restricted
```

### Components to Extract Next

| Component | Current Location | Shared By |
|-----------|-----------------|-----------|
| `PageHeader` | `zaoos/src/components/navigation/PageHeader.tsx` | ZAO OS, FISHBOWLZ |
| Cards (pattern) | Inline Tailwind classes | All apps |
| Button variants | Inline Tailwind classes | All apps |
| Loading skeleton | Inline pattern | All apps |
| Loading spinner | Inline pattern | All apps |
| Tab bar | Various | ZAO OS, FISHBOWLZ |
| Badge/pill | Various | All apps |

### Priority

1. **Tokens** (done) - colors, spacing, radius, tw presets
2. **Components** (next) - PageHeader, Card, Button, Spinner, Skeleton
3. **Hooks** (future) - useAuth pattern, useKeyboardShortcuts

## Comparison: What Each Project Teaches

| Project | Pattern | Effort to Apply | Impact |
|---------|---------|-----------------|--------|
| **Biome migration** | Replace ESLint, keep `next lint` | 30 min per repo | High - faster CI, simpler config |
| **Nook common package** | Enforce `src/lib/` boundaries | Low (documentation) | Medium - cleaner architecture |
| **Herocast cmdk** | Command palette for power users | 2-3 hrs | High - killer UX for keyboard users |
| **Herocast shortcuts** | Vim-style nav (G+H, G+C, J/K) | 1 hr | Medium - power user retention |
| **MakerKit shared UI** | Extract components to @zao/ui | 4-6 hrs | Medium - consistency across apps |
| **Nook multi-schema** | Separate Prisma schemas per domain | High (restructure) | Low (premature for ZAO) |

## Key Numbers

| Metric | Value |
|--------|-------|
| Biome lint speed vs ESLint | 32-68x faster |
| Biome format speed vs Prettier | 22-58x faster |
| Biome total rules (v2.3) | 423 |
| Biome install size | ~10MB vs ~100MB (ESLint + plugins) |
| cmdk package size | ~1KB |
| Herocast keyboard shortcuts | 20+ bindings |
| ZAO OS current shortcuts | 5 bindings |
| Nook microservice count | 15 packages |
| ZAO OS API routes | ~50 total |
| @zao/ui components to extract | 7 priority components |

## Sources

- [Biome Migration Guide 2026](https://dev.to/pockit_tools/biome-the-eslint-and-prettier-killer-complete-migration-guide-for-2026-27m)
- [Biome official migrate docs](https://biomejs.dev/guides/migrate-eslint-prettier/)
- [Next.js + Biome discussion](https://github.com/vercel/next.js/discussions/59347)
- [Herocast GitHub](https://github.com/hero-org/herocast) - react-hotkeys-hook + cmdk
- [cmdk](https://cmdk.paco.me/) - 1KB command menu component
- [Nook client](https://github.com/nook-app/nook-client) - 15 packages, 7 Prisma schemas
- [MakerKit SaaS starter](https://github.com/makerkit/nextjs-saas-starter-kit-lite) - shared UI via workspace
