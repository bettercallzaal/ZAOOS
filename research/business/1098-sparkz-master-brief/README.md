---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-14
related-docs: 1088, 1095, 1096, 1097
original-query: "consolidate + refine the overnight Sparkz research (brainstorm + timing 1095 + design 1096 + competitive 1097 + #17 prototype) into one corrected master brief"
tier: DEEP
---

# 1098 - Sparkz master brief (overnight synthesis + corrections)

> **Goal:** One place to review Sparkz. Consolidates the brainstorm decisions, the timing read (doc 1095), the design (doc 1096), and the competitive landscape (doc 1097), with errors corrected and every big number flagged for verification. Read this instead of the four scattered docs.

## Key Decisions (locked in the 2026-07-14 brainstorm)

| Decision | Value |
|----------|-------|
| What Sparkz is | An energy-first creator-coin product on Farcaster |
| Sequencing | Tokenless first - build a following, THEN launch the coin |
| Launch trigger | An AI agent decides WHEN there is enough energy (this is the differentiator) |
| Launch rail | Clanker (on Base), routed **0xSplits-first** (see "The launch rail" below) |
| Fee | 1%; creator keeps ~99% |
| Starter kit | An AI agent + a Farcaster channel + two miniapps to try (tortoise, fotocaster) |
| Model | Modeled on how QR coin grew on Farcaster |
| Principle | The token ADDS to what is built, it does not extract |

## The launch rail: 0xSplits-first (Iman dogfood catch, 2026-07-16)

**The catch.** Clanker v4's `rewardBps` - the on-token fee split - is **immutable once the token launches**. A Sparkz token that bakes its creator/treasury split directly into Clanker can never change it: no adding a collaborator, no adjusting the treasury cut, no fixing a mistake. For a product whose whole pitch is *configurable* creator coins, that is fatal.

**The fix - make 0xSplits the default rail, not an option.** Every Sparkz launch routes fees through a 0xSplits contract:

1. **Deploy a 0xSplits contract first** - mutable (a controller is set, not the zero address), holding the initial recipient split.
2. **Launch the Clanker token with that Splits contract as the SOLE fee recipient** (`rewardBps` -> 100% to the Splits address).
3. Clanker's immutable `rewardBps` now points at a **mutable** Splits contract, so the creator re-balances the real split anytime via the Splits controller - add a collaborator, shift the treasury cut, fix an error - with no token redeploy and no lost adjustability.

So 0xSplits is **non-optional** *when the split must change*: with immutable Clanker rewardBps, routing through Splits is the only way to keep the split re-balanceable, which is the product.

**Refinement (from the doc 1094b Clanker v4 review, 2026-07-17) - make it a decision, not a blanket rule.** Clanker v4 natively supports **up to 7 reward recipients** at deploy, and each recipient's admin can change *its own wallet* later - but the **percentages are immutable** (they are fixed at deploy and must sum to 100%). So:

- **Fixed split, <= 7 recipients, only wallet swaps expected** -> use Clanker's **native** recipients. Simpler, one contract, no Splits. You can still repoint a recipient's wallet.
- **The split must change** - re-balance %, add/remove a collaborator, or a *growing* recipient set (the leaderboard/boostr case, or a band that gains members) -> **0xSplits-first**, because Clanker cannot change the % or the recipient count after deploy.

Default the Sparkz wizard to 0xSplits-first (it is always safe and the product is *configurable* coins), but let a creator who knows their split is fixed and small pick the lighter native path. Note: **Clanker v5 is not live yet** (in audit; expected to adopt Base's B20 token standard) - re-verify these mechanics when it ships (doc 988's zaalcaster launch is gated on v5 timing).

**What this changes:**
- The MVP's "Clanker launch flow" becomes a **Splits-first Clanker launch flow** - deploy Splits (step 1), then launch the token pointing at it. Not an afterthought.
- The Stage 1 wizard's "add collaborators" step (design: `papers/drafts/sparkz-music-collabs.md`) writes into the Splits contract that is then set as Clanker's sole recipient.
- This is the same mutable-controller Splits mechanic already used in the collab-split and Boostr pilot designs (doc 1141 Part 7) - now the canonical launch rail for *every* Sparkz token, not just band/collab tokens.

**Gated (not done here):** the wizard build (zaalcaster, owned separately), Jango's launch plan, and any on-chain deploy remain Zaal's hand. This is the design/rail update only.

## Legal guardrail: contributor-not-holder (from doc 1108 review, 2026-07-17)

**This is a design guardrail + a question for counsel (Greg), not legal advice.** But it is load-bearing enough to sit in the locked-in brief so no future build session designs it away.

The 0xSplits launch rail above routes fees through a Splits contract. Doc 1108's Howey table flags "**revenue-sharing token (% of payouts) = SECURITY, highest risk**" - which *looks* like it condemns the whole Sparkz fee model. The distinction that keeps Sparkz on the safer memocoin/utility side:

- The Splits contract routes fees to the **creators / collaborators / contributors** - the people doing the work - **not to token holders**. Howey's risk is promising *holders* a profit from others' efforts; paying the *workers* is not that.
- This holds **only if two things stay true**:
  1. the token's pitch **never** promises holders they will receive fees, treasury yield, or price appreciation. "Hold this and earn" is the trap - it reintroduces Howey prongs 3 + 4 and turns the coin into a security.
  2. reward mechanics stay **participation/energy-based, not holding-based**. This is the same energy-first thesis the whole product rests on - and it matters most for the boostr "50% to the leaderboard" split (doc 1141 Part 7): that reward must be **earned by showing up**, never by *holding the coin*.

**Build implications (bake these into the wizard + copy):**
- The Sparkz wizard's collaborator/leaderboard step writes **contributor** wallets into the Splits contract - frame it as "paying the people who did the work," never "paying holders."
- No surface (landing, token page, cast copy, wizard) may say or imply "hold $TOKEN and earn." Reward = energy/participation, full stop.
- Keep the energy-first framing the *legal* moat, not just the marketing one.

**The question for counsel (Greg):** does routing fees via 0xSplits to contributors (not holders), plus an energy-based (not holding-based) leaderboard reward, keep a Sparkz creator-coin on the memocoin/utility side rather than the revenue-sharing-security side? (Boarded: `research-doc:1108`; source analysis in [doc 1108](../1108-sparkz-legal-framing/).)

## The positioning verdict (from doc 1097 - the honest read)

Sparkz's wedge (energy-first + AI-judged launch timing) is **real but narrow**. No competitor gates launch on readiness - but the quality gate deliberately cuts volume. So **Sparkz wins as the sustainability leader, not the volume leader.** Success = tokens that last 90+ days and build community, not 48-hour pumps.

The competitors (numbers below need verification before you quote them):
- **Clanker** - the volume leader and the raw launcher. Its gap: no pre-launch validation, high early-failure rate. Sparkz is the curated layer on top.
- **Zora creator coins** - auto-generates a coin per profile; widely seen as not having worked. Gap: no curation, thin liquidity, post-launch abandonment.
- **Bankr** - a weaker Clanker-style tool.

What Sparkz must nail to be worth existing: (1) energy-first validation before launch, (2) the AI launch-timing call, (3) post-launch utility scaffolding so engagement survives day 1, (4) creator agency framing ("we help you launch better," not gatekeeping).

## The tooling (from doc 1096)

- **Tortoise [confirmed]** - a music streaming platform with a collection layer. Collecting a song is a direct support signal, which slots cleanly into the Sparkz energy score. Real fit.
- **Fotocaster [unconfirmed]** - confirmed to exist (seen at the ZABAL Gamez showcase) but its mechanics are not documented. Needs builder outreach before you design around it. Do not assume its role yet.

## The timing (from doc 1095 - directionally useful, numbers unverified)

The read is that Farcaster is in an up-cycle and the launch window is roughly now through end-of-summer, before the next lull. The lesson from Clanker vs Degen: hype decays fast (Clanker), real income sustains (Degen 24+ months) - so Sparkz should copy Degen's durability, not Clanker's spike. Treat the specific dates and the go-to-market timeline in 1095/1097 as proposals to confirm, not a committed plan.

## MVP (corrected from doc 1096)

Ship first: the energy-score engine (extends the working #17 prototype in bettercallzaal/zol), a simple creator onboarding, an energy dashboard (score + trend + the AI recommendation), the Clanker launch flow, and the Tortoise integration as an energy signal.

Defer (Phase 2): fotocaster (mechanics TBD), leaderboards, ZAO booster multipliers, deeper post-launch support.

Build effort: roughly **6/10** - most of the hard part (the energy score) is already prototyped in #17, and it reuses Neynar + Supabase + the DreamLoops framework, so there is little new infrastructure. (Doc 1096 stated "17/10, 2-3 weeks" - that is an error; the scale is 1-10 and we do not put time estimates on the board.)

## Numbers to verify before quoting publicly

The overnight research cited several large figures. Treat ALL of these as unverified until you or a careful pass confirms them - do not put them in a public deck yet:
- Clanker "$7.62B all-time volume," "436K tokens," "95% fail within 48h"
- Zora "$445M volume," "1.6M coins," the Coinbase-CEO "they didn't work" quote
- QR coin "$4.3M peak"
- "Neynar score >= 0.55" as the anti-sybil threshold
- The Farcaster "dead moment" dates + dollar figures in doc 1095
These are plausible but were generated by research agents that can fabricate specifics.

## Open questions for Zaal

1. Fotocaster - what does it actually do, and is it in the starter kit or dropped? (needs the builder)
2. The 1% fee - on what exactly (trade volume, launch, creator rewards)? How does it stack on Clanker's own fee?
3. The energy threshold - is 60/100 the right "ready to launch" line, and does it differ by creator type?
4. Are you the first proof-of-concept (launch your own coin through Sparkz as the demo)?

## Also See

- [Doc 1088](../1088-zaalcaster-empire-builder-coinz-crowdfunding/) - the original zaalcaster/coinz workflow Sparkz simplifies
- [Doc 1095](../../farcaster/) - Farcaster dead/revival + Sparkz timing
- [Doc 1096](../1096-sparkz-deep-design/) - the full architecture + creator journey
- [Doc 1097](../1097-sparkz-competitive-landscape/) - the competitor read
- bettercallzaal/zol PR #17 - the working energy-score prototype

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm fotocaster's role (reach the builder) | @Zaal | Outreach | 2026-07-18 |
| Verify the cited market numbers before any public use | @Zaal | Review | 2026-07-18 |
| Decide the 1% fee mechanics + energy threshold | @Zaal | Decision | 2026-07-19 |
| Greenlight or adjust the Phase-1 MVP (energy engine + onboarding + Clanker + Tortoise) | @Zaal | Decision | 2026-07-20 |
