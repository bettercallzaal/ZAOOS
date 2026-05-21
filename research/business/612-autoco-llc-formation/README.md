---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-20
original-query: "Should ZAO Festivals form via AutoCo or traditional LLC services? What are the tradeoffs? (reconstructed)"
related-docs: 609, 611
tier: STANDARD
---

# 612 - AutoCo + LLC formation options for ZAO Festivals

> **Goal:** Decide ZAO Festivals legal entity setup before pitch deck week (May 14-19). Slide 3 of investor deck claims "ZAO Festivals LLC, in formation via AutoCo." This doc verifies whether AutoCo is the right path or if we say "in formation" with a different vehicle.

## Key Decisions

| # | Decision | Status |
|---|---|---|
| 1 | ZAO Festivals needs its own legal entity (LLC or similar) before taking outside investment | LOCKED - per Rav call May 6 |
| 2 | Vehicle: AutoCo (US LLC, on-chain compatible) OR traditional Stripe Atlas / LegalZoom / Clerky | DECISION needed by May 14 |
| 3 | Holding structure: ZAO Festivals LLC = umbrella, sub-entities for ZAO Stock / Chella / Palooza if needed | DEFERRED - revisit Year 3 |
| 4 | Fiscal sponsorship architecture stays as-is: NMC + Fractured Atlas for tax-deductible donations. LLC is for investor capital + commercial revenue | LOCKED - per FailOften 2026-05-07 |

## Context (from Rav call May 6, transcribed in research doc 609 + earlier session notes)

Zaal mentioned during the Rav call:
> "I have an interview coming up in the next little bit, with this company called AutoCo, and it is basically creating, um, entities in the United States, um, that are technically also on chain, but as a master of their company, so it's like instant. Um, but then you can also... They recently dropped a way that you could do it through the full paperwork and like do a full LLC on your own."

Rav's response was supportive of getting the legal structure formalized so he could introduce investors. He flagged that the minimum bar is "a really compelling business case" - so the vehicle matters less than the deck story. AutoCo is one of several options.

## Three viable paths

### Option A - AutoCo (on-chain LLC)

**What it is:** AutoCo (autoco.law or similar - the exact product Zaal referenced) creates US LLCs that are also represented on-chain. Fast formation, traditional legal validity, plus on-chain mirror for crypto-native investor signing or token-based equity mechanics.

**Pros:**
- Aligned with The ZAO ecosystem (some investors will care that it is on-chain compatible)
- Often faster than traditional incorporation
- Crypto-native investor signing pattern works out-of-the-box
- The "agentic commerce + on-chain proofs" thesis Rav is working on aligns

**Cons:**
- Newer category - less battle-tested than Stripe Atlas / LegalZoom
- Some traditional / non-crypto investors may not understand the on-chain wrapper
- Depending on how AutoCo handles bank accounts + tax filings, could create operational friction
- Requires Zaal to do due diligence on the specific provider before locking in

**Cost estimate:** TBD - likely $500-$2,000 for formation + state filing fees. Annual maintenance ~$200-$500.

### Option B - Traditional Delaware LLC via Stripe Atlas / Clerky / LegalZoom

**What it is:** Standard Delaware LLC, formed through a service provider that handles state filing, EIN, operating agreement, and bank account setup.

**Pros:**
- Most battle-tested path for US startups
- Traditional investors recognize and trust the structure
- Stripe Atlas in particular has world-class founder support
- Easy banking + payment processor integration
- Founders already familiar with this pattern

**Cons:**
- Slower than on-chain options (weeks vs days)
- No on-chain wrapper - if we want token-based equity later, need a separate vehicle
- Less aligned with the ZAO ecosystem ethos

**Cost estimate:** Stripe Atlas $500 one-time + $300 annual Delaware franchise tax. Clerky ~$500 first year. LegalZoom $300-$700.

### Option C - "In formation" - defer the actual filing

**What it is:** Deck slide says "ZAO Festivals LLC, in formation" without committing to a specific vehicle. Zaal commits to incorporate before any investor signs a term sheet (~30-60 days post-handshake).

**Pros:**
- Removes blocker for deck shipping May 14-19
- Buys time to do proper due diligence on AutoCo + alternatives
- Most LLC formations are fast enough to complete during due diligence anyway
- Investors expect this for very early-stage projects

**Cons:**
- Looks less prepared than already-formed
- Could create timing friction during a hot lead

## Recommendation for the deck

**For deck v1 shipping May 19:** Use **Option C** - "ZAO Festivals LLC, in formation." Removes blocker.

**Decision deadline for actual incorporation:** End of May 2026 / before first signed investor term sheet.

**Recommended actual path:** **Option A (AutoCo)** if due diligence checks out, otherwise **Option B (Stripe Atlas / Clerky)** as the proven fallback. Decide after Zaal's intro interview with AutoCo.

## What slide 3 of the investor deck should say

Current draft (per doc 611 + earlier deck outline):
> "ZAO Festivals = community-owned festival production. Artists discovered in The ZAO. Festival operates at break-even. Investors get equity in the umbrella entity (ZAO Festivals LLC, in formation via AutoCo)."

**Recommended edit:** drop the "via AutoCo" specifier until decided. Replace with:
> "Investors get equity in the umbrella entity (ZAO Festivals LLC, in formation; incorporated under Delaware or equivalent before term sheet signing)."

This keeps the slide honest, removes a vendor name we have not committed to, and signals to sophisticated investors that we know the standard incorporation path.

## What needs to happen before May 14 (deck day 1)

1. **Zaal completes the AutoCo intro interview** - find out specifics on cost, timeline, banking, tax compliance
2. **3-way meeting: Zaal + FailOften + Rav** - lock the entity decision and sub-entity / fiscal sponsor relationship
3. **Decide between A / B / C** based on what comes out of the AutoCo interview + the 3-way meeting
4. **If A or B: kick off filing immediately** so we can update slide 3 from "in formation" to "formed in [state] [month]" before deck v1 ships
5. **If C: confirm slide 3 wording stays "in formation"** and add to back-pocket due-diligence packet

## Action Bridge

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Complete AutoCo intro interview | Zaal | call | This week |
| 3-way meeting: Zaal + FailOften + Rav | Zaal | calendar | Mon May 12 |
| Final entity decision (A / B / C) | Zaal + FailOften | decision | Tue May 13 |
| If A or B: file formation paperwork | Zaal | legal | Wed May 14 onward |
| Update deck slide 3 with final wording | Zaal | deck edit | May 14 (deck day 1) |
| Document final entity in research doc 612 | Future session | doc update | After incorporation |

## Open questions for the AutoCo interview

1. What states do they support for LLC formation (Delaware, Wyoming, etc)?
2. Total cost: formation + state filing + annual maintenance + on-chain wrapper?
3. How long does formation take end-to-end?
4. Banking: do they have integrated bank account setup, or do we go to Mercury / Brex separately?
5. Tax compliance: do they handle annual filings, or is that on us?
6. On-chain wrapper specifics: which chain (Base, Ethereum, etc), what does "on-chain LLC" actually mean operationally, can we sign cap-table entries on-chain?
7. Equity tooling: do they offer cap-table management, or do we go to Pulley / Carta separately?
8. Investor experience: have they done deals with traditional VCs as well as crypto-native funds?
9. Sub-entity support: if ZAO Festivals LLC is the umbrella and we want sub-entities for ZAOstock / Chella / Palooza, can they handle that or do we file separately?
10. Fiscal sponsor compatibility: does the LLC structure conflict with NMC + Fractured Atlas administering charitable funds for specific initiatives?

## Also See

- [Doc 609](../../events/609-zaostock-cobuild-six-circles-may4/) - May 4 cobuild
- [Doc 611](../611-zaostock-brand-patterns-rsvpizza-iykyk/) - brand audit + entry pages
- [memory: project_zao_fiscal_sponsor.md](/Users/zaalpanthaki/.claude/projects/-Users-zaalpanthaki-Documents-zaostock/memory/project_zao_fiscal_sponsor.md) - NMC + Fractured Atlas + ENTERACT structure

## Sources

- Rav call transcript (May 6) - captured in earlier session memory_notes
- Stripe Atlas docs: https://stripe.com/atlas (verified 2026-05-07)
- Clerky: https://www.clerky.com (verified 2026-05-07)
- AutoCo - exact product to be confirmed during Zaal's intro interview this week
- FailOften 2026-05-07 fiscal sponsor structure correction
