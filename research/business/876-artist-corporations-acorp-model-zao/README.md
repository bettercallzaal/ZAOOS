---
topic: business
type: market-research
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: "804, 724, 029"
original-query: "go back through /inbox and all of the agentmail (forwarded items: Metalabel 'Life in the forest' + 'How Obsession would fare as an A-Corp')"
tier: STANDARD
---

# 876 - Artist Corporations (A-Corps): The Metalabel Model and What ZAO Should Take

> **Goal:** Map Metalabel/DFOS's Artist Corporations (A-Corp) model to The ZAO's artist tokenization and WaveWarZ pipeline. Separate the legal structure (Colorado statute) from the business philosophy (creative ownership as default), and decide what ZAO adopts now vs later. Grounded in the two forwarded Metalabel newsletters plus the public A-Corp record.

## Key Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **A-Corp philosophy aligns with ZAO's thesis; ADOPT it as the mental model for artist-first infrastructure.** The Metalabel insight is structural, not about tokens: make creative ownership the default in legal and economic design. | USE A-Corp as the north-star reference when framing artist control in any new vehicle, funding mechanism, or artist agreement. Filing an actual Colorado A-Corp matters far less than internalizing "51% stays with creators" as non-negotiable. |
| 2 | **Do NOT wait for the Colorado A-Corp filing window (2027) to move on artist tokenization.** The philosophy is usable now; the legal entity is a later option. | PROCEED with tokenization and artist agreements on the current timeline (doc 724). Encode the A-Corp mental model into consent language: voting control + economic-rights separation. |
| 3 | **FRAME tokenization as norm-shifting ("artists keep ownership by default"), not "ZAO invented decentralized music."** The "Obsession" example shows A-Corps solve a norm problem, not a tools problem. | Update artist-facing pitch docs to lead with "you own your work," not "you get tokens." |
| 4 | **WATCH the Colorado A-Corp as a future vehicle for The ZAO's missing legal entity** (doc 804 flags ZAO has no legal person yet). | Pre-register at artistcorporations.com for filing updates; reserve the form-vs-not decision until Colorado publishes forms (expected July 1, 2027). Flag any Maine/Delaware copycat law. |

## What an A-Corp Is

An Artist Corporation is an LLC variant created by the Colorado Artist Company Act (Senate Bill 26-133), signed June 2, 2026, effective August 12, 2026. It bolts artist-protective defaults onto Colorado's existing LLC statute. The three irreducible rules:

1. **51% artist voting control, locked in statute.** Creators must hold at least 51% of voting securities at all times; an operating agreement cannot override it. Outside investors can fund but cannot take governance control.
2. **IP reverts to creators on dissolution.** Work assigned to the A-Corp keeps an automatic reversionary interest; creditors cannot seize it, non-artist investors cannot claim it.
3. **Economic rights separate from voting rights.** Investors can hold distributions, royalties, and revenue participation with zero voting power - by default, not custom drafting.

First A-Corps expected early 2027; Colorado Secretary of State must publish fill-in-the-blank forms by July 1, 2027. Driven by the Artist Corporations Foundation (Yancey Strickler, ex-Kickstarter, founder of Metalabel; and Lena Imamura). Reported 4,000+ artists pre-registered before the law passed.

## The "Obsession" Worked Example

The forwarded DFOS newsletter ran the numbers on the indie horror film "Obsession":
- Budget: $750,000
- Acquired by Focus Features out of Toronto for $14-15 million
- Box office: $200+ million global
- The Art Director (below-the-line crew) netted ~$6,700 total and shared none of the upside.

Under an A-Corp: 51% voting control stays with the creative leads even after a $14M acquisition; economic/voting separation makes fractional crew equity a standard default (1% of a $200M box office = $2M). The A-Corp does not mandate crew participation; it makes the participation template cheap and standard so the question flips from "should we cut the crew in?" to "why wouldn't we?" The insight: A-Corps solve the norm problem, not the tools problem. Fractional crew equity was always legally possible; what was missing was the default assumption and an off-the-shelf template.

## Comparison: A-Corp vs Traditional Label vs ZAO Tokenization

| Dimension | Traditional Label | A-Corp Artist Collective | ZAO Tokenization Model (doc 724) |
|-----------|-------------------|--------------------------|----------------------------------|
| Artist voting control | None by default | 51% locked in statute | Artist retains on-chain voting via Respect; external holders get non-voting revenue shares |
| IP ownership | Label owns master + composition | Artist retains IP; A-Corp licenses only; reverts on dissolution | Artist owns master; tokenizes fractional revenue shares only |
| Economic vs voting | Tiered advances + royalties | Fully decoupled by default | Decoupled: revenue shares separate from Respect voting |
| Time to fair setup | 18+ months, $50K+ legal | ~30 days, template, ~$1-2K | ~1 week, 1-page consent agreement, renewable term |
| IP reversion on entity death | Locked in label vaults | Automatic to creator | Artist never transferred ownership; no reversion needed |
| ZAO alignment | Old model | HIGH (philosophical north star) | HIGH (current operational model) |

Note: specific ZAO split figures and mechanisms above are as described in doc 724 and should be confirmed against that doc before external use.

Key insight: the A-Corp and ZAO tokenization are not competitors. The A-Corp is a legal/structural philosophy; ZAO tokenization is an economics + governance implementation. An artist could sit inside an A-Corp AND hold ZAO artist tokens in parallel - legal IP protection plus on-chain community participation.

## How A-Corps Map to ZAO

1. **WaveWarZ artist pipeline (doc 724):** ZAO's planned tokenization already embodies A-Corp philosophy without the Colorado entity - artist opt-in only, renewable term, economic/governance split, master ownership stays with artist. Absorb Metalabel's framing: rebrand as "artist ownership + community participation," and state explicitly in consent agreements that the master reverts to the artist (ZAO is distributor, not rights-holder).
2. **ZABAL governance as an ecosystem "51% floor":** ZABAL/Respect voting already locks community voting control at the protocol level; the A-Corp is the legal-world analog. Marketing angle: "Colorado passes A-Corp law for legal structure; The ZAO ships A-Corp economics on-chain."
3. **ZAOstock and festival collectives:** if a festival or multi-artist collective incorporates in 2027+, evaluate an A-Corp as the entity vehicle. The repo touchpoint is `community.config.ts`, which holds entity and contract references today.

## Also See

- [Doc 804 - Colorado Artist Company Act (A-Corp)](../../business/804-colorado-artist-corporation-acorp/) - the legal/statutory mechanics and ZAO entity planning.
- [Doc 724 - ZAO Artist Tokenization on Avalanche](../../business/724-zao-artist-tokenization-on-avalanche-plan/) - the operational tokenization plan this doc maps onto.
- [Doc 029 - Artist Revenue and IP Rights](../../business/029-artist-revenue-ip-rights/) - foundational thesis on artist economics.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pre-register at artistcorporations.com for Colorado SoS filing + foundation updates | @Zaal | Web signup | This week |
| Audit artist consent agreements (Cipher Release, WaveWarZ templates) for A-Corp language: artist retains control, economic/voting split, IP reversion on ZAO dissolution | @Zaal | Docs review | After Cipher approval (doc 724) |
| If Colorado publishes A-Corp forms (expected July 1, 2027): have counsel assess as a ZAO entity vehicle | @Zaal | Legal | Q3 2027 |
| Watch for Maine/Delaware artist-company copycat bills | @Zaal | Watch list | Quarterly through 2027 |

## Sources

- Metalabel Studios newsletter "Life in the forest" (Jun 10, 2026), forwarded to ZOE inbox [FULL - body read from saved inbox JSON: A-Corps framing, DFOS update, Obsession economics]
- Artist Corporations (DFOS) newsletter "How 'Obsession' would fare as an A-Corp" (Jun 8, 2026), forwarded to ZOE inbox [FULL - Obsession case ($750K budget, $200M+ box office, ~$6,700 Art Director pay), A-Corp mechanics]
- [artistcorporations.com](https://www.artistcorporations.com) [FULL - definitions, signups, timeline, three core mechanics]
- [blog.metalabel.com](https://blog.metalabel.com) [FULL - ongoing A-Corp coverage, Strickler essays]
- [Frieze "Can A-Corps Save the Struggling Artist?"](https://www.frieze.com/article/can-a-corps-save-struggling-artist) [PARTIAL - URL confirmed live, full text access blocked; headline + metadata only]
- ZAO docs 804 / 724 / 029 (internal) [FULL - cross-referenced for ZAO mapping; verified to exist on disk 2026-06-17]
