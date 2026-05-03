# Nexus Rebuild Spec — `src/app/nexus/` in ZAOOS

> **Goal:** Rebuild `nexus.thezao.com` as a maintainable, data-driven, contributor-editable links hub inside ZAOOS. Replace the unmaintained Webflow embed.

**Date:** 2026-05-03
**Owner:** Zaal Panthaki
**Source spec:** ChatGPT conversation "ZAO NEXUS" (2025-03-31, 363 msgs, https://chatgpt.com/c/[id])
**Live (current):** https://nexus.thezao.com (Webflow embed, stale)
**Target route in ZAOOS:** `/nexus` (initially) → spinout to own repo when stable per monorepo-as-lab pattern

---

## Why Rebuild

The Webflow embed worked but failed at scale:
- Manual edits = only Zaal could update
- New ideas (Year of ZABAL series, YapZ episodes, ZAOstock pages) accumulated faster than the embed could capture
- Community members couldn't add or maintain their own sections
- No analytics on which links got clicked
- No deeplinks to Bonfire knowledge graph

Rebuilding inside ZAOOS gets us:
- Supabase-backed link data → community contributors update their own sections
- Auto-pull from community.config.ts where applicable
- Click tracking via existing `src/app/api/activity/`
- Cross-link to Bonfire graph (each link can carry a `bonfire_node_id` attribute)
- Per-person "personal nexus" pages (Zaal's, Cassie's, Steve Peer's)

---

## Original Spec (preserved from ChatGPT conversation)

### Brand colors

```css
:root {
  --bg-color: #141e27;       /* deep navy */
  --text-color: #e0ddaa;     /* soft yellow */
  --accent-bg: #e0ddaa;      /* yellow boxes */
  --accent-text: #141e27;    /* navy text inside yellow boxes */
  --border-color: #141e27;
  --hover-bg: #0f1620;
  --hover-text: #e0ddaa;
}
.dark-mode {
  /* swapped for alternate theme */
  --bg-color: #e0ddaa;
  --text-color: #141e27;
  ...
}
```

### Original data shape (Webflow embed)

```js
window.linksData = [
  {
    mainCategory: "ZAO Onchain",
    subcategories: [
      {
        subTitle: "ZAO Tokens",
        links: [
          {
            title: "Mint ZAO-CHELLA Vibez Track on Zora",
            url: "https://song.thezao.com",
            description: "Own a piece of the ZAO-CHELLA experience by minting the Vibez track."
          },
          {
            title: "Mint Attabotty ZAO-PALOOZA Card",
            url: "https://attabotty.zao.cards",
            description: "Collect the limited-edition card."
          }
        ]
      }
    ]
  },
  // ... ZAO Community Links (Founder/Co-founder/Staff/Member buckets)
];
```

### Original categories (final state)

1. ZAO Onchain → ZAO Tokens (Zora mints, contracts, ZABAL, ZOUNZ)
2. ZAO Community Links
   - ZAO Founder BetterCallZaal Links (Linktree, interviews, YapZ)
   - ZAO Co-Founder CandyToyBox Links
   - ZAO Co-Founder Attabotty Links
   - ZAO Co-Founder HURRIC4N3IKE Links
   - ZAO Staff EZinCrypto Links
   - ZAO Staff Ohnaji B Links
   - ZAO Community Member Jed XO Links
3. ZAO Festivals (PALOOZA, CHELLA, ZAOstock event pages)
4. ZAO Music (DistroKid releases, Cipher when live)
5. ZAO Research (zaoos.com/research, key DEEP docs)

---

## New Spec — what to build

### Tech stack

- **Frontend:** Next.js 16 + React 19 + Tailwind v4 (existing ZAOOS stack)
- **Data:** Supabase table `nexus_links` with RLS
- **Auth:** Reuse existing SIWF + iron-session
- **Theme:** ZAO navy/gold per existing community.config.ts (verify variables match: `#0a1628` ZAOOS navy vs `#141e27` original navy — pick one, document)

### Database schema

```sql
create table nexus_links (
  id uuid primary key default gen_random_uuid(),
  main_category text not null,        -- e.g. "ZAO Onchain"
  subcategory text not null,           -- e.g. "ZAO Tokens"
  title text not null,
  url text not null,
  description text,
  owner_fid bigint references members(fid),  -- null = ZAO-org-owned
  display_order int default 0,
  is_active boolean default true,
  bonfire_node_id text,                -- optional link to ZABAL bonfire entity
  click_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index nexus_links_main_idx on nexus_links(main_category, subcategory, display_order);
create index nexus_links_owner_idx on nexus_links(owner_fid) where owner_fid is not null;
```

RLS:
- Anyone reads `is_active = true`
- Members write only their own `owner_fid` rows (so Cassie can update her links section without admin)
- Admin writes any row

### Routes

- `/nexus` — main public page, all categories
- `/nexus/[main_category]` — filter to one main category (e.g. `/nexus/zao-onchain`)
- `/nexus/u/[fid]` — personal nexus for a specific member (Zaal's, Cassie's, etc.)
- `/api/nexus/links` — GET all active links (cached 60s)
- `/api/nexus/links/click` — POST click tracker
- `/api/nexus/links/[id]` — PUT/DELETE owner-only edit

### Components

- `src/components/nexus/NexusGrid.tsx` — main grid render, mobile-first
- `src/components/nexus/CategorySection.tsx` — collapsible main category
- `src/components/nexus/LinkCard.tsx` — individual link tile (title + description + click handler)
- `src/components/nexus/LinkEditor.tsx` — owner-edit modal (drag-reorder, add, edit, deactivate)

### Migration from Webflow

- One-time SQL script seeds `nexus_links` from the existing Webflow `linksData` array (pull from current nexus.thezao.com source)
- Webflow embed continues to live at nexus.thezao.com initially; new ZAOOS route at `zaoos.com/nexus` runs in parallel
- Once /nexus is verified, change DNS for nexus.thezao.com to point at zaoos.com/nexus

### Bonfire integration

Optional but high-value: each link can carry `bonfire_node_id`. When you query the bonfire `RECALL: who is Cassie?`, the agent surfaces her nexus links automatically. Closes the loop between graph + product.

---

## Open Questions for Zaal Before Build

1. **Scope:** start with /nexus PUBLIC only, or include /nexus/u/[fid] personal pages from day 1?
2. **Brand color:** use `#0a1628` (current ZAOOS navy) or `#141e27` (nexus original navy)? Or different theme entirely so nexus stands out?
3. **Auto-pull:** which sections come from existing data (community.config.ts members, BCZ YapZ episodes from content/transcripts/) vs manually entered?
4. **Permissions:** should ANY ZAO member with FID in allowlist be able to add their own section? Or only co-founders + staff?
5. **Migrate when:** do you want the Webflow embed live during the build (parallel) or just deprecate the moment /nexus ships?
6. **Bonfire integration:** worth doing in v1? Or v2 after the schema settles?

---

## Implementation Steps (suggested for whoever builds this)

1. Create migration: `scripts/2026-05-03-nexus-links-schema.sql` with the table above
2. Build API routes: `src/app/api/nexus/links/` (GET list, POST click, PUT/DELETE per-row)
3. Build components: `src/components/nexus/*.tsx` per the list above
4. Build pages: `src/app/nexus/page.tsx` + `src/app/nexus/[main_category]/page.tsx` + `src/app/nexus/u/[fid]/page.tsx`
5. Seed migration: `scripts/2026-05-03-nexus-links-seed.sql` populated from current webflow JSON
6. Add to nav in `community.config.ts`
7. Test on Vercel preview
8. Ship

Estimate: 1-3 day build for v1 (public-only, no personal pages, no Bonfire integration). Add personal pages + Bonfire as v2.

---

## Bonfire INGEST trigger (paste to bot DM if desired)

```
INGEST FACT:
Subject: Nexus Rebuild Spec
Type: Decision
Date: 2026-05-03
Status: planned
Description: Rebuild nexus.thezao.com as a data-driven, contributor-editable links hub inside ZAOOS at /nexus route. Replace the unmaintained Webflow embed. Spec at docs/specs/2026-05-03-nexus-rebuild-spec.md.
Source: internal://docs/specs/2026-05-03-nexus-rebuild-spec.md
Confidence: 1.0
```
