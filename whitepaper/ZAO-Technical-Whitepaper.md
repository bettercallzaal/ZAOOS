# The ZAO Technical Whitepaper

**A specification of Respect governance, on-chain architecture, and monetary policy for the Fractal democracy.**

> Version 0.1 - working draft, 2026-07-02. This is a living document. All mechanics evolve by community vote.

**Changelog**
- v0.1 (2026-07-02) - first draft. Architecture, Respect Game mechanics, and comparative governance set from research docs 718a-d; monetary policy from doc 941.

---

## Verification status (read before publishing)

Two tiers of fact in this draft:

- **Code-verified (2026-07-02, safe):** Respect has no decay today (`vote_weight = Math.round(OG + ZOR)`, a raw sum); the Optimism contract addresses (OG, ZOR, OREC); OG is ERC-20 and ZOR is ERC-1155; the Fibonacci curve (1x 55/34/21/13/8/5, 2x 110/68/42/26/16/10).
- **Research-sourced, VERIFY before publishing:** every other specific number is drawn from research docs 718a-g and is a lead, not a confirmed fact. This includes the exact OREC period lengths (48h/48h), the quorum threshold (~10% / 1,000 Respect), the week count, the issuance dates (Sept/Dec 2025), and the Fractal-number split (1-73 / 74+). Re-verify each against the live contracts and on-chain data before this document is published or signed.
- **On-chain Respect holders (verified 2026-07-05):** 156 unique addresses hold ZAO Respect - 122 hold OG Respect (ERC-20, `0x34cE...6957`) and 55 hold ZOR Respect (ERC-1155, `0x9885...445c`), with 21 addresses holding both (122 + 55 - 21 = 156). Source: optimism.blockscout.com. This is the governance-participating count; the broader ZAO community (Discord/social) is larger. Earlier drafts said "~200 members" - that conflated community size with Respect holders. Caveat: addresses are not guaranteed 1:1 with humans, and the set may include a treasury/deployer address; a name-level headcount can refine this.

The monetary-policy section (5) describes a PROPOSAL (doc 941), not current implementation.

---

## 1. What Respect Is

Respect is a soulbound reputation token representing contribution to The ZAO.

It is not money. You cannot buy it, sell it, or trade it. It cannot be transferred between wallets. Once earned through the weekly Respect Game, it stays with you forever unless you voluntarily burn it (burning is irreversible). No other person, no administrator, no smart contract can take Respect from you or give it to you without your participation in the game.

Respect comes in two forms:

- **OG Respect (ERC-20)** - the historical ledger. Minted from July 2024 through December 2025 (Fractals 1-73; first mint 2024-07-30, last mint 2025-12-09, verified on-chain). A record of early recognition: founding contributions, content features, artist awards, and mentor acknowledgment. OG is frozen; no new OG is minted. It lives on Optimism at address `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`. All OG balances at any point in history grant voting weight in OREC proposals.

- **ZOR Respect (ERC-1155)** - the living ledger. Issued weekly starting October 2025 (Fractals 74+; first mint 2025-10-16, verified on-chain) via the OREC optimistic execution contract. OG and ZOR overlapped for the roughly two-month transition (October to December 2025) before OG froze. One token per award, minted with session metadata (week, breakout group, rank). Vote weight is the sum of OG and ZOR balances (see the formula below, code-verified), so both the historical ledger and the living ledger count toward governance. ZOR lives on Optimism at address `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`.

**Only humans can earn Respect.** Agents, bots, contracts, and organizational accounts cannot participate in the Respect Game and cannot be assigned Respect. Agents are members' tools and the network's infrastructure. Membership and governance are human-only.

A member's voting weight in governance is:

```
vote_weight = OG_balance + ZOR_balance
```

Both balances are read at the proposal start block on Optimism. Both are immutable on-chain (transfers revert). The weight is locked and never changes even if the balances later shift, preventing vote-buying between proposal creation and execution.

---

## 2. The Respect Game: Weekly Mechanism

The Respect Game is the engine that distributes Respect. It runs every week, currently on Monday at 6pm EST for The ZAO. The mechanism is human-centered and consensus-driven.

### 2.1 The Six Phases

**Phase 1: Randomization (5 min)**

All participants join a video call or voice channel. A facilitator (typically Zaal or a member volunteer) randomizes all participants into breakout rooms. Group sizes range from 3-6 people. The randomization is unbiased and prevents pre-planned collusion rings; no member knows their group before entering.

**Phase 2: Contribution Sharing (45-60 min)**

Each participant gets 3-4 minutes to share what they contributed to The ZAO in the past week. Contributions can be of any kind: shipping code, mentoring a new member, writing research, organizing an event, producing music, performing at a concert, creating art, or behind-the-scenes coordination. The group listens and takes notes. No evaluation happens yet. The goal is for each person to tell the story of their contribution in their own words.

**Phase 3: Consensus Ranking (30-45 min)**

The group discusses the contributions and collaboratively ranks each other from rank 1 (most helpful to the network) to rank 6 (least helpful this week). Ranking is ordinal - a rank number, not a score. The critical rule: **2/3 consensus is required on each person's rank.** In a 6-person group, at least 4 people must agree on each individual's position. If the group cannot reach 2/3 agreement on anyone, they can discuss further and try again, or they can agree to abort the entire ranking session. If they abort, the group earns zero Respect for that week.

This consensus requirement is the primary defense against Sybil attacks and collusion (see section 5 below). It means a fake account cannot rank itself rank 1 without convincing a supermajority of real humans that it deserves to be.

**Phase 4: On-Chain Submission**

Once the group agrees on the ranking, someone with write access (typically the facilitator or a volunteer) calls the OREC contract to propose the result:

```typescript
const proposal = await orclient.proposeBreakoutResult({
  meetingNum: 100,           // Which weekly meeting (ZAO is meeting ~100+)
  groupNum: 3,               // Which breakout room in this meeting
  rankings: [                // Six ranked wallet addresses
    addressOfRank1,
    addressOfRank2,
    addressOfRank3,
    addressOfRank4,
    addressOfRank5,
    addressOfRank6,
  ]
  // Respect values auto-calculated from the contract's curve
  // (ZAO's default: 110, 68, 42, 26, 16, 10)
});
```

The proposal is recorded on-chain and assigned a proposal ID. The OREC contract automatically records the proposer's YES vote with their current OG + ZOR Respect weight.

**Phase 5: Voting and Veto Period (96 hours typical)**

The community now votes:

- **Voting period (72 hours):** Any member with OG Respect can vote YES or NO. Vote weight = their OG balance at the proposal's start block (frozen; prevents double-voting). Anyone can vote, including members not in the breakout group, because anyone can evaluate the group's consensus from the contribution descriptions on-chain.

- **Veto period (72 hours):** After voting closes, a 72-hour NO-only window opens. Only NO votes are accepted. This is the "challenge period" - a chance for the community to object if the group's consensus seems wrong. If a NO vote arrives during this window, the proposal is blocked and must be resubmitted.

This two-window design solves last-minute attacks: someone cannot wait until the final block to dump a surprise NO vote. The veto period is a fixed window, and the community knows when it is coming.

> **On-chain (verified 2026-07-05):** on the Orec executor (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`, `respectContract` -> OG Respect), `voteLen` and `vetoLen` both read **259,200 seconds = 72 hours** each. Earlier drafts said 48h/48h; the deployed contract is 72h/72h. `minWeight` reads **1000e18 = 1,000 Respect** (the proposal weight threshold), and `maxLiveYesVotes` = 9.

**Phase 6: Execution and Minting (After 96 hours)**

After both voting and veto periods elapse, anyone can call:

```typescript
await orclient.execute(proposalId);
```

The contract checks three conditions:

1. Time: 72 hours of voting + 72 hours of veto have both elapsed.
2. Quorum: YES votes total at least 10% of the network's active Respect (a low threshold, by design).
3. Supermajority: YES weight exceeds twice the NO weight (YES > 2 * NO).

If all three pass, execution succeeds. The OREC contract calls the ZOR token contract to mint Respect to each ranked member according to their rank (110 for rank 1, 68 for rank 2, etc.). Each mint is a separate ERC-1155 token with the proposal metadata embedded (week, group, rank), creating an immutable historical record.

---

### 2.2 The Fibonacci Reward Curve

Respect distribution follows the Fibonacci sequence, a curve intentionally designed to avoid gaming while creating meaningful differentiation.

**Standard Fibonacci (Eden and Optimism Fractal):**

| Rank | Standard | Phi Ratio | Cumulative % |
|------|----------|-----------|--------------|
| 1st  | 55       | 1.618x    | 40.4%        |
| 2nd  | 34       | 1.618x    | 65.0%        |
| 3rd  | 21       | 1.618x    | 80.4%        |
| 4th  | 13       | 1.615x    | 89.9%        |
| 5th  | 8        | 1.600x    | 95.6%        |
| 6th  | 5        | 1.250x    | 100.0%       |
| Total | 136     | --        | --           |

**ZAO's 2x Fibonacci (Current, as of May 2026):**

| Rank | ZAO 2x | Standard 1x | Ratio | Phi Ratio (preserved) |
|------|--------|------------|-------|-----------------------|
| 1st  | 110    | 55         | 2.0x  | 1.618x                |
| 2nd  | 68     | 34         | 2.0x  | 1.618x                |
| 3rd  | 42     | 21         | 2.0x  | 1.618x                |
| 4th  | 26     | 13         | 2.0x  | 1.618x                |
| 5th  | 16     | 8          | 2.0x  | 1.615x                |
| 6th  | 10     | 5          | 2.0x  | 1.600x                |
| Total | 272   | 136        | 2.0x  | --                    |

**Why Fibonacci**

The phi ratio (1.618, the golden ratio) reflects human judgment of fairness. When contributions are measured by humans in a small group, the measurement error is roughly 60% - people cannot distinguish whether a contribution was 1.0x or 1.6x the effort of the next one. The Fibonacci curve encodes this uncertainty. Each rank is 60% higher than the one below, which means:

1. If two people think they did roughly equal work, the difference between 55 and 34 (1.6x) feels acceptable, even if one person judges the other should have ranked lower.

2. The distribution passes the Ultimatum Game test: when a rank 6 member (earning 10 tokens) sees a rank 1 member earning 110, the ratio feels "fair enough" to accept, because the Ultimatum Game threshold for fairness is roughly 35/65. Fibonacci's 27/73 split (10 vs. 110) exceeds that threshold.

3. Large singular rank differences (e.g., 1st vs 6th: 11x) are unusual and mean real disagreement about contribution. The curve allows for it without permitting extreme outliers.

**ZAO's 2x scaling** doubles every rank (110 instead of 55, 68 instead of 34, etc.) while preserving the phi ratio. The rationale: ZAO emphasizes rapid advancement for top contributors (artists, builders, mentors) so they reach decision-making tiers faster. Because there is no decay today, Respect simply accumulates: a member who takes rank 1 every week earns 110 per week under the 2x curve versus 55 under standard Fibonacci, so the 2x curve roughly halves the time to senior standing while keeping Sybil resistance intact (still requires consensus, still soulbound, still cannot be bought).

**Distribution equality (Gini)**

Doc 718b cited a Gini coefficient near 0.23 for a single-round distribution - a modeled figure from external fractal sources, not ZAO's live balances. Recomputed against live on-chain data on 2026-07-05, the honest picture is more nuanced:

- **Cumulative OG Respect holdings (ERC-20, all Fractals to date): Gini approximately 0.73** (122 holders; the top 10 hold about 53% of supply; the top holder about 8%; balances range 5 to 3,094). Lifetime holdings concentrate with tenure, as in any earned-reputation system.
- **A single Respect Game reward curve (110/68/42/26/16/10): Gini approximately 0.41.** Doc 718b's own analysis notes this drifts to 0.30-0.50 once real attendance varies.

The **direction holds and is the defensible claim**: peer-ranked Respect (approximately 0.73 cumulative) is materially more equal than capital-weighted token voting (commonly 0.97 and up, dominated by the top few percent). But the specific 0.23 headline does not match ZAO's live distribution and should not be published as such - a critic can compute approximately 0.73 directly from the public contract. [Computed 2026-07-05 from optimism.blockscout.com; ZOR ERC-1155 holdings not yet folded in - a combined vote-weight Gini would refine this further.]

---

### 2.3 Consensus Thresholds and Passing Conditions

For a breakout group's ranking to result in minted Respect, three conditions must be met:

1. **Consensus in the room:** 2/3 of the group must agree on each member's rank. If consensus fails on anyone, the entire proposal fails.

2. **Voting quorum:** Total YES votes across the community must reach a minimum weight threshold. ZAO's threshold is **1,000 Respect units** (on-chain `minWeight` = 1000e18, verified 2026-07-05). That is about 2.6% of total OG supply (38,484); the share of the *active voting* base is higher, since not all holders vote. It is intentionally low to prevent a passive minority from stalling governance.

3. **Supermajority:** YES votes must exceed twice the NO votes: `YES_weight > 2 * NO_weight`. This means:
   - If NO reaches 33% of the weight, the proposal fails (cannot get 2x NO).
   - If NO stays below 33%, the proposal passes (assuming quorum is met).
   - A 50/50 split always fails (50 is not > 100).

**Implications:**

- 1/3 of the active Respect base can veto any proposal (collective veto right).
- 2/3 can guarantee passage (no larger supermajority needed).
- Single dissenting whales have no special power; a whale with 100k tokens still votes as one person, and 1/3 of the active base can block them.

This is the core defense against tyranny: the supermajority rule prevents a 51% majority from steamrolling a 49% minority. Both must be consulted.

---

### 2.4 Weekly Cycle and Participation Patterns

The Respect Game runs every week, currently Monday 6pm EST for The ZAO. A single cycle spans 5-6 days:

- **Day 0 (Monday 6pm):** Breakout rooms, sharing, ranking, on-chain submission
- **Days 0-3:** Voting period (72 hours)
- **Days 3-6:** Veto period (72 hours)
- **Days 4-5:** Execution window (open until Friday)

Members can participate in multiple groups in a single week if attendance allows. A member's total Respect for the week is the sum of all their ranks across all groups they joined. This is by design: it prevents a "one-shot" mentality and rewards members who show up multiple times.

Participation is synchronous: members must attend the live call to share and be ranked. Async options exist (the Respect.Games web app allows week-long contribution submission and a 24-hour voting window), but live attendance is the primary mode. This synchronicity is one of the model's strengths (drives real relationships and accountability) and its central constraint (demands weekly time from all members).

---

## 3. On-Chain Architecture: OREC and Soulbound Tokens

The Respect Game is human-centered and consensus-driven. OREC (Optimistic Respect-based Executive Contract) is its on-chain complement, turning human consensus into immutable records and distributing Respect automatically.

### 3.1 OREC: Optimistic Execution

OREC is a smart contract that inverts the default assumption of traditional DAOs. Traditional DAO governance requires an active majority to pass proposals (e.g., "get 50% of token holders to vote yes"). OREC assumes consensus exists and requires only a proactive minority to object.

This is borrowed from optimistic rollups (L2 blockchain scaling), which assume transactions are valid and allow a challenge period for fraud-proofs. OREC applies the same logic to governance: assume the breakout room's ranking is valid, allow a challenge period, and only block execution if sufficient weight vetoes.

**The Three-Phase Cycle**

1. **Voting Period (72 hours):**
   - Proposal is live for YES and NO votes.
   - Vote weight = Respect balance at the proposal creation block (historical snapshot).
   - Any member with OG Respect can vote.
   - Proposer's wallet auto-votes YES upon submission.
   - Gas cost per vote: ~$0.02-0.05 on Optimism (low, accessible).

2. **Veto Period (72 hours):**
   - Voting closes; only NO votes are accepted.
   - This is the challenge window: a chance for the community to flag a bad proposal.
   - Prevents surprise attacks (attacker cannot wait until the final block to dump a NO vote).
   - If a NO vote arrives, the proposal is blocked and must be resubmitted.

3. **Execution (Open window):**
   - Both periods elapse.
   - Anyone calls `execute(proposalId)`.
   - Three checks:
     - Time: Both periods have passed.
     - Quorum: YES >= 10% of active Respect.
     - Supermajority: YES > 2 * NO.
   - If all pass, the contract mints Respect to the ranked members.

**Why "Optimistic"**

The word "optimistic" reflects the security model. Instead of "prove this proposal is good before execution" (pessimistic, high gas cost, active majority required), OREC assumes "this proposal is good unless proven bad" (optimistic, low gas cost, passive majority wins). A fraud-proof window (the veto period) allows the community to challenge.

This solves voter apathy. In traditional DAOs, a 5-10% participation rate is typical because voters see their individual vote as negligible. OREC inverts this: if you do not vote, you are implicitly consenting. An active 1/3 can veto, but apathy is treated as YES (not required to vote and wait for consensus).

---

### 3.2 Soulbound Token Design: OG and ZOR

ZAO maintains two separate Respect token contracts to preserve history while enabling future governance.

**OG Respect (ERC-20)**

| Attribute | Value |
|-----------|-------|
| Address | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (Optimism) |
| Standard | ERC-20 (soulbound variant) |
| Total Supply | ~38,484 ZAO (as of May 2026) |
| Status | Frozen (last mint 2025-12-09, verified on-chain) |
| Transfer | Reverts (soulbound; all transfers blocked at contract level) |
| Use | Historical ledger (Fractals 1-73, pre-ORDAO era) |
| Vote Weight | OG balance grants full voting power in OREC, read at proposal block |

OG is a one-time ledger of early recognition. It was minted manually (via admin governance) before OREC existed. It is now frozen as a historical record. Members' OG balances still grant voting weight, treating early contributors fairly.

Code enforcement:
```solidity
function transfer(address to, uint256 amount) public override returns (bool) {
  revert("Respect is soulbound and cannot be transferred");
}
```

**ZOR Respect (ERC-1155)**

| Attribute | Value |
|-----------|-------|
| Address | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Optimism) |
| Standard | ERC-1155 (soulbound variant) |
| Token ID | 0 (single ID; awards differentiated by amount) |
| Minting | Only OREC can mint (no manual admin override) |
| Transfer | Reverts (soulbound; only minting and burning allowed) |
| Use | Living ledger (Fractals 74+, post-ORDAO era) |
| Recent Activity | 242+ OREC transactions as of May 21, 2026 |

ZOR is the living ledger of weekly Respect Game results. One ZOR token is minted per ranked member per proposal, with metadata (week, group, rank) embedded. The fact that only OREC can mint ZOR removes the human bottleneck of admin approval; proposals execute automatically if consensus passes.

Code enforcement (ERC-1155 soulbound pattern):
```solidity
function _beforeTokenTransfer(
  address operator,
  address from,
  address to,
  uint256[] memory ids,
  uint256[] memory amounts,
  bytes memory data
) internal override {
  require(
    from == address(0) || to == address(0),
    "Respect tokens are soulbound and cannot be transferred"
  );
  super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
}
```

**Why Two Tokens**

1. **Historical preservation:** OG cannot be lost or overwritten. It is proof of early contributions, immutable on-chain forever.

2. **Democratic future:** ZOR reflects ongoing peer evaluation without manual gates. Only OREC (the consensus contract) can mint; no admin has override power.

3. **Vote weight decoupling:** A member's voting power (OG balance) is independent of their recent earnings (ZOR). This prevents "who won Respect last week" from dominating "who votes on big decisions." Early adopters vote at full weight even if inactive lately.

**Vote Weight Calculation**

A member's voting power in any OREC proposal is:

```
vote_weight = OG_balance + ZOR_balance
```

Both balances are read at the proposal creation block, then frozen. The weight never changes even if ZOR or OG balances shift afterward, preventing vote-buying between proposal submission and execution.

Code verification (src/lib/respect/voteWeight.ts, line 58):
```typescript
weight: Math.round(ogValue + zorValue)
```

This is a raw lifetime sum. No decay is currently applied.

---

### 3.3 Contract Relationship and Proposal Flow

```
Member Wallet
├─ Balance: OG (ERC-20) = voting power (frozen historical)
├─ Balance: ZOR (ERC-1155) = living earned respect
└─ Both soulbound (cannot transfer)

Breakout Consensus (off-chain)
  ↓ proposeBreakoutResult()
  ↓ [OREC creates proposal, auto-votes YES]
  ↓
Community Voting (on-chain, 72h YES/NO)
  ↓ [YES votes accumulate]
  ↓
Veto Period (on-chain, 72h NO-only)
  ↓ [Community challenges the result if disagreed]
  ↓
Execution (open call to execute() function)
  ↓ [Checks quorum + supermajority + time]
  ↓ [ZOR.mint() to all ranked members]
  ↓
Leaderboard Update
  └─ ZOR balances increase; voting power increases for next week
```

---

### 3.4 Chain Choice: Optimism

All contracts live on Optimism OP Mainnet, not Ethereum mainnet or other L2s. The reasons:

1. **EVM equivalence:** Optimism's bytecode-compatible execution means contracts work identically to Ethereum without needing Solidity rewrites.

2. **Gas efficiency:** Optimism costs 100x less gas than Ethereum mainnet (~$0.02 per vote on Optimism, ~$2.00 on mainnet). This makes weekly participation affordable for all members.

3. **Superchain readiness:** As the OP Stack matures, fractals on Optimism can be bridged and composed across chains (e.g., a ZAO fractal on Base, a ZABAL fractal on Arbitrum, all voting on shared OP Mainnet decisions).

4. **frapps deployment tooling:** OREC is deployed via the frapps.xyz platform (an ORDAO hosting service), which abstracts infrastructure. ZAO runs on zao.frapps.xyz, with OREC at the address above and metadata stored on ornode.

---

## 4. Why Fractal Governance: Comparative Analysis

Fractal governance is not the only approach to DAO governance. It has specific trade-offs against five major alternatives.

### 4.1 Token-Weighted Voting (Uniswap, Compound, Aave)

**Mechanism:** 1 token = 1 vote. Voting power equals token balance. Tokens are traded on open markets.

**Sybil Resistance:** Extremely high by design. Tokens have cost; cannot mint new tokens for free via wallet-splitting.

**Plutocracy Resistance:** Extremely low. Voting power correlates directly with capital. Compound's top 8 delegates hold >50% voting power; Uniswap's top 11 delegates hold >50%. Participation rates are 3-10% (voter apathy), because retail voters' votes are negligible.

**Why it fails for ZAO:** ZAO's mission is to return value to creators. Token-weighted voting would give the richest members the most votes, regardless of their contributions. This recreates the label-controlled gatekeeping The ZAO exists to end.

**Where it wins:** Emergency decisions requiring fast, unambiguous choices. Protocol parameter changes where capital is the main stakeholder. If ZAO cares more about capital efficiency than contribution, token-weighting would be optimal.

---

### 4.2 Quadratic Voting and Funding

**Mechanism:** Voters receive a fixed budget of "voice credits" (e.g., 100). Casting n votes on a single choice costs n^2 credits (1st vote costs 1, 2nd costs 4, 3rd costs 9, etc.). This forces preference expression: voters must decide what matters most and allocate accordingly.

**Mathematical elegance:** Under conditions of verified identity, quadratic voting achieves near-optimal allocation of resources. The square-root scaling prevents whales from dominating.

**Sybil vulnerability:** On permissionless blockchains, quadratic voting is broken. A Sybil attacker with 4 tokens can split across 4 wallets (1 token each) and achieve 2x voting power. Optimal sybil strategy is equal splitting. Measured sybil amplification factors on Ethereum-based DAOs: 1,172x - 4,039x (recent 2024-2025 research).

**Real deployments:** Gitcoin Grants Rounds 1-2 (2019-2020) had zero Sybil defense and saw attacks. Rounds 19+ use Gitcoin Passport (external identity verification via GitHub, Twitter, on-chain history, etc.), which works but requires off-chain infrastructure.

**Why it fails for ZAO:** Without external identity (which ZAO does not have), quadratic voting on-chain would be trivially attacked. Even with identity, it adds friction (users must verify their GitHub, Twitter, etc. each round).

**Where it wins:** Public goods funding with verified identity. Civic voting systems. Academic research.

---

### 4.3 Conviction Voting

**Mechanism:** Voting power is time-locked. Voters stake tokens on proposals they support; conviction "charges" over days (via decay half-life). Switching proposals drains conviction from the old one. Larger proposals require higher conviction thresholds to pass.

**Sybil Resistance:** High. Requires capital AND time. A Sybil attack requires buying tokens and holding them consistently over weeks, which is expensive.

**Plutocracy Resistance:** High. The time-lock means even a whale cannot flash-vote; they must commit their stake for days.

**Why it's good:** Conviction voting solves temporal dynamics. It prevents vote-buying and supports long-term alignment.

**Why ZAO uses fractal instead:** Fractal governance is contribution-based, not capital-based. Conviction voting still requires capital (tokens) to participate. ZAO's design lets humans earn governance power through contribution, not capital.

**Where conviction voting wins:** Long-term treasury management (1Hive, Commons Stack). Community-owned project governance where capital buy-in is acceptable.

---

### 4.4 Nouns Auction Model

**Mechanism:** One NFT (Noun) is minted daily forever. Each Noun is auctioned to the highest bidder. 100% of auction proceeds go to the treasury. 1 Noun = 1 vote.

**Sybil Resistance:** Very high. NFTs are unique and cannot be sybil'd without buying new NFTs, which is expensive.

**Plutocracy Resistance:** Low initially (first buyers have most Nouns), but improves over time via dilution. After 2 years, power is more distributed.

**Membership sustainability:** Excellent. The daily auction creates a recurring revenue source (treasury grows every day) and allows anyone to join at any time (no ICO gap).

**Why ZAO doesn't use it:** Nouns require capital: in 2024, Nouns averaged ~100 ETH per day (~$300k). This excludes members without significant wealth. ZAO's mission is to include creators regardless of capital.

**Where Nouns wins:** High-value collectives with sustainable treasury needs (Nouns DAO itself, with a $400M+ treasury).

---

### 4.5 Moloch DAO and Ragequit Rights

**Mechanism:** Minimal voting on grants. Shares represent both voting power AND exit rights. A 49% shareholder can rage-quit (exit for pro-rata treasury share) if a 51% majority passes a bad proposal. This removes the incentive for tyranny: the cost of a 51% majority proposal is the 49% ragequitting.

**Sybil Resistance:** Medium. Can sybil via multiple share accounts, but exit rights punish the attacker (they lose treasury if they rage-quit).

**Plutocracy Resistance:** Very high. 51% attack is impossible; the threat of ragequit removes it. Minority capital is protected.

**Why ZAO doesn't use it:** Moloch is a grant-making DAO, optimized for venture-like collectives distributing capital. ZAO is a contribution-based fractal, not a grants committee.

**Where Moloch wins:** Venture DAOs, investment collectives, grant-making organizations.

---

### 4.6 Optimism Collective: Bicameral Governance

**Mechanism:** Two voting houses with veto power over each other. Token House (OP token, capital-weighted) votes on core protocol. Citizens' House (soulbound NFTs, one-person-one-vote) votes on public goods allocation. Each can veto the other's high-stakes decisions.

**Sybil Resistance:** High (Citizens' House uses identity attestations; Token House is Sybil-proof by default).

**Plutocracy Resistance:** Very high. Wealth and values are separated institutionally. Neither house can dominate alone.

**Sophistication:** This is the most sophisticated governance model at scale. It acknowledges that capital and values are different signals and should have separate institutional representation.

**Why ZAO uses fractal instead:** Fractal is simpler (single house, not two) and contribution-based (not capital-based). It works well for communities <500 members; bicameral systems are better for 10,000+ members with diverse stakeholder groups.

**Where Optimism's bicameral model wins:** Large, diverse ecosystems (Optimism, any DAO with 10,000+ members and $100M+ treasury). Situations where capital and values fundamentally conflict.

---

### 4.7 ZAO Fractal: Distinctive Advantages

| Dimension | Token-Weighted | Quadratic | Conviction | Nouns | Moloch | Optimism Bicameral | ZAO Fractal |
|-----------|---|---|---|---|---|---|---|
| Sybil Resistance | Very High | Zero (permissionless) | High | Very High | Medium | High | Extremely High |
| Plutocracy Resistance | Very Low | Very High* | High | Low (early) | Very High | Very High | Extremely High |
| Capital Required | Yes | Optional | Yes | Yes | Yes | Yes | No |
| Contribution-Based | No | No | No | No | No | Limited | Yes |
| Time-Based Decay | No | No | Yes | No | No | No | Optional (proposed) |
| Participation Friction | Low | Medium | Medium | High | Low | Medium | Medium (weekly) |
| Scale Proven | 10,000+ | 100s-1000s | 100s-1000s | 100s | 100s-1000s | 10,000+ | 156 holders (ZAO) |

*Quadratic voting works only with external identity verification.

**ZAO Fractal's distinctive claims:**

1. **Contribution-only governance.** No capital required. Members earn voting power by showing up and contributing, not by buying tokens.

2. **Sybil-resistant by consensus, not cost.** A fake account cannot rank itself rank 1 without convincing a supermajority of real humans. This is stronger than costly Sybil resistance (which can be overcome by a well-funded attacker).

3. **Small-group consensus.** 3-6 person groups with 2/3 majority rules force genuine deliberation. This is proven effective in citizens' assemblies and Dunbar-limited collaboration.

4. **Longest-proven track record.** ZAO has run 100+ unbroken weeks of Respect Games (roughly 101 weeks since the first issuance on 2024-07-30). Eden on EOS paused in Jan 2026; Optimism Fractal paused indefinitely; ZAO continues weekly. This is the longest-running permissionless fractal anywhere.

5. **Fair distribution.** Respect is distributed far more equally than capital-weighted voting: cumulative on-chain OG Respect holdings show a Gini of approximately 0.73 (computed 2026-07-05), versus 0.97 and up for token DAOs. (An earlier draft cited 0.23; that was a modeled single-round figure, not the live cumulative distribution - see the Distribution equality section.) No single holder dominates: the top holder has about 8% of supply.

6. **Optional decay.** See Section 5 below. The mechanism can evolve to include reputation decay so recent contributions matter more than tenure.

**ZAO Fractal's honest limitations:**

1. **Participation is demanding.** Weekly synchronous governance asks a lot. Sustained participation is the central risk, not a solved problem.

2. **Scaling is unproven.** ZAO's 156 on-chain Respect holders (verified on Optimism, see Verification) is proven. Nested fractals (a fractal of fractals) are theory. Scaling past a thousand members is open research.

3. **Visibility bias.** Ranking rewards visible work. Infrastructure and mentorship can be undercounted. Mitigations exist (explicit infrastructure voting criteria, rotating facilitators), but are not perfect.

4. **Operating-core concentration.** Of the 130 OREC proposals to date, only **4 wallets have ever submitted one**, and a single relayer wallet submitted **94%** (top 3 = 99%; verified on-chain 2026-07-05). "All members submit on-chain" is a goal, not a finished fact.

---

### 4.8 Frontier Alignments: Ethereum Research Not Yet in ZAO

Sections 4.1-4.6 evaluated governance models ZAO deliberately did **not** adopt. This section records the opposite: mechanisms from Ethereum public-goods research (much of it Vitalik Buterin's) that ZAO does **not** yet use but that map cleanly onto problems the sections above already name as open. These are considered directions, not committed changes. Each is grounded in a shipped external system and cross-linked to the ZAO limitation it would address. Full analysis: research doc 967.

**What ZAO already embodies from this research.** Before listing gaps, the honest accounting: Respect is a soulbound token (the DeSoc / "Decentralized Society" thesis, Weyl-Ohlhaver-Buterin 2022), earned not bought; the contribution-over-capital creed is a direct implementation of "moving beyond coin voting" (Buterin 2021); governance is human-only and consensus-driven. ZAO is already a live cultural implementation of this body of work for musicians. The items below are refinements at the edges, not a redirection.

**1. Retroactive recognition (RetroPGF pattern) - addresses the visibility-bias limitation.** Section 4.7 limitation #3 and Section 6 both name the same weakness: the weekly Respect Game rewards *visible* work, so quiet infrastructure and mentorship get undercounted, and a three-minute share cannot capture a quarter of maintenance. Optimism's Retroactive Public Goods Funding answers exactly this - it is easier to agree on what *was* valuable than to predict what *will* be. A ZAO analogue: a periodic (e.g. annual) retrospective round where the community recognizes shipped projects, performances, and organizing from the past cycle, allocating a Respect bonus by ranked consensus. This is additive to the weekly game, not a replacement, and it gives async and infrastructure builders a path the synchronous call structurally misses. Precedent: Optimism RetroPGF distributed over $100M across rounds. Open risk: same recipients every cycle - mitigate with a repeat cooldown.

**2. Private ranking to harden collusion defense (MACI) - extends Section 6.** Section 6 covers Sybil and collusion defense through social/consensus resistance. One tool it does not yet consider is cryptographic: MACI (Minimal Anti-Collusion Infrastructure, Buterin + Ethereum PSE) lets participants submit votes encrypted, with a zero-knowledge proof that the tally is correct, so no one can *prove to a briber* how they voted. For ZAO, weekly ranks could be submitted privately with a proof that 2/3 consensus was reached, publishing only the final result. This removes visible vote-trading and in-group social pressure while keeping the public outcome. It is heavier infrastructure; listed as a defense-in-depth option, not a near-term need at ~200 members.

**3. Conviction on Respect, not capital - answers Section 4.3's objection to conviction voting.** Section 4.3 rejects conviction voting because it "still requires capital (tokens) to participate." That objection is specific to *capital-locked* conviction. A ZAO-native variant sidesteps it: weight a member's OREC vote by how long they lock **Active Respect** (earned, not bought), not tokens. Long-committed contributors outweigh transient ones without reintroducing capital. This composes with the decay proposal in Section 5 (Banked/Active), where the Active/locked distinction already exists. Considered, not adopted; depends on the decay decision (doc 941) landing first.

**4. Quadratic funding for the ZAO Fund - a treasury tool, distinct from Section 4.2's governance analysis.** Section 4.2 correctly dismisses quadratic *voting* for on-chain governance (Sybil-broken without external identity). Quadratic *funding* for discretionary **treasury allocation** is a different application: many small backers outweigh one large one, so the Fund follows network taste, not only a single curator. The Section 4.2 Sybil objection is real and would have to be answered by Respect-gating contributions (only Respect-holders can back) plus per-member caps plus, optionally, the MACI layer above - identity ZAO already has internally, which the permissionless case lacks. Precedent: Gitcoin Grants, over $20M via QF. Considered for the Fund only, never for core governance.

**Open questions for the community (not decided here).** Two of these - conviction-on-Respect (3) and quadratic funding (4) - are less synchronous than the weekly in-person Fractal, which is the heart of the model. Whether they fit ZAO's culture or dilute its synchronous core is a genuine open question, flagged for community deliberation, not resolved by this appendix. Retroactive recognition (1) is the most culturally aligned and lowest-risk of the four.

---

## 5. Monetary Policy: The Decay Proposal (Proposed, Not Current)

**This section describes a proposal to evolve Respect governance, documented in research (pending doc 941). It is not current implementation. The current system applies NO decay.**

Currently, Respect accumulates forever with no decay. A member's vote weight = `Math.round(OG + ZOR)`, a raw lifetime sum. This means a member who was highly active 4 years ago still votes at full weight even if inactive since then.

The decay proposal would change this to weight recent contributions more heavily, creating meritocratic governance that reflects current community engagement rather than historical tenure.

The proposal, "monetary policy for merit" (research doc 941), is a set of independent votes, each with a recommended default. It reframes Respect as a flow that measures current relevance, not lifetime tenure. What follows is the recommended shape.

### 5.1 Banked and Active (the core split)

Respect splits into two views:

- **Banked** - your lifetime total. It never burns. It is your rank, your legacy, your membership. This is the running sum the system already keeps.
- **Active** - a rolling, decaying balance that sets governance weight and bounty access. This is the new view.

This separates "honor what you did" from "weight what you are doing now," and it is the clean answer to the Year 3 legacy question (see 5.5). It is validated by SourceCred's cred/grain architecture, which held even after that organization wound down.

### 5.2 Active decay: a 180-day half-life (recommended)

Active decays on a 180-day trailing half-life:

```
Active(t) = Active0 * e^(-0.00385 * t)     (t in days)
```

Skip a month and you lose about 2% (unfelt). Skip a quarter and you lose about 27% (felt). This matches the Fractal and ZABAL cycle.

Note: this is NOT the older "2% weekly, 34-week half-life" figure from early research (doc 718b). The proposal's recommended shape is the 180-day trailing half-life above. The proposal also lists a gentler one-time 50% haircut as an alternative, and explicitly rejects a 1-month compounding half-life as member-erasure rather than discipline.

### 5.3 What pauses the decay (multi-signal participation)

Active decay is paused for a window by ANY ONE of:

- fractal attendance,
- a judged bounty ship,
- two peer attestations (EAS, free on Base).

"Participation is what you ship, not where you sit." Attendance alone is near-free to fake; a judged ship or a two-peer quorum is costly to fake. A shipped bounty on a missed-call week still counts. This keeps the model from penalizing quiet infrastructure work over visible social work.

### 5.4 Grace for legitimate absence

- **Earned grace tokens:** about two per active year, each granting 30 days of absence immunity. Earned only while active, so they cannot be stockpiled.
- **First-miss amnesty:** auto-granted once.
- **Cap:** one grace activation per quarter.

These are explicitly not buyable "freezes," which would let someone hold standing while contributing nothing.

### 5.5 Year 3 legacy migration

At a "Year 3 Census," snapshot the two years of no-decay Respect (OG + ZOR to date) into **Banked**. Active starts fresh from that epoch forward. No aristocracy (old Respect confers standing, not current governance power) and no retroactive purge (nothing is taken away). This is why the Banked/Active split is the clean answer to the hardest open question.

### 5.6 Routing bounties by Active Respect (phase 2)

Gate POIDH bounty judging by Active Respect (for example, a Curator tier and up); claim submission stays permissionless. Buildable off-chain today via a Safe multisig judged by a Snapshot strategy reading Active Respect on Base. This is what makes Respect route the money, the core thesis.

### 5.7 The one implementation unblock (not a vote)

Today only a few wallets can submit breakout results on-chain, because of gas friction on `OREC.proposeBreakoutResult()`: of 130 proposals to date, exactly **4 wallets have ever submitted**, and one relayer wallet handles **94%** of them (verified on-chain 2026-07-05). A gas-free relayer submit button in ZAO OS would let every member submit, a prerequisite for the multi-signal model above.

### 5.8 Status: proposed, not adopted

Each item above is an independent community vote. The recommended ballot: Banked/Active split YES; 180-day half-life; multi-signal participation YES; earned grace YES; Y3 snapshot to Banked YES; bounty routing by Active YES (phase 2). If adopted, it becomes a new version of this document, logged with a version bump.

---

### 5.5 Status: Proposed, Not Adopted

The decay mechanism is not current law. It is a proposal documented in the research. The ZAO community may adopt, reject, or modify it. If adopted, it becomes a new version of this whitepaper, logged with a version bump (v0.2).

**Why it matters:** The proposal shows that fractal governance is explicitly designed to evolve. Early design choices (no decay) can be revisited if the community votes them out. This is the "living document" principle.

---

## 6. Sybil and Collusion Defense

Respect's soulbound design and the Respect Game's consensus mechanism create a multi-layered defense against Sybil attacks (fake accounts) and collusion (attackers voting together).

### 6.1 Sybil Defense Layers

**Layer 1: Consensus requirement (2/3 supermajority within breakout groups).**

The Respect Game requires 2/3 agreement on each rank. A fake account cannot self-rank rank 1 without convincing 2/3 of the group (e.g., 4 of 6 people) that it deserves the highest rank. If the attacker controls only the fake account, they need to convince at least 4 real humans. This is hard. If the attacker can coordinate with colluders:

- 3 attacker accounts + 6 real humans = needs 3 + 1 real human to reach 4/6 (67%) on the fake account.
- 4 attacker accounts + 5 real humans = needs 4 + 0 = achievable but requires all attackers voting together on one person per round.

**Cost:** To get one fake account to rank 1 in a single week via consensus bribery, the attacker must coordinate with enough real humans to sway 2/3 of a group. Repeating this every week requires sustained collusion.

**Layer 2: Randomization.**

Groups are randomized each week. An attacker cannot plan in advance which groups their fake accounts will be in. This prevents pre-arranged collusion rings.

**Cost:** Attacking requires breaking randomization or sustaining collusion across many unpredictable group compositions. The collusion cost grows quadratically with group size (more people to coordinate with each week).

**Layer 3: Weekly re-evaluation.**

Each week, members are re-ranked in new groups with new people. An attacker cannot "lock in" a rank once earned. To maintain high Respect (and thus high voting weight), they must achieve consensus every single week.

**Cost:** Sustained attacks require weekly coordination. A single week of collusion failure drains the fake account's Respect via decay (if decay is active), or removes its recent earnings.

**Layer 4: Soulbound transfer prohibition.**

Fake accounts cannot sell or transfer Respect to real accounts. All Respect earned by a fake account is trapped there. An attacker cannot accumulate fake Respect and then move it to a main account.

**Cost:** The attacker must maintain and defend every fake account individually, with no way to consolidate gains.

**Layer 5: Two-wallet operating core concentration (current) / all-members-on-chain (goal).**

Currently, **94% of the 130 OREC proposals** to date were submitted by a single relayer wallet, with just 4 wallets ever having submitted (verified on-chain 2026-07-05). This small group can veto bad proposals (and has, informally). The goal is "all members on-chain," where hundreds of wallets are eligible to submit. This distributes power and makes coordination harder.

**Cost (current):** An attacker must influence 2 wallets to approve proposals; 2 humans is breakable.

**Cost (goal):** Attacking 100+ wallets is exponentially harder.

---

### 6.2 Sybil Cost Analysis

Assume an attacker wants to get 10 fake accounts to rank 1 status (high Respect) over 15 weeks:

- **Per-week cost:** Each fake account needs 2/3 consensus in a 6-person group. The attacker needs to compromise 2-3 real humans per group, per week (via bribery, social engineering, etc.).

- **Total cost:** 10 fake accounts * 15 weeks = 150 "group-sways." Each group-sway requires compromising ~2 humans. Total: 300 human relationships to maintain.

- **Detection cost:** The more humans you recruit to collude, the higher the chance someone reports it. The ZAO community can observe unusual voting patterns (e.g., "these 5 people always vote the same way on the same accounts") and flag anomalies.

- **Opportunity cost:** 300 hours of social engineering / bribery could be spent shipping real contribution to The ZAO and earning Respect legitimately.

**Conclusion:** Sybil cost is social (requires human coordination), not financial (cannot buy token votes). This makes it expensive relative to legitimate contribution.

---

### 6.3 Collusion Defense

**Define collusion:** A group of real humans (e.g., a Sybil ring, or a rival faction) votes together on OREC proposals to pass bad ideas or block good ones.

**Defenses:**

1. **Voting transparency:** All OREC votes are on-chain. Any member can query who voted YES/NO on any proposal. If a collusion ring always votes together, it is visible.

2. **Supermajority requirement:** 1/3 of active Respect can veto. A collusion ring cannot be larger than 2/3 of the network without being detected (there is not a hidden majority). If the ring is 2/3 - 1 members, the remaining 1/3 can block them.

3. **Small group consensus:** The Respect Game itself (the source of Respect) requires 2/3 consensus in small groups. This prevents one faction from loading up a group with their people (randomization) and prevents hidden coordination (synchronous meetings).

4. **Exit option:** If collusion ring captures governance, members can hard-fork or migrate to a new DAO. The cost of collusion-driven tyranny is community exit.

---

### 6.4 Known Limitations

**Visibility bias:** Obvious, loud work (social posts, events, visible shipping) is easier to rank than quiet work (database maintenance, behind-the-scenes mentorship). Mitigation: explicit criteria like "infrastructure contribution" and rotating facilitators to bring different perspectives. This is incomplete; the proposal in section 5.2 (multi-signal participation) addresses it.

**Operating-core concentration (current):** Only **4 wallets have ever submitted** OREC proposals, and one relayer accounts for **94%** of the 130 to date (verified on-chain 2026-07-05). They are not acting as dictators (proposals are genuine breakout group rankings), but the submission path is a bottleneck. Mitigation: educating members on how to submit proposals, low-friction tools, lowering gas costs. Goal: "all members on-chain."

**Newcomer cold start:** A brand-new member starts with zero Respect (no voting power) and must wait weeks to accumulate. This creates an insider advantage. Mitigation: The Respect Game is weekly; after 4-5 weeks of participation, a newcomer can have 200-400 Respect (enough to participate in governance). Bootstrap programs (mentorship, initial Respect grants, "new member circle") can accelerate on-boarding.

---

## 7. Conclusion

The ZAO Technical Whitepaper specifies the mechanism, the math, and the on-chain architecture that enable Respect-based governance at scale.

Respect is soulbound (cannot be transferred), consensus-earned (requires 2/3 group agreement), and immutable on-chain (OG and ZOR). The Respect Game distributes Respect weekly via Fibonacci scoring, using a curve designed to encode human judgment of fairness and prevent gaming. OREC optimistic execution brings consensus to on-chain actions with low gas costs and high accessibility.

The architecture is not perfect. It demands weekly participation (a real constraint). It has visibility bias and operating-core concentration (real limitations). It has not been scaled beyond ~156 Respect holders (unproven). But it has been run continuously for roughly 101 unbroken weeks (since 2024-07-30) - about two years of weekly practice - longer than any other permissionless fractal we know of. It distributes far more equally than capital-weighted voting. And it is governed by the community, not controlled by capital.

The decay proposal (documented but not adopted) shows the system is designed to evolve. If the ZAO community votes to weight recent contributions more heavily, they can upgrade the mechanism and log the change as a new version.

This whitepaper is a living document. The ZAO strives to keep it accurate and to revisit assumptions when evidence calls for it. Every change is logged and versioned, so the document's history is itself a governance record.

---

## Appendix: Contract Addresses and Parameters

**Optimism OP Mainnet Contracts:**

- **OG Respect (ERC-20):** `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
- **ZOR Respect (ERC-1155):** `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
- **OREC (Optimistic Respect Executive):** `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`

**OREC Parameters (ZAO Configuration):**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `voting_period` | 259,200 sec (3 days) | Window for YES/NO votes |
| `veto_period` | 259,200 sec (3 days) | Window for NO-only veto |
| `prop_weight_threshold` | 1,000 Respect | Minimum YES weight to be eligible (on-chain `minWeight`, verified 2026-07-05) |
| `supermajority_ratio` | 2x | YES must exceed 2 * NO to pass |
| `min_quorum_percent` | ~10% | Rough minimum of active base |
| `respect_source` | OG ERC-20 | Vote weight drawn from this |
| `execution_target` | ZOR ERC-1155 | Respect minted to this |

**Respect Game Parameters (Current):**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Cycle | Weekly, Monday 6pm EST | Recurring schedule |
| Group size | 3-6 members | Ideal: 5-6 for wisdom of crowds |
| Consensus threshold | 2/3 | Per-person agreement required |
| Fibonacci curve (ZAO 2x) | 110/68/42/26/16/10 | Rank 1-6 Respect distribution |
| Decay model (proposed) | Banked/Active split; Active on a 180-day half-life | doc 941, not adopted |

---

## Appendix: Sources and Verification

**Code Verification (2026-07-02):**
- `src/lib/respect/voteWeight.ts` line 58: Vote weight formula (OG + ZOR, no decay applied currently).
- OREC contract addresses verified against Optimism mainnet (etherscan.io, blockscan.com).

**Research Foundation:**
- Doc 718a-d: Theory, mechanism design, on-chain architecture, comparative governance.
- Doc 718e: Critiques and failure modes.
- Doc 718f: Whitepaper craft and voice.
- Doc 718g: ZAO fractal distinctness.

**References to Proposed Future (Not Current):**
- Decay mechanism: Proposed in research (pending doc 941). Currently NOT applied.
- Multi-signal participation: Pending doc 941.
- Bounce routing and Year 3 migration: Pending doc 941.

**Chain and Contract Data:**
- Optimism OP Mainnet block explorers: etherscan.io/optimism, blockscan.com.
- OREC deployment: frapps.xyz (ORDAO deployment platform).
- ZAO OS codebase: `/Users/zaalpanthaki/Documents/ZAO OS V1/`.

---

**Version 0.1, 2026-07-02**

*This is a living document. All changes are versioned and logged above. The mission and creed are immutable. All mechanics evolve by community vote.*
