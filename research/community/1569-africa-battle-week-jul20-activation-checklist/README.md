---
topic: community, governance, wavewarz
type: activation-checklist
status: DO NOW — Jul 20 is today; nominations open today; vote Jul 24-25
last-validated: 2026-07-18
related-docs: 1498-africa-battle-week-vote-protocol, 1557-africa-battle-week-charity-shortlist, 1553-governance-zor-holder-voting-guide
board-tasks: None (activation checklist for doc 1498 execution)
action-owner: ZOE (posts Jul 20 cast + monitors nominations + compiles shortlist Jul 24 AM); Zaal (approves and sends cast via ZOE)
---

# 1569 — Africa Battle Week: Jul 20 Activation Checklist

> **What this is:** The go-live checklist for Africa Battle Week nominations, which open today (Jul 20, 2026). All research is done (charities in doc 1557, vote mechanics in doc 1498, ZOR voting guide in doc 1553). This doc is the execution timeline so nothing falls through the cracks between now and the Sep 26 battle.

---

## Today (Jul 20) — Nominations Open

### Step 1: Post the Nomination Cast (ZOE → Zaal approval → post)

Send to both **/zao** and **/wavewarz** channels on Farcaster:

```
Africa Battle Week is coming — Sep 26.

A US WaveWarZ veteran vs. a West African artist.
100% of the battle payout goes to a charity voted on by ZOR holders.

Two asks from the community:

1. NOMINATE A CHARITY
Requirements:
- Active in music, arts, or youth education in Africa or the diaspora
- Publicly verifiable (website + social)
- Can receive crypto or PayPal

Reply with a nomination by Jul 23. ZOR holders vote Jul 24–25.

2. SUGGEST A WEST AFRICAN ARTIST
We're looking for an MC, rapper, or singer from West Africa to compete.
Reply with their handle + country.

This is a community governance moment. Make it count.
```

*Cast draft from doc 1557. Approved for posting by ZOE once Zaal confirms.*

### Step 2: Pin or Thread (Optional)

If possible, add a thread-continuation with the 3 pre-researched charity options (doc 1557):
- Option A: Music In Africa Foundation (musicinafrica.net)
- Option B: Fela Kuti Foundation / New Afrika Shrine (Lagos)
- Option C: [Top community nomination]

Keeps the vote anchored even if community engagement is sparse.

### Step 3: Cross-Post to ZAO Telegram

Share the Farcaster cast link in the ZAO main Telegram group so members who aren't on Farcaster can still participate.

---

## Jul 20-23 — Nomination Window

### ZOE Monitoring Tasks

| Day | Action | How |
|-----|--------|-----|
| Jul 20 | Post cast, log cast hash | ZOE via ZOL's posting path |
| Jul 21 | Check replies on nomination cast | ZOL polls /zao and /wavewarz |
| Jul 22 | DM any promising artist suggestions | Zaal manual DM or ZOE assisted |
| Jul 23 | Close nominations at end of day | No action needed — just note |

### What to Track

**Charity nominations received:** Log each unique org suggested in replies. Key fields:
- Org name
- Suggested by (Farcaster username)
- Link provided (if any)
- Crypto-capable (yes / no / unknown)

**West African artist suggestions:** Log each:
- Artist name / handle
- Country / region
- Farcaster / Twitter / Instagram link
- Any context (suggested by who, connection to ZAO?)

---

## Jul 24 — Compile Shortlist + Open Vote

### Morning (by 10am ET): ZOE Compiles Shortlist

1. Pull all charity nominations from cast replies (Jul 20-23)
2. Deduplicate
3. Verify each is real: website + social presence + can receive crypto/PayPal
4. Combine community nominations with pre-researched options (doc 1557):
   - Music In Africa Foundation (musicinafrica.net)
   - Fela Kuti Foundation / New Afrika Shrine (Lagos)
   - Top community nomination
5. Final shortlist: **3 options maximum** (too many → vote fragmentation)

**If community nominations were sparse (fewer than 2 new orgs):**
Use the doc 1557 recommended shortlist:
- MIAF + Fela Kuti Foundation + one open "write-in" option

### Afternoon: Open ZOR Holder Vote

Vote mechanics (from doc 1553):

**Method 1 — Snapshot (recommended for binding governance):**
```
Space: thezao.eth on snapshot.org
Vote type: Single choice (pick 1 of 3)
Voting power: ZOR token holdings (ERC-20 or SPL, verify ZOR type)
Start: Jul 24 12pm ET
End: Jul 25 8pm ET
Title: "Africa Battle Week Sep 26: Choose the charity recipient"
Description: [2-line description of each option with website link]
```

**Method 2 — Farcaster poll (lighter weight, non-binding):**
Post a multi-choice poll in /zao and /wavewarz:
```
Africa Battle Week charity vote is LIVE.
ZOR holders: your vote decides where the Sep 26 battle payout goes.

Options:
A — Music In Africa Foundation (musicinafrica.net)
B — Fela Kuti Foundation / New Afrika Shrine
C — [Community nomination]

Vote in replies: A, B, or C
Vote closes Jul 25 at 8pm ET.

ZOR holder verification: reply with your wallet address or zora.co profile.
```

**Recommendation:** Use Farcaster poll for speed (no Snapshot setup needed) with ZOR-holder verification by wallet reply. For a small community vote, Farcaster is sufficient. Use Snapshot only if ZOR is already set up as a Snapshot strategy (check snapshot.org/settings/thezao.eth first).

---

## Jul 25 — Vote Closes

### 8pm ET: Tally Votes

For Farcaster poll:
1. ZOE collects all A/B/C replies
2. Cross-reference against known ZOR holder wallets (`src/lib/wavewarz/constants.ts` has 43 verified wallets)
3. Weight: 1 vote per verified ZOR holder (or proportional to ZOR held — Zaal decides)
4. Announce winner by 10pm ET

**Announce winner cast:**
```
The community has spoken.

Africa Battle Week charity vote results:
🥇 [WINNER] — XX% of ZOR holder votes

100% of the Sep 26 battle payout goes to [WINNER].

The battle is Sep 26. US veteran vs. West African artist.
More details on the lineup soon.
```

---

## Jul 20 — Aug 31: Book the West African Artist

Parallel track (can overlap with charity vote). From doc 1557 Part 3:

**Week 1 (Jul 20-27): Source candidates**
- Review artist suggestions from nomination cast replies
- Ask Hurricane for WaveWarZ community connections in African hip-hop
- Post in /africa, /afrobeats, /nigerianmusic Farcaster channels

**Week 2-4 (Jul 28-Aug 10): Outreach**
- DM top 3 candidates with 2-sentence pitch:
  ```
  Hey [name] — I'm ZAO, a music community on Farcaster.
  We're running a charity battle on Sep 26: a US rapper vs. a West African artist.
  100% of the payout goes to community-voted charity. Interested?
  ```
- Link: thezao.xyz/wavewarz or the Africa Battle Week announcement

**August: Confirm artist**
- Agree on format (remote or in-person?)
- Coordinate logistics: timezone, platform, tech setup
- Announce artist publicly once confirmed

---

## Sep 26 — Battle Day

**Pre-battle (1 week before):**
- Announce both artists publicly on Farcaster
- Remind ZOR holders about the charity vote result
- Confirm charity wallet/PayPal address for transfer

**Battle day:**
- Run WaveWarZ battle per standard protocol
- Announce winner
- Transfer payout to charity immediately or within 24h
- Screenshot/document transfer for onchain transparency

**Post-battle:**
- Tweet/cast transaction hash as proof of transfer
- Tag the charity in the announcement
- Note: COC Concertz recording of the battle → archive per doc 1560 protocol

---

## Quick Reference: Key Dates

| Date | Action | Owner |
|------|--------|-------|
| **Jul 20 (TODAY)** | Post nomination cast on Farcaster | ZOE → Zaal approve |
| Jul 20-23 | Monitor replies, log nominations | ZOE |
| **Jul 24 morning** | Compile shortlist (3 options) | ZOE |
| **Jul 24 noon** | Open ZOR vote (Snapshot or Farcaster) | Zaal |
| **Jul 25 8pm ET** | Close vote, tally, announce winner | ZOE + Zaal |
| Jul 20-Aug 31 | Source + book West African artist | Zaal + Hurricane |
| Aug (TBD) | Announce confirmed artist publicly | ZOE post |
| Sep 26 | Battle day, transfer payout to charity | Hurricane + Zaal |

---

## Sources

- Doc 1498: Africa Battle Week vote protocol (full spec)
- Doc 1557: Charity shortlist research (5 candidates)
- Doc 1553: ZOR holder voting guide (step-by-step)
- Board task: Africa Battle Week — nominations Jul 20, vote Jul 24-25
- ZAOOS `src/lib/wavewarz/constants.ts`: 43 verified ZOR holder wallets
