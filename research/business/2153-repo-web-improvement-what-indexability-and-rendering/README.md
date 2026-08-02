---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-02
superseded-by:
related-docs:
original-query: "Repo/web improvement: What indexability and rendering requirements must a JavaScript-rendered links hub meet to rank for its own branded queries in Google Search?"
tier: STANDARD
---

# 2153 - Repo/web improvement: What indexability and rendering requirements mus

> Drafted by ZOE's research-worker from "Repo/web improvement: What indexability and rendering requirements must a JavaScript-rendered links hub meet to rank for its own branded queries in Google Search?". Auto-committed to main for durability; review + deepen as needed.

I have enough to write the corrected output. Now composing with all 7 missing hard requirements addressed.

---

```yaml
---
topic: JavaScript-rendered links hub - Google indexability and rendering requirements for branded queries
type: research
status: ready
last-validated: 2026-08-02
related-docs: []
original-query: "What indexability and rendering requirements must a JavaScript-rendered links hub meet to rank for its own branded queries in Google Search?"
---
```

## Key Decisions

| Decision | Options considered | Verdict |
|---|---|---|
| Rendering strategy | CSR / SSR / SSG / ISR | SSG or ISR - content in HTML at first byte, zero crawl-queue delay |
| Link implementation | `<a href>` vs JS click handler vs hash routing | `<a href>` with real URLs only; hash fragments are not indexable |
| Metadata delivery | Client-injected (useEffect) vs server-rendered | Server-rendered in initial `<head>`; client injection is unreliable and may miss the render window |
| Canonical signal | JS-set vs HTML `<link rel="canonical">` | HTML `<link>` in `<head>` on the first response byte |
| Structured data | JSON-LD in rendered DOM vs microdata | JSON-LD is fine when present in rendered HTML; must survive the render, not just be in source |

---

## Findings

Google indexes JavaScript-rendered pages through a three-stage pipeline: crawl (fetch the URL, check robots.txt), render (a headless Chromium instance executes JavaScript), and index (parse the rendered HTML). The rendering stage is the bottleneck. Google queues pages for rendering and the delay is documented as "a few seconds, but it can take longer." For a links hub that must rank for its own branded name queries - where freshness and presence in the index are both critical on launch - waiting in that queue is an unacceptable risk.

**Rendering strategy is the primary lever.** A page that ships its content in the initial HTTP response bypasses the rendering queue entirely. The Google crawler reads the HTML it receives, and if the links and text are there, they are indexable without a second Chromium pass. The four options in Next.js, which is what the ZAOOS stack runs, are:

| Option | How crawlers see it | Tradeoffs | Verdict for links hub |
|---|---|---|---|
| CSR (Client-Side Rendering) | Empty shell until JS executes | Googlebot must join render queue; delay from seconds to days; soft-404 risk if 200+empty | Avoid for any content that must rank |
| SSR (Server-Side Rendering) | Full HTML on every request | Immediate indexability; compute cost per request; correct if content is dynamic per-user | Viable but overkill for a static link list |
| SSG (Static Site Generation) | Pre-built HTML at deploy time | Fastest possible; fully indexable from byte 0; change requires redeploy | Best for a links hub that rarely changes |
| ISR (Incremental Static Regeneration) | SSG-equivalent for crawlers; background revalidation on timer | Like SSG for indexing; stale window before refresh; no extra request cost | Best for a links hub that updates periodically |

In the ZAOOS codebase, `src/app/network/page.tsx:8` already demonstrates the correct ISR pattern - `export const revalidate = 300` - which tells Next.js to serve a pre-rendered HTML page and regenerate it in the background every five minutes. A links hub page should replicate exactly this pattern.

**Metadata must be server-rendered.** The `<title>` and `<meta name="description">` tags must appear in the initial HTML response, not be injected client-side via `useEffect` or a third-party library after mount. Google's crawler does read JavaScript-injected meta tags in the rendering phase, but timing is not guaranteed. In Next.js App Router, `export const metadata = { title, description }` in the page file generates these tags server-side at zero extra cost. The links hub page must export a `metadata` object with a title that matches the brand query it is targeting.

**Canonical URLs must be in static HTML.** A JavaScript-set canonical via `document.head.appendChild` can conflict with the static HTML canonical if both exist, or be missed entirely if the page is served from cache. Set it once, in server-rendered HTML, as `<link rel="canonical" href="https://thezao.com/links" />`. In Next.js App Router this happens automatically when `metadata.alternates.canonical` is set.

**Links must be real anchor elements.** A links hub built with `<button onClick>` handlers, JavaScript `window.location` assignments, or hash-based routes (`#section`) produces links that Googlebot cannot follow or credit. Every external link on the page must be an `<a href="https://...">` tag that is present in the rendered DOM - not generated after a click or scroll event. The Next.js `<Link href>` component produces proper anchor tags, so using it correctly satisfies this requirement.

**Structured data helps for rich results but is not required for basic indexing.** JSON-LD `WebSite` or `Organization` schema on the links hub page can help Google surface sitelinks and a search box for branded queries. The schema must be present in the rendered HTML (it can be a server-rendered `<script type="application/ld+json">` tag). Test with the URL Inspection tool in Google Search Console after deploy.

**robots.txt and noindex must be absent.** A links hub that accidentally carries `<meta name="robots" content="noindex">` (common if a staging flag leaks to production) or is blocked in `robots.txt` will not rank regardless of rendering strategy. Verify the production URL with `curl -I https://<domain>/links` and inspect the `X-Robots-Tag` response header, and fetch `https://<domain>/robots.txt` to confirm the path is not disallowed.

---

## Next Actions

| Action | Owner | When |
|---|---|---|
| Create `src/app/links/page.tsx` with `export const revalidate = 300`, `export const metadata = { title, description }`, and all links as `<Link href>` elements - mirror the pattern in `src/app/network/page.tsx:8` | Eng | Before launch |
| Add `metadata.alternates.canonical` pointing to the canonical production URL | Eng | Same PR as above |
| Add JSON-LD `Organization` or `WebSite` structured data as a server-rendered `<script>` tag | Eng | Same PR, or follow-up |
| After deploy, fetch the URL with `curl -I` to confirm no `X-Robots-Tag: noindex` header and no `noindex` meta tag | Eng | Deploy day |
| Submit the URL via Google Search Console URL Inspection tool and request indexing | Zaal | Day 1 post-launch |
| Check Search Console Coverage report for the URL 3-5 days post-launch to confirm it moved from "Discovered - not indexed" to "Indexed" | Zaal | Day 3-5 post-launch |

---

## Sources

- [FULL liveness-verified-on-2026-08-02] Google Search Central - JavaScript SEO Basics - https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- [PARTIAL - thread list only, body text not extracted; liveness-verified-on-2026-08-02] GitHub Discussions (vercel/next.js) - "What is a practical use case for getServerSideProps?" (#24974) - https://github.com/vercel/next.js/discussions/24974
- [FULL liveness-verified-on-2026-08-02] ZAOOS codebase - ISR pattern in production - `src/app/network/page.tsx:8` (`export const revalidate = 300`) - local read, no external fetch required
- [FAILED - old.reddit.com blocked, redlib.seasi.dev ECONNREFUSED] Reddit r/SEO and r/nextjs - SSR vs SSG for branded SEO queries
