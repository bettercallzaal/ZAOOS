---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: 863, 865
original-query: "Brainstorm the best way to use Magnetiq (magnetiq.xyz, currently only used for UGC feedback), Lu.ma (events), and Unlock - all 3 do collectibles. Define the differences and the pros for each. Magnetiq page: https://app.magnetiq.xyz/brand/zabal/magnet/zabal-gamez"
tier: STANDARD
---

# 867 — Three Collectible Tools: Lu.ma vs Magnetiq vs Unlock (division of labor)

> **Goal:** Define what each of Lu.ma, Magnetiq, and Unlock is actually best at, since all three can issue a "collectible," and decide which job each one owns for ZAO events.

## Key Decisions

| Decision | Call | Why |
|----------|------|-----|
| Lu.ma's job | **Discovery + RSVP front door** | Public calendar, reminders, the link you share. Free, manual. Its "collectible" is just an attendance record - weak; do not rely on it as the collectible. |
| Magnetiq's job | **Live activation + retention + zero-party data** | A Magnetiq "Magnet" is already an attendance-gated collectible ("can only be claimed by those who attend") plus polls/UGC/feedback and a Shopify commerce path. This is the engagement + brand + data layer. ZAO already runs the ZABAL Gamez magnet here. |
| Unlock's job | **Ownership + on-chain gating + composability** | ERC-721 keys on Base that ZAO owns outright, gate any app (ZAO OS, Discord, Telegram), are permissionless and portable, and double as July build-eligibility signals. Use when ownership/gating matters more than the engagement UI. |
| Default for a ZAO talk | **Lu.ma to fill the room -> Magnetiq Magnet for the live claim + feedback -> Unlock key only when the collectible must gate on-chain perks** | Each tool does the one thing it is best at; they chain, they do not compete. |
| Tyler message | **Hold + rewrite** | The old draft asked "can Magnetiq embed Unlock." Better question now: are Magnets on-chain NFTs we can read/gate, on which chain, and is there an API for claims. See open question. |

## The core distinction (the thing to internalize)

All three can hand someone a "collectible," but they are collectibles of different KINDS:

- **Lu.ma collectible = a record.** Proof you signed up. Lives in Lu.ma. Not portable, not composable. Value = logistics (reminders, calendar, headcount).
- **Magnetiq Magnet = a branded engagement asset.** Proof you participated, tied to zero-party data, UGC, polls, and (via Shopify) commerce. Lives in Magnetiq's owned-community rails. Value = retention, data, and turning fans into buyers - off-algorithm, on data ZAO owns.
- **Unlock key = an owned, composable token.** An ERC-721 on Base that ZAO controls at the contract level. Value = it gates anything on-chain, is permissionless, portable across apps, and has no vendor lock-in.

Pick by what you need the collectible to DO, not by "which one issues an NFT."

## Comparison

| Dimension | Lu.ma | Magnetiq (magnetiq.xyz) | Unlock |
|-----------|-------|-------------------------|--------|
| Primary job | Event discovery + RSVP | Owned community + engagement + commerce | On-chain membership/ticket protocol |
| The "collectible" | RSVP/attendance record | "Magnet" - attendance-gated collectible + digital swag | ERC-721 key |
| Attendance-gated claim | Weak (RSVP only) | YES - native ("claimed only by attendees") | YES (password-hook + window, doc 865) |
| Zero-party data | Guest list / emails | YES - deep, attribution to purchase, owned | Wallet address (pseudonymous) |
| Engagement (polls/UGC/quizzes) | No | YES - core feature (Co-Lab, UGC Studio, gamification) | No |
| Commerce | Paid ticketing | Shopify catalog sync, revenue attribution | Paid keys (crypto/Stripe) |
| Ownership / composability | Vendor-locked | Vendor rails (you own the data) | YOU own the contract; gate any app, portable |
| Gates ZAO OS / Discord / Telegram | No | Only inside Magnetiq | YES (we already read keys, doc 863 PR #864) |
| Chain | n/a | Web3 collectible - chain UNCONFIRMED (see open Q) | Base (8453) |
| Cost | Free (API needs paid Plus, doc 865) | SaaS ("test drive", pricing TBD) | Gas only (cents on Base); self-host surface |
| Lock-in | Medium | High (platform) | None (open protocol) |

## Recommended flow for a ZAO talk / ZABAL Gamez session

1. **Lu.ma** - create the event (manually, no paid API per doc 865), share the link, get RSVPs + reminders. Fills the room.
2. **Magnetiq** - run the live Magnet during the talk: attendees claim the Magnet (proof of attendance), drop a poll / collect UGC / feedback, surface any merch via Shopify. This is the retention + data + brand loop, and it is what Magnetiq is already doing for ZABAL Gamez.
3. **Unlock** - mint an Unlock key on Base ONLY for the subset that must gate on-chain: recording access, July build-eligibility, Discord/Telegram/ZAO OS perks, or anything that should be portable + owned with no vendor lock-in.

They compose cleanly: Lu.ma drives the funnel, Magnetiq runs the live experience + owns the data, Unlock provides the durable on-chain rights.

## What changes vs doc 865

Doc 865 assumed we would BUILD the time-boxed live-claim on Unlock + self-host it. Now we know Magnetiq already ships that exact attendance-gated claim with engagement + data baked in. So:

- For the LIVE claim + feedback during a talk: **use Magnetiq's Magnet** instead of building it on Unlock. Less to build, and it is what Magnetiq is for.
- Keep **Unlock** for the on-chain ownership/gating layer (the part Magnetiq may not give us portably).
- The doc-865 v1/v2 custom-hook build is now a fallback, only if Magnets are NOT on-chain NFTs we can read (see open question).

## Open question (drives the Tyler message)

The 2023 Nolcha case study calls Magnets "Web3 technology for verifiable ownership" - but does the CURRENT Magnetiq mint an actual on-chain NFT we can read and gate against, and on which chain? If yes, the overlap with Unlock is large and we may not need a separate Unlock key at all for most events. If Magnets are platform records only, Unlock stays the on-chain layer. This is the one fact that decides whether Unlock is primary or just a gating mirror.

Rewrite the Tyler message to ask: (1) is a Magnet an on-chain NFT, which chain, can we read holders via API; (2) can we gate external apps (ZAO OS/Discord) off Magnet ownership; (3) API/webhook to read claims + open/close the claim window.

## Also See

- [Doc 863 - Unlock Protocol event ticketing](../../business/863-unlock-protocol-event-ticketing/) (the Unlock base build, PR #864)
- [Doc 865 - Unlock-first live-claim tickets](../865-unlock-liveclaim-luma-magnetiq/) (the prior Unlock-first decision this refines)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Rewrite the Tyler message around "are Magnets on-chain NFTs + API for holders/claims" | @Zaal | Outreach | Before sending |
| Confirm whether a Magnet mints an on-chain NFT + which chain | @Zaal | Verify (ask Tyler) | This week |
| Decide Unlock primary vs gating-mirror based on that answer | @Zaal | Decision | After Tyler reply |
| For the weekend event: run RSVP on Lu.ma + the live claim on the existing ZABAL Gamez Magnet | @Zaal | Ops | This weekend |
| Hold the doc-865 custom-hook build unless Magnets turn out to be non-readable | @Team | Decision | After Tyler reply |

## Sources

- [Magnetiq home (magnetiq.xyz)](https://www.magnetiq.xyz/) [FULL] - clubhouse, owned data, off-algorithm retention, Shopify
- [Magnetiq For Brands](https://www.magnetiq.xyz/for-brands) [FULL] - drops with feedback loops, polls, rewards, IRL+digital
- [Magnetiq Engagement Toolkit](https://www.magnetiq.xyz/engagement-toolkit) [FULL] - polls/quizzes/challenges, gamification (points/badges)
- [Magnetiq Commerce Communities](https://www.magnetiq.xyz/commerce-communities) [FULL] - Shopify sync, revenue attribution
- [Magnetiq Nolcha Shows activation (Magnet = attendance-gated collectible)](https://www.magnetiq.xyz/blog/magnetiq-nolcha-shows-activation) [FULL - 2023, verify current on-chain behavior]
- [ZABAL Gamez magnet page](https://app.magnetiq.xyz/brand/zabal/magnet/zabal-gamez) [PARTIAL - JS app shell; WebFetch + exa returned title only, content not rendered without the Playwright bridge extension]
- [Lu.ma API help](https://help.luma.com/p/luma-api) [FULL - via doc 865; API needs paid Plus]
- [Unlock event ticketing - doc 863 + codebase](../../business/863-unlock-protocol-event-ticketing/) [FULL - shipped, `src/lib/unlock/lock.ts`]
- POAP excluded - maintenance mode since 2026-03-16, Gnosis-only (doc 865)
