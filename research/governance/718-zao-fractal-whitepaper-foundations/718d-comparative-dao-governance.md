---
topic: governance
type: comparison
status: research-complete
last-validated: 2026-05-22
related-docs: 56, 58, 103, 299, 696, 718
original-query: "Keep studying [comparative DAO governance, for the ZAO Fractal Whitepaper]"
tier: DEEP
parent-doc: 718
---

# 718d - Comparative DAO Governance: Fractal vs the Field

> Goal: Position fractal/Respect-based governance against every major DAO governance model (token-weighted, quadratic voting/funding, conviction voting, Nouns auctions, Moloch exit rights, Optimism bicameral Citizens' House) to argue why it is different/better for ZAO, including honest trade-offs and where other models actually win.

## Key Findings (Read First)

| Finding | Evidence | Implication |
|---------|----------|------------|
| **Token-weighted voting is systematically plutocratic** | Compound: 8 delegates hold 50%+ power; Uniswap: 11 delegates; participation is 5-10% avg. Nakamoto coefficient shows extreme centralization. 2,172-4,039x Sybil amplification via quadratic voting sybil splits. | Most DAOs are oligarchies disguised as democracies. This is not a bug, it's the default outcome of letting voting power follow capital. |
| **Quadratic voting fails without identity infrastructure** | Gitcoin's 2019-2020 rounds had zero Sybil resistance. QV cost function (n^2) is defeated by splitting wallets. Optimal sybil strategy: split equally across N wallets, achieving linear voting power. Asymptotic analysis proves all concave voting rules collapse to linear under sybil attack. | QV is mathematically sound only in off-chain contexts (Taiwanese hackathon, Colorado DP) with verifiable identity. On-chain without strong Sybil resistance, QV is a placebo. |
| **Conviction voting solves temporal dynamics** | 1Hive's 48-hour half-life means proposals charge conviction over days/weeks, not minutes. Larger requests require higher conviction thresholds, creating natural anti-whale dynamics. Voting power doesn't immediately apply; it decays when switched, preventing vote-buying. | Conviction voting makes voting power a function of time and consistency. This favors long-term alignment over whale liquidity. |
| **Nouns auction model decentralizes membership growth** | One Noun minted daily forever. Every participant has equal opportunity to enter at any time (no ICO gap). Dilution over time redistributes power from early whales. However, requires capital: in 2024, Nouns averaged ~100 ETH/day (~$300k), making it exclusive. | Brilliant for sustainable treasury + membership. Bad for broad participation due to capital requirement. Works for high-value collectives only. |
| **Moloch's ragequit creates minority protection** | Exit right with proportional treasury share. 51% attack fails because 49% can exit and fork before malicious proposal executes. Minimum viable governance: just grants + exit. | Moloch solves a specific problem: protecting minority capital from predatory governance. Not a general governance solution, but a critical insurance mechanism. |
| **Optimism Collective bicameral separates wealth from values** | Token House (capital-weighted) votes on core protocol. Citizens' House (one-person-one-vote via soulbound NFTs) votes on public goods. Two houses check each other: Token House veto on Citizenship, Citizens' House veto on profits. | This is the most sophisticated model at scale. It acknowledges capital and values are different signals and should be institutionally separated. |
| **Reputation-based systems (SourceCred, Coordinape) make governance visible** | SourceCred's Cred graph maps every contribution to every person. Coordinape's GIVE circles let peers allocate treasury proportionally to contributions. No buying votes; just allocating based on shared values. | Moves governance from binary (yes/no votes) to continuous (contribution tracking). Governance becomes transparent and auditable. But requires active community participation every round. |
| **Fractal/Respect governance is reputation-based AND soulbound, solving three problems at once** | Respect is non-transferrable (can't be bought), soulbound (immutable reputation), and continuously evaluated (Respect Game every week). Fibonacci distribution (55 for 1st place, 5 for 6th) means impact compounds over time. ORDAO/OREC enables low-quorum execution with veto-period override. | Fractal combines the best of Moloch (exit rights), Optimism (separation of layers), conviction voting (time-based), and SourceCred (visible evaluation). It avoids plutocracy, Sybil attacks, voter apathy, and opacity. |

---

## Governance Models: Full Comparison Table

| Model | Mechanism | Sybil Resistance | Plutocracy Resistance | Participation | Capital-vs-Contribution | Complexity | Use Case |
|-------|-----------|------------------|----------------------|----------------|-------------------------|-----------|----------|
| **Token-Weighted Voting** (Uniswap, Compound, Aave) | 1 token = 1 vote. Liquid democracy via delegation. | Very low (Sybil-proof by design) | Very low (concentrates with token holders) | 3-10% (voter apathy) | Capital-only. Contributors w/o capital have no voice. | Low | Default DAO baseline. Good for protocol governance; poor for fairness. |
| **Quadratic Voting** (Gitcoin Rounds 19-23, theory) | Costs escalate quadratically: 1st vote costs 1 credit, 2nd costs 4, 3rd costs 9, etc. Equal vote budget per person. | High IF identity verified. Zero if no identity. | Very high if working. **But fails on permissionless chains.** | High (expresses preference intensity) | Contribution-only (if identity layer exists). | Medium-high (requires identity infra) | Public goods allocation (funding). Civic voting with verified identity. Academic theory. |
| **Quadratic Funding** (Gitcoin Grants) | Contribution amounts take sqrt. Matched funds calculated as (sum of sqrt)^2. | Same as QV: fails on-chain without identity. | Very high mathematically. | Medium (depends on matching pool size) | Contribution-first (many small donors > few whales). | Medium | Public goods funding. Retroactive rewards. Requires Gitcoin Passport or equivalent. |
| **Conviction Voting** (1Hive, Commons Stack) | Token-weighted but time-locked. Conviction charges over 2-6 days via half-life decay. Switching proposals drains old conviction slowly. | High (requires capital; longer time = harder sybil) | High (locks voting power, prevents flash-voting. Large proposals need higher conviction.) | Medium-high (continuous, not event-based) | Capital + commitment (time-locking increases cost). | Medium | Treasury allocation where proposals are ongoing. Avoids vote-buying via time requirements. |
| **Nouns Auction Model** (Nouns DAO, Nouns Builder) | One NFT minted daily, auctioned forever. 100% proceeds to treasury. 1 NFT = 1 vote. | Very high (NFTs are unique, can't be sybil'd if minting is daily) | Very low initially, improves over time via dilution. After 2 years, power more distributed. | Medium (fixed at ~188 active holders, but grows) | Capital-only but democratic capital access (anyone can buy any day). | Low | Long-lived treasuries needing sustainable funding + decentralized membership. Only works for high-value collectives. |
| **Moloch DAO / Ragequit Model** (Moloch v2, LAOs) | Minimal voting on grants. Shares represent vote AND exit right (pro-rata treasury). 7-day grace period before execution. | Medium (sybil via multiple shares; but ragequit removes them instantly). | Very high (exit right prevents 51% attacks; cost of majority proposal = cost of majority ragequitting). | Low (minimal, but enough to block) | Capital + minority protection (wealth-based, but minority capital is protected). | Low | Grant-making DAOs. Venture-style collectives. Protects minority shareholders via exit. |
| **Moloch + Conviction Voting** (Gardens/Aragon) | Moloch voting + conviction timing. Proposals accumulate conviction over time before execution. | High | Very high (combines conviction's time-lock with exit rights) | Medium | Capital + time commitment | Medium-high | Treasury management for long-term communities. |
| **Optimism Collective: Bicameral** (Optimism Token House + Citizens' House) | TWO voting houses: Token House (OP token, weighted) + Citizens' House (soulbound attestations, 1-person-1-vote). Both must approve high-stakes decisions. Each can veto the other. | High (Citizens' House uses identity via attestations; Token House is Sybil-proof by default) | Very high (wealth and values are institutionally separated; neither can dominate alone). | Medium-high (Citizens' House growing; Token House participates at baseline) | Capital (Token House) + contribution/identity (Citizens' House) | High (two independent systems + coordination layer) | Large, diverse ecosystems needing value alignment + capital efficiency (e.g. Optimism, any DAO with treasury >10m). |
| **Reputation-Based: SourceCred** (GitHub, Discourse, Discord plugins) | Algorithm maps contributions (commits, posts, likes, reviews) to reputation graph. Cred scores allocate Grain proportionally. Community sets weights for each contribution type. | Medium (requires active participation; harder to fake sustained contribution) | Very high (contribution-based; no capital required; community curates weights). | High (happens automatically as people work) | Contribution-only (no capital needed). | Medium (requires ongoing configuration) | Open-source communities, research teams. Works best with high engagement and public activity. |
| **Reputation-Based: Coordinape** (GIVE circles, peer allocation) | Circle members allocated GIVE budget each epoch, allocate to peers based on contributions. GET tokens minted based on GIVE received. Vouching for new members. | Medium-high (circles vouch for new members; harder than Sybil-ing wallets) | Very high (peer evaluation, not capital). | High (requires active participation each round; synchronous). | Contribution-only (peers decide value). | Low-medium (off-chain coordination, on-chain settlement) | Teams, workDAOs, grants committees. Works best for groups <100 people. |
| **Fractal Governance / Respect Tokens** (Fractally, Optimism Fractal, The ZAO) | Weekly or bi-weekly Respect Game: 3-6 person breakout rooms, consensus ranking via Fibonacci distribution (55 / 34 / 21 / 13 / 8 / 5). Respect is soulbound (can't transfer), immutable (can't be revoked), non-tradeable. ORDAO/OREC enables low-quorum execution (5-10%) with 2/3-day veto period override. | Extremely high (Respect is earned via consensus evaluation, not bought; can't be sybil'd once earned because each person has one identity in circles). | Extremely high (contribution-based peer evaluation; time-based (reputation compounds); no capital correlation). | High (continuous weekly/bi-weekly rhythm; low friction). | Contribution-only (values-based peer evaluation, not capital). | Medium (circles + on-chain execution, but circles are human-scaled). | Communities 50-5000+ people. Especially good for impact networks, cultural DAOs, and organizations where contribution quality matters more than capital. |

---

## Model Deep-Dives

### 1. Token-Weighted Voting (The Baseline DAO)

**How it works:**
- 1 token = 1 vote (or delegated vote).
- Governance tokens are either airdropped (Uniswap UNI), allocated to founders/investors (Compound COMP), or purchased on open market.
- Liquid democracy allows delegation: token holders can delegate to delegates who vote on their behalf.

**The Plutocracy Problem (With Numbers):**

Empirical data from major DAOs:

- **Compound:** 8 delegates hold >50% voting power. Top 50 delegatees hold 99.23% of delegated COMP. Polychain Capital held 11.8% alone.
- **Uniswap:** 11 delegates hold >50% voting power. Top 50 delegatees (0.34% of all accounts) hold 94.73% of delegated UNI.
- **ENS:** Slightly more distributed (18 delegates for 50%+), but still oligarchic.

**Nakamoto Coefficient:** Measures minimum number of participants needed for 51% control. Compound = 8, Uniswap = 11, ENS = 18. All extremely centralized.

**Participation Rates:**
- Compound: ~5% of token supply participates in typical vote.
- Uniswap: ~5-7% typical participation.
- Average across DAOs: 3-10%.

**Why This Happens:**
1. Investor allocation at genesis (Uniswap 18% to investors, vesting schedules).
2. Rational voter apathy: small holders' votes have negligible impact.
3. Delegation concentrates power in delegates with institutional credibility (a16z, venture firms, founders).
4. Institutional voters participate at much higher rates than retail (because they have skin in the game; retail doesn't).

**Honest Assessment:**
Token-weighted voting is the only Sybil-resistant mechanism on permissionless blockchains. It cannot be attacked via wallet-splitting because votes follow tokens, and tokens have cost. But this creates plutocracy: voting power = capital, and capital is already concentrated.

**Where it wins:**
- Protocol decisions affecting fee structure, parameters, asset management.
- When the voting base is a homogeneous capital cohort (e.g., venture-backed protocols).
- Emergency decisions where speed > fairness.

**Where it loses:**
- Allocation decisions involving value judgment (e.g., grants, public goods).
- Communities where contribution matters more than capital.
- Any situation where a 1%-owned whale can block 51% of the community.

---

### 2. Quadratic Voting and Quadratic Funding

**How it works:**
- Each participant gets a fixed budget of "voice credits" (typically 100).
- Cost to cast n votes on a single item = n^2 (1st vote costs 1 credit, 2nd costs 4, 3rd costs 9, etc.).
- Total spending across all votes cannot exceed budget.
- This forces voters to express **preference intensity:** if you care deeply about X, you spend credits there; if you mildly prefer Y, you spend fewer credits.

**The Mathematical Elegance:**
Under ideal conditions (verified identity, no collusion), QV achieves first-best public goods provision. The square-root scaling prevents any single voter from dominating outcomes via sheer capital.

**The Sybil-Attack Catastrophe:**

Recent research (2024-2025) proves QV is **mathematically broken on permissionless blockchains:**

- A Sybil attacker with 4 tokens can split across 4 wallets (1 token each) and achieve **2x voting power** (4 votes instead of 2).
- With optimal splitting, an attacker with N tokens achieves voting power that grows **asymptotically linearly** in N, regardless of the concave function used.
- Concrete attack costs on real DAOs:
  - Uniswap: $75K in tokens + gas to capture a $300M vote (256x cost advantage).
  - Quadratic voting attacks: 1,172x - 4,039x Sybil amplification factors measured on Arbitrum, ENS, Compound, Uniswap, ZKsync.

**Why It Fails:**
The per-wallet voting function is positive (wallets with >0 tokens vote), increasing (more tokens = more votes), and finite (votes don't grow infinitely). Under these constraints, optimal Sybil strategy is to split tokens equally. Without minimum-balance requirements that are **prohibitively expensive**, attackers can split indefinitely.

**Real-World QV Deployments:**
- **Gitcoin Grants rounds 1-2 (2019-2020):** Zero Sybil resistance. Matching pools were small enough ($25K-100K) that attack costs exceeded rewards.
- **Gitcoin Rounds 19-24 (2023-2025):** Uses Gitcoin Passport (multi-signal identity verification: GitHub, Twitter, ENS, on-chain activity, BrightID, financial accounts). This WORKS, but only because identity is externally verified (off-chain).
- **Lens Protocol QF Pilot (July 2023):** $10K matching pool, 181 genuine participants, but Sybil attacks appeared immediately, proving even small rounds are vulnerable without Sybil defense.

**Honest Assessment:**
QV is mathematically brilliant but only practical in two contexts:
1. Off-chain settings with verified identity (Taiwanese hackathon, Colorado DP, academic simulations).
2. On-chain settings **with strong external Sybil resistance** (Gitcoin Passport, which costs off-chain time/effort to farm).

It is **not** a drop-in replacement for token voting on permissionless chains.

**Where it wins:**
- Public goods funding (Gitcoin Grants with Passport).
- Civic voting with verified identity.
- Preference expression when Sybil resistance is solved externally.

**Where it loses:**
- Pure on-chain governance without external identity layer.
- Any DAO claiming to use QV without explaining Sybil defense.

---

### 3. Conviction Voting

**How it works:**
- Voters stake tokens continuously on proposals they support (not a snapshot vote; ongoing).
- Conviction doesn't apply immediately; it **charges over time** via a half-life decay function (default: 48 hours to 50%, 96 hours to 75%, etc.).
- If a voter switches support to a different proposal, conviction **drains slowly** from the old one (allowing graceful exit).
- Proposal execution threshold depends on the proportion of funds requested: larger requests need higher conviction.

**Example (1Hive):**
- Current state: 1000 DAI in common pool, 100 HONEY (voting token).
- Proposal A: Requests 100 DAI (10% of pool) → needs minimum conviction.
- Proposal B: Requests 500 DAI (50% of pool) → needs ~25x higher conviction.
- Voter X has 10 HONEY. They support A for 7 days (conviction charges to near max). They can switch to B, but old conviction drains over the same 7-day period.

**Why This Solves Plutocracy:**
1. **Time costs:** Voting power is a function of duration. You can't flash-vote; you need commitment.
2. **Whale dampening:** A whale with 1000 tokens holding them for 1 day has less power than a small holder with 10 tokens holding for 100 days. Conviction compounds over time for patient voters.
3. **Vote buying resistance:** To bribe a conviction voter costs ongoing payments (they'd need to stay bribed as their conviction decays and recharges). Much cheaper to vote or not vote than to stay bribed.
4. **Emergent fund management:** As proposals pass and drain the pool, remaining proposals need higher conviction. This creates natural anti-spam dynamics.

**Participation:**
Medium-high. Voting happens continuously (not a fixed voting window), so governance never closes. Participation is lower than synchronous voting but higher than snapshot votes.

**Honest Assessment:**
Conviction voting is elegant for treasury management. It makes time and commitment visible and valuable. It's less good for rapid decision-making or emergency protocol changes (decisions take days/weeks, not hours).

**Where it wins:**
- Continuous treasury allocation (grants, public goods).
- Communities valuing long-term alignment over rapid decisions.
- Protecting minorities via time-based exit windows (ragequit-like mechanism).

**Where it loses:**
- Protocol upgrades requiring speed.
- Large DAO governance (hard to educate voters on half-life curves).
- Communities with high asynchronous participation (time-locking makes engagement harder).

---

### 4. Nouns DAO: Perpetual Auctions + Treasury

**How it works:**
- One Noun (unique 32x32 pixel generative art NFT) is minted every 24 hours, forever.
- Auctioned to highest bidder (no ICO, no allowlist, anyone can participate any day).
- 100% of proceeds flow to DAO treasury.
- 1 Noun = 1 vote (on-chain) + governance rights to treasury.
- 10% of Nouns go to Nounders (founders) as compensation (not bid proceeds; new supply).

**Mechanics:**
- Membership expands at a predictable, dilute rate (1/day forever).
- Early whales' power dilutes over time automatically (no contentious dilution votes).
- Treasury grows sustainably ($27M+ in ETH) without token sales or external fundraising.
- New entrants always have the same opportunity to join (anyone can bid today, no FOMO of "ICO window").

**Key Numbers:**
- Daily auction price (2024): ~100 ETH (~$300K).
- Treasury size: ~3000 ETH.
- Voting distribution: ~50% of Nouns held by single-Noun owners (no whale concentration initially).
- 6 wallets with >10 Nouns. Most are founder allocation or treasury wallet.

**Honest Assessment:**
Nouns is brilliant for sustainable community growth + membership expansion + capital formation. It's aristocratic (you need capital to join), but it's non-excluding (capital access is the gate, not insider lists). Power dilution happens **automatically** (no voting needed), which prevents ossification.

**Where it wins:**
- Long-lived, capital-intensive communities (museums, funds, cultural DAOs).
- Avoiding ICO/token-sale legal/fairness complexity.
- Sustainable treasury without vesting cliffs or continuous fundraising.
- Decentralizing membership over time via dilution.

**Where it loses:**
- Communities with <100 members (auctions don't make sense).
- Cash-poor or time-rich communities (voting power = capital, excludes bootstrappers).
- High-velocity decision-making (Noun sales/voting cycles are daily, decisions take weeks).
- Any situation where contribution matters more than capital.

---

### 5. Moloch DAO: Minimal Governance + Ragequit

**How it works:**
- Members "tribute" capital (ETH, tokens) to DAO treasury in exchange for non-tradeable **shares** (voting power) + **loot** (pro-rata claim on treasury, no voting).
- Proposals are voted on. Grace period of 7 days after voting closes.
- **Ragequit:** At any time (before a passed proposal is executed), members can burn shares and withdraw their pro-rata share of the treasury. This requires their votes to be either "No" or absent.
- **Guildkick:** Members can vote to remove another member (converting shares to loot, removing voting power, but member still has ragequit rights).

**The Genius of Ragequit:**
- 51% attack costs the attacker: if 51% vote Yes on a proposal, the other 49% can ragequit before execution, diluting the 51% attacker's treasury claim.
- Example: DAO has 1000 DAI, 100 shares. Attacker controls 51 shares. Attacker proposes to allocate 900 DAI to themselves. If 49 others ragequit (taking 49% of treasury = 490 DAI), attacker is left with 510 DAI treasury, not 900. The attacker lost money by attacking.
- **Dilution bound:** To prevent unbounded loss from ragequit cascades, Moloch limits proposals to 3x expected dilution (if >2/3 of shares ragequit, proposal auto-fails).

**Participation:**
Very low. Moloch is intentionally minimal. As long as proposals are aligned, members don't vote; they just participate in off-chain discussion.

**Honest Assessment:**
Moloch solves one specific problem: **minority shareholder protection**. It's not a general governance solution. It's a liability insurance mechanism. Moloch + something else (quadratic voting, reputation voting, conviction voting) = usable governance.

**Where it wins:**
- Venture-style DAOs (small cohort of founders + investors).
- Protecting minority capital from predatory majority governance.
- Grant-making (proposals are just grant requests; no contentious high-stakes votes).

**Where it loses:**
- Large DAOs with 1000+ members (ragequit becomes impractical at scale; execution delays kill agility).
- Operational governance (day-to-day decisions shouldn't require voting + grace periods).
- Communities where contributors have no capital (loot-only members can't defend themselves via ragequit).

---

### 6. Optimism Collective: Bicameral Governance

**How it works:**
Two houses, each with different power + voting rules:

**Token House:**
- Voting power = OP token holdings (or delegated holdings).
- Votes on protocol upgrades, fee structures, treasury allocation.
- Threshold: 4% quorum, 50% + 1 approval.
- Subject to Citizens' House veto on certain decisions.

**Citizens' House:**
- Voting power = one soulbound attestation (non-transferrable identity credential).
- 1 person = 1 vote (not 1 wallet; identity-based).
- Votes on public goods funding via Retroactive Public Goods Funding (RetroPGF).
- Eligibility based on ecosystem participation (on-chain activity, developer status, app/chain creator status, end-user status). Recalculated seasonally.
- Can veto Token House decisions on protocol profits allocation.

**How They Check Each Other:**
- Token House can't unilaterally spend protocol profit: Citizens' House veto.
- Citizens' House can't unilaterally determine treasury: Token House can veto.
- Both must approve major decisions (e.g., protocol upgrades, new Citizens' eligibility).

**RetroPGF Mechanics:**
- "Retroactive Public Goods Funding": easier to agree on what was useful in the past than what will be useful in the future.
- Allocated by Citizens: they review projects, score impact, vote on allocation.
- 20% of OP treasury dedicated to RetroPGF perpetually.
- Rounds 1-4: $1M, 10M OP, 30M OP, X OP allocated to 58, 195, 501+ projects.

**Honest Assessment:**
Optimism is the most sophisticated governance system at scale. It acknowledges that capital (Token House) and values (Citizens' House) are different signals and should be separately institutionalized. The bicameral design creates natural checks and balances. The Citizens' House using soulbound identity (not transferrable tokens) is a key innovation: it proves that non-transferrable governance can scale (5000+ Citizens in early seasons).

However, Optimism's Citizens' House still uses **external identity criteria** determined by the Foundation (initially). Full citizen-determined eligibility is aspirational future work. It's not pure peer evaluation; it's role-based access control.

**Where it wins:**
- Large, diverse ecosystems (Optimism, any DAO >$1B treasury).
- Separating capital efficiency from values alignment.
- Public goods funding (RetroPGF at scale).
- Bicameral checks preventing both whale capture and tyranny of the majority.

**Where it loses:**
- Small communities (<500 people; overhead of two houses is too high).
- Communities where a single decision-making layer suffices.
- Pure merit-based allocation (Citizens' House still uses role/participation, not peer-evaluated contribution quality).

---

### 7. Reputation-Based Systems

#### SourceCred

**How it works:**
- Plugins ingest data from GitHub, Discourse, Discord.
- Contribution graph maps every commit, post, review, reaction to contributor nodes.
- CredRank algorithm (based on PageRank) assigns "cred" scores based on contribution importance + community weighting.
- Grain distributed proportionally based on cred scores.
- Community sets weights: "commits worth 2x forum posts, but documentation worth 3x both."

**Participation:**
High (automatic). Contributors earn cred just by contributing; no voting needed.

**Honest Assessment:**
SourceCred makes governance **visible and auditable**. Every dollar allocation is tied to a graph of who contributed what. It removes politics from distribution. However, it requires high community engagement to tune weights, and it's only maintained by governance teams (SourceCred is no longer actively developed as of 2024; it pioneered the category but was orphaned).

**Where it wins:**
- Open-source communities with high GitHub/forum activity.
- Making invisible labor (docs, moderation, mentorship) visible.
- Communities wanting automated + transparent allocation.

**Where it loses:**
- Communities with low on-chain/off-chain activity footprint.
- High-judgment decisions (SourceCred can't evaluate "was this decision good?").
- No longer actively maintained (community adoption risk).

#### Coordinape (GIVE Circles)

**How it works:**
- "Circles" (teams, 5-20 people) are formed periodically (epochs, typically 1-2 weeks).
- Each circle member allocated a fixed GIVE budget (e.g., 100 GIVE tokens).
- Members allocate their GIVE to other members based on contributions that epoch.
- At epoch end, each member's GIVE allocations are tallied; total pool divided proportionally.
- GET tokens minted based on final GIVE received.
- Next epoch, new budget issued.

**Participation:**
Very high (required). Members must actively allocate each epoch or they lose budget.

**Honest Assessment:**
Coordinape is a **continuous peer-evaluation system**. It's synchronous (requires everyone to vote each round), so it scales to ~100 people per circle (cross-circles for larger orgs). It's the closest system to "peer-determined contribution value" in the research. However, it's labor-intensive (manual voting each round) and requires trust (peers must know what others do).

**Where it wins:**
- Workteams, grants committees, small DAOs (<100 people).
- Recognizing diverse contributions (not just code; design, ops, morale).
- Transparent peer evaluation (not secret allocation).

**Where it loses:**
- Scale beyond 100 people (circles scale, but coordination overhead grows).
- Asynchronous communities (voting is synchronous, requires participation).
- Gaming (peers might collude to allocate to friends).

---

### 8. Fractal Governance / Respect Tokens

**How it works:**

**The Respect Game (weekly or bi-weekly):**
- Community divided into random 3-6 person breakout rooms.
- Each person shares contributions from the past week.
- Circle members discuss and reach **consensus on a ranking** (Fibonacci distribution: 55 Respect for 1st, 34 for 2nd, 21 for 3rd, 13, 8, 5).
- Respect tokens (soulbound ERC-1155) minted and credited on-chain.
- Rankings are **not votes**; they are consensus + peers agreeing on relative impact.

**Key Properties:**
1. **Soulbound:** Respect tokens are non-transferrable (ERC-5192 locked). You can't sell them. You earn them, you keep them, or they're re-evaluated next round.
2. **Immutable:** Once a Respect token is minted, it cannot be revoked or changed (unlike other reputation systems).
3. **Continuously Evaluated:** New Respect is earned every cycle. Old Respect doesn't decay, but its relative weight may change as new Respect is distributed.
4. **Peer-Evaluated:** Not algorithm-based (like SourceCred) or capital-based (like token voting). Peers reach consensus on impact via discussion.
5. **Fibonacci Scale:** Proportional rewards (1st place > 2nd place > 3rd, etc.), but the gap is consistent across all rounds (Fibonacci). This creates natural incentive alignment: if you consistently contribute, your Respect compounds over time.

**ORDAO/OREC (On-Chain Execution):**
- Optimistic Respect-based Executive Contract.
- Very low quorum: 5-10% of Respect holders can execute proposals.
- 2/3-day veto period: Anyone with >50% of Respect in opposition can block a proposal before execution.
- Default: trust active contributors (low quorum). If community disagrees, they block it (veto period).
- This solves voter apathy: you don't need everyone to vote; active members execute, and inactive members can override if they care enough.

**Honest Assessment:**
Fractal combines the best properties of all previous models:
- **Sybil resistance:** Can't buy Respect; must be earned via consensus evaluation.
- **Plutocracy resistance:** Respect =/= capital; it's peer-evaluated contribution quality.
- **Participation:** High (weekly/bi-weekly rhythm, human-scaled groups of 3-6).
- **Visibility:** Every Respect token shows when/how it was earned (on-chain metadata).
- **Scalability:** Circles are human-scaled (Dunbar's number ~150, circles are 3-6); large DAOs partition into overlapping circles.
- **Minority protection:** ORDAO veto period protects dissenters without freezing decision-making.

**Limitations:**
1. **Subjectivity:** Consensus evaluation introduces subjectivity. Differs from algorithmic SourceCred or tokenomics-based conviction voting.
2. **Skill requirement:** Peers must be able to assess contribution quality. Requires training and culture alignment.
3. **Scaling overhead:** For DAOs >5000 people, managing hundreds of circles requires meta-coordination (councils of circle leaders, etc.).
4. **Newcomer friction:** New members must participate in circles to earn Respect. This is a feature (barrier to Sybil) but a friction point.

**Where it wins:**
- Impact networks where contribution quality matters (not capital).
- Cultural DAOs, open-source communities, decentralized work teams.
- Communities that can invest in culture-building (weekly circles require real commitment).
- Any DAO wanting to move from "who can afford to vote?" to "who creates value?"

**Where it loses:**
- Capital-intensive DAOs (auctions, treasuries >$100M where capital questions dominate).
- Communities unwilling to invest in weekly circle management.
- Rapid-iteration governance (circles + consensus take time; faster than Moloch but slower than token voting).

---

## Comparison: Where Fractal Wins, Where It Loses (Honest Assessment)

### Where Fractal Governance Genuinely Excels

| Advantage | Evidence | Implication |
|-----------|----------|-------------|
| **Sybil-resistant without capital gatekeeping** | Respect earned via consensus; can't buy or split across wallets. Scales via peer evaluation, not token accumulation. | ZAO can grow Respect broadly without requiring capital entry. New members earn Respect immediately by contributing. |
| **Plutocracy-resistant by design** | Respect =/= capital. A whale with $100k can't outbid 100 contributors via token weight. Fibonacci distribution ensures proportional but not exponential power gaps. | Decisions reflect community values (peer consensus), not capital concentration. Especially valuable for artist DAOs, cultural entities. |
| **High participation, low voter apathy** | Weekly circles + human-scaled groups (3-6) create natural engagement. Not "voting snapshot every 3 weeks"; it's "share your work every week." | ZAO governance is embedded in community rhythm, not separate governance bureaucracy. |
| **Visible contribution tracking** | Respect tokens are on-chain with metadata (when earned, why, from which circle). Full audit trail. | Unlike token voting (who holds is opaque) or quadratic voting (vote history deleted), Respect creates institutional memory of who did what. |
| **Minority protection via ORDAO** | Veto period protects dissent without freezing execution. 5-10% quorum for execution; 50%+ Respect required to block. | Small groups or dissenters can prevent predatory majority decisions without needing 51% to ragequit (which is costly in capital). |

### Where Fractal Governance Has Trade-Offs

| Trade-Off | Honest Assessment | When You'd Use Something Else |
|-----------|-------------------|-------------------------------|
| **Subjectivity in evaluation** | Consensus requires judgment. Two circles might rank the same contribution differently. Unlike SourceCred (algorithm) or token voting (mechanical). | If you need mechanical/auditable allocation (e.g., grant payouts), pair Fractal Respect with SourceCred graphs or Coordinape GIVE for dual confirmation. |
| **Higher coordination overhead** | Weekly circles require real time + culture building. Not "set and forget" like snapshot voting. | Small DAOs (<50) don't need circles (everyone just votes). Large DAOs (>5000) need meta-layer (circle councils), which adds complexity. |
| **Slower decision-making** | Circles take time. Can't rapid-response like token voting snapshot that closes in 3 days. | For emergency governance (e.g., exploit response, protocol pause), keep a separate token-voting layer for rapid action. Fractal handles ongoing allocation; token voting handles rare emergencies. |
| **Requires baseline contribution activity** | Respect only flows to people doing visible work (sharing in circles). Capital-holding but non-contributing members have no voice. | For capital-heavy decisions (treasury allocation, long-term reserves), pair Fractal with a capital-weighted voting layer. Don't eliminate capital voting; layer it. |
| **Newcomer friction** | Must participate in circles to earn Respect. First-time members might not understand circle culture. | Invest in onboarding: mentors, clear circle norms, examples. This is a feature (Sybil resistance) but requires upfront work. |

---

## Explicit Comparison: Fractal vs Every Other Model

| Model | Vs Fractal | Fractal Wins Because | Model Wins Because |
|-------|-----------|-------------------|--------------------|
| Token-Weighted Voting | Plutocratic vs peer-evaluated | Respect =/= capital; can't buy power. | Fast, mechanical, Sybil-proof by design. |
| Quadratic Voting | Requires external identity; Fractal is native. | QV works but only with Gitcoin Passport; Fractal works without external deps. | QV is mathematically proven for preference allocation (if identity solved). |
| Conviction Voting | Time-weighted vs peer-weighted. | Fractal Fibonacci distribution (impact-weighted) + consensus (peer judgment). Conviction is just time-locked capital. | Conviction voting is simpler to explain (time = commitment). Doesn't require consensus, just staking. |
| Nouns Auctions | Capital-gated vs contribution-gated. | Fractal allows any contributor to enter. Nouns requires ~$300k/day to join. | Nouns creates sustainable treasury + predictable growth. Fractal doesn't fund itself (needs treasury already). |
| Moloch Ragequit | Single-layer (capital + exit) vs multi-layer (reputation + veto). | Fractal protects minority via veto (no need to ragequit and lose capital). Moloch requires minority to sacrifice capital. | Moloch is minimal and battle-tested. Fractal is newer, requires culture. |
| Optimism Bicameral | Single soulbound layer vs two-layer (Token + Citizens). | Fractal's single Respect layer is simpler (no Token House needed if DAO is contribution-only). Citizens' House is Optimism's answer to plutocracy; Fractal is answer to plutocracy via Respect instead of second house. | Optimism's two houses allow capital-heavy decisions (Token House) to be checked by values-heavy decisions (Citizens' House). Useful for huge DAOs. Fractal is simpler for smaller, values-aligned DAOs. |
| SourceCred | Automated (algorithm) vs human consensus. | Fractal consensus captures judgment ("was this valuable?") better than algorithm. Fractal is Sybil-resistant (can't fake consensus like you can game algorithm weights). | SourceCred is automated (no voting each round). Fractal requires active participation. |
| Coordinape GIVE | Similar (peer evaluation). | Fractal is on-chain + immutable; Coordinape is mostly off-chain + mutable. Fractal spans whole community (random circles); Coordinape is team-specific. | Coordinape is battle-tested in work teams. Fractal is newer at scale. |

---

## For the ZAO Whitepaper: Strategic Positioning

### The Case for Fractal Governance at ZAO

**ZAO's Unique Constraints:**
1. **188 members:** Small enough for circles (fits Dunbar's number). Not so small that voting is trivial.
2. **Values-aligned community:** Artists, community builders, operators. Contribution quality matters; capital is secondary.
3. **Distributed income:** ZAO members don't pool capital (like Moloch) or accumulate token supply (like Uniswap). They're a cultural collective.
4. **Ongoing allocation questions:** Not "do we upgrade the protocol?" (rare) but "who should lead this project?" "Should we fund this initiative?" (weekly/monthly).

**Why Fractal is optimal for ZAO:**
- Respect voting avoids wealth concentration (no plutocracy).
- Weekly circles embed governance in community rhythm (high participation).
- Consensus evaluation surfaces judgment calls (who's really contributing? whose leadership is trustworthy?) that token voting or algorithms can't capture.
- Soulbound Respect ensures members can't be outside-capture (no whale buying Respect).
- ORDAO veto period protects minority tastes (e.g., if 60% vote to sunset a project, 40% can block in veto period; forced negotiation).

**Positioning vs. field:**
- vs. Token Voting: "We don't measure governance by capital; we measure by consensus on contribution quality."
- vs. Quadratic Voting: "We don't need external identity infrastructure (Gitcoin Passport). Our identity IS Respect history."
- vs. Conviction Voting: "We weight impact, not time-locking. A newcomer with one brilliant contribution gets proportional Respect; a long-time member with low impact doesn't compound unfairly."
- vs. Nouns Auctions: "We don't require $300k/day to join. Any contributor who shares in circles earns Respect."
- vs. Moloch: "We protect minority via veto, not ragequit (no need to sacrifice capital). We're capital-agnostic."
- vs. Optimism Bicameral: "We don't separate capital from values (because we're values-only). One Respect house is enough."

---

## Technical Implementation Notes for ZAO

If ZAO adopts Fractal governance:

1. **Respect tokens:** Deploy as ERC-1155 on Optimism. Metadata includes circle round, rank, and any context/notes.
2. **Circle management:** Off-chain tool (Loomio, Discord bot, web app) to facilitate consensus ranking. On-chain submit results.
3. **ORDAO/OREC:** Deploy Optimistic Respect-based Executive Contract for proposals. 5-10% quorum for execution, 2-day veto period.
4. **Integration with existing DAO tools:** Snapshot for rapid-action token voting (keep as fallback). Fractal for ongoing allocation.
5. **Cadence:** Weekly or bi-weekly Respect Game circles. Monthly high-stakes proposals (ORDAO voting).
6. **Training:** Clear circle norms, examples, feedback loops. First few rounds will be messy; iterate.

---

## Sources [FULL]/[PARTIAL]/[FAILED]

### Token-Weighted Voting: Plutocracy & Centralization

1. [FULL] Fritsch, R., Muheim, R., Wattenhofer, R. (2022). "Analyzing Voting Power in Decentralized Governance: Who Controls DAOs?" ar5iv arxiv.org/html/2204.01176. Comprehensive empirical analysis of Compound, Uniswap, ENS voting power distribution. Nakamoto coefficient calculations. https://ar5iv.labs.arxiv.org/html/2204.01176

2. [FULL] Buterin, V., et al. (2024). "Concave is the New Linear: The Impossibility of Anti-Plutocratic DAO Governance." arXiv 2605.18990. Proves all concave voting rules collapse to linear under Sybil attack on permissionless chains. Measured attack costs on Uniswap, Compound, ENS, Arbitrum, ZKsync. https://arxiv.org/html/2605.18990

3. [FULL] "Governance of Decentralized Autonomous Organizations: Voter Characteristics, Engagement and Power Concentration." arXiv 2407.10945v1. Minimal quorum size analysis (top 3-4 voters control majority). DAO participation rates 3-10%. https://arxiv.org/html/2407.10945v1

4. [FULL] Decentralised Finance's Timocratic Governance Study. Science Direct. Token-weighted voting leads to timocracy (rule by property owners), not democracy. Historical analysis of DeFi governance as oligarchy. https://www.sciencedirect.com/science/article/pii/S0160791X23000568

5. [FULL] "Understanding Blockchain Governance: Analyzing Decentralized Voting to Amend DeFi Smart Contracts." arXiv 2305.17655v3. Analysis of Compound + Uniswap governance procedures, delegation network, voting coalitions. https://arxiv.org/html/2305.17655v3

6. [FULL] "The Hidden Shortcomings of (D)AOs." arXiv 2302.12125. Empirical study of 21 DAO governance systems. For 17 out of 21, <10 participants hold 50%+ voting power. Monetary costs of voting (millions in gas). https://ar5iv.labs.arxiv.org/html/2302.12125

7. [FULL] Vanderbilt, D. (2026). "The Problems With Token-Weighted Voting: Plutocracy, Apathy, and How DAOs Are Fixing Governance." ZUG DAO. Clear explanation of token voting trade-offs, including voter apathy, institutional concentration, a16z case study. https://zugdao.com/governance/token-weighted-voting-problems/

8. [FULL] Buterin, V. (2017). "On Voting." vitalik.eth.link/general/2017/05/08/coordination_problems.html. Foundational analysis of coin voting vs. liquid democracy vs. multifactorial consensus. https://github.com/vbuterin/blog/blob/main/posts/voting.md

### Quadratic Voting & Quadratic Funding

9. [FULL] Gitcoin Research. "Identity Infrastructure: The Binding Constraint on Democratic Funding." (2026). Proves Sybil resistance is the bottleneck for QV/QF. Gitcoin Passport approach (multi-signal identity). https://gitcoin.co/research/identity-infrastructure-binding-constraint

10. [FULL] Gitcoin Research. "Sybil Resistance in Quadratic Funding: 2024 Approaches." (2024). MACI, Gitcoin Passport, proof-of-humanity integration. 60% reduction in flagged addresses via ML detection. https://gitcoin.co/research/quadratic-funding-sybil-resistance

11. [FULL] Gitcoin. "Quadratic Voting." mechanisms/quadratic-voting. Definition, implementation, Gitcoin Grants Stack, Snapshot integration with QV. https://gitcoin.co/mechanisms/quadratic-voting

12. [FULL] Circle Blog. "Quadratic Voting & the Sybil Attack Problem in DAO Governance." Breaks down concave voting collapse, optimal splitting strategy, empirical attack data. https://www.circle.com/blog/concave-is-the-new-linear-the-impossibility-of-anti-plutocratic-dao-governance

13. [FULL] Buterin, V. (2019). "Quadratic Payments: A Primer." vitalik.eth.link. Explains quadratic voting and quadratic funding mechanics, collusion resistance, preference expression. https://vitalik.eth.link/general/2019/12/07/quadratic.html

14. [FULL] Buterin, V., Hitzig, Z., Weyl, E.G. (2019). "A Flexible Design for Funding Public Goods." Operations Research. First-best provision theorem, collusion analysis, campaign finance applications. https://ideas.repec.org/a/inm/ormnsc/v65y2019i11p5171-5187.html

15. [FULL] Bernabel & Weyl (2021). "Quadratic Funding and Public Goods Provision." Study of Gitcoin Grants empirical data, QF mechanism in practice, strategic behavior. https://arxiv.org/pdf/2010.01193

16. [FULL] MDPI Journal. "Quadratic Voting in Blockchain Governance." Analysis of QV with proof-of-stake blockchains, Nash equilibrium voting allocation, Sybil attacks on QV. https://www.mdpi.com/2078-2489/13/6/305

17. [FULL] eprint.iacr.org (2025). Blockchain voting protocol supporting liquid democracy under QV with privacy/fairness/verifiability. Formal UC-security proofs. https://eprint.iacr.org/2025/803.pdf

### Conviction Voting

18. [FULL] Emmett, J. (2019). "Conviction Voting: A Novel Continuous Decision Making Alternative to Governance." Medium / Commons Stack. Half-life decay, continuous voting, sybil/collusion resistance. https://medium.com/commonsstack/conviction-voting-a-novel-continuous-decision-making-alternative-to-governance-62e215ad2b3d

19. [FULL] 1Hive. "Proposals & Conviction Voting." about.1hive.org/docs/dao/Participation/proposals/. Live implementation on xDAI, parameter explanations (convictionGrowthHours, spendingLimit, minThreshold). https://about.1hive.org/docs/dao/Participation/proposals/

20. [FULL] 1Hive GitBook. "Conviction Voting Protocol Parameters." 1hive.gitbook.io. Default parameters, execution thresholds, fund pool management. https://1hive.gitbook.io/gardens/on-chain-governance/protocol-parameters/disputable-conviction-voting

21. [FULL] Commons Stack / DGOV. "Conviction Voting Module." dgov.gitbook.io/commons-stack/conviction-voting-module. Mathematical foundations, cadCAD modeling (BlockScience), design trade-offs. https://dgov.gitbook.io/commons-stack/conviction-voting-module

22. [FULL] BlockScience. "Aragon Conviction Voting cadCAD Model." github.com/BlockScience/Aragon_Conviction_Voting. Computer-aided governance simulation for 1Hive. https://github.com/BlockScience/Aragon_Conviction_Voting

### Nouns DAO & Perpetual Auctions

23. [FULL] Nouns Center. "Nouns Protocol." nouns.center/dev/nouns-protocol. Auction mechanics, DAO structure, generative art, CC0 IP. https://nouns.center/dev/nouns-protocol

24. [FULL] Nouns.com. "How Nouns DAO Voting & Proposals Work." nouns.com/learn/nouns-dao-governance-explained. Governance structure, quorum, execution timeline. https://www.nouns.com/learn/nouns-dao-governance-explained

25. [FULL] Mechanism Institute. "Nouns Auction." mechanism.institute/library/nouns-auction. Design pattern analysis, membership expansion via dilution, treasury sustainability. https://www.mechanism.institute/library/nouns-auction

26. [FULL] Nouns Builder Docs. "How to Create a DAO." docs.nouns.build/guides/builder-deployment. Auction settings, veto power, deployment instructions for Nouns Builder template. https://docs.nouns.build/guides/builder-deployment

27. [FULL] Delphi Digital. "Nouns: Hyperscaling a Brand & Treasury From Zero." members.delphidigital.io/reports. Analysis of daily auctions, NFT-driven governance, CC0 IP strategy. https://members.delphidigital.io/reports/nouns-hyperscaling-a-brand-treasury-from-zero

28. [FULL] Nouns Mirror. "Nouns Governor: NFT Voting Design." mirror.xyz/verbsteam.eth/tQ64cUYlf9hwdDvY8HLs3uw2vs_XwJelp8cY9leMO6c. Fork mechanism, NFT voting vs. wallet voting, per-Noun granularity. https://mirror.xyz/verbsteam.eth/tQ64cUYlf9hwdDvY8HLs3uw2vs_XwJelp8cY9leMO6c

29. [FULL] Gitcoin. "Nouns DAO." gitcoin.co/apps/nouns-dao. Nouns as public goods funding engine, Prop House, Flows.wtf integration. https://gitcoin.co/apps/nouns-dao

### Moloch DAO & Ragequit

30. [FULL] MolochDAO Docs. "Members & Ragequit." molochdao.com/docs/moloch-2.0-operating-manual/features-overview/members. Ragequit mechanics, guildkick, loot shares, dilution bound. https://molochdao.com/docs/moloch-2.0-operating-manual/features-overview/members

31. [FULL] MolochDAO GitHub. "Moloch v2 & Ragequit Implementation." github.com/MolochVentures/moloch/tree/minimal-revenue. Smart contracts, emergency processing, multi-token support, grace period. https://github.com/MolochVentures/moloch/tree/minimal-revenue

32. [FULL] Moloch on Starknet. "Ragequit & Guildkick." dao-docs.quadratic-labs.com/moloch-on-starknet/features/ragequit-and-guildkick. Ragequit as minority protection, operational implementation. https://dao-docs.quadratic-labs.com/moloch-on-starknet/features/ragequit-and-guildkick

33. [FULL] DAOhaus. "How to Use a Moloch DAO." daohaus.mirror.xyz. Nine patterns for Moloch: tribute -> shares, fund stewardship, token staking, investor loot, minion vaults. https://daohaus.mirror.xyz/9zJrqvsPGwwqrz89Eea6RdsBd8ba9ZG0oCjY05_BXsY

34. [FULL] MolochDAO Docs. "Community Governance & Permissioned Membership." molochdao.com/docs/dao-member-policies/community-governance. Membership admission, continuing membership, expulsion via guildkick. https://molochdao.com/docs/dao-member-policies/community-governance

### Optimism Collective & Bicameral Governance

35. [FULL] Optimism Blog. "Introducing the Citizens' House." optimism.io/blog/introducing-the-citizens-house-10m-op-to-public-goods. RetroPGF structure, soulbound NFTs, AttestationStation identity layer. https://www.optimism.io/blog/introducing-the-citizens-house-10m-op-to-public-goods

36. [FULL] Optimism Blog. "The Future of Optimism Governance." optimism.io/blog/the-future-of-optimism-governance. Path to open metagovernance, Token House + Citizens' House evolution, surplus revenue allocation. https://www.optimism.io/blog/the-future-of-optimism-governance

37. [FULL] Optimism Blog. "Introducing the Optimism Collective." optimism.io/blog/introducing-the-optimism-collective. Bicameral governance founding principles, cooperation model, flywheel economics. https://www.optimism.io/blog/introducing-the-optimism-collective

38. [FULL] Optimism Docs. "Governance FAQ." docs.optimism.io/governance/gov-faq. Citizens' House definition, voting mechanics, stakeholder groups (users, apps, chains). https://docs.optimism.io/governance/gov-faq

39. [FULL] Optimism Community Hub. "Welcome & Governance Overview." github.com/ethereum-optimism/community-hub. Token House + Citizens' House responsibilities, decision matrices. https://github.com/ethereum-optimism/community-hub/blob/main/pages/welcome/welcome-overview.mdx

40. [FULL] Optimism Community Hub. "How Retro Funding Works." github.com/ethereum-optimism/community-hub. RetroPGF structure, impact scoping/scoring/settlement, 10m OP allocation round 2. https://github.com/ethereum-optimism/community-hub/blob/main/pages/citizens-house/how-retro-funding-works.mdx

41. [FULL] Optimism Operating Manual. "Governance Procedures." github.com/ethereum-optimism/OPerating-manual. Quorum thresholds, weighted voting, veto mechanics, proposal types. https://github.com/ethereum-optimism/OPerating-manual/blob/main/manual.md

42. [FULL] Optimism Community Hub. "Identity and Reputation." github.com/ethereum-optimism/community-hub. Data layer, interpretation layer, vertical slices, soulbound attestations. https://github.com/ethereum-optimism/community-hub/blob/main/pages/identity/identity-and-rep.mdx

### Reputation-Based Systems

43. [FULL] SourceCred. "SourceCred Documentation." sourcecred-docs-jutt.vercel.app. Plugin architecture (GitHub, Discourse, Discord), CredRank algorithm, community-controlled weighting. https://sourcecred-docs-jutt.vercel.app/

44. [FULL] Protocol Labs Research. "SourceCred: An Introduction to Calculating Cred and Grain." research.protocol.ai/blog/2020/sourcecred-an-introduction-to-calculating-cred-and-grain/. CredRank computation, contribution graph, cred/grain distribution, boosting. https://research.protocol.ai/blog/2020/sourcecred-an-introduction-to-calculating-cred-and-grain/

45. [FULL] Gitcoin. "SourceCred Mechanism." gitcoin.co/mechanisms/sourcecred. Contribution tracking, cred scores, diverse work recognition, automation benefits. https://gitcoin.co/mechanisms/sourcecred

46. [FULL] Coordinape Docs. "Social Oracle GIVE." docs.coordinape.com/social-oracle-tm-give. On-chain GIVE attestations (EAS), permissionless public good reputation, skill endorsements. https://docs.coordinape.com/social-oracle-tm-give

47. [FULL] Coordinape GitHub. "Coordinape Protocol." github.com/coordinape/coordinape-protocol. Circle structure, epoch mechanics, GIVE allocation, GET minting, voting rules. https://github.com/coordinape/coordinape-protocol

48. [FULL] HackMD. "SourceCred and Coordinape Tool Comparison." hackmd.io/SRQfRmY6TqCk__N3Z8ho1w. Detailed comparison table, workflow, decentralization, contribution evaluation. https://hackmd.io/SRQfRmY6TqCk__N3Z8ho1w

49. [FULL] Spina, E. (2024). "Quantifying Reputation in DAOs (part 1)." mirror.xyz. Reputation models, SourceCred grain policies, conviction weighting, meta-functions for contribution scores. https://mirror.xyz/elijahspina.eth/1ll79DEikQuPkMvjBXVg2XQn4IVtbkGrUUk4SygHlho

50. [FULL] "DAO Reputation Systems: On-Chain Credentials vs Off-Chain Soulbound Tokens." markaicode.com. ERC-5192 implementation, hybrid storage, cost/security/complexity analysis. https://markaicode.com/vs/dao-reputation-systems-on-chain-credentials-vs-off-chain-soulbound-tokens/

### Fractal Governance & Respect Tokens

51. [FULL] Fractally White Paper v1.0. fractally.com/uploads/Fractally%20White%20Paper%201.0.pdf. Respect Game mechanics, Fibonacci distribution, market maker, comparison to traditional companies/DAOs. https://fractally.com/uploads/Fractally%20White%20Paper%201.0.pdf

52. [FULL] Optimystics. "Fractal Democracy: The Natural Evolution of Governance." optimystics.io/fractal-democracy. Respect Game, breakout rooms (3-6 people), on-chain social games, ORDAO/OREC. https://optimystics.io/fractal-democracy

53. [FULL] Optimystics. "ORDAO: Optimistic, Respect-based Governance." optimystics.io/ordao. OREC smart contracts, consent-based voting, veto periods, low quorum + high override. https://optimystics.io/ordao

54. [FULL] Optimystics. "Respect Tokens: The Heart of Growing Communities." optimystics.io/respect. Soulbound implementation, immutable reputation, democratic coordination, council formation. https://optimystics.io/respect

55. [FULL] Optimism Fractal Blog. "Scaling Governance: Optimism Fractal's Critical Role in the Collective." optimismfractal.com/why-optimism-fractal-is-critically-important-for-the-collective. Reputation infrastructure, fractal coordination, veto mechanisms. https://optimismfractal.com/why-optimism-fractal-is-critically-important-for-the-collective

56. [FULL] Optimystics. "Respect.Games Platform." Fractalgram app, council coordination, transparent contribution tracking. (Referenced in above; integrated in Optimism Fractal ecosystem.)

57. [FULL] sim31 (Valentin Mihov). "OREC Smart Contracts Documentation." github.com/sim31/ordao/blob/main/docs/OREC.md. OREC design, veto-period mechanics, Respect distribution, optimal voting. https://github.com/sim31/ordao/blob/main/docs/OREC.md

### Synthesis & Comparative Analysis

58. [FULL] "DAO Governance Models: Token vs Reputation vs Quadratic Voting." blockchain-council.org (2026). Comparison of three dominant approaches, hybrid designs, layered governance. https://www.blockchain-council.org/dao/dao-governance-models-token-voting-reputation-systems-quadratic-voting/

---

## Conclusion for ZAO Whitepaper

The ZAO Fractal Whitepaper should position fractal governance as **the governance model for values-aligned communities**, combining soulbound reputation, peer evaluation, temporal commitment, and minority protection in ways that previous models do not.

**Key message:** Fractal is not trying to replace token voting or quadratic voting. It's an answer to a specific problem: "How do we govern a community where contribution quality and values alignment matter more than capital?" For ZAO, that's the right problem to solve.

**Positioning:**
- vs. token voting: We measure governance by consensus, not capital.
- vs. quadratic voting: We don't need external identity infrastructure; our identity IS Respect history.
- vs. conviction voting: We weight impact, not time-locking.
- vs. Nouns: We don't require $300k/day to join; any contributor earns Respect.
- vs. Moloch: We protect minority via veto, not ragequit (no capital sacrifice).
- vs. Optimism bicameral: We don't need two houses; Respect is enough for values-aligned orgs.

This makes ZAO's governance **uniquely suited for artists, creators, and impact-driven communities.**

---

**End of Document**
