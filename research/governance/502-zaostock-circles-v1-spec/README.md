---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: "497, 498, 499, 500, 501, 050, 432"
tier: STANDARD
original-query: "Design flat-org governance spec for 19-person ZAOstock team using circles, Loomio consent, and Respect tracking (reconstructed)"
---

# 502 — ZAOstock Circles v1 Spec

> **Goal:** Governance framework for 19-person ZAOstock team: 6 circles (music, ops, partners, merch, marketing, host), Loomio for strategy consent, Event Keys budget autonomy, Respect earnings on surplus

## Key Decisions

| Question | Decision | Source |
|---|---|---|
| Shape of the team | **Circles + Event Keys + Fractal Respect** (hybrid) | 497 + 498 + 500 |
| Role of Zaal | **Convener** - legal + contract holder, same voice on decisions | User confirmed (a) |
| Decision tool | **Loomio** (free, co-op) for strategy; Telegram bot + coordinator for ops | 497 + 500 |
| Rotation cadence | **8 weeks** per coordinator | 499 |
| Cross-team cadence | **Monday 30-min all-hands** | 499 |
| De-risk milestone | **Aug 15 mini-festival dry run** | 499 |
| Contribution tracking | **ZAOstock Respect** - Fibonacci, soulbound, profit-share on surplus | 498 |
| Onboarding pattern | **"My First Week" dashboard card** + buddy + routing rules | 501 |
| Top anti-pattern | **Tyranny of Structurelessness** - explicit rules beat informal consensus | 499 + 501 |

## Pareto 80/20

**20% of the spec that delivers 80% of the flatness:**

1. Drop lead/2nd/member/advisory columns. Replace with `circles` (multi-tag).
2. Coordinator per circle = budget holder ($1-5K), rotates every 8 weeks, not a boss.
3. Loomio for strategy consent decisions. 48h silent window = yes.
4. Monday all-hands, 30 min.
5. Bot logs who answers what + flags silent-star (>40% Q/A) early.

## Spec

### Circles (6)

| Circle | Scope | Current people |
|---|---|---|
| **music** | Artist booking, sound, stage programming | DCoop, Shawn, (pickers: Candy, Iman, DFresh, Maceo, Ohnahji B) |
| **ops** | Site, power, tents, vendors, logistics | FailOften, Geek, Hurric4n3Ike, Jake, Jango, Swarthy Hatter, Thy Revolution, Zaal |
| **partners** | Sponsors, local businesses, Wallace Events | Zaal + pickers |
| **merch** | T-shirts, posters, print, day-of sales | open |
| **marketing** | Socials, newsletter, local press, signage | Zaal + pickers |
| **host** | Artist hospitality, volunteer coord, experience | open |

Anyone can join / leave any circle via bot command. Minimum 1 circle, max 5.

### Coordinator rotation

- Each circle picks coordinator every 8 weeks (self-select or rotation).
- Coordinator = mic-holder + checkbook. Has $1-5K stream-level spend authority (Event Keys pattern, doc 500).
- Coordinator's job: represent circle in Monday sync, unblock execution, escalate strategy decisions to Loomio.
- Not a boss. Cannot override circle consent.

### Decision flow

| Decision type | Path | Timebox |
|---|---|---|
| **Strategy** (budget, scope, timeline) | Loomio consent - 48h silent window = yes | 48h |
| **Ops execution** (vendor call, load-in time, which printer) | Coordinator decides, circle visibility | immediate |
| **Cross-circle** | Raised at Monday all-hands, if blocked -> Loomio | 1-7 days |
| **Legal / contract** | Zaal (convener) signs. Circles may advise. | ad-hoc |

### Monday all-hands

- 30 min, weekly, probably 6pm ET
- Each circle coordinator drops 1-sentence status
- Open consent items from Loomio reviewed
- Cross-circle asks surface

### ZAOstock Respect (optional, earned)

- Mirrors The ZAO's Respect Game mechanic (doc 050, 498)
- Soulbound ERC-1155 on Optimism (reuse existing ZOR contract with new `tokenId` for ZAOstock)
- Earned via 2-weekly peer-ranked contribution Fibonacci: L6=110, L5=68, L4=42, L3=26, L2=16, L1=10
- **Economic outcome:** if sponsors exceed budget, surplus distributes pro-rata by Respect accumulated. If flat = no payout, just on-chain record.
- Non-ZAO teammates can earn ZAOstock Respect without being ZAO members. 30-min orientation required.

### Onboarding (week 1 of any new teammate)

- Bot `/start` -> "welcome, you're a ZAOstocker. Pick 1+ circle."
- Bot auto-pairs buddy (someone in their top-pick circle)
- Dashboard shows "My First Week" card:
  - Buddy name + TG handle
  - 3 pickable first tasks (not assigned - claim via `/claim <task-id>`)
  - Clickable circle map with coordinator + member list
  - Routing rules: culture Q -> buddy · work Q -> circle coordinator + /ask bot · blocker -> 24h escalate · idea -> /idea
- Bot DMs buddy at weeks 1, 2, 4, 8 to check on new person
- Card auto-hides after week 2

### Protecting flatness (explicit anti-patterns)

| Anti-pattern | Fix |
|---|---|
| Tyranny of Structurelessness | Explicit Loomio rules, publicly pinned routing rules |
| Silent Star (1 person answers 40%+) | Bot tracks Q/A distribution, alerts Zaal if skewed |
| Perfectionism trap | Reframe decisions as "safe-to-try, safe-to-reverse" |
| Blockchain theater on ops | Don't vote on logistics. Coordinator decides. |
| Zaal-as-parent | Zaal's circle updates go through same format as everyone else |
| Tenure signaling | Bot rotates "new-teammate welcomer" role weekly |

### Timeline

- **Now (late April):** publish spec, SQL migration for circles + coordinators, bot command expansion (/join /leave /propose /claim), dashboard rename + circles column
- **May 1:** first coordinators picked (self-select in first week)
- **May 15:** first Loomio decisions run through full flow
- **Jun 15:** first coordinator rotation
- **Aug 15:** mini-festival dry run
- **Oct 3:** ZAOstock festival
- **Oct 10:** Respect payouts from sponsor surplus (if any)
- **Oct 15:** v2 spec retro

## Comparison table - approaches evaluated

| Model | Flatness | Decision speed | ZAO-native | Fits 19 ppl | Day-1 clarity | Pick? |
|---|---|---|---|---|---|---|
| Everyone = ZAOstocker, scope tags | High | Medium | Low | Yes | Low | No |
| Circles + sociocracy-lite | High | Medium | Medium | Yes | Medium | Base |
| Open mic / pure proposal queue | Very high | Low | Medium | Risky | Low | No |
| ZAO Fractal (pure mirror) | High | Low | Very high | No (we're 19, not 6x3) | Low | No |
| Fugazi pure consensus | Very high | Very low | Low | Edge (maxes 20) | Low | No |
| **Circles + Event Keys + Fractal + Onboarding-flat (hybrid, this spec)** | **High** | **Medium-high** | **High** | **Yes** | **High** | **YES** |

## Also See

- [Doc 497](../497-sociocracy-circles-small-teams/) - sociocracy deep dive
- [Doc 498](../498-zao-fractal-adapted-for-zaostock/) - ZAO fractal mechanic for ZAOstock
- [Doc 499](../../events/499-music-festival-collective-governance/) - music collective governance
- [Doc 500](../500-dao-event-coordination-patterns/) - DAO event coordination
- [Doc 501](../501-flat-org-onboarding-ux/) - onboarding UX for flatness
- [Doc 050](../../community/050-the-zao-complete-guide/) - The ZAO guide (Respect, fractals, OREC)
- [Doc 432](../../community/432-zao-master-context-tricky-buddha/) - ZAO master positioning

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| SQL migration: scope -> circles multi-tag, coordinator column, consent_proposals table | Round-2 agent | PR | 2026-04-28 |
| Bot command expansion: /join /leave /propose /consent /claim /buddy /coordinator | Round-2 agent | PR | 2026-04-30 |
| Dashboard: "My First Week" card, circles column, coordinator badge, Silent Star detector | Round-2 agent | PR | 2026-05-05 |
| Loomio integration feasibility test + Telegram bridge pattern | Round-2 agent | Research + prototype | 2026-04-30 |
| Pinned routing rules doc for TG group | Zaal | Message | 2026-04-27 |
| First coordinators self-select | Circles | TG nominations | 2026-05-01 |
| Aug 15 dry-run planning | Circles + Zaal | Decision via Loomio | 2026-06-01 |

## Sources

- [Doc 497 — Sociocracy Circles for Small Teams](../497-sociocracy-circles-small-teams/) [FULL] — Circles + consent mechanics for 6-50 person orgs. Local research doc.
- [Doc 498 — ZAO Fractal Adapted for ZAOstock](../498-zao-fractal-adapted-for-zaostock/) [FULL] — Fibonacci Respect scoring, soulbound ERC-1155 minting, surplus-share mechanics. Local research doc.
- [Doc 499 — Music Festival Collective Governance](../../events/499-music-festival-collective-governance/) [FULL] — Loomio decision flow, FWB Event Keys pattern, Metagov deliberative arc. Local research doc.
- [Doc 500 — DAO Event Coordination Patterns](../500-dao-event-coordination-patterns/) [FULL] — Nouns, FWB, Devconnect, Coordinape comparison. Local research doc.
- [Doc 501 — Flat Org Onboarding UX](../501-flat-org-onboarding-ux/) [FULL] — "My First Week" dashboard, buddy system, routing rules, Silent Star detector. Local research doc.
- [Doc 050 — The ZAO Complete Guide](../../community/050-the-zao-complete-guide/) [FULL] — Respect Game mechanics, OREC ledger, fractal structure baseline. Local canonical doc.
- [Doc 432 — ZAO Master Context (Tricky Buddha, April 2026)](../../community/432-zao-master-context-tricky-buddha/) [FULL] — Music-first + community + tech positioning, event strategy, Cruise vision. Local research doc.
- Ted Rau, "Many Voices One Song" (sociocracy manual) [PARTIAL] — Referenced in Doc 497 for consent process patterns.
- Jo Freeman, "The Tyranny of Structurelessness" (1972) [PARTIAL] — Anti-pattern framework referenced in Docs 499 and 501.

**Integration:** All 5 docs (497-501) synthesized into single spec. Timeline milestones tied to Docs 499-500 recommendations. Coordinator rotation (8-week cadence) derived from Coordinape epochs + FWB Event Keys + Nouns residency patterns.
