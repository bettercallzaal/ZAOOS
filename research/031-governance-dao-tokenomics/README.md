# 31 — Governance, DAO Structure & Token Economics

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Design ZAO's governance, token model, treasury, and legal structure

---

## Key Decisions for ZAO OS

### Phase 1 (40 Members)
- **Governance:** 3-of-5 Safe multisig + Snapshot voting + optimistic governance (pass unless vetoed in 7 days)
- **Legal:** Wyoming DAO LLC or DUNA (~$300 filing)
- **Token:** ERC-1155 on Base (governance + membership + collectibles in one contract)
- **Treasury target:** $25K-$50K initial
- **Compensation:** Coordinape (peer-to-peer allocation) + bounties
- **Quorum:** 25% routine, 50% for treasury >$5K

### Phase 2 (100-500 Members)
- Add delegation, move to Snapshot X or on-chain Governor
- Consider bonding curve for new member onboarding
- Diversify treasury: 40% stables, 30% ETH, 20% native token, 10% yield
- Lower quorum: 15% routine, 30% major

### Phase 3 (1000+ Members)
- Full on-chain Governor with quadratic voting
- veToken model (time-weighted governance power)
- Professional treasury management via Coinshift
- Quorum: 5-10% with adaptive quorum by proposal type

---

## 1. Governance Models

### Nouns DAO
- Daily NFT auctions, 100% to treasury, 1 NFT = 1 vote
- Risk: "ragequit" fork (holders withdrew ~$27M in Sept 2023)
- ZAO adaptation: weekly/monthly auctions instead of daily

### Purple DAO (Farcaster)
- Two tiers: DAO members (voted in) vs community members (participate, no vote)
- Security Council holds veto power against governance attacks
- Grants Chair + Revenue Chair roles
- **Best reference model for ZAO** — similar size and mission

### Songcamp (42-Person Coordination)
- "DAO as a verb" — not formal DAO, but collective ownership
- Camp Counselors guide newcomers
- "Exit to community" — distribute ownership tokens when project concludes
- **Almost exactly ZAO's 40-person size** — directly applicable

### Voting Models

| Model | Pros | Cons | Best For |
|-------|------|------|----------|
| **Token-weighted** | Aligns with financial stake | Whale dominance | Financial DAOs |
| **Reputation-weighted** | Rewards contribution | Hard to quantify | Community DAOs |
| **Quadratic** | Prevents plutocracy (√tokens = votes) | Sybil-vulnerable | Fair governance |
| **Conviction** | Preferences strengthen over time | Slow | Long-term decisions |
| **Optimistic** | Fast iteration, veto-only override | Requires trust | Small, trusted DAOs |

**Recommended for ZAO:** Optimistic governance (proposals pass unless vetoed) with reputation-weighted voting. Prevents voter fatigue at small scale while maintaining accountability.

### Snapshot vs On-Chain

- **Snapshot (off-chain):** Zero gas, 96% of major DAOs use it, 10-30x higher participation. Requires multisig execution.
- **On-chain (Tally/Governor):** Trustless auto-execution but $5-50+ per vote on L1. Use on L2 (Base) for affordability.
- **Snapshot X:** Hybrid — off-chain voting with on-chain execution via Starknet proofs.
- **Start with Snapshot, migrate to on-chain when governance matures.**

### Preventing Plutocracy
- Quadratic voting (√tokens = votes)
- Conviction voting (time-weighted preferences)
- Daily auctions (constant dilution)
- Reputation overlay (active contributors get vote boost)
- Delegation transparency (whale influence visible)

---

## 2. Token Economics

### Token Design for ZAO

| Aspect | Decision |
|--------|----------|
| **Standard** | ERC-1155 on Base (fungible governance + non-fungible membership + semi-fungible badges in one contract) |
| **Supply model** | Fixed initially, 1-2% annual inflation after Year 2 |
| **Distribution** | 35% founders (40 members, vested 4yr/1yr cliff), 40% community (earned via Respect), 15% treasury, 10% future contributors |
| **Vesting** | 4-year vest, 1-year cliff for founders. 0.75-1% per founding member. |
| **Tradeable?** | Governance token: tradeable. Respect tokens: NOT tradeable (soulbound). |

### Lessons from Existing Tokens

**DEGEN:** 37B fixed supply until 2028, then 1% inflation. 70% community via airdrops, 15% ecosystem, 10% team, 5% investors. Daily tipping allowance based on social clout.

**MOXIE:** 10B supply. Fan Tokens create buy-and-burn deflationary pressure. 50% to member, 20% burns member tokens, 20% burns channel tokens, 10% burns network tokens. 40M+ burned.

**Key lesson:** Tokens representing utility + access survive. Purely speculative tokens fail.

### Revenue-Sharing vs Governance vs Utility

| Type | Legal Risk | Example |
|------|-----------|---------|
| **Governance** (voting only) | Lower | UNI, COMP |
| **Utility** (access + tipping) | Moderate | DEGEN, FIL |
| **Revenue-sharing** (dividends) | Highest (likely security) | Avoid for now |

**ZAO should start as governance + utility. Avoid revenue-sharing until legal clarity improves.**

---

## 3. Treasury Management

### Safe{Wallet} (Gnosis Safe)
- Secures $22B+ across 4.3M accounts
- 3-of-5 multisig for ZAO with geographically diverse signers
- SafeSnap: auto-execute Snapshot vote results
- Spending policies: per-transaction and daily limits

### Diversification
- 40-50% stablecoins (USDC/DAI) — operating expenses
- 25-35% ETH — ecosystem alignment
- 10-15% native token — governance reserve
- 5-10% DeFi yield — revenue generation
- Maintain 12-18 months operating expenses in stables

### Spending Tiers
- Under $500: Single signer approval
- $500-$5,000: 3-of-5 multisig
- Over $5,000: Full community Snapshot vote

### Fundraising
- **Juicebox:** Programmable funding cycles, token issuance, ragequit mechanism
- **Gitcoin Grants:** Quadratic funding for public goods
- **Purple DAO grants:** Farcaster ecosystem funding
- **Optimism RetroPGF:** Retroactive public goods funding

### Contributor Compensation
- **Coordinape:** Peer-to-peer allocation (each member gets 100 GIVE tokens per epoch)
- **Bounties:** Specific tasks on GitHub/Linear
- **Streaming:** Sablier/Superfluid for ongoing contributors
- **Retainers:** Fixed monthly for core team

---

## 4. Legal & Compliance

### Securities Law (Howey Test)
A token is a security if: investment of money + common enterprise + expectation of profits + derived from efforts of others. All four must be true.

**ZAO protection strategy:**
- Never market token as investment
- Never promise price appreciation
- Distribute based on contribution, not purchase
- Clear utility (voting, access, tipping)
- SEC Staff (Jan 2026): "economic reality trumps labels"

### DAO Legal Wrappers

| Jurisdiction | Cost | Best For |
|-------------|------|----------|
| **Wyoming DAO LLC/DUNA** | ~$300 | US-based, simple, on-chain governance recognized |
| **Marshall Islands MIDAO** | ~$5-10K | Maximally decentralized, global |
| **Cayman Foundation** | ~$10-25K | Significant treasury, ownerless entity |

**Recommendation:** Wyoming DUNA — lowest cost, clear liability protection, aligns with on-chain governance.

### Tax
- DAO earnings: pass-through (each member reports their share)
- Token distributions: ordinary income at FMV when received
- Governance token sales: capital gains
- Starting 2025: crypto brokers must report sales (Form 1099-DA)

### Privacy (GDPR/CCPA)
- Never store PII on-chain
- Farcaster's hybrid architecture (identity on-chain, data on hubs) is compliant
- ZAO OS data (allowlist, profiles) in Supabase = deletable on request
- EDPB Guidelines 02/2025: first EU guidance on blockchain + personal data

### Content Liability
- Section 230 shields platforms from user content liability (uncertain for DAOs)
- TAKE IT DOWN Act (May 2025): must remove flagged content within 48 hours
- Gated community with allowlist = stronger control than open platform
- Legal entity (LLC) bears liability, not individual members

### Music IP
- NFT purchase does NOT grant copyright (80% of NFTs give no rights)
- Smart contract royalties automate distribution
- DAO can collectively manage catalog with encoded split sheets
- Create clear IP policy: artists retain all rights, DAO gets limited display/stream license

---

## Sources

- [Nouns DAO Governance](https://www.nouns.com/learn/nouns-dao-governance-explained)
- [Purple DAO](https://purple.construction/about/)
- [Songcamp / Elektra](https://www.waterandmusic.com/music-dao-deep-dives-pt-7-how-songcamp-elektra-is-building-web3-native-artist-collective/)
- [Snapshot DAO Report 2025](https://daotimes.com/snapshot-dao-tool-report-for-2025/)
- [OpenZeppelin Governor](https://blog.openzeppelin.com/governor-smart-contract)
- [DEGEN Tokenomics](https://designingtokenomics.com/designing-tokenomics-blog/going-degen-the-degen-token-thats-taken-farcaster-by-storm)
- [Moxie Protocol](https://cryptoconexion.com/discover-how-moxie-works-the-innovative-protocol-on-farcaster/)
- [DAO Treasury Management](https://www.coinmetro.com/learning-lab/dao-treasury-management-practices)
- [Safe{Wallet}](https://safe.global/)
- [Juicebox](https://juicebox.money/)
- [Coordinape](https://coordinape.com/)
- [Howey Test & Crypto](https://www.skadden.com/insights/publications/2025/08/howeys-still-here)
- [Wyoming DUNA](https://frblaw.com/the-wyoming-duna-and-the-future-of-dao-legal-frameworks/)
- [Marshall Islands MIDAO](https://www.legalnodes.com/article/marshall-islands-llc-as-a-dao-legal-wrapper)
- [GDPR & Blockchain](https://www.privacyworld.blog/2025/05/from-blocks-to-rights-privacy-and-blockchain-in-the-eyes-of-the-eu-data-protection-authorities/)
- [Music NFT IP](https://www.waterandmusic.com/defining-music-nft-ownership-from-the-digital-to-the-analog-world/)
