---
topic: governance
type: guide
status: research-complete
last-validated: 2026-06-09
related-docs: "056, 058, 703, 778, 827, 696"
original-query: "https://getdweb.net/principles/ and tell me where i could add these things into the ZAO please"
tier: STANDARD
---

# 828 - The DWeb Principles, mapped into the ZAO

> **Goal:** Take the 5 DWeb Principles (getdweb.net) and pin each one to a concrete place in the ZAO where it should be stated, enforced, or built in - so the ZAO's values are explicit, not just implied.

The ZAO already lives most of these. The work is not inventing values - it's **naming them and putting them in 4-5 specific surfaces** so members, builders, and partners can point to them.

## Key recommendations (act on these)

| # | Recommendation | Where |
|---|---------------|-------|
| 1 | **Adopt the 5 DWeb Principles as the ZAO's stated values** (lightly adapted for a music/impact network) and put them at the top of the **Fractal Whitepaper** | [[project_zao_fractal_whitepaper]] (doc 696) |
| 2 | **Publish a Code of Conduct** - the ZAO has none surfaced; DWeb #3 (Mutual Respect) requires one | new `CODE_OF_CONDUCT.md` in ZAOOS + a ZAONEXUS page |
| 3 | **Make "Distributed Benefits" the explicit design rule for the ZABAL Games proto-DAO** contribution-scoring (doc 827) - reward contributors + route proportionate value to the community | ZABAL Games proto-DAO spec |
| 4 | **State the ZAO's "Humanity" north star** ("anyone doing anything that helps humans" - Zaal, doc 827) as the mission line | brand canon / [[project_zao_canonical_pitch]] |
| 5 | **Add a one-line Ecological statement** - the ZAO runs on Optimism + Base (L2s, not PoW) - and say so | whitepaper + ZAONEXUS |

## The 5 principles -> where each goes in the ZAO

### 01. Technology for Human Agency
*(open source, P2P, interoperability, anti-walled-garden, privacy, self-determination, plural approaches)*
- **Already lived:** ZAO OS is open-source and ships "monorepo-as-lab -> graduate to own repo, clone-no-deps" (CLAUDE.md) = anti-walled-garden + plural approaches. The whole stack is **Farcaster-native** (an open protocol, not a closed platform). ZABAL Games is "free, open to anyone, **any harness**" (doc 778).
- **Where to add it:** the **Open Source pillar** of the ZAO 4-pillars ([[project_four_pillars]]); state "interoperable + open-source, no walled gardens" in the whitepaper. Add an OSS-license + "fork me" note to the ZAONEXUS hub.

### 02. Distributed Benefits
*(reward contributors, route proportionate value to community, oppose concentration of control)*
- **Already lived:** the **Respect Game** + **ZOLs** (contribution credits), **0xSplits** for music revenue, $ZABAL daily airdrops + Empire Builder rewards layer, the **proto-DAO contribution-scoring** idea (doc 827).
- **Where to add it:** make it the **explicit scoring rule for the ZABAL Games proto-DAO** (contributors earn respect; auditing weighted; community gets proportionate value). Reference it in [[project_zao_brand_legal_architecture]] (how value flows BCZ -> ZAO -> contributors).

### 03. Mutual Respect
*(clear + enforced code of conduct, personal accountability, transparent governance)*
- **Already lived:** the **Fractal Respect Game** literally operationalizes mutual respect; governance is on-chain + transparent (Snapshot, ORDAO, docs 056/058/703).
- **Gap -> add it:** the ZAO has **no published Code of Conduct**. Write `CODE_OF_CONDUCT.md`, link it from the community guide + ZAONEXUS, and reference it in onboarding. This is the clearest "missing" item.

### 04. Humanity
*(human rights, marginalized populations, data agency, harm-reduction, accessibility)*
- **Already lived:** the ZAO's self-description as a **"decentralized impact network"** ([[project_zao_canonical_pitch]]) and Zaal's north star "anyone doing anything that helps humans" (doc 827); onboarding artists from underserved regions (Iman/Zambia, India, UK); **mobile-first** apps (accessibility).
- **Where to add it:** make "helps humans / impact-first" the **mission line** in the brand canon; add an **accessibility** note to the component rules (already mobile-first); a one-line data-agency statement (members own their Farcaster identity + data) in the whitepaper.

### 05. Ecological Awareness
*(minimize energy + device demand, support repair/recycle)*
- **Already lived:** the ZAO is on **Optimism + Base** - Ethereum L2 rollups, not proof-of-work - so it is already low-energy by design. The "music-focused fractal on Optimism" (doc 703).
- **Where to add it:** a single **sustainability line** in the whitepaper ("built on low-energy L2s, no PoW") + ZAONEXUS. Cheapest principle to claim because it's already true.

## Findings

- **4 of 5 are already embodied** in the ZAO; the one real **gap is #3's Code of Conduct** (none published). That is the highest-leverage add.
- The **single best home** for all 5 is the **Fractal Whitepaper** (Zaal's stated magnum opus, doc 696) - a "Values / Principles" section adopting the DWeb 5, adapted for music + impact. Second home: **ZAONEXUS** (the public-facing values surface).
- The DWeb Principles are **CC-licensed community values** (getdweb.net, by Mai Ishikawa Sutton + John Ryan) - the ZAO can adopt/adapt them and signal alignment with the broader DWeb movement (Internet Archive's DWeb Camp), which is a **credibility + network signal** for a decentralized music network.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a "Values (DWeb-aligned)" section to the Fractal Whitepaper (adopt the 5, adapted) | Zaal | Doc | Whitepaper pass |
| Write + publish `CODE_OF_CONDUCT.md` (ZAOOS + ZAONEXUS) - closes the #3 gap | Zaal | PR | This month |
| Bake "Distributed Benefits" into the ZABAL Games proto-DAO scoring spec (doc 827) | Zaal | Design | Proto-DAO writeup |
| Add the impact/Humanity mission line + ecological line to the brand canon + ZAONEXUS | Zaal | Content | Next |

## Also See

- [Doc 696 / project_zao_fractal_whitepaper] - the whitepaper that should host the values
- [Doc 703](../703-zao-fractal-current-state-may-2026/) - Fractal/Respect (operationalizes #2 + #3)
- [Doc 056](../056-ordao-respect-system/), [Doc 058](../058-respect-deep-dive/) - Respect system
- [Doc 827](../../events/827-zaal-civilmonkey-devcon-india-builder-series-proto-dao-jun9/) - proto-DAO contribution-scoring (where #2 lands)

## Sources

- [FULL] [DWeb Principles - getdweb.net/principles](https://getdweb.net/principles/) - the 5 principles + sub-points, by Mai Ishikawa Sutton & John Ryan (stewards); fetched 2026-06-09.
- [FULL] DWeb community context - [getdweb.net](https://getdweb.net) (Internet Archive's Decentralized Web movement / DWeb Camp) - the principles are CC-licensed community values, adoptable by aligned projects.
- [FULL] ZAO grounding - CLAUDE.md (monorepo-as-lab, 4 pillars), doc 703 (Fractal on Optimism), doc 827 (proto-DAO + "helps humans" north star), doc 778 (ZABAL Games "any harness"), brand-canon memories.
