# 1719 — ZOR Token Holder Guide: What It Means, What It Unlocks (Jul 2026)

**Type:** COMMUNITY-GUIDE  
**Topic:** Governance  
**Status:** ACTIVE — ZOE sends this when a new ZOR holder asks "I earned a ZOR — now what?" or when Fractal session attendees ask about their governance access. Also used to recruit new Fractal participants by explaining the path from no ZOR → first vote. 157 ZOR holders as of Jul 2026. Contract: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Optimism Mainnet).

---

## What Is ZOR?

ZOR is ZAO's governance token. It's an ERC-1155 token on Optimism Mainnet.

**What makes ZOR different from other governance tokens:**
- **Soulbound:** ZOR cannot be transferred or sold. It stays in the wallet it was earned in.
- **Earned, not bought:** You cannot purchase ZOR on any exchange. It's earned through participation in ZAO's weekly Fractal governance sessions.
- **Not divisible:** Each ZOR is a whole token (ERC-1155). You either hold one or you don't.
- **Verifiable on-chain:** Anyone can verify your ZOR holdings on Optimism at any time.

**The soulbound property solves a real governance problem:** Standard ERC-20 governance tokens can be flash-loaned, borrowed, or pooled to temporarily inflate voting power for a single proposal. Because ZOR is soulbound, you can only vote with ZOR you have personally earned through participation. You cannot rent governance power.

---

## The ZOR Contract

| Field | Value |
|-------|-------|
| Contract | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| Network | Optimism Mainnet |
| Token type | ERC-1155 (soulbound) |
| Token ID | 1 |
| Holders (Jul 2026) | 157 |
| Transferable | No |
| Purchasable | No |

**Verify your ZOR on Etherscan:**  
Go to `optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` and search your wallet address in "Token Holders."

**Check your balance via OpenSea (Optimism):**  
Search your wallet on OpenSea with Optimism network selected. ZOR appears as a non-transferable item.

---

## How ZOR Is Earned

ZOR is earned through ZAO's **Fractal Democracy** governance sessions.

**The process:**
1. Attend a weekly Fractal session (details posted in Telegram ZAO Public and Farcaster /zao each week)
2. In each session, participants vote on each other using the Respect/Fractal ranking system
3. Participants with high Respect scores across sessions accumulate OG Respect tokens
4. After sufficient OG Respect accumulation, ZAO governance issues ZOR to eligible wallets

**There is no shortcut:** You earn ZOR by showing up, contributing, and being recognized by the community over time. The minimum path is typically 8-12 Fractal sessions with strong participation.

**You cannot earn ZOR by:**
- Buying tokens
- Staking in a liquidity pool
- Holding other ZAO tokens
- Being a WaveWarZ artist or trader alone

ZOR reflects governance participation history, not financial stake.

---

## What ZOR Unlocks

Holding ZOR gives you access to:

### 1. Snapshot Voting (Off-Chain Binding Votes)

**What it is:** ZAO uses Snapshot.org for binding governance votes. The strategy reads your ZOR balance on Optimism at a specific block.

**Examples of what ZOR holders vote on:**
- Which charity receives Africa Battle Week proceeds (Jul 24-25 vote)
- Major operational decisions (budget allocations, event approval, partnership decisions)
- ZAOstock lineup and format decisions

**How to vote:**
1. Go to snapshot.org
2. Search for "thezao.eth" or "bettercallzaal.eth" (confirm current ZAO Snapshot space with Zaal)
3. Connect your Optimism wallet
4. Vote on active proposals

**Quorum:** Proposals require a minimum participation threshold to pass. ZAO has maintained zero quorum failures in 100+ consecutive sessions.

### 2. WaveWarZ MAIN Battle Nominations

ZOR holders can nominate artists for WaveWarZ MAIN battles. MAIN battles are the highest-volume events (COC Concertz), typically paying artists $500–$3,000+ each.

**How to nominate:**
- Bring your nomination to the weekly Fractal session
- State the artist name + Audius handle + why they should be in a MAIN battle
- The Fractal group votes on nominations using the Respect system

Most MAIN battle lineups are decided by ZOR holder consensus, not by Zaal alone. Your nomination can directly shape which artists get the highest-visibility battles.

### 3. ZAO Music Revenue Share (10%)

Every ZAO Music release uses an immutable 0xSplits contract on Base. 10% of all on-chain release revenue flows to ZOR holders collectively, distributed pro-rata to all 157 holders.

**When this activates:** When Cipher (ZAO's first planned release, Sept 2026) and subsequent ZAO Music releases generate on-chain revenue (Sound.xyz sales, Zora mints).

**How distribution works:** Zaal manually triggers the 0xSplits distribution when the contract accumulates meaningful value (threshold TBD). Distribution goes to the Ethereum/Base wallet registered with your ZOR (or the same Optimism wallet — confirm with Zaal which wallet to register).

### 4. Community Battle Approval

ZOR holders collectively approve community battle proposals submitted by organizers. Your vote in the Fractal session determines whether a community organizer's battle gets the green light.

### 5. Africa Battle Week Governance

Africa Battle Week is ZAO's biggest community event (Sep 22-26, 2026). ZOR holders govern:
- Which charity receives proceeds (Jul 24-25 Snapshot vote)
- Which artists are nominated for ABW MAIN battles
- Whether additional community battle proposals are approved

As a ZOR holder, you are directly responsible for how Africa Battle Week is organized.

---

## Your First Vote: Step-by-Step

**Scenario:** The Africa Battle Week charity Snapshot vote is live Jul 24-25.

**Before Jul 24:**
1. Make sure your Optimism wallet that holds ZOR is connected to MetaMask or Rainbow
2. Go to snapshot.org
3. Search for the ZAO space (link posted in Telegram ZAO Public Jul 23)
4. Review the three charity candidates in doc 1678

**On Jul 24 (vote opens at 12 PM ET):**
1. Open the Snapshot poll
2. Click "Connect Wallet" — use the Optimism wallet that holds your ZOR
3. Select your charity choice
4. Sign the vote (gasless — no transaction fee)
5. Confirm your vote appears in the proposal's voter list

**Important:** The Snapshot strategy reads your ZOR balance at the block when the proposal was created. If you earned ZOR after the proposal was created, you may not be eligible for this specific vote — your ZOR will apply to future proposals.

---

## ZOR and the Governance Track Record

157 ZOR holders. 100+ consecutive Fractal sessions. 0 quorum failures.

This track record is citable in:
- OP Retro Funding applications ("ZAO has operated continuous on-chain governance for 100+ weeks on Optimism")
- Press pitches ("ZAO community of 157 governance token holders has voted on artist lineups for 2+ years")
- Academic research on DAO governance
- Artist recruitment ("the artists you battle for are chosen by 157 governance participants")

By holding ZOR, you are part of a governance record that is on-chain and verifiable.

---

## ZOR Holder FAQ

**"Can I give my ZOR to someone else?"**  
No. ZOR is soulbound — permanently attached to the wallet that earned it. This is intentional.

**"What if I lose access to my wallet?"**  
ZOR cannot be recovered to a new wallet. Your voting rights are tied to your original wallet. Secure your seed phrase.

**"Can I earn more than one ZOR?"**  
The standard is one ZOR per participant. Additional ZOR may be issued in future governance cycles to active long-term contributors — this would be decided by the Fractal group.

**"Does ZOR give me equity in ZAO?"**  
No. ZOR is a governance token, not an equity share. It confers voting rights and revenue-share access (via 0xSplits on music releases), not ownership of ZAO's legal entity.

**"What chain do I need for voting?"**  
Optimism Mainnet. Make sure your wallet has a small amount of ETH on Optimism for gas if you ever need to transact (Snapshot votes are gasless, but other operations may require ETH).

**"Does Zaal vote on the same proposals I vote on?"**  
Yes. Zaal holds ZOR and participates in the same Fractal sessions. The system is designed so no single person controls outcomes.

---

## For Fractal Attendees Without ZOR Yet

If you've been attending Fractal sessions but haven't earned ZOR yet:

1. Continue showing up consistently — ZOR is earned over 8-12+ sessions
2. Participate actively in Fractal voting (your Respect scores accumulate)
3. Ask Zaal for a status check on your OG Respect balance at any Fractal session
4. Once your OG Respect reaches the threshold, ZAO governance will issue your ZOR

The path is clear. The record is on-chain. Keep participating.

---

## Related Docs

- 1684 — ZAO Weekly Governance Protocol (full Fractal session structure, ZOR earning mechanics)
- 1678 — Africa Battle Week Charity Snapshot Spec (Jul 24-25 — first vote for many new ZOR holders)
- 1619 — Fractal Democracy Guide (how Fractal sessions work, step-by-step)
- 1709 — ZAO Music Release Protocol (the 10% ZOR holder revenue share in detail)
- 1628 — ZAO Three-Chain Architecture (where ZOR fits in the multi-chain stack)
- 1651 — ZAO DAO Case Study (the governance track record ZOR holders are part of)
