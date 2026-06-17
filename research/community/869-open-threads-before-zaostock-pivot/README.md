---
topic: community
type: audit
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: 839, 842, 854, 856, 866
original-query: "/zao-research everything else that's missing before we attack the ZAOstock stuff - a clean snapshot of every open thread + gap across the Fellenz brand arc, the zao-101/201 front end, WaveWarZ, and loose meeting actions, so nothing gets dropped on the pivot to ZAOstock."
tier: STANDARD
---

# 869 — Open Threads + Gaps Before the ZAOstock Pivot

> **Goal:** Before switching focus to ZAOstock, snapshot everything still open across the recent arc (Fellenz brand cleanup, zao-101/201, WaveWarZ, COC, loose meeting actions) so nothing is lost. This is a state audit, not new external research - most gaps are execution, not unknowns.

## Key finding

The Fellenz brand cleanup is **mostly shipped and live**. What remains is **one big unbuilt thing (the zao-101/201 rebuild) + two undone Fellenz items (Telegram, the commitment model in-product) + a parked build (WaveWarZ) + a handful of loose meeting actions.** Almost none of it needs research - it needs execution. Clean to pivot to ZAOstock as long as these are tracked.

## Fellenz challenges — status (doc 839)

| # | Challenge | Status |
|---|-----------|--------|
| 1 | ZABAL eclipsing The ZAO | DONE / live + merged across zao-101, zao-stock, wwbase, wavewarzapp |
| 2/3 | ZABAL Games scope + delineation | DONE on the public surface (zabal-games page). Reposition of ZABAL to "incubated project" (not toolstack tier) is DECIDED (doc 856) but NOT yet built on the live org page |
| 4 | COC Concertz framing | RESOLVED (doc 866 - 50/50 JV, Thy Rev leads, indifferent on naming). Fellenz messaged + reply sent. Remaining: drop the "(framing pending COC confirmation)" tag from the org chart + zao-101 copy and publish the partnership wording |
| 5 | Org chart | DONE / live. Remaining: ZABAL reposition + the on-page copy button (decided, not built); update doc 842 to match |
| 6 | Telegram overhead | NOT done. Decided: ZAOstock bot DM-only (turn off group sharing), no daily digest. Not executed - infra task |
| 7 | Entry point | DONE / live (/join "Start here"). The stronger /join (commitment model) is part of the unbuilt 101/201 rebuild |
| 8 | Onboarding + commitment | Model DEFINED (doc 856: self-set commitment, two-per-task main+understudy, check-ins). NOT yet built into /join or operationalized |

## The big unbuilt thing — zao-101 / 201 rebuild

- **Spec is locked** (doc 856 + the build prompt): one repo, two tiers; ZAO 101 open front door, ZAO 201 token-gated (OG/ZOR on Optimism); both consume the canonical Nexus API (verified live, `nexus.thezao.com/api/links`, 479 links); org page gets the on-page copy button + ZABAL reposition; /join gets the commitment model; content pulls from NEXUS + ZAO OS.
- **State:** build prompt written, NOT run. This is the single largest open piece of the front-end arc.
- **One edit to the spec:** the COC "pending" tag can now be dropped (doc 866 resolved it) - tell the build to state the partnership framing directly.

## Parked — WaveWarZ 24h protocol

- v1 backend slice built (entry-queue, x402, Audius pull, settle on existing CandyToyBox/wavewarz-base contracts). PR #9 (DRAFT) on CandyToyBox/wavewarz-base.
- PARKED awaiting Logesh's feedback. Not blocking. Resumable: needs testnet secrets to run the on-chain dry run. (doc 854)

## Loose meeting actions (don't lose on the pivot)

- **Thy Rev (doc 866):** laptop crowdfund (giver.io, Mac Mini ~$600, seed $100); Thy Rev adds Zaal as Decentraland admin; schedule a COC Concerts call + a ZABAL Games slot for Thy Rev; share tomorrow's COC event.
- **Bayo (doc 841):** connect Bayo's brother into ZAOstock + WaveWarZ; evaluate the Atrium content-studio revenue intro; Bayo's wedding Jun 26.
- **Email/Workspace (doc 852):** add aliases (submissions@/volunteer@) + a team@ Group when ready - free, no blocker.

## What needs RESEARCH vs EXECUTION

- **Needs research: almost nothing.** The arc is execution-bound. The two genuine unknowns both live in the WaveWarZ protocol (doc 854), not here: (a) whether to ever build a real two-sided market-maker role, (b) the bridge choice for mainnet. Both are parked with WaveWarZ.
- **Everything else = execution:** run the 101/201 build, do the ZAOstock-bot DM-only fix, drop the COC pending tag, update doc 842.
- **ZAONEXUS brand check** (last item from the per-repo plan): likely a no-op - NEXUS is already The-ZAO-led and is now the canonical source the front end consumes. Verify-and-close, don't research.

## Clean pivot to ZAOstock

Nothing above blocks starting ZAOstock. The two things that would be embarrassing to drop: (1) the Thy Rev laptop crowdfund (a commitment made on a call), and (2) running the 101/201 build while its spec is fresh. Everything else can wait behind ZAOstock.

## Also See

- [Doc 839](../../events/839-fellenz-brand-org-strategy/) - Fellenz critique
- [Doc 856](./../856-zao101-content-expansion/) - 101/201 content + spec
- [Doc 866](../../events/866-thyrev-zaal-coc-framing-laptop/) - COC resolution
- [Doc 854](../../wavewarz/854-wavewarz-24h-protocol-engagement-engine/) - WaveWarZ protocol (parked)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run the ZAO 101/201 build (spec locked; drop COC "pending" tag) | Zaal (CC terminal) | Build/PR | Before spec goes stale |
| ZAOstock bot DM-only (turn off group sharing) | Zaal / Iman | Infra | Next |
| Thy Rev laptop crowdfund (giver.io) + seed $100 | Zaal | Ops | This week |
| Update doc 842 org chart: ZABAL = incubated project; drop COC pending tag | Zaal | Doc | Quick |
| Then: pivot to ZAOstock | Zaal | - | After |

## Sources

- Open PR + merge state across zao-101, zao-stock, wwbase, wavewarzapp, CandyToyBox/wavewarz-base, ZAOOS (gh API, 2026-06-17) `[FULL]`
- Docs 839, 842, 854, 856, 866 (this arc) `[FULL]`
- Nexus API live check `nexus.thezao.com/api/links` (2026-06-17, 479 links) `[FULL]`
