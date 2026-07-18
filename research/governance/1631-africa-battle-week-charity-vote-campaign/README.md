# 1631 — Africa Battle Week Charity Vote Campaign (Jul 24-25, 2026)

**Type:** GOVERNANCE-CAMPAIGN  
**Topic:** Governance  
**Status:** ACTIVE — Vote opens Jul 24. ZOR holders vote on which charity receives 100% of SOL from the Africa Battle Week Day 5 charity battle (Sep 26). ZOE runs the reminder cadence; Zaal sets up the Snapshot poll. GATED: Zaal creates the Snapshot poll before Jul 24.

---

## What This Vote Is

On Day 5 of Africa Battle Week (Sep 26), there will be a charity battle in which 100% of SOL wagered goes directly on-chain to the winning charity. ZOR holders vote on which charity receives the payout.

This is the same model as the ZAOstock charity battle (Oct 3, doc 1575 covered the ZAOstock charity vote). The Africa Battle Week charity vote is the ZOR community's first international charity governance action.

**Charity payout mechanics:**
- SOL from the Sep 26 charity battle settlement fires automatically to the charity's confirmed Phantom/Solana wallet
- No manual transfer needed — on-chain, automatic
- ZOE posts the tx hash on Sep 26 immediately after payout

**Vote format:** Snapshot poll (Optimism Mainnet snapshot space — ZOR ERC-1155 for voting power)

---

## GATED: Zaal Sets Up Snapshot Poll

**Zaal action required by Jul 23 (tomorrow):**
1. Go to snapshot.org
2. Create a new poll in the ZAO snapshot space
3. Title: "Africa Battle Week 2026 — Charity Partner Vote"
4. Options: [charity A], [charity B], [charity C] — see candidates below
5. Voting period: Jul 24 12:00 AM ET → Jul 25 11:59 PM ET (48 hours)
6. Voting strategy: ZOR ERC-1155 on Optimism (token ID 1, one vote per ZOR)
7. Minimum quorum: 10 ZOR holders (confirm with Zaal)
8. Send Snapshot link to ZOE via Telegram for the reminder campaign below

---

## Charity Candidates (Jul 2026)

The charity options for Africa Battle Week should be Africa-connected organizations. Suggested shortlist (Zaal confirms before poll creation):

| Candidate | Focus | Payout mechanism |
|---|---|---|
| Afri-Love | African arts/culture community | SOL wallet — confirm with organization |
| Future Beat Academy | Music education for African youth | SOL wallet — confirm with organization |
| [Third option — Zaal selects] | [focus] | SOL wallet |

**Wallet confirmation required before vote:** Each candidate charity must provide a Solana wallet address that Zaal confirms is active before the poll goes live. ZOE contacts charity representatives by Jul 22.

---

## ZOE Vote Campaign: Jul 24-25

### Jul 23 (night before) — Teaser post

ZOE posts to X + Farcaster /zao + Telegram:
```
Tomorrow: Africa Battle Week charity vote opens.

ZOR holders choose which organization receives 100% of SOL from the Sep 26 Africa charity battle. 
No middleman. Automatic. On-chain.

Vote opens 12:00 AM ET tomorrow. 48 hours.
[Snapshot link]
```

### Jul 24 (vote opens) — Launch post

ZOE posts to X + Farcaster /zao + Telegram at 9:00 AM ET:
```
⚡ Africa Battle Week charity vote is LIVE.

157 ZOR holders: choose the Sep 26 charity recipient.

Options:
• Afri-Love
• Future Beat Academy
• [Third option]

Vote closes Jul 25 midnight ET.
[Snapshot link]

This is governance from anywhere. ZOR holders in Lagos, London, Maine, and everywhere else — vote now.
```

### Jul 24 midday — Voter count update

ZOE checks Snapshot API for vote count and posts:
```
Africa Battle Week charity vote: [N] votes cast so far.
[Leading option] is ahead.
Polls close Jul 25 midnight ET. Still time to vote.
[Snapshot link]
```

### Jul 25 (T-6 hours) — Final reminder

ZOE posts to X + Farcaster /zao + Telegram at 6:00 PM ET:
```
6 hours left to vote in the Africa Battle Week charity vote.
[N] ZOR holders have voted.
[Snapshot link]
```

### Jul 25 (vote closes) — Result announcement

ZOE posts result within 15 minutes of poll close:
```
Africa Battle Week charity vote: CLOSED.

Winner: [CHARITY NAME]

[N] ZOR holders voted. [Winning %] chose [charity].

[Charity name] will receive 100% of SOL from the Sep 26 Africa charity battle — automatically, on-chain, no middleman.

The payout fires Sep 26. Watch the tx hash here on Sep 26.

This is what community governance of charity looks like.
```

---

## Sep 26: Charity Payout Protocol

On Sep 26 (Africa Battle Week Day 5), after the charity battle closes:

1. ZAO WW operator (Zaal) confirms the charity wallet address matches the one confirmed in Jul
2. WaveWarZ settlement fires automatically
3. Charity wallet receives SOL
4. ZOE pulls tx hash from WW API
5. ZOE posts within 5 minutes of settlement:

```
🔥 Charity payout fired.

[Charity name] received [X] SOL ($[USD at rate]) from the Africa Battle Week charity battle.

TX: [Solana tx hash]
[Explorer link]

ZOR holders voted on July 24-25. 
The payout was automatic, on-chain, no middleman.

This is what it looks like when a music community governs its own charity giving.
```

---

## What If a Charity Can't Provide a SOL Wallet

Some African nonprofits may not have a Solana wallet. Protocol:

**Option A:** ZAO provides a brief Phantom wallet setup guide and helps the charity create a wallet by Aug 1.

**Option B:** Use a fiscal intermediary — if the charity is US-based or has a US partner, route through Fractured Atlas (doc 1618) which can receive SOL and convert to USD.

**Option C:** Convert SOL to stablecoin (USDC on Solana) and send — most onramp-friendly format for recipients without crypto infrastructure.

**GATED:** If no charity can provide a Solana wallet by Aug 15, DECISION NEEDED — escalate to Zaal for alternative payout structure.

---

## ZOR Holder Outreach

ZOE sends individual DMs (via Telegram or X) to known ZOR holders:

**DM template:**
```
Hey [name] — you're a ZOR holder.

Africa Battle Week charity vote opens tomorrow. 
ZOR holders decide which organization gets the on-chain charity battle payout from Sep 26.

48-hour vote: Jul 24-25.
[Snapshot link]

Takes 2 minutes. Just connect Phantom and choose.
```

Known ZOR holder handles: [ZOE fills from Supabase `zao_artists.is_zor_holder = true` + any manually-known handles]

---

## Governance Record

After the vote closes, ZOE uploads the vote summary to Arweave:
```
Title: ZAO-Africa-Battle-Week-Charity-Vote-Jul2026
Content: Vote options, final tally, winning charity, winning wallet address, ZOR holders who voted (anonymized count), tx plan for Sep 26.
```

Arweave tx hash added to ZAOOS doc 1619 (Fractal Democracy Session Guide) as a governance milestone.

---

## Related Docs

- 1619 — Fractal Democracy Session Guide (ZOR voting mechanics + OREC)
- 1580 — Africa Battle Week Charity Vote ZOR Holder Guide (voter-facing how-to)
- 1575 — ZAOstock Charity Vote (same model — Oct 3 ZAOstock version)
- 1616 — Africa Battle Week + ZAOstock Farcaster Coverage Plan (Sep 26 cast schedule)
- 1628 — ZAO Multi-Chain Architecture Guide (ZOR on Optimism + Solana payout)
