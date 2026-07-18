# 1410 — WaveWarZ Community Battle Playbook (July 2026)

**Type:** PLAYBOOK  
**Topic:** wavewarz  
**Status:** Active — use for all future community battle proposals  
**Created:** July 17, 2026  
**Related docs:** 1341 (MAIN Event Strategy), 1350 (WaveWarZ 101 — all battle types), 1378 (Milestone Playbook), 1384 (ZAOstock Charity Partner), 1387 (Artist Economics Comparison), 1403 (ZAOstock Ops — charity reveal script)

---

## Why Community Battles Matter

WaveWarZ has three battle types: Quick (84% of volume), MAIN (66-75% of SOL), and Community. Community battles are the smallest category — 36 battles, ~7-10% of total volume — but they generate the most **narrative value**:

- **$1,497 raised for charity** through community battles to date
- Community battles are the mechanism that proves WaveWarZ is more than a trading platform
- They are the most citeable WaveWarZ fact for Fractured Atlas, Fisher grants, Ostrom Workshop, and press
- ZAOstock's charity reveal (doc 1403) depends on this format — the live charity battle Oct 3 IS a community battle

This playbook documents what community battles are, how to propose one, who approves them, how they run, and how ZOE records the results.

---

## Part 1: Community Battle Mechanics (Technical)

Community battles differ from Quick and MAIN battles in one key way: **a portion of the SOL pool goes to an external beneficiary (charity or community fund)** rather than to traders or the protocol alone.

**Standard community battle split (confirm with Hurricane before each battle):**
- Charity allocation: [X]% of buy-side pool (confirm exact % — may vary per battle)
- Artist payout (loser): standard 1.73% + charity contribution
- Trader claims: standard distribution
- Protocol fee: 3%

**Who designates the charity:** The battle organizer (ZAO, an artist, a community member). The charity wallet address must be confirmed before the battle opens.

**How charity funds transfer:**
1. Battle closes → SOL settles on-chain via WaveWarZ vaults
2. Charity allocation goes to the designated wallet automatically (or via manual sweep — confirm with Hurricane)
3. ZOE records the transfer with txn hash in ZAOOS

**Minimum viable community battle:** Any MAIN-format battle where the charity allocation is specified at creation time. Community battles cannot be quick battles (no SOL floor for meaningful charity contribution).

---

## Part 2: The $1,497 Charity Record

**Total raised to date:** $1,497 (as of July 17, 2026, from 36 community battles)

**Citable fact (use in press, grants, academic research):**

> "WaveWarZ has run 36 community battles, raising $1,497 for charitable causes through a protocol-level mechanism that designates a portion of each battle's SOL pool to an external beneficiary. All transfers are on-chain and verifiable."

**Why this matters for grants:**
- Fractured Atlas + NEA: Charitable impact = core eligibility
- Fisher grant: "Arts organization benefiting communities" — $1,497 is proof
- Ostrom Workshop: Digital commons distributing surplus to beneficiaries = Ostrom commons model

**Historical battle record:** Community battles are tagged in wwtracker (doc 1080, `CommunityBattles` component). Full record accessible at wavewarz.info and via wwtracker analytics.

---

## Part 3: Who Can Propose a Community Battle

Community battles are not limited to ZAO. Any of these parties can propose:

| Proposer | How to propose | Who approves |
|----------|---------------|--------------|
| ZAO (Zaal/Iman) | Telegram to Hurricane: "Let's set up a community battle for [charity] on [date]" | Hurricane confirms battle setup |
| WaveWarZ artist | DM @bettercallzaal on X or post in WaveWarZ Telegram: "I want to run a charity battle" | Zaal approves, Hurricane sets up |
| ZABAL S2 participant | Post in ZABAL S2 cohort channel | Zaal approves |
| ZAOstock community | Any attendee can propose post-ZAOstock via zao.community governance | ZOR holder vote (simple majority per doc 1394) |

**What the proposer must provide:**
1. Charity name + wallet address (or Zaal confirms they'll handle the wallet mapping)
2. Proposed artists for the battle (both sides must be WaveWarZ-registered)
3. Proposed date + time
4. Charity description (for ZOE's post-battle social content)

---

## Part 4: ZAOstock Live Charity Battle (Oct 3)

The Oct 3 ZAOstock live WaveWarZ battle (doc 1403, Part 3) is a community battle — the SOL pool is split with the designated charity (doc 1384).

**Setup timeline:**
- Aug 1: Confirm charity partner (doc 1384 — DECISION NEEDED Jul 25 to have it locked by Aug 1)
- Aug 15: Hurricane configures the community battle in the WaveWarZ system
- Sep 1: ZOE announces the charity + ZAOstock charity battle in the ZABAL S2 kickoff newsletter (doc 1407 Issue 2)
- Oct 3: Live battle from stage. R06 (social volunteer) captures the result clip for TikTok within 5 min
- Oct 3, 5:00 PM: Charity reveal — Zaal announces final total from stage (script in doc 1403 Part 4)
- Oct 4: ZOE posts on-chain txn hash with charity total to X + Farcaster + Telegram

**Target charity total for ZAOstock battle:** [$X] (fill after confirming SOL price and expected battle size with Hurricane)

---

## Part 5: ZOE Automation for Community Battles

### TMP-CB01 — Pre-Battle Announcement

```
[TRIGGER: 48h before community battle start]

POST on X + Farcaster + Telegram:
"Community Battle dropping in [48 hours]:
[Artist A] vs [Artist B]

A portion of every SOL bet goes directly to [Charity Name].
[Charity one-line description]

Battle starts [DATE] at [TIME] ET → wavewarz.info
#WaveWarZ #[Charity]"
```

### TMP-CB02 — Battle Goes Live

```
[TRIGGER: Community battle opens]

POST on X + Farcaster + Telegram:
"Community Battle LIVE 🎵

[Artist A] ⚡ vs ⚡ [Artist B]

Every SOL you bet sends [X]% to [Charity].
The loser earns too.

→ wavewarz.info"
```

### TMP-CB03 — Result Post

```
[TRIGGER: Community battle closes]

POST on X + Farcaster + Telegram:
"Community Battle result:
[Winner] won. [Loser] LOST — and earned [X] SOL.

[Charity] received [Y] SOL ($[USD]) from this battle.
Running charity total from all WaveWarZ community battles: $[TOTAL].

On-chain: [txn link]

#WaveWarZ"
```

### TMP-CB04 — Milestone Post (when cumulative charity total crosses $500 / $1,000 / $2,000 etc.)

```
[TRIGGER: cumulative charity total crosses $X]

POST on X + Farcaster + Telegram:
"WaveWarZ community battles have now raised $[X] for charitable causes.

That's [N] community battles. [N] artists competed. [N] losers earned SOL anyway.

One protocol. Zero gatekeepers. $[X] to good causes.
→ wavewarz.info/stats"
```

---

## Part 6: ZAOOS Documentation Protocol After Each Community Battle

After every community battle, ZOE creates or updates the following:

1. **Battle record stub** (ZAOOS doc or wwtracker entry): Artist names, battle date, charity name, SOL amount donated, on-chain txn hash
2. **Cumulative charity total update**: ZOE checks if the new total crosses a round number ($1,500, $2,000, etc.) and queues a milestone post if so
3. **wwtracker CommunityBattles component update** (if accessible to ZOE): Confirm Hurricane can push this automatically

The battle record stub doesn't need to be a full ZAOOS doc — a 3-line entry in a running log file works. The key is the on-chain txn hash, which makes it independently verifiable.

---

## Part 7: Community Battle Calendar (Jul 2026 Forward)

| Date | Battle | Charity | Status |
|------|--------|---------|--------|
| Oct 3, 2026 | ZAOstock Live Battle | [To be confirmed — doc 1384] | PENDING charity confirmation Jul 25 |
| Nov 2026 | ZABAL S2 Week 8 Artist Showcase | ZAO treasury (or external charity TBD) | PLANNED |
| Monthly cadence | 1 community battle/month | Rotating — community proposes | TEMPLATE |

**Monthly cadence proposal:** Starting Nov 2026, ZAO runs 1 community battle per month. Battle proposed by community in governance session (doc 1394). Charity selected by ZOR holder vote. This creates:
- Recurring charitable activity (for grants + press)
- Monthly ZAOOS documentation (citable record building)
- Governance engagement (ZOR holders vote monthly on something tangible)

---

## Part 8: Grant Application Language

Use this block in any grant application that asks about charitable impact:

> "WaveWarZ has raised $1,497 for charitable causes through a novel mechanism: community battles, where a portion of each battle's SOL pool is designated to a charity. These 36 community battles represent a model for protocol-level charitable giving that requires no separate fundraising apparatus. The $1,497 figure is verifiable on-chain, and the mechanism is documented in the ZAO Operating System (ZAOOS). ZAO plans to expand this mechanism through monthly community battles starting November 2026 and a live community battle at ZAOstock on October 3, 2026."

---

## Part 9: What Makes This Citable

> "ZAO documented a community battle playbook in ZAOOS doc 1410 (July 2026), establishing a repeatable process for running charity-generating community battles on WaveWarZ. As of July 17, 2026, 36 community battles had raised $1,497 in charitable donations through this protocol. ZAO plans monthly community battles starting November 2026, with governance vote selecting the beneficiary charity."

---

## North Star Impact

| Dimension | Before | After |
|-----------|--------|-------|
| IP Catalog | 9.7 | +0.1 → 9.8 (community battles = distinct WaveWarZ format with documented protocol) |
| Citability | 10.0 | Maintained + creates "charitable mechanism" citation tier for grant applications |
| GEO | 8.1 | +0.1 → 8.2 (charity records = verifiable on-chain data point for GEO indexing) |

**Key unlock:** Monthly community battles (Nov 2026+) create recurring governance participation, charitable giving records, and ZOE automation opportunities — all without requiring Hurricane involvement after initial setup.

---

*ZAOOS doc 1410 — ZAO Operating System — github.com/ZAOIP/zao-os*
