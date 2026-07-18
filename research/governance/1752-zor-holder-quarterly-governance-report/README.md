---
topic: governance, zor, zoe, operations
type: report-template
status: ACTIVE — ZOE sends quarterly governance reports to ZOR holders. Q3 2026 report: send by Oct 15, 2026. Q4 2026 report: send by Jan 15, 2027. Template covers what happened in ZAO governance, how ZOR holders voted, what changed, and what's coming next quarter. ZOE drafts → Zaal approves → ZOE sends.
last-validated: 2026-07-18
related-docs: 1677-zabal-s2-zoe-weekly-ops-guide, 1706-zoe-fractal-weekly-ops-guide, 1710-zao-h2-milestone-tracker, 1678-africa-battle-week-charity-snapshot-spec, 1737-zabal-s2-peoples-choice-poll-spec
action-owner: ZOE (generates report, finds distribution list, sends on approval); Zaal (approves report before ZOE sends); ZOR holders (receive report)
---

# 1752 — ZOR Holder Quarterly Governance Report

> **What this is:** A quarterly report to ZOR holders (157 holders as of Jul 2026) summarizing what happened in ZAO governance during the quarter, how their tokens were used in votes, what outcomes those votes produced, and what governance moments are coming next quarter. ZOR is a soulbound ERC-1155 token — holders can't sell it, so there's no speculative context. The report is about governance participation and ZAO progress.
>
> **Why this matters:** ZOR holders participated in votes during ZABAL S2 season (Africa Battle Week charity vote, People's Choice poll). Without a quarterly report, ZOR holders only know about votes if they were active in the Telegram or on Farcaster. The quarterly report is a direct communication channel with ZAO's governance participants.
>
> **Report cadence:**
> - Q3 2026 (Jul-Sep): send by Oct 15, 2026
> - Q4 2026 (Oct-Dec): send by Jan 15, 2027
> - Q1 2027 (Jan-Mar): send by Apr 15, 2027

---

## Report Structure

### Section 1: Quarter Summary

```
ZAO Quarterly Governance Report
Q3 2026 (July – September 2026)
Prepared by ZOE | Approved by Zaal Panthaki

You hold ZOR — the ZAO governance token. 
This report covers what happened in ZAO governance this quarter and what's coming next.

Current ZOR supply: [N] holders | [Total supply — Zaal confirms]
ZOR contract: 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c (Optimism, ERC-1155)
```

### Section 2: Governance Actions This Quarter

List every Snapshot vote and Fractal Democracy session that occurred during the quarter:

```
GOVERNANCE ACTIONS — Q3 2026

Snapshot votes:

1. Africa Battle Week Charity Vote (Jul 24-25, 2026)
   Question: Which charity should receive 5% of Africa Battle Week battle proceeds?
   Result: [Charity Name] — [N] votes of [Total] ZOR holders participating
   Outcome: [Charity Name] received [X] SOL on Sep 26, 2026
   On-chain TX: [tx hash]

2. ZABAL S2 People's Choice — Best Builder (Nov 17-19, 2026)
   [Only include if within the quarter — for Q3, this is N/A; include in Q4 report]

Fractal Democracy sessions this quarter:
- Approximate [N] sessions held (Season [N])
- Total Respect points distributed: [N] (per Optimism OG token mint — doc 1706)
- Top Respect earner this quarter: [handle — Zaal confirms or ZOE checks Optimism explorer]
```

### Section 3: What ZOR Holders Did

```
ZOR HOLDER PARTICIPATION

Africa Battle Week charity vote:
- Total votes cast: [N] of [157] eligible ZOR holders
- Participation rate: [N]%
- Winning choice: [Charity Name] with [N] votes

Fractal Democracy (open to non-ZOR holders, but ZOR holders earn Respect):
- ZOR holders with at least 1 Fractal session this quarter: [N]
- New OG Respect points minted this quarter: [N]
```

### Section 4: ZAO Progress This Quarter

```
ZAO ECOSYSTEM PROGRESS — Q3 2026

WaveWarZ:
- Total battles this quarter: [N]
- Cumulative battles (all time): [N]
- Total SOL to artists this quarter: [X]
- Cumulative SOL to artists: [Total]

Events:
- COC Concertz #7: [Jul 18 — brief recap]
- COC Concertz #8: [Aug 15 — brief recap]
- Africa Battle Week: [Sep 22-26 — brief recap]
- ZAOstock: [Oct 3 — Q3 report can preview, Q4 includes actuals]

ZABAL S2:
- Cohort: [N] participants accepted
- Weeks completed this quarter: [N of 12]
- Milestone count (all participants): [N]

ZAOOS (the knowledge base you're reading from):
- Total docs: ~[N]
- Docs added this quarter: [N]
```

### Section 5: What's Coming Next Quarter

```
GOVERNANCE MOMENTS NEXT QUARTER (Q4 2026)

Scheduled governance actions:
1. ZABAL S2 People's Choice Vote — Nov 17-19
   You vote for Best Builder and Best Artist of ZABAL S2.
   ZOR holders only. Watch for Snapshot links around Nov 17.

2. Fractal Democracy Season 10 (if scheduled for Nov 2026)
   ZOR holders who participate earn Respect tokens.

3. ZAOstock post-event governance (if any — Zaal confirms)

Events:
- ZAOstock Oct 3 in Ellsworth, Maine
- ZABAL S2 graduation Nov 21

ZAO is planning Season 3 in 2027.
If you want to be involved in S3 planning, reach out to @bettercallzaal on Farcaster.
```

### Section 6: How to Participate

```
HOW TO USE YOUR ZOR

1. Vote on Snapshot proposals
   ZOR votes are announced via @bettercallzaal on Farcaster and in /zao
   Space: thezao.eth
   One token = one vote

2. Attend Fractal Democracy sessions
   Open to all — ZOR holders who attend earn Respect tokens
   Sessions are weekly (usually Thursday ET)
   Check /zao on Farcaster or ZAO Telegram for session details

3. Nominate community battle proposals
   ZOR holders can nominate artists for community WaveWarZ battles (see doc 1700)

Your ZOR token address: 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c
Your balance: [ZOR holders can check on Opensea or directly on Optimism chain]
```

---

## ZOE Data Collection Process

### Step 1: Pull stats from multiple sources (1 week before send date)

**From ZAO H2 milestone tracker (doc 1710):**
- WaveWarZ battle counts (quarterly + cumulative)
- SOL to artists (quarterly + cumulative)

**From Supabase:**
- ZABAL S2 participant and milestone counts (for quarter's weeks)
- zabal_s2_attendance for session counts

**From Snapshot API:**
- Vote results from any proposals in the quarter
- Participation rates

**From Optimism chain (OG Respect token):**
- New Respect points minted this quarter (ZOE checks Optimism explorer for new mints on OG Respect contract `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`)

**ZOE asks Zaal for:**
- COC Concertz recap bullets (ZOE has templates, Zaal fills actuals)
- Any governance actions ZOE may have missed
- Final approval of all stats before send

### Step 2: Fill the template

ZOE writes the report as a text document (not a code block) and sends it to Zaal for review 5 days before the target send date.

### Step 3: Zaal approval (GATED)

ZOE sends Zaal: "Q[N] 2026 governance report draft ready. Reply 'approved' or with edits. Target send: [date]."

ZOE does NOT send without Zaal approval.

### Step 4: Distribution

ZOR holder distribution list: ZOE queries the ZOR token contract for all current holders.

**Option A (preferred):** Farcaster DM via XMTP to ZOR holders with Farcaster accounts.

**Option B:** Paragraph email to ZAO newsletter subscribers (reaches most ZOR holders since ZOR holders are active community members).

**Option C:** Post the full report as a /zao Farcaster cast + announce in ZAO Telegram.

ZOE uses the combination: /zao post (public, indexed) + ZAO Telegram + direct DM to ZOR holders with Farcaster accounts where ZOE has the association.

ZOE logs send to `~/.zao/zoe/zor-quarterly-reports.jsonl`:
```json
{
  "quarter": "Q3-2026",
  "sent_at": "[ISO timestamp]",
  "holders_at_time_of_send": 157,
  "farcaster_dms_sent": [N],
  "paragraph_send": true,
  "zao_telegram_post": true,
  "zao_farcaster_cast": true
}
```

---

## Q3 2026 Report — Specific Data Points

ZOE fills these brackets for the Q3 2026 (Jul-Sep) report:

| Field | Source | Value |
|-------|--------|-------|
| WaveWarZ battles Q3 | H2 tracker Jul+Aug+Sep pulls | [N] |
| SOL to artists Q3 | H2 tracker | [X] |
| COC #7 summary | Zaal | Jul 18, [N] attendees, [result] |
| COC #8 summary | Zaal | Aug 15, [N] attendees, [result] |
| Africa Battle Week | doc 1720 actuals | Sep 22-26, 5 battles, [X] SOL, [charity] |
| ZABAL S2 weeks | Weeks 1-4 (Sep 1 – Sep 22) | [N] sessions, [N] participants |
| Charity vote participants | Snapshot | [N] ZOR holders voted |
| ZAOOS docs added Q3 | git log count | ~[N] (from Oct 1 git log for the quarter) |
| Fractal sessions | Fractal session archive | ~[N] |
| ZOR holders | On-chain | 157+ (may have grown) |

**Q3 target send date: Oct 15, 2026** (2 weeks after ZAOstock, once post-event stats are confirmed)

---

## Q4 2026 Report — Specific Data Points

| Field | Source | Value |
|-------|--------|-------|
| WaveWarZ battles Q4 | H2 tracker Oct+Nov+Dec pulls | [N] |
| ZAOstock actuals | doc 1727 | [N] attendees, [N] battles, [X] SOL |
| ZABAL S2 graduation | doc 1742 | [N] graduates, People's Choice winners |
| People's Choice results | doc 1737 | Best Builder @[handle], Best Artist @[handle] |
| ZABAL S2 season totals | Supabase | [N] total battles, [N] total PRs |
| Q4 Fractal sessions | session archive | [N] |
| Season 3 preview | Zaal | "planning in 2027" or specific date |

**Q4 target send date: Jan 15, 2027**

---

## Failure Protocols

### Key stats are unavailable by the time ZOE drafts the report
ZOE fills with "data in progress" for unknown fields and notes in the Zaal review: "These [N] fields are TBD — reply with actuals or 'skip' to omit." ZOE sends the report with the available data rather than delaying past the send date.

### ZOR holder distribution list is incomplete (can't get all wallets)
ZOE defaults to /zao Farcaster cast + ZAO Telegram post (reaches most ZOR holders who are active) and sends Farcaster DMs to the subset ZOE has associated with Farcaster handles. ZOE notes in the report header: "If you hold ZOR but didn't receive this directly, you can find it at /zao on Farcaster."

### Zaal doesn't approve in time for the target send date
ZOE sends a reminder 2 days before target: "Q[N] governance report needs your approval by [date]. Reply 'approved' to send." If no response by the send date: ZOE delays by 3 days and sends another reminder. ZOE does NOT send without approval.

### A ZOR holder replies with a governance question ZOE can't answer
ZOE replies: "Thanks for your question. I'll pass it to Zaal — he'll respond directly." ZOE forwards to Zaal's Telegram. ZOE does NOT make governance commitments on Zaal's behalf.

---

## Sources

- `research/governance/1706-zoe-fractal-weekly-ops-guide/` — Fractal Democracy session tracking (session counts for report)
- `research/technology/1710-zao-h2-milestone-tracker/` — Quarterly stats source (WaveWarZ, SOL, ZAOOS)
- `research/events/1678-africa-battle-week-charity-snapshot-spec/` — ABW charity vote data (Q3 governance action)
- `research/zabal/1737-zabal-s2-peoples-choice-poll-spec/` — Q4 governance action: People's Choice vote
- `research/zabal/1742-zabal-s2-graduation-night-ops/` — Q4 report: ZABAL S2 graduation stats
