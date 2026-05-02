# Claude Code for Whop Creators - Design Spec

**Date:** 2026-05-02
**Status:** brainstormed, awaiting user review before plan
**Owner:** Zaal (BetterCallZaal Strategies LLC)
**Related research:** [Doc 581](../../../research/business/581-whop-creator-deep-dive/) - Whop platform + top creators deep dive
**Related memory:** project_bcz_agency.md, project_bcz_consulting_apr10.md

## Summary

A private $5/mo Whop community where Whop creators (mostly non-dev: trading, fitness, betting, business coaches) bring real problems to live "build with me" sessions and watch Zaal solve them with Claude Code in real time. Three tiers: FREE (recording archive only), $5/mo (live community), $99/mo VIP (5-10 lifetime slots, 4 hrs/mo first-come consulting). Eats Whop's own dogfood - hosted entirely on Whop's native apps. Functions as a lead-gen funnel for BetterCallZaal Strategies agency contracts.

## One-Liner

"Live Claude Code sessions for Whop creators who can't justify hiring an engineer but know AI agents could automate their Discord onboarding, churn DMs, content clipping, and ops work."

## Audience

**Cold target:** Whop creator hitting $5K-50K/mo who can't afford an engineer but knows AI could automate ops. They scroll Whop Discover, see "Claude Code for Whop Creators" at $5, take the cheap bet.

**Warm target:** members of any of Zaal's existing communities (The ZAO, FISHBOWLZ, ZAOstock team, BCZ client list) - get one free month via manual DM unlock.

**Donor target:** anyone who donates $5+ to ZAOstock's Giveth project gets one free month via manual DM unlock with tx proof.

**Why not dev-first:** most successful Whop creators (per Doc 581b) are non-dev. They have audience and revenue but no engineering capacity. Claude Code is the bridge. Dev-first cohorts are oversaturated; non-dev creator tier is blue ocean.

## Tier Architecture

| Tier | Price | What members get | Purpose |
|---|---|---|---|
| **FREE** | $0 | Past live stream recording archive only. No live access, no chat, no DMs. | Lead magnet. Cold visitor sees real problems being solved. Funnel to $5. |
| **$5/mo** | $5 | Live "build with me" stream access (private, Whop-native), member-driven Q&A submissions, full recording archive, member chat. Whop Coach AI for between-stream Q&A. | The community. Where MRR sits. Free month unlock for "in any of Zaal's communities" or "$5 to Giveth ZAOstock" via manual DM. |
| **$99/mo VIP** | $99 | Everything in $5 + up to 4 hrs/mo first-come 1:1 consulting. **Hard cap: 5 lifetime slots at launch, raise to 7 then 10 only if Zaal proves capacity over 90 days.** Founding-member status (never reopens once filled). | BCZ agency on-ramp. VIP relationships convert to bigger BCZ consulting contracts at standard rates ($35+/hr). |

**Pricing logic:**
- $5 is deliberately below Whop's $29-49 entry sweet spot (per Doc 581c). It's a lead-gen funnel, not the revenue play.
- $99 jump from $5 is 20x - clean separation, avoids the 2-5 tier muddy-middle that Doc 581c flagged as confusion zone.
- Real revenue = the 5-10 VIP slots ($500-1000 MRR) + the BCZ agency contracts that emerge from VIP relationships.

**Why VIP starts at 5 not 10:** Time creep is the scariest failure mode (see Section: Failure Modes). 10 VIPs x 4 hrs/mo = 40 hrs/mo = ~10 hrs/wk on top of community ops. 5 VIPs x 4 hrs/mo = ~5 hrs/wk peak (and most won't use the full 4 hrs/mo). Conservative start, raise the cap when 3 months of stable execution shown.

## Live Format + Cadence + Platform

### Format
Members submit problems async in Whop chat (one channel: `#problems-for-the-stream`). Zaal picks 1-3 per session. Live stream = screen share, real Claude Code, real solve, members watch + ask in chat. ~45-60 min per session. **No prep** - the realness IS the product. Members see the actual workflow including dead ends and re-prompts.

The "private, no clips, no public YouTube version" framing is the differentiator vs every polished AI-tutorial channel.

### Cadence
**Hybrid organic.**
- **Floor:** 1 stream per week minimum (or post a "no stream this week, here's why" message - protects time-creep risk).
- **Pull-driven:** when a member posts a juicy problem and 3+ others react / comment, Zaal pings the room and schedules within 48hr.
- **No fixed weekly time slot at launch** - let demand reveal the natural rhythm. Lock a fixed slot only if pattern emerges by month 2.

### Platform stack
**100% Whop native** (full dogfood, simplest possible stack):
- Whop Livestream app for the live sessions
- Whop Course app auto-archives recordings; FREE-tier members get read-only access
- Whop Chat app for member discussion
- Whop Coach AI app trained on past stream Q&A handles common between-stream questions (cuts mod workload ~40% per Doc 581c)

**No Discord, Telegram, Skool, Circle, or external tooling at launch.** Fewest places for things to break.

## Funnel + Free-Month Unlock Mechanics

### Path
```
Cold visitor (X / Whop Discover / outbound DM)
    |
    v
Lands on Whop product page (FREE tier visible)
    |
    v
Browses 3-5 stream recordings  ->  decides if value real
    |
    v
Two paths to $5 tier:
    (a) pays $5/mo direct (cold conversion)
    (b) DMs Zaal: "I'm in [The ZAO / FISHBOWLZ / etc]" OR "donated $5 to Giveth ZAOstock here's tx"
        -> Zaal verifies (eyeball check, ~2 min) -> DMs Whop promo code for 1 free month
        -> after month, default conversion to paid $5/mo (Whop auto-bills unless cancel)
    |
    v
After 1-2 months at $5, top engagers offered VIP $99 slot (if open)
    |
    v
VIP relationships -> BCZ agency contracts at standard rates ($35+/hr per memory)
```

### Free-month unlock rules
- Membership in **any of Zaal's communities** = 1 free month, one-time per person, never repeats. Maintained allowlist (start: The ZAO Farcaster gated, FISHBOWLZ, ZAOstock team chat, BCZ client list).
- **Giveth ZAOstock donation** of $5+ (any tx, any time, any wallet) = 1 free month, one-time per wallet.
- **Verification = manual DM** with screenshot or wallet tx link. ~2 min per claim.
- **Cap: max 10 unlock DMs per week.** If 10 hit by Wednesday, rest queue publicly to next week. Cap is published on Whop product page so expectations are clear.

### Default-to-paid is the real lever
Whop auto-bills after free month unless member cancels. Industry conversion ~30-50% on default-to-paid free trials. This is what makes the "free month" giveaway not a permanent loss.

### v1 = no automation
No bot, no on-chain verifier, no Whop App build. All eyeball + DM. If volume breaks 10/wk consistently for 4+ weeks, revisit (could write a Whop App that reads Giveth tx + checks ZAO membership token on Base - per Doc 581e this is technically feasible but not plug-and-play).

## Cold Launch Sequence (90-day phased)

### Phase 1 - Days 1-14: Bootstrap (own communities)
- Set up Whop product page + 3 tiers + Coach AI + Chat + Livestream + Course archive (~4 hrs setup).
- Drop free-month claim invitation in: The ZAO Farcaster, FISHBOWLZ chat, ZAOstock team chat, BCZ client thread. One paragraph + DM unlock instructions.
- **Goal:** 15-25 free claims -> 3-5 live streams in two weeks -> 10-15 recordings in archive.
- No paid acquisition this phase. Focus = build the recording library that proves value.

### Phase 2 - Days 15-45: X thread + reply-bomb (cold reach with proof)
- Write one launch X thread: "I'm running live Claude Code sessions for Whop creators, $5/mo, here's 3 problems we already solved" - post anonymized text screenshots / problem statements only (recordings stay private).
- Reply-bomb top 30 Whop creator accounts (use whoptrends.com top-earner list from Doc 581b) with one-line value adds. Never pitch the community in a reply; just be useful for 2 weeks.
- **Goal:** 20-30 cold $5 paid signups by day 45. First real MRR ($100-150).

### Phase 3 - Days 46-90: Cold DM top Whop creators (high-signal targeted)
- DM top 100 Whop creators from Doc 581b (sports betting, fitness, business coaches with signal of needing automation). Template: "Saw you posted X. I run live Claude Code sessions where Whop creators bring exactly that kind of problem. $5 to test, free if [reasons]. First month on me here's a code: ___". Send 5-10/day for 2 weeks.
- **Goal:** 50-75 paid members by day 90. First VIP slot conversation by day 60.

### Held in reserve: Craig Gonzalez
**Don't burn the Doc 581 sponsorship relationship on a $5 product.** If the community is working by day 90, that's when to mention it to Craig as case study fuel for the bigger ZAOstock sponsorship conversation. Premature ask = lower-quality conversation.

## Time Guardrails

**Weekly hard ceiling: 6 hrs total community ops** (not counting VIP consulting hrs which are billable separate bucket).

| Activity | Budget | Guardrail |
|---|---|---|
| Live stream (1x/wk floor, 2x peak) | 2 hrs | If a third stream demanded same week, pin "next week" |
| DM unlocks (free month claims) | 1 hr | Cap = 10 DMs/wk. After 10, queue publicly to next week. |
| Whop chat moderation + Coach AI tuning | 1 hr | Coach AI handles 70%+; Zaal touches escalations only |
| X presence (reply-bomb + occasional thread) | 1 hr | Batch into 2 sittings, not always-on |
| Outbound cold DM (cold launch phases only) | 1 hr | Drop to 0 after day 90 |
| **Total ops** | **6 hrs** | |

**VIP consulting (separate bucket):**
- 5 slots * up to 4 hrs/mo = 20 hrs/mo peak = ~5 hrs/wk peak. Realistic usage = 1-2 hrs/member/mo, so likely 5-10 hrs/mo actual = ~1-2 hrs/wk.
- This is billable revenue time, not community ops. Don't conflate.

**Three escape hatches built in from day 1:**
1. **Hibernation week** - quarterly "no stream this week, no DMs answered, see you Monday" post. Pre-announce on product page so members know the rhythm. Burnout-proof.
2. **DM-cap public** - "10 free unlocks/wk, queue rolls Mondays" on the product page. Sets expectation, no guilt.
3. **VIP slot growth gated on capacity** - start at 5 slots. Only raise to 7, then 10, after 90 days of stable execution + Zaal explicitly opting in. Default = stay at 5.

**Stop-loss rule:** if any week breaks 8 hrs of community ops for 3 consecutive weeks, pause new free-month unlocks and hold steady until you find what's overrun.

## Success Metrics

| Metric | 30-day | 60-day | 90-day |
|---|---|---|---|
| Free-tier signups (incl unlocks) | 25 | 60 | 120 |
| Paid $5/mo members | 5 | 20 | 50 |
| MRR from $5 tier | $25 | $100 | $250 |
| VIP slots filled | 0 | 1 | 3 |
| MRR from VIP | $0 | $99 | $297 |
| **Total MRR** | **$25** | **$199** | **$547** |
| Live streams shipped | 4 | 10 | 20 |
| Recordings in archive | 4 | 10 | 20 |
| BCZ leads from VIP relationships | 0 | 0 | 1+ |

**The win condition that matters most:** by day 90, at least 1 VIP relationship has converted into a real BCZ consulting contract at $35+/hr. That's the actual revenue play; community is the funnel.

## Failure Modes + Kill / Pivot Criteria

Any one triggers a debrief, not auto-shutdown.

1. **<15 paid $5 + <2 VIP convos by day 60** - wrong product or wrong audience. Likely pivot: drop the Whop-creator angle and rebrand for ZAO-adjacent indie hackers (broader cold pool).
2. **Time creep** (>8 hrs ops/wk for 3 straight weeks) - pause new unlocks, raise prices, or close enrollment until under control.
3. **Whop account flag / freeze** (per Doc 581d risk) - migrate $5 members to Skool or Circle, refund disputed, post-mortem. Maintain export of member emails + tx history weekly.
4. **Zaal hates running it after 60 days** - honest answer matters more than MRR. Wind down clean, refund prorated, keep recording archive free forever as goodwill artifact.

**Stop-loss reminder:** stop-loss > sunk cost. Time creep is the scariest failure (Zaal's own answer in brainstorm). Mitigations are baked in but require Zaal's discipline to enforce.

## Open Questions for Plan Phase

- **Allowlist maintenance:** how is "Zaal's communities" list kept current? (proposed: a single doc in repo updated quarterly; whoever asks for unlock check against latest version)
- **Recording redaction:** do members appear by name or get pseudonyms in recordings? (proposed: ask in #problems-for-the-stream submission template; default = first name only)
- **Cancellation flow:** Whop standard cancellation vs. exit survey? (proposed: 1-question survey "what didn't work" - drives roadmap)
- **VIP graduation path:** when a VIP slot closes (member leaves), does it reopen or stay closed forever? (proposed: stays closed - protects "founding member" scarcity narrative)
- **Giveth wallet verification:** is screenshot enough, or do we need on-chain tx hash? (proposed: tx hash required for Giveth, screenshot OK for community membership)
- **Promo code bulk gen:** how does Zaal generate 10/wk Whop promo codes efficiently? (proposed: bulk-generate 50 at a time monthly, store in 1Password, use as needed)
- **Tax / accounting:** Whop revenue lands in BCZ Strategies LLC bank account? (yes, per memory project_bcz_agency.md)

## Source Material

- Doc 581 hub - Whop platform + top creators deep dive (DISPATCH research, May 2026)
- Doc 581a - Whop platform fundamentals (fees 2.7% + $0.30, $1.6B Tether, 18.4M users)
- Doc 581b - Top creators (Committed Coaches $4.9M/mo, Stock Hours, Iman Gadzhi - benchmarks)
- Doc 581c - Playbook patterns (live calls 2x/wk = 60-75% retention, free-to-paid funnel, default-to-paid conversion)
- Doc 581d - Anti-patterns (account freezes, FTC/SEC exposure - drives kill criterion #3)
- Doc 581e - ZAO x Whop integration thesis (USE/PARTNER/SKIP table; this spec is the "USE Whop for course sales" pilot)
- Memory: project_bcz_agency.md (BCZ as Zaal's only LLC, agency model)
- Memory: project_bcz_consulting_apr10.md (consulting context)
- Memory: feedback_prefer_claude_max_subscription.md (use Claude Max not API for VPS bots, doesn't apply directly here but informs cost model)
