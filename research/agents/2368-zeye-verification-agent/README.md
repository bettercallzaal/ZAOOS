---
topic: agents
type: decision
status: awaiting-zaal
last-validated: 2026-08-22
superseded-by:
related-docs: "2367, 2366, 601, 882"
original-query: "Yes please let's spin up a new agent called Zoe 2"
tier: STANDARD
---

# 2368 - ZEYE: the verification agent, proposed (NOT built)

> **Goal:** Zaal asked for a new persistent agent. `CLAUDE.md`'s own rule -
> "**no new bots without doc**: write a numbered research doc + get explicit
> Zaal approval" - makes this doc the gate. **Nothing has been built. This is the
> proposal to approve, amend, or reject.**

## Status: AWAITING ZAAL. Nothing deployed, no token, no process.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **The name "ZOE 2" was rejected, by Zaal, on being shown the collision.** | `ZOE v2 / Agent Zero migration plan` is on CLAUDE.md's Decommissioned list (2026-05-04, doc 601) marked "do NOT propose, build, or restart." Reusing the name makes it mean two opposite things permanently. |
| 2 | **Proposed name: ZEYE** (ZAO Eyes). Alternate: ZOV (ZAO Observation + Verification). | Both verified free - grep of `research/`, `bot/`, `src/` returns zero hits for either. ZEYE ties to the organ vocabulary Brandon already uses and Zaal has LOCKED (`project_brandon_organism_directives`: Spine / Heart / Cortex / **Eyes** / Bloodstream / Mouth), and the function IS the eyes: independent observation of reality against reported state. Zaal picks; this is a reversible naming call logged per `lane-autonomy.md`. |
| 3 | **Its job is the one thing the estate provably cannot do: independently observe.** | Doc 2367 verified five FALSE GREEN incidents. In every one, the system's self-report was green and reality was not. Nothing in the estate independently checks a self-report against ground truth. |
| 4 | **It is NOT a Telegram bot and should not become one.** | Doc 2366 measured 429 unread / 0 actionable from an existing bot. Adding a sixth voice to that channel is the precise wrong move. ZEYE writes to the board and `/hud`; it interrupts only through the Tier-1 gate 2366 defines. |
| 5 | **Build the smallest version first, and only if the derivation says so.** | The independent derivation of whether a continuous Truth/Attention Monitor is even warranted was commissioned 2026-08-22 and is not back yet. **Approving this doc should wait on it.** Doc 2367 already argues the smaller move (extending the existing write-not-liveness audit) caught one of the five with no new organ at all. |

## Why a new agent at all - the evidence, not the vibe

From doc 2367, all VERIFIED:

| Incident | Self-report | Reality |
|---|---|---|
| heartbeat `curl -s -o /dev/null` | exit 0, systemd `Finished` | POSTs 401'ing for ~4 days |
| vault log | "nothing merged" | 158 PRs merged |
| bus poller | fetch succeeded, repeatedly | state never advanced |
| farscout | `active`, heartbeat `up` | 0.0% CPU, 0 output/30d, retired 2 months prior |
| ZOL drafts | passed every guard | five fabricated entities, zero repo hits |

**The common property is not a lifecycle stage.** It is that a cheap-to-obtain
signal (exit code, process liveness, "the check passed") was accepted as proof
of an expensive-to-obtain fact (the effect happened, work was done, the content
is true). `state-claims.md` already states this law. **The estate has the theory
and lacks the enforcer.** That gap is ZEYE's entire remit.

## What ZEYE would do (PROPOSED)

1. **Re-derive, never re-read.** For each health claim, obtain the fact by an
   independent path. Not "does the heartbeat row say up" but "has this service
   written anything." Doc 2282's write-not-liveness test, generalised and run
   continuously.
2. **Assert on content, not status.** Every check names what it measured
   (`state-claims.md`), and a check whose verifier is missing FAILS rather than
   passing (`silent-failure-guard.md` rule 3).
3. **Report to a pull surface by default.** Board + `/hud`. Interrupt only on the
   Tier-1 gate from doc 2366.
4. **Emit its own liveness the same way it judges others** - by output, not by
   process. A verification agent that could itself false-green would be the
   funniest possible failure and must be designed against explicitly.

## What ZEYE must NOT be

- **Not a sixth Telegram voice.** See Decision 4.
- **Not a reasoning engine over the message bus.** Brandon is firm the transport
  stays boring; doc 2367 agrees.
- **Not a replacement for the existing audits.** It generalises doc 2282's test;
  it does not supersede `zao-lane-health`, `zao-guard`, or the doc-2366 digest.
- **Not autonomous in anything gated.** Money, outbound, on-chain, irreversible,
  deletion stay Zaal's (`lane-autonomy.md`, `no-rm-rf.md`). It reports; it does
  not remediate.
- **Not a thing that lists 96 checks and runs none.** Doc 288's monitoring survey
  recommended four tools in April and **none was ever adopted** - the estate's
  own precedent that a monitoring proposal is easy and a running check is hard.

## The honest case against building it

Recorded because it may be the right answer:

- **Three of the five incidents were caught by a human noticing**, and two by an
  audit that already exists (doc 2282's test, extended to systemd today, which
  caught farscout). Extending existing checks has a measured hit rate; a new
  organ has none.
- **The single largest incident was one missing `curl -f`.** A one-line fix and
  an estate-wide `curl` audit would have prevented it - no agent required.
- **`vanishing-dependencies.md` warns exactly here:** a new thing that depends on
  running forever is a new thing that can silently stop.
- So: **the minimum viable version of ZEYE may be a cron and three assertions,
  not an agent.** That is the null hypothesis this doc is trying to falsify, and
  the commissioned derivation exists to answer it.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Read the independent derivation (commissioned 2026-08-22, neutral workspace, no ZAO context) before approving anything here | @Zaal | Read | 2026-08-23 |
| Pick the name: ZEYE, ZOV, or your own | @Zaal | Decision | 2026-08-23 |
| Approve / amend / reject this agent per the no-new-bots rule. A rejection in favour of "extend the existing audits" is a legitimate and possibly correct outcome | @Zaal | Decision | 2026-08-24 |
| Regardless of the above: audit every `curl` in the estate for missing `-f`/status checks - the largest verified incident was one flag | @Zaal (Claude) | Fix | 2026-08-27 |

## Sources

- [FULL - read on disk] `CLAUDE.md` Primary Surfaces + Decommissioned list (the ZOE v2 collision, the no-new-bots rule).
- [FULL - measured 2026-08-22] the five incidents, per doc 2367 - VPS `heartbeat.sh:30`, farscout process/output measurement, Pi `zol/daily.log` fabricated drafts + zero-hit grep.
- [FULL - grep of research/, bot/, src/ 2026-08-22] ZEYE and ZOV return zero hits; ZED matches the Zed editor; IRIS matched a substring, not a name.
- [FULL - read on disk] memory `project_zol_farcaster_agent` establishing the acronym convention (ZOL = ZABAL Opinion Leader), `project_brandon_organism_directives` (the Eyes organ).
- [FULL - read on disk] doc 288's monitoring-tool recommendations and the four-months-nothing-adopted outcome noted in doc 2354.
