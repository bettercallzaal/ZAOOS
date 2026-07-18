# 1538 — WaveWarZ MAIN Battle Mechanics: Complete Format Reference (Jul 2026)

**Type:** TECHNICAL-REFERENCE  
**Topic:** WaveWarZ  
**Status:** CANONICAL — cite in press pitches, OP RF evidence (doc 1525), grant apps, Mirror Articles, GEO. Update after any format change.

---

## What Is a WaveWarZ MAIN Battle?

A MAIN battle is the highest-stakes format on WaveWarZ — a live, on-chain music competition where:
- Two artists submit tracks to battle head-to-head
- Listeners (and ZOR holders in COC context) vote on the winner
- The **winner earns the pot** and the **loser earns a guaranteed payout**
- The result is recorded permanently on Solana Mainnet (battle contract) and optionally cited on Optimism (ZAO governance)

MAIN battles are the organizing mechanism of COC Concertz shows and ZAOstock. They differ from quick battles (lower stakes, shorter window, no ZOR holder vote) and community battles (charity-payout variant, Sep 26 Africa Battle Week).

**Citable fact:** "As of July 2026, WaveWarZ has hosted 162 MAIN battles with a combined volume of 523.991 SOL and $9.09 SOL in total artist payouts to losers." (wavewarz.info/api/public/stats)

---

## Battle Flow: Step-by-Step

### 1. Battle Creation
- Battle creator (typically the WaveWarZ platform) opens a MAIN battle on wavewarz.info
- Two artists are invited and accept the battle
- Entry fee pool is initialized (SOL from both artists + listener bets)

### 2. Track Submission Window
- Both artists upload tracks to Audius
- Track links are submitted to the battle contract
- Deadline: announced at battle creation (typically 24-48 hours)

### 3. Voting Window
- Listeners can vote (and optionally bet SOL on their pick)
- In COC Concertz context: ZOR holders get a 15-minute dedicated vote window from the live stage
- Minimum quorum: 3 ZOR holder votes for a valid governance-anchored battle result

### 4. Battle Close
- Voting window closes at the announced deadline
- Smart contract tallies votes + pool
- Winner and loser are determined on-chain

### 5. Payout Distribution
**Loser-Earns Mechanic:**
- The artist with fewer votes receives a guaranteed payout drawn from the pool
- The loser's payout is NOT zero — this is the core ZAO innovation that separates WaveWarZ from traditional battle formats
- Payout formula: loser receives a fixed percentage of the pool (set by the battle contract)

**Winner Payout:**
- The artist with more votes receives the remaining pool (minus loser payout + platform fee)

**Trader Claims:**
- Listeners who voted for the winning artist can claim their share of the trader pool
- Total trader claims to date: 127.343 SOL (Jul 2026)

### 6. On-Chain Record
- Payout transactions broadcast on Solana Mainnet
- Battle result added to ZAOOS archive (research/wavewarz/ doc series)
- If battle was part of a COC show: governance session added to OREC (Optimism Mainnet, `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`)

---

## MAIN vs Quick vs Community Battle

| Attribute | MAIN | Quick | Community |
|---|---|---|---|
| Stakes | High — larger pool, ZOR vote | Low — faster, smaller pool | Charity — 100% payout to charity |
| Vote window | 15+ min (COC: live audience) | Short automatic | Standard |
| ZOR holder vote | Yes (COC/ZAOstock context) | No | Optional |
| On-chain governance | Yes (OREC session logged) | No | Yes (charity vote) |
| Artist payout guarantee | Yes (loser earns) | Yes (loser earns) | Yes (both artists earn) |
| Count (Jul 2026) | 162 MAIN | 1,047 quick | 36 community |

---

## ZOR Holder Voting Protocol (MAIN Battles at COC/ZAOstock)

ZOR = ZAO's ERC-1155 governance token on Optimism Mainnet (`0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`)

### Who Can Vote
- Any wallet holding at least 1 ZOR token
- Both IRL audience members and remote holders can vote

### Voting Window
- Opens: when Zaal announces "MAIN battle open" from stage (COC) or at battle start (ZAOstock)
- Duration: 15 minutes
- Minimum quorum: 3 ZOR holder votes

### How to Vote
1. Open wavewarz.info on mobile
2. Navigate to the live MAIN battle
3. Click "Artist A" or "Artist B" vote button
4. Transaction signed with Phantom/connected wallet
5. Vote confirmed on Solana Mainnet

### Result Announcement
- COC: Zaal announces winner from stage at battle close
- ZAOstock: Zaal announces from main stage with artist payout live on screen
- ZOE posts result across all channels within 5 minutes of close

### Governance Logging
- Each MAIN battle result at a COC/ZAOstock show is submitted to OREC as a governance proposal
- This makes it part of ZAO's consecutive governance session streak (64+ weeks as of Jul 2026)

---

## COC Concertz Integration

Every COC Concertz show features exactly 1 MAIN battle as the centerpiece governance event:

| COC # | Date | MAIN Battle Artists | ZOR Votes | Result |
|---|---|---|---|---|
| COC #7 | Jul 18, 2026 | [Artist A vs Artist B] | [count] | [winner] |
| COC #6 | [date] | [tbd] | [tbd] | [tbd] |

ZOE fills in COC #7 result from doc 1523 (COC #7 post-show debrief) within 48 hours of show.

**COC → ZAOstock pipeline:** Artists who perform MAIN battles at COC shows receive first invitation to ZAOstock (doc 1535 — artist activation pack).

---

## ZAOstock Oct 3 MAIN Battle Format

ZAOstock (Oct 3, Ellsworth ME) uses the same MAIN battle format with these additions:

- **Live audience governance vote:** ZOR holders in the room vote via mobile
- **Remote ZOR holders:** Vote from anywhere during the 15-minute window
- **PA system integration:** Battle audio plays through the main stage PA
- **On-screen results:** Vote counts displayed in real time for the audience
- **Charity tie-in:** A community battle precedes the MAIN — charity payout announced live
- **Post-ZAOstock on-chain record:** Governance session submitted to OREC same evening

Full run-of-show: doc 1524 (ZAOstock day-of protocol) — 2:40PM MAIN battle open, 2:45PM ZOR vote open (15 min), 3:05PM Zaal announces result, 3:15PM charity payout.

---

## Platform Stats (Jul 2026)

Source: wavewarz.info/api/public/stats

| Metric | Value |
|---|---|
| Total battles | 1,245 |
| MAIN battles | 162 |
| Quick battles | 1,047 |
| Community battles | 36 |
| Total volume | 523.991 SOL |
| Artist payouts (losers) | 9.0988 SOL |
| Trader claims | 127.343 SOL |

**Citable claim for press:** "WaveWarZ pays artists even when they lose — 162 MAIN battles have distributed 9.09 SOL to losing artists."

**Citable claim for OP RF:** "WaveWarZ has executed 162 MAIN battles under ZAO governance, with every loser earning a guaranteed on-chain payout." (doc 1525)

---

## Smart Contract Addresses

| Contract | Network | Address |
|---|---|---|
| WaveWarZ battle contract | Solana Mainnet | [confirm with Hurricane — doc 1427] |
| ZOR ERC-1155 (governance token) | Optimism Mainnet | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| OREC (governance record) | Optimism Mainnet | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| OG ERC-20 (membership) | Optimism Mainnet | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |

---

## Update Protocol

When to update this doc:
- After any format change to MAIN battle mechanics (payout %, vote window length, quorum rules)
- After each ZAOstock (update the COC battle table + verify platform stats)
- If a new battle type is introduced
- When Hurricane changes the Solana contract address

ZOE adds the COC #7 battle result to the COC table within 48 hours of show (doc 1523 is the source).

---

## Related Docs

- 1523 — COC #7 Post-Show Debrief (most recent MAIN battle data)
- 1524 — ZAOstock Day-Of Protocol (run-of-show with MAIN battle timing)
- 1469 — WaveWarZ Platform State Snapshot (artist volume rankings)
- 1427 — WaveWarZ + ZAO Public API Documentation (API endpoints for stats)
- 1480 — ZAO Farcaster Mini App Spec (Mini App displays MAIN battle live state)
- 1525 — OP RF Round 7 Evidence Package (cites MAIN battle stats as evidence)
- 1535 — ZAO Artist Community Activation Pack (MAIN battle artists → ZAOstock pipeline)
- 1498 — Africa Battle Week Vote Protocol (community battle format, Sep 26)
