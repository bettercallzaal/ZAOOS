---
topic: governance
type: guide
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: "056, 058, 103, 702, 703"
original-query: "go back through /inbox and all of the agentmail (forwarded items: Hubs Network 'Plural way 16 cities' + 'Hack the Hub')"
tier: STANDARD
---

# 877 - Plurality and the Hubs Network: Deliberative-Democracy Patterns for ZAO Governance

> **Goal:** Map the Plurality movement's deliberative-democracy and hub-building patterns (from two forwarded Hubs Network newsletters) to The ZAO's fractal governance (Respect Game, ORDAO, fractals) and ZABAL Games workshops, and name concrete adoptions.

## Key Decisions - Recommendations First

| # | Recommendation | Why | Priority |
|---|---|---|---|
| 1 | **Pilot a "Hack the Hub" style ZABAL Games residency.** | Commons Hub Austria proved it: a 2-week, 4-hours/day, ~25-person residency created an estimated 18,100-32,600 EUR of value for ~9,380 EUR of hub cost, and converted guests into return hosts. | HIGH |
| 2 | **Position the weekly Respect Game as ZAO's deliberative-democracy tool and document it for non-builders.** | The 16-city Plural finding was that centralized systems cannot solve local problems; bottom-up consensus is demanded. ZAO already runs weekly peer-ranked consensus; the gap is a non-technical onboarding guide. | HIGH |
| 3 | **Build a "Respect Passport" for inter-fractal trust transfer.** | Hubs Network's core bottleneck is vetting strangers; the fix is network-transferable trust (vouched at one hub, trusted at the next). ZAO's many fractals can let Respect holders vouch across fractals. | MEDIUM |
| 4 | **Publish a threat model mapping the 16-city information anxieties to ZAO's on-chain transparency mitigations.** | Positions ZAO as anti-propaganda infrastructure; the on-chain auditable vote trail is the inverse of the "no shared reality" problem the cities named. | MEDIUM |
| 5 | **Reference Plurality.net + RadicalxChange in ZAO public governance materials.** | Credibility: aligns ZAO with academic governance research (Weyl + Tang), not fringe crypto. | LOW |

## Findings

### Plurality (Weyl + Tang, 2024)
"Plurality: The Future of Collaborative Technology and Democracy" (Glen Weyl + Audrey Tang, 2024, released CC0 on GitHub) frames Plurality as harnessing technology to strengthen cooperation across social differences. Weyl founded RadicalxChange and pioneered quadratic voting/funding; Tang built Taiwan's vTaiwan deliberative platform. Core ideas: technology as bridge not divide, democracy and digital innovation as complements, collaborative diversity (harness different perspectives, not erase them).

### The 16-City Plural Event (forwarded "Tackling local challenges in a Plural way")
Same-day gatherings across 16 cities (Barcelona, Brussels, Budapest, Rio de Janeiro, Berlin, Kampala, Rome, Thika, and others) on Deliberative Democracy, Privacy, and Local Challenges, captured via the Dembrane tool. The convergent finding across all 16 cities: a crisis of trust in information sources. Named anxieties included corporate media bias and information overload (Barcelona), loss of a shared reality (Brussels), state propaganda and surveillance harming marginalized groups (Budapest, Rome), short-term attention cycles that democratic systems are not adapted to (Berlin), and civic-knowledge gaps that never reach the grassroots (Kampala). Privacy vs transparency emerged as a contextual trade-off, not a binary: Western Europeans leaned transparency-as-default until safety concerns shifted minds; vulnerable groups treated privacy as a democratic prerequisite. A unanimous secondary insight: representative government alone is insufficient; communities want participatory deliberation and direct local control.

### The "Hack the Hub" Residency (forwarded "Hack the Hub")
Commons Hub Austria (about 1 hour from Vienna) ran a residency model: up to 2 weeks, accommodation and food provided, ~4 hours/day of work on the hub's prioritized task board, a 9am daily standup, participants self-grouping by skill. Work included a sauna assembly, a 40m2 workshop fit-out, garden beds, a hot tub install, and video documentation. Rough economics:

| Side | Estimate |
|------|----------|
| Market-rate value of work delivered | ~18,100 - 32,600 EUR |
| Cost to the hub (accommodation ~55 EUR/night + food ~12 EUR/person/day, ~10 people, 14 days) | ~9,380 EUR |

The steward's core insight (Felix): "The real bottleneck is finding people you can trust." A residency means handing over kitchen keys and tool access; vetting strangers is slow. The fix is inter-hub trust transfer - vouched at one hub, trusted at the next. The model ran twice and is presented as repeatable, with shared residency infrastructure worth building.

### Mapping to ZAO

| Plurality pattern | ZAO implementation | Maturity |
|-------------------|--------------------|----------|
| Democratic peer evaluation / deliberation | Weekly Respect Game: random breakout groups, peer contributions shared, group consensus-ranks (2/3 majority), soulbound Respect minted via ORDAO/OREC on-chain. ZAO uses a 2x Fibonacci scoring curve; reported Gini ~0.23 (high equality). | Live |
| Distributed local chapters | ZAO fractals as self-organizing hubs, each running its own Respect Game; cross-fractal coordination via council process. | Live |
| Trust networks | "Respect Passport" for inter-fractal vouching. | Not built (Rec 3) |
| Transparency vs "no shared reality" | ORDAO proposals and votes are on-chain and auditable; soulbound Respect cannot be bought or data-mined. | Live |

Specific on-chain details (contract addresses, session counts, decay parameters) above are as recorded in docs 056/058/103/703 and should be confirmed against those docs before external use.

## Comparison: Plurality Concept vs ZAO Implementation

| Concept | Plurality definition | ZAO implementation | Reference |
|---------|----------------------|--------------------|-----------|
| Collaborative diversity | Harness differing perspectives across social differences | Respect Game mixes skill sets in random breakout groups | Doc 056 |
| Democratic deliberation | Structured dialogue, consensus over majority | Weekly Respect Game breakouts + consensus ranking | Doc 703 |
| Soulbound reputation | Earned trust, not purchasable | Respect tokens, non-transferable | Doc 058 |
| Fractal scaling | Small groups + delegate chains | Multiple fractals + council for multi-fractal votes | Doc 103 |

## Also See

- [Doc 056 - ORDAO and Respect Game system](../056-ordao-respect-system/)
- [Doc 058 - Respect system deep dive](../058-respect-deep-dive/)
- [Doc 103 - Fractal governance ecosystem](../103-fractal-governance-ecosystem/)
- [Doc 702 - Respect fractal lineage](../702-respect-fractal-lineage/)
- [Doc 703 - ZAO fractal current state (May 2026)](../703-zao-fractal-current-state-may-2026/)
- Plurality.net and RadicalxChange.org (external movement references)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Publish a non-technical Respect Game onboarding guide (text + short video) | @Zaal | Docs/video | 2 weeks |
| Scope a 2-week ZABAL Games "Hack the Hub" residency (15-20 builders); publish cost/value outcomes | @Team | Event | Summer 2026 |
| Build Respect Passport MVP: track Respect across fractals, allow inter-fractal vouching | @Zaal | PR | Q3 2026 |
| Publish threat model: 16-city info anxieties vs ZAO transparency mitigations | @Zaal | Docs | Q2 2026 |

## Sources

- Hubs Network Mag "Tackling local challenges in a Plural way: Same day, 16 cities" (Jun 12, 2026), forwarded to ZOE inbox [FULL - body read from saved inbox JSON: 16 cities, 6 information anxieties, privacy/transparency tension, Dembrane tool]
- Hubs Network Mag "Hack the Hub: What Happens When You Invite People to Build With You" (Jun 11, 2026), forwarded to ZOE inbox [FULL - Commons Hub Austria residency, 2-week model, value vs cost economics, trust-transfer bottleneck]
- [Plurality.net](https://www.plurality.net) [PARTIAL - movement concepts and authorship summarized; book is CC0 on GitHub]
- [RadicalxChange](https://radicalxchange.org) [PARTIAL - foundation mission and Plural Stack]
- ZAO governance docs 056 / 058 / 103 / 702 / 703 (internal) [FULL - verified to exist on disk 2026-06-17; sourced the ZAO mapping]
