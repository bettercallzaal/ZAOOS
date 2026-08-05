---
topic: business
type: guide
status: research-complete
last-validated: 2026-08-05
related-docs: 759, 415, 625, 626, 631, 468, 533, 768, 994, 1092, 1120, 1139, 1222, 1229, 1534, 2161, 2202
original-query: "Go over all the ZAO and Poidh collab from start to finish, make sure we have all of the lore from the collaboration together."
tier: DEEP
---

# 2203 — POIDH x ZAO: full lore, founding to today

> **Goal:** One chronological, start-to-finish narrative of the BCZ/ZAO x POIDH
> relationship - from Kenny founding POIDH in 2023 through today's (2026-08-05)
> open R4 closeout and R5/R6 decision - so the full history lives in one place
> instead of scattered across 20+ docs. Doc 2202 covers current-state +
> brand-alignment; this doc is the origin-to-now narrative it links back to.

## Key Decisions

| # | Recommendation | Why |
|---|---|---|
| 1 | This doc supersedes nothing - it's a narrative index over 2202 (current state) plus the mechanics/event-stack/tooling docs, told as one story. | Doc 2202 already made the "don't re-derive" call for current-state facts; this doc's job is different - stitch the timeline so nobody has to re-read 20 docs to answer "how did we get here." |
| 2 | Two open contradictions need Zaal's word, not more research: Kenny's original co-founder "J" is unidentified, and POIDH's exact v1 launch date is an estimate (Sept-Oct 2023, back-derived from a Nov 3 2023 post). | Neither blocks anything operational - flagged so nobody cites them as harder facts than they are. |
| 3 | The founding thread that matters most for brand-alignment: Kenny's own words are "internet's coordination protocol," not a company, and he's said explicitly he doesn't want poidh.xyz to be the only front end. | This is the load-bearing fact under doc 2202's whole thesis (ZAO becomes POIDH's tooling layer) - it's not ZAO's ambition alone, Kenny asked for it. |

## Part 1 - POIDH before ZAO (2023-2024)

Kenny Spotz (Farcaster `@kenny`, FID 6; X `@kennyistyping`, formerly `@kaspotz`;
based in Seattle) built POIDH out of a specific frustration with the industry he'd
already spent a decade in. Bitcoin Magazine staff writer in 2014, digital
marketer for crypto clients through the ICO and DeFi-summer years, he watched
FTX collapse in November 2022 and drew a conclusion: "We're never going to have
good adoption if all our use cases are speculative gambling use cases." He
wanted "use cases I can show family that aren't gambling."

POIDH's actual start predates its own origin essay. By 2023-11-03, Kenny was
already posting "poidh needs design help" on Paragraph, and referenced "nearing
50 completed bounties" - meaning a v1 contract (Arbitrum,
`0xdffe8a4a4103f968ffd61fd082d08c41dcf9b940`) was live with a working co-founder,
known only as "J," some weeks before that post. **The exact launch date is an
estimate (Sept-Oct 2023); "J"'s identity was never publicly disclosed and isn't
resolved by any source in the research corpus** - both flagged as open, not
guessed at further here.

The founding essay - "[about pics or it didn't happen](https://words.poidh.xyz/about-pics-or-it-didnt-happen)," 2023-11-07, same day Kenny's Farcaster FID 6
was created - lays out three pillars that still hold in 2026: **generalist**
(any real-world task, not one vertical), **collectible NFTs** (every accepted
claim mints proof), **casual UX** ("create a bounty by filling out three form
fields"). J stepped back before the v2 rebuild; GitHub user Rhovian initialized
the Next.js v2 codebase 2024-02-04, and POIDH's official launch date -
per Gitcoin Grants, first Degen Chain deployment - is **2024-04-24**. Multichain
(Base + Arbitrum added) followed via the Onchain Summer Buildathon,
2024-06-27.

By the time ZAO shows up in this story, POIDH already had its team (Kenny +
Rhovian, publicly credited 2024-08-31), its mechanics locked (2.5% protocol fee,
5% suggested NFT resale royalty, 48-hour open-bounty vote window,
`0.001 ETH` / `1000 DEGEN` minimum bounty, EOA-only creation - smart contract
wallets revert), and real cultural moments already behind it: Jesse Pollak
topping up a $5 open bounty with 0.25 ETH (establishing the open-bounty viral
loop), and the Haberdashery-funded $30K kickflip bounty (Sept 2025, Guinness
World Record, 100K+ views). Lifetime numbers as of 2026-05-26: 3,474 users,
2,863 bounties created, 1,565 completed (55%), ~$65,000 distributed, across
Base, Arbitrum, and Degen.

The connector into ZAO's orbit was **Maceo Whatley** (`@wethemniggas.eth`,
We Them Media founder) - his "Let's Talk About Eth" podcast brought Kenny into
the Farcaster ecosystem's orbit that Zaal was also building in. BCZ's early
POIDH bounties live under the `/wethemmedia` album to this day.

## Part 2 - R1 & R2: ZAO's first bounties (Apr-May 2026)

**R1 (bounty 1151, cast 2026-04-27)** was a clip-up off BCZ YapZ Episode 17 with
Hannah from Farm Drop - find your favorite 30-90s clip, post it, reflect on it.
0.0105 ETH, OPEN type. 11 claims, 10 unique editors (10 first-time POIDH
submitters recruited via a ZAO episode - the whole point). Winner:
@cryptfi-mariano. It also surfaced the first real lessons: no upper time limit
and a vague creative brief made judging slow (6+ weeks to close) and inconsistent.

**R2 (bounty 1166, cast May 2026)** tightened the format directly off that
lesson - a 45-60s edited ad cut from BCZ YapZ Episode 19, which happened to be
**the episode with Kenny himself**. 0.0105 ETH, 8 claims, 7 unique editors.
This round is where the operational bar that all later rounds inherit got built:
an `ffprobe` duration check making the 45-60s window a binary pass/fail (3 of 8
submissions blew the cap - one by 50%), a public per-submission scorecard page
shipped within 48 hours of close, and a BAR + RUBRIC structure (floor rules,
then four weighted rubric categories) replacing "judge picks a favorite."
Winner: @joeyofdeus (Monksage). It also caught two mistakes that shaped every
round after: submissions burying Kenny's actual voice under random library
music, and a handle typo (@kennyiscoding instead of @kennyistyping) - both
became locked rules in R3.

Kenny himself was in the loop from the start, reviewing R1's bounty copy before
it went live and catching substantive issues in under 30 minutes - flagging
things like "give people the exact time instead of forcing them to do the math"
and warning against implying submitters needed to post to every platform. The
house style ("poidh," always lowercase) was his call, confirmed directly.

## Part 3 - R3 & R4: the ZABAL Gamez campaign (May-Jul 2026)

**R3 (bounty 1180, cast 2026-05-31)** was the first bounty built around the
ZABAL Gamez campaign itself rather than a single podcast episode - "best ad for
zabalgamez.com," any format (not just video). This is where the toolkit that's
still in use today first shipped as a package: a public CC-BY brand kit at a
known URL (logo, palette, type spec, B-roll, a pre-cleared binaural promo track,
social templates), a hard audio rule locked into every bounty description since
("no random background music competing with spoken dialog - source audio, one
clear instrumental, or a binaural beat only"), and the score-by-count mechanic
that ties every BCZ POIDH round into one running leaderboard (submit to R1 only
= score 1, R1+R2 = score 2, and so on, feeding Empire Builder slot 8 directly).
8 claims; winner @femmie, claim 6749, "ZABALGAMEZ.COM AD." **On-chain payout is
confirmed** - the claim's NFT sits in the BCZ Treasury issuer wallet, which per
the PoidhV2 contract only happens as part of an accept+payout transaction, not
before. The winner cast with reasoning was still pending as of doc 2202
(2026-08-05) - worth checking whether Zaal has since sent it.

**R4 (bounty 1249, cast 2026-06-15)** was the ambitious swing: instead of a
single winner, an OPEN-SPLIT pot meant to reward everyone who shipped something
real during ZABAL Gamez's July open-build month, split equally. It's also where
the collaboration hit its first real structural gap. POIDH's claim model is
built for one winner (or open-bounty voting toward one winner) - it has no
native "split evenly among N qualifiers" primitive. So while 16 unique builders
actually shipped and submitted on zabalgamez's own community board, only 2
POIDH claims exist on bounty 1249, both from the same wallet, because there was
never a tight loop from "you built it" to "you filed an individual POIDH
claim." The closeout (in progress as of this doc, PR #35 in zpoidh) works
around this by having Zaal file one claim documenting everyone who qualified
and routing payout through a non-issuer distributor wallet - a real, if
manual, fix for a gap in POIDH's own claim primitive. This is the concrete
evidence behind doc 2202's framing that ZAO already had to build tooling POIDH
itself doesn't have.

## Part 4 - Unlock Protocol enters the picture (Jun-Jul 2026)

**2026-06-30**, Ceci Sakura ran a live ZABAL Gamez workshop
(`zabalgamez.com/recordings/32`) and deployed a real certification lock on Base
during the session - Unlock Protocol's pitch is no-code onchain memberships,
subscriptions, tickets, and certifications as NFT "keys," with a soulbound
(non-transferable) option that's a natural proof-of-attendance /
proof-of-completion primitive - the same underlying idea as POIDH's own
per-claim NFT, aimed at a different use case. Unlock's keys can also be
airdropped to a plain email address, which is a lower onboarding bar than
POIDH bounties currently have (a claimant needs a wallet already to submit).

**2026-07-08**, the ZABAL Gamez x POIDH fireside (X Space, cross-posted to
Farcaster) put Zaal, Kenny, Thy Revolution (COC Concertz), and Mauro (Zao
Poker) in the same room. Zaal minted a free 9-key ERC-1155 Unlock collectible
live, on the spot, as proof-of-attendance for the call itself - the loop
closing in real time. This is the call where Kenny's clearest positioning
statement on record landed: "I've changed my handle a little bit to like the
internet's coordination protocol. And I don't want poidh.xyz to be the only
front end for this." He also explained POIDH's deliberate absence of a hard
deadline field as philosophy, not a missing feature: "I prefer social
standards more than hard laws whenever possible" - a claim independently
confirmed the same week by a platform-wide scan of 100 live POIDH bounties,
which found **zero** with the on-chain `deadline` field populated, even though
several (including ZAO's own bounty 1249) state a deadline in free text.

Out of that call came five concrete follow-ups, two of which became R5 and R6:
build a POIDH x ZABAL Gamez workshop-page integration; test turning a recording
directly into a POIDH bounty (using the fireside recording itself as the first
test case); build a deadline calendar since POIDH itself doesn't track one;
revive the Unlock-co-funded clipping bounty idea; and put a POIDH bounty on the
first Zao Poker tournament winner. Kenny also committed, on the call, to
boosting up to two more Farcaster-culture bounties at $25 each.

**R5** is the version of the Unlock clipping bounty pitched as an Unlock-DAO
co-funded initiative - drafted, but the pitch DM to Unlock's trigs/Kenny was
never sent. **R6** is the same idea, solo-cast by Zaal with no external
dependency: clip the Ceci Sakura workshop recording, auto-versioning (v1, v2,
v3...) derived live from POIDH's own bounty feed rather than hand-tracked, and
built specifically to avoid the R3 hardcoded-weekday bug by computing the
deadline fresh from the actual cast date every time. R6 is the recommended
path (doc 2202 Key Decision #3) precisely because it doesn't wait on anyone.

**R7**, drafted but not cast, is the first CODE bounty - bug fixes for
zabalgamez.com, judged on impact and craft rather than winner-take-all, with a
14-day window instead of clip-bounty's 7. It's also deliberately scoped as
ZOL's (the ZAO's Farcaster agent) first controlled-money-action trust-ladder
rung: a human-funded, human-judged bounty ZOL can help scope and judge without
ever holding funds itself.

An event-stack spec (doc 1229, locked 2026-07-17) generalizes the Unlock +
POIDH pattern into a repeatable three-phase playbook for any ZAO live event -
Unlock ticket at T-14 days plus a pre-hype POIDH bounty, day-of check-in plus a
live capture bounty, and a T+48h recap bounty - costed at roughly 0.095 ETH
(~$255 all-in) per event, scoped against ZAOville (Jul 25), COC Concertz
(monthly), and ZAOstock (Oct 3).

## Part 5 - The data and distribution layer (May 2026-present)

Two infrastructure threads run underneath every round above.

**Empire Builder / $ZABAL** (doc 626, wired 2026-05-09): every POIDH submitter
across ZAO's rounds lands on slot 8 of the $ZABAL Empire leaderboard
("POIDH Submitters"), scored by how many rounds they've compounded across.
The integration direction is Empire Builder *pulling* from a BCZ-hosted JSON
feed (`bettercallzaal.com/poidh-leaderboard.json`), not BCZ pushing to Empire
Builder - which is exactly the shape of bug that surfaced this session: Empire
Builder's dashboard config still points at a stale snapshot frozen at R2 while
zpoidh's own data has been correct through R4 for weeks. It's a one-time config
setting on Empire Builder's side that drifted, not a data problem - the fix is
a dashboard change, flagged as a Next Action in doc 2202 (target 2026-08-08).
Two booster toggles (Token, Reputation) on that same leaderboard slot were also
found switched off as of doc 631's audit - a five-minute dashboard flip still
outstanding.

**The zpoidh repo itself** became the ops home and, gradually, a genuine
tooling layer: `docs/create-bounty.html` (a standalone bounty-creation tool
that works with any EIP-6963 browser wallet, not gated to the Farcaster Mini
App the way poidh.xyz's own UI is), a leaderboard refresh script, a deadline
scanner, and a bounty-calendar builder - none of which POIDH's own platform
provides natively. A previously undocumented endpoint,
`poidh.xyz/base/bounty/<id>/data`, was found this session (via Kenny directly)
that returns a bounty's full data plus every claim with Farcaster/X handles
already resolved - a meaningfully better data source than the
tRPC-scrape-plus-web3.bio pattern the refresh script has used since R1;
migrating to it is still an open Next Action.

Separately and not yet folded into ZAO's own loop: an independent developer,
0x94t3z, shipped `poidh-sentinel` (2026-05-03) - a fully autonomous POIDH bounty
bot (create, monitor, evaluate via OCR + vision AI, pay out, announce) built
for POIDH's own SKILL challenge. Doc 631 flags reaching out to partner or fork
this as the highest-leverage unclaimed move in the whole stack - not yet acted
on.

## Part 6 - Where the brand identity layer stands (2026-07-30)

A ZAO-wide ICM box audit (doc 2161) found POIDH's own AI-readable context box
sitting as an unpublished draft - since closed out this session (the
`poidh.llm.txt` content drafted and, pending your OK, ready to push live). The
same audit's biggest flag has nothing to do with POIDH directly: ZAOstock, the
flagship festival (Oct 3, 2026), has no ICM box at all yet - worth keeping in
mind since the event-stack spec above (Part 4) already plans a POIDH bounty
stack around that exact date.

## Part 7 - Today (2026-08-05)

R1-R3 closed and paid. R4's deadline passed five days before this doc was
written; closeout is in progress (zpoidh PR #35), with the distributor wallet,
final Tier-2 builder calls, and wallet-address resolution still open decisions
for Zaal. R5 remains an unsent pitch; R6 is built, tested against the R3 bug
class, and ready to cast the moment Zaal decides to run it instead of waiting
on Unlock DAO co-funding. R7 is scoped but undrafted as a live bounty. The
Empire Builder config fix and the `/data` endpoint migration are both real,
small, and unblocked. Kenny's own framing - a protocol meant to be forked and
run by others, not a company with one front end - is the fact this entire
history keeps landing back on, and it's the fact doc 2202's brand-alignment
pitch is built on top of.

## Also See

- [Doc 2202](../2202-poidh-zao-collab-current-state-brand-alignment/) - current-state synthesis + the brand-alignment Key Decisions this lore doc grounds
- [Doc 759](../759-poidh-history-origin-to-2026/) - POIDH's own founder-framework history in full depth (this doc's Part 1 is a condensed retelling)
- [Doc 1229](../1229-unlock-poidh-zao-event-stack/) - the full event-stack spec referenced in Part 4
- [Doc 626](../626-poidh-empire-builder-zabal-integration/) - full Empire Builder wiring detail behind Part 5
- [Doc 631](../631-poidh-sentinel-convergence-strategy/) - the poidh-sentinel fork/partner opportunity, still unclaimed
- [Doc 994](../994-zabal-gamez-poidh-fireside-unlock-jul8/) - full fireside transcript, source for every direct Kenny quote above
- [Doc 2161](../2161-zao-brand-audit/) - ICM box gap audit referenced in Part 6
- zpoidh repo (`github.com/bettercallzaal/zpoidh`) - every round folder, script, and brand kit referenced above

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm whether R3's winner cast (femmie, claim 6749) was ever sent - payout is confirmed on-chain, cast reasoning was still pending as of 2026-08-05 | Zaal | Check + cast | 2026-08-08 |
| DM 0x94t3z re: partnering on / forking poidh-sentinel for ZAO bounty automation (doc 631's highest-leverage unclaimed move) | Zaal | Outreach | 2026-08-15 |
| Resolve the two flagged lore gaps if easy to settle - Kenny's original co-founder "J," and POIDH's exact v1 launch date/block - otherwise leave as documented estimates | Zaal | Fact-check (optional) | wontfix if not easy |

## Sources

All sources are the pre-existing research docs and repo files cited inline and
in Also See above; this doc synthesizes them and adds no new primary research.
Quotes are drawn verbatim from doc 994's fireside transcript and doc 759's
sourced timeline; see those docs for original citations and URLs.
