# 1553 — ZOR Holder Voting Guide: How to Participate in ZAO Governance (Jul 2026)

**Type:** PRACTICAL-GUIDE  
**Topic:** Governance  
**Status:** CANONICAL — companion to ZOR token guide (doc 1532). Where doc 1532 explains what ZOR IS, this doc explains how to actually USE IT to vote. Share with every new ZOR holder and every COC Concertz / ZAOstock attendee.

---

## Two Places ZOR Holders Vote

ZAO governance has two voting contexts:

| Context | Where | When | How |
|---|---|---|---|
| **Fractal Democracy (weekly)** | Telegram voice / Juke / IRL | Thursday evening | ORDAO/Optimystics protocol (fractal grouping) |
| **WaveWarZ MAIN Battle** | wavewarz.info | During 15-min voting window | Phantom wallet + ZOR token hold |

Both are on-chain. Both feed the OREC contract. Both count toward ZAO's consecutive governance streak.

---

## Part 1: Fractal Democracy Session (Thursday)

### What You're Voting On
Each Thursday, ZOR holders gather to:
1. Use Fractal Democracy to elect a weekly "Respect responder" (who gets OREC proposal credit)
2. Discuss proposals (artist invites, charity selection, platform decisions)
3. Ratify any decisions made mid-week via WaveWarZ battle governance

### Step-by-Step: Joining a Thursday Session

**Step 1: Find the session invite**
ZOE posts the session link in ZAO main Telegram every Thursday around 6PM EST.
Format: "📋 ZAO Governance tonight — [Juke/Telegram voice link]. 7PM EST."

**Step 2: Join the voice channel**
- Desktop: join via Juke (juke.club) or Telegram Desktop voice
- Mobile: Telegram voice works; Juke requires browser
- IRL (ZAOstock / COC): show up physically — IRL presence = highest governance weight in Fractal Democracy

**Step 3: Follow the Fractal Democracy format**
Fractal Democracy groups participants into rooms of 3–6. Each person speaks (1–3 min) about their contribution since last session. Group votes on who demonstrated the most value. Top-voted person from each group advances to "Respect table."

ZAO runs the ORDAO/Optimystics variation. ZOE tracks session facilitator role — if no one else facilitates, ZOE provides the opening framing in Telegram.

**Step 4: OREC submission (facilitator only)**
After the session, the elected Respect responder (or Zaal) submits to the OREC contract on Optimism Mainnet. This creates the on-chain record of the session.
- OREC contract: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
- Submission: call `submitProposal()` or use the ORDAO interface
- ZOE archives the tx hash in the session doc (doc 1540 template)

**Step 5: ZOR distribution (post-session)**
Sessions with a Respect responder result in ZOR being minted/distributed per ORDAO mechanics. Check your balance at:
- Optimism Mainnet → token `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
- Blockscout: optimism.blockscout.com → search token → Holders
- ZAO dashboard (if Hurricane built holder view)

---

## Part 2: WaveWarZ MAIN Battle Vote

### What You're Voting On
During a MAIN battle, ZOR holders vote on which artist wins. The vote determines payout split: winner gets the majority of the pool, loser gets the guaranteed "loser-earns" payout.

The vote is about WaveWarZ governance (which artists get paid, which tracks win) but also about artistic merit. ZOR holders are the judges.

### Step-by-Step: Voting in a WaveWarZ MAIN Battle

**Step 1: Get notified**
ZOE posts battle open announcement to ZAO Telegram, @wavewarz X, and Farcaster /wavewarz. Includes: artist names, track links, vote open time, vote close time (15 minutes).

**Step 2: Listen to both tracks**
Navigate to wavewarz.info/battle/[battle-id]. Both tracks are listed with streaming links (usually Audius or SoundCloud). Listen to both. You're voting on your genuine preference.

**Step 3: Open Phantom wallet (Solana)**
ZOR holder voting at WaveWarZ uses Solana Mainnet. Requirements:
- Phantom wallet (browser extension or mobile app)
- ZOR token in wallet (Optimism ERC-1155 `0x9885...` — confirm bridge status with Hurricane)
- Minimum ZOR to vote: [ask Hurricane — currently 1 ZOR minimum]

**Step 4: Cast your vote**
- Click "Vote for [Artist A]" or "Vote for [Artist B]" on the battle page
- Phantom opens transaction prompt
- Confirm the transaction (~$0.001 Solana gas)
- Your vote is recorded on-chain

**Step 5: Wait for result (15 minutes)**
Battle closes after 15-minute window. Payout executes automatically on-chain:
- Winner: majority of pool
- Loser: guaranteed minimum payout (the "loser-earns" mechanic)
- Traders who backed the winner also receive returns

ZOE posts result to Telegram and @wavewarz X within 2 minutes of battle close.

---

## Part 3: ZAOstock On-Stage Vote (Oct 3, 2026)

ZAOstock features a live WaveWarZ MAIN battle with the audience watching in real time. This is the first time ZOR holder governance happens IRL in front of a live audience.

**What's different about ZAOstock voting:**
- Screen shows live vote count during the 15-minute window (audience sees the vote update in real time)
- ZOR holders in the audience vote from their phones (same Phantom wallet flow as Part 2)
- Remote ZOR holders can vote from anywhere during the same 15-minute window
- After battle: Zaal announces result + winning artist + loser payout on microphone

**If you're attending ZAOstock and want to vote:**
1. Bring Phantom wallet with ZOR token loaded (confirm your balance before Oct 3)
2. Connect to WiFi at venue (Jordan's Restaurant or venue-provided)
3. Have wavewarz.info open on your phone
4. When battle opens (~2:40PM): vote for your choice within 15 minutes
5. Watch the result announcement on stage at ~3:05PM

---

## ZOR Balance: Where to Check

| Method | Steps |
|---|---|
| Blockscout | optimism.blockscout.com → search `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` → token page → Holders tab |
| Optimism Mainnet via Etherscan | optimistic.etherscan.io → same contract → Token tracker → Holders |
| Phantom wallet | Open Phantom → add Optimism network → import ERC-1155 token address |
| ZAO dashboard | If available at wavewarz.info (ask Hurricane for status) |

**Minimum ZOR to participate:**
- Fractal Democracy session: 0 ZOR minimum (sessions are open, you earn ZOR by participating)
- WaveWarZ MAIN battle vote: [confirm minimum with Hurricane]
- OREC submission: requires being the Respect responder (highest-Respect participant from a session)

---

## Common Issues + Fixes

| Issue | Fix |
|---|---|
| "I don't have ZOR yet" | Attend a Thursday Fractal session — you earn ZOR by participating. No purchase required. |
| Phantom can't see my ZOR | Add Optimism network to Phantom manually (chain ID 10, RPC `mainnet.optimism.io`) |
| Missed the 15-min voting window | No fix — window closes on-chain. Set a Telegram reminder before next battle. |
| My vote didn't go through | Check Solana balance (need ~$0.001 SOL for gas). Try again with higher priority fee. |
| I can't make Thursday sessions | ZOR also accumulates from COC Concertz shows (IRL votes count) + WaveWarZ battle votes |
| I want to OREC submit but don't know how | Only the session's Respect responder submits. If that's you: ask Zaal for the ORDAO interface link. |

---

## Governance Participation Cadence (Recommended)

| Activity | Frequency | ZOR impact |
|---|---|---|
| Thursday Fractal session | Weekly | Primary ZOR earn path |
| WaveWarZ MAIN battle vote | 1-2x/month (or every MAIN battle) | Voting record; minimal ZOR earn |
| COC Concertz show attendance + IRL vote | Monthly | Counts as session participation |
| ZAOstock Oct 3 on-stage vote | Once | Highest-profile single governance moment |

**Minimum viable governance participation:** Thursday session every 2-4 weeks + 1 WaveWarZ vote/month = considered an "active" ZOR holder.

---

## Why This Matters (Grant / Press Framing)

> "ZAO's 64+ consecutive governance sessions with real ZOR holder participation is verifiable on Optimism Mainnet. Every participating ZOR holder earns Respect through on-chain recording of their vote. The WaveWarZ battle vote at ZAOstock Oct 3 will be the first time this governance happens live on stage with a public audience."

---

## Related Docs

- 1532 — ZOR Respect Token Practical Guide (what ZOR IS — this doc is how to USE it)
- 1540 — Governance Session Archive Template (where each session gets documented)
- 1538 — WaveWarZ MAIN Battle Format (the battle mechanics ZOR holders vote on)
- 1524 — ZAOstock Day-of Protocol (on-stage vote logistics)
- 1542 — ZAO GEO Entity Brief (on-chain contract addresses — ZOR/OREC)
- 1525 — OP RF Evidence Package (ZOR holder participation = Gate 1 evidence)
- 1475 — Fractal Democracy Session Guide (full session facilitation reference)
