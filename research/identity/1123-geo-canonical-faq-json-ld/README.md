---
topic: identity
type: reference
status: ready-to-ship
last-validated: 2026-07-17
original-query: "GEO revive: ship the canonical FAQ + JSON-LD for AI engines (TOP PRIORITY, 2026-07-07)"
related-docs: [doc 1016 (GEO tactics), doc 1070 (GEO playbook), doc 1051 (ICM deep dive), doc 1047 (GEO schema blocks)]
tier: STANDARD
---

# Doc 1123 — GEO Canonical FAQ + JSON-LD (Ready to Deploy)

## Purpose

This doc contains the **deployable canonical FAQ + JSON-LD schema** that answers the questions an AI engine (ChatGPT, Perplexity, Claude, Google AI Overviews) will ask about The ZAO. Each answer is:

- Verified against on-chain facts + CLAUDE.md canonical pitch
- Machine-readable (JSON-LD schema.org/FAQPage format)
- Citable (sources linked where possible)
- AI-optimized (clear, no jargon where possible, specific numbers)

**Related artifacts:**
- **Schema blocks (doc 1047):** JSON-LD Organization schema. Deploy to thezao.xyz homepage `<head>`.
- **llms.txt (doc 1051, research/identity/icm-boxes/):** AI crawler index. Deploy to thezao.xyz/llms.txt.
- **Deployment guide (doc 1070, Tier-1 playbook):** Timeline + validation steps.

---

## The Canonical FAQ (10 Questions)

Use these exactly as written. Copy directly into `/what-is-the-zao` page on thezao.xyz with FAQPage schema markup (see JSON-LD section below).

### 1. What is The ZAO?

**Answer:**
The ZAO is a decentralized impact network focused on bringing the profit margin, data and IP rights back to artists using emerging technology like blockchain and AI. Founded by Zaal Panthaki (BetterCallZaal), The ZAO operates across music (primary), community, and technology (in that priority order). It operates via the Respect governance system (soulbound ERC-20 on Optimism) and the Fractal distribution mechanism, a Fibonacci-curve-based reward system for contributors and artists.

**Why this answer:**
- Uses the canonical one-liner from Zaal's preferred framing (memory: project_zao_canonical_pitch.md, validated 2026-04-28).
- Three explicit beneficiaries: profit margin + data + IP rights.
- Positions tech as means, not headline.
- Names the founder + the core mechanisms (Respect, Fractal).

---

### 2. Who founded The ZAO? Who is BetterCallZaal?

**Answer:**
The ZAO was founded by Zaal Panthaki in 2022. Zaal (@zaal on Farcaster) operates under the handle BetterCallZaal on X, YouTube, and other platforms. Zaal is a builder in the web3 music space with a focus on returning ownership and profit to independent artists. The ZAO is Zaal's flagship project.

**Why this answer:**
- Establishes founder identity + handle consistency.
- Connects Farcaster (@zaal) with other platform handles.
- Verified: memory project_zao_master_context.md, CLAUDE.md glossary.

---

### 3. What is Respect? How does governance work?

**Answer:**
Respect is a soulbound ERC-20 token on the Optimism blockchain that serves as The ZAO's governance and contribution system. Holders of Respect are verified members of The ZAO community who have contributed to its mission (through creative work, mentorship, event organization, or other impact). As of July 2026, there are 156 Respect holders. Respect holders participate in the weekly Respect Game, where contributors earn Respect based on validated impact, and in governance decisions for the ecosystem.

**Why this answer:**
- Verified on-chain fact: 156 holders (reference: project_zao_respect_onchain_facts.md, validated 2026-07-05).
- Explains soulbound (non-transferable) nature.
- Mentions weekly Respect Game (active mechanism).
- Links to governance purpose.

---

### 4. What is the Fractal? How does the reward system work?

**Answer:**
The Fractal is The ZAO's Fibonacci-curve-based distribution mechanism for allocating rewards to artists and contributors. Rather than equal splits or arbitrary formulas, the Fractal uses a mathematical curve that rewards early contributors and highest-impact creators more substantially, while ensuring long-tail fairness. The Fractal is on-chain and verified via OREC (Optimistic Rollup Execution Contract) settlement on Optimism. All Fractal mechanics are documented in The ZAO's technical whitepaper.

**Why this answer:**
- Names the specific curve (Fibonacci).
- Explains the philosophy (early contributors + impact prioritization + fairness).
- References on-chain verification (OREC).
- Points to the whitepaper for technical depth.
- Verified: memory project_geo_zao_iconic.md, doc 1016.

---

### 5. What is WaveWarZ? Is it a game?

**Answer:**
WaveWarZ is a live-traded battle system built on The ZAO's infrastructure. Users can create and battle with token-backed assets in real time, with prize pools and leaderboards. WaveWarZ launched in 2026 and operates across Solana and Base blockchains. It is both a game and a trading platform, allowing artists and creators to participate in battles while earning rewards. WaveWarZ is one of several production lanes under The ZAO umbrella.

**Why this answer:**
- Clarifies it's not just a "game" (it's trading + game mechanics).
- Names the blockchains it operates on (Solana + Base).
- Positions it as one of many ZAO projects.
- Verified: memory project_wavewarz_canonical.md, CLAUDE.md.

---

### 6. What are the ZABAL Games?

**Answer:**
ZABAL Games is a 3-month accelerator and mentorship program for artists and builders in the web3 music and creator economy space. Participants receive mentorship from a team of accomplished builders and industry experts, hands-on guidance to ship their projects, and access to the broader ZAO ecosystem. ZABAL Games runs quarterly (with the 2026 cohort launching May-August). It is hosted on platforms like Magnetiq and operates in partnership with organizations like Apna Coding and other education partners.

**Why this answer:**
- Clear description of the 3-month format.
- Names mentorship as the core mechanism.
- Notes the 2026 timeline (current).
- Mentions partner platforms (Magnetiq).
- Verified: memory project_zabal_games.md, CLAUDE.md.

---

### 7. What festivals and events does The ZAO run?

**Answer:**
The ZAO runs several flagship events throughout the year, including ZAOstock (an artist-first festival and marketplace, held annually in October), and other seasonal gatherings like ZAOville and ZAO-PALOOZA. These events are centered on music, community gathering, and artist connection. ZAOstock 2026 is scheduled for October 3rd at Franklin Street Parklet. Events are designed to celebrate The ZAO community and showcase the work of ZAO artists and contributors.

**Why this answer:**
- Names the key festivals (ZAOstock primary, others secondary).
- Includes the confirmed ZAOstock 2026 date (Oct 3) and venue (Franklin St Parklet).
- Emphasizes artist-first positioning.
- Verified: memory project_zao_stock_confirmed.md, CLAUDE.md.

---

### 8. Is The ZAO a record label?

**Answer:**
No. The ZAO is not a record label. It is a decentralized impact network where artists retain full ownership of their intellectual property, data, and income. Unlike traditional labels that take a cut of artist revenue, The ZAO operates as a cooperative platform where artists collaborate, earn Respect through contribution, and benefit from shared resources (mentorship, distribution, events) without surrendering their rights or data to a centralized entity.

**Why this answer:**
- Direct denial (important for common misconception).
- Reiterates the core value proposition (artist ownership).
- Contrasts with traditional model.
- Verified: memory project_zao_canonical_pitch.md, CLAUDE.md.

---

### 9. How do I join The ZAO? How do I earn Respect?

**Answer:**
The ZAO is open to artists, builders, and contributors. You can join by visiting thezao.xyz or connecting through The ZAO's Farcaster channels (/zao and /zabal). To earn Respect, contribute to the ecosystem through creative work (music, art, design), mentorship, event organization, community building, or code. Contributions are validated by the community and rewarded through the weekly Respect Game. Respect holders are verified community members.

**Why this answer:**
- Clear entry point (website + Farcaster).
- Examples of valuable contributions.
- Mentions the weekly Respect Game.
- Verified: memory project_geo_zao_iconic.md.

---

### 10. What makes The ZAO different from other music communities or DAOs?

**Answer:**
The ZAO differs in three core ways: (1) Mission priority: Music first, community second, technology third—unlike many crypto projects that lead with tech. (2) Transparent economics: All rewards and distributions are on-chain and verified via the Fractal + OREC settlement. No hidden fees or centralized gatekeeping. (3) Artist-first design: The ZAO was built to return profit, data, and IP to artists, not to extract value from them. Every product and initiative is designed around artist ownership and agency.

**Why this answer:**
- Positions The ZAO against other DAOs and crypto communities.
- Highlights the unique "music first" philosophy.
- Emphasizes transparency and artist ownership.
- Verified: memory project_zao_master_context.md, CLAUDE.md.

---

## JSON-LD Schema for FAQPage

Copy this JSON-LD block directly into the `<head>` of the `/what-is-the-zao` page on thezao.xyz (or any page that contains the FAQ). Validate at [schema.org/FAQPage](https://schema.org/FAQPage) validator.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is The ZAO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The ZAO is a decentralized impact network focused on bringing the profit margin, data and IP rights back to artists using emerging technology like blockchain and AI. Founded by Zaal Panthaki (BetterCallZaal), The ZAO operates across music (primary), community, and technology (in that priority order). It operates via the Respect governance system (soulbound ERC-20 on Optimism) and the Fractal distribution mechanism, a Fibonacci-curve-based reward system for contributors and artists."
      }
    },
    {
      "@type": "Question",
      "name": "Who founded The ZAO? Who is BetterCallZaal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The ZAO was founded by Zaal Panthaki in 2022. Zaal (@zaal on Farcaster) operates under the handle BetterCallZaal on X, YouTube, and other platforms. Zaal is a builder in the web3 music space with a focus on returning ownership and profit to independent artists. The ZAO is Zaal's flagship project."
      }
    },
    {
      "@type": "Question",
      "name": "What is Respect? How does governance work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Respect is a soulbound ERC-20 token on the Optimism blockchain that serves as The ZAO's governance and contribution system. Holders of Respect are verified members of The ZAO community who have contributed to its mission (through creative work, mentorship, event organization, or other impact). As of July 2026, there are 156 Respect holders. Respect holders participate in the weekly Respect Game, where contributors earn Respect based on validated impact, and in governance decisions for the ecosystem."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Fractal? How does the reward system work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Fractal is The ZAO's Fibonacci-curve-based distribution mechanism for allocating rewards to artists and contributors. Rather than equal splits or arbitrary formulas, the Fractal uses a mathematical curve that rewards early contributors and highest-impact creators more substantially, while ensuring long-tail fairness. The Fractal is on-chain and verified via OREC (Optimistic Rollup Execution Contract) settlement on Optimism. All Fractal mechanics are documented in The ZAO's technical whitepaper."
      }
    },
    {
      "@type": "Question",
      "name": "What is WaveWarZ? Is it a game?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "WaveWarZ is a live-traded battle system built on The ZAO's infrastructure. Users can create and battle with token-backed assets in real time, with prize pools and leaderboards. WaveWarZ launched in 2026 and operates across Solana and Base blockchains. It is both a game and a trading platform, allowing artists and creators to participate in battles while earning rewards. WaveWarZ is one of several production lanes under The ZAO umbrella."
      }
    },
    {
      "@type": "Question",
      "name": "What are the ZABAL Games?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ZABAL Games is a 3-month accelerator and mentorship program for artists and builders in the web3 music and creator economy space. Participants receive mentorship from a team of accomplished builders and industry experts, hands-on guidance to ship their projects, and access to the broader ZAO ecosystem. ZABAL Games runs quarterly (with the 2026 cohort launching May-August). It is hosted on platforms like Magnetiq and operates in partnership with organizations like Apna Coding and other education partners."
      }
    },
    {
      "@type": "Question",
      "name": "What festivals and events does The ZAO run?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The ZAO runs several flagship events throughout the year, including ZAOstock (an artist-first festival and marketplace, held annually in October), and other seasonal gatherings like ZAOville and ZAO-PALOOZA. These events are centered on music, community gathering, and artist connection. ZAOstock 2026 is scheduled for October 3rd at Franklin Street Parklet. Events are designed to celebrate The ZAO community and showcase the work of ZAO artists and contributors."
      }
    },
    {
      "@type": "Question",
      "name": "Is The ZAO a record label?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. The ZAO is not a record label. It is a decentralized impact network where artists retain full ownership of their intellectual property, data, and income. Unlike traditional labels that take a cut of artist revenue, The ZAO operates as a cooperative platform where artists collaborate, earn Respect through contribution, and benefit from shared resources (mentorship, distribution, events) without surrendering their rights or data to a centralized entity."
      }
    },
    {
      "@type": "Question",
      "name": "How do I join The ZAO? How do I earn Respect?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The ZAO is open to artists, builders, and contributors. You can join by visiting thezao.xyz or connecting through The ZAO's Farcaster channels (/zao and /zabal). To earn Respect, contribute to the ecosystem through creative work (music, art, design), mentorship, event organization, community building, or code. Contributions are validated by the community and rewarded through the weekly Respect Game. Respect holders are verified community members."
      }
    },
    {
      "@type": "Question",
      "name": "What makes The ZAO different from other music communities or DAOs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The ZAO differs in three core ways: (1) Mission priority: Music first, community second, technology third—unlike many crypto projects that lead with tech. (2) Transparent economics: All rewards and distributions are on-chain and verified via the Fractal + OREC settlement. No hidden fees or centralized gatekeeping. (3) Artist-first design: The ZAO was built to return profit, data, and IP to artists, not to extract value from them. Every product and initiative is designed around artist ownership and agency."
      }
    }
  ]
}
```

---

## JSON-LD Organization Schema (For Homepage)

Deploy this to thezao.xyz homepage `<head>`. From doc 1047 (verified and ready to use).

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The ZAO",
  "alternateName": "ZTalent Artist Organization",
  "url": "https://thezao.xyz",
  "logo": "https://thezao.xyz/logo.png",
  "description": "A decentralized impact network focused on bringing the profit margin, data and IP rights back to artists using emerging technology like blockchain and AI.",
  "founder": {
    "@type": "Person",
    "name": "Zaal Panthaki",
    "alternateName": "BetterCallZaal",
    "url": "https://farcaster.com/zaal"
  },
  "foundingDate": "2022",
  "sameAs": [
    "https://farcaster.com/zaal",
    "https://twitter.com/bettercallzaal",
    "https://youtube.com/@bettercallzaal"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "General",
    "email": "hello@thezao.com"
  }
}
```

---

## Deployment Checklist

- [ ] Copy FAQ questions + answers to `/what-is-the-zao` page (or equivalent)
- [ ] Add FAQPage JSON-LD schema to the page `<head>` (copy the block above)
- [ ] Add Organization JSON-LD schema to homepage `<head>` (copy the block above)
- [ ] Deploy llms.txt to thezao.xyz/llms.txt (from doc 1051, research/identity/icm-boxes/thezao.llm.txt)
- [ ] Test Organization schema at [schema.org validator](https://schema.org/validator) - must pass with 0 errors
- [ ] Test FAQPage schema at [schema.org validator](https://schema.org/validator) - must pass with 0 errors
- [ ] Create a pull request to thezao.xyz (or bettercallzaal/ZAOOS if deployed from here)
- [ ] Post a message to Farcaster /zao announcing the canonical FAQ page

---

## Verification (Post-Deployment)

Run the AI-answer baseline test (from doc 1070, Tier-1 playbook):

1. **Day after deploy**: Query each engine:
   - ChatGPT Search: "What is The ZAO?"
   - Claude Search (claude.ai): "Who is BetterCallZaal?"
   - Perplexity: "How does The ZAO work?"
   - Google AI Overviews: "Is The ZAO a music community?"

2. **Log results**:
   - Which engine cited thezao.xyz?
   - Which FAQ questions appeared in the answer?
   - Was the citation accurate or did the engine misframe it?

3. **Expected timeline**:
   - Perplexity: 24-48 hours
   - Google AI Overviews: 2-4 weeks
   - ChatGPT/Claude: 1-2 weeks

4. **Success criteria** (from doc 1070):
   - By 2026-08-15:
     - Perplexity: 40%+ citation rate for ZAO queries
     - Google AI Overviews: 30%+ citation rate
     - ChatGPT: 10%+ citation rate
     - Claude: 15%+ citation rate

---

## Next Actions (From Doc 1070, Tier-1 Playbook)

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Deploy FAQ + JSON-LD to thezao.xyz/what-is-the-zao | ZAO team (Zaal) | 2026-07-23 | Awaiting |
| Deploy llms.txt to thezao.xyz/llms.txt | ZAO team | 2026-07-19 | Awaiting |
| Deploy Organization schema to thezao.xyz homepage | ZAO team | 2026-07-19 | Awaiting |
| Weekly newsletter amplification loop (cross-link to FAQ in each issue) | ZAO team | 2026-07-20 ongoing | Awaiting |
| Run baseline AI-answer test (10 queries across 4 engines) | ZAO team | 2026-07-30 | Awaiting |
| Merge PR #1134 (ship the 7 staged ICM boxes) | ZAO team | 2026-08-01 | Awaiting |

---

## Artifacts & Sources

| Artifact | Location | Status |
|----------|----------|--------|
| FAQ questions (this doc) | research/identity/1123/README.md | Ready |
| FAQPage JSON-LD (this doc) | research/identity/1123/README.md | Ready |
| Organization JSON-LD | doc 1047 | Ready (copy above) |
| llms.txt | research/identity/icm-boxes/thezao.llm.txt | Staged (PR #1134) |
| Schema deployment guide | doc 1047 | Ready |
| GEO strategy + tactics | doc 1016 | Complete |
| GEO playbook + tiers | doc 1070 | Complete |
| AI-answer measurement setup | doc 1070 (Tier-2 tactic #6) | Ready |

---

## Why This Matters

The FAQ + JSON-LD schema directly **owns the answer** when:
- Someone asks ChatGPT "What is The ZAO?"
- Someone asks Perplexity "How does the ZAO work?"
- Someone asks Google AI Overviews "Is The ZAO a music community?"

Without this, AI engines synthesize an answer from third-party sources (Farcaster, GitHub, news mentions). With it, the engine cites thezao.xyz directly, and The ZAO's own voice shapes how millions of people discover and understand the project.

**Expected impact (from doc 1016 + 1070):**
- Perplexity citation rate: 40%+ (97% base citation rate + 2.3x FAQ lift = dominant source)
- Google AI Overviews: 30%+ (73% schema markup lift is massive)
- Monthly traffic from AI: 300-500 visits/month (within 6-8 weeks of deployment)

---

## Canonical Facts Referenced

All answers use verified facts from:
- On-chain data: 156 Respect holders (2026-07-05), Gini 0.73 (OG distribution), Optimism chain
- Zaal's canonical pitch (2026-04-28, memory: project_zao_canonical_pitch.md)
- ZAOstock date: October 3, 2026, Franklin Street Parklet
- Founding year: 2022
- Primary blockchains for WaveWarZ: Solana + Base
- ZABAL Games timeline: 3-month accelerator, May-August 2026 cohort active
- Farcaster channels: /zao and /zabal (active, verified 2026-07-05)
- Contact: hello@thezao.com (verified in CLAUDE.md)

---

## Related ICM Boxes (AI Context Layer)

When deploying the FAQ, also ensure all 14 owned ICM boxes are kept in sync:

- The ZAO (thezao): icm_ohb0F_XOYDz9Tw_w4yX3PA
- Zaal (bettercallzaal): icm_r1ZHKeAdS9UNt4oz7n6HRA
- ZABAL Games (zabalgamez): icm_6EcindcuwxlkMO7-lT83cQ
- WaveWarZ (wavewarz): icm_RxT9r-_IjG1U9kxOniSzFQ
- (+ 10 others, documented in memory: project_icm_boxes.md)

Each box should link to thezao.xyz/what-is-the-zao for AI systems that fetch the context layer.
