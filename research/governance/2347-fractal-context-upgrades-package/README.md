---
topic: governance
type: design-proposal
status: awaiting-zaal
created: 2026-08-20
board-task: 156bc028
related-docs: 696, 703, 975, 977, 1068, 1307, 1770, 1772, 2301
original-query: "we need to organize the whole fractal situation and add lots of context and upgrades to zao fractal asap"
tier: STANDARD
---

# 2347 - Organize ZAO Fractal: context + upgrades package

> **Purpose:** One proposal doc that puts the whole fractal situation in front
> of Zaal - the verified current state on one page, then the three requested
> upgrades (multi-respect leaderboards, the 4-week break test, camera-on
> awards) plus the point-mechanics cleanup, each as options with a
> recommendation and a decision box. Zaal decides; nothing here ships
> without a tap. Board card 156bc028 (asap-flagged 2026-08-16).

---

## Part 1 - Context: the fractal in one page (all verified)

**The ritual.** Weekly Respect Game, Mondays 6pm ET, 110 meetings settled
onchain as of 2026-08-18 (period 109; meeting = period + 1 per doc 2301).
Circles of up to 6, randomized, 4-minute presentations, consensus ranking,
results settle through OREC on Optimism. Canon lineage: doc 1772
(consolidates 696 et al). ZAO is the only active fractal on Optimism and the
only music-focused one anywhere.

**The numbers (doc 975 / 2301 / live reads).**
- Scoring: ranked 110/68/42/26/16/10 (2x fibonacci), even split 40, camera-on +10.
- Two ledgers: OG ERC-20 (frozen, 38,484 supply, the vote weight) and ZOR
  ERC-1155 (active; 288 live awards, 16,418 Respect across meetings 68-110).
- OREC: 72h vote + 72h veto, minWeight 1,000 Respect (~2.6% of OG), self-owned.
- Concentration: OG Gini ~0.73 cumulative (top 10 = 53%) - honest, published.
- The vote-weight gap: ZOR holders have no onchain vote yet. The named open
  problem (whitepaper ch09).

**The infrastructure.**
- Live bot: bettercallzaal/zao-fractal-bot (TS). Passive awareness (voice,
  camera, roster, governance reads) merged; 3 PRs open as of 2026-08-20:
  #10 verify-awards (onchain double-award guard), #11 async contributions,
  #12 welcome/onboarding. Migrations 0002-0004 still NOT applied to prod.
- Weekly record: doc 2301's `weeks/week-NNN.json` convention, ZOR era
  enumerated; OG era (weeks 1-67) still open.
- Docs: ZAOfractal whitepaper accuracy-passed + deployed; research-library
  corrections applied (doc 977, PR ws/research-977-apply-fractal-doc-fixes).
- Known bottlenecks (doc 703): narrow OREC signer set; non-technical
  onboarding docs (PR #12 + the explainer video script address this).

**Open ledger items (operational, Zaal-gated).**
- Splits owed from the OneNote sweep: even split meeting 104 group 2;
  103 group 1 (from Iman); 106 split Ohnahji/Fellenz/Jose/Zaal/hurricane/
  Zach (no video). Verify with `npm run verify-awards -- --wallet ...`
  before batching (the 8/18 five-award list was verified ALREADY minted
  2026-04-13 - nothing owed there).
- Civil/Leo new address is fixed in the bot registry; confirm respect_members
  on the frapps side carries 0x368C8A0AF7CBb2e9a7Bc0a0925Efb2AC00210bc1.

---

## Part 2 - Upgrade proposals

### A. Multi-respect leaderboards (code / music / support respect types)

The ask: see WHO is contributing WHAT - a builder leaderboard, a music
leaderboard, a support/onboarding leaderboard - not one undifferentiated
Respect number.

| Option | What it is | Cost / risk |
|---|---|---|
| A1. Off-chain category layer | Tag each award with a category at record time (doc 2301's week-NNN.json gets a `category` field; the circle names it during ranking, the bot's listContributions digest suggests it). Leaderboards = ZAOOS dashboard slices. Chain untouched. | Days of work. Zero contract risk. Categories revisable. |
| A2. On-chain categories in the next token | The in-house ZAORespect (zaofractal-contracts repo, pre-launch, unaudited) adds a category dimension to the id encoding (spare bits exist next to mintType). | Only meaningful if/when that contract launches. Locks a taxonomy into token ids. |
| A3. Hats-based roles as the category | Members wear code/music/support hats (doc 1307's tree); leaderboard = Respect x hat worn. | Reuses live Hats tree; but hats mark roles, not per-award contribution type. |

**Recommendation: A1 now, design A2 into the ZAORespect launch spec, skip A3
for this purpose.** Categories need observed data before they deserve token
mechanics - two months of tagged weeks will show whether code/music/support
is even the right split.

**DECISION A:** [ ] A1 now [ ] A1+A2 spec [ ] A3 [ ] park

### B. The 4-week break test (averaged points)

The ask: a member can take a declared break without their standing bleeding;
during it they receive averaged points.

Proposed rules (all tunable):
1. Break is declared BEFORE it starts (message to the fractal channel or the
   bot); max 4 consecutive weeks, once per year per member.
2. Weekly award during break = average of the member's last 4 PLAYED
   meetings, rounded down to the nearest canonical denomination (110/68/42/
   26/16/10/40), capped at 42 so a break never outearns a mid-rank week.
3. Minted through the normal respectAccountBatch flow, tagged to the real
   meeting number - flagged in the week record as `break_award: true` so the
   record never confuses it with a ranked result.
4. Trial: 8 weeks or 2 uses, whichever first; then measure - did the member
   return? did anyone schedule breaks around high-output weeks?

Honesty flag: a break award mints Respect without that week's peer ranking.
That is a real precedent change - the whitepaper's claim is "every token
traces to peer recognition." The trace here is indirect (past rankings).
Worth stating in ch09 if adopted.

**DECISION B:** [ ] run the trial as specced [ ] change the cap/length [ ] reject

### C. Camera-on awards, automated

The +10 camera-on award is canon (doc 1770) but hand-tracked. The bot
already captures camera state passively (voice awareness, merged). Missing
pieces, in order:
1. Apply migrations 0002-0004 to ZAOOS prod (Zaal runs or grants access).
2. A weekly aggregation action: voice-presence rows -> per-member camera-on
   sessions -> draft +10 lines appended to the week's batch.
3. Zaal reviews the draft and submits - the mint stays human-gated
   (doc 703's signer-set bottleneck is unchanged by this).

**Recommendation: yes** - it converts an existing manual chore into a
reviewed draft, changes no rules.

**DECISION C:** [ ] yes, wire it [ ] later

### D. Point-mechanics cleanup (year-3 feedback)

- **sqrt-distribution idea: recommend REJECT.** Zaal already flagged it as
  probably bad; concretely, a sqrt over the curve compresses the top ranks
  (110 vs 68 becomes ~10.5 vs ~8.2), flattening exactly the gradient that
  makes ranking meaningful. The fibonacci curve IS the mechanism (doc 1772).
- **Fellenz weekly-points ask:** fold into async contributions (bot PR #11) -
  log the week's work, circle ranks it; no standing weekly stipend, which
  would be a second break-test-shaped precedent without the trial framing.
- **Jose points-org help:** give it a real seat, not ad-hoc - a points-ops
  hat on the Hats tree (doc 1307) covering batch prep + week-record upkeep
  (doc 2301 backfill). Zaal keeps submission.

**DECISION D:** sqrt [ ] reject [ ] park | Fellenz [ ] via PR #11 [ ] other |
Jose hat [ ] yes [ ] no

---

## Part 3 - Already in flight (context, not decisions)

| Thread | State |
|---|---|
| Bot PRs #10/#11/#12 (verify-awards, async contributions, welcome) | Open, awaiting merge |
| Prod migrations 0002-0004 | NOT applied - blocks C and the awareness data |
| Explainer video | Script ready: ~/zao-vault/projects/fractal-explainer-video.md - Zaal records |
| Whitepaper | Accuracy-passed + deployed; brainstorm taps held for Zaal (whitepaper lane) |
| Week record backfill | ZOR era done (doc 2301); OG era + camera/attendance open |
| Doc corrections | Doc 977 catalogue fully applied (research PR + whitepaper repo) |

## 2026-08-22 Review Notes

- **Status: awaiting-zaal.** Board task 156bc028. The three open threads (bot PRs, prod migrations, whitepaper backfill) all require @Zaal tap or external dependencies. No change from this machine.
- **Prod migrations 0002-0004 are still blocked** — mentioned as blocking awareness data. If ZOE's research pipeline is down (auth expiry, doc 2377), the pipeline for fractal-related processing is also affected.
- **Week record backfill:** OG era + camera/attendance remains open. Doc 2301 (ZOR era) is done. If the OG era backfill connects to the security-rotation or fractal-explainer timeline, that context is in security-rotation.md (blocked on this machine per session 11).

## Sources

- [FULL] Doc 2301 (ZOR enumeration, meeting = period + 1, week-record shape)
- [FULL] Doc 1770 (operations guide: denominations, batch flow, camera +10)
- [FULL] Doc 1772 (canon lineage; supersedes 696 for lineage claims)
- [FULL] Docs 975/977 (measured on-chain numbers + correction catalogue)
- [FULL] Doc 703 (audit: signer set, onboarding gap), doc 1068 (build plan), doc 1307 (Hats tree)
- [FULL] ICM fractal box draft (~/.zao/drafts/2026-08-17-icm-updates-fractal.md)
- [FULL] zao-fractal-bot repo state + open PRs (read 2026-08-20)
- [FULL] OneNote fractal todos sweep (vault: onenote/todo/fractal-todos.md) - year-3 feedback, splits, ideas backlog
