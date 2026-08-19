---
topic: identity
type: audit
status: research-complete
last-validated: 2026-08-19
related-docs: 1263, 1270, 601, 980, 2286, 1256, 1237, 743, 942
original-query: "Whitepapers round-2 review: all 12, publish/hold verdicts (board card 368fc704)"
tier: STANDARD
---

# 2322 - ZAO Papers Round-2 Review: all 12 drafts, publish/hold recommendations

> **Goal:** Full round-2 review of the 12 draft whitepapers at thezao.xyz/papers/drafts
> (source: `ZAODEVZ/ZAOcowork` repo, `public/papers/drafts/`, 12 papers + history index),
> per board card 368fc704 and Zaal's 2026-08-17 grill verdict ("full round-2 review BEFORE
> any single fix; TOP ITEM: the Festivals paper Heart-of-Ellsworth framing").
> **These are RECOMMENDATIONS with evidence. Publish/hold VERDICTS are Zaal's.**

All drafts are stamped v0.1-v0.3, dated 2026-07-09 to 2026-07-17 - every paper is at
least a month stale as of this review (2026-08-19). Review method: Festivals reviewed
inline by the orchestrator; the other 11 + history fanned to three read-only subagents
with grounding preambles; every HOLD-grade finding was then spot-checked by the
orchestrator against the cited source (quotes below are from those direct checks,
not subagent memory).

## Verdict recommendation table

| Paper | Draft | Recommendation | One-line why |
|---|---|---|---|
| WaveWarZ | v0.3, 07-09 | PUBLISH-AS-IS | 98.5% claim traces to doc 1237 (Dune-verified); Base Sepolia testnet honestly disclosed |
| Zuke | v0.3, 07-09 | PUBLISH-AS-IS | Claims grounded; correct Farcaster/SIWF terminology; no stale facts found |
| COC Concertz | v0.3, 07-09 | PUBLISH-AFTER-FIXES | 7-show record matches doc 1256; needs COC #5-6 gap explained + COC #8 planning note |
| POIDH | v0.3, 07-09 | PUBLISH-AFTER-FIXES | Round 4 "closes July 31" now past; Round 5 status stale; 2.5%/5% fees UNVERIFIED |
| ZABAL Games | v0.3, 07-09 | PUBLISH-AFTER-FIXES | S1 state moved (board closed 8/16, finalists picked); SongJam + Magnetiq named as active partners - both retired |
| ZAO Newsletter | v0.3, 07-09 | PUBLISH-AFTER-FIXES | "190 consecutive daily issues" is the daily streak (true, now stale); must also state the 400+ total-edition corpus (doc 1270) so the two numbers stop reading as a contradiction |
| ZOUNZ | v0.1, 07-09 | PUBLISH-AFTER-FIXES | All 4 contract addresses verified FULL vs docs 1205/1257/1306; July 9 governance-launch date UNVERIFIED - source it |
| Zaalcaster | v0.1, 07-17 | PUBLISH-AFTER-FIXES | Two "Warpcast" usages violate the say-Farcaster style rule; integrations (Empire Builder, POIDH, Zora) verified |
| History index | v0.1, 07-09 | PUBLISH-AFTER-FIXES | 5-entry spot-check mostly FULL; ZAO-PALOOZA (12 artists) + ZAO-CHELLA (10 artists) counts UNVERIFIED; newsletter count stale |
| ZAO Festivals | v0.3, 07-09 | HOLD | Top-item framing decision open (Heart of Ellsworth); publishes budget figures against Zaal's 2026-07-12 no-budget-figures rule; ZAOville still future-tense |
| FISHBOWLZ | v0.1, 07-09 | HOLD | Presents a formally killed product as "graduated/live" - contradicts doc 601 verbatim |
| SongJam | v0.1, 07-09 | HOLD | Entire paper features a partnership paused 2026-07-02 with a standing do-not-feature instruction (doc 980) |
| ZABAL Token | v0.1, 07-10 | HOLD | Routes value through SongJam/SANG as an active integration (retired); traction numbers stale |

Tally: 2 publish-as-is, 7 publish-after-fixes, 4 hold.

## Cross-cutting findings (hit multiple papers)

1. **Retired-partner sweep needed: SongJam and Magnetiq.** Doc 980 (orchestrator-verified
   quote): "the SongJam partnership is **paused as of 2026-07-02** - do not feature
   SongJam/SANG as a current ZAO partner." Doc 2286 (ICM live-box drift audit) flags
   retired partners live in public surfaces. Papers affected: SongJam (whole paper),
   ZABAL Token (SANG routing section), ZABAL Games (instructor list + Magnetiq signup
   flow). The papers/drafts index page also lists SongJam as a draft card.
2. **Everything is time-stamped July.** All 13 files carry "as of July 2026" facts:
   POIDH round status, ZABAL S1 phase, ZAOville future tense, Instagram counts,
   newsletter day-count. Fix pattern: refresh the as-of stamps in one pass, not
   paper by paper.
3. **Numbers without as-of dates read as contradictions.** The 190-streak vs 400+-corpus
   collision is the example: both true, different series scopes, neither paper says so.

## The Festivals paper (top item) - detail

Reviewed inline. Draft v0.3, 2026-07-09, "deep-research corrections applied."

**Heart-of-Ellsworth framing (Zaal's top item).** The current draft mentions Heart of
Ellsworth exactly once, inside a partner list: "Announced partners include Heart of
Ellsworth (venue and Maine Craft Weekend promotion)..." Ground truth gathered from the
vault (onenote/local-impact/promotion.md mining, 2026-08-19): Heart of Ellsworth is the
local nonprofit venue partner with a named promo committee (Colleen Ross, Peter Lione,
Joy Cartwright, Cara Romano, Rebecca Collins, Robin Goff, Clarisa Diaz), parklet
planning involvement (Healthy Acadia + Trust for Public Funds), and their own planning
docs carry a "Summer 2026 Concert Series - free live shows in the parklet" line. The
current ZAOstock ICM draft box frames the event as "part of the 9th Annual Art of
Ellsworth during Maine Craft Weekend" with "Venue partner: Heart of Ellsworth."
The paper predates all of that framing. **What "Heart-of-Ellsworth framing" should
become in the paper is Zaal's call** - options queued in the grill below.

**Findings:**

| # | Finding | Evidence | Grade |
|---|---|---|---|
| 1 | Publishes budget figures ("budget in the low five figures (estimates range $5-25k)", repeated in References) | Zaal's rule 2026-07-12: NO budget figures on public surfaces (zaostock ICM draft box source note); doc 1013 retracted its $20K figure the same day; real state was ~$5K target / ~$1.5K on hand | Must strip before publish |
| 2 | ZAOville written future-tense ("confirmed for July", "Execute ZAOville (July)") | July is past; no post-event recap doc found in research/events/ scan - outcome UNVERIFIED, needs team input | Must update |
| 3 | Venue never named | Franklin Street Parklet is the confirmed venue (memory + zaostock.com); paper says only "Ellsworth, Maine" | Should add |
| 4 | "Art of Ellsworth" tie mentioned but not the official status | Current framing: part of the 9th Annual Art of Ellsworth, statewide promotion | Should upgrade |
| 5 | Admission model ambiguous ("if ticket-gated") | Current: free to attend, optional pro ticket | Should fix |
| 6 | Attendance goal "250 total attendees (per Zaal, 2026-07-09)" | Current press framing says 200-300 - consistent, keep the as-of date | OK, refresh stamp |

## Per-paper detail (subagent findings, spot-checked where load-bearing)

### FISHBOWLZ - HOLD (orchestrator-confirmed)
Paper claims FISHBOWLZ "graduated out of ZAOOS into its own standalone repository...
in June 2026," went "live at fishbowlz.com," and explicitly says "This was not a
pause... it was a promotion." Doc 601 (verbatim, orchestrator-read): "FISHBOWLZ
(paused 2026-04-16, formal kill)" / "Formally dead." The paper was drafted 66 days
after the kill decision and argues against the decision record. fishbowlz.com
returned HTTP 307 (redirect) on 2026-08-19 - the domain responds, but a responding
domain does not un-kill the product decision. Either the kill stands (rewrite the
paper as an honest post-mortem / archive piece) or the kill was reversed somewhere
undocumented (then doc 601's canon needs updating first). Zaal decides which.

### SongJam - HOLD (orchestrator-confirmed)
Paper presents the SongJam Spaces integration as live and core ("The /spaces route
is live and embedded as a core navigation item"). Doc 980's standing instruction
(verbatim above) says do not feature it. Options for Zaal: (a) hold until the
partnership question resolves; (b) reframe brand-neutral as "Audio Spaces for The
ZAO" with SongJam as historical integration note.

### ZABAL Token - HOLD
SANG/SongJam routing section presents a paused partnership as an active value path
(subagent finding, consistent with doc 980's instruction). Traction stats ("as of
July 10": 360 holders, $552 liquidity, 26 transfers) need an as-of refresh. Gap:
paper admits minimal adoption but names no go-forward plan.

### ZABAL Games - PUBLISH-AFTER-FIXES
Stale: "July open build phase is active," "August Finals (proposed)." Reality
(memory, 2026-08-18): finalist board closed Aug 16, 15 narrowed to 6 finalists
(2/track), 3 winners, finals last week of August, Zaal picks (no vote). Retired:
SongJam in the instructor list, Magnetiq as the live signup flow (doc 2286 flags
Magnetiq retired; verify what the /enter flow actually runs today before rewording).

### COC Concertz - PUBLISH-AFTER-FIXES
7-show record verified against doc 1256. Fixes: explain or remove the "COC #5-6:
TBD" table rows; add COC #7-was-the-open-access-pilot + COC #8 planning note
(docs 1295/1300/1317); source the "livestream-first" decision (who locked, when,
which doc).

### POIDH - PUBLISH-AFTER-FIXES
Correctly frames POIDH as kenny + Rhovian's third-party protocol. Fixes: Round 4
("closes Friday July 31, 2026") needs closure + outcome; Round 5 "drafting" needs
current status; the 2.5% completion fee / 5% resale royalty figures are cited to
poidh's own docs but were not fetched this run - verify or mark UNVERIFIED in the
paper's sources.

### ZAO Newsletter - PUBLISH-AFTER-FIXES (downgraded from a subagent HOLD)
The subagent graded HOLD on "190 contradicts 400+." Orchestrator re-read both
sources: the paper's claim is "Day 190 of the Year of the ZABAL (190 consecutive
daily issues, Jan 1 - Jul 9)" - the daily-streak count, internally consistent.
Doc 1270's "400+ editions" is the total corpus across three series. Both true;
the paper never states the corpus number, and the drafts index blurb ("190-issue
streak") is now ~40 days stale. Fixes: state both numbers with scopes and as-of
dates; refresh the streak count at publish time; clarify the confusing "posts
observed through at least Day 329" line in the verification note.

### ZOUNZ - PUBLISH-AFTER-FIXES
All four contract addresses (token, auction, governor, treasury) verified FULL
against docs 1205/1257/1306 by the subagent. The "governance launched live on
July 9, 2026" date is UNVERIFIED in research/ - add a source or soften.

### Zaalcaster - PUBLISH-AFTER-FIXES
Two "Warpcast" usages (mini-app embed sections) violate the global say-Farcaster
rule. Integrations verified. Newest draft of the set (07-17).

### Zuke - PUBLISH-AS-IS
Grounded, correct terminology, no stale facts found. Credits Juke (nickysap) and
juke-space-recap (99darwin) per the attribution ethos.

### WaveWarZ - PUBLISH-AS-IS
98.5% ecosystem claim traces to doc 1237 (Dune-verified). Base Sepolia testnet
status disclosed honestly, including "infrastructure exists; the principal does
not" on the Base build gap. Traction figures carry the July snapshot framing -
optionally refresh the stamp at publish.

### History index - PUBLISH-AFTER-FIXES
Spot-check of 5 dated entries: Fractal 100+ weeks FULL (docs 1261/1306), WaveWarZ
whitepaper timing FULL, ZAO-CHELLA date FULL (doc 1077). UNVERIFIED: ZAO-PALOOZA
"12 artists," ZAO-CHELLA "10 artists" (counts appear in the Festivals paper's
ref 4 = doc 919 - check there before publish). Newsletter entry inherits the
streak/corpus fix.

## What was NOT verified this run (honest scope)

- poidh.xyz fee figures (2.5%/5%) - not fetched.
- ZAOville July outcome - no post-event recap found in research/events/; needs a
  team answer, not a guess.
- ZOUNZ July 9 governance-launch date - not found in research/.
- ZAO-PALOOZA/ZAO-CHELLA artist counts - doc 919 not opened this run.
- Whether the ZABAL Games /enter signup flow still runs through Magnetiq today.

## Grill questions for Zaal (the verdicts + the framing)

1. **Per-paper verdicts** - the table above is the tap sheet: 2 publish-as-is,
   7 publish-after-fixes, 4 hold.
2. **Festivals framing** - elevate Heart of Ellsworth to: (a) co-headline partner
   throughout (local-first framing, 9th Annual Art of Ellsworth + Maine Craft
   Weekend up top), (b) a dedicated partnership section, or (c) leave as a partner
   list line? (Your 8/17 top item - the draft predates the current local framing.)
3. **FISHBOWLZ** - post-mortem rewrite, or does doc 601's kill get reversed?
4. **SongJam paper** - hold, or brand-neutral "Audio Spaces" reframe?
5. **Permaweb three (card 45962159)** - doc 1263 says WaveWarZ + COC Concertz +
   ZABAL Games (the zao-papers repo PRs #5/#6/#7, all still open). Confirm that is
   still the set - "Whitepaper v1.0" language on the card could also read as the
   Fractal whitepaper. Nothing uploads until re-read card b1281a6a clears.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Tap the verdict sheet (13 rows) + the 4 grill questions | @Zaal | Decision | Next grill |
| After verdicts: one fix-pass PR to ZAODEVZ/ZAOcowork per verdict batch | @Claude (whitepaper lane) | Build | After taps |
| Retired-partner sweep (SongJam/Magnetiq) across drafts index + affected papers | @Claude | Build | With fix pass |
| Answer ZAOville outcome + COC #5-6 gap | @Zaal / team | Input | With fix pass |
| Re-check poidh fees, doc 919 artist counts, ZOUNZ launch date before any publish | @Claude | Verification | Before publish |

## Sources

- Drafts reviewed from the local ZAOcowork clone (`~/Documents/ZAOcowork/public/papers/drafts/`,
  remote ZAODEVZ/ZAOcowork, HEAD 23efecd 2026-08-17); live index fetched from
  thezao.xyz/papers/drafts (curl, 2026-08-19) - 12 paper cards + history confirmed.
- Orchestrator-verified (direct reads this run): doc 601 (FISHBOWLZ kill), doc 980
  (SongJam pause + do-not-feature), doc 1270 (400+ editions), the newsletter paper's
  190-streak lines, fishbowlz.com HTTP 307, doc 942/718 (Fractal whitepaper canon),
  doc 1263 (papers roadmap + permaweb three), board cards 368fc704 / 45962159 /
  b1281a6a (Supabase cowork tracker).
- Subagent findings (three read-only reviewers, grounding preambles, tool_uses
  11-15 each): per-paper detail above; every HOLD-grade subagent claim was
  independently re-read by the orchestrator before being kept; the one subagent
  HOLD not confirmed by evidence (newsletter) was downgraded.
- Review scope honesty: the five UNVERIFIED items are listed above; none are
  load-bearing for the hold/publish split.
