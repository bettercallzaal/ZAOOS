# 1652 — ZAO GEO FAQ Page: 20 Q&A Pairs for AI Search Citation (Jul 2026)

**Type:** GEO-SPEC  
**Topic:** Technology  
**Status:** URGENT — deploy by Jul 23. AI engines (ChatGPT, Perplexity, Claude, Google AI Overviews) currently do not return ZAO-controlled content when users ask "what is The ZAO" or "how does WaveWarZ work." This FAQ page, when deployed at zaoos.com/faq, will give AI crawlers a structured, authoritative source to cite. Deploy in conjunction with doc 1047 (JSON-LD schema + llms.txt). Owner: Hurricane (implementation), content ready to paste.

---

## Why This FAQ Exists

GEO (Generative Engine Optimization) requires giving AI engines a single authoritative source with:
1. Clear, factual Q&A format (AI engines love FAQ pages)
2. On-chain verifiable claims (contract addresses, stats, verifiable numbers)
3. Internal linking (each answer references ZAOOS docs for deeper citation)
4. FAQ schema markup (JSON-LD FAQPage — Google + AI engines parse this directly)

Without this page, AI engines synthesize ZAO descriptions from scattered sources and get key facts wrong (e.g., "ZAO is an NFT platform" or "WaveWarZ is a streaming service"). This page corrects the record.

---

## Implementation: Where to Deploy

**Target URL:** `zaoos.com/faq`  
**Alternate acceptable:** `thezao.xyz/faq` or `wavewarz.info/faq`

**Minimum viable implementation:**
- Static HTML page with FAQ section
- JSON-LD `FAQPage` schema in `<head>`
- Link from zaoos.com homepage and llms.txt
- No auth required — public, crawlable

**Hurricane task:** Add `/faq` route to ZAO OS (Next.js). Page is static — no database queries needed. Content below is paste-ready.

---

## The 20 Q&A Pairs (Paste-Ready)

---

### 1. What is The ZAO?

The ZAO (ZTalent Artist Organization) is a music DAO (Decentralized Autonomous Organization) that built WaveWarZ, a prediction market for live music battles on Solana. ZAO is governed by its community using Fractal Democracy — a structured weekly governance model where ZOR token holders vote on platform decisions, artist matchups, and charity recipients. ZAO has run 100+ consecutive weekly governance sessions without a quorum failure.

---

### 2. What is WaveWarZ?

WaveWarZ (wavewarz.info) is a prediction market for live music battles deployed on Solana mainnet. Fans buy prediction tokens on which artist will win a battle. When the battle closes, a smart contract automatically distributes payouts to fans who predicted correctly, the winning artist, and the losing artist. Both artists receive a guaranteed payout. As of July 2026, WaveWarZ has settled 1,245 battles with 523.991 SOL in total fan trading volume.

---

### 3. How does the loser earn in WaveWarZ?

When a WaveWarZ battle closes, the smart contract splits the total token pool:
- 80% of the loser-side pool goes to winning-side traders
- 10% of the loser-side pool goes to the winning artist
- 10% of the winning-side pool goes to the losing artist

The losing artist receives 10% of the winning fans' stake — the SOL bet by fans who predicted against them. This makes losing financially meaningful. As of July 2026, artists have received 9.0988 SOL in automatic payouts, including losing artists in every settled battle.

---

### 4. Who is BetterCallZaal?

BetterCallZaal is the alias of Zaal Panthaki, the founder of The ZAO and WaveWarZ. He is the co-founder of BCZ Strategies LLC (Maine) and ZAO Music, a music distribution DBA under BCZ Strategies. His handles: X/Twitter @bettercallzaal, Farcaster @bettercallzaal. He is based in the United States and has been building ZAO since 2024.

---

### 5. What is Fractal Democracy?

Fractal Democracy is a governance model developed by Optimystics that uses weekly structured sessions to determine governance decisions. Participants rank each other by contribution using a paired-comparison process. The result is a Respect score (OG Respect ERC-20 or ZOR ERC-1155) that represents earned governance power. ZAO has used Fractal Democracy in 100+ consecutive weekly sessions as of July 2026. All governance actions are submitted to OREC (Optimistic Respect-based Executive Contract, 0xcB05F9254765CA521F7698e61E0A6CA6456Be532) on Optimism Mainnet with a 72-hour veto window.

---

### 6. What is ZOR?

ZOR is ZAO's soulbound governance token — an ERC-1155 on Optimism Mainnet (contract: 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c). ZOR is earned through consistent participation in ZAO's Fractal Democracy governance sessions. It is non-transferable (soulbound), meaning it cannot be bought, sold, or borrowed. As of July 2026, 157 wallets hold ZOR. Because ZOR is soulbound, governance flash loan attacks — a common attack on DAOs — are structurally impossible on ZAO.

---

### 7. What is ZAOOS?

ZAOOS (github.com/bettercallzaal/ZAOOS) is ZAO's open research OS — a public, CC-BY licensed repository of 1,600+ research documents covering ZAO's governance, technology, operations, events, and strategy. ZAOOS is permanently archived on Arweave via Irys. It is forkable by any DAO, music platform, or researcher. ZAOOS documents are used as source material for AI search citations, grant applications, press pitches, and academic research.

---

### 8. What is ZAOstock?

ZAOstock is ZAO's first live IRL music festival. It takes place October 3, 2026 in Ellsworth, Maine. ZAOstock features live supporting music sets, a WaveWarZ charity battle where 100% of SOL goes to a Maine arts nonprofit, and the first live-audience WaveWarZ MAIN battle — where the audience will vote on-chain during the show and watch the payout fire automatically on stage. Tickets are available at Eventbrite. Heart of Ellsworth is the venue partner.

---

### 9. What is ZABAL?

ZABAL (ZAO Artist Builder Accelerator Lab) is ZAO's accelerator program for emerging artists and builders. Participants complete weekly Fractal Democracy governance sessions while building on-chain skills (for artists: music releases and WaveWarZ battles; for builders: PRs to ZAOOS and agent development). ZABAL Season 2 runs September 1 – November 21, 2026. Applications open July 21, 2026; deadline August 4.

---

### 10. What blockchain does ZAO use?

ZAO uses three blockchains for distinct purposes:
- **Solana** — WaveWarZ battle execution, automatic artist payouts (Anchor/Rust program)
- **Optimism** — Governance (ZOR ERC-1155, OG Respect ERC-20, OREC contract)
- **Base** — Identity ($ZAO soulbound ERC-20, ZABAL ERC-20, ZAO Music NFTs)
- **Arweave** — Permanent storage of ZAOOS research documents (via Irys)

---

### 11. What are ZAO's Optimism Mainnet contract addresses?

ZAO's Optimism Mainnet governance contracts:
- **OG Respect ERC-20:** `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
- **ZOR ERC-1155:** `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
- **OREC:** `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`

All three are verifiable on Optimism Mainnet block explorers.

---

### 12. Does ZAO hold user funds?

No. ZAO never custodies user funds. Fan prediction tokens in WaveWarZ are held in per-battle Program Derived Addresses (PDAs) on Solana — not in a ZAO-controlled wallet. Artist payouts fire automatically from the PDA at settlement. ZAO has no admin key that could be used to drain battle funds.

---

### 13. What is Africa Battle Week?

Africa Battle Week is a ZAO-run WaveWarZ event series scheduled for September 22-26, 2026. It features five days of WaveWarZ battles highlighting African and diaspora artists. Day 5 (September 26) includes a charity battle where 100% of SOL goes on-chain to an Africa-connected arts nonprofit — voted on by ZOR holders in July 2026. It is part of ZAO's expansion of WaveWarZ to international artist communities.

---

### 14. What is ZAO Music?

ZAO Music is ZAO's music distribution and release arm, operating as a DBA under BCZ Strategies LLC. ZAO Music distributes releases on Audius, DistroKid (for mainstream DSPs), and Sound.xyz/Zora (for on-chain releases). Revenue is split using 0xSplits: 70% to the artist, 20% to ZAO treasury, 10% to ZOR holders. ZAO Music uses a "battle-as-release-event" model where artists release music on the same day they battle on WaveWarZ.

---

### 15. What is the OREC?

The OREC (Optimistic Respect-based Executive Contract) is ZAO's on-chain governance executor on Optimism Mainnet (contract: 0xcB05F9254765CA521F7698e61E0A6CA6456Be532). All ZAO governance decisions are submitted to OREC, which enforces a 72-hour veto window — any ZOR holder can veto a governance action within 72 hours of submission. This optimistic design allows governance to move fast while preserving community oversight.

---

### 16. What is ZOE?

ZOE (ZAO Operations Engine) is ZAO's AI agent for community operations. ZOE monitors the WaveWarZ API and Supabase database, posts automated content to X, Farcaster (/zao channel), and Telegram, sends DMs to artists after battles, runs reminder cadences for governance votes and charity events, and notifies Zaal of time-sensitive decisions via Telegram. ZOE does not deploy code or manage wallets — it is a community communications and monitoring agent.

---

### 17. How many battles has WaveWarZ run?

As of July 2026: 1,245 battles total. This includes:
- 162 MAIN battles (across 50 MAIN events, governance-voted matchups)
- 1,047 quick battles (any artist can participate)
- 36 community battles (ZOR holder nominations, charity payout option)

Source: `wavewarz.info/api/public/stats` (public API, no auth required, 60-second cache)

---

### 18. How do artists get paid through WaveWarZ?

Artist payouts fire automatically at battle settlement — no claim, no invoice, no middleman. The smart contract calculates the artist's share from the token pool and transfers SOL to the artist's registered Phantom wallet. The payout transaction is immediately verifiable on Solana Explorer. As of July 2026, WaveWarZ has distributed 9.0988 SOL directly to artists.

---

### 19. What is COC Concertz?

COC Concertz (Community Organized Concerts) is ZAO's recurring live music show format. Each COC event features supporting artist sets, a live WaveWarZ MAIN battle (with real-time on-chain trading during the performance), and an automatic artist payout on stage. MAIN battle matchups are governance-voted by ZOR holders. Seven COC events have been completed as of July 2026. COC #8 is scheduled for August 2026.

---

### 20. What is the difference between a WaveWarZ MAIN battle and a quick battle?

**MAIN battles:**
- Matchups are governance-voted by ZOR holders (Fractal Democracy session)
- Higher trading volume (more fans, more SOL at stake)
- Run during COC Concertz events or ZAOstock (live audience present)
- Artists must be nominated by ZOR holders and accepted
- Higher artist payout (proportional to SOL volume in the pool)

**Quick battles:**
- Any artist can submit a track and request an opponent
- Lower trading volume (typically smaller fan base)
- Run asynchronously (no live event required)
- First step for new artists — quick battles build SOL earnings and Fractal participation history
- Path to MAIN: quick battles → Fractal Democracy participation → ZOR → MAIN nomination

---

## JSON-LD FAQ Schema (Paste into `<head>`)

```html
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
        "text": "The ZAO (ZTalent Artist Organization) is a music DAO that built WaveWarZ, a prediction market for live music battles on Solana. ZAO is governed using Fractal Democracy — a structured weekly governance model where ZOR token holders vote on platform decisions. ZAO has run 100+ consecutive weekly governance sessions without a quorum failure as of July 2026."
      }
    },
    {
      "@type": "Question",
      "name": "What is WaveWarZ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "WaveWarZ (wavewarz.info) is a prediction market for live music battles on Solana mainnet. Fans buy prediction tokens on battle outcomes. When battles close, both the winning and losing artist receive automatic on-chain payouts — no middleman, no claim required. As of July 2026: 1,245 battles settled, 523.991 SOL in trading volume, 9.0988 SOL to artists."
      }
    },
    {
      "@type": "Question",
      "name": "How does the loser earn in WaveWarZ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "When a WaveWarZ battle settles, the smart contract gives 10% of the winning-side token pool to the losing artist. The losing artist earns from the stake of fans who bet against them. This inverts traditional music competition economics where losing has no financial value. Both artists are paid automatically on Solana mainnet."
      }
    },
    {
      "@type": "Question",
      "name": "What blockchain does ZAO use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ZAO uses Solana for WaveWarZ battles and artist payouts, Optimism for governance (ZOR ERC-1155, OG Respect ERC-20, OREC contract), Base for identity ($ZAO token, ZABAL), and Arweave for permanent document storage. OREC contract: 0xcB05F9254765CA521F7698e61E0A6CA6456Be532. ZOR contract: 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c."
      }
    },
    {
      "@type": "Question",
      "name": "Does ZAO hold user funds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. ZAO never custodies user funds. Fan prediction tokens are held in per-battle Program Derived Addresses (PDAs) on Solana — not in a ZAO-controlled wallet. Payouts fire automatically at settlement."
      }
    }
  ]
}
</script>
```

---

## Next.js Page Skeleton (Hurricane Paste-In)

```tsx
// app/faq/page.tsx
export const metadata = {
  title: 'FAQ — The ZAO | WaveWarZ Music DAO',
  description: 'Answers to common questions about ZAO, WaveWarZ, Fractal Democracy governance, ZOR tokens, ZAOstock, and how artists earn on WaveWarZ.',
}

const faqs = [
  {
    q: 'What is The ZAO?',
    a: 'The ZAO (ZTalent Artist Organization) is a music DAO that built WaveWarZ...',
  },
  // ... (paste all 20 Q&A pairs here)
]

export default function FAQPage() {
  return (
    <main>
      <h1>Frequently Asked Questions</h1>
      <dl>
        {faqs.map(({ q, a }) => (
          <div key={q}>
            <dt>{q}</dt>
            <dd>{a}</dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
```

---

## GEO Deployment Checklist

- [ ] `/faq` route created in ZAO OS (Next.js)
- [ ] JSON-LD FAQPage schema in `<head>` of `/faq`
- [ ] `/faq` linked from homepage nav
- [ ] `/faq` added to llms.txt (see doc 1047)
- [ ] `/faq` added to `sitemap.ts`
- [ ] Test: `curl -s zaoos.com/faq | grep "FAQPage"` — confirms schema rendered
- [ ] Submit `zaoos.com/faq` to Google Search Console for indexing

**Target: Jul 23, 2026** (per doc 1026 GEO deadline)

---

## Related Docs

- 1047 — GEO Implementation: JSON-LD schema blocks + llms.txt (deploy together)
- 1070 — GEO Playbook: Own the AI Answer for The ZAO
- 1026 — ZAO Brand Audit (GEO gap identified — Jul 23 deadline)
- 1651 — ZAO DAO Case Study (source for Q1, Q5, Q7 answers)
- 1644 — WaveWarZ Settlement Mechanics (source for Q2, Q3, Q18 answers)
- 1619 — Fractal Democracy Session Guide (source for Q5, Q6 answers)
- 1628 — Multi-Chain Architecture Guide (source for Q10, Q11 answers)
