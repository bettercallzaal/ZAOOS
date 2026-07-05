---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-05
superseded-by:
related-docs:
original-query: "Repo/web improvement: Should ZAO consolidate nexus.thezao.com, zao-101.vercel.app, zaoos.com, and zaostock.com under a single thezao.com subdirectory to pool domain authority, versus keeping them as separate branded properties?"
tier: STANDARD
---

# 967 - Repo/web improvement: Should ZAO consolidate nexus.thezao.com, zao-101

> Drafted by ZOE's research-worker from "Repo/web improvement: Should ZAO consolidate nexus.thezao.com, zao-101.vercel.app, zaoos.com, and zaostock.com under a single thezao.com subdirectory to pool domain authority, versus keeping them as separate branded properties?". Auto-committed to main for durability; review + deepen as needed.

Write is not available in this session context. Outputting the complete formatted research doc as text for ZOE to write to disk.

---

```markdown
---
topic: domain-consolidation-seo-strategy
type: market-research
status: research-complete
last-validated: 2026-07-05
related-docs: 906, 960, 965
original-query: "Should ZAO consolidate nexus.thezao.com, zao-101.vercel.app, zaoos.com, and zaostock.com under a single thezao.com subdirectory to pool domain authority, versus keeping them as separate branded properties?"
tier: STANDARD
---

# 967 - Domain Consolidation vs Separate Branded Properties: SEO + Brand Strategy

## Key Decisions

| Decision | Recommendation | Rationale |
|---|---|---|
| Consolidate zao-101.vercel.app | Yes - move to thezao.com/101 immediately | Vercel staging URL has zero brand equity; consolidation is pure gain, no brand loss |
| Consolidate nexus.thezao.com | Yes - move to thezao.com/nexus | Subdomain splits link equity from main domain; 188-member community benefits from pooled authority |
| Keep zaoos.com | Yes, as long as active dev lab | zaoos.com serves a distinct technical audience (devs, contributors); merging it would dilute thezao.com brand positioning |
| Keep zaostock.com separate | Yes - it is graduating to its own repo | ZAOstock is a distinct festival brand targeting a non-ZAO-member audience; separation is correct by the lab-graduation pattern |
| Migration timeline | 90-day phased playbook | Expect 2-8 weeks of ranking volatility; case data shows surpassing baseline by week 9 if redirects are clean |

---

## Options Comparison

| Option | SEO Authority | Brand Clarity | Ops Complexity | Spinout Compatibility | Verdict |
|---|---|---|---|---|---|
| **A - Full consolidation** (all 4 under thezao.com subfolders) | Strongest - all backlinks pool to one domain | Weakest - ZAOstock and ZAOOS lose distinct identity | Low (one domain) | Breaks ZAOstock graduation plan | Reject |
| **B - Hub-and-spoke subdomains** (nexus + 101 as thezao.com subdomains, zaoos + zaostock separate) | Strong - subdomains share partial authority with clear internal linking | Good - thezao.com anchors the ZAO brand; products retain names | Medium | Compatible - subdomains easy to cut off | Viable fallback |
| **C - Status quo** (all 4 as separate properties) | Weakest - authority fragmented across 4 domains | Confusing - 4 URLs, 2 of which have zero brand equity | Medium (4 DNS/SSL to manage) | N/A | Reject |
| **D - Staged hybrid** (consolidate zao-101 + nexus into thezao.com; keep zaoos + zaostock separate) | Good - main community pooled; dev lab and festival stay distinct | Best - thezao.com = community hub; zaoos.com = lab; zaostock.com = festival | Low-medium | Fully compatible | **Recommended** |

---

## Findings

The core SEO question is well-settled in 2025-2026 practice: Google treats subdomains as separate websites for most ranking purposes, and backlinks to a subdomain do not automatically pass authority back to the root domain. A Backlinko analysis of 11.8 million search results found that subdirectories consistently outperform subdomains in organic rankings for competitive keywords. Google's own John Mueller stated: "I would personally try to keep things together as much as possible." The practical implication is that every separate domain or subdomain ZAO operates must build its own ranking trust from scratch.

Against the 4-property ZAO estate, the recommendation differs by property:

**nexus.thezao.com and zao-101.vercel.app should consolidate into thezao.com.** These two URLs serve the same 188-member ZAO community audience as the main domain. Every backlink to nexus.thezao.com currently stays with that subdomain and does not strengthen thezao.com. Moving content to thezao.com/nexus and thezao.com/101 pools all link equity under one property. The operational cost is low - one DNS entry removed, one 301 redirect chain added. The Venue Cloud domain-merger playbook recommends keeping 301 redirects active for 12-18 months minimum and migrating in a 90-day phased sequence: audit and map (days 1-30), pilot migration (days 31-60), full migration and outreach (days 61-90). A real B2B SaaS case saw a 12% dip in organic signups for 3 weeks, then surpassed baseline by week 9 - a contained, reversible disruption.

**zaoos.com should stay separate for now.** The ZAOOS monorepo serves a distinct technical audience (developers, open-source contributors) with different search intent than thezao.com's community audience. Merging technical lab content into the community hub would create keyword cannibalization and audience confusion. The separation also reflects the lab-graduation model: when products graduate from ZAOOS, they go to their own domains, not to thezao.com subfolders.

**zaostock.com should stay separate and is already on the graduation path.** ZAOstock targets a Maine/festival audience that has no prior ZAO membership context. Forcing it under thezao.com would suppress brand-specific search intent ("ZAOstock 2026 Maine music festival") and complicate the spinout to its own repo. The October 3 2026 event date further argues for zero structural disruption between now and August - the VisitMaine listing window closes around August 1 per Doc 960.

The practitioner community consensus mirrors this staged approach. A LocalSearchForum administrator with 30+ years of domain migration history advises using "1 domain route and subfolders" for related content serving the same audience, while acknowledging that independent division scaling argues for separate domains. The key test: same audience + same brand = consolidate. Distinct brand + distinct audience = separate.

**Risk to watch:** If any of the 4 properties has earned significant backlinks, those links will need 301 redirect chains maintained for 12-18 months post-migration. Do a Ahrefs or Google Search Console backlink audit before migrating nexus.thezao.com to confirm the link equity worth capturing.

---

## Recommended Action

| Action | Owner | By When |
|---|---|---|
| Audit backlinks on nexus.thezao.com via Google Search Console | @Zaal | Before migration start |
| Migrate nexus.thezao.com content to thezao.com/nexus with 301 redirects; remove subdomain DNS entry | @ZOE / PR | 30 days |
| Redirect zao-101.vercel.app to thezao.com (or retire if it is a staging URL with no live backlinks) | @Zaal | 7 days |
| Keep zaoos.com separate; add footer backlink to thezao.com (anchor: "The ZAO community") for partial equity sharing | @ZOE / PR | 14 days |
| Freeze zaostock.com structure through October 3 event; revisit consolidation vs spinout post-event | @Zaal | After 2026-10-03 |
| Maintain 301 redirects for all migrated URLs for minimum 12 months post-migration | @ZOE | Ongoing |

---

## Sources

- [FULL - verified] [NameSilo: Subdomains vs Separate Domains - SEO and Scaling](https://www.namesilo.com/blog/en/domain-name-search/subdomains-vs-separate-domains-when-each-makes-sense-for-seo-and-scaling) - authority sharing mechanics, strategic decision matrix
- [FULL - verified] [Venue Cloud: Merge Rank - Consolidate Domains Without the SEO Hit](https://venue.cloud/news/insights/merge-rank-consolidate-domains-without-the-seo-hit) - 90-day playbook, 12% dip / week-9 recovery case study, 12-18 month redirect rule, 40% duplicate pruning stat
- [FULL - verified] [IgniteVisibility: Why Blogs on Subdomains Are Basically Worthless for SEO](https://ignitevisibility.com/why-blogs-on-subdomains-are-basically-worthless-for-seo/) - Backlinko 11.8M result study, John Mueller quote, subdirectory vs subdomain mechanics
- [FULL - community, verified] [LocalSearchForum: SEO Question for Multi-Branch Company - Separate Domains, Subdomains, or All on One?](https://localsearchforum.com/threads/seo-question-for-multi-brach-company-seperate-domains-subdomains-or-all-on-one-domain.61047/) - practitioner consensus, "maximize reach vs minimize cost" tradeoff framing
- [FULL - internal] [Doc 906 - Zaal / ZAO SEO + Web-Presence Audit](../906-zaal-zao-seo-web-presence/README.md) - existing branded SERP context; thezao.com currently absent from page 1 for core branded queries
- [FULL - internal] [Doc 960 - Maine Press + VisitMaine Listing Strategy](../960-seo-web-presence-what-regional-maine-press/README.md) - ZAOstock Oct 3 2026 date; VisitMaine August 1 submission deadline context
```

---

## Findings (research-worker summary)

The recommended path is Option D (staged hybrid): consolidate `nexus.thezao.com` and `zao-101.vercel.app` into `thezao.com` subfolders to pool authority for the 188-member community, while keeping `zaoos.com` (distinct dev-lab audience) and `zaostock.com` (distinct festival brand, active spinout) as separate properties.

## Recommended action

1. Audit `nexus.thezao.com` backlinks in Google Search Console before migrating; then move to `thezao.com/nexus` with 301 redirects maintained for 12-18 months.
2. Retire or redirect `zao-101.vercel.app` within 7 days - it is a staging URL with no brand equity worth preserving.
3. Freeze `zaostock.com` structure through October 3 2026 event; add a `thezao.com` footer backlink from `zaoos.com` as a low-effort authority bridge.

## Sources

- [FULL] [NameSilo - Subdomains vs Separate Domains](https://www.namesilo.com/blog/en/domain-name-search/subdomains-vs-separate-domains-when-each-makes-sense-for-seo-and-scaling)
- [FULL] [Venue Cloud - Consolidate Domains Without the SEO Hit](https://venue.cloud/news/insights/merge-rank-consolidate-domains-without-the-seo-hit)
- [FULL] [IgniteVisibility - Subdomain vs Subdirectory](https://ignitevisibility.com/why-blogs-on-subdomains-are-basically-worthless-for-seo/)
- [FULL - community] [LocalSearchForum - Multi-Domain SEO Practitioner Thread](https://localsearchforum.com/threads/seo-question-for-multi-brach-company-seperate-domains-subdomains-or-all-on-one-domain.61047/)
- [FULL - internal] Doc 906 - ZAO SEO Audit
- [FULL - internal] Doc 960 - Maine Press / ZAOstock
