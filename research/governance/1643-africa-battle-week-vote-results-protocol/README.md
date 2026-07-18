---
topic: governance, wavewarz, community
type: operational-protocol
status: DO NOW — vote closes Jul 25 8PM ET; ZOE announces Jul 26. Companion to doc 1631 (campaign) and doc 1575 (vote setup).
last-validated: 2026-07-18
related-docs: 1631-africa-battle-week-charity-vote-campaign, 1575-zor-token-africa-battle-week-vote-setup, 1557-africa-battle-week-charity-shortlist, 1580-africa-battle-week-voter-guide
board-tasks: None — post-vote ops for Africa Battle Week (doc 1498)
action-owner: ZOE (announcement posts Jul 26); Zaal (charity contact + Sep 26 payout approve); Hurricane (Sep 26 battle execution)
---

# 1643 — Africa Battle Week: Vote Results + Post-Vote Operations Guide

> **What this is:** Everything that happens AFTER the ZOR Snapshot vote closes on Jul 25 at 8PM ET. Companion to doc 1631 (pre-vote campaign) and doc 1575 (vote setup). Covers result reading, announcement copy, charity contact, and Sep 26 battle payout flow.
>
> **Vote closes:** Jul 25, 2026 at 8:00 PM ET  
> **Announcement:** Jul 26, 10AM ET  
> **Battle:** Sep 26, 2026 (Africa Battle Week)  
> **Payout:** On-chain, auto-fires to charity wallet after Sep 26 battle

---

## Step 1 — Read Results (Jul 25, 8PM ET)

**Where:** Snapshot.org → ZAO space → Africa Battle Week proposal (URL in doc 1575)

**Record these numbers:**
- Winning charity (A / B / C)
- Vote share by option (e.g. 60% / 30% / 10%)
- Total unique ZOR addresses that voted
- Snapshot block used (for on-chain verification)

**Tiebreak:** If two options tie for first, ZAO defaults to the option with more ZOR-weighted votes. If still tied, Zaal decides; announces tiebreak reason in the results post.

---

## Step 2 — Announcement Posts (Jul 26, 10AM ET)

ZOE queues all posts for 10AM ET Jul 26. Zaal reviews and approves the draft by 9:30AM.

### Farcaster — ZOL posts to /zabal and /wavewarz

```
Africa Battle Week charity vote results 🗳️

[CHARITY NAME] wins — [X]% of ZOR votes.

[ONE LINE: what the charity does]

On Sep 26: 100% of the Africa Battle Week WaveWarZ battle payout 
goes directly to [CHARITY NAME].

US veteran vs. West African artist. Both artists earn.
The charity earns from the battle itself.

→ wavewarz.info | battle Sep 26
```

### X — Zaal posts from @BetterCallZaal or @WaveWarZ

```
Africa Battle Week charity vote: [CHARITY NAME] wins 🌍

Results: [A]% [Charity A] | [B]% [Charity B] | [C]% [Charity C]

On Sep 26, the WaveWarZ Africa Battle payout goes directly to 
[CHARITY NAME]. Both artists earn. Charity earns from the battle.

→ Battle: Sep 26  wavewarz.info
```

### Telegram — ZOE posts to ZAO main TG

```
Africa Battle Week vote results ✅

Winner: [CHARITY NAME] ([X]% of ZOR votes)

[What the charity does — one sentence]

Timeline:
Sep 26 → Africa Battle Week WaveWarZ battle
Sep 26 → 100% of SOL auto-fires to [CHARITY NAME] wallet

[N] ZOR holders voted. Thank you for participating.

Questions? Reply here.
```

---

## Step 3 — Contact the Winning Charity (Jul 26-28)

**Who:** Zaal

The onchain payout fires automatically to the charity's confirmed Solana wallet (doc 1631). But Zaal still needs to:
1. Confirm the charity has a valid Solana wallet on file
2. Let them know they won and when to expect the payout
3. Get their handle for the Sep 26 announcement posts

**Email template:**

Subject: `ZAO × [CHARITY NAME] — Africa Battle Week Sep 26`

```
Hi [team],

I'm Zaal Panthaki, founder of ZAO — a music community on Farcaster.

ZOR holders (our governance token) voted [CHARITY NAME] as the recipient 
of 100% of the Africa Battle Week battle payout on September 26, 2026.

[CHARITY] won with [X]% of the vote.

The payout fires automatically onchain after the Sep 26 WaveWarZ battle 
to the Solana wallet address we have on file: [WALLET]. 

Please confirm:
1. Is [WALLET] the correct active Solana address?
2. Who should I tag when I announce the results to our community?
3. Are you available to do a brief Farcaster/X collab post on Sep 26?

The battle: US veteran vs. West African WaveWarZ artist. 100% of SOL 
payout goes to you. We'll also share the TX hash after it fires.

Thank you for doing what you do.

— Zaal Panthaki / @bettercallzaal
```

**If no wallet is on file:** Ask the charity to provide a Solana wallet address before Sep 20. Deadline: Sep 20 (give 6 days before battle). If no response or no wallet, fall back to the runner-up charity and announce the change in ZAO Telegram.

---

## Step 4 — Sep 26 Battle → Payout Confirmation

**Payout is on-chain and automatic** (configured when the battle is created; no manual transfer needed). 

**Hurricane:** When creating the Sep 26 charity battle in WaveWarZ:
- Set recipient wallet = confirmed charity Solana address
- Set payout split = 100% to recipient wallet (not 70/30 winner/loser — all goes to charity)
- WaveWarZ program handles this onchain at battle settlement

**ZOE posts within 1 hour of battle result:**

```
Africa Battle Week result 🌍

[Artist A (US)] vs [Artist B (Africa)]
→ Winner: [Name]

💸 [X] SOL → [CHARITY NAME]
TX: [solscan link]

Both artists earned. The community won.

→ Next: ZAOstock Oct 3 | Africa Battle Week annually
```

**Zaal reposts** from @BetterCallZaal with personal commentary.

---

## Step 5 — Post-Payout Recording

1. **ZAOOS doc addendum:** Add a comment block at the bottom of this doc:
   ```
   UPDATE: Jul 25 — [CHARITY] won with [X]%.
   UPDATE: Sep 26 — [X] SOL sent. TX: [hash].
   ```

2. **Bonfire episode:** ZOE posts:
   ```
   Africa Battle Week 2026: [CHARITY NAME] selected by ZOR holder vote Jul 25 
   ([X]% of votes). Sep 26 payout: [X] SOL auto-fired to [wallet]. TX: [hash].
   ```

3. **OREC archive:** Note in the ZAO OREC that this was the first community Snapshot vote tied to a WaveWarZ battle and a named charity payout.

4. **Screenshot:** Save the Snapshot results page to ZAO Media Vault.

---

## Low-Turnout Handling

If fewer than 3 ZOR holders vote (quorum = none per doc 1575 — any participation is valid):
- Still honor the result
- Add to announcement: "3 ZOR holders participated in our first-ever charity Snapshot vote — we build from here."
- Include in Fractal session retrospective how to grow turnout for ZAOstock Oct 3 IRL vote

---

## Sources

| Doc | Role |
|-----|------|
| [1575](../1575-zor-token-africa-battle-week-vote-setup/) | Snapshot vote setup + proposal copy |
| [1557](../../community/1557-africa-battle-week-charity-shortlist/) | 5 candidate charities with descriptions |
| [1580](../1580-africa-battle-week-voter-guide/) | ZOR holder voting guide |
| [1631](../1631-africa-battle-week-charity-vote-campaign/) | Pre-vote campaign (ZOE reminder cadence) |
| [1589](../1589-africa-battle-week-onboarding-sprint/) | Artist onboarding to Fractal |
| [1498](../../community/) | Africa Battle Week original spec |
