---
topic: business
type: decision
status: research-complete
last-validated: 2026-06-25
superseded-by:
related-docs:
original-query: "we should probably file an llc for this let me know and research otoco"
tier: STANDARD
---

# 902 - OtoCo on-chain LLC for ZABAL Gamez / The ZAO

> **Goal:** Decide whether and how to form an LLC for ZABAL Gamez using OtoCo - the options, costs, and the right structure for a Farcaster/Base-native, community-run project.

## Key Decisions (recommendations first)

| Decision | Call | Why |
|----------|------|-----|
| Form an LLC? | YES - worth it once there's money/IP/contracts in play | ZABAL Gamez holds a brand (the arcade mark, the site, the name), runs paid/collectible surfaces (Magnetiq magnet, future token/prize flows), and will sign sponsor/partner deals. An LLC gives limited-liability separation between that activity and the people running it. |
| OtoCo vs traditional | USE OtoCo for a web3-native project | On-chain, wallet-controlled, ~6-second formation, no lawyer needed, franchise tax handled, multisig/DAO support. A traditional LLC is hundreds-to-thousands of dollars + 2-10 days + a separate registered agent. |
| Which product | START with the **Wyoming Series LLC (Instant)** | Cheapest + fastest + on-chain-native: ~US$99/yr (or US$49 + gas in the older docs), no state filing, no separate franchise tax (the Master pays), wallet = ownership, NFT proof, EIN + Mercury bank account available. Fits a global, web3 builder profile. |
| When to upgrade to Standalone | MOVE to a **Standalone LLC (US$299/yr)** if you need state-registry visibility | A Standalone files directly with Delaware/Wyoming, appears in the public registry, and has universal recognition - better when a bank, sponsor, or grantor needs to see it in the state registry. Slower (24-48h), can't be anonymous, full state compliance. |
| Community ownership | If multiple ZAO members are members, USE the **Gnosis Safe multisig** route | OtoCo has a Safe app: all multisig signers are members + can manage the LLC dashboard. The right path if this is a ZAO-collective entity, not a sole-founder one. |
| Jurisdiction | Wyoming (default) or Delaware | Wyoming: lighter, cheaper, strong LLC privacy. Delaware: Series LLCs don't report individual Series names in the Master's annual filing (more privacy), and it's the standard for raising. Either works on OtoCo. |

## Findings

### What OtoCo is
On-chain US LLC formation, integrated with banking. "Form a US LLC, get your EIN without an SSN, and open a US bank account - instant and from abroad." Entities are "recorded onchain so you own and control it from your wallet" while being a real US company (registered agent, EIN, bank account). Forms Delaware + Wyoming LLCs (more states coming), plus a Swiss Association (US$299/yr) and a (D)UNA (US$499/yr).

### The two LLC products

| | Instant (Series) LLC | Standalone LLC |
|---|---|---|
| Cost | ~US$99/yr (docs also cite US$49 + gas; avg ~US$25 incl. gas) | US$299/yr |
| Speed | ~6 seconds | 24-48 hours |
| Structure | A "Series" cell under OtoCo's Master LLC (smart contract) | Independent entity filed directly with the state |
| In state registry? | No | Yes |
| Recognition | Broad (varies by state) | Universal |
| Anonymous? | Yes | No (members/managers recorded, but not public; no ID/proof-of-address needed to file) |
| Franchise tax | None (Master pays) | Full state compliance (WY annual report / DE franchise tax) |
| Best for | Global founders, web3 builders | US residents, domestic businesses, registry-visible needs |
| Onchain NFT + wallet-managed | Yes | Yes |

Both include: registered agent, free mailing address, operating agreement, EIN eligibility, Mercury FDIC bank account, dashboard, NFT proof of existence, crypto payment acceptance, "agentic AI ready."

### Why it fits ZABAL Gamez / The ZAO specifically
- **Web3-native:** wallet-controlled, on-chain proof, crypto settlement - matches a Farcaster/Base project.
- **Holds IP cheaply:** OtoCo explicitly markets the LLC as "ideally suited to hold... digital property such as patents, trademarks and copyright" - i.e. the ZABAL Gamez brand/mark/site.
- **Smart-contract + token wrapper:** "instant limited liability wrapper around smart contracts" and "an ideal vehicle as an issuer of a SAFE/SAFT/SAFTE or... a Token Purchase Agreement after the Series created and issued a token." Relevant if ZABAL/$ZABAL or collectibles ever formalize.
- **DAO/community fit:** Gnosis Safe multisig support means ZAO members can co-own/manage.

### Caveats (do before filing)
- **Not legal/tax advice.** OtoCo automates formation, but confirm with a lawyer/accountant: the member structure (sole vs The ZAO collective), tax treatment, and whether this entity is ZABAL-Gamez-specific or a broader ZAO entity that ZABAL sits under.
- **Series vs Standalone tradeoff is real:** if a sponsor/bank/grant requires the entity to appear in a state registry, the Instant Series LLC will not satisfy that - budget for the US$299 Standalone.
- **Banking:** Mercury account is offered but subject to Mercury's own approval (US business, etc.).
- **Pricing drift:** the marketing site (US$99/299) and the older gitbook docs (US$49 + gas) differ - confirm current pricing in-app at otoco.io before committing.

## Also See

- (first business/LLC doc on OtoCo in the library)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide entity owner: ZABAL-Gamez-specific vs under The ZAO (sole vs multisig) | @Zaal | Decision | Before filing |
| Spin up a Wyoming Instant Series LLC on otoco.io to start (wallet ready, ~$99/yr) | @Zaal | Task | When decided |
| Confirm member structure + tax treatment with a lawyer/accountant | @Zaal | Task | Before banking/contracts |
| If registry visibility needed (sponsor/bank), toggle the $299 Standalone | @Zaal | Task | As needed |

## Sources

- [OtoCo homepage](https://otoco.io/) [FULL - products, pricing US$99/299, EIN/bank/registered-agent, on-chain ownership]
- [Choosing the Right Incorporation - OtoCo docs](https://docs.otoco.io/docs/choosing-the-right-incorporation) [FULL - entity comparison table, feature/cost comparison vs traditional]
- [Understanding Series LLCs - OtoCo docs](https://docs.otoco.io/docs/understanding-series-llcs) [FULL - how the Master/Series structure works on-chain]
- [Introducing Onchain Standalone LLCs - OtoCo blog (2026-04-15)](https://blog.otoco.io/introducing-onchain-standalone-llcs/) [FULL - Instant vs Standalone table, US$299, 24-48h, registry]
- [Multisig LLCs for DAOs - OtoCo gitbook](https://otoco.gitbook.io/otoco/c.-faqs/multisig-llcs-for-daos) [PARTIAL - Gnosis Safe app flow, multi-signer membership via highlights]
- [OtoCo FAQs - gitbook](https://otoco.gitbook.io/otoco/c.-faqs/faqs-1/faqs) [PARTIAL - no franchise tax, ~$25 avg cost, IP/token/SAFE use cases via highlights]
