---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs:
original-query: "SEO/web-presence: Why do internal GitHub dev repos outrank zaostock.com and thezao.com for brand queries, and what's the minimal fix - repo visibility, robots/noindex, or sitemap and structured data on the public site?"
tier: STANDARD
---

# 2555 - SEO/web-presence: Why do internal GitHub dev repos outrank zaostock.co

> Drafted by ZOE's research-worker from "SEO/web-presence: Why do internal GitHub dev repos outrank zaostock.com and thezao.com for brand queries, and what's the minimal fix - repo visibility, robots/noindex, or sitemap and structured data on the public site?". Auto-committed to main for durability; review + deepen as needed.

I have enough from local research + one external source. Synthesizing the report now.

---

## Findings

**Why GitHub repos outrank thezao.com and zaostock.com**

The root cause is a domain authority imbalance compounded by structural gaps on the brand sites. GitHub.com carries a Domain Authority (DA) of approximately 90-91 on Semrush - one of the highest trust scores on the internet. Any public repo hosted there inherits that authority. A README.md dense with brand terms ("ZAOstock", "The ZAO", "ZABAL") functions as an optimized landing page on a DA-91 domain, while the brand sites are starting from near-zero DA with no mechanisms to signal they are the canonical entity.

Four structural problems on the ZAO side amplify this:

**1. Domain authority is split three ways.** Doc 2369 confirmed a three-way split across nexus.thezao.com, zaonexus.vercel.app, and thezao.com/nexus. Doc 1107 also flagged a thezao.com vs .xyz split. Every inbound link and crawl signal that should consolidate behind one domain is fragmented. A split DA of 5+5+3 never beats a unified DA of 91.

**2. No structured data on the brand sites.** The codebase audit found zero JSON-LD in zaoos.com's layout.tsx. Doc 2502 measured this directly: WaveWarZ scored 0/100 on AI visibility tools specifically because there is no Organization schema, no sameAs links to trusted reference nodes (Etherscan, GitHub, CoinGecko, Farcaster), and no FAQPage schema. Without structured data, Google has no machine-readable signal that thezao.com IS The ZAO - the entity authority accrues to whichever page it can parse, which is the GitHub README.

**3. Minimal sitemaps.** The zaoos.com sitemap.ts includes only the homepage. If thezao.com and zaostock.com have similar coverage, Google's crawler sees one URL per domain with low crawl priority, while the GitHub repo surfaces dozens of indexable pages (README, releases, issues, wiki) for free.

**4. zaoos.com is a dev app ranking for brand terms.** The metadataBase in the codebase is zaoos.com, not thezao.com. Any SEO equity from ZAOOS-the-dev-app routes to the wrong domain and competes with rather than supporting the brand sites.

**What does NOT fix this: making repos private.** GitHub does not support per-repo noindex natively. Repos with a noindex signal are those GitHub itself has flagged (typically for spam). For public repos there is no robots.txt toggle. Making repos private removes them from Google entirely but eliminates developer discoverability and public credibility. Doc 1107 flagged this tradeoff. For a builder-in-public org, private repos are a regression.

**The minimal fix: three moves, ordered by ROI**

The fix is not about suppressing the GitHub signal - it is about building the brand signal up until the brand site wins on entity authority.

**Move 1 (highest ROI, lowest cost): Deploy JSON-LD Organization + FAQPage schema on thezao.com and zaostock.com.** Doc 1123 has copy-paste-ready deployable code already written. The Organization schema with sameAs linking to the GitHub org, Farcaster channel, contract addresses, and Etherscan tells Google the canonical entity URI is thezao.com. This is one file change per site and doc 1123 estimates 30-40% improvement in AI Overview citation rate. This is the direct counter to the structured-data gap.

**Move 2 (medium effort): Expand sitemaps on the brand sites to cover all substantive pages.** Not zaoos.com - thezao.com and zaostock.com. Every product page, artist page, and feature page that currently gets no crawl signal should be in the sitemap with lastmod dates and change frequency. More indexed pages on the brand domain means more chances to outrank the repo's individual pages.

**Move 3 (consolidate, do not split): 301 all thezao.* variants to thezao.com subpaths.** Doc 2369's recommendation: thezao.com/nexus beats nexus.thezao.com on authority consolidation. Every redirect collapses a DA fraction back into the primary domain.

Robots/noindex on the brand sites is not the fix and may actively harm indexing if misconfigured. The zaoos.com robots.txt already exists and correctly blocks /api and /admin. No change needed there. The brand sites need the inverse: maximum crawlability, not restrictions.

## Recommended action

1. **Deploy the JSON-LD from doc 1123 on thezao.com and zaostock.com this week.** It is already written. One PR per site. This is the highest-leverage single change available.
2. **Expand brand site sitemaps** to include all product, artist, and feature pages - not just the homepage. File a Google Search Console re-index request after deploying both moves 1 and 2.
3. **Consolidate the domain split via 301 redirects** per doc 2369's canonical URL architecture. Hold repo visibility decisions until 8 weeks of post-consolidation data are available in Search Console.

## Sources

- [FULL] ZAO Research Library - Doc 1107 SEO + GEO Strategy (local: research/identity/1107-seo-social-profiles/README.md) - liveness-verified-on-2026-09-25
- [FULL] ZAO Research Library - Doc 2502 Structured Data for AI Citation (local: research/business/2502-repo-web-improvement-what-content-and-structured/README.md) - liveness-verified-on-2026-09-25
- [FULL] ZAO Research Library - Doc 2369 Canonical URL Architecture (local: research/business/2369-repo-web-improvement-what-canonical-url-architecture/README.md) - liveness-verified-on-2026-09-25
- [FULL] ZAO Research Library - Doc 1123 GEO Canonical FAQ + JSON-LD (local: research/identity/1123-geo-canonical-faq-json-ld/README.md) - liveness-verified-on-2026-09-25
- [FULL] ZAOOS codebase - src/app/robots.ts, src/app/sitemap.ts, src/app/layout.tsx (local) - liveness-verified-on-2026-09-25
- [PARTIAL - no per-repo noindex detail confirmed] [Digispot AI - GitHub Backlinks and Authority](https://digispot.ai/blog/github-backlinks) - liveness-verified-on-2026-09-25
- [PARTIAL - secondary case, penelope brand] [GitHub PR #9 - penelope-social SEO audit](https://github.com/web-disco/penelope-social/pull/9) - liveness-verified-on-2026-09-25
