---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-17
related-docs: 037, 222, 258, 050, 051, 657, 660
tier: STANDARD
---

# 658 — Takemiya: Blockchain as the Geopolitical Monetary Substrate

> **Goal:** Map Makoto Takemiya (SORA / Soramitsu) "blockchain as the geopolitical monetary substrate" article to ZAO's $ZABAL + Empire V3 positioning. The thesis matters because Takemiya is one of the few people who has actually shipped a sovereign CBDC (Bakong, Cambodia, 2019) — his framing of blockchain-as-monetary-infrastructure is grounded, not theoretical.
>
> **Body source — confirmed unreachable:** The v2 no-login extraction chain ([Doc 660](../../dev-workflows/660-x-content-extraction-v2/)) was run against this article on 2026-05-17. Result: title + preview retrieved via syndication, but **no author mirror exists** (Takemiya has no LinkedIn Pulse / Medium / Substack / Paragraph / Mirror.xyz cross-post for this piece, and his Soramitsu blog hosts only company-level posts, not personal essays). The article is published ONLY on X Premium. Body recovery would require an X-authenticated session, which Zaal opted out of (2026-05-17). This doc is therefore built from preview + extensive verified Takemiya/Soramitsu public record + the article's explicit reference to "yesterday's piece on stealth building" — NOT from verbatim body. Treat the reconstructed-thesis section as informed inference, not direct quotation.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt "blockchain as monetary substrate" framing for $ZABAL one-liner | YES, partially | ZAO is not building sovereign monetary infrastructure, but the "infrastructure becomes valuable when the world needs the functionality" thesis applies cleanly to $ZABAL on Base + Empire V3. Frame: $ZABAL is monetary infrastructure for the impact-network economy. |
| Cite Takemiya / Bakong / Iroha in any pitch deck for $ZABAL | YES, as precedent | Takemiya shipped the first live CBDC on Hyperledger Iroha at scale. Strong "this is a real category, not crypto hype" credibility for traditional investors. |
| Pivot to a Polkadot / Substrate / Iroha base for any ZAO token plumbing | NO | $ZABAL is already on Base. Switching chains is a category mistake — Takemiya's chain choice (Iroha / Substrate / Polkadot) was driven by sovereign-government requirements, not impact-network ones. |
| Engage Soramitsu as a partner for ZAO infrastructure work | NOT NOW | They build for central banks and telecoms; ZAO's scale doesn't match their engagement model. Revisit if ZAO Festivals or ZAOstock crosses a regulated payments threshold. |

## Article Status

**Source:** [https://x.com/M4K070/status/2053960779825852422](https://x.com/M4K070/status/2053960779825852422) — May 11 2026, 22:09 UTC.
**Title:** BLOCKCHAIN AS THE GEOPOLITICAL MONETARY SUBSTRATE
**Author:** Makoto Takemiya (武宮誠, M4K070), CEO + Co-Founder of Soramitsu.

**Premium-content limitation — confirmed unreachable after v2 chain run:** The canonical X Article body is paywalled (HTTP 402) and not retrievable via wayback, archive.ph, X guest-token GraphQL, syndication, nitter, or any of the 8 author-mirror patterns checked by [Doc 660](../../dev-workflows/660-x-content-extraction-v2/) Tier 3. Takemiya does not maintain a personal cross-post channel for X Articles — Soramitsu's blog is company-level only, his Medium has no posts in 2026, no Substack / Paragraph / Mirror.xyz mirror exists. Reconstruction is built from:
1. The article preview (first ~500 characters, available via X syndication — that's the only verbatim text we have).
2. Takemiya's well-documented prior public positions + published Soramitsu work (CBDC deployments, IEEE paper, Tokyo FinTech interview, Calcalist interview, GLEAC blog, sora.org content).
3. The author's referenced "yesterday's piece" on stealth building, which constrains the topic space.

If Zaal at any point wants the verbatim body, the only remaining route is auth-based (X Premium subscription or session cookie). Zaal explicitly opted out of all auth-based routes on 2026-05-17. This doc is therefore permanently flagged as "informed inference" unless that decision changes.

## What The Preview Says

> "Infrastructure becomes valuable when the world needs the functionality it brings. Yesterday's piece explained how we at SORA built while invisible and the advantages of stealth building. This piece..."

Translation: the thesis is **building infrastructure that becomes valuable when geopolitical conditions create demand for it**. The "stealth building" framing references a prior post (Soramitsu shipped CBDC in Cambodia 2019 before "CBDC" was a recognized acronym in financial press).

## Reconstructed Thesis (high confidence based on Takemiya's track record)

1. **Sovereign money is becoming a blockchain category.** CBDCs (Central Bank Digital Currencies) are no longer experimental — Bakong (Cambodia, live 2019) has 10,000+ users in pilot, was built by Soramitsu on Hyperledger Iroha. Bokolo Cash (Solomon Islands), DLak (Laos), Palau Invest, others have followed.
2. **The geopolitical layer matters more than the tech layer.** Which countries adopt blockchain-based money is shaped by USD-dollarization politics, China + BRICS yuan-substitute strategies, sanctions regimes (Russia, Iran), and remittance corridors (SE Asia).
3. **Public infrastructure beats private protocols at the sovereign layer.** Permissioned chains (Iroha) win over permissionless (Ethereum L1) for central-bank work because regulators need governance levers.
4. **SORA's positioning** (XOR token, Polkaswap, Substrate-based) is as a *supranational monetary infrastructure* — not a national CBDC, but the layer that lets sovereigns interoperate. This is the "monetary substrate" the title names.
5. **"Stealth building" works in this space** because the customers (central banks) aren't reachable through normal crypto-marketing channels. You build the tech + the regulatory relationships, then surface when the geopolitical demand catches up.

## Takemiya / Soramitsu Track Record (verified)

| Project | What | Year | Status |
|---|---|---|---|
| Hyperledger Iroha | OSS blockchain platform | 2016 - present | Soramitsu = original developer + main contributor, contributed to Linux Foundation |
| Bakong (Cambodia) | First live central-bank-run blockchain interbank payment system | Pilot 2019, full launch 2020 | Production, 10,000+ users in pilot, built on Iroha |
| Bokolo Cash (Solomon Islands) | CBDC PoC for digital Solomon Island Dollar | Nov 2023 | PoC covering retail, interbank, cross-border remittance |
| DLak (Lao PDR) | CBDC PoC for modernizing national payments | Feb 2023 | PoC |
| Palau Invest | CBDC project | (date unclear) | Active |
| Digital shekel (Israel) | Per Calcalist Tech interview | Future | Public statements of involvement |
| SORA (XOR) | Decentralized supranational monetary system | Ongoing | Polkadot parachain; substrate governance; quadratic voting embedded in governance |
| Polkaswap | DEX on SORA/Substrate | Ongoing | Live |
| Zenswap | Cross-chain liquidity | Ongoing | Live |
| ADB cross-border securities settlement | Asian Development Bank PoC | 2023+ | Active |

## Where The Frame Maps To ZAO

**ZAO is not building sovereign money.** It IS building a token-incentivized impact network where $ZABAL on Base (contract `0xbB48...0b07`) does the same kind of *infrastructure*-not-product work that Iroha does for Cambodia.

| Takemiya layer | ZAO analog |
|---|---|
| Iroha (permissioned chain for governments) | Base L2 (permissioned-feeling for Coinbase-aligned audience) |
| Bakong (sovereign CBDC) | $ZABAL (impact-network token) |
| SORA / XOR (supranational monetary substrate) | Empire V3 (`0xe0fa...1462`) as the multi-project token substrate |
| Hyperledger Foundation (institutional legitimacy) | (gap — ZAO has no equivalent yet; "Plural Events / RadicalxChange ecosystem" is closest analog in deliberation space) |
| Soramitsu (the firm) | BCZ Strategies LLC (the firm) |
| Bakong as *infrastructure for a country* | $ZABAL as *infrastructure for the impact-network economy* |

The frame to steal for ZAO pitches: **"Infrastructure becomes valuable when the world needs the functionality it brings."** When the world needs an impact-network economy, $ZABAL is ready. (Wait — note the parallel to Cassie's Doc 547 framing: "the infrastructure is the product, ZAOstock is proof.")

## "Stealth Building" — The Adjacent Thesis

Takemiya's "yesterday's piece" (also paywalled) was about **building while invisible**. The case Soramitsu makes: they built Iroha + shipped Bakong before "CBDC" was a press category. By the time the press caught up, they were the default vendor.

**ZAO parallel:** the long-running fractal process (90+ weeks Mondays 6pm EST), the 656-doc research library, ZOE on VPS, Hermes pipeline, ZAOstock infrastructure — these are all stealth-building moves. The Cassie validation (Doc 547) was the moment the outside started catching up.

**Action implication:** don't pivot to chase visibility (the "ship and use, not meta" feedback from May 5). Keep building infrastructure, let the world catch up.

## Hard Numbers

- Bakong pilot: 10,000+ users (2019).
- Iroha: in production for **NBC (National Bank of Cambodia)** + Solomon Islands + Laos + Palau + Asian Development Bank.
- $ZABAL Base contract: `0xbB48...0b07` (per Doc on nexus / 14-brand directory, Doc on `project_nexus_hub_live.md`).
- Empire V3 contract: `0xe0fa...1462`.
- Soramitsu founded 2016 (Tokyo).
- Takemiya: PhD University of Tokyo, prior work at ATR Neuroinformatics, 20+ peer-reviewed papers.
- Article publish date: 2026-05-11 22:09 UTC.

## Where The Frame Does NOT Map

- Soramitsu's customer is **central banks**. ZAO's customer is **independent artists + community members**. The B2B sovereign-vendor model does not transfer.
- Iroha is **permissioned** by design (regulators need a kill switch). $ZABAL is permissionless on Base. Don't conflate.
- Soramitsu's competitive moat is **regulatory relationships with sovereigns**. ZAO's moat is **community + content + member trust**. Different game.

## Connection To Doc 657 (Plural Events)

The Hubs Network / RadicalxChange Plural Events covered in Doc 657 are about **infrastructure for collective decision-making** (deliberation). Takemiya's piece is about **infrastructure for collective monetary settlement** (transaction).

Together: **public infrastructure for collective action** — talking + transacting. ZAO is operating in both layers simultaneously: deliberation via Farcaster + fractal + (proposed) Polis-style tooling, transaction via $ZABAL + Empire V3 + future ZAO Festivals payments. The Takemiya + Hubs Network combination Zaal sent in one prompt is a coherent thesis: **ZAO is building public infrastructure for the impact-network economy at both layers.**

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Replace placeholder $ZABAL one-liner in `/nexus.html` with "infrastructure for the impact-network economy" frame (only if Zaal agrees with the framing) | @Zaal | Site copy edit | Next BCZ Strategies content cycle |
| Cite Takemiya + Bakong + Iroha precedent in next $ZABAL pitch deck | @Zaal | Deck content | Next investor / partner conversation |
| If Zaal has X Premium, paste full article body for re-validation of this doc | @Zaal | Doc validation | Optional |
| Cross-link this doc from `project_zao_canonical_pitch.md` if pitch language is adjusted | @Zaal | Memory update | After framing decision |
| Investigate: does Empire V3 have any infrastructure-substrate framing already in its own docs? | @Zaal or Iman | Research follow-up | Before next Empire V3 meeting |

## Sources

- [M4K070 / Takemiya article tweet (paywalled body)](https://x.com/M4K070/status/2053960779825852422)
- [Soramitsu](https://soramitsu.co.jp/) — company homepage
- [Soramitsu CBDC eBook](https://soramitsu.co.jp/iroha-cbdc-2025) — Hyperledger Iroha's real-world deployments
- [LFDT Soramitsu Case Study (Cambodia)](https://www.lfdecentralizedtrust.org/case-studies/soramitsu-case-study) — Bakong details
- [Bakong Official Launch Press Release](https://soramitsu.co.jp/bakong-press-release)
- [Asian Development Bank cross-border PoC](https://soramitsu.co.jp/blockchain-based-cross-border-securities-settlement-system)
- [Hyperledger Foundation blog — NBC + Iroha](https://www.lfdecentralizedtrust.org/blog/2020/08/17/national-bank-of-cambodias-new-digital-payment-system-how-soramitsu-helped-modernize-retail-payments-using-hyperledger-iroha)
- [Government of Japan profile of Soramitsu](https://www.japan.go.jp/kizuna/2023/12/pioneering_connectivity_across_asia.html)
- [Tokyo FinTech / Norbert Gehrke interview](https://medium.com/tokyo-fintech/a-conversation-with-makoto-takemiya-soramitsu-802be88209aa)
- [Sora: A Decentralized Autonomous Economy (Semantic Scholar paper)](https://www.semanticscholar.org/paper/Sora:-A-Decentralized-Autonomous-Economy-Takemiya/596ec584cfcca432f685b187b441b9ded5ffcfc5)
- [TMRW Conf speaker bio](https://tmrwconf.net/speakers/makoto-takemiya/)
- [Calcalist Tech interview on digital shekel](https://www.calcalistech.com/ctechnews/article/biobvtkjw)

**Premium-content note:** the article body for *this specific piece* was not retrievable. Doc is built on (1) article preview, (2) extensive verified Takemiya/Soramitsu public record, (3) the explicit reference to "yesterday's piece on stealth building" which constrains the topic space. Treat the reconstructed-thesis section as informed inference, not direct quotation. Re-validate when full body is accessible.
