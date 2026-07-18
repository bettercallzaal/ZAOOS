# 1678 — Africa Battle Week Charity Snapshot Poll Spec (Jul 2026)

**Type:** OPS-SPEC  
**Topic:** Events  
**Status:** URGENT — Set up Snapshot poll by Jul 23 (5 days). Vote opens Jul 24, closes Jul 25. ZOR holders vote which charity receives 5% of Africa Battle Week battle proceeds. First live IRL governance moment before ZAOstock Oct 3.

---

## What This Poll Decides

Africa Battle Week (Sep 22-26, 2026) will run 5 days of WaveWarZ battles featuring African and diaspora artists. A portion of battle proceeds — governance-voted at 5% — goes to a charity chosen by ZOR holders.

**Vote window:** Jul 24, 12PM → Jul 25, 12PM (24 hours)  
**Eligible voters:** All ZOR token holders on Optimism Mainnet (157 holders as of Jul 2026)  
**Voting mechanism:** Snapshot.org, ERC-1155 single-choice weighted vote  
**Quorum:** None required — highest vote count wins  
**Tiebreaker:** ZOE calls a second 24-hour poll if top two are within 5% of each other

---

## Charity Candidates

Three options are on the ballot. Zaal confirms all three before Jul 23 poll setup. If a candidate is ineligible or unconfirmed, replace with the backup.

| # | Charity | Focus | Website | Why It Fits ABW |
|---|---------|-------|---------|-----------------|
| A | African Music Development Initiative (AMDI) | Artist training, music education across West Africa | [Confirm URL] | Direct music ecosystem support; aligns with ABW artist development mission |
| B | Afrobeats Foundation | Afrobeats artist grants + cultural preservation | [Confirm URL] | Genre-native; ABW features Afrobeats-adjacent artists |
| C | Musicians Without Borders | Music for conflict recovery; programs in East/Central Africa | musicianswithoutborders.org | Established 501(c)(3); easy verification; operates where ABW artist pipeline runs |

**Backup option D:** Africa Music Trust (africamusictrust.org) — if any of A/B/C can't be verified by Jul 23.

**Before setting up the poll, Zaal confirms:**
- [ ] Each charity accepts crypto or USD wire (no SWIFT complications)
- [ ] Each charity has a public wallet address or donation page
- [ ] None of the charities has a reputational flag (quick search Jul 23)

---

## Snapshot Poll Spec

### Setup (Zaal or ZOE runs this Jul 23)

**Platform:** snapshot.org  
**ZAO Space:** snapshot.org/#/thezao.eth (create if not exists — see §Snapshot Setup below)

**Poll fields:**
```
Title: Africa Battle Week: Choose the Charity (ZOR Holder Vote)

Description:
Africa Battle Week runs Sep 22-26, 2026: 5 days of WaveWarZ battles featuring African + diaspora artists. 5% of all battle proceeds during ABW go to the charity ZOR holders choose here.

This is a binding ZAO governance vote. Results are recorded on-chain via Snapshot.org.

Charity descriptions:
A. [AMDI name + 1-sentence description]
B. [Afrobeats Foundation name + 1-sentence description]  
C. Musicians Without Borders — music programs for conflict recovery across East/Central Africa

Vote opens: Jul 24, 12PM ET
Vote closes: Jul 25, 12PM ET

Eligible voters: ZOR token holders (ERC-1155, Optimism Mainnet, contract 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c)
```

**Voting system:** Single choice  
**Token:** ZOR (ERC-1155, Optimism Mainnet: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`)  
**Voting strategy:** erc1155-balance-of (each ZOR counts as 1 vote; soulbound prevents accumulation)  
**Start:** Jul 24, 2026 12:00 PM ET  
**End:** Jul 25, 2026 12:00 PM ET  
**IPFS:** Snapshot auto-publishes to IPFS on creation

---

## Snapshot Space Setup

If `thezao.eth` Snapshot space doesn't exist yet:

1. Go to snapshot.org → "Create space"
2. Enter ENS: `thezao.eth` (Zaal must own this ENS)
3. Space name: The ZAO
4. Network: Optimism (chain ID 10)
5. Strategy: `erc1155-balance-of`
   - Contract: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
   - Token ID: 0 (or the ZOR token ID — confirm with contract)
6. Add Zaal's wallet as admin
7. Save

**If thezao.eth ENS is not registered:** Use `bettercallzaal.eth` as the space ENS. Both work — choose whichever is registered.

---

## Pre-Vote Announcement Posts (Post Jul 23, After Poll Is Live)

### X
```
ZOR holders — you pick the charity.

Africa Battle Week (Sep 22-26) sends 5% of all WaveWarZ battle proceeds to a charity YOU vote on.

Vote opens Jul 24, 12PM ET. Closes Jul 25.
Snapshot link: [URL]

157 ZOR holders. One vote each. Binding.
```

### Farcaster (/zao channel)
```
The ZAO charity vote is live.

Africa Battle Week runs Sep 22-26: WaveWarZ battles with African + diaspora artists, all earning automatic on-chain payouts.

5% of proceeds go to the charity ZOR holders choose.

Cast your vote by Jul 25, 12PM:
[Snapshot URL]

/zao
```

### Telegram (ZAO Public)
```
🗳️ VOTE: Africa Battle Week Charity

ZOR holders pick which charity gets 5% of ABW battle proceeds.

Options: [A], [B], Musicians Without Borders

Vote: [Snapshot link]
Open: Jul 24, 12PM ET → Jul 25, 12PM ET

157 eligible voters. Your ZOR = your vote.
```

### Telegram (ZAO Ops — ZOE to Zaal)
```
✅ ABW charity poll LIVE on Snapshot.
Poll ID: [ID]
IPFS: [CID]

ZOR voters notified on X + Farcaster + Telegram (12:00 PM).
Vote closes Jul 25, 12PM ET.

I'll post results immediately after close.
```

---

## Voting Day (Jul 24)

**12:00 PM ET — ZOE posts all three announcement posts simultaneously**

**During vote (Jul 24 PM / Jul 25 AM):**
- ZOE checks vote count every 6 hours and posts update to Telegram Ops
- If less than 10 wallets have voted by Jul 25, 8AM: ZOE sends reminder post to X + Farcaster
- ZOE does NOT post running results publicly until vote closes (preserves ballot integrity)

---

## Post-Vote (Jul 25, 12PM)

**Immediately after close:**

ZOE posts results:

### X
```
ABW charity vote is in.

ZOR holders voted: [WINNER]

5% of all Africa Battle Week battle proceeds (Sep 22-26) will be sent automatically to [WINNER].

[N] votes cast. Binding.

Snapshot: [URL]
```

### Farcaster (/zao)
```
The vote is done.

[N] ZOR holders voted.
[WINNER] wins with [X]% of votes.

Africa Battle Week proceeds go to them. Automatic payout at ABW close.

/zao
```

**ZOE internal task:**
1. Record winning charity + wallet address in doc 1396 (Africa Battle Week spec)
2. Note vote count in doc 1662 (COC #7 recap) or event log
3. Alert Zaal: "ABW charity confirmed: [WINNER]. Need their SOL/ETH wallet address for payout. Get by Aug 15."

---

## Payout Mechanics

**When:** Africa Battle Week closes Sep 26  
**What:** 5% of total SOL volume from ABW battles  
**How:** Manual transfer from ZAO treasury wallet to winning charity's wallet/donation page  
**Who triggers:** Zaal (or ZOE with explicit Zaal approval)  
**Documentation:** ZOE posts TX link to X + Farcaster + Telegram after payout confirms

**Before payout (Sep 24 — 2 days before close):**
- [ ] Confirm charity wallet address is still valid
- [ ] Confirm charity still accepts SOL (not all US nonprofits do — have USD fallback via Coinbase Commerce or direct PayPal)
- [ ] ZOE calculates 5% of ABW volume estimate and alerts Zaal for approval

**USD fallback:** If charity can't accept SOL, convert via Coinbase and send USD via PayPal or wire. Document the exchange rate.

---

## IPFS Archive

After the vote closes, the Snapshot IPFS CID is the permanent on-chain record. ZOE saves:
- Snapshot poll URL
- IPFS CID
- Winning charity name + wallet
- Vote count + breakdown
- Timestamp

These go into the Africa Battle Week event doc (1396) and the COC recap log for citability.

---

## Related Docs

- 1396 — Africa Battle Week Main Spec (artist pipeline, full event plan)
- 1661 — Africa Battle Week Artist Recruitment Guide (ZABAL recruitment)
- 1659 — ZAOstock Sponsor Activation Guide (ZAOstock has its own charity angle — compare)
- 1658 — Jul 21 Launch Cluster Ops (pre-ABW vote context)
- 1570 — ZAO Citable Claims Doc (add vote count + charity name after Jul 25)
