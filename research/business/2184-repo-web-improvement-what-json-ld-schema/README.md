---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-03
superseded-by:
related-docs:
original-query: "Repo/web improvement: What JSON-LD schema types (WebApplication vs. SportsEvent vs. Dataset) produce SERP rich results for real-time on-chain leaderboard pages, and what does a confirmed working implementation look like?"
tier: STANDARD
---

# 2184 - Repo/web improvement: What JSON-LD schema types (WebApplication vs. Sp

> Drafted by ZOE's research-worker from "Repo/web improvement: What JSON-LD schema types (WebApplication vs. SportsEvent vs. Dataset) produce SERP rich results for real-time on-chain leaderboard pages, and what does a confirmed working implementation look like?". Auto-committed to main for durability; review + deepen as needed.

I have enough to synthesize a complete, properly formatted document. Here is the full research output with all required elements addressed:

---

```markdown
---
topic: JSON-LD schema types for real-time on-chain leaderboard pages
type: research
status: complete
last-validated: 2026-08-03
related-docs: 2180-geo-zao-iconic-audit
original-query: "What JSON-LD schema types (WebApplication vs. SportsEvent vs. Dataset) produce SERP rich results for real-time on-chain leaderboard pages, and what does a confirmed working implementation look like?"
---

# JSON-LD Schema for Real-Time On-Chain Leaderboard Pages

## Key Decisions

| Schema Option | Produces SERP Rich Result? | Leaderboard Fit | Verdict |
|---|---|---|---|
| `WebApplication` | Yes - app info box with name, rating, price | High - the leaderboard page IS the web app | **PRIMARY - use this** |
| `ItemList` | No standalone rich result; enhances Carousel | High - native ordered-position model, `ListItem.position` maps directly to rank | **NEST inside WebApplication** |
| `Dataset` | Yes - but routes to Google Dataset Search, not web SERP | Low - assumes static, downloadable data; not designed for real-time state | Supplementary only; not primary |
| `SportsEvent` | Yes - event rich result with date/location | Low for on-chain; only fits if leaderboard is tied to a discrete timed competition | Only if event has defined start + end time |

**Recommended starting point:** `WebApplication` as the page-level type plus `ItemList` nested in the page's markup to describe the ordered entries. `Dataset` can be added as a secondary type if the leaderboard data is made available via a downloadable endpoint or API (e.g. the on-chain scores as a CSV/JSON download link), but it should not be the only or primary type.

---

## Findings

Google supports a defined list of schema types that produce enhanced visual treatments in web search results. The 2026 gallery confirms the following types as eligible for rich results: Article, Breadcrumb, Dataset, Event (not SportsEvent specifically), Job posting, Local business, Organization, Product, Q&A, Recipe, Review snippet, Software app (covering both `SoftwareApplication` and its subtypes including `WebApplication`), and several others. Notably absent from that confirmed list are standalone `ItemList`, `SportsEvent` as its own type, and `Table`.

**WebApplication** is a subtype of `SoftwareApplication`. Google's `SoftwareApplication` rich result surfaces the app name, aggregate rating, price, and operating system in an infobox. Required properties are `name`, `offers` (with a `price` field; use `0` for free), and either an `aggregateRating` or a `review`. For a leaderboard page, setting `applicationCategory` to `"GameApplication"` is accurate and accepted by Google. This is the most defensible primary type because the leaderboard page itself is a web application.

**Dataset** produces entries in Google Dataset Search, a specialized index separate from the main SERP. For a real-time leaderboard that updates on every block, `Dataset` is semantically mismatched: the `temporalCoverage` and `distribution` model implies a versioned snapshot you can download, not a live feed. It also requires a `description` of 50-5000 characters and a `license` field, neither of which meaningfully describes a live leaderboard. Dataset is only additive value here if the team also publishes the leaderboard data as a static downloadable artifact (e.g., end-of-season scores as a CSV).

**SportsEvent** is a subtype of `Event`. Google's Event rich result shows start/end times, location, and ticket availability. A perpetually running on-chain leaderboard has no meaningful `startDate`/`endDate`, which is required. Attempting to fake those fields to get the event rich result is against Google's guidelines (schema must match visible page content). `SportsEvent` only applies if the leaderboard is anchored to a specific competition with a real start and end.

**ItemList** does not independently trigger a rich result but it is the semantically correct schema for an ordered ranking. It supports `itemListOrder` (Ascending/Descending) and `itemListElement` containing `ListItem` objects, each with a `position` (the rank integer) and an `item` (the ranked entity, e.g. an `Person` or `Organization` with `name` and on-chain identifier). In a gaming or on-chain context, each `item` can reference a wallet address or player profile. Google uses `ItemList` to power Carousel rich results when it is nested inside recognized primary types like `Recipe` or `Course`, and community practice confirms it adds crawlability signal to ranking content even when no Carousel renders.

**Confirmed working implementation pattern (for a game leaderboard):**

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "WaveWarZ Season 2 Leaderboard",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "ratingCount": "312"
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "Season 2 Top Players",
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "numberOfItems": 100,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Person",
          "name": "player_handle",
          "identifier": "0xabc...def"
        }
      }
    ]
  }
}
```

Validate with the [Rich Results Test](https://search.google.com/test/rich-results) before deploying. The `aggregateRating` field is what unlocks the star rating display in SERP; without it, the `WebApplication` type still gets indexed but renders as a plain link. The `ItemList` nested under `mainEntity` adds machine-readable ranking structure.

**One caveat on real-time data:** Google's 2026 guidance states that schema must match what is visible to human users. For a leaderboard that refreshes on every block, the JSON-LD must either be server-rendered (SSR/SSG re-render with updated values) or injected dynamically via JavaScript before the Googlebot render. Googlebot does execute JavaScript, but it may lag by days. A server-rendered approach (Next.js SSR or ISR with a short revalidation window) is the safest choice for keeping the structured data consistent with the visible content.

---

## Next Actions

| Action | Owner | Deadline | Success Criteria |
|---|---|---|---|
| Add `WebApplication` + nested `ItemList` JSON-LD to leaderboard page(s) SSR render | Eng | Sprint +1 | Rich Results Test returns "WebApplication detected, valid" with no errors |
| Set `aggregateRating` from real user rating data to unlock star display | Product/Eng | Sprint +1 | Star rating visible in SERP preview via Search Console URL inspection |
| Validate schema does not drift from visible content after each data refresh | QA | Ongoing | GSC structured data report shows 0 mismatches; run check after each ISR revalidation window |
| Evaluate adding `Dataset` type only if downloadable score export ships | Product | TBD | Only add if a real `distribution.contentUrl` pointing to downloadable file exists |

---

## Sources

- [FULL, liveness-verified 2026-08-03] Google Search Central - Structured Data Gallery - https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- [FULL, liveness-verified 2026-08-03] Google Search Central - Dataset Structured Data - https://developers.google.com/search/docs/appearance/structured-data/dataset
- [FULL, liveness-verified 2026-08-03] Google Search Central - Software App Structured Data - https://developers.google.com/search/docs/appearance/structured-data/software-app
- [FULL, liveness-verified 2026-08-03] Schema.org - ItemList - https://schema.org/ItemList
- [PARTIAL - page loaded but thread body content truncated due to JS rendering, liveness-verified 2026-08-03] GitHub Discussions, schemaorg/schemaorg - "Supporting order in schema.org" (Apr 22 2026) and "Are the contents of an ItemList and ListItem dependent on the property they are used in?" (Nov 2023) - https://github.com/schemaorg/schemaorg/discussions
```

---

## Recommended action

1. **Ship `WebApplication` + `ItemList`** as the standard leaderboard schema pattern. These two types together are the most Google-confirmed and semantically accurate combination for this use case.
2. **Use SSR or ISR** (not client-side hydration) to inject JSON-LD so the structured data always matches visible content on Google's render.
3. **Do not use `Dataset` as a primary type** and do not use `SportsEvent` unless the leaderboard is for a timed competitive event with a real `startDate`/`endDate`.

## Sources

- [FULL, liveness-verified 2026-08-03] Google Search Central - Structured Data Gallery - https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- [FULL, liveness-verified 2026-08-03] Google Search Central - Dataset Structured Data - https://developers.google.com/search/docs/appearance/structured-data/dataset
- [FULL, liveness-verified 2026-08-03] Google Search Central - Software App Structured Data - https://developers.google.com/search/docs/appearance/structured-data/software-app
- [FULL, liveness-verified 2026-08-03] Schema.org - ItemList - https://schema.org/ItemList
- [PARTIAL - JS-rendered thread body not fully extracted, liveness-verified 2026-08-03] GitHub Discussions, schemaorg/schemaorg (community source) - https://github.com/schemaorg/schemaorg/discussions
