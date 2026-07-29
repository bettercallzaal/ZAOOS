---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-29
superseded-by:
related-docs: "2122, 2123, 804, 876, 724"
original-query: "lets keep researching more and more (DFOS deep research wave 2 - why did Metalabel remove blockchains, and what does that mean for ZAO's onchain thesis)"
tier: DEEP
---

# 2124 - Metalabel's post-crypto pivot: the strongest available critique of ZAO's onchain thesis

> **Goal:** Take seriously the fact that the team building DFOS started crypto-native, raised from a crypto fund, shipped onchain products for two years, and then **removed blockchains entirely** - and decide what, if anything, ZAO should change. This is the argument against ZAO's own architecture, made by people who ran the experiment and had every incentive to keep going.

## Key Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Do NOT remove onchain from ZAO.** Metalabel's three failure modes were all consumer-payment failures - speculative frenzy on a primary sale, L1 gas spikes pricing out a $30 purchase, and an unrecoverable wallet drain. ZAO's onchain surface is governance and contribution accounting (Respect, ZOLs, Hats), not consumer checkout. | HOLD the onchain governance layer. It is not exposed to the failure modes that killed Metalabel's. |
| 2 | **DO take the payments lesson.** Their fix was to add Stripe to every drop after a memecoin made a $30 book cost $100+ in fees. | ENSURE every ZAO consumer-facing purchase path has a fiat option. If a fan cannot buy a ZAO thing with a card, ZAO has adopted the exact failure Metalabel escaped. |
| 3 | **Adopt "the ends, not the means" as a shipping test.** Yancey's framing: crypto is a culture where "the means justify the ends" - what matters is that data sits in a particular database structure, not the user's experience. | APPLY as a review question on every ZAO feature: does this exist because it improves the member's experience, or because it is onchain? If the second, it needs a separate justification. |
| 4 | **Steal the 4-step groupcore sequence.** Metalabel's public roadmap ran: label -> tools -> **law** -> platform. They shipped a state statute before they shipped the platform. | STUDY IT. ZAO has been building the platform first. The A-Corp shows what happens when a creative org treats legal structure as a product surface (see [Doc 2123](../2123-acorp-town-hall-boulder-2026/)). |
| 5 | **Note that they kept the crypto primitives and dropped the chain.** DFOS uses Ed25519 signed chains, content-addressed CIDs, W3C DIDs, and credentials derived from **UCAN** (delegation chains + monotonic attenuation) - with no ledger, no consensus, no gas. | RECOGNIZE this as a third option ZAO has not costed: cryptographic self-sovereignty without a blockchain. Not a recommendation to adopt - a recognition that "onchain or centralized" is a false binary. |

## Who Metalabel Is

Cofounded 2021-2022 by **seven** collaborators: **Yancey Strickler** (Kickstarter cofounder), **Rob Kalin** (Etsy cofounder), **Ilya Yudanov**, **Austin Robey** (Ampled cofounder), **Anna Bulbrook**, **Lauren Dorman**, **Brandon Valosek**.

Funding: **seed round February 2022, led by 1kx** - a crypto-native venture fund. Other known investors: **Betaworks Ventures, IDEO CoLab Ventures, Prehype**. No subsequent round found in public sources.

This matters for reading the pivot: the team removed blockchains **while holding money from a crypto fund.** That is the opposite of a convenience narrative.

## The Original Onchain Product (2022-2023)

Metalabel.xyz was genuinely onchain and genuinely well-designed:

- **Records** - a post-platform release format, "stored and transferable onchain, meaning they can move beyond the Metalabel platform"
- **Programmatic splits** - the *After the Creator Economy* zine paid out **more than two dozen people** from a single release, "some receiving thousands of dollars for significant contributions and others receiving $100 for little effort"
- **Cost recoup** - groups could programmatically recoup hard costs before splitting
- **70-30 default split** between the creator of a record and the metalabel publishing it, routing the 30% to a treasury that funds the next release
- **Quality Drops** (March 2022) - bundled zines, books, art, concerts, film screenings, and whitepapers sold via crypto

Yancey in June 2022, defending the space: *"Blindly dismissing any project that touches a blockchain is like missing the forest for the logging industry."* In December 2022 he argued the "Crypto Era" (speculation) was ending and the "Onchain Era" (utility) was beginning.

**This was not a tourist.** The pivot came from inside the thesis.

## The Three Strikes

Recorded from Yancey's February 2024 Summer of Protocols talk, "When the means justify the ends."

### Strike 1: the frenzy that ate the context

Gitcoin re-issued the original Quadratic Funding whitepaper (Buterin, Weyl, Hitzig) as a collectible fundraiser. It raised **a quarter-million dollars in six days**. In the final hours it was hyped as the first-ever NFT by Vitalik, became **the most-traded NFT on Ethereum**, and the academic context evaporated. Creators and Metalabel were flooded with demands to take actions that would pump the asset.

The quote that defines it: **"I own three and don't even know why?"**

Compounding it: **Blur** built market share in late 2022 by negating artist royalties, then told artists it would honor royalties only if they blocked their work from selling anywhere else. **OpenSea followed.** Artist royalties - in Yancey's words "the most promising new creator income stream since crowdfunding" - went on life support within months.

His two structural conclusions are the sharpest part of the essay and deserve verbatim treatment:

> "Crypto says 'code is law,' but that clearly isn't the case. Law is law. Code is an executable suggestion that does not give artists real protection."

> "In many ways Web2 platforms are more decentralized than crypto. They each use their own tech stacks, their own data schemes, their own offerings. This lack of interoperability can be painful, but it also prevents the kind of lockstep market demolition we saw with artist royalties, where a switch could be flipped off or on in one instance, impacting the rest of the web."

That second point is a real argument that composability is a **systemic risk** vector, not only a feature. ZAO has no answer to it on file.

### Strike 2: gas priced out the customer

A Quality Drop for a Japanese art book "with zero connections to crypto" collided with the **Pepe memecoin** launch. Ethereum fees spiked so far that **buying a $30 book would have cost more than $100 in fees**. Neither the artists nor the platform could do anything.

> "If people couldn't trust the basic infrastructure we used to process payments, how was anyone supposed to make a living?"

Fix: **Stripe was added to all future drops.**

### Strike 3: the drain with no recourse

Yancey's wallet was drained via a fake Twitter account. Law enforcement identified a suspect in New Jersey and could not recover anything - already resold, and blockchains do not reverse.

> "In that moment all I could think about was how a creator might have felt... It was one thing for me to deal with this, but what about our future customers?"

## The Crypto Diet

The decision process is worth copying regardless of the conclusion. Yancey deliberately cut his crypto information intake - unfollowed crypto accounts, changed his inputs - to test whether the thesis survived outside the bubble:

> "While crypto had felt like an inevitable fait accompli while in the blockchain bubble, once we stopped looking at Twitter we never heard a single person talk about crypto. It existed in this one corner and nowhere else."

He had the whole team do it. All reported the same result. **This is a repeatable experiment and ZAO has never run it.**

## The Three Structural Critiques

Yancey's summary of what he says is inherent to the medium, not fixable by better products:

1. **No rollback.** "Security is a huge problem because blockchains can't roll back. We call this being permissionless and say code is law. In reality it's a hostile consumer experience where people's personal property is easily stolen without recourse."
2. **Financialization by default.** "Any piece of content can be wildly financialized without its creators benefiting or giving approval because of the open, financialized nature of blockchains."
3. **Fees everywhere.** "Transaction fees have been rebranded as protocol rewards and referral bonuses, when we're really service fees so ubiquitous they'd make Ticketmaster salivate."

The landing:

> "Metalabel's journey into the crypto rabbit hole and back out again produced something unique: a product stack that's very much inspired by crypto, but with zero blockchains underneath it."

## Honest Assessment for ZAO

### Where the critique lands

| Critique | Applies to ZAO? | Why |
|----------|-----------------|-----|
| Speculative frenzy distorts creative context | **Partly** | ZABAL and artist tokenization are exposed. A ZAO artist token that pumps has the same context-destruction risk as the Gitcoin whitepaper |
| Gas spikes price out buyers | **Low** | ZAO is on L2s, not Ethereum L1. But the lesson generalizes: any dependency on a shared fee market is a dependency you do not control |
| No rollback / theft with no recourse | **Yes** | ZAO onboards non-crypto-native music people. Every one is a wallet-drain candidate. This is the strongest live risk |
| Composability enables lockstep market demolition | **Unanswered** | ZAO has no documented position on what happens if a dominant venue changes the rules for everyone at once |
| Fees everywhere | **Low** | ZAO does not monetize through protocol fees |

### Where it does not land

- **ZAO's onchain surface is governance, not checkout.** Respect, ZOLs, and Hats roles are contribution accounting and permissioning. None of the three strikes touch that surface.
- **Metalabel chose closed-source SaaS as the replacement.** The DFOS *platform* is proprietary; only the protocol is MIT. ZAO's answer to platform risk is open source plus onchain state. Removing the chain without opening the platform trades one dependency for another - the "vibesmobile" is still their server.
- **They kept the primitives.** Ed25519 identity chains, CIDs, DIDs, and UCAN-derived credentials are the crypto stack minus the ledger. The critique is of **ledgers and their fee markets**, not of cryptographic self-sovereignty. ZAO can accept the first and keep the second.

### The genuinely uncomfortable part

Metalabel had automated splits paying two dozen collaborators from a single release **in 2022**, and concluded the tooling was not worth the medium. ZAO is building similar splits infrastructure four years later. The question this doc puts on the table and does not answer: **does ZAO have a reason its version survives contact with the same three strikes, or has it just not hit them yet?**

## The Groupcore Sequence (their actual strategy)

From "What the world needs now is groupcore" (2025-10-16). Metalabel defines its category as **groupcore**: "software, tools, economics, spaces, and ideas that help creative people cooperate." **20+ releases** from Metalabel Studio, including Splits and Treasuries (financial), Chorus and Lonely Writer's Club (social), the release platform, the New Creative Era podcast, the *After the Creator Economy* zine, Artist Corporations, and DFOS.

Their four-step journey, in their own order:

1. Build a groupcore **label** to release software and ideas (Metalabel Studio - live)
2. Use that label to release **tools** that help groups form, release work, and share profits (Metalabel.com - live)
3. Use the lessons of those groups to introduce a new **legal structure** (Artist Corporations - in progress)
4. While doing the above, provide a new **private internet** (DFOS - shipped 2026-05-21)

**Step 3 before step 4 is the non-obvious move.** They passed a state law before shipping the platform the law's community would live on. ZAO's implicit sequence has been platform-first, with legal structure unresolved (Doc 804 flags ZAO still has no legal person). The A-Corp is what "legal structure as a product" looks like.

Also worth noting for ZAO's framing problem - their diagnosis of why "what is Metalabel?" was hard to answer for years, and how a single coined category word (groupcore) fixed it. ZAO has the same explanation problem.

## Also See

- [Doc 2122](../../farcaster/2122-dfos-platform-deep-july-2026/) - DFOS platform deep dive
- [Doc 2123](../2123-acorp-town-hall-boulder-2026/) - A-Corp town hall
- [Doc 2125](../2125-dfos-vs-community-platform-market/) - DFOS pricing vs the community-platform market
- [Doc 804](../804-colorado-artist-corporation-acorp/) - Colorado Artist Company Act
- [Doc 724](../724-zao-artist-tokenization-on-avalanche-plan/) - ZAO artist tokenization plan

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Audit every ZAO consumer purchase path for a fiat option; list any path that is crypto-only - findings appended to this doc | @Zaal | Audit | 2026-09-05 |
| Write ZAO's documented answer to the wallet-drain risk for non-crypto-native music members (custodial option, recovery policy, or explicit acceptance) - decision doc in repo | @Zaal | Doc | 2026-09-30 |
| Run the crypto-diet experiment for two weeks and record what changes about ZAO's roadmap conviction - notes appended here | @Zaal | Experiment | 2026-09-15 |
| Add "ends not means" to the ZAO feature review checklist (does this help the member, or is it here because it is onchain?) - PR merged | @Zaal | PR | 2026-08-31 |
| Coin and test a single category word for ZAO the way Metalabel coined groupcore - three candidates drafted | @Zaal | Doc | 2026-09-30 |

## Sources

- [When the means justify the ends](https://www.ystrickler.com/the-means-vs-the-ends-blockchains-and-the-creation-of-metalabel/) - Yancey Strickler, Summer of Protocols talk transcript, 2024-02-13 [FULL] - the three strikes, the crypto diet, the three structural critiques. **Primary source for this doc**
- [What the world needs now is groupcore](https://blog.metalabel.com/what-the-world-needs-now-is-groupcore/) - 2025-10-16 [FULL] - groupcore definition, the 20+ release catalogue, the four-step journey
- [After Crypto](https://www.fwb.help/editorial/after-crypto-yancey-strickler-metalabel) - Works In Progress / FWB, 2022-06-16 [FULL via search highlights] - the pro-blockchain position he held before the pivot
- [Reinventing the record](https://ideaspace.ystrickler.com/p/reinventing-the-record) - 2022-12-08 [FULL via search highlights] - onchain records, the Crypto Era / Onchain Era framing
- [What's after the creator economy?](https://metalabel.substack.com/p/whats-after-the-creator-economy) - 2023-01-10 [FULL via search highlights] - two dozen collaborators paid from one release, 70-30 split design
- [Metalabel About page](https://www.metalabel.com/about) [FULL via search highlights] - the seven cofounders
- [Metalabel LinkedIn](https://www.linkedin.com/company/metalabel) [PARTIAL - financials line only: "Seed Round (2022-02-01) - 3 investors, led by 1kx". LinkedIn blocks fetchers; corroborated by the Center for a Digital Future listing below]
- [Center for a Digital Future - Metalabel profile](https://www.centerforadigitalfuture.org/blog/) [FULL via search highlights] - investors 1kx, Betaworks Ventures, IDEO CoLab Ventures, Prehype
- [Metalabel's Yancey Strickler on Building a Post-Crypto Haven for Artists](https://artwrld.ghost.io/metalabels-yancey-strickler-on-building-a-post-crypto-haven-for-artists/) - Artwrld, 2025-02-25 [FULL via search highlights] - third-party confirmation of the "post-crypto" positioning
- DFOS protocol `llms-full.txt` credentials section [FULL] - UCAN-derived delegation chains and monotonic attenuation, confirming which crypto primitives were retained
- [Why privacy is control and shared privacy is power](https://blog.metalabel.com/why-privacy-is-control-and-shared-privacy-is-power/) - 2026-04-22 [FAILED - CRAWL_NOT_FOUND via exa; the slug is referenced from other Metalabel posts but does not resolve. Not load-bearing for any claim in this doc]
