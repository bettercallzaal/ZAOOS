---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs:
original-query: "Repo/web improvement: Does hosting the Nexus hub on a subdomain (nexus.thezao.com) versus a path (thezao.com/nexus) dilute cumulative domain authority for thezao.com, and what is the correct architecture for a creator brand links hub?"
tier: STANDARD
---

# 1010 - Repo/web improvement: Does hosting the Nexus hub on a subdomain (nexus

> Drafted by ZOE's research-worker from "Repo/web improvement: Does hosting the Nexus hub on a subdomain (nexus.thezao.com) versus a path (thezao.com/nexus) dilute cumulative domain authority for thezao.com, and what is the correct architecture for a creator brand links hub?". Auto-committed to main for durability; review + deepen as needed.

I have all 5 verified sources plus the local library context. Compiling the full structured output now.

---

```markdown
---
topic: Subdomain vs. Subdirectory for ZAO Nexus Hub (thezao.com)
type: decision
status: research-complete
last-validated: 2026-07-09
related-docs: 967, 976, 906, 990
original-query: Does hosting the Nexus hub on a subdomain (nexus.thezao.com) versus
  a path (thezao.com/nexus) dilute cumulative domain authority for thezao.com, and
  what is the correct architecture for a creator brand links hub?
---

## Key Decisions

| Decision | Recommendation | Confidence | Rationale |
|---|---|---|---|
| Nexus hub URL structure | `thezao.com/nexus` (subdirectory) | High | Preserves backlink equity on root domain; subdomains require independent authority build from zero |
| Creator links hub ownership | Self-hosted on owned domain path, not third-party | High | Third-party tools (Linktree DA 92+) capture social referral authority that should flow to thezao.com |
| When a subdomain is acceptable | Only for genuinely separate products with distinct auth or audience (e.g., `app.thezao.com`) | Medium | Technical separation is legitimate; SEO cost is real and documented |
| Migration priority | Build at `thezao.com/nexus` from the start; avoid retrofitting | High | Migrating off a live subdomain takes 3-4 months for Google to rebuild trust even on high-DR domains |

---

## Comparison Table: Nexus Hub Hosting Options

| Option | Link Equity to thezao.com | Authority Build Speed | Brand Cohesion | Search Console Overhead | Dev Complexity | Recommended? |
|---|---|---|---|---|---|---|
| `thezao.com/nexus` (subdirectory) | Full - shared root domain | Fast | High | Zero - shares root property | Low | YES |
| `nexus.thezao.com` (subdomain) | Partial - requires internal link bridges | Slow (3-4 months documented lag) | Medium | High - separate SC property | Low | No |
| Third-party (Linktree, etc.) | None - flows to linktree.com DA 92 | None for ZAO | Low | None | None | No |
| Standalone domain (nexus.xyz) | None - separate root entirely | None | Low | High | Medium | No |

---

## Findings

The SEO consensus on subdomain versus subdirectory has stabilized over the past two years. Google's Search Advocate John Mueller has stated explicitly that "Google web search is fine with using either subdomains or subdirectories," and this is technically accurate at the crawling and indexing layer. What Mueller's statement omits - and what matters for a creator brand at thezao.com's stage - is how link equity accumulates and distributes once content is indexed.

**The authority mechanics are not symmetric.** When a backlink points at `thezao.com/nexus`, the equity accrues to the root domain and all pages under it benefit. When a backlink points at `nexus.thezao.com`, Cloudflare's technical breakdown (verified) puts it directly: "the authority of blog.bobtopia.com is increased, but the authority of bobtopia.com is not affected." Each subdomain is an island. Backlinks must be earned independently. Namesilo's SEO team confirms this requires separate sitemaps, separate Search Console properties, and no automatic pass-through from a well-aged root domain. For a brand growing thezao.com's authority from its current baseline, splitting equity between root and a subdomain is the wrong moment to fork the accumulation.

**The G2.com case study is the sharpest real-world data point.** G2 moved its blog to `learn.g2.com` with a domain rating of 88 and 750k+ monthly visitors already established. It still required 3-4 months of fresh link-building before Google extended trust to the subdomain - Backlinko's research confirms this delay would not have occurred on a subdirectory. For thezao.com, which does not yet have DR 88, the delay would be longer.

**The third-party hub question is a separate but related trap.** Tagnovate's 2025 analysis (verified fetch) identifies that running a links hub on a Linktree-type service routes all social referral clicks to Linktree's domain authority (DA 92+) instead of thezao.com. Every Instagram, Farcaster, or X profile that links to a Linktree page is donating authority signals to Linktree, not ZAO. The fix is not just "use a subdomain instead of Linktree" - it is hosting the hub at `thezao.com/nexus` so every click builds the root domain.

**Existing ZAO research is directionally aligned.** Doc 967 (domain consolidation strategy) and Doc 976 (Porkbun/Nexus domain audit) have both addressed subdomain versus apex domain tradeoffs in the ZAO ecosystem context. This research extends those findings specifically to the Nexus hub use case and recommends the subdirectory path as the correct consolidation point.

The one caveat: if Nexus requires a fundamentally different authentication model, separate CMS, or will eventually become a distinct standalone product for other creators (not just The ZAO), a subdomain or standalone domain becomes defensible. For a creator hub that aggregates ZAO ecosystem links and is always going to be ZAO-branded, that condition does not apply.

---

## Next Actions

| Action | Owner | Deadline | Notes |
|---|---|---|---|
| Build or redirect Nexus hub to `thezao.com/nexus` | ZOE / Zaal | Before any subdomain link-building | Do not launch at `nexus.thezao.com` if the subdirectory path is feasible in Next.js |
| Verify `thezao.com/nexus` route does not conflict with ZAOOS app router structure | Dev | Pre-launch | Check `src/app/nexus/` path availability in ZAOOS App Router; may need a static page or redirect wrapper |
| Update all social profile link-in-bio fields to point at `thezao.com/nexus` | Zaal | At launch | Every profile currently pointing at a third-party tool is donating social referral signals away from thezao.com |
| Add `thezao.com/nexus` to Google Search Console root property | Zaal | At launch | Subdirectory inherits the root SC property - no separate action needed; confirm root property is verified |
| Cross-reference Doc 967 consolidation plan | ZOE | Planning phase | Doc 967 covers broader domain consolidation; Nexus hub decision should align with that roadmap |

---

## Sources

- [FULL] Semrush - Subdomain vs. Subdirectory: What They Are and Which Is Better for SEO - https://www.semrush.com/blog/subdomain-vs-subdirectory/
- [FULL] Namesilo - How Subdomains Impact Site Authority in Modern SEO - https://www.namesilo.com/blog/en/marketing-tips/how-subdomains-impact-site-authority-in-modern-seo
- [FULL] Backlinko - Subdomain vs Subdirectory: Which Is Better for SEO - https://backlinko.com/subdirectory-vs-subdomain
- [FULL] Cloudflare Blog - SEO Best Practices with Cloudflare Workers Part 1: Subdomain vs. Subdirectory - https://blog.cloudflare.com/subdomains-vs-subdirectories-best-practices-workers-part-1/
- [FULL] Tagnovate - Is Linktree Hurting Your SEO? The 2025 Truth - https://tagnovate.com/blog/is-linktree-bad-for-seo
- [PARTIAL - 429 rate limit, URL confirmed live via search] Hacker News - Ask HN: Does putting a blog on a subdomain vs. subdirectory matter in 2024? - https://news.ycombinator.com/item?id=40150874
- [LOCAL] Doc 967 - Should ZAO consolidate nexus.thezao.com, zao-101.vercel.app, zaoos.com, zaostock.com - research/business/967-repo-web-improvement-should-zao-consolidate-nexus/
- [LOCAL] Doc 976 - Porkbun to NEXUS domain audit - research/infrastructure/976-porkbun-nexus-domain-audit/
- [LOCAL] Doc 906 - Zaal / ZAO SEO + Web-Presence Audit - research/business/906-zaal-zao-seo-web-presence/
```

---

**Recommended action summary:** `thezao.com/nexus` is the correct architecture. Build there, not at `nexus.thezao.com`. 5 external sources fetched and verified; 1 community source (HN thread) confirmed live but rate-limited at read time; 3 existing ZAO research docs cross-reference the decision. No fabricated data points - the "15% organic visibility" claim in the Tagnovate article is attributed to Search Engine Journal and flagged as unverified secondary citation, not repeated as fact in the synthesis above.
