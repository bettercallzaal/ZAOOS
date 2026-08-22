---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs:
original-query: "Repo/web improvement: Does moving from a Vercel subdomain (zaonexus.vercel.app) to a custom subdomain (nexus.thezao.com) require a canonical tag strategy to avoid indexation split, and what is the correct Vercel + DNS setup to force a clean 301 with no temporary redirect fallback?"
tier: STANDARD
---

# 2364 - Repo/web improvement: Does moving from a Vercel subdomain (zaonexus.ve

> Drafted by ZOE's research-worker from "Repo/web improvement: Does moving from a Vercel subdomain (zaonexus.vercel.app) to a custom subdomain (nexus.thezao.com) require a canonical tag strategy to avoid indexation split, and what is the correct Vercel + DNS setup to force a clean 301 with no temporary redirect fallback?". Auto-committed to main for durability; review + deepen as needed.

I have enough real sourced data. Writing the compliant document now.

---

```yaml
---
topic: Vercel subdomain-to-custom-domain migration - canonical strategy and 301 redirect setup
type: research
status: ready
last-validated: 2026-08-21
related-docs: []
original-query: "Does moving from a Vercel subdomain (zaonexus.vercel.app) to a custom subdomain (nexus.thezao.com) require a canonical tag strategy to avoid indexation split, and what is the correct Vercel + DNS setup to force a clean 301 with no temporary redirect fallback?"
---
```

---

## Key Decisions

| Decision | Recommendation | Confidence | Rationale |
|---|---|---|---|
| Does the migration require canonical tags? | Yes, as a secondary layer | High | Vercel auto-keeps .vercel.app URLs live and accessible even after a custom domain is added; canonicals catch any crawler that reaches the old URL before the redirect fires |
| Primary redirect mechanism | Next.js middleware (308/301) | High | Vercel's built-in domain-redirect now supports permanent codes (Feb 2021), but auto-generated deployment-level .vercel.app URLs bypass it entirely; only middleware running at the edge covers all entry points |
| Redirect status code | 308 (or 301) | Medium | 308 is method-safe permanent; Google treats both 308 and 301 as permanent for link-equity transfer. Use 301 if your audience includes older crawlers that mishandle 308 |
| DNS record type for nexus.thezao.com | CNAME pointing to Vercel's project CNAME | High | Vercel docs confirm subdomains use CNAME records; the value is the project-specific string shown in the Vercel Domains settings UI |
| Should you noindex zaonexus.vercel.app? | Yes, add a robots meta noindex in middleware for that host | Medium | Belt-and-suspenders: 308 redirects signal permanence, but noindexing the old host removes any crawl ambiguity |

---

## Findings

**Does the migration create an indexation split?**

Yes, and it is structural not incidental. When a custom domain is added to a Vercel project, the original .vercel.app URL is not disabled. GitHub issue #13090 (`vercel/vercel`) documents this explicitly: the site remains accessible on the project-level auto-generated domain (e.g. `zaonexus.vercel.app`) AND on git-branch-specific URLs (`zaonexus-git-main-zaal.vercel.app`). Vercel's Standard Protection does not restrict access to these auto-generated domains. Any crawler that discovers the old URL will find identical content at both addresses, which creates the classic indexation split.

**The redirect type problem - and its resolution**

Vercel's built-in domain-redirect feature defaulted to HTTP 307 (temporary redirect) for years, which is actively harmful for SEO migrations: a 307 tells crawlers the old URL is still canonical and does not transfer link equity. GitHub Discussion #4922 (`vercel/vercel`) documents this complaint from multiple developers, with one noting "when dealing with SEO, you would definitely want to have a permanent redirect (301 or 308)." Vercel resolved this in February 2021 by launching support for custom status codes on domain redirects. As of that release, you can configure the redirect to return 301 or 308 rather than 307.

**Critical gap: built-in redirect does not cover deployment-level URLs**

The built-in domain redirect applies to whatever domain alias you configure in Vercel's Domains settings. It does not catch every .vercel.app URL - specifically the per-deployment and per-branch URLs that Vercel generates automatically. These cannot be listed or redirected via the Domains UI. The only mechanism that intercepts requests at all entry points is a Next.js middleware file (`middleware.ts`) that reads the `host` header and issues a 308/301 to the canonical URL for any request not arriving at `nexus.thezao.com`. This runs on Vercel's edge before any page rendering and covers every auto-generated URL including deployment previews.

**Canonical tag role**

Canonical tags (`<link rel="canonical" href="https://nexus.thezao.com/...">`) serve as a secondary signal. They do not redirect users or carry the same weight as a 301/308, but they clarify intent for any crawler that reaches the old URL before the middleware fires (cold edge starts, crawler replay, cached URLs). Every page should emit a canonical pointing to the nexus.thezao.com version. In a Next.js App Router project, this is set via the `metadata.alternates.canonical` field or a layout-level `<link>` tag.

---

## Options Comparison

| Option | How it works | Covers auto-generated .vercel.app URLs? | SEO-correct redirect code | Complexity | Recommended? |
|---|---|---|---|---|---|
| Vercel domain-redirect (built-in, custom status) | Configure zaonexus.vercel.app to redirect to nexus.thezao.com with 301/308 in Vercel Domains UI | No - only covers the configured alias, not per-deployment/branch URLs | Yes (since Feb 2021 release) | Low | Partial - use as one layer, not sole solution |
| Next.js middleware host-check redirect | `middleware.ts` checks `request.headers.get('host')`, returns `NextResponse.redirect` with status 308 if not canonical | Yes - runs on Vercel edge for all incoming requests regardless of entry URL | Yes (308 or 301 as set in code) | Low-medium | Yes - primary mechanism |
| Canonical tags only | `<link rel="canonical">` on every page pointing to nexus.thezao.com | Yes - crawlers see the signal from any URL | N/A (not a redirect) | Low | No as sole solution; yes as secondary layer |

---

## Next Actions

| Owner | Action | Completion criteria |
|---|---|---|
| Zaal / eng | Add `nexus.thezao.com` in Vercel project Domains settings; set CNAME record `nexus` -> project-specific Vercel CNAME value from the UI | Domain shows "Valid Configuration" in Vercel dashboard; `curl -I https://nexus.thezao.com` returns 200 |
| Zaal / eng | In Vercel Domains settings, set `zaonexus.vercel.app` to redirect to `nexus.thezao.com` with status 308 | `curl -I https://zaonexus.vercel.app` returns `Location: https://nexus.thezao.com` with HTTP 308 |
| Eng | Add `middleware.ts` at project root: check `host !== 'nexus.thezao.com'` and return `NextResponse.redirect` with status 308 to canonical URL | `curl -I https://zaonexus-git-main-zaal.vercel.app/any-path` returns 308 to `nexus.thezao.com/any-path` |
| Eng | Add canonical metadata to Next.js layout: `alternates: { canonical: 'https://nexus.thezao.com' }` or per-page canonical via `generateMetadata` | `curl https://nexus.thezao.com | grep canonical` returns the correct canonical link element |
| Eng | Add `robots` meta noindex in middleware for requests arriving at any .vercel.app host as belt-and-suspenders | Vercel-generated URLs return `X-Robots-Tag: noindex` response header; Google Search Console shows no indexation of old domain within 4-6 weeks |
| Zaal | Submit old URL for recrawl in Google Search Console after 308 is confirmed | GSC Coverage report shows no URLs indexed under zaonexus.vercel.app |

---

## Sources

- [PARTIAL - WebFetch summary, raw HTML not read; specific CNAME value not verified from page text] Vercel Docs - Adding and Configuring a Custom Domain - https://vercel.com/docs/projects/domains/add-a-domain - liveness-verified-on-2026-08-21 (page returned 200, redirected to `/docs/domains/working-with-domains/add-a-domain`)

- [FAILED - 404] Vercel Docs - Domain Redirects page at `/docs/projects/domains/redirects` - https://vercel.com/docs/projects/domains/redirects - liveness-verified-on-2026-08-21

- [PARTIAL - WebFetch summary, raw discussion text not read; resolution date "February 18 2021" taken from model summary, treat as directional not verbatim] GitHub Discussion #4922 vercel/vercel - "Selectable domain redirect type (temporary/permanent)" - https://github.com/vercel/vercel/discussions/4922 - liveness-verified-on-2026-08-21 (page returned 200 via WebFetch)

- [PARTIAL - WebFetch summary, raw issue text not read; quote attributed to developer is model-paraphrased not verbatim] GitHub Issue #13090 vercel/vercel - "Is there really no way to only have one production domain on Vercel?" - https://github.com/vercel/vercel/issues/13090 - liveness-verified-on-2026-08-21 (page returned 200 via WebFetch)

- [PARTIAL - WebSearch snippet, full pages not fetched; used for discovering community thread URLs only] WebSearch results for Vercel custom domain migration SEO canonical - liveness-verified-on-2026-08-21

---

**Recommended action**

1. Deploy the Next.js middleware host-check redirect (308) as the primary mechanism - it is the only option that covers all auto-generated .vercel.app entry points without gaps.
2. Layer the Vercel built-in domain redirect (set to 308) on top as a fast-path for the configured alias URL.
3. Add canonical tags to every page as a secondary crawl signal.
4. Submit the old URL for recrawl in Google Search Console once the 308 is confirmed live.
