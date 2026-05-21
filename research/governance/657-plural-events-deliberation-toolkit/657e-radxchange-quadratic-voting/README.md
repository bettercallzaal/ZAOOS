---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: 657, 056, 058, 111
tier: STANDARD
parent-doc: 657
---

# 657e — RadicalxChange Quadratic Voting (+ Vokwal alternative)

> **Goal:** Use RadxChange QV as the "ratification" stage AFTER deliberation. Skip for casual events. Adopt Vokwal-pattern (QR + session cookie) for high-trust low-stakes ZAO group decisions.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use RadxChange QV at Maine Plural Event | NO | Too heavy — unique per-voter links required, 99 voice credits, security model designed for public governmental settings. Bastien (Berlin) explicitly opted out for the same reason. |
| Use Vokwal-style QR + session-cookie QV at Maine Plural Event | YES if a vote is needed at all | Session-cookie security is fine for in-person 25-person event. Bastien's exact pattern: share QR code, vote for 15 min, done. |
| Use full RadxChange QV for ZAOstock Oct 3 sponsor/budget decisions if those become formal | YES | When voting maps to real money / real commitments, the per-voter-link security model is correct. |
| Adopt for ORDAO + ZAO fractal Respect voting | EVALUATE | Jack Henderson's whole pitch is "QV beats cumulative voting" — but ORDAO already uses Respect which has quadratic-shape properties. Need a separate doc comparing ORDAO Respect math to Jack's QV credits-pool math. |

## What Quadratic Voting Solves

Jack Henderson's framing on the call: **voting is the ratification step after deliberation.** Deliberative tools (Polis, dembrane, Agora) get you to a shared agenda; QV is how the group settles on it.

The voting-scheme problem space (from Jack's spiel):

| Scheme | Problem |
|---|---|
| One person, one vote | Tyranny of the majority — apathetic majority outvotes passionate minority. "Two wolves and a sheep deciding what's for dinner." |
| Rank-choice voting | Better — but can't express tier or strength of preference, only order. |
| Approval voting | Better — but you just sign your name to any items you like, no tradeoffs forced. |
| Cumulative voting | Better — pool of votes you allocate across items — but no cost to going all-in on one extreme position. |
| **Quadratic voting** | Each additional vote on one item costs *more* than the last (cost = votes squared). Forces tradeoff thinking: do I really want to spend 81 credits to put 9 votes here, or spread them widely? |

## RadxChange QV Implementation Details

- Default ballot: **99 voice credits** per voter (deliberate — 100 would allow going all-in 10 votes; 99 means max 9 votes on one item, forcing you to spread the leftovers).
- One vote = 1 credit. Two votes = 4 credits. Three votes = 9. n votes = n² credits.
- Each participant gets a **unique link** at ballot setup. Once used, that link can't add more votes — sybil resistance.
- Admin dashboard: title, description, ballot items, number of unique links to generate.
- New "liquid funnel" UI Jack demoed: votes are the water level in a funnel, and the funnel's narrowing shape means each unit of height takes way more liquid as you go up. Vibe-coded by Jack, not yet production.

## Why Bastien (Berlin) Skipped It

Two reasons, both honest:
1. Security is too strict for the use case. Berlin event uses QV only for **group formation** — vote on most-urgent local breakdown, pick top 3, form working groups. Generating + distributing 30 unique links is real friction.
2. **Vokwal** exists as a less-secure alternative: same quadratic math, session-cookie identity (not unique link), QR-based — anyone with the QR can vote. Spoofable, but acceptable for a 15-minute live high-trust vote.

Jack's response: "this tool was built for public governmental settings where security was important. You're right — high-trust settings could dial down security. We'll put a low-security QR option on the roadmap." This is action item logged at meeting timestamp 59:28.

## How To Take Deliberation Output Into A QV Ballot

Jack's exact pattern:
1. Polis / Context Engine / Agora / dembrane runs the conversation.
2. The tool surfaces statements: high-consensus, divisive, "ungrounded" (no cluster has agreement).
3. **Take the most interesting / divisive statements** off the deliberation tool's results page.
4. Put them on a QV ballot as the items to allocate credits across.
5. Run the QV.
6. The group has "agenda-setting power" (chose what's on the ballot) AND "preference-strength power" (allocate within their budget).

## ZAO Integration Path

| Use case | Tool | Why |
|---|---|---|
| Maine Plural Event 15-min wrap-up vote | Vokwal-style QR | Low-stakes, in-room, no need for per-voter links |
| ZAOstock 2026 budget allocation among 3-5 line items (sound / tents / food / talent / promo) | RadxChange QV | Real money. Want each Wallace / Roddy / Steve Peer / Iman vote to count once. Unique-link model fits. |
| ORDAO weekly Respect distribution | (don't replace) | ORDAO already has its own math; investigate compatibility separately, don't slot QV in directly |
| The ZAO Snapshot governance | RadxChange QV as an experiment | Membership is identified (Farcaster + wallet). Run one test where instead of yes/no Snapshot vote, members get 99 credits to allocate across 5 proposals. Compare result to traditional Snapshot. |

## Cost

Free. OSS. No fees beyond hosting your own ballot generator + storage.

## Strengths

- The cleanest expression of strength-of-preference in any vote-aggregation system.
- Mathematically grounded — protects passionate minorities from apathetic majorities.
- Production-tested: Taiwan Presidential Hackathon (2019-present), Colorado State Legislature (2019-2023), NYC District 9 $1M participatory budgeting (2023).

## Limitations

- Per-voter unique links = real distribution friction.
- Voters need to *understand* the cost curve to vote rationally — first-time voters often vote naively and lose value.
- Vokwal-grade low-security mode not yet shipped (on roadmap as of May 12 2026 call).
- For very small groups (< 10 people), the math advantages collapse and you might as well rank-choice.

## Sources

- [RadxChange Quadratic Voting Wiki](https://www.radicalxchange.org/wiki/quadratic-voting/)
- [RadxChange Plural Voting Tool Page](https://www.radicalxchange.org/tools/plural-voting/)
- [Plural Voting brief — New America](https://newamerica.org/political-reform/briefs/exploring-plural-voting-as-a-method-for-citizen-engagement) — covers Taiwan Hackathon + Colorado + NYC case studies
- Meeting transcript — Jack Henderson's QV walkthrough from ~48:14 to ~58:58; Bastien's Vokwal counter from ~59:39

**Vokwal note:** Bastien named "Vokwal" as the low-security QR-based QV alternative he uses in Berlin. Verify the exact tool URL / availability before adopting — it didn't surface in our web search but is referenced in the meeting as an existing thing.
