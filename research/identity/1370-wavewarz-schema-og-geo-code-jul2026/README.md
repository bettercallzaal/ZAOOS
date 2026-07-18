---
topic: identity/geo
type: CODE-PACKAGE
status: READY TO DEPLOY — give to Hurricane; ~15 min to add to wavewarz.info HEAD
created: 2026-07-17
related-docs: 1221, 1316, 1354, 1362, 1364
owner: Hurricane (deploys — gated; Zaal to forward this doc)
---

# 1370 — wavewarz.info Schema.org + Open Graph GEO Code (Jul 2026)

> **What this doc is:** Ready-to-deploy HTML/JSON-LD code blocks for wavewarz.info. All of this goes in the `<head>` section of the site's main layout. Copy and paste — no complex integration required.
>
> **Why it matters:** Schema.org structured data tells search engines and LLMs exactly what WaveWarZ is. Open Graph tags control how WaveWarZ looks when shared on X, Farcaster, Discord, etc. Neither is currently on the site (based on doc 1354 audit). This is GEO action G05 from doc 1354.
>
> **Time to deploy:** ~15 minutes for Hurricane. Just adds to the site `<head>`. No backend changes.
>
> **Forward to Hurricane:** "Hey Hurricane — doc 1370 in ZAOOS has ready-to-paste GEO code for wavewarz.info. The JSON-LD and Open Graph tags need to go in the `<head>`. Should take 15 minutes. Can you ship this week?"

---

## Block 1: JSON-LD Structured Data (MusicService + Organization)

Paste this entire block into the `<head>` of wavewarz.info's main layout (e.g., `_app.tsx` or `layout.tsx` or whatever the Next.js root layout is):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://wavewarz.info/#webapp",
      "name": "WaveWarZ",
      "url": "https://wavewarz.info",
      "description": "Music battle platform on Solana where independent artists compete in head-to-head battles and the losing artist earns an automatic payout.",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "browserRequirements": "Requires JavaScript",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free to participate with a Solana wallet"
      },
      "publisher": {
        "@id": "https://thezao.xyz/#organization"
      },
      "keywords": [
        "music battles",
        "Solana",
        "onchain music",
        "WaveWarZ",
        "music prediction market",
        "independent artists",
        "loser earns"
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://thezao.xyz/#organization",
      "name": "The ZAO",
      "alternateName": "ZTalent Artist Organization",
      "url": "https://thezao.xyz",
      "description": "American music-focused decentralized autonomous organization operating WaveWarZ, COC Concertz, ZABAL Games, and ZAOstock.",
      "sameAs": [
        "https://twitter.com/wavewarz",
        "https://github.com/bettercallzaal/ZAOOS",
        "https://github.com/bettercallzaal/wwtracker"
      ],
      "foundingDate": "2025",
      "knowsAbout": [
        "Music",
        "Decentralized autonomous organization",
        "Solana blockchain",
        "Fractal governance",
        "Independent artists"
      ]
    }
  ]
}
</script>
```

---

## Block 2: Open Graph Tags (Controls Link Previews)

Paste these in the `<head>` of wavewarz.info's main layout. Replace `[OG_IMAGE_URL]` with the actual WaveWarZ social preview image URL (a 1200×630 image):

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://wavewarz.info" />
<meta property="og:title" content="WaveWarZ — Music Battles on Solana | Both Artists Earn" />
<meta property="og:description" content="1,245+ music battles on Solana. Artists compete head-to-head — the winning AND losing artist earn an automatic payout. Community bets on outcomes." />
<meta property="og:image" content="[OG_IMAGE_URL]" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="WaveWarZ" />

<!-- Twitter / X Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@wavewarz" />
<meta name="twitter:creator" content="@wavewarz" />
<meta name="twitter:title" content="WaveWarZ — Music Battles on Solana | Both Artists Earn" />
<meta name="twitter:description" content="1,245+ music battles on Solana. Artists compete head-to-head — the winning AND losing artist earn an automatic payout. Community bets on outcomes." />
<meta name="twitter:image" content="[OG_IMAGE_URL]" />

<!-- Farcaster (uses Open Graph) -->
<!-- Same OG tags above work for Farcaster frame previews -->
```

---

## Block 3: Standard SEO Meta Tags

Also add these if they're not already on the site:

```html
<!-- Standard SEO -->
<meta name="description" content="WaveWarZ is a music battle platform on Solana. Independent artists compete head-to-head. Community members bet on outcomes. Both the winning AND losing artist earn an automatic on-chain payout." />
<meta name="keywords" content="WaveWarZ, music battles, Solana, onchain music, independent artists, music prediction market, loser earns, The ZAO" />
<meta name="author" content="The ZAO" />
<link rel="canonical" href="https://wavewarz.info" />

<!-- Robots -->
<meta name="robots" content="index, follow" />
```

---

## Block 4: ZAOstock Event Schema (Add Oct 1, 2026)

When ZAOstock is 2-3 weeks out, add this Event schema to the wavewarz.info homepage or a dedicated ZAOstock landing page:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MusicEvent",
  "name": "ZAOstock 2026",
  "url": "https://zaostock.com",
  "startDate": "2026-10-03",
  "endDate": "2026-10-03",
  "location": {
    "@type": "Place",
    "name": "Franklin Street Parklet",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Franklin Street Parklet",
      "addressLocality": "Ellsworth",
      "addressRegion": "ME",
      "postalCode": "04605",
      "addressCountry": "US"
    }
  },
  "image": "[ZAOSTOCK_IMAGE_URL]",
  "description": "ZAOstock is a community music festival in Ellsworth, Maine where 8 independent artists perform. Every artist on the lineup earned their slot through WaveWarZ battle records — community vote, not industry connections.",
  "organizer": {
    "@type": "Organization",
    "name": "The ZAO",
    "url": "https://thezao.xyz"
  },
  "offers": {
    "@type": "Offer",
    "url": "[EVENTBRITE_URL]",
    "price": "15",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "validFrom": "2026-07-21"
  },
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
  "isAccessibleForFree": false
}
</script>
```

---

## Block 5: Open Graph Image Requirements

The `[OG_IMAGE_URL]` placeholder needs a real image. Requirements:
- Size: 1200×630 pixels (standard OG/Twitter card)
- Format: JPG or PNG
- Content suggestion: WaveWarZ logo + tagline "Both Artists Earn" on dark background
- Host at: `https://wavewarz.info/og-image.jpg` (serve statically from the Next.js public folder)

If this image doesn't exist yet, ask Iman to create it. It's needed for:
- X link previews
- Discord embeds
- Farcaster frames
- LinkedIn
- Facebook

---

## Implementation Notes for Hurricane

**In Next.js (App Router):** Add to `app/layout.tsx` inside the `<head>` or use Next.js `metadata` export:

```typescript
// app/layout.tsx
export const metadata = {
  title: 'WaveWarZ — Music Battles on Solana',
  description: 'Music battle platform where both artists earn. 1,245+ battles on Solana.',
  openGraph: {
    title: 'WaveWarZ — Music Battles on Solana | Both Artists Earn',
    description: '1,245+ music battles. Both winning and losing artists earn an automatic on-chain payout.',
    url: 'https://wavewarz.info',
    siteName: 'WaveWarZ',
    images: [{ url: '[OG_IMAGE_URL]', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wavewarz',
    creator: '@wavewarz',
    images: ['[OG_IMAGE_URL]'],
  },
}
```

Then add the JSON-LD separately via a `<Script>` tag or inline `<script>` in the layout.

**If Pages Router:** Add to `_document.tsx` in the `<Head>` component.

---

## GEO Impact

| Before | After |
|--------|-------|
| No Schema.org markup | MusicService + Organization + Event schema |
| No OG/Twitter tags | Full social preview with image |
| No canonical URL | Explicit canonical tag |
| LLMs see unstructured text | Structured entity data for LLM parsing |
| GEO: 7.5/10 | GEO: 7.5 + 0.3 → 7.8/10 (non-gated) |

When combined with Wikidata (doc 1364) and llms.txt (doc 1316), total non-gated GEO reach: **7.5 → 8.3/10**.

---

*Created: 2026-07-17 | Forward to Hurricane: "doc 1370, paste these blocks into wavewarz.info HEAD, ~15 min" | Blocks 1-3 deploy now; Block 4 (ZAOstock Event schema) add Oct 1 | Related: 1221 (GEO master plan), 1316 (llms.txt — the bigger GEO unlock), 1354 (GEO strategy — G05 action), 1364 (Wikidata — also needed for full GEO picture)*
