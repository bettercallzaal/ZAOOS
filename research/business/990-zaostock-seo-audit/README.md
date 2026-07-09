---
topic: business
type: audit
status: research-complete
last-validated: 2026-07-07
superseded-by:
related-docs: "960, 967, 868"
original-query: "zaostock all over the internet in terms of SEO audit"
tier: STANDARD
---

# 990 — ZAOstock SEO Audit

> **Goal:** Audit zaostock.com's technical SEO setup and its external web presence/discoverability, and identify concrete fixes.

## Key Decisions

| Recommendation | Why |
|---|---|
| Register zaostock.com in Google Search Console and submit `/sitemap.xml` this week | WebSearch (Google/Bing-backed) returns **zero results** for `site:zaostock.com` and for the bare string `zaostock.com` - the domain shows no sign of being indexed at all |
| Fix `sitemap.ts` to include `/festivals`, `/musicians/rider`, `/team/onepager` | These are live, real pages with their own metadata that are simply missing from the sitemap array - free indexing left on the table |
| Remove `/team/m/` from `robots.ts` disallow list | `robots.ts` blocks crawling of public member profile pages that the README explicitly describes as public and shareable - the disallow directly contradicts the page's own purpose |
| Add `MusicEvent` JSON-LD structured data to the homepage | Zero `schema.org` markup exists anywhere in `src/`. A one-day dated event with a fixed venue is exactly the case Google's Event rich-result feature is built for, and it is currently not eligible for it |
| Always pair "ZAOstock" with "Maine" or "2026" in external copy (social captions, press outreach, sponsor decks) | An unrelated, long-running charity event in Valparaiso, Indiana is *also* called "ZAOSTOCK" (see Findings) - the bare brand term is contested and any generic search for "zaostock" currently surfaces the Indiana event, not the Maine festival |
| Add a real, crawlable `<a href="https://zaostock.com">` link from thezao.com and zaofestivals.com | The only inbound link found (ZAO NEXUS on thezao.com/nexus) is rendered inside a client-side JS app (`zaonexus.vercel.app`), not a static link on the thezao.com domain itself - it very likely passes little to no SEO link equity |

## Findings

### 1. zaostock.com shows no sign of search-engine indexing

Both the exact query `site:zaostock.com` and the bare query `zaostock.com` via WebSearch returned zero matches for the actual site - only unrelated domains (`zastocks.com`, `zoostock.com`, `zaistock.com`). Exa's semantic index *does* have the page (title "ZAOstock | Community Music Festival", confirmed via direct WebFetch), so the site is live and crawlable in principle, but there's no evidence it is in Google's index yet. This is the single highest-leverage fix: verify the domain in Google Search Console and submit the sitemap. [FULL - fetched directly]

### 2. On-page technical SEO is mostly solid

Checked every `page.tsx` under `src/app/` (17 static routes): each one exports its own `Metadata` with a unique `title` and `description` (e.g. `musicians/page.tsx`: `"For Musicians · ZAOstock"`, `sponsor/page.tsx`: `"Sponsor ZAOstock | Community Music Festival"`). `layout.tsx` sets `metadataBase`, Open Graph, and Twitter card defaults. `robots.ts` and `sitemap.ts` both exist and resolve. `next.config.ts` sets HSTS, `X-Frame-Options`, `X-Content-Type-Options`, and a `Referrer-Policy` header on every route. This is above-average hygiene for a pre-launch site - the gaps below are specific, not systemic.

### 3. `sitemap.ts` is missing 3 live routes

`sitemap.ts` lists 17 paths. Cross-checked against actual `page.tsx` files in `src/app/`: `/festivals` (has its own metadata: `"ZAO Festivals"`), `/musicians/rider`, and `/team/onepager` all exist and render but are absent from the sitemap array. Dynamic routes `artist/[slug]/page.tsx` and `onepagers/[slug]/page.tsx` also have no sitemap entries and no `generateSitemaps()` - fine for now while those slugs are Supabase-driven and low-volume, but worth a follow-up once artist profiles are public. [FULL - read from repo]

### 4. `robots.ts` blocks the one page type built to be shared

```
disallow: ['/api/', '/test', '/team/help', '/team/m/']
```

`/team/m/<slug>` is documented in the project README as "public member profile" - a page meant to be linked and shared externally. Blocking it from crawlers means every team member's public profile is invisible to search, which cuts against the page's own purpose. `/test` and `/team/help` are reasonably excluded (internal docs / non-canonical); `/team/m/` should not be. [FULL - read from repo]

### 5. No structured data (schema.org) anywhere in the codebase

`grep -rl "application/ld+json\|schema.org"` across `src/` returns nothing. For a dated, single-venue event, `MusicEvent` (or `Event`) JSON-LD is what makes a page eligible for Google's event rich results / the "Events" panel in search - a meaningful visibility gain for a festival site specifically, and currently unused. [FULL - read from repo]

### 6. Direct brand-name collision: an existing "ZAOSTOCK" already owns the bare search term

WebFetch of the top organic result for a bare "zaostock" search confirms it directly: the **"Livin' It Up Music Festival" at Zao Island, Valparaiso, Indiana - "also known as ZAOSTOCK"** - a 10th-annual (as of the cached listing), $5-ticket charity music festival benefiting Porter County Special Olympics, with its own local press coverage (`globe-star.org`, `valpo.life`, `panoramanow.com`) and a Facebook presence. Because this event has used the exact string "ZAOSTOCK" for a decade with real local media backlinks, any bare-brand search (no "Maine," no "2026," no "Ellsworth") is currently won by Indiana, not by The ZAO. This isn't fixable by better on-page SEO alone - it's a brand-disambiguation problem. Every piece of external copy (social captions, press pitches, sponsor decks) should include a qualifier ("ZAOstock 2026," "ZAOstock Maine") rather than the bare word. [FULL - fetched directly]

### 7. The one inbound link found doesn't pass real link equity

Exa search surfaced exactly one third-party page linking to zaostock.com: **ZAO NEXUS** at `thezao.com/nexus`. Direct WebFetch of that page shows it has **no static HTML link to zaostock.com** - the page is a loading shell for a client-side app hosted at `zaonexus.vercel.app`, and the only static outbound links on `thezao.com/nexus` itself are Instagram (`instagram.com/zaofestivals`) and X (`twitter.com/thezaodao`). A JS-rendered link on a third-party Vercel subdomain is a weak-to-nonexistent SEO signal compared to a real anchor tag on `thezao.com`. [FULL - fetched directly]

### 8. Brand presence is fragmented across three domains and handles

- Primary site: `zaostock.com`
- Sister/parent brand site: `zaofestivals.com` (referenced from bettercallzaal.com as the umbrella for ZAO-Palooza + ZAO-Chella, with ZAOstock as flagship)
- Official social accounts run as **@zaofestivals** on both X and Instagram - not a zaostock-specific handle
- `bettercallzaal.com`'s own project card for ZAOstock still reads "Telegram-first ops; public site coming. **Pre-public**" - stale copy that undersells a site that's already live with a working sitemap, robots.txt, and 17+ pages

None of this is wrong on its own, but it means the domain that most needs search authority (`zaostock.com`) isn't the one accumulating the social/backlink signal - that's landing on `zaofestivals.com` and the `@zaofestivals` handles instead. [PARTIAL - bettercallzaal.com content read via exa search snippet, not full WebFetch; directionally clear but worth a fresh look before acting]

## Also See

- [Doc 960 - What regional Maine press outlets can pitch ZAOstock](../960-seo-web-presence-what-regional-maine-press/) - press/outreach angle on visibility; this doc covers the technical + domain-authority angle instead
- [Doc 967 - Should ZAO consolidate nexus.thezao.com, zao-101.vercel.app, zaoos.com](../967-repo-web-improvement-should-zao-consolidate-nexus/) - directly relevant to Finding 7/8 (link-equity fragmentation across ZAO domains)
- [Doc 868 - Brand Weakness Audit](../868-brand-weakness-audit-zoe-agent-status/) - broader brand-clarity findings this doc's Finding 6 (name collision) extends

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Verify zaostock.com in Google Search Console + submit sitemap.xml - shipped when GSC shows a verified property with the sitemap accepted | Zaal | Task | 2026-07-10 |
| PR: add `/festivals`, `/musicians/rider`, `/team/onepager` to `sitemap.ts` array - shipped when PR merged | Zaal | PR | 2026-07-10 |
| PR: remove `/team/m/` from `robots.ts` disallow list - shipped when PR merged and a `/team/m/<slug>` URL is crawlable | Zaal | PR | 2026-07-10 |
| PR: add `MusicEvent` JSON-LD to homepage (`name`, `startDate: 2026-10-03`, `location: Franklin Street Parklet, Ellsworth, ME`, `organizer: The ZAO`) - shipped when PR merged and markup passes Google's Rich Results Test | Zaal | PR | 2026-07-14 |
| Add a static `<a href="https://zaostock.com">` link on thezao.com (nav or footer, outside the NEXUS JS app) and on zaofestivals.com - shipped when both links are live and visible in page source (not just rendered JS) | Zaal | PR | 2026-07-14 |
| Update bettercallzaal.com's ZAOstock project card off "Pre-public" copy and link straight to zaostock.com - shipped when card text + link are updated | Zaal | PR | 2026-07-14 |
| Standardize external copy to always qualify "ZAOstock 2026" / "ZAOstock Maine" (never bare "ZAOstock") in social captions, sponsor decks, press pitches - shipped when the next 3 outbound posts use the qualified form | Zaal | Todo | 2026-07-17 |

## Sources

- [ZAOstock homepage](https://zaostock.com/) — [FULL, verified 2026-07-07]
- [Livin' It Up Music Festival ("ZAOSTOCK"), Valparaiso, IN — PanoramaNOW](https://panoramanow.com/events/livin-it-up-music-festival-valparaiso-indiana/) — [FULL, verified 2026-07-07]
- [ZAO NEXUS — thezao.com/nexus](https://www.thezao.com/nexus) — [FULL, verified 2026-07-07]
- [Hey Porter County! Special Olympics ZAOSTOCK coverage — Globe Star](https://globe-star.org/hey-porter-county-awesome-events-support-special-olympic-athletes/) — [PARTIAL - search snippet only, not fetched directly]
- [Livin' It Up Music Festival — Valpo.Life](https://valpo.life/article/livin-it-up-music-festival-makes-porter-county-special-olympics-mission-possible/) — [PARTIAL - search snippet only, not fetched directly]
- [ZAO-STOCK Maine Oct 3rd 2026 (@zaofestivals) — X](https://x.com/zaofestivals) — [PARTIAL - title/handle confirmed via search, content not fetched (X requires auth for full content)]
- [BetterCallZaal — Open-Source Infrastructure for Artist Ownership](https://bettercallzaal.com/) — [PARTIAL - read via exa search snippet]
- [bettercallzaal/ZAOOS README](https://github.com/bettercallzaal/ZAOOS) — [PARTIAL - read via exa search snippet]
- Repo files read directly: `zaostock/src/app/layout.tsx`, `zaostock/src/app/robots.ts`, `zaostock/src/app/sitemap.ts`, `zaostock/next.config.ts`, and per-page `metadata` exports across all 17 static routes — [FULL, read 2026-07-07]
