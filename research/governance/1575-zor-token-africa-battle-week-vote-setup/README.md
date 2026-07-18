---
topic: governance, community, wavewarz
type: action-guide
status: DO NOW — Vote opens Jul 24 (4 days); setup takes 25 min
last-validated: 2026-07-20
related-docs: 1553-governance-zor-holder-voting-guide, 1569-africa-battle-week-jul20-activation-checklist, 1498-africa-battle-week-vote-protocol, 1557-africa-battle-week-charity-shortlist
board-tasks: None (supports Africa Battle Week charity vote execution)
action-owner: Zaal (runs Snapshot setup or posts Farcaster poll); ZOE (monitors votes + tallies)
---

# 1575 — Africa Battle Week Charity Vote: ZOR Token Setup on Snapshot

> **What this is:** Setup guide for the Africa Battle Week charity vote opening Jul 24. Two paths are available — Snapshot (official onchain governance) and Farcaster poll (faster, less formal). This doc confirms Snapshot is viable for ZOR (ERC-1155 on Optimism), gives the exact setup steps, and recommends which path to use based on available setup time.

---

## ZOR Token: What We're Working With

From doc 1553:

| Property | Value |
|----------|-------|
| Token standard | ERC-1155 |
| Network | Optimism Mainnet (chain ID 10) |
| Contract | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| Minimum to vote | 1 ZOR (confirm with Hurricane) |
| Known holder count | 43 verified wallets (in `src/lib/wavewarz/constants.ts`) |
| Distribution | Earned by attending Fractal Democracy sessions (not purchased) |

**Key implication:** ZOR is earned, not bought. ZOR holders are the most engaged ZAO community members — the people who show up weekly. Their vote on the Africa Battle Week charity carries governance legitimacy.

---

## Path A — Snapshot (Recommended for Governance Legitimacy)

Snapshot supports ERC-1155 tokens on Optimism via the `erc1155-balance-of` strategy. Setup takes ~25 min.

### Step 1: Verify thezao.eth Snapshot Space (5 min)

Check if a Snapshot space already exists:
1. Go to `snapshot.org/#/thezao.eth`
2. If the space exists, skip to Step 2
3. If not: `snapshot.org` → Connect wallet (use the ZAO admin wallet or bettercallzaal.eth) → Create Space → ENS = `thezao.eth`

**If thezao.eth doesn't resolve:** Use `bettercallzaal.eth` as the space name, or create a temporary space `wavewarz-africa-vote.eth` is unavailable — use a non-ENS space name (Snapshot allows this for new spaces without ENS).

### Step 2: Add ZOR Token as Voting Strategy (10 min)

In the Snapshot space settings:
1. Go to `snapshot.org/#/thezao.eth/settings`
2. Click **Voting** → **Strategies**
3. Click **+ Add Strategy**
4. Search for: `erc1155-balance-of`
5. Configure:
   ```json
   {
     "address": "0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c",
     "id": "1",
     "decimals": 0,
     "symbol": "ZOR",
     "network": "10"
   }
   ```
   - `network: "10"` = Optimism Mainnet
   - `id: "1"` = ERC-1155 token ID. **Verify the token ID with Hurricane** — ERC-1155 tokens have multiple IDs; the ZOR voting token is likely ID 1 but could be different.
6. Save strategy

**Validation:** After adding the strategy, test it by entering a known ZOR holder's address in the strategy tester. It should return a non-zero voting weight.

### Step 3: Create the Charity Vote Proposal (10 min)

Title: `Africa Battle Week Sep 26: Choose the charity recipient`

Body:
```
ZAO's Africa Battle Week is Sep 26: a US WaveWarZ veteran vs. a West African artist.
100% of the battle payout goes to a charity voted on by ZOR holders.

The battle celebrates African music culture. Your vote decides where the money goes.

Nominations were open Jul 20-23. The community nominated charities focused on 
music, arts, and youth education in Africa and the African diaspora.

SHORTLIST:
A — Music In Africa Foundation (musicinafrica.net)
    Pan-African music development, grants, and training since 2013.

B — Fela Kuti Foundation / New Afrika Shrine
    Lagos-based cultural center honoring Afrobeat's roots; free concerts for Lagos youth.

C — [Top community nomination from Jul 20-23 nominations]
    [Add description when nominations are tallied on Jul 24 morning]

Vote with your ZOR holdings. One ZOR = one vote.
Payout transferred within 24h of Sep 26 battle completion.
```

Settings:
- **Type:** Single choice (1 of 3)
- **Start:** Jul 24 2026, 12:00pm ET
- **End:** Jul 25 2026, 8:00pm ET
- **Quorum:** None (small community, any participation valid)
- **Voting system:** Single choice
- **Snapshot block:** Select the current Optimism block (Snapshot auto-fills)

**Critical:** Publish the proposal before Jul 24 12pm ET so it opens on time.

---

## Path B — Farcaster Poll (Faster, Less Formal)

If Snapshot setup is unavailable before Jul 24 (thezao.eth space issues, token ID unknown, etc.), use a Farcaster reply poll as the backup.

**Cast text (already drafted in doc 1569 + 1557):**
```
Africa Battle Week charity vote is LIVE.
ZOR holders: your vote decides where the Sep 26 battle payout goes.

Options:
A — Music In Africa Foundation (musicinafrica.net)
B — Fela Kuti Foundation / New Afrika Shrine
C — [Community nomination]

Vote by replying: A, B, or C
Include your wallet address so we can verify ZOR holdings.

Vote closes Jul 25 at 8pm ET.
```

**Tallying:** ZOE collects replies on Jul 25, cross-references wallet addresses against the 43 verified ZOR holders in `src/lib/wavewarz/constants.ts`, counts weighted votes.

**Manual verification:** For wallets not in constants.ts, check Optimism Blockscout:
```
https://optimism.blockscout.com/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c
```
→ Token page → Holders tab → verify the wallet's balance.

---

## Which Path to Choose

| Factor | Snapshot | Farcaster Poll |
|--------|----------|---------------|
| Setup time | 25 min | 5 min |
| Vote tally | Automatic | Manual (ZOE cross-references wallets) |
| Governance legitimacy | High (onchain, verifiable) | Medium (Farcaster post, manual) |
| Requires | thezao.eth ENS + ZOR token ID | Nothing new — cast + ZOE monitoring |
| Risk | Token ID might be wrong | Reply might include non-ZOR holders |
| Best if | Zaal has 30 min before Jul 24 | Time is tight or token ID uncertain |

**Recommendation:** Try Snapshot first. If `thezao.eth` space is already set up, the whole thing takes 15 min. If you hit friction (token ID, space creation), fall back to Farcaster poll — the community is small enough (43 holders) that manual tally is fine.

---

## Day-Of Checklist (Jul 24)

**Morning (9am ET):**
- [ ] Tally charity nominations from Jul 20-23 cast replies (ZOE)
- [ ] Identify top community nomination (if any)
- [ ] Finalize Option C in the Snapshot/poll text

**Before noon ET:**
- [ ] Publish Snapshot proposal (or post Farcaster poll) — set to open at 12pm
- [ ] Post Farcaster cast in /zao and /wavewarz announcing vote is live
- [ ] Post in ZAO Telegram with Snapshot link or Farcaster poll link

**Noon ET:**
- [ ] Verify vote is live and accepting responses
- [ ] Monitor for participation throughout the day

---

## Questions for Zaal/Hurricane (Before Jul 24)

**Q1 — ZOR token ID:** What is the ERC-1155 token ID for ZOR? The contract is `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`. Is the ID 1? Check on Optimism Blockscout → the token page will show token IDs.

**Q2 — Snapshot space:** Does `thezao.eth` already have a Snapshot space? If yes, does it already have the ZOR strategy configured?

**Q3 — Minimum ZOR to vote:** Is the minimum 1 ZOR confirmed? This affects whether to set a quorum.

**Q4 — Voting weight:** 1 ZOR = 1 vote, or proportional (more ZOR = more weight)?

---

## Sources

- Doc 1553: ZOR holder voting guide (ZOR contract address, token standard, network)
- Doc 1569: Africa Battle Week Jul 20 activation checklist
- Doc 1557: Africa Battle Week charity shortlist (5 candidates)
- Snapshot ERC-1155 strategy docs: docs.snapshot.org/strategies/erc1155-balance-of
- ZOR on Optimism: `optimism.blockscout.com/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
- ZAOOS `src/lib/wavewarz/constants.ts`: 43 verified ZOR holder wallets
