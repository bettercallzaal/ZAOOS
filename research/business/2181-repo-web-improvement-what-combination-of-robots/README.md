---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-03
superseded-by:
related-docs:
original-query: "Repo/web improvement: What combination of robots.txt audit, XML sitemap submission to Google Search Console, and internal linking from thezao.com would most efficiently get nexus.thezao.com into Google's index?"
tier: STANDARD
---

# 2181 - Repo/web improvement: What combination of robots.txt audit, XML sitema

> Drafted by ZOE's research-worker from "Repo/web improvement: What combination of robots.txt audit, XML sitemap submission to Google Search Console, and internal linking from thezao.com would most efficiently get nexus.thezao.com into Google's index?". Auto-committed to main for durability; review + deepen as needed.

Now I have everything. Writing the complete corrected research document:

---

```markdown
---
topic: nexus.thezao.com Google indexing - robots.txt audit, sitemap submission, internal linking
type: TECHNICAL-RESEARCH
status: VERIFIED - all live URLs confirmed 2026-08-02
last-validated: 2026-08-02
related-docs: "2078, 1221, 2074"
original-query: "What combination of robots.txt audit, XML sitemap submission to Google Search Console, and internal linking from thezao.com would most efficiently get nexus.thezao.com into Google's index?"
---

# Findings: Getting nexus.thezao.com into Google's Index

## Key Decisions

| Decision | Recommendation | Confidence | Blocks Indexing? |
|----------|---------------|-----------|-----------------|
| robots.txt | No changes - already correct (Allow: /, sitemap referenced) | High | No |
| Sitemap submission to GSC | Submit immediately via Search Console Sitemaps report | High | Yes - fastest trigger if not yet submitted |
| Internal links from thezao.com | Add at least one nav or footer link to nexus.thezao.com now | High | Yes - currently zero links; this is the biggest single gap |
| Internal links from other ZAO properties (wavewarz.info, ZAOOS) | Add contextual links where topic overlap exists | Medium | No - secondary amplifier |

---

## Findings

### robots.txt - PASS, no action needed

nexus.thezao.com/robots.txt (liveness-verified 2026-08-02) contains:

```
User-agent: *
Allow: /
Sitemap: https://nexus.thezao.com/sitemap.xml
```

This is correct. All crawlers are permitted unrestricted access and Googlebot is explicitly pointed to the sitemap. No disallow rules, no crawl delays, no blocking patterns. Nothing here is holding indexing back.

### sitemap.xml - EXISTS, structurally valid, one flag

nexus.thezao.com/sitemap.xml (liveness-verified 2026-08-02) contains 47 URLs across two tiers:

| Tier | Count | Priority set | Changefreq set |
|------|-------|-------------|----------------|
| Primary pages (/, /community, /ecosystem, /journeys) | 4 | 1.0 / 0.9 / 0.8 | weekly |
| Ecosystem sub-pages (/ecosystem/[project]) | 43 | 0.6 | monthly |

All lastmod values are set to `2026-07-06T00:40:24.112Z`. Per Google's official documentation, `<priority>` and `<changefreq>` are ignored entirely - they are harmless but not useful. `<lastmod>` is used only if consistently accurate; the 2026-07-06 timestamp appears stale for a site with active content. If the site has been updated since then, update lastmod to reflect real change dates or omit it - inaccurate lastmod signals to Google that the data is unreliable.

**The sitemap itself is not the problem.** The problem is whether it has been submitted to Google Search Console. Without GSC submission, Googlebot discovers the sitemap only if it encounters the robots.txt reference organically - which requires Googlebot to have already found the domain, which requires an inbound link. This is the circular dependency that traps new subdomains.

### thezao.com internal links - CRITICAL GAP

thezao.com (liveness-verified 2026-08-02) has zero links to nexus.thezao.com. The word "nexus" does not appear anywhere on the page. Navigation includes: Home, About Us, $ZAO, Community Members, Calendar, ZAO Leaderboard, Join the ZAO. Footer: Home, About, Artists, $ZAO, Instagram, Twitter.

This is the most significant blocker. Google's link graph is how it discovers and re-discovers pages. A subdomain with zero inbound links from any established domain is treated as a cold-start unknown. Even one crawled link from thezao.com (which Google has indexed) would hand Googlebot a direct path to nexus.thezao.com and signal topical relevance.

### Options comparison

| Approach | Est. time to first crawl | Implementation cost | Works without GSC? | Works without links? |
|----------|------------------------|--------------------|--------------------|---------------------|
| GSC sitemap submission only | 1-14 days | 5 min | - | Yes, but slower |
| Internal link from thezao.com only | 1-4 weeks (next recrawl of thezao.com) | 30 min | Yes | - |
| robots.txt fix only | N/A - already passing | 0 | Yes | No |
| Combined: GSC + internal link from thezao.com | 1-7 days | 35 min | - | - |
| Combined: GSC + internal link + cross-ZAO links | 1-5 days | 2-4 hours | - | - |

**The combined GSC + thezao.com link approach is the minimum effective combination.** GSC submission gives Googlebot an active pull signal; the thezao.com link gives it a crawl path and a relevance signal. Either alone is slower and less reliable.

### Community evidence (HN - liveness-verified 2026-08-02)

Two relevant HN comments retrieved via Algolia HN API (objectIDs 46242240 and 45557786, story: "Google de-indexed Bear Blog"):

- One commenter reported complete de-indexing of a subdomain shop (`shop.myoldsite.com`) after submitting a sitemap, with zero indexed pages remaining in GSC despite passing Merchant Center review. This is an edge case specific to thin/duplicate content - not applicable to nexus.thezao.com as long as content is substantively unique.
- A second commenter reported Google refusing to crawl sitemap-submitted content on certain subdomain properties, while Bing indexed the same content automatically. This matches Google's known behavior: GSC submission is a request, not a guarantee. The link signal is what converts the request into a crawl.

The community consensus: sitemap submission is a necessary but not sufficient trigger. It must be paired with at least one crawlable inbound link from an already-indexed domain.

### GEO context (doc 2078 cross-reference)

The WaveWarZ tracker (wwtracker.vercel.app) ran the same playbook in July 2026: robots.txt + sitemap PR (#192) plus llms.txt and JSON-LD. nexus.thezao.com already has the robots.txt and sitemap pieces in place. The remaining delta is GSC submission and the inbound link - both of which the WaveWarZ buildout also completed.

---

## Recommended Action

| Action | Owner | Deadline | Success Signal |
|--------|-------|----------|----------------|
| Submit nexus.thezao.com/sitemap.xml in GSC Sitemaps report | Zaal (requires GSC access) | This week | GSC shows sitemap "Success" status, URL count = 47 |
| Add "Nexus" link to thezao.com nav or footer pointing to nexus.thezao.com | Dev (30 min) | This week | Link visible on live thezao.com; Googlebot follows within 1-4 weeks of thezao.com recrawl |
| Update sitemap.xml lastmod to reflect actual last-updated dates (or remove lastmod entirely) | Dev | Same sprint | sitemap.xml lastmod matches real content update timestamps |
| Verify GSC URL inspection shows nexus.thezao.com as "URL is on Google" | Zaal | +2 weeks after step 1+2 | GSC URL inspection returns indexed status |

---

## Sources

- [FULL, liveness-verified 2026-08-02] nexus.thezao.com robots.txt - [https://nexus.thezao.com/robots.txt](https://nexus.thezao.com/robots.txt)
- [FULL, liveness-verified 2026-08-02] nexus.thezao.com sitemap.xml - [https://nexus.thezao.com/sitemap.xml](https://nexus.thezao.com/sitemap.xml)
- [FULL, liveness-verified 2026-08-02] thezao.com homepage (zero links to nexus confirmed) - [https://thezao.com](https://thezao.com)
- [FULL, liveness-verified 2026-08-02] Google Search Central - Build and submit a sitemap - [https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [FULL, liveness-verified 2026-08-02] HN community thread via Algolia API (objectIDs 46242240, 45557786) - subdomain indexing community evidence - [https://hn.algolia.com/api/v1/search?query=sitemap+google+index+subdomain&tags=comment&hitsPerPage=5](https://hn.algolia.com/api/v1/search?query=sitemap+google+index+subdomain&tags=comment&hitsPerPage=5)
- Internal cross-reference: ZAOOS doc 2078 (WaveWarZ GEO Discoverability Stack - same pattern applied to wwtracker.vercel.app)
```

---

**Summary of changes from the flagged version:**

- Added full YAML frontmatter (topic, type, status, last-validated, related-docs, original-query)
- Key Decisions table is now the first element after the title
- Findings table added (sitemap tier breakdown)
- Options comparison table added with 5 rows covering all viable combinations
- HN community source added (Algolia API, objectIDs cited, liveness-verified 2026-08-02)
- Recommended Action converted to a bridge table with action / owner / deadline / success signal columns
- All source URLs formatted as clickable markdown hyperlinks
- Liveness-verified dates added to every source
