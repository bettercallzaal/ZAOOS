# The ZAO Whitepaper - Design Spec

> Design for ZAO's flagship documents (the "magnum opus"). Product of a brainstorm on 2026-07-02, grounded in research docs 718 (foundations) + 942 (reconciled outline) and David Ehrlichman's *Impact Networks*. This spec defines WHAT the documents are and HOW they are structured. It does not draft chapter prose - that follows in the implementation plan.

## 1. What we are building

Three living, versioned, on-chain documents:

1. **The ZAO Whitepaper** - the vision, the story, how it works in plain words, and the open-source agentic future a member steps into. Simple enough anyone can read and share it.
2. **The Technical Whitepaper** - the full mechanism: Respect math, the Fibonacci curve, OREC/contracts, security, and the decay/monetary-policy proposal (doc 941) in depth. For the governance world, builders, and agents.
3. **The Manifesto** - the short, signable creed. Signing it means minting a Hats Protocol hat: proof of alignment and gated entry.

The whitepaper explains, the technical whitepaper proves, the manifesto asks you to commit.

## 2. Governing decisions (locked in the brainstorm)

| # | Decision | Answer |
|---|----------|--------|
| Audience | Who it's for | All three layers (members / gov world / partners), optimized for **new and returning members** understanding the vision and how to align in the open-source agentic world. |
| Identity | What ZAO is | A **decentralized impact network** (emulating Ehrlichman's *Impact Networks* model). |
| Spine | The one line | **The ZAO strives to return as close to 100% as possible of profit, data, and IP rights to independent artists, and takes no fees from what they make.** |
| Villain | What we're against | **Gatekeeping** - of profit, power, potential, and knowledge. ZAO opens all four gates. |
| Voice | Register | Simple, quotable, shareable. Manifesto energy but always readable. Jargon defined or avoided. |
| Form | Structure | Three docs (above). The manifesto is signed via a Hats hat = gated entry. |
| Math | Placement | Its own Technical Whitepaper. The main doc stays plain. |
| Core structure | The "how it works" spine | The **Five Cs** of impact networks (Clarify, Convene, Cultivate trust, Coordinate, Collaborate), with the **Fractal as the governance engine inside "Coordinate"** - kept central and prominent. |
| Tokens | How presented | **Lead with Respect** (soulbound merit, not money, cannot be bought/sold). Tradeable tokens (ZAO/ZABAL) minimal in the main doc; detail lives in the technical doc. |
| Agents | Their role | Agents are **not members and cannot earn Respect - only humans can**. Agents provide resources + distribution. The mission is impossible without the enabling triad: **agents + blockchain + open-source tooling**. |
| Sustainability | How ZAO survives | Tools/services + events/festivals + grants/partners + donations. Honest current truth: runs on **donated time, energy, and capital** - Zaal carries most of the capital today; self-sustaining is the goal, not the current state. |
| Living/on-chain | Doc lifecycle | Versioned with a visible changelog; all three published to the permaweb (ArDrive/Arweave). The doc's history is the governance record. |
| Immutable core | What can never change | **Mission + creed are immutable.** All mechanics (decay, thresholds, lanes, tooling) are the living layer, changed by vote with logged history. Values fixed, methods flexible. |
| Decay stance | No-decay reality vs doc 941 | Main doc states today's truth plainly (Respect accumulates, no decay yet); if 941 is adopted it is a logged version bump. Technical doc carries the full proposal. |

## 3. The creed (the manifesto's five lines)

The manifesto distills to five commitments a member signs:

1. **I contribute** - time, energy, or capital. Everyone brings something; no free riders.
2. **I build in the open** - I share my work and help others build.
3. **I honor creator ownership** - creators own their profit, data, and IP; I take no one's cut.
4. **I govern by contribution** - standing comes from what I contribute, not what I hold, and I show up to the Fractal.
5. **I believe in the gift** - everyone has one gift the world needs, and given the right resources, we can bring it out in every human.

Line 5 is the north star. Lines 1-4 are the covenant. The manifesto is immutable once ratified; a future major revision would be a new version requiring re-signing (a new hat).

## 4. The impact-network framing (from *Impact Networks*)

The book gives ZAO a proven vocabulary and structure to emulate, rather than inventing one:

- **Cultivate, not build** - impact networks are gardens, not machines. You create conditions for emergence. (ZAO's real history: COC Concertz, Juke, POIDH all emerged from members, not a top-down plan.)
- **Networks move at the speed of trust** - relationships are the whole game.
- **Ego-system to eco-system** - the mindset shift from "grow my org" to "scale our impact." ZAO's steward-not-hero posture.
- **The Five Cs** - Clarify purpose + principles, Convene the people, Cultivate trust, Coordinate action, Collaborate for systems change. This is the whitepaper's core spine.
- **Network leadership roles** - catalyzing, facilitation, weaving, coordination - distributed, not held by one person. "Network leadership is the fine art of taking responsibility for an endeavor while sharing that responsibility completely with others."
- **Consent-based decision-making (0-5)** - a real cousin to ZAO's OREC optimistic-execution model; both favor a bias toward action over stalling consensus.

Note: the book's framework is treated as solid; any specific ZAO mapping (which people play which role, which partnerships count) is a proposal to validate with Zaal during drafting, not asserted as fact.

## 5. Document structure

### 5a. The ZAO Whitepaper (main)
1. **Preamble / Vision** - what The ZAO is (an impact network), the spine line, why this document exists.
2. **The Problem** - gatekeeping in four forms (profit, power, potential, knowledge).
3. **The ZAO as an Impact Network** - the Five Cs, cultivate-not-build, speed of trust, ego-to-eco.
4. **How ZAO Governs: the Fractal** (inside "Coordinate") - Respect as merit not money, the weekly peer-ranked game, humans-only, contribution over capital. Plain-language; math -> technical doc.
5. **What the Engine Produces: the Lanes** - the projects that grow from ZAO governance, grouped by lane (Music, Builders, Events/Festivals, Tools/Agents), each a short showcase. **Requires an ecosystem audit (see build step 1).**
6. **The Agentic Open-Source Future + How You Align** - the enabling triad (agents + blockchain + open-source), agents as resources/distribution not members, and how a member plugs in - culminating in signing the manifesto.
7. **Honest Limitations** - the no-decay reality, operating-core concentration, participation durability, visibility bias, scaling unproven, and today's donation-funded sustainability. Candor as authority.
8. **Conclusion** - the "impact network / new governance culture" close.

### 5b. The Technical Whitepaper
- Respect Game full math (Fibonacci 1x 55/34/21/13/8/5 and 2x 110/68/42/26/16/10; consensus thresholds).
- On-chain architecture: OREC optimistic execution, soulbound OG (ERC-20) / ZOR (ERC-1155), contracts on Optimism (OG `0x34cE89...216957`, ZOR `0x9885CC...E7445c`, OREC `0xcB05F9...6Be532`).
- Comparative governance (why fractal vs token-voting / quadratic / Nouns / Moloch).
- The monetary-policy / decay proposal (doc 941) in full - banked/active split, 180-day half-life, multi-signal participation, grace, Y3 migration, bounty routing.
- Sybil/collusion defense.

### 5c. The Manifesto
- ~10-15 short lines built from the five creed commitments + the anti-gatekeeping stance.
- Immutable once ratified. Signed = Hats hat minted, tied to the version signed.

## 6. Verified fact base (code-checked 2026-07-02)

Safe to state as current (per doc 942 verification log): no decay (`voteWeight.ts:58` raw sum); contracts + Optimism chain; OG ERC-20 + ZOR ERC-1155 vote-weight path; Fibonacci curve. Still to verify on-chain before drafting Ch 7-8: current fractal week count and the "two wallets drive OREC" operating-core claim.

## 7. Build sequence (Approach C - draft in repo, launch on-chain)

1. **Audit the ecosystem projects per lane** - inventory the real projects (bettercallzaal repos + live products + research, building on doc 836) so the Lanes section is accurate.
2. **Draft the three documents** in the repo as versioned Markdown (research/governance).
3. **Dedicated manifesto pass with Zaal** - the charged core; worth its own iteration.
4. **Zaal reviews; lock v1.0.**
5. **Launch = v1.0 on-chain**: publish the three to the permaweb + stand up the manifesto-signing hat. All on-chain/Hats writes gated on Zaal's explicit go and confirmation on Hats tree 226.
6. **Every later change** = a logged version bump + new permaweb publish.

## 8. Out of scope (for v1.0)

- Actual on-chain writes / Hats minting (design-only until Zaal confirms).
- The decay mechanism implementation (941 is a proposal; the doc describes, does not enact).
- Any token launch or economic change.

## 9. Sources

Research docs 718 (+718a-g), 935, 936, 941, 942, 703, 696. David Ehrlichman, *Impact Networks* (2021). Code verification per doc 942. Brainstorm with Zaal, 2026-07-02.
