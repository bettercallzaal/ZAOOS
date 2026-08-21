---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-20
related-docs: 2152, 2145, 2138, 2124, 1237, 743
original-query: "Brandon 2026-07-20 items: WaveWarZ receiptable-by-design (card 07994788) + DadFi.org rewrite (card a5dcf472) - status + decision brief"
tier: STANDARD
---

# 2357 - Brandon's Two July-20 Items: Receipts Are Built, DadFi's Domain Is Dead

> **Goal:** Close the loop on two month-old Brandon items (cards 07994788, a5dcf472)
> before writing anything new against them. Verdict: the "receiptable by design"
> concept has been substantially BUILT since the card was written and needs one
> adapter decision, not a concept doc; the DadFi rewrite is moot until Brandon
> renews the domain - dadfi.org is an expired-domain parking page as of 2026-08-20.
> This doc is founder-facing (dreamnet-communication-standard, scaled) and is the
> material FOR Zaal's next Brandon conversation. Nothing goes to Brandon directly -
> outbound is Zaal's.

## Part 1 - Card 07994788: "WaveWarZ receiptable by design"

### Executive summary (30 sec)

Brandon asked (7/20) for every consequential WaveWarZ action to emit a verifiable
receipt - a chain of evidence a user can click instead of trusting us. A month
later the honest status is: **the receipt machinery itself is already built,
tested, and federation-conformant inside ZAOOS** - what is NOT built is the
WaveWarZ-specific adapter that feeds battle/trade/payout events into it. A
zol-side proposal (zol PR #65, three options) has been stalled on a design
decision since 2026-07-24. The estate has moved under that PR: the right path
now is the ZAOOS receipt spine, and the stalled options should be re-decided
against it. One tap decides it.

### Why this matters

The receipt is the fix for the WaveWarZ audit's #1 finding (estimated analytics
shown as verified) and the thing that makes the "Don't Trust, Verify" whitepaper
literally true. It is also the concrete first surface of Brandon's DreamNet
chain (Identity -> Action -> Receipt -> Reputation -> Trust). Retrofit is the
expensive path he warned about - and because the spine now exists, the retrofit
window is still cheap.

### Before / After

- **Before (card as written, 7/20):** receipts were a concept. The only concrete
  primitive was ZOL v2's receipt-journal, and the proposal was to export or
  adapt it (zol PR #65 options A/B/C).
- **After (today, verified in the repo):** ZAOOS carries a full receipt spine -
  every distributed Observation leaves as a portable `dreamnet.receipt.v1`
  byte-identical to DreamNet's canonical form, outside parties verify us over a
  public wire with no shared secrets, and lease/outbox actions emit execution
  receipts on the same digest family. Doc 2152's own words: outbound actions
  are federation-verifiable - **"receiptable by design."** The phrase on
  Brandon's card is now a shipped property of the organism's plumbing - just
  not yet of WaveWarZ's events.

### Evidence (Proven / Hypothesis / Not yet tested)

**Proven (read this run from docs 2152/2138/2145, which cite the code and tests):**
- Spore receipt.v1 + canonical hashing byte-identical to DreamNet, cross-runtime
  fixtures passing; ZAO = first independently-operated conformant Spore node
  (doc 2138: 47/47 conformance).
- Live emission: `src/lib/spore/receipt-emitter.ts` (every distributed
  Observation -> receipt), public verify wire at `POST /api/spore/verify`.
- Heart execution receipts + outbox commits emitting receipt.v1 (docs 2139/2145).
- zol PR #65 state: OPEN, last updated 2026-07-24, blocked on the A/B/C
  decision (gh, read this run).
- Proof Drops (`src/lib/dreamnet/proof-drop/`) - the claim+evidence pattern,
  present in the tree (ls, this run).

**Hypothesis (stated, not verified this run):**
- ZOL v2's receipt-journal module as the alternate primitive - known from the
  project memory, not re-read; and ZOL has been out of OpenRouter credits since
  Aug 3 (fractal lane scope note), which operationally weakens any zol-side path.

**Not yet tested / not built:**
- Any WaveWarZ event actually emitting a receipt (battle, trade, leaderboard
  calc, payout). Zero WaveWarZ receipts exist today.
- Receipt-backed answers to the audit's "estimated vs verified" analytics rows.

### The decision (the one tap this card needs)

zol PR #65's three options, re-graded against today's estate:

| Option | 7/20 framing | Today's grade |
|---|---|---|
| A - export receipt JSON from ZOL's ReceiptJournal | viable then | Superseded - duplicates a second receipt impl; zol path also operationally stalled |
| B - WaveWarZ emits per-action receipts natively | right instinct | Right END STATE, wrong first step - big build before any receipt exists |
| **C - adapter: WaveWarZ events -> the ZAOOS Spore receipt path (recommended)** | "receipt adapter" | The spine exists NOW: map battle/trade/payout events onto Observation -> receipt.v1 via the existing emitter; federation-verifiable on day one; B becomes an incremental widening of event coverage |

**Recommendation: C on the ZAOOS Spore spine, starting with the three events the
audit flagged (leaderboard calc, winner/settlement, payout).** Close zol PR #65
with a pointer here so the stalled branch stops looking like the live path.
The decision itself is Zaal's (and Brandon's blessing) - this doc parks it as
a tap, builds nothing.

### Biological analogy

The organism already has lab-grade bloodwork: every organ (Eyes' observations,
Heart's leases, the outbox's outbound acts) leaves a signed trace in the
bloodstream that an outside doctor can verify without opening the body - that is
the Spore receipt layer. WaveWarZ is currently the one limb whose activity never
shows up in the bloodwork. The adapter is not new anatomy; it is hooking an
existing limb to the existing lab.

### Four-lens translation

- **Engineer:** map WaveWarZ events onto the existing Observation -> receipt.v1
  emitter; no new receipt impl, no new infra.
- **Architect:** the organism gains per-limb evidence on the already-conformant
  federation boundary; one receipt family everywhere.
- **Founder:** "why am I #3 / how was this payout computed" gets a clickable,
  reproducible answer - the audit's top trust gap closes with the machinery we
  already paid for.
- **Investor:** "Verified by DreamNet" stops being a slogan: a second product
  (WaveWarZ) emitting third-party-verifiable receipts is the proof any platform
  can adopt the layer - that is the moat Brandon described.

## Part 2 - Card a5dcf472: DadFi.org rewrite

**Stale - the domain itself is gone.** Fetched 2026-08-20: `dadfi.org` serves a
Namecheap "Domain registration has expired" parking page (renewal instructions,
auction upsell - full text captured this run). The card's premise ("dadfi.org
already populated", 7/20) no longer holds; there is no site to rewrite.

- **Right output per the assignment: say so.** Writing "home of the autonomous
  economy" copy against a dead domain would be theater.
- **What survives:** Brandon's positioning (DreamNet builds intelligent systems;
  DadFi = the economy/marketplace where they are enhanced, monetized, financed -
  five surfaces + a discovery engine) is preserved on the card and in the
  project memory; nothing else is needed until the domain lives.
- **For Zaal's next Brandon touch (outbound = Zaal, never this lane):** flag the
  expiry - if DadFi is still live in his plans it is a renewal away, and the
  rewrite card reactivates the day the domain resolves again. If he has moved
  on, close the card.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Tap the receipt decision (C-on-Spore recommended); on yes, close zol PR #65 with a pointer here | @Zaal (+ Brandon) | Decision | Next Brandon sync |
| Tell Brandon dadfi.org expired; renew-or-close the rewrite card | @Zaal | Outbound (gated) | Next Brandon touch |
| On a yes to C: spec the 3-event WaveWarZ adapter (audit-flagged events first) as its own doc/PR | whitepaper lane or fleet | Build (PR-only) | After tap |

## Sources

- Cards 07994788 + a5dcf472 read in full from the cowork tracker this run (the
  receipt card's notes record zol PR #65 + options A/B/C).
- zol PR #65: state OPEN, updated 2026-07-24 - gh, this run.
- dadfi.org: fetched this run (curl, Mozilla UA) - Namecheap expiry page, text
  captured. FULL.
- Doc 2152 (execution layer), doc 2145 (outbox), doc 2138 via 2152 (conformance
  47/47), doc 2124 (Spore v0.2): read/quoted this run - the "receiptable by
  design" line in 2152 is verbatim.
- `src/lib/dreamnet/proof-drop/` existence: ls, this run.
- Memory `project_dreamnet_trust_layer` (Brandon's 7/17-7/20 framing, ZOL v2
  module map): read this run; zol-side module existence is memory-sourced, not
  re-read (marked Hypothesis above).
