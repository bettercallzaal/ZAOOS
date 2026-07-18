---
topic: infrastructure, technology, community
type: implementation-brief
status: SPEC READY — backend 90% complete; frontend is 1 PR away. Hurricane handoff doc. Board task #14 (alongside ZabalSocials #16, Whitepaper #15).
last-validated: 2026-07-18
related-docs: 624-nexus-portal-canon-may7, 1621-zabalsocials-rebuild-spec, 1542-zao-geo-entity-brief
board-tasks: "Nexus rebuild (#14 in agentic coordination plan)"
action-owner: Hurricane (frontend build); Zaal (content audit + missing link additions)
---

# 1629 — ZAO Nexus Rebuild: July 2026 Status Audit + Implementation Brief

> **What this is:** The ZAOOS `/nexus` rebuild (board task #14) is nearly done on the backend — database, API, admin tools all exist. What's missing is a single frontend PR to wire the `/nexus` page to the live `nexus_links` table. This doc is the current-state audit + Hurricane handoff for that remaining step.
>
> **Companion:** Doc 1621 (ZabalSocials rebuild spec) — `/links` for the external-facing social links directory. `/nexus` is the internal member resource hub. Different audiences, different data.

---

## Where Things Stand (July 2026)

The original rebuild spec (`docs/specs/2026-05-03-nexus-rebuild-spec.md`) asked for a Supabase-backed, contributor-editable links hub at `/nexus`. Most of that is already built.

### What Exists

| Component | Status | Location |
|-----------|--------|----------|
| `nexus_links` Supabase table | **LIVE** | Supabase dashboard → nexus_links |
| Public read API | **LIVE** | `GET /api/nexus/links` (with portal_group / category / tag / featured filters) |
| Admin CRUD API | **LIVE** | `GET/POST/PATCH/DELETE /api/admin/nexus` (admin-only, audit-logged) |
| Link reorder endpoint | **LIVE** | `PATCH /api/admin/nexus?action=reorder` |
| Seed data | **SEEDED** | `scripts/archive/2026-04-25-cleanup/seed-nexus-links.sql` (NexusV2 migration) |
| `/nexus` page | **PARTIAL** | `src/app/(auth)/nexus/page.tsx` — hardcoded nav hub (does NOT read DB) |
| Admin panel integration | **PARTIAL** | AdminPanel.tsx has nexus section but not exposed to non-admin contributors |

### What's Missing

1. **Frontend wiring:** `/nexus/page.tsx` shows 4 hardcoded nav links to `/community`, `/calendar`, `/zao-leaderboard`, `/assistant`. It does not read from `nexus_links`.
2. **Search + filter UI:** No search box or portal_group filter tabs on the page.
3. **Contributor editing:** No UI for non-admin members to add/edit their own links.
4. **Data freshness:** Seed script is from April 2026. Missing July 2026 links: ZABAL contract, ZAOstock Eventbrite, ZOL Farcaster, WaveWarZ API docs, ZAO Music, COC Concertz YouTube.
5. **GEO integration:** `/nexus` is not listed in `llms.txt` or `community.config.ts` nav.

### What Does NOT Need to Be Built

- The database: exists.
- The API: exists. `GET /api/nexus/links?portal_group=MUSIC` works today.
- The admin tools: exist. Zaal can add/edit/deactivate links via AdminPanel.
- Auth: `/nexus` is already inside `(auth)/` — SIWF gate is inherited.

---

## Current `nexus_links` Table Schema

From the admin API source (`src/app/api/admin/nexus/route.ts`):

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `title` | text (max 200) | Display text |
| `url` | text | Destination URL |
| `description` | text (max 500) | One-sentence description |
| `icon` | text (max 50) | Optional icon name |
| `category` | text (max 100) | e.g. "ZAO Onchain", "ZAO Links" |
| `subcategory` | text (max 100) | e.g. "ZAO Tokens", "ZAO Platforms" |
| `portal_group` | enum | MUSIC / SOCIAL / BUILD / EARN / GOVERN / VIP |
| `sort_order` | int | Display order within subcategory |
| `is_featured` | bool | Show in featured grid |
| `is_active` | bool | False = hidden |
| `is_gated` | bool | VIP-only visibility |
| `tags` | text[] | e.g. ['mint', 'nft', 'governance'] |

---

## Frontend PR Spec (Hurricane Handoff)

**1 PR: `feat/nexus-database-frontend` (3-4h)**

**File to change:** `src/app/(auth)/nexus/page.tsx` (currently 114 lines, hardcoded)

**New behavior:**

```typescript
// src/app/(auth)/nexus/page.tsx — server component
import { NexusGrid } from '@/components/nexus/NexusGrid';

export default async function NexusPage() {
  // Fetch all active links from the public API
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/nexus/links`, {
    next: { revalidate: 60 }  // ISR: revalidate every 60s
  });
  const { links } = await res.json();

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Nexus" subtitle="ZAO community resources" />
      <NexusGrid links={links} />
    </div>
  );
}
```

**New components needed:**

```typescript
// src/components/nexus/NexusGrid.tsx
// Groups links by portal_group → renders one NexusSection per group
// Props: { links: NexusLink[] }

// src/components/nexus/NexusSection.tsx  
// Renders one portal_group as a collapsible section with subcategory grouping
// Props: { portalGroup: string; links: NexusLink[] }

// src/components/nexus/NexusLinkCard.tsx
// One link tile: title + description + click handler (POST /api/nexus/links/click)
// Props: { link: NexusLink }
```

**Minimal TypeScript type:**

```typescript
interface NexusLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  subcategory: string;
  portal_group?: 'MUSIC' | 'SOCIAL' | 'BUILD' | 'EARN' | 'GOVERN' | 'VIP';
  is_featured: boolean;
  tags: string[];
}
```

**Click tracking (add to existing API):**

```typescript
// POST /api/nexus/links/click — log click event without auth
// Body: { link_id: string }
// Handler: INSERT into activity table OR increment nexus_links.click_count
```

**Test checklist:**
1. Visit `/nexus` → all active links from DB appear (not hardcoded nav)
2. Links grouped by portal_group → subcategory
3. Featured links (`is_featured=true`) appear in a highlighted section at top
4. Click any link → activity event logged
5. Admin panel `/admin` → nexus links section → add a new link → appears in `/nexus` within 60s (ISR)

---

## Missing July 2026 Links (Add to DB via AdminPanel)

These are not in the April 2026 seed. Zaal adds via AdminPanel after the frontend PR ships.

| Title | URL | Portal Group | Category | Subcategory |
|-------|-----|-------------|----------|-------------|
| ZABAL Token (Base) | `https://basescan.org/token/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` | EARN | ZAO Onchain | ZAO Tokens |
| Swap to ZABAL (Uniswap) | ETH→SANG→ZABAL route on Uniswap | EARN | ZAO Onchain | ZAO Tokens |
| ZAOstock 2026 Tickets | Eventbrite URL | SOCIAL | ZAO Links | ZAO Events |
| ZOL on Farcaster | `https://warpcast.com/zolbot` | SOCIAL | ZAO Community | ZAO Agents |
| WaveWarZ API Docs | `https://wavewarz.info/api/public/stats` | BUILD | ZAO Links | Developer Tools |
| ZAO Music (DistroKid) | DistroKid URL when available | MUSIC | ZAO Music | Distribution |
| COC Concertz YouTube | `https://youtube.com/@BetterCallZaal` (COC playlist) | MUSIC | ZAO Music | Shows |
| ZABAL Bonfire (knowledge graph) | `https://zabal.bonfires.ai` | BUILD | ZAO Links | Developer Tools |
| ZAO Protocol Whitepaper | Link to doc 1613/1616 when published | GOVERN | ZAO Links | Documentation |
| ZOR Token (Optimism) | `https://optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | GOVERN | ZAO Onchain | ZAO Tokens |

---

## Decisions Resolved (vs. May 2026 Spec Open Questions)

The spec at `docs/specs/2026-05-03-nexus-rebuild-spec.md` had 6 open questions. July 2026 answers:

| Question | May 2026 | July 2026 Answer |
|----------|----------|-----------------|
| Start public-only or include /nexus/u/[fid] personal pages? | Open | **Public-only first.** Personal pages are v2 after ship. |
| Brand color: `#0a1628` (ZAOOS) or `#141e27` (original nexus)? | Open | **Use `#0a1628`** — ZAOOS navy is canonical, avoid divergence. |
| Which sections from `community.config.ts` vs manual entry? | Open | **Manual via AdminPanel for now.** Auto-pull from `community.config.ts` is v2 after content settles. |
| Should any ZAO member be able to add their own section? | Open | **Admin-only for now.** Open contributor editing deferred to v2. |
| Keep Webflow embed live during build? | Open | **Keep live.** The Webflow embed at `nexus.thezao.com` stays until the ZAOOS `/nexus` page is verified. |
| Bonfire integration in v1? | Open | **Skip v1.** `bonfire_node_id` column already exists in schema — populate when ZABAL Bonfire read-path opens. |

---

## GEO Integration (Do After PR Ships)

1. Add to `llms.txt`: `https://zaoos.com/nexus — ZAO member resource hub (links, tools, community sections)`
2. Update `community.config.ts` navigation: add `{ label: 'Nexus', href: '/nexus' }` to main nav
3. Add one line to `research/identity/1542-zao-geo-entity-brief/`: "Member resource hub: zaoos.com/nexus"

---

## Sources

- `src/app/(auth)/nexus/page.tsx` — current hardcoded page (114 lines)
- `src/app/api/nexus/links/route.ts` — public GET API (already live)
- `src/app/api/admin/nexus/route.ts` — admin CRUD (already live)
- `scripts/archive/2026-04-25-cleanup/seed-nexus-links.sql` — original data migration
- `docs/specs/2026-05-03-nexus-rebuild-spec.md` — original rebuild spec (May 3, 2026)
- `research/community/624-nexus-portal-canon-may7/README.md` — ZAONEXUS + nexus.html canon (May 7, 2026)
- `research/community/1621-zabalsocials-rebuild-spec/README.md` — companion rebuild (/links external-facing)
- Board task: Nexus rebuild (#14 in agentic coordination plan)
