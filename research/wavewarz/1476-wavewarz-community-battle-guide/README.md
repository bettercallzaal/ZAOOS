# 1476 — WaveWarZ Community Battle: Proposal + Operations Guide (Jul 2026)

**Type:** GOVERNANCE-GUIDE  
**Topic:** WaveWarZ  
**Status:** CANONICAL — reference for ZOR holders proposing community battles; update when vote mechanics change

---

## Overview

A Community Battle is a WaveWarZ battle initiated and voted on by the ZAO community (ZOR token holders), rather than by the platform or artists directly. As of July 2026, 36 Community Battles have run on WaveWarZ. Community Battles are:

1. **Governed by ZOR holders** — the community votes on which artists battle
2. **Higher-stakes format** — community battles typically have larger pools and more promotion
3. **Charity-connected** — ZAOstock's charity component uses a Community Battle as the fundraising mechanism
4. **Citable governance proof** — 36 Community Battles = 36 documented ZAO governance decisions with on-chain outcomes

This doc is the complete guide: how to propose a Community Battle, how the vote works, and how it's run.

---

## Community Battle vs Other Battle Types

| Type | Who Proposes | Format | Use Case |
|---|---|---|---|
| Quick Battle | Artist | 1v1, short window | Artist testing the platform; high volume |
| MAIN Battle | Platform/Zaal | Structured event with promotion | Featured matchups, partner events |
| **Community Battle** | **ZOR holders (governance vote)** | **Voted matchup, promoted** | **Community-chosen artists; charity fundraising; milestone events** |

---

## How to Propose a Community Battle

### Step 1: Propose in Governance Session

During a weekly Fractal Democracy session (doc 1475), any participant can propose a Community Battle during the "Community Updates" segment (T+45 to T+55):

"I propose a Community Battle between [ARTIST_A] and [ARTIST_B]. Reason: [one sentence]. Timing: [proposed date/timeframe]."

### Step 2: Quick Discussion (5 min max)

Discuss:
- Are both artists currently active on WaveWarZ?
- Is there community interest (has anyone DM'd asking for this matchup)?
- Is there a theme or reason (charity, milestone, debut)?
- Does it conflict with any scheduled MAIN battles or COC shows?

### Step 3: ZOR Holder Vote

After the session, Zaal (or ZOE) posts a vote to ZAO Main Telegram and /zao Farcaster:

```
🗳️ ZAO Community Battle Vote

Proposed matchup: [ARTIST_A] vs [ARTIST_B]
Reason: [theme/occasion]

Cast your vote:
✅ = Yes, run this battle
❌ = No, not this matchup

ZOR holders only. Vote closes in 48 hours.
```

**Vote threshold:** Simple majority of respondents, minimum 3 votes. (ZAO uses lazy consensus — if nobody objects, the battle runs.)

### Step 4: ZOE Executes (Once Vote Passes)

- ZOE DMs both artists via WaveWarZ platform or Audius DM: "The ZAO community voted for you to battle [OPPONENT]. The matchup starts [DATE]. Are you in?"
- Both artists must confirm within 24 hours
- ZOE creates the battle via the WaveWarZ admin interface (or Hurricane creates it)
- ZOE schedules announcement posts for the battle open

### Step 5: Promotion

Community Battles get more promotion than Quick Battles:
- Pre-battle announcement: T-24h (X + Farcaster + Telegram)
- Live battle post: when opens
- Mid-battle engagement post: at 50% of battle window
- Result post: immediately on close

---

## Charity Community Battle Protocol (ZAOstock)

ZAOstock Oct 3 includes a Charity Community Battle — a special Community Battle where all artist payouts are donated to the ZAOstock charity partner (doc 1446).

**How it works:**
1. ZOR holders vote on which artists battle (standard Community Battle vote)
2. Both artists agree to donate their payout to charity
3. Battle runs on Oct 3 (at ZAOstock or adjacent to event)
4. Payout sent to charity partner's wallet (or converted to USD for bank transfer)
5. Amount announced live from ZAOstock stage

**Governance hook:** The charity battle is also a live governance vote from the stage. ZAOstock attendees can vote for Artist A or Artist B by showing their ZOR token balance — the first IRL ZAO governance event.

**Charity partner requirement:** Must have a wallet address that can accept SOL, OR Zaal converts SOL payout to USD and sends as bank transfer. Confirm with charity partner by Jul 25 (doc 1446).

---

## Africa Battle Week Community Battle (Sep 26)

As part of Africa Battle Week (doc 1373), a special Community Battle is planned for Sep 26 pairing a US ZAO artist vs. a West African artist. The charity component: ZOR holders vote on which African-focused nonprofit receives the payout.

**Steps:**
1. Sep 15: ZOR holders vote on African-focused charity via /zao Farcaster poll
2. Sep 22: ZOR holders confirm artist lineup (US artist + Africa artist)
3. Sep 26: Battle runs as Community Battle with charity payout
4. Sep 27: ZOE reports result + charity donation amount

---

## Community Battle Governance Stats (as of Jul 2026)

| Metric | Value |
|---|---|
| Total Community Battles run | 36 |
| As % of total battles | 2.9% (36 of 1,245) |
| Typical proposal-to-battle time | 7-14 days |
| Artist participation rate | [Confirm with Hurricane] |

**Citable:** "ZAO has run 36 Community Battles as of July 2026, each initiated and voted on by ZOR token holders — making WaveWarZ the only music battle platform where the community governs artist matchups."

---

## Template: Community Battle Announcement Post

```
🎵 COMMUNITY BATTLE — voted by the ZAO community

[ARTIST_A] vs [ARTIST_B]

This matchup was voted in by ZOR holders during ZAO's weekly governance session.

🏛️ Why this battle: [theme/reason]
💰 Pool opens: [AMOUNT] SOL
⏳ Battle window: [START] → [END]

Even the loser earns. Both artists get paid.

→ wavewarz.info/battles/[BATTLE_ID]
#WaveWarZ #CommunityBattle
```

---

## ZOE Automation for Community Battles

ZOE handles:
- Vote post (Telegram + Farcaster) after Zaal approves proposal
- Vote result announcement (after 48h)
- Artist confirmation DMs
- Pre-battle announcement (T-24h)
- Live battle post (on open)
- Mid-battle engagement post (at window midpoint)
- Result post (on close)
- Charity battle: result + charity amount + donation confirmation

Zaal handles:
- Final vote count (ZOE cannot count Telegram reactions automatically)
- Artist confirmation if DM doesn't reach
- Charity donation transaction
- ZAOstock stage announcement of charity battle

---

## Related Docs

- 1469 — WaveWarZ Platform State Snapshot (Community Battles in stats)
- 1446 — ZAOstock Charity Partner Selection (charity Community Battle)
- 1373 — ZAO × RAM Africa Battle Week (Sep 26 Community Battle)
- 1475 — Fractal Democracy Session Guide (where proposals happen)
- 1421 — WaveWarZ Artist Earnings Guide (Community Battle economics)
- 1385 — ZOE Social Media Playbook (announcement templates)
