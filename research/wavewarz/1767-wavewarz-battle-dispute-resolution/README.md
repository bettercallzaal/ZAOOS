---
topic: wavewarz, zoe, operations, governance
type: ops-protocol
status: ACTIVE — ZOE uses this whenever an artist, host, or voter raises a dispute about a WaveWarZ battle result. Covers: what can be disputed, ZOE's triage steps, escalation to Hurricane and Zaal, on-chain verification, resolution templates. ZOE never makes a final dispute ruling — that is always Zaal + Hurricane.
last-validated: 2026-07-18
related-docs: 1644-wavewarz-onchain-settlement-mechanics, 1732-wavewarz-battle-result-post-protocol, 1700-wavewarz-community-battle-host-guide, 1710-zao-h2-milestone-tracker
action-owner: ZOE (triage, message routing, on-chain lookup); Hurricane (technical verification, payout confirmation); Zaal (final ruling on any dispute); Disputing party (provides specific claim with evidence)
---

# 1767 — WaveWarZ Battle Dispute Resolution Protocol

> **What this is:** ZOE's protocol for handling WaveWarZ battle disputes. Most WaveWarZ battles settle cleanly — the on-chain PDA distributes payouts automatically, and there's nothing to dispute. But disputes do occur: an artist claims they didn't receive their payout, a host says the wrong track was used, a voter claims their vote didn't register. This doc defines ZOE's role in triaging and routing these disputes — and makes clear that ZOE never issues final rulings.
>
> **What ZOE can and cannot do in a dispute:**
> - **CAN:** Look up the Solana tx hash, confirm payout amounts from on-chain data, relay the dispute to Hurricane and Zaal, keep the disputing party informed
> - **CANNOT:** Override a battle result, reverse a payout, re-run a vote, issue refunds, ban a user, or make any ruling on whether a dispute is valid
>
> **Most disputes are solved by looking at the chain.** The PDA is deterministic. If the tx hash shows a payout, the payout happened. ZOE's first job is always to check the chain before escalating.

---

## Step 1: Receive and Log the Dispute

When ZOE receives a dispute (Telegram, Farcaster DM, or /wavewarz cast), ZOE:

1. Acknowledges the message immediately:
```
I've received your dispute about [battle description]. I'm looking into it now and will route it to Hurricane and Zaal. I'll get back to you with what I find within [24h for non-urgent / 4h for urgent].
```

2. Logs the dispute to `~/.zao/zoe/wavewarz-disputes.jsonl`:
```json
{
  "date": "2026-[MM]-[DD]",
  "dispute_id": "WW-DISPUTE-[YYYYMMDD]-[N]",
  "battle_url": "[wavewarz.info URL if known]",
  "disputing_party": "@[handle]",
  "dispute_type": "[payout / track / vote / other]",
  "claim": "[one-sentence description of the claim]",
  "status": "open",
  "tx_hash": null,
  "resolution": null
}
```

3. Classifies the dispute type:

| Dispute Type | Description |
|-------------|-------------|
| `payout` | Artist claims they didn't receive their payout, or received the wrong amount |
| `track` | Artist claims the wrong track was used in their battle, or an unauthorized track was used |
| `vote` | Voter claims their vote didn't count, or disputes the vote count |
| `setup` | Host claims the battle was set up incorrectly (wrong artists, wrong parameters) |
| `impersonation` | Someone claims another account is impersonating them in a battle |
| `other` | Doesn't fit above categories |

---

## Step 2: On-Chain Verification

Before escalating to Hurricane or Zaal, ZOE performs the on-chain check.

### For payout disputes:

ZOE asks: "Can you share the battle URL and the Solana wallet address you expected to receive the payout in?"

If the disputing party provides both:
1. ZOE looks up the battle URL on wavewarz.info to get the battle's Solana transaction hash (if shown on the site)
2. ZOE checks Solscan or Solana explorer for that tx hash
3. ZOE checks the wallet address on Solscan for incoming transactions from the WaveWarZ program ID

ZOE's on-chain check response:

**If payout is found on-chain:**
```
I've looked at the on-chain data.

The payout tx for your battle was: [tx hash]
The amount was: [X] SOL
The receiving wallet was: [address ending in ...]

This shows the payout reached the wallet. 

If you're not seeing it in your Phantom wallet: (1) make sure you're on Solana mainnet, not devnet, (2) try refreshing your Phantom wallet. If the tx is on-chain and the wallet is yours, the SOL is there.

If you believe the wallet in the tx is NOT yours, reply with the wallet address you registered — we'll verify.
```

**If payout tx is NOT found on-chain (or is unclear):**
```
I've checked the on-chain data and can't confirm a payout for this battle at the wallet you provided.

I'm escalating to Hurricane now with the battle details. Hurricane will verify from the WaveWarZ admin side. I'll update you within [24h].
```

### For vote count disputes:

WaveWarZ vote data is on-chain via the battle PDA. ZOE notes:
```
Vote counts are recorded in the battle's on-chain PDA and can't be altered after settlement. I can relay your concern to Hurricane who can verify the vote count from the admin panel.
```

ZOE does NOT promise that a vote count will be changed — it almost certainly won't be, because the chain is the source of truth.

### For track/impersonation disputes:

ZOE escalates immediately (no on-chain check possible for this type):
```
Track identity disputes require Hurricane to verify from the WaveWarZ admin. I'm forwarding your claim to Hurricane now with the battle URL and your claim details.
```

---

## Step 3: Escalation to Hurricane

ZOE sends Hurricane (via Telegram) a structured dispute report:

```
WaveWarZ dispute — [dispute_id]

Type: [payout / track / vote / setup / impersonation]
Battle URL: [URL]
Disputing party: @[handle]
Claim: [one-sentence description]
On-chain check result: [what ZOE found or "not checked — track/vote/setup type"]
Urgency: [HIGH — impersonation or live event / STANDARD — other]

Action needed: Verify from admin and confirm payout tx hash or vote count.
Reply with: [resolution] and I'll close the dispute and reply to [handle].
```

ZOE also DMs Zaal if:
- The dispute involves an Africa Battle Week battle
- The dispute involves a ZABAL S2 participant
- The dispute involves a MAIN Event (COC Concertz) battle
- The dispute has been open >48h without Hurricane response
- The disputing party is threatening public escalation (social media complaints, etc.)

---

## Step 4: Resolution and Response Templates

### Resolution A: Payout confirmed — claim resolved

```
Update on your dispute ([dispute_id]):

Hurricane has confirmed the payout from the on-chain record:
- Payout tx: [tx hash]
- Amount: [X] SOL
- Destination wallet: [address]

If you're not seeing the SOL in Phantom: this is a wallet display issue, not a missing payout. Try: (1) Refresh Phantom, (2) Add SOL as a token if not shown, (3) Check solscan.io with your wallet address.

If you still need help, reply here.
```

### Resolution B: Payout error confirmed — Hurricane fixing

```
Update on your dispute ([dispute_id]):

Hurricane has verified that there was an error in the payout for your battle. He is correcting it now.

Expected fix: [timeframe Hurricane provides]
You'll receive a confirmation with the corrected tx hash once it's done.

Thank you for flagging this.
```

### Resolution C: Vote count verified — no change

```
Update on your dispute ([dispute_id]):

Hurricane has verified the on-chain vote count for your battle. The count is accurate — [N] votes were recorded, matching the blockchain.

WaveWarZ vote counts are immutable once settled. The result stands.

If you believe there was something wrong with the voting process (voting window too short, voters unable to access the poll), please describe that specifically and I'll relay it to Zaal for process improvement — but the result itself won't change.
```

### Resolution D: Track identity dispute — resolved

```
Update on your dispute ([dispute_id]):

Hurricane has reviewed the track used in your battle. [Outcome — Hurricane provides].

If a violation occurred: Hurricane has noted it. Repeat violations may affect a host's ability to create battles.

Thank you for raising this.
```

### Resolution E: Dispute closed — no action (claim not supported)

```
Update on your dispute ([dispute_id]):

After reviewing the on-chain data and Hurricane's verification, we couldn't confirm the claim as described. 

[Brief explanation of what the chain/admin shows]

If you have additional information that changes this, please share it with a specific claim and evidence. Otherwise, this dispute is now closed.
```

---

## Step 5: Close the Dispute Log

ZOE updates `~/.zao/zoe/wavewarz-disputes.jsonl` with the resolution:

```json
{
  "dispute_id": "WW-DISPUTE-[date]-[N]",
  "status": "resolved",
  "resolution": "[A/B/C/D/E]",
  "resolved_by": "Hurricane",
  "resolution_date": "[ISO timestamp]",
  "tx_hash": "[if applicable]"
}
```

ZOE also updates the H2 milestone tracker `~/.zao/zoe/milestone-snapshots.jsonl` if the dispute revealed a payout error that changed the SOL-to-artists total.

---

## Urgent Disputes (Response Within 4 Hours)

ZOE treats the following as urgent:
- Any dispute involving an **Africa Battle Week** battle (Sep 22-26) — live event, daily cadence
- Any dispute where the disputing party says **"I'll post about this publicly"** — reputation risk
- Any dispute where the battle is **still in progress** (vote window open) — time-sensitive
- **Impersonation claims** — another artist may be using someone's track without consent

For urgent disputes: ZOE DMs Hurricane AND Zaal simultaneously, with "URGENT" in the message subject. ZOE does not wait for Hurricane to reply before notifying Zaal.

---

## What ZOE Never Does in a Dispute

1. **Never promises a specific outcome.** ZOE does not say "don't worry, you'll get your SOL back." ZOE says "I'm looking into it."

2. **Never makes a ruling.** ZOE does not say "your dispute is valid" or "your dispute is not valid." ZOE says "I've forwarded this to Hurricane and Zaal."

3. **Never alters Supabase milestone records as dispute resolution.** If a ZABAL S2 participant's battle milestone is in dispute, ZOE does NOT add or remove milestones without Zaal's explicit instruction.

4. **Never contacts a third party on behalf of the disputing party.** If a non-ZAO artist is involved in a battle dispute, ZOE does not contact them — Hurricane and Zaal handle external communications.

5. **Never discusses disputes publicly.** Disputes are handled in DMs. ZOE does not post about ongoing disputes on /wavewarz or /zao.

---

## Dispute SLA

| Dispute Type | ZOE First Response | Hurricane Response Target | Resolution Target |
|-------------|-------------------|--------------------------|-------------------|
| Urgent (ABW, live, impersonation) | Immediate | 4h | 24h |
| Payout (on-chain check possible) | 30 min | 24h | 48h |
| Vote count | 30 min | 24h | 48h |
| Track/Setup | 30 min | 48h | 72h |
| Other | 1h | 72h | 5 days |

If SLA is missed: ZOE sends Zaal a flag: "[dispute_id] has been open [N] days without resolution. Hurricane hasn't replied. Action?"

---

## Sources

- `research/wavewarz/1644-wavewarz-onchain-settlement-mechanics/` — PDA architecture (why on-chain is the source of truth for payouts)
- `research/wavewarz/1732-wavewarz-battle-result-post-protocol/` — How ZOE posts results (what ZOE has already communicated about a battle before a dispute arises)
- `research/wavewarz/1700-wavewarz-community-battle-host-guide/` — Host responsibilities (what a host agreed to when setting up a battle — relevant for setup disputes)
- `research/technology/1710-zao-h2-milestone-tracker/` — Why accurate payout data matters (disputes can affect the SOL-to-artists total in the H2 tracker)
