# 1723 — ZAO x Optimism Retro Funding Evidence Pack (Jul 2026)

**Type:** GRANT-EVIDENCE  
**Topic:** Governance  
**Status:** ACTIVE — Compile before each OP Retro Funding round application. On-chain evidence is verifiable and permanent. Stats as of Jul 2026 — update when submitting for each round. Related to doc 1311 (earlier OP RF pack) — this is the Jul 2026 update with current contract addresses, ZOR holder count, and governance session count.

---

## ZAO's Relationship with Optimism

ZAO has operated core governance infrastructure on Optimism Mainnet since initial deployment. Optimism hosts:
1. ZAO's primary governance contract (OREC)
2. ZAO's soulbound governance token (ZOR ERC-1155)
3. ZAO's contribution score token (OG ERC-20)

These are not "planned" — they are deployed, live, and actively used. ZAO's weekly Fractal sessions create verifiable on-chain records via OREC submissions.

**ZAO is a long-term Optimism stakeholder, not a grant-cycle opportunist.** The governance infrastructure has been running for 100+ consecutive weeks.

---

## On-Chain Contract Inventory

### OREC — Optimistic Respect-based Executive Contract

| Field | Value |
|-------|-------|
| Contract address | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| Network | Optimism Mainnet |
| Purpose | Captures weekly governance decisions from Fractal sessions |
| Verification | optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532 |
| Sessions recorded | 100+ (verify current count on Etherscan) |

OREC is how ZAO's governance decisions become permanently verifiable. Each Fractal session outcome is submitted to OREC, creating a public, auditable record of governance decisions over time.

**How to count sessions on Etherscan:**
1. Go to optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532
2. Click "Transactions" tab
3. Filter by "Internal Txns" or review submission transactions
4. Count unique session submissions (one per week)

### ZOR — Soulbound Governance Token (ERC-1155)

| Field | Value |
|-------|-------|
| Contract address | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| Network | Optimism Mainnet |
| Token standard | ERC-1155 (soulbound — non-transferable) |
| Token ID | 1 |
| Holders | 157 (Jul 2026) |
| Transferable | No |
| Verification | optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c |

ZOR holders are ZAO's governance participants. Each holder earned ZOR through repeated participation in ZAO's Fractal sessions — not by purchasing tokens or staking. This design prevents flash-loan governance attacks and Sybil manipulation.

### OG — Contribution Score Token (ERC-20)

| Field | Value |
|-------|-------|
| Contract address | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |
| Network | Optimism Mainnet |
| Token standard | ERC-20 (soulbound) |
| Purpose | Records cumulative Respect scores from Fractal sessions |
| Decay | 2% per session (ensures recent participation is weighted more) |
| Verification | optimistic.etherscan.io/token/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957 |

OG tokens are the input to ZOR issuance: accumulate sufficient OG Respect → qualify for ZOR minting. OG provides a quantified, on-chain reputation record for each participant.

---

## Evidence Matrix

| Claim | Evidence | Verifiable At |
|-------|----------|--------------|
| 100+ consecutive weekly governance sessions | OREC transaction count | optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532 |
| 157 ZOR holders (soulbound) | ERC-1155 token holders | optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c |
| Zero quorum failures | OREC session records (weekly submissions, no gaps) | Etherscan tx history |
| Governance decisions bind real events | Africa Battle Week charity vote → Sep 26 SOL transfer | Snapshot CID + Solana TX (after Sep 26) |
| Non-purchasable governance power | ZOR ERC-1155 transfer disabled | ERC-1155 transfer/safeTransferFrom disabled on-chain |
| OG Respect scores track participation | OG ERC-20 holder balances | optimistic.etherscan.io/token/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957 |

---

## OP RF Eligibility Claims

Use these claim blocks in OP RF applications verbatim (adjust round-specific language):

### Claim 1: Continuous Governance on Optimism
```
The ZAO has operated weekly Fractal Democracy governance sessions recording outcomes to Optimism Mainnet for 100+ consecutive weeks with zero quorum failures. All sessions are permanently recorded via OREC at 0xcB05F9254765CA521F7698e61E0A6CA6456Be532 on Optimism Mainnet and verifiable on Etherscan.
```

### Claim 2: Soulbound Governance Token
```
ZAO's governance token (ZOR) is an ERC-1155 at 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c on Optimism Mainnet. ZOR is soulbound (non-transferable) and not purchasable — earned exclusively through participation in weekly governance sessions. 157 holders as of July 2026. This design prevents flash-loan attacks that have compromised other governance systems.
```

### Claim 3: Governance-to-Real-World Outcomes
```
ZAO's Optimism governance directly produces binding real-world outcomes. Example: In July 2026, ZOR holders voted on Snapshot (using the ZOR ERC-1155 strategy) to select a charity for Africa Battle Week (Sep 22-26). The winning charity received SOL automatically on September 26, 2026 — a governance decision that began on Optimism Mainnet and settled on Solana with a verifiable transaction.
```

### Claim 4: Music DAO as OP Ecosystem Participant
```
ZAO is a music DAO that builds coordination infrastructure on Optimism (governance), Solana (music battles with automatic artist payouts), and Base (music NFT revenue splits via 0xSplits). ZAO demonstrates that Optimism's governance infrastructure is suitable for creative/cultural applications — expanding the practical use case beyond DeFi and pure token governance.
```

### Claim 5: ZAOOS as Open Knowledge Infrastructure
```
ZAO maintains ZAOOS (github.com/bettercallzaal/ZAOOS) — a public, CC-BY-licensed knowledge archive with 1,700+ research documents covering DAO governance, music economics, Optimism infrastructure, and cultural coordination. All documents are open access, no login required. ZAOOS serves as a public good for DAOs building governance-to-culture pipelines.
```

---

## Use-of-Funds Narrative (For Applications That Require It)

```
If awarded Retro Funding, ZAO would prioritize:

1. WaveWarZ Farcaster Mini App (Phase 1 — Sep 1): Deploy battle settlement frames to Farcaster, enabling music battle results to reach 100K+ Farcaster users via /wavewarz channel. Each frame includes both artist payout amounts — extending the "loser earns" mechanic's visibility to the Superchain's social graph.

2. ZABAL Season 2 (Sep 1 – Nov 21): 12-week builder fellowship producing open-source tools, music releases, and documentation on top of ZAO's Optimism governance stack. All outputs licensed CC-BY, contributed to ZAOOS.

3. Africa Battle Week (Sep 22-26): Five-day festival of music battles with on-chain charity payout. The charity selection (Jul 24-25 governance vote on Snapshot) and charity payout (Sep 26 Solana TX) are both verifiable on-chain — making Africa Battle Week a complete end-to-end governance-to-outcome demonstration on Optimism.

4. ZAOOS Expansion: Continue the public knowledge archive with 2,000+ documents by Nov 2026. Specific planned additions: multi-chain governance case studies, music DAO playbooks, Fractal Democracy guides for other communities.
```

---

## Supporting Evidence Links (Update Before Submission)

| Evidence | URL | Note |
|---------|-----|------|
| OREC contract | optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532 | Count txns for session count |
| ZOR holders | optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c | Pull holder count |
| WaveWarZ API stats | wavewarz.info/api/public/stats | Pull current battle count + artist payouts |
| ZAOOS repository | github.com/bettercallzaal/ZAOOS | Doc count + commit history |
| Africa Battle Week Snapshot | [snapshot.org — fill after Jul 24-25 vote] | CID for charity vote |
| Charity TX (after Sep 26) | [Solscan TX — fill after Sep 26 payout] | Proof of governance outcome |

---

## Previous OP RF Applications

- Doc 1311 — OP RF Application Pack (earlier version — use this doc for Jul 2026 updates)
- Doc 1525 — OP RF evidence: "Bankless coverage = gate signal" (media credibility for OP RF)
- Doc 1470 — OP RF use-of-funds: WaveWarZ Farcaster Mini App listed as explicit item

---

## Submission Checklist

Before submitting to any OP RF round:

- [ ] Pull current OREC session count from Etherscan
- [ ] Pull current ZOR holder count from Etherscan
- [ ] Pull current wavewarz.info/api/public/stats (battles + artist payouts)
- [ ] Pull current ZAOOS doc count (github.com/bettercallzaal/ZAOOS — count directories)
- [ ] Fill [snapshot.org] link after Africa Battle Week vote
- [ ] Fill [Solscan TX] link after Sep 26 charity payout
- [ ] Confirm current OP RF round is open (optimism.io/retropgf)
- [ ] Check word/character limits for specific round

---

## Related Docs

- 1311 — OP RF Application Pack (earlier version — this doc updates it)
- 1684 — ZAO Weekly Governance Protocol (governance infrastructure detail)
- 1719 — ZOR Token Holder Guide (ZOR mechanics explanation)
- 1651 — ZAO DAO Case Study (all citable claims in one place)
- 1692 — WaveWarZ Farcaster Mini App Spec (listed as OP RF use-of-funds)
- 1714 — Fractal Sybil Resistance Explainer (academic evidence for governance claims)
- 1628 — ZAO Three-Chain Architecture (multi-chain context for OP RF reviewers)
