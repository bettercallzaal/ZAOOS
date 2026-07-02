---
topic: governance
type: decision
status: research-complete
last-validated: 2026-07-01
related-docs: 877, 835
original-query: "ZAO Protocol overnight research brief - ground the whitepaper's incentive/monetary-policy section AND the burn/decay governance proposal. Monetary policy for merit - the reputation equivalent of Bitcoin's issuance schedule."
tier: DEEP
---

# 935 - Monetary Policy for Merit (Respect burn/decay research foundation)

> **Goal:** Ground the ZAO whitepaper's incentive/monetary-policy section + the burn/decay governance proposal. North star: the reputation equivalent of Bitcoin's issuance schedule. Every finding is judged by: does it make the "monetary policy for merit" claim more defensible or more novel?
>
> 7 deep-research threads (P0-A..P2-G), each dispatched as an independent agent. Verdicts below feed a votable proposal (Banked/Active split + decay rate + participation signals + grace).

## System primer
Members earn **Respect** (non-transferable) via fractal contribution, ranked each period on a golden-ratio Fibonacci ladder (top ranks 55/34/21/13/8/5). Issuance scales Y1=1x, Y2=2x, Y3=3x (inflationary, unbounded). Today: 2 years minted, no decay, no burn. Real money flows through POIDH bounty pots on Base, currently **not** gated by Respect. Thesis: the protocol unbundles the record label; Respect is the difficulty score that **routes** the payout, it is not the payout.

## The consolidated proposal (what the research says to vote)

| Design lever | Recommendation | Source thread |
|---|---|---|
| **Structure** | **Banked** (lifetime, never burns, = legacy/rank/membership) + **Active** (decays, = governance weight + bounty access) | P0-A |
| **Decay rate** | **180-day trailing half-life** (λ=0.00385/day). NOT compounding 50%/mo (1-month half-life = guillotine). One-time 50% haircut = softer "mercy" alt. | P0-B |
| **Framing** | Decay as **recency proof / security**, never "penalty" | P0-A |
| **Participation (stops decay)** | Multi-signal, **ANY of**: fractal attendance OR judged bounty ship OR 2-peer EAS attestation | P1-F |
| **Grace** | **Earned grace tokens** (2/yr, only earnable while active) + first-miss amnesty + 1/quarter cap. NOT Duolingo buyable freezes. | P0-C |
| **Y3 migration** | The Banked/Active split answers it: 2 years of no-decay Respect -> **Banked** (no purge, no aristocracy); Active starts fresh so old Respect confers standing but not current power. | P0-A/P0-B synthesis |
| **Buildability** | Ship today off-chain: Safe multisig judges POIDH on Base, gated by a Snapshot strategy reading cached Respect. No bridge. | P1-D |
| **Novelty** | Flag is plantable: first to model reputation issuance+decay as explicit monetary policy. | P2-G |
| **Problem statement** | 15-30% (label) vs ~85% (indie) payout gap = the middleman tax. | P1-E |

---

## P0-A - Prior art: decaying non-transferable reputation
**Verdict:** Decay is net-positive **if framed as fairness/security, not penalty**; the Banked/Active split is the validated winner.
- **Gitcoin Passport:** stamps expire at **90 days**; 2M+ users, framed as anti-sybil security, zero burnout complaints.
- **Coordinape:** GIVE **100% resets each epoch** (~monthly); users praise the reset as fairness (prevents hoarding).
- **Colony:** reputation decays **50% per ~90 days** (λ ≈ -0.0077/day), unchanged since 2018; alive, no public adoption metrics.
- **SourceCred:** cred (decaying reputation) vs grain (payout) split - nearly our Banked/routing model. **Wound down 2022**; killed by PageRank complexity, NOT the split. The split architecture was sound.
- **Otterspace:** seasonal/expiring badges; alive, sparse data.
- **So-what:** separate penalty-aversion (Banked never burns) from legitimacy (Active = recency proof). Frame like Gitcoin (security), align resets to the monthly governance cycle. Confidence: high.

## P0-B - Decay math + half-life
**Verdict:** Compounding 50%/mo is member erasure (1-month half-life, 3.5x faster than Colony's live 3.5-month); one-time haircut is recoverable; 180-day window is the Goldilocks.
- Exponential decay: `R(t) = R0 * e^(-λt)`, `half_life = ln(2)/λ`.
- λ values: 90-day = 0.00770/day; **180-day = 0.00385/day**; 365-day = 0.00190/day. Compounding 50%/mo: `R(t)=R0*(0.5)^t` (t in months), λ = ln(2) ≈ 0.693/month.
- **3-yr survival of an inactive Y1 55-Respect holder:** no decay 100% | one-time haircut 50% | 180-day 2% | 90-day 0.02% | compounding ~0%.
- **Issuance dilution alone** erases Y1 founders ~5x in 3 years (55 = 5.5% of supply Y1 -> 0.92% by Y3). So inflation does most of the relative-weight work; the burn is the accelerator.
- **Bitcoin inversion (paper north star):** BTC = capped stock-of-wealth (21M cap, halvings, 3.125 BTC/block in 2024, ~94% issued). Respect = uncapped decaying flow-of-merit measuring current relevance. "Your Respect fades because Respect is not Bitcoin - it measures what you do now, not what you banked." Confidence: high.

## P0-C - Grace mechanisms
**Verdict:** Earned grace tokens (tied to activity) + Cosmos-style time-lock; do NOT copy Duolingo.
- **Contrarian catch:** Duolingo freezes are **buyable** (200 gems) - hold a streak forever contributing nothing. Wrong for merit.
- **Recommended:** ~2 grace tokens earned per active year, each = 30-day absence immunity (can't earn while absent = no stockpiling). First-miss amnesty (auto-grant 1, one-time). 1 activation/quarter cap. Optional 21-day Cosmos-style lock during declared leave (access pauses, auto-resumes).
- **So-what:** loyal contributor banks grace by being active, then spends it on the quiet month (newborn/surgery/sabbatical). Confidence: high.

## P1-D - Routing Respect -> POIDH bounties (buildability)
**Verdict:** Buildable today. Thinnest path is off-chain, no bridge.
- Respect: OG ERC-20 (Optimism, frozen) + ZOR ERC-1155 (Optimism, active). POIDH v2: `0x5555Fa783936C260f77385b4E153B9725feF1719` (Base, verified). POIDH judging is contributor-weighted, no external eligibility hooks.
- **Thin path:** cron reads Optimism Respect -> Supabase cache (reuse leaderboard.ts) -> ~50-line Snapshot strategy weights a **Safe multisig on Base** that judges POIDH claims. Gate judging at Curator tier (500+), claim submission permissionless. ~1-2 hrs, zero new contracts, ~$0.10-0.50/execution.
- **On-chain upgrades later:** EAS resolver on Base (`0x4200...0021`) gating claims (2 wks), Hats + ERC-1155 bridge (4 wks), or a POIDH v3 fork (6 wks, v3 in dev, no ETA). Confidence: high.

## P1-E - Label-unbundling thesis (problem statement)
**Verdict:** The bundle is fragmenting in real time; the extraction gap is the undeniable stat.
- **Sharpest stat:** major-label artist nets **15-30% of Spotify payouts; indie on DistroKid keeps ~85%.** 55-70 point middleman tax.
- Independents ~38% global share, ~40% of new releases. Per-stream flat/declining ($0.003-0.005 Spotify). Four bundle components (capital / distribution / A&R-credentialing / marketing) each unbundling; credentialing (the piece Respect replaces) going to community/algorithmic signal.
- **Discipline flag:** headline 15-30 vs 85 and per-stream are well-sourced; verify derived figures (exact market shares, "8.6x capture") against IFPI/Billboard primaries before printing. Confidence: high on the core gap.

## P1-F - Participation definition + anti-gaming
**Verdict:** Multi-signal (ANY of attendance / judged ship / 2-peer attestation), rated by cost-to-fake.
- Attendance alone ~$0 to fake (one Zoom login); DAO turnout is structurally 5-10%. Judged bounty ship = high fake-cost (KYC + judge review + labor). 2-peer EAS attestation = medium ($2-10 + collusion). Multi-signal (Gitcoin model) cuts sybil ~90% vs attendance-only.
- **So-what:** "participation is what you ship, not where you sit." Require a 2-peer quorum to kill single-account collusion; EAS attestations are free on Base (dovetails with P1-D). Confidence: high.

## P2-G - Novelty of "monetary policy for merit"
**Verdict:** Largely novel; the flag is yours to plant.
- Closest prior: **a16z (2024)** reputation framework - says reputation needs "monetary management" (issuance + decay + policy levers) but treats it as toolkit, not doctrine. **SourceCred** had issuance+decay but called it "contribution attribution." **Arthur Brock / MetaCurrency (2014)** - "reputation must stay orthogonal to money" - reframe as **ally**: our non-transferable, routes-money-not-is-money design honors orthogonality while adding monetary-policy discipline.
- **Plantable claim:** first to model reputation supply (issuance + decay) as explicit monetary policy, with Bitcoin's schedule discipline as the governance template. Confidence: high on framing novelty.

## Precedent master table
| System | Non-transferable? | Decay type | Rate/half-life | What stopped decay | Outcome |
|---|---|---|---|---|---|
| Gitcoin Passport | Yes | time expiry | 90 days | re-verify stamp | thriving (2M+, anti-sybil) |
| Coordinape | Yes | epoch reset | 100%/~month | new epoch GIVE | thriving |
| Colony | Yes | exponential | 50%/90d | new contribution | alive, no metrics |
| SourceCred | Yes | graph revaluation | continuous | activity | dead 2022 (complexity) |
| Otterspace | Yes | badge expiry | seasonal | re-issue | alive, sparse |
| Cosmos (staking) | n/a | unbonding lock | 21-day | rebond | live at scale |

## Next Actions
| Action | Owner | Type | Gate |
|---|---|---|---|
| Draft the burn/decay proposal with votable options (Banked/Active + 180d vs one-time + grace + multi-signal participation) | Zaal | Governance | fractal vote |
| Verify P1-E derived stats vs IFPI/Billboard primaries before whitepaper print | Zaal | Research | primaries only |
| Prototype Safe + Snapshot Respect-gated POIDH judging on Base testnet | Dev | Build (later) | mock Respect data |
| Confirm POIDH v3 ETA with Kenny if betting on native integration | Zaal | Outreach | - |

## Sources
Primary per thread (FULL unless noted): Gitcoin Passport docs (expirations), Coordinape, Colony reputation whitepaper + docs, SourceCred wind-down post (discourse), Otterspace docs, Cosmos unbonding docs, Duolingo streak-freeze mechanics, POIDH v2 Basescan `0x5555…1719` + GitHub, EAS on Base docs (`0x4200…0021`), Hats Protocol docs, Snapshot strategy docs, Safe docs, a16z "Reputation-Based Systems" (2024), Arthur Brock "Reputation is Orthogonal to Exchange" (2014), BlockScience token-engineering, MeritRank (arXiv 2207.09950), IFPI/Billboard/Statista 2025-26 music-industry data, Bitcoin supply schedule. Full memos + math in agent transcripts (7 threads, 2026-07-01).
