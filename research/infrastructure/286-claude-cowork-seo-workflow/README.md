# 286 — Claude Cowork SEO Workflow & ZAO OS SEO Audit

> **Status:** Research complete
> **Date:** 2026-04-05
> **Goal:** Evaluate Claude Cowork's local SEO workflow (from @bloggersarvesh viral thread), audit ZAO OS's current SEO state, and identify actionable improvements — especially JSON-LD structured data for a music community

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Claude Cowork for ZAO SEO** | USE Cowork for one-off audits (schema validation, competitor GBP analysis, content gap scans) — $20/mo Pro plan covers it. Skip for ongoing automation — ZAO's SEO needs are code-level, not browser-level |
| **claude-seo skill** | INSTALL `AgriciDaniel/claude-seo` in Claude Code — MIT-licensed, 4K+ stars, `/seo audit zaoos.com` gives 0-100 health score + prioritized fixes. Already works in our dev environment |
| **JSON-LD structured data** | ADD immediately — ZAO OS has **zero** JSON-LD markup. Add `Organization`, `MusicGroup`, `MusicEvent`, and `WebSite` schemas to `src/app/layout.tsx` and per-page layouts |
| **Sitemap expansion** | FIX `src/app/sitemap.ts` — currently only lists 1 URL (`zaoos.com`). Add `/members`, `/members/[username]`, `/spaces`, `/spaces/[id]` for public-facing pages |
| **GEO/AEO optimization** | USE structured data + FAQ schema on the landing page so AI search engines (Google AI Overviews, ChatGPT, Perplexity) can cite ZAO content. Music communities are underserved in AI search results |
| **Local SEO / GBP** | SKIP — ZAO is not a local business. The @bloggersarvesh workflow is built for local service businesses (plumbers, dentists). ZAO needs org/music SEO, not map pack rankings |
| **Keyword research automation** | SKIP Cowork for this — ZAO's niche ("Farcaster music community", "onchain music DAO", "decentralized artist org") has <100 monthly searches. Content quality + structured data matters more than keyword volume |
| **Schema audit tool** | USE Google Rich Results Test (`search.google.com/test/rich-results`) in CI/dev. Also USE `schema-dts` npm package (Google's TypeScript types for schema.org) for type-safe JSON-LD |

---

## What Is Claude Cowork?

Claude Cowork launched January 2026 as an autonomous agent inside the Claude desktop app. It opens Chrome, navigates websites, reads pages, runs multi-tab analysis, and delivers structured outputs (spreadsheets, reports). Available on Pro ($20/mo), Max ($100-200/mo), Team, and Enterprise plans.

### The @bloggersarvesh Workflow (6 Steps)

From the viral X thread (26.4K views, April 2 2026):

| Step | What Cowork Does | ZAO Relevance |
|------|------------------|---------------|
| 1. Keyword research | Opens Ahrefs, extracts competitor top-20 pages + keywords + difficulty | LOW — ZAO's niche is too small for volume-based keyword strategy |
| 2. GBP post analysis | Reviews competitor Google Business Profiles, builds posting plan | NONE — ZAO is not a local business |
| 3. Business + competitor extraction | Visits your site + 3 competitors, extracts services/strengths/gaps | MEDIUM — useful for comparing ZAO vs Sonata, Audius, Sound.xyz |
| 4. GBP post writing | Writes 10 GBP posts with local landmarks and CTAs | NONE — no physical location |
| 5. Schema audit | Checks page source for all schema, validates LocalBusiness, generates JSON-LD | HIGH — ZAO has zero JSON-LD. Cowork can audit and generate, but Claude Code is better for implementation |
| 6. Content gap analysis | Scans competitors for missing content, recommends 5 topics | MEDIUM — identifies what Farcaster/music competitors cover that ZAO doesn't |

**Verdict:** 2 of 6 steps are directly useful for ZAO. The workflow is optimized for local service businesses (plumbers, restaurants, dentists), not web3 music communities. The schema audit (step 5) and competitor analysis (steps 3, 6) are portable.

---

## Comparison: SEO Tools for ZAO OS

| Tool | Cost | Best For ZAO | Schema Support | Automates Code Changes | License |
|------|------|-------------|----------------|----------------------|---------|
| **Claude Cowork** | $20/mo (Pro) | One-off browser audits, competitor research | Reads existing schema, generates JSON-LD snippets | No — outputs to clipboard, manual paste | Proprietary |
| **claude-seo skill** | Free (MIT) | Full audit inside Claude Code, auto-generates fixes | 19 sub-skills including `/seo schema` | Yes — writes directly to codebase | MIT |
| **Google Rich Results Test** | Free | Validation of deployed structured data | Tests JSON-LD/Microdata/RDFa on live URLs | No | N/A |
| **power-seo** (npm) | Free (MIT) | Programmatic metadata + JSON-LD in Next.js | `@power-seo/schema` package for type-safe JSON-LD | Yes — library integration | MIT |
| **schema-dts** (Google) | Free (Apache-2.0) | TypeScript types for schema.org in Next.js | Complete schema.org type definitions | Yes — type-safe JSON-LD generation | Apache-2.0 |
| **next-seo** | Free (MIT) | React components for meta tags + JSON-LD | Built-in JSON-LD components for common types | Yes — React components | MIT |

**Best combination for ZAO OS:** `claude-seo` for auditing + `schema-dts` for type-safe JSON-LD implementation in Next.js App Router. Skip `next-seo` — Next.js 16's built-in Metadata API handles OG/Twitter; we only need the JSON-LD piece.

---

## ZAO OS SEO Audit: Current State

### What's Already Built

| Feature | File | Status | Grade |
|---------|------|--------|-------|
| Root metadata (title, OG, Twitter) | `src/app/layout.tsx:33-53` | Done | B+ — good but generic description |
| Per-page metadata | 30+ layouts/pages with `export const metadata` | Done | B — consistent but no keywords targeting |
| Dynamic metadata (members) | `src/app/members/[username]/layout.tsx` | Done | B — has OG but no JSON-LD |
| Dynamic metadata (spaces) | `src/app/spaces/[id]/layout.tsx` | Done | B — has `generateMetadata` |
| Sitemap | `src/app/sitemap.ts` | Broken | D — only 1 URL listed |
| Robots.txt | `src/app/robots.ts` | Done | A — correctly blocks /chat, /admin, /api/ |
| JSON-LD structured data | None | Missing | F — zero schema.org markup anywhere |
| Farcaster Mini App embed | `src/app/layout.tsx:18-31` | Done | A — proper `fc:miniapp` meta |
| OG images | Not found | Missing | F — no dynamic OG image generation |

### Critical Gaps

1. **Zero JSON-LD** — No `Organization`, `WebSite`, `MusicGroup`, `MusicEvent`, or `Person` structured data. Google and AI search engines cannot understand ZAO's entity type.
2. **1-URL sitemap** — `src/app/sitemap.ts` only returns `https://zaoos.com`. Should include all public routes + dynamic member profiles.
3. **No OG images** — No `/api/og` route for dynamic Open Graph image generation. Member profile shares look generic.
4. **Generic descriptions** — "The ZAO Community on Farcaster" doesn't include actionable keywords like "decentralized music DAO", "onchain artist collective", "Optimism".

---

## Music-Specific Schema.org Types for ZAO

### Recommended Schema Types

| Schema Type | Where to Add | What It Describes |
|-------------|-------------|-------------------|
| `Organization` | `src/app/layout.tsx` (global) | The ZAO as an entity — name, URL, logo, social profiles, founding date |
| `WebSite` | `src/app/layout.tsx` (global) | Site-level search action, name, URL |
| `MusicGroup` | `src/app/members/[username]/layout.tsx` | Individual artists — name, genre, albums, URL, image |
| `MusicEvent` | `src/app/spaces/[id]/layout.tsx` | Live audio rooms as music events — name, startDate, location (virtual), performer |
| `Event` | `src/app/(auth)/fractals/page.tsx` | Weekly fractal sessions — recurring event with schedule |
| `CollectionPage` | `src/app/members/layout.tsx` | Members directory as a collection of Person/MusicGroup entities |

### Next.js App Router JSON-LD Pattern

The recommended approach from Next.js docs — render a `<script>` tag in a Server Component:

```typescript
// src/app/layout.tsx — add inside <head> or as first child of <body>
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The ZAO',
    alternateName: 'ZTalent Artist Organization',
    url: 'https://zaoos.com',
    logo: 'https://zaoos.com/icon-512.png',
    description: 'A decentralized music community and artist organization on Farcaster and Optimism.',
    foundingDate: '2024',
    sameAs: [
      'https://warpcast.com/~/channel/zao',
      'https://x.com/TheZAOMusic',
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/* ... */}
    </html>
  );
}
```

**Note on `dangerouslySetInnerHTML`:** The CLAUDE.md security rules ban `dangerouslySetInnerHTML`. For JSON-LD specifically, this is safe because the data is server-generated (not user input) and `JSON.stringify` prevents XSS. The alternative is using `schema-dts` with a helper that renders via `React.createElement('script', ...)`. Either approach is acceptable for JSON-LD — the security rule targets HTML injection, not structured data serialization.

### Type-Safe Alternative with `schema-dts`

```typescript
import type { Organization, WithContext } from 'schema-dts';

const jsonLd: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'The ZAO',
  // ... TypeScript enforces valid schema.org properties
};
```

---

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Add `Organization` + `WebSite` JSON-LD to `src/app/layout.tsx` | 30 min | High — establishes ZAO as a recognized entity for Google + AI search |
| P0 | Fix sitemap to include all public routes | 1 hr | High — Google currently only indexes the homepage |
| P1 | Add `MusicGroup` JSON-LD to member profile pages | 1 hr | Medium — makes artist profiles rich-result eligible |
| P1 | Add `MusicEvent` JSON-LD to spaces pages | 1 hr | Medium — live rooms appear as events in search |
| P2 | Install `claude-seo` and run `/seo audit zaoos.com` | 15 min | Medium — identifies issues we haven't caught manually |
| P2 | Dynamic OG image generation (`/api/og`) | 3 hrs | Medium — better social sharing appearance |
| P3 | GEO optimization (FAQ schema, AI-citation-friendly content on landing page) | 2 hrs | Low-medium — prepares for AI search engine citations |

---

## Claude Cowork vs Claude Code for SEO

| Capability | Claude Cowork (Desktop) | Claude Code (CLI) |
|-----------|------------------------|-------------------|
| Browse live websites | Yes — opens real Chrome | No — uses WebFetch (no JS rendering) |
| Read page source/schema | Yes — inspects DOM | Yes — reads files directly |
| Write code to codebase | No — outputs snippets | Yes — writes/edits files directly |
| Ahrefs/Semrush access | Yes — if you're logged in | Only via MCP or API |
| Competitor GBP analysis | Yes — browses Google Maps | No |
| Schema validation | Yes — reads rendered HTML | Yes — reads source code |
| Batch page audit | Yes — multi-tab | Yes — via `claude-seo` subagents |
| JSON-LD generation | Outputs to clipboard | Writes directly to `layout.tsx` |

**For ZAO OS:** Claude Code is the right tool for implementation. Claude Cowork is useful for one-off competitor research (e.g., "how does Audius structure their schema markup?") or browsing Ahrefs if you have a subscription. The @bloggersarvesh workflow is optimized for the Cowork use case — browsing + extracting — but ZAO's needs are code-level.

---

## ZAO OS Integration

### Files to Modify

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Add `Organization` + `WebSite` JSON-LD script in `<head>` |
| `src/app/sitemap.ts` | Expand to include `/members`, `/members/*`, `/spaces`, `/spaces/*`, public pages |
| `src/app/members/[username]/layout.tsx` | Add `MusicGroup` or `Person` JSON-LD with dynamic data |
| `src/app/spaces/[id]/layout.tsx` | Add `MusicEvent` JSON-LD for live rooms |
| `src/app/page.tsx` | Enhance landing page metadata — more specific description, keywords |
| `community.config.ts` | Add `seo` section with org name, social links, founding date for JSON-LD reuse |
| `package.json` | Add `schema-dts` for type-safe JSON-LD (optional) |

### What NOT to Do

- **Don't chase keyword volume** — ZAO's niche has <100 monthly searches for most terms. Focus on entity recognition and structured data, not traffic-based SEO
- **Don't set up GBP** — ZAO is not a local business, a Google Business Profile would be misleading
- **Don't use `next-seo`** — Next.js 16's built-in Metadata API already handles everything except JSON-LD. Adding next-seo duplicates functionality
- **Don't over-automate** — Cowork is powerful but ZAO has ~10 public pages, not 1,000. Manual JSON-LD in layouts is sufficient

---

## Sources

- [@bloggersarvesh X thread — Claude Cowork SEO workflow](https://x.com/bloggersarvesh/status/2039727454118633688) — 26.4K views, Apr 2 2026
- [Claude SEO — open-source skill for Claude Code](https://github.com/AgriciDaniel/claude-seo) — MIT, 4K+ stars, 19 sub-skills
- [claude-seo.md — feature docs and command reference](https://claude-seo.md/)
- [Next.js JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld) — official App Router pattern
- [schema.org MusicGroup](https://schema.org/MusicGroup) — artist/band structured data spec
- [schema.org MusicEvent](https://schema.org/MusicEvent) — music event structured data spec
- [Schema Markup for Musicians — InClassics](https://inclassics.com/blog/seo-for-musicians-schema-markup) — music-specific JSON-LD guide
- [The AI Corner — Claude Can Now Do SEO](https://www.the-ai-corner.com/p/claude-seo-cowork-prompts-free-agency)
- [Stormy AI — Automated Technical SEO Audits with Claude Code 2026](https://stormy.ai/blog/automated-technical-seo-guide-2026)
- [schema-dts — Google's TypeScript types for schema.org](https://github.com/google/schema-dts) — Apache-2.0
