---
topic: wavewarz, zoe, operations, farcaster
type: ops-protocol
status: ACTIVE — ZOE uses this every time a WaveWarZ battle result is received from Hurricane. Covers all battle types: Quick Battle, MAIN Event, Africa Battle Week, and ZABAL S2 battles. Defines when to post, what template to use, what to hold, and how to handle edge cases.
last-validated: 2026-07-18
related-docs: 1644-wavewarz-onchain-settlement-mechanics, 1700-wavewarz-community-battle-host-guide, 1675-farcaster-content-calendar-sep2026, 1643-africa-battle-week-vote-results-protocol, 1677-zabal-s2-zoe-weekly-ops-guide
action-owner: ZOE (all posts below); Hurricane (sends result data to ZOE); Zaal (approves GATED posts — MAIN Event results with milestones, Africa Battle Week charity result, COC Concertz battle results)
---

# 1732 — WaveWarZ Battle Result Post Protocol

> **What this is:** ZOE's standing protocol for posting WaveWarZ battle results to Farcaster and Telegram. Every time a WaveWarZ battle settles, ZOE receives the result from Hurricane and must decide: post immediately, hold for Zaal approval, or skip. This doc defines those decisions and provides the exact post templates.
>
> **Why this exists:** Battle results are one of ZOE's highest-frequency tasks. ZOE posts results for ~3-5 battles per week across different formats. Without a clear protocol, ZOE either over-posts (flooding /wavewarz) or under-posts (missing community updates). This doc is the single source of truth.
>
> **Battle types ZOE handles:**
> 1. Quick Battle — standard community battle, any time, any artists
> 2. MAIN Event battle — featured battle in the COC Concertz series
> 3. Africa Battle Week battle (Sep 22-26, 2026) — see doc 1720 for day-by-day ops
> 4. ZABAL S2 Track A battle — artist milestone battle (counts toward 5-battle requirement)
> 5. Featured/Sponsored battle — a battle with special context (external sponsor, grant tie-in)

---

## Step 1: What Data Hurricane Sends ZOE

When a battle settles, Hurricane sends ZOE the following via Telegram. ZOE does not post until this data is received.

**Minimum required data for any result post:**
```
Battle type: [Quick / MAIN / ABW / ZABAL / Featured]
Winner: @[handle]
Loser: @[handle]
SOL wagered: [X]
SOL to loser (loser-earns): [Y]
Voters: [N]
Payout tx: [Solana tx hash]
Battle URL: [wavewarz.info URL]
```

**Additional fields for MAIN Event:**
```
Series: COC #[N]
Artists: [Winner full name] vs [Loser full name]
Milestone triggered: [yes/no — e.g., "1,250th battle", "$2K total payout"]
```

**Additional fields for Africa Battle Week:**
```
Day: [1-5]
[For Day 5 only] Charity name: [Name]
[For Day 5 only] Charity tx: [Solana tx hash]
```

**If Hurricane sends partial data (missing tx hash or SOL amounts):**
ZOE replies to Hurricane: "Need [missing field] before I can post the result."
ZOE does NOT post with placeholder data. All bracket fields must be filled.

---

## Step 2: Decide Whether to Post (Hold/Post/Gate Matrix)

| Battle Type | Post Channel | Post Immediately? | Notes |
|-------------|-------------|------------------|-------|
| Quick Battle | /wavewarz | Yes — within 30 min of receiving data | No approval needed |
| Quick Battle (ZABAL S2 Track A) | /wavewarz + ZABAL S2 Telegram | Yes | Add ZABAL milestone note |
| MAIN Event (COC Concertz) | /wavewarz + /zao | GATED — Zaal approves | Highest visibility, milestone check first |
| Africa Battle Week Day 1-4 | /wavewarz + /zao | Yes — within 1h | Day-by-day per doc 1720 |
| Africa Battle Week Day 5 (charity) | /wavewarz + /zao | GATED — Zaal approves | Must include charity tx hash |
| Featured/Sponsored | /wavewarz | GATED — Zaal confirms framing | Sponsor may have specific language |
| ZOR holder vote result | /zao (not /wavewarz) | GATED — Zaal approves | Governance post, different audience |

**Milestone check before MAIN Event result post:**
ZOE checks: does this battle push the total above a milestone threshold?
- Every 250th battle (250, 500, 750, 1000, 1250...) — Milestone post language
- Every $500 total SOL to artists — Cumulative payout milestone language
- First battle by a new artist — "First battle" shout-out

If a milestone is triggered: ZOE adds milestone language to the result post and escalates to GATED (waits for Zaal) even if it would otherwise be a standard Quick Battle.

---

## Template 1: Quick Battle Result Post

**Channel:** /wavewarz only (unless ZABAL S2 Track A — then also ZABAL S2 Telegram)

```
WaveWarZ result:

Winner: @[handle]
Loser earned: [Y] SOL

[N] voters | [X] SOL wagered
TX: [short Solscan link or tx hash]
```

**Variation — when winner has a notable rank or streak:**
```
WaveWarZ result:

@[handle] wins.
Loser earned: [Y] SOL

[N] voters. That's [N] consecutive wins for [handle] / [N] battles this month.
```

**ZABAL S2 Track A addition (post to ZABAL S2 Telegram after the /wavewarz post):**
```
ZABAL S2 update:

@[handle] just completed a WaveWarZ battle.
Milestone: [N]/5 battles toward Track A requirement.
```

ZOE checks Supabase `zabal_s2_milestones` to confirm current battle count for the participant before posting.

---

## Template 2: MAIN Event Result Post (COC Concertz)

**Status:** GATED — ZOE drafts, Zaal approves before posting.

**Draft ZOE sends to Zaal:**
```
DRAFT — reply 'post it' to send.

COC Concertz #[N] battle result:

Winner: [Full Name] (@[handle])
Loser earned: [Y] SOL

[N] voters | [X] SOL wagered

[MILESTONE LINE IF TRIGGERED:] 
- "This was WaveWarZ battle #[N] — [milestone language]"
- "Total SOL to artists is now [cumulative] — [milestone language]"

TX: [tx hash]
```

**After Zaal approval, ZOE posts to /wavewarz:**
```
COC Concertz #[N] battle result:

Winner: [Full Name] (@[handle])
Loser earned: [Y] SOL

[N] voters | [X] SOL wagered total

[Milestone line if applicable]

TX: [tx hash]
```

**ZOE also posts to /zao (same day, 30 min after /wavewarz post):**
```
The COC Concertz #[N] featured battle is done.

[Winner full name] vs [Loser full name].
Loser earned: [Y] SOL. Automatic. On-chain.

[Milestone line if applicable]

Full result: /wavewarz
```

---

## Template 3: Africa Battle Week Day 1-4 Result Post

Per doc 1720 (Africa Battle Week live ops) — see that doc for the full day-by-day sequence. Summary:

**Channel:** /wavewarz + /zao
**Post:** Within 1 hour of Hurricane sending result
**Format:**
```
Africa Battle Week Day [N] result:

Winner: @[handle]
Loser earned: [X] SOL
Voters: [N]

Day [N+1] tomorrow: [Artist 1] vs [Artist 2]
```

---

## Template 4: Africa Battle Week Day 5 (Charity Battle) Result Post

**Status:** GATED — ZOE drafts, Zaal approves. Must include charity tx hash. Per doc 1720.

Draft format:
```
Africa Battle Week is over.

[Charity Name] received [X] SOL from today's charity battle.

TX: [charity payout tx hash]
[Solscan link]

ZOR holders chose the charity Jul 24-25.
The payout fired automatically Sep 26.
No middleman.

This is how music community philanthropy works in 2026.
```

---

## Template 5: Milestone Battle Result Post

Applies when any battle (Quick or MAIN) triggers a cumulative milestone.

**Channel:** /wavewarz + /zao (both, for milestone posts)

```
WaveWarZ milestone:

Battle #[total battle count] just settled.

Winner: @[handle]
Loser earned: [Y] SOL

[N] battles since day one.
[Cumulative SOL to artists] total SOL to artists.

That number will keep moving.
TX: [tx hash]
```

**For cumulative SOL milestones ($500, $1K, $2K, $5K...):**
```
WaveWarZ just crossed [milestone] SOL paid to artists.

[Most recent battle]: @[winner handle] won, @[loser handle] earned [Y] SOL.
That payout put the total over [milestone].

[Total battles] battles. [Total SOL] SOL.
On-chain. Automatic.
```

---

## Template 6: Featured/Sponsored Battle Result Post

**Status:** GATED — Zaal approves framing (sponsor may have specific language requirements).

**ZOE draft to Zaal:**
```
DRAFT for [Sponsor Name] battle result. Reply 'post it' or with edits.

WaveWarZ x [Sponsor Name] battle result:

Winner: @[handle]
Loser earned: [Y] SOL (covered by [Sponsor Name])

[N] voters | [X] SOL wagered

[Sponsor tagline or mention — Zaal fills or confirms]

TX: [tx hash]
```

---

## How ZOE Handles Edge Cases

### Battle cancels (no settlement, no result from Hurricane)
ZOE waits 4 hours after expected settlement time. If no result: ZOE DMs Hurricane: "Battle at [URL] hasn't settled — what's the status?" If still no result after 24h: ZOE does NOT post a result. ZOE does NOT announce the cancellation publicly unless Zaal instructs. ZOE logs to `~/.zao/zoe/wavewarz-unsettled.jsonl`.

### Two battles settle on the same day (back-to-back)
ZOE posts both results to /wavewarz, spaced at least 2 hours apart. ZOE does NOT combine results into a single post — each battle gets its own result post. If both are Quick Battles on the same day, ZOE may skip the second /zao cross-post (to avoid over-posting to /zao).

### Artist handle not on Farcaster (only has Solana address)
ZOE uses their WaveWarZ display name (not a Farcaster @handle): "Winner: [Display Name]" instead of "@handle". ZOE does NOT make up or guess a Farcaster handle.

### Payout tx hash is a Solana tx, not an Ethereum tx
All WaveWarZ payouts are on Solana. ZOE uses the Solscan link format: `solscan.io/tx/[hash]`. ZOE does NOT link to Etherscan for WaveWarZ payouts.

### ZOE receives an unusually high SOL payout (>10 SOL)
ZOE does NOT post the amount without Zaal confirmation: "Battle settled with [X] SOL — that's higher than typical. Confirming before I post the result. Is that amount correct?" Prevents errors with decimal placement or unexpected large battles going to Farcaster incorrectly.

### Hurricane sends result but battle is NOT on the verified battle list
ZOE does NOT post the result. ZOE DMs Hurricane: "I received a result for [URL] but it's not in the verified battle list. Can you confirm this is a valid WaveWarZ battle?" ZOE holds until Hurricane confirms.

---

## ZOE Standing Rules for All Battle Posts

1. **Never post a result before receiving the payout tx hash.** The tx hash is proof the loser earned. Without it, the "loser earns" framing is an unverified claim.

2. **Never mention specific SOL amounts in /zao unless it's a milestone or GATED approval.** /wavewarz is the right channel for detailed battle stats. /zao gets the summary and milestone.

3. **Check /wavewarz post cadence.** If ZOE already posted to /wavewarz in the last 2 hours (e.g., a ZABAL S2 reminder), delay the result post by 30 minutes to avoid flooding.

4. **ZABAL S2 Track A battle milestone check is mandatory before posting.** ZOE always queries Supabase for the participant's current battle count. The milestone Telegram post must include the accurate count.

5. **Day-of-week context matters.** A Quick Battle result on a Monday afternoon is more likely to get engagement than one on Friday evening — ZOE can hold Friday evening Quick Battle results and post Saturday morning if the battle settled after 8PM ET.

---

## ZOE Logging

After each battle result post, ZOE logs to `~/.zao/zoe/wavewarz-result-posts.jsonl`:

```json
{
  "date": "2026-[MM]-[DD]",
  "battle_type": "quick|main|abw|zabal|featured",
  "battle_url": "[URL]",
  "winner": "@[handle]",
  "loser": "@[handle]",
  "sol_wagered": [X],
  "loser_earned": [Y],
  "voters": [N],
  "tx_hash": "[hash]",
  "channels_posted": ["/wavewarz", "/zao", "zabal_s2_telegram"],
  "gated": false,
  "milestone_triggered": null,
  "posted_at": "[ISO timestamp]"
}
```

This log is the source for the ZAO H2 milestone tracker monthly pull (doc 1710).

---

## Sources

- `research/wavewarz/1644-wavewarz-onchain-settlement-mechanics/` — loser-earns payout mechanics (source for result post framing)
- `research/wavewarz/1700-wavewarz-community-battle-host-guide/` — battle lifecycle (when battles open, close, and settle)
- `research/events/1720-africa-battle-week-live-ops/` — Africa Battle Week day-by-day result post sequence (templates 3 and 4 above are summaries; doc 1720 is the full guide)
- `research/governance/1643-africa-battle-week-vote-results-protocol/` — GATED post requirement for Africa Battle Week Day 5 charity battle
- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — ZABAL S2 Track A milestone detection (ZOE Friday review)
- `research/technology/1710-zao-h2-milestone-tracker/` — ZOE logging destination for battle result posts
