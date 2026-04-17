# 415 - Composable OS-Style Architecture for ZAO OS

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** Design a modular, OS-like architecture where ZAO OS has swappable shells, pick-and-choose apps, micro-apps, and widgets - like a real operating system for web

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Overall pattern** | USE three-layer architecture: Shell (layout) + Apps (features) + Core (shared services). Shells are swappable, apps are independently loadable, core is always present |
| **App loading** | USE Next.js `dynamic()` + Suspense for lazy loading apps within the monorepo. SKIP Module Federation for now - overkill for single-team monorepo. Upgrade to MF 2.0 later if needed |
| **Shell system** | USE Next.js layout.tsx per shell type. Each shell is a layout that renders app slots differently (phone grid, desktop panels, dashboard sidebar, feed stream) |
| **App registry** | USE JSON manifest pattern (Obsidian-inspired). Each app declares: id, name, icon, route, widget component, micro-app component, permissions, category |
| **Micro-app isolation** | USE React portals + Suspense boundaries for micro-app embedding. SKIP Web Components for now - Shadow DOM adds complexity, React already handles isolation within a single framework |
| **Widget system** | USE small React components with standardized props interface. Each app optionally exports a Widget variant. Grid layout via CSS Grid |
| **User preferences** | USE Supabase table: `user_app_config` with pinned apps, widget layout, startup apps, shell preference |
| **API-first modules** | USE existing `/api/[feature]/` pattern. Each app domain already has API routes. Extract shared types into `packages/` |
| **Multi-zone** | SKIP for V1. Next.js multi-zones require separate deploys per zone. Use route groups instead - same DX, simpler infra |
| **Piral/single-spa** | SKIP. Both add abstraction layers that aren't needed when everything is in one Next.js monorepo. Revisit if ZAO OS ever has third-party plugin developers |
| **Existing portal** | EVOLVE existing `src/lib/portal/destinations.ts` + `PortalHub.tsx` into the app registry. Already has categories, icons, gating, concierge |

---

## Comparison: Micro-Frontend Approaches

| Approach | Bundle Overhead | Next.js Compat | Runtime Composition | Complexity | ZAO Fit |
|----------|----------------|----------------|---------------------|------------|---------|
| **Next.js dynamic() + Suspense** | 0 KB | Native | Yes (lazy load) | LOW | **BEST for V1** |
| **Module Federation 2.0** | ~5 KB runtime | Good (Rspack) | Yes (true runtime) | HIGH | Good for V2 |
| **Piral** | 30-50 KB | Partial | Yes (pilets) | MEDIUM | Overkill |
| **single-spa** | 15 KB | Poor (SPA-first) | Yes | MEDIUM | SKIP (SSR clash) |
| **Web Components (Stencil)** | 12 KB per component | Good (SSR support) | Yes | MEDIUM | Good for cross-framework |
| **Next.js Multi-Zone** | 0 KB | Native | No (deploy-time) | MEDIUM | SKIP for V1 |
| **iframes** | 0 KB | Universal | Yes | LOW | SKIP (UX penalty) |

## Architecture: Three Layers

```
+--------------------------------------------------+
|  SHELL LAYER (swappable)                         |
|  Phone | Desktop | Dashboard | Feed              |
|  Each is a layout.tsx that renders AppSlots       |
+--------------------------------------------------+
|  APP LAYER (pick and choose)                     |
|  Chat | Music | Spaces | Governance | Agents     |
|  XMTP | Radio | Binaural | Library | WaveWarZ    |
|  Each registers via app-manifest.ts              |
+--------------------------------------------------+
|  CORE LAYER (always present)                     |
|  Auth | DB | Config | Farcaster | Rate Limiting  |
|  Shared types, hooks, providers                  |
+--------------------------------------------------+
```

## App Manifest Pattern (Obsidian-Inspired)

```typescript
// src/lib/os/app-manifest.ts

export interface AppManifest {
  id: string;                    // 'chat', 'music', 'xmtp-dms'
  name: string;                  // 'Chat'
  icon: string;                  // emoji or icon component
  category: 'social' | 'music' | 'governance' | 'tools' | 'earn';
  type: 'full-app' | 'micro-app';
  description: string;
  route?: string;                // '/chat' (full apps have routes)
  
  // Dynamic imports - only loaded when user opens the app
  component: () => Promise<{ default: React.ComponentType }>;
  widget?: () => Promise<{ default: React.ComponentType<WidgetProps> }>;
  
  // Permissions & gating
  requiresAuth: boolean;
  requiresGate?: 'allowlist' | 'token' | 'respect';
  minRespect?: number;
  
  // Embedding
  embeddableIn?: string[];       // micro-apps: which full apps can host this
  standalone?: boolean;          // micro-apps: can run alone
  
  // Startup
  defaultStartup?: boolean;      // show on first visit
  defaultWidget?: boolean;       // show widget on first visit
}

export interface WidgetProps {
  size: 'small' | 'medium' | 'large';  // widget slot size
  onExpand: () => void;                  // tap to open full app
}
```

## Shell System

Each shell is a Next.js layout that renders apps differently:

```typescript
// src/app/(os)/phone/layout.tsx    - grid of icons, swipe pages
// src/app/(os)/desktop/layout.tsx  - dock + floating panels
// src/app/(os)/dashboard/layout.tsx - sidebar + main area
// src/app/(os)/feed/layout.tsx     - activity stream + drawer
```

User's shell preference stored in Supabase. Default: phone (mobile-first).

```typescript
// src/lib/os/shells.ts
export const SHELLS = {
  phone: {
    id: 'phone',
    name: 'Phone',
    description: 'App grid with widgets, like a phone home screen',
    layout: () => import('./shells/PhoneShell'),
  },
  desktop: {
    id: 'desktop', 
    name: 'Desktop',
    description: 'Dock and floating windows, like a computer',
    layout: () => import('./shells/DesktopShell'),
  },
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Sidebar navigation with main content area',
    layout: () => import('./shells/DashboardShell'),
  },
  feed: {
    id: 'feed',
    name: 'Feed',
    description: 'Activity stream from all your apps',
    layout: () => import('./shells/FeedShell'),
  },
} as const;
```

## App Categories & Inventory

From current codebase (301 routes, 279 components):

### Full Apps

| App | Current Route | Files | Category | Widget |
|-----|--------------|-------|----------|--------|
| Chat | `/chat` | ~79 files | social | Unread count badge |
| Messages (XMTP) | `/messages` | ~75 files | social | Last DM preview |
| Music Player | `/music` | ~66 files | music | Now playing mini |
| Spaces | `/calls` | ~51 files | social | Active rooms count |
| Governance | `/governance` | ~10 files | governance | Active proposals |
| Directory | `/directory` | ~15 files | social | Member count |
| Respect/Fractals | `/respect`, `/fractals` | ~20 files | governance | Your respect score |
| Library | `/library` | ~10 files | music | Recent tracks |
| WaveWarZ | `/wavewarz` | ~8 files | earn | Active battles |
| Admin | `/admin` | ~25 files | tools | Agent status |
| ZAO Stock | `/stock` | ~15 files | tools | Event countdown |

### Micro-Apps (can be standalone or embedded)

| Micro-App | Embeddable In | Standalone | Widget |
|-----------|--------------|------------|--------|
| Binaural Beats | Music | Yes | Frequency display |
| Radio | Music | Yes | Now playing |
| Queue | Music, Spaces | No | Queue length |
| Song Submit | Music, Chat | No | - |
| Notifications | Any | Yes | Unread count |
| Search | Any | Yes | - |
| Profile Drawer | Any | No | - |
| Leaderboard | Respect, WaveWarZ | Yes | Top 3 members |
| Staking | Earn | Yes | Your stake amount |
| Weekly Poll | Governance | Yes | Current poll |

## User Preferences Schema

```sql
CREATE TABLE user_app_config (
  user_id UUID REFERENCES users(id) PRIMARY KEY,
  shell TEXT DEFAULT 'phone',
  pinned_apps TEXT[] DEFAULT '{"chat","music"}',
  startup_apps TEXT[] DEFAULT '{}',
  widget_layout JSONB DEFAULT '[]',
  -- widget_layout: [{ appId: 'music', size: 'medium', position: { x: 0, y: 0 } }]
  hidden_apps TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration Path from Current Architecture

### Phase 1: App Registry (1-2 hours)

1. Create `src/lib/os/app-manifest.ts` with all apps registered
2. Create `src/lib/os/shells.ts` with shell definitions
3. Create `user_app_config` Supabase table
4. Evolve existing portal `destinations.ts` into the manifest

### Phase 2: Home Screen + App Drawer (3-4 hours)

1. Build phone shell (default): app icon grid + widget area
2. Build app drawer: scrollable list of all available apps, categorized
3. "Add to home" / "Remove" / "Add widget" interactions
4. Store preferences in Supabase

### Phase 3: Dynamic App Loading (2-3 hours)

1. Wrap each app route group in `next/dynamic` with Suspense
2. Only load apps the user has pinned/opened
3. Micro-app embedding system (React portals)
4. Widget rendering with standardized WidgetProps

### Phase 4: Additional Shells (2 hours each)

1. Desktop shell (dock + floating panels)
2. Dashboard shell (sidebar + main)
3. Feed shell (activity stream)
4. Shell switcher in settings

### Phase 5: Agent Integration (2 hours)

1. Agents can suggest apps to users
2. Agents can read user's app config
3. ZOE can compose app recommendations based on user activity
4. App usage analytics for agent training

## Why This Works for ZAO OS Specifically

1. **Already modular** - 54 API domains already isolated. Components organized by feature. This is renaming + wrapping, not rewriting.
2. **Portal exists** - `src/lib/portal/destinations.ts` already categorizes apps with icons, descriptions, and gating. Evolve it.
3. **community.config.ts** - Already the single config point. Add `defaultApps` and `availableShells` to it.
4. **Supabase** - Already the data layer. One new table for preferences.
5. **next/dynamic** - Already used for code splitting. Extend the pattern to full apps.
6. **Mobile-first** - Phone shell is the default, matches existing design philosophy.

## What We're NOT Building

- **Not a browser-in-browser** - apps share the same Next.js runtime, not iframed
- **Not a plugin marketplace** - all apps are first-party, in the monorepo
- **Not Module Federation** - overkill for single-team. Dynamic imports suffice
- **Not a metaverse** - no 3D, no avatars. OS metaphor = home screen + apps
- **Not multi-tenant** - one ZAO OS instance, one community. Forkable via community.config.ts

---

## ZAO Ecosystem Integration

### Codebase Files Affected

| Current | New/Changed | Purpose |
|---------|-------------|---------|
| `src/lib/portal/destinations.ts` | Evolve into `src/lib/os/app-manifest.ts` | App registry |
| `src/components/portal/PortalHub.tsx` | Evolve into shell system | Home screen |
| `src/app/(auth)/layout.tsx` | Split into shell-specific layouts | Swappable shells |
| `community.config.ts` | Add `defaultApps`, `availableShells` | Fork config |
| New | `src/lib/os/shells.ts` | Shell definitions |
| New | `src/lib/os/use-app-config.ts` | User preferences hook |
| New | `src/components/os/AppDrawer.tsx` | App store / drawer |
| New | `src/components/os/WidgetGrid.tsx` | Widget layout renderer |
| New | `scripts/create-user-app-config.sql` | Preferences table |

### Key Principle: Wrap, Don't Rewrite

Every current feature ALREADY works. The OS layer is a new shell around existing routes:

```
Before: /chat → renders ChatPage directly
After:  /chat → OS shell renders ChatPage in an app slot
```

No components need rewriting. The OS layer is additive.

---

## Comparison: Portal Architectures

| Pattern | Examples | ZAO Fit | Why |
|---------|----------|---------|-----|
| **App manifest + dynamic import** | Obsidian, VS Code | **BEST** | Simple, Next.js native, no runtime overhead |
| **Micro-frontend orchestration** | Piral, single-spa | Overkill | Multi-team complexity we don't need |
| **Module Federation** | Webpack 5, Rspack | Future V2 | Good when apps deploy independently |
| **iframes + postMessage** | Shopify Admin, Figma plugins | SKIP | UX and performance penalty |
| **Web Components** | Salesforce Lightning, Ionic | Partial | Good for cross-framework, we're React-only |
| **Multi-zone** | Vercel docs, large platforms | SKIP V1 | Deploy-time composition, not user-selectable |

---

## Sources

- [Piral Framework](https://www.piral.io/) - micro-frontend portal framework, pilet architecture
- [Module Federation 2.0 (InfoQ)](https://www.infoq.com/news/2026/04/module-federation-2-stable/) - runtime code sharing, stable April 2026
- [Next.js Multi-Zone Guide](https://nextjs.org/docs/pages/guides/multi-zones) - composing Next.js apps under one domain
- [Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading) - dynamic() + Suspense for code splitting
- [Obsidian Plugin Architecture](https://docs.obsidian.md/) - registration, lifecycle, auto-cleanup pattern
- [Stencil Web Components](https://stenciljs.com/) - web components with Next.js SSR support
- [Doc 319: Lightweight 3D Portal Hub](../319-lightweight-3d-portal-hub/) - existing portal design, CSS 3D, concierge
- [Doc 225: Fork-Friendly Patterns](../../dev-workflows/225-fork-friendly-open-source-patterns/) - community.config.ts, single config file pattern
- [Doc 405: Monorepo Migration](../../dev-workflows/405-monorepo-migration/) - Turborepo + pnpm workspace structure
