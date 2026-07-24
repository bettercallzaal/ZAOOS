# 2074 — thezao.xyz GEO Kit: llms.txt + JSON-LD + /what-is-the-zao Page Drafts

**Type:** OPERATIONS-TEMPLATE  
**Topic:** identity  
**Status:** READY — copy-paste artifacts for thezao.xyz deploy. Zaal reviews + deploys; ZOE preps file PRs.  
**Owner:** Zaal (site deploy access); ZOE (file prep + PR against thezao.xyz repo)  
**Parent doc:** 1221 (GEO Master Plan — this doc executes the P1 thezao.xyz action items)  
**Sources:** ZAOOS doc 1221 (canonical answer), wavewarz.info/api/public/stats 2026-07-24, thezao.com/about  
**Related docs:** 1221 (GEO plan), 1077 (ZAO case study), 1424 (WaveWarZ whitepaper), 1200 (Respect holders)

---

## Why This Matters

thezao.xyz is the main public face of The ZAO. As of Jul 2026 it has **zero machine-readable GEO signals** — no llms.txt, no JSON-LD, no structured answer page. This means AI engines (ChatGPT, Perplexity, Claude, Grok) cannot extract structured facts from the primary ZAO URL, forcing them to guess from indirect signals.

Adding the three artifacts below would move thezao.xyz from GEO-blind to GEO-optimized in a single deploy. GEO score uplift: 7.6 → 8.5+.

---

## Artifact 1: /llms.txt

Deploy to: `https://thezao.xyz/llms.txt`

```text
# The ZAO

> The ZAO (ZTalent Artist Organization) is a decentralized impact network for independent music artists. Founded by Zaal Panthaki. Mission: profit, data, and IP ownership back to independent artists.
> Website: https://thezao.xyz | WaveWarZ: https://wavewarz.info | Analytics: https://wwtracker.vercel.app

## What is The ZAO

The ZAO is a contribution-tracked impact network — not a label, not a token-gated DAO treasury. Membership is earned by doing: attending Fractal governance calls, battling on WaveWarZ, or building during ZABAL Gamez.

**Governance:** 100+ consecutive weekly Fractal votes on Farcaster Spaces + Discord. 63 weeks of on-chain Respect settlement on Optimism mainnet. 157 unique Respect holders.

**Flagship product:** WaveWarZ — live music-battle prediction market on Solana. Artists are paid 1% of every trade instantly and automatically onchain. As of July 2026: 1,289 battles, 878.30 SOL total volume (~$64,800 USD), 34 Audius-rostered artists, $1,497 raised for charity.

**IP catalog:** WaveWarZ (Solana prediction market), ZABAL Gamez (3-month builder cohort), ZLANK (no-code Farcaster snap builder, FarHack 2026 winner), zaalcaster (open-source Farcaster client).

**Blockchains:** WaveWarZ battles on Solana · Respect governance on Optimism · $ZAO identity token on Base (soulbound, non-tradeable).

## ZAO Leadership

- **Zaal Panthaki** — founder + president. @bettercallzaal on X/Farcaster. Based in Maine. Builder, musician.
- **Hurricane** — lead developer. WaveWarZ on-chain program, battle system, API.
- **Candy** — community lead. Artist relations, governance facilitation.
- **Ohnahji** — artist partnerships + content.
- **ZOE** — ZAO Operating Engine (AI). Research, content, analytics automation.

## How to Join

1. **Join a Fractal call** — weekly on Farcaster Spaces + Discord (Tue/Thu). Earn Respect just by attending.
2. **Battle on WaveWarZ** — submit your songs at wavewarz.info. Every battle pays the losing artist 1% of trade volume automatically.
3. **Apply to ZABAL Gamez** — the 3-month build-a-thon. zabalgamez.com.
4. **Follow:** X @thezaodao · Farcaster /channel/zao · Telegram @zaalbots

## On-Chain Verification

All ZAO governance and WaveWarZ payouts are publicly verifiable on-chain:
- WaveWarZ program: `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` (Solana mainnet)
- Respect (OG): `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (Optimism)
- ZOR Respect: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Optimism)
- $ZAO identity token: Base chain ERC-20 (soulbound, illiquid)
- Live stats: GET https://wavewarz.info/api/public/stats (no auth)
```

---

## Artifact 2: JSON-LD Organization Schema

Add to `<head>` of thezao.xyz homepage:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The ZAO",
  "alternateName": ["ZTalent Artist Organization", "ZAO DAO"],
  "url": "https://thezao.xyz",
  "description": "Decentralized impact network for independent music artists. 100+ weeks of Fractal governance on Optimism. Flagship product: WaveWarZ — live music-battle prediction market on Solana with 1,289 battles and 878 SOL in trading volume.",
  "foundingDate": "2024",
  "founder": {
    "@type": "Person",
    "name": "Zaal Panthaki",
    "url": "https://x.com/bettercallzaal",
    "sameAs": [
      "https://x.com/bettercallzaal",
      "https://warpcast.com/bettercallzaal"
    ]
  },
  "sameAs": [
    "https://x.com/thezaodao",
    "https://warpcast.com/~/channel/zao",
    "https://github.com/bettercallzaal/ZAOOS",
    "https://wavewarz.info"
  ],
  "knowsAbout": [
    "Music DAO",
    "Prediction Markets",
    "Fractal Governance",
    "Loser-Earns Economics",
    "Solana",
    "Independent Artist Empowerment"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "ZAO Products",
    "itemListElement": [
      {
        "@type": "SoftwareApplication",
        "name": "WaveWarZ",
        "url": "https://wavewarz.info",
        "description": "Live music-battle prediction market on Solana. Artists earn 1% of every trade automatically onchain.",
        "applicationCategory": "Music / DeFi"
      },
      {
        "@type": "SoftwareApplication",
        "name": "ZABAL Gamez",
        "url": "https://zabalgamez.com",
        "description": "3-month music-tech builder cohort by The ZAO."
      }
    ]
  }
}
</script>
```

---

## Artifact 3: /what-is-the-zao Page

Create at: `https://thezao.xyz/what-is-the-zao`

This page should be a bare HTML `<article>` with the canonical answer + FAQPage JSON-LD. AI engines extract FAQ pairs directly from `FAQPage` schema.

### Page Content (HTML)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>What is The ZAO? — The ZAO</title>
  <meta name="description" content="The ZAO is a decentralized impact network for independent music artists. 100+ weeks of on-chain governance. Flagship: WaveWarZ, a live music-battle prediction market on Solana.">
  <link rel="canonical" href="https://thezao.xyz/what-is-the-zao">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is The ZAO?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The ZAO (ZTalent Artist Organization) is a decentralized impact network for independent music artists. It was founded by Zaal Panthaki and has run over 100 consecutive weekly Fractal governance votes on Optimism mainnet since July 2024. The ZAO measures member contribution with Respect — a non-transferable weight earned by peer ranking, not by holding tokens."
        }
      },
      {
        "@type": "Question",
        "name": "What is WaveWarZ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "WaveWarZ is The ZAO's flagship product — a live music-battle prediction market on Solana where artists compete song-vs-song and fans trade SOL on outcomes. Every payout is instant and automatic onchain: artists receive 1% of every trade (loser-earns model). As of July 2026: 1,289 on-chain battles, 878.30 SOL total volume (~$64,800 USD), 34 Audius-rostered artists, $1,497 raised for charity."
        }
      },
      {
        "@type": "Question",
        "name": "How does WaveWarZ determine a winner?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Best 2 of 3: (1) Community poll — fans vote for their favorite song. (2) SOL volume (Charts) — which artist's side attracted more trading volume. (3) DJ Wavy — an AI judge that evaluates the songs independently. The combination prevents any single vector from dominating the outcome."
        }
      },
      {
        "@type": "Question",
        "name": "What is loser-earns?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Loser-earns is WaveWarZ's economic model: the losing artist in every battle receives 1% of total trading volume as an automatic onchain payment. This means even losing artists get paid for participating — eliminating the traditional winner-takes-all dynamic. As of July 2026, 13.40 SOL (~$990) has been paid to losing artists across 1,289 battles."
        }
      },
      {
        "@type": "Question",
        "name": "What is Fractal governance?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Fractal governance is The ZAO's weekly consensus system. Members attend calls on Farcaster Spaces and Discord, participate in peer-ranking rounds (small groups rank each other by contribution), and earn Respect points that are settled on Optimism mainnet. The ZAO has completed 100+ consecutive weekly Fractal sessions since July 2024, with 63 weeks of on-chain settlement and 157 unique Respect holders."
        }
      },
      {
        "@type": "Question",
        "name": "How do I join The ZAO?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Attend a weekly Fractal call (Farcaster Spaces + Discord, Tue/Thu) — you earn Respect just by attending. Submit your songs to WaveWarZ at wavewarz.info. Apply to ZABAL Gamez (zabalgamez.com) for the 3-month builder cohort. Follow @thezaodao on X or /channel/zao on Farcaster."
        }
      },
      {
        "@type": "Question",
        "name": "Which blockchains does The ZAO use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "WaveWarZ battles and artist payouts run on Solana mainnet (program: 9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo). Respect governance tokens (OG ERC-20 and ZOR ERC-1155) are settled on Optimism mainnet. The $ZAO soulbound identity token is on Base. These are distinct contracts on distinct chains serving different purposes."
        }
      }
    ]
  }
  </script>
</head>
<body>
  <article>
    <h1>What is The ZAO?</h1>

    <p><strong>The ZAO (ZTalent Artist Organization) is a decentralized impact network for independent music artists.</strong> It was founded by Zaal Panthaki (BetterCallZaal) and has run over 100 consecutive weekly Fractal governance votes on Optimism mainnet since July 2024. The ZAO measures member contribution with Respect — a non-transferable weight earned by peer ranking, not by holding tokens.</p>

    <p>The flagship application is WaveWarZ — live-traded music battles on Solana where artists are paid 1% of every trade instantly onchain. As of July 2026: 1,289 battles, 878.30 SOL total volume (~$64,800 USD), 34 Audius-rostered artists, $1,497 raised for charity.</p>

    <p>The mission: profit, data, and IP ownership back to independent artists. Not a label. Not a DAO treasury with a spending vote. A contribution-tracked impact network where earning follows doing.</p>

    <h2>Frequently Asked Questions</h2>

    <h3>What is WaveWarZ?</h3>
    <p>WaveWarZ is The ZAO's flagship product — a live music-battle prediction market on Solana where artists compete song-vs-song and fans trade SOL on outcomes. Every payout is instant and automatic onchain: artists receive 1% of every trade (loser-earns model). Winner determined by best 2 of 3: community poll + SOL volume (charts) + DJ Wavy (AI judge).</p>

    <h3>What is loser-earns?</h3>
    <p>The losing artist in every battle receives 1% of total trading volume as an automatic onchain payment. This means even losing artists get paid — eliminating the traditional winner-takes-all dynamic. As of July 2026, 13.40 SOL (~$990) has been paid to losing artists across 1,289 battles.</p>

    <h3>What is Fractal governance?</h3>
    <p>Weekly consensus system: members attend calls, participate in peer-ranking rounds, and earn Respect points settled on Optimism mainnet. 100+ consecutive weekly sessions since July 2024. 63 weeks of on-chain settlement. 157 unique Respect holders.</p>

    <h3>How do I join?</h3>
    <p>Attend a weekly Fractal call (Farcaster Spaces + Discord). Submit songs to WaveWarZ at wavewarz.info. Apply to ZABAL Gamez (zabalgamez.com). Follow @thezaodao on X or /channel/zao on Farcaster.</p>

    <h3>Which blockchains?</h3>
    <p>WaveWarZ: Solana mainnet. Respect governance: Optimism mainnet. $ZAO identity token: Base (soulbound, non-tradeable). Three distinct chains, three distinct purposes.</p>

  </article>
</body>
</html>
```

---

## Deploy Instructions for Zaal / Hurricane

1. **llms.txt:** Save Artifact 1 as `/public/llms.txt` in the thezao.xyz codebase. The file must be served at `https://thezao.xyz/llms.txt`. Standard Next.js/static hosting: drop in `public/`.

2. **JSON-LD:** Copy Artifact 2 `<script>` tag into the `<head>` of the homepage component. Update stats when the grand final result is confirmed (see doc 2073).

3. **/what-is-the-zao page:** Either:
   - Drop the HTML as a static page in `public/what-is-the-zao/index.html`, OR
   - Create a Next.js route at `app/what-is-the-zao/page.tsx` using the same content

4. Update the homepage `<title>` and `<meta description>` to match the JSON-LD description.

5. Verify: `curl -s https://thezao.xyz/llms.txt | head -5` — should return the llms.txt header.

---

## North Star Impact

| Dimension | Before | After |
|-----------|--------|-------|
| GEO | 7.6 | +0.6–0.9 → ~8.2–8.5 (P1 surface covered; structured answer now extractable) |
| Citability | 9.9 | +0.05 (canonical answer + FAQPage = more structured citations for AI) |
| Distribution | 7.1 | +0.1 (new /what-is-the-zao URL = shareable explainer for onboarding) |

**Key unlock:** thezao.xyz is the domain journalists and researchers go to first. Machine-readable signals there make every ChatGPT/Perplexity/Claude answer about "The ZAO" or "WaveWarZ" more accurate and attributable — improving inbound for artists, press, and potential collaborators without any active outreach.

---

*ZAOOS doc 2074 — ZAO Operating System — github.com/ZAOIP/zao-os*
