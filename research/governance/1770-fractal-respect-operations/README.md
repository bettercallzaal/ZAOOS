---
topic: governance
type: guide
status: research-complete
last-validated: 2026-07-20
related-docs: 1619, 1475, 1068, 718
original-query: "document how the ZAO Fractal Respect system actually works end to end - breakout ranking, even splits, video awards, the submit mechanism, address resolution, newcomers - so it stops being tribal knowledge and can be run by anyone or a bot"
tier: STANDARD
---

# 1770 - How ZAO Fractal Respect Works (operations guide)

> **Goal:** The canonical, run-it-yourself guide to awarding Respect after a ZAO Fractal session - breakout ranking, even splits, video awards, the submit mechanism, and how members map to wallets. Written from the live Monday session on 2026-07-20 so it stops being tribal knowledge. Feeds the eventual Fractal Discord bot build.

## The short version

Every week the ZAO Fractal meets, ranks contributors in small breakout groups, and mints **Respect** on-chain for each person. There are **two parallel Respect streams** each week:

1. **Breakout Respect** - from the group ranking (or an even split)
2. **Video Respect** - a separate award for members who submitted a weekly video

Both are minted through the Fractal app at **zao.frapps.xyz** (the ORDAO/OREC governance frontend) and settled on Optimism. The whole flow is currently manual (a human looks up wallets and builds the submission) - this doc is the spec a bot would follow.

## 1. Breakout Respect - the ranked path

A breakout group ranks its members 1st -> last through level-by-level voting (the Discord bot runs this: vote for level 6 winner, then 5, etc., 2 votes to win in a group of 4). Each rank position gets a fixed **denomination**:

| Rank | Base (mintType 0) | x2 (mintType 10) |
|------|-------------------|-------------------|
| 1st  | 55  | 110 |
| 2nd  | 34  | 68  |
| 3rd  | 21  | 42  |
| 4th  | 13  | 26  |
| 5th  | 8   | 16  |
| 6th  | 5   | 10  |

(Fibonacci-style. Verified against live sessions: a group of 4 minted 110/68/42/26 = the x2 tier.)

**Mint type:** `0` = Respect Breakout, `10` = Respect Breakout x2. Pick per the week's convention.

### How the ranked submit actually happens

The Discord bot generates a **submitBreakout URL** after voting completes. Format:

```
https://zao.frapps.xyz/submitBreakout?groupnumber=<N>&vote1=<1st>&vote2=<2nd>&vote3=<3rd>&vote4=<4th>
```

`vote1` = 1st place, `vote2` = 2nd, etc. The app auto-assigns the denomination by position - you do NOT type the values, only the ranked wallet order. Participants click the link to confirm the results on-chain.

## 2. Even split - the flat path

Some weeks the group agrees to split Respect **evenly** rather than rank. Then everyone gets the **same value** (e.g. week 106 = **40 each**). The ranked submitBreakout URL can't express this (it assigns by position), so an even split uses the **Respect Account Batch** form instead:

- App -> **New Proposal** -> **Respect Account Batch** ("mint multiple respect awards at once")
- One row per member: Account (recipient wallet), Value (the flat number), Title, Reason, Meeting number, Mint type, Group number
- Or use **Import as CSV** to paste all rows at once

## 3. Video ("camera-on") Respect - the parallel stream

Separate from the breakout, and simpler than it sounds: **turning your camera on during the meeting earns +10 $ZAO Respect, per person, per meeting.** This is the "video" reward - it is about being visibly present on camera, NOT about submitting a produced video. The rule is stated on the canonical page **thezao.com/zao-token** ("Turn on your camera for an extra 10 $ZAO Respect each meeting").

- Camera on = +10 that week. "No video" (e.g. Zach, week 106) = camera off = no +10.
- Example: **week 107 cameras on = Ohnahji + Zaal** -> +10 each.
- Tracked as "ZAO Video <meeting#>" columns in the ORDAO tokens Airtable.

Fixed value: **10** per camera-on member per meeting (contrast the even-split breakout at 40 and the ranked denominations above).

## 4. Members -> wallets (the "who's who" problem)

The submit forms want **wallet addresses**, but people are known by name. The mapping lives in the ZAOOS Supabase **`respect_members`** table (name <-> wallet_address), ~161 named wallets as of 2026-07-20. To resolve a name to a wallet, query that table.

**Newcomers are the recurring gap:** a first-time participant is NOT in `respect_members` yet, so their wallet can't be looked up - it must be captured live (from the Discord bot's session record or entered by hand) and added to the registry. This is the single biggest source of friction in the manual flow (e.g. week 103 newcomers Santana, Nemesis).

## 5. On-chain facts (Optimism)

- **OREC executor** `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
- **OG Respect** ERC-20 `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` - Fractals 1-73, supply frozen
- **ZOR Respect** ERC-1155 `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` - Fractals 74+
- Meeting number = week number (106, 107, ...). OREC optimistic approval window: 72h.

(See [[reference_zao_respect_onchain_facts]] for the full verified on-chain data.)

## Weekly run-book (do this after a session)

1. For each breakout group, get the final ranking (or "even split").
2. Resolve every participant name -> wallet via `respect_members`. Any newcomer: capture their wallet and add them to the registry FIRST.
3. **Ranked** group -> use the bot's submitBreakout URL (or build it: `?groupnumber=N&vote1=..&vote2=..`).
4. **Even split** group -> Respect Account Batch form, same value for all, meeting# + group#.
5. Add video awards for anyone who submitted a video that week.
6. Confirm the proposals pass (OREC 72h window).

## Also See

- [Doc 1619](../1619-fractal-democracy-session-guide/) - the session flow (phases, voting, OREC)
- [Doc 1475](../1475-fractal-democracy-session-guide/) - session guide
- [Doc 1068](../1068-zao-fractal-frontend-build-spec/) - frontend build spec

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Give fractalbotjuly2026 a member registry (name<->wallet) + roster capture so the submit is generated, not hand-built | Zaal | Build (PR) | 2026-08-15 |
| Add a "newcomer capture" step to the bot so first-timers are registered live | Zaal | Build (PR) | 2026-08-15 |
| Backfill respect_members with any newcomers currently missing (Santana added, Nemesis pending) | Zaal | Data | 2026-07-27 |

## Sources

- Live ZAO Fractal session, 2026-07-20 (breakout + video award mechanics, even-split value, submitBreakout URL format observed directly)
- ZAOOS `respect_members` table (name<->wallet mapping, 161 named wallets)
- zao.frapps.xyz Respect Account Batch form + submitBreakout URL
- [[reference_zao_respect_onchain_facts]] (Optimism contracts, verified 2026-07-05)
