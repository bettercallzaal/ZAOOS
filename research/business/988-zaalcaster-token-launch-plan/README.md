---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-07
superseded-by:
related-docs: 969, 987
original-query: "zaalcaster token launch: personal view-only Farcaster client + paid reply-to-list ($zaalcaster), combo stake+tip model, contributor rewards, ~50% over a month, Clanker v5, target Monday."
tier: STANDARD
---

# 988 - zaalcaster token launch plan (target: Mon 2026-07-13)

> **Goal:** The plan of record for launching $zaalcaster - the token, the reply-list mechanism, contributor rewards, the 50%/month, and the critical path to a Monday launch. Doubles as the zaalcaster one-pager foundation.

## What zaalcaster is

Zaal's **personal, view-only Farcaster client** - only Zaal posts from it; everyone else can view. It's his Farcaster cockpit (open-sourced; see [[project_zol_farcaster_agent]] / doc 969), now getting a token + a paid attention mechanism.

## The token mechanism (the crux)

**A spot in Zaal's reply-to list, decided by two dials he weighs himself:**

1. **Stake** - how much $zaalcaster the guest holds / has stacked. A standing commitment signal Zaal sees when he reviews the queue. Drives buy-and-hold demand.
2. **Tip** - an amount the guest attaches to a *specific* Farcaster-link submission, split **50% burned / 50% sent to Zaal**. Pay-per-boost on top of stake. Drives per-post buy pressure, burns supply (deflationary), and pays Zaal.

Guest flow: open zaalcaster (view-only) -> submit a Farcaster link + a tip amount -> the post enters Zaal's reply-to list, ranked by (stake + tip) with **Zaal's judgment as the final ranker** (a big holder with a small tip vs a small holder with a big tip is his call - two parameters, not a pure auction). Zaal replies from zaalcaster; the reply is the delivered value.

Why it's sound: three demand sources at once - hold (stake), spend (tip), and scarcity (burn) - with revenue to Zaal on every boost, and no promise of a *guaranteed* reply (his judgment stays in the loop, which keeps it from being a pay-to-spam machine).

## Token economics

- **Zaal keeps ~50%, vested/accumulated over the first month** (not dumped - signals long-term alignment).
- **Contributor rewards: discretionary.** Valuable PRs to the zaalcaster repo earn tokens at Zaal's judgment, case-by-case. The pitch: "this is how I build in the open - add value, earn $zaalcaster." No fixed pool yet (keep flexible for v1).
- **Launch rail: Empire Builder + Clanker.** Clanker **v5** is expected live in a few weeks - if the timing lines up, launch as an early v5 token; otherwise launch on current Clanker and note v5 migration.
- Burn (from the tip split) is the ongoing deflation; the reply-list is the perpetual sink.

## Critical path to Monday (Zaal: ALL four required)

| # | Must-ship | Owner | By |
|---|-----------|-------|-----|
| 1 | **zaalcaster GitHub polished** - clean, public, documented README (it IS the product + the open-source pitch) | @Zaal | 2026-07-11 |
| 2 | **Token config locked** - Clanker (v5?) params, supply, the 50%/month schedule, the stake+tip/50-50-burn mechanism spec | @Zaal | 2026-07-11 |
| 3 | **zaalcaster one-pager + landing** - so people understand what they're buying into (this doc = the draft) | @Zaal | 2026-07-12 |
| 4 | **Reply-list feature works** - the submit-link+tip -> ranked reply-queue flow, built + demoable in the client | @Zaal | 2026-07-12 |

## Open questions to close this week

- **Tip split mechanics on-chain**: does the 50/50 burn/send happen in the contract, or app-side on submission? (Clanker v5 fee hooks may do this natively - confirm when v5 docs land.)
- **Stake read**: ranking reads the guest's on-chain $zaalcaster balance at submission time - confirm the client can read it (Neynar/viem).
- **Anti-spam floor**: a minimum tip to enter the queue, so it doesn't fill with dust submissions.
- **v5 timing call**: launch Monday on current Clanker, or wait for v5? (Zaal leaning: Monday, possibly early-v5.)

## Also See

- [Doc 969](../../farcaster/969-zaalcaster-daily-driver-backlog/) - the zaalcaster feature backlog (the client this sits on).
- [Doc 987](../../cross-platform/987-linkedin-personal-brand-playbook/) - the LinkedIn playbook; the token launch is prime build-in-public + LinkedIn/Farcaster content.
- Empire Builder GC + Clanker v5 - the launch rails.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Polish + publish the zaalcaster GitHub repo (README, docs, public) | @Zaal | Repo | 2026-07-11 |
| Lock token config (Clanker/v5 params, supply, 50%/month, stake+tip/50-50 spec) | @Zaal | Decision | 2026-07-11 |
| Ship the zaalcaster one-pager + landing (from this doc) | @Zaal | Content | 2026-07-12 |
| Build the reply-list submit flow (link + tip -> ranked queue) in the client | @Zaal | PR | 2026-07-12 |
| Confirm Clanker v5 timing; decide Monday-on-current vs wait-for-v5 | @Zaal | Decision | 2026-07-10 |
| Launch $zaalcaster | @Zaal | Launch | 2026-07-13 |

## Sources

- [FULL] Zaal's design decisions (chat, 2026-07-07): the view-only client, the stake+tip reply-list model with 50/50 burn-send, discretionary contributor rewards, ~50%/month, Clanker v5 + Empire Builder, Monday target. This doc is the plan of record for those decisions.
- [PARTIAL] Clanker v5 fee-hook / native-split capabilities - not yet confirmed (v5 not live); flagged as an open question to close when v5 docs publish.
