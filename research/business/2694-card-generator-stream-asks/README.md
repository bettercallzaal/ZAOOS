---
topic: business
type: decision
status: research-complete
last-validated: 2026-10-21
superseded-by:
related-docs: business/2529-zao-artist-trading-cards, business/2690-zao-card-builder-artist-ui (open PR #4044), business/2689-wavewarz-zao-digital-cards-and-card-creator (open PR #4042), business/352-paragraph-x402-agent-implementation, business/2234-leftclaw-x402-poidh-bounty-funding, events/2355-wavewarz-battle-space-cannon-jones-vs-mose-aug8
original-query: "can u kepe researching more on all of these topics using the seat" (Zaal, 2026-10-21, zao-media pane). Topic 1 as routed by the seat: "ZAO TCG card generator [0:38:51]: upload art, pick a style, pay per generation via x402, open-source builder; physical giveaway to digital-card holders (Kismet Casa precedent) [1:09:44]."
tier: QUICK
---

# 2694 - The card generator Zaal pitched on B and Z Build: what is new against the card builder already planned

> **Goal:** Take the ZAO TCG card generator pitch from the 2026-10-21 B and Z Build stream and sort it into what the card builder plan already covers, what is new, and what conflicts with an earlier ruling.

**This is a delta doc, not a second card builder doc.** The card builder has a spec
(doc 2690, open PR #4044), a v1 build plan (PR #4046, merged 2026-10-21), Phase A
and Phase B shipped in ZAOOS (PRs #4047 and #4071), a first TCG drop page (PR #4070),
and a plan to move it all into the `bettercallzaal/zao-tcg` repo (PR #4077, merged
2026-10-21). Read 2690 for the builder. This doc covers only what the stream added.

Stream: B and Z Build, 2026-10-21, hosts Ohnahji B and BetterCallZaal, 1:41:24,
https://www.youtube.com/watch?v=uEIT4rvgsNo. Timestamps below are from the
mlx-whisper transcript of that video.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ASK ZAAL before any "generate" feature:** does "generate" mean rendering the artist's own upload into a frame, or AI-made art? Until he answers, the builder keeps 2690's rule 1 (no AI-made visuals). | The pitch says "pop their files in and like press generate a bunch of times or use certain styles use a canon jones style" [0:39:17]. Doc 2690 rule 1 says "No AI-made visuals. The builder has no generate, restyle..." and `src/lib/tcg/drop.ts` says "Card art is made by the artist, never generated (no AI-made visuals in ZAO public design)". Both readings fit the words. |
| 2 | **USE x402 for pay-per-render if a paid step is added, through the x402 Foundation SDK (`@x402/next`, v2.28.0).** Do not build a custom paywall. | x402 is Apache-2.0, has 0 fees built into the standard, and ships a Next.js middleware. The builder is Next.js. The repo moved from `coinbase/x402` to `x402-foundation/x402` (6,748 stars). Install from the foundation packages. |
| 3 | **Keep the builder free in v1. Put x402 on v2 at the earliest.** | 2690's v1 is a browser-only editor that "saves nothing on a server" (`src/app/cards/create/page.tsx`). A per-render payment needs a server route to verify and settle, which v1 does not have. |
| 4 | **"Open source so anyone can build on the builder" is already planned. No new work.** | 2690 and 2689 mention open source 12 and 15 times, and the builder is moving to its own repo (PR #4077). Check the zao-tcg LICENSE file before telling anyone it is open: the repo is private as of 2026-10-21. |
| 5 | **Physical giveaway to digital holders: a separate drop decision, not a builder feature.** The Kismet Casa precedent is UNVERIFIED. | Zaal [1:09:44]: "If you collected the digital, one of those people will get the physical painting." The Kismet Casa site (fetched) shows a Farcaster feed and no giveaway mechanic. |
| 6 | **On-chain stat inscription is topic 2 of this batch.** It is not in this doc. | Zaal joins the generator to inscribing stats [1:26:42]. Neither 2689 nor 2690 mentions inscription (0 hits each). |

## What the stream asked for, against what exists

| Stream ask (timestamp) | Already covered? | Where |
|---|---|---|
| Upload your own files into the builder [0:39:17] | YES | 2690 v1, `/cards/create` (Phase B, PR #4071) |
| "use certain styles, use a canon jones style" [0:39:23] | PARTLY | 2690 has frames and templates "designed by" an artist and owned by The ZAO. Read as a Cannon Jones frame, it is covered. Read as AI style transfer, it conflicts (decision 1) |
| "press generate a bunch of times" [0:39:17] | CONFLICT | 2690 rule 1, `drop.ts` header |
| Pay per generation, "a 402 or whatever it is" [0:39:28] | NO | 0 hits for x402 in 2689 and 2690. See decisions 2 and 3 |
| Open source, others build on the builder [0:39:28] | YES | 2689, 2690, PR #4077 |
| "that's gonna be our first bnz build" [0:39:44] | NEW | The first B&Z Builds artifact. Where it lands is open (Next Actions) |
| Physical giveaway to digital collectors [1:09:30] | NO | Decision 5 |
| Help Cannon Jones industrialize [1:10:04] | PARTLY | 2690 targets artists in general. Nothing names Cannon Jones (0 hits) |

The artist's name is "Cannon Jones" in `events/2355-wavewarz-battle-space-cannon-jones-vs-mose-aug8`. The transcript spells it "canon jones" because Whisper heard it that way.

## x402, measured 2026-10-21

| Fact | Value | Source |
|---|---|---|
| Canonical repo | `x402-foundation/x402`. `coinbase/x402` (172 stars) is now "a development fork" per its README | GitHub API + README |
| Stars / forks | 6,748 / 2,211, created 2025-02-21, last push 2026-10-15 | GitHub API |
| Licence | Apache License 2.0, read from the LICENSE file | `contents/LICENSE` |
| Next.js package | `@x402/next` 2.28.0, also `@x402/core` and `@x402/paywall` 2.28.0, all modified 2026-09-29 | `npm view` |
| Fees | "x402 as a standard has 0 fees built in" | docs.x402.org/introduction |
| Flow | server returns `402 Payment Required` with instructions, buyer submits a payment payload, server settles itself or through a facilitator's `/verify` and `/settle` | docs.x402.org/introduction |
| Volume claim | "75.41M Transactions" in the "Last 30 Days" (the site's own counter, not checked) | x402.org |

ZAOOS already names x402 in `src/app/api/juke/admin/agent-join/route.ts` ("no x402 toll for rooms whose..."). That is a comment, not an integration. The earlier x402 docs are about paywalls and agent payments: `business/352-paragraph-x402-agent-implementation` and `business/2234-leftclaw-x402-poidh-bounty-funding`.

## What this means for The ZAO

The card generator Zaal pitched on stream is mostly the builder that is already planned and half shipped. The only new questions are whether "generate" means AI, and whether rendering a card should cost money. Both are Zaal's calls, and both can wait until after v1.

## Also See

- [Doc 2529 - ZAO artist trading cards](../2529-zao-artist-trading-cards/)
- Doc 2690 - ZAO card builder spec (open PR #4044, branch `ws/research-2690-zao-card-builder-artist-ui`)
- Doc 2689 - WaveWarZ and ZAO digital cards (open PR #4042)
- [Doc 2355 - WaveWarZ battle space, Cannon Jones vs Mose](../../events/2355-wavewarz-battle-space-cannon-jones-vs-mose-aug8/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Answer: does "generate" on the card builder mean AI-made art, or rendering the artist's own upload into a frame? Done when the answer is a line in doc 2690's open questions | Zaal | Decision | 2026-10-28 |
| Decide whether the card generator is the first B&Z Builds artifact, and whether it ships in `zao-tcg` with a PR linked from B-ZBUILD2. Done when B-ZBUILD2's README links the build | Zaal | Decision | 2026-10-28 |
| If a paid render is approved: spike `@x402/next` on one server route in zao-tcg on Base Sepolia. Done when a PR shows a 402 response and a settled test payment | bandzbuilds lane | PR | 2026-11-11 |
| Physical giveaway: pick the mechanic (random draw among digital holders, or something else) for the first Cannon Jones physical. Done when it is written into the drop page copy | Zaal | Decision | 2026-11-04 |

## Sources

- B and Z Build, 2026-10-21, https://www.youtube.com/watch?v=uEIT4rvgsNo, local mlx-whisper transcript (`transcript.srt`), windows 0:38:30 to 0:41:30 and 1:09:30 to 1:11:00 read in full [FULL]
- https://docs.x402.org/introduction [FULL - method: exa web_fetch]
- https://x402.org [PARTIAL - the page renders as raw WordPress shortcodes; the headline text and the 30-day transactions counter were readable, nothing else was needed]
- https://github.com/x402-foundation/x402 [FULL - GitHub API repo record and LICENSE file]
- https://github.com/coinbase/x402 [FULL - README notice that the repo moved]
- https://www.npmjs.com/package/@x402/next [FULL - `npm view`, version and modified time]
- https://kismetcasa.xyz [FULL - curl and HTML strip; the page is a residency description plus a Farcaster feed and does not describe a physical giveaway, which is why decision 5 marks the precedent UNVERIFIED]
- ZAOOS `src/lib/tcg/drop.ts`, `src/app/cards/create/page.tsx`, `src/lib/cards/export-sizes.ts` at origin/main `c68c0880f` [FULL]
- Doc 2690 at branch `ws/research-2690-zao-card-builder-artist-ui` head `d4b6c23a` [FULL]
