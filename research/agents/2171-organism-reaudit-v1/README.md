# Doc 2171 - ZAO Organism Re-Audit v1 (verification of doc 2170 + this session's fixes)

**Date:** 2026-07-31
**Trigger:** Zaal - "can we do a full reaudit" after the organism diagnostic (doc 2170) and its repair PRs.
**Method:** Two fresh read-only agents - (1) re-measured the organism metrics AND adversarially tried to REFUTE the diagnostic's root causes + this session's fixes; (2) swept the broader public surface (repos, config, drift, secrets) that the organism-only diagnostic did not cover. Skeptic stance, not cheerleader. Anti-fabrication throughout.
**Related:** [[project_brandon_organism_directives]], doc 2170 (the diagnostic), PRs #2773 (R0), #2774 (R1), #2775 (R4), #2776 (config leak), #2771 (R2 spec), zabalgames #588 (scrub).

---

## HEADLINE

The diagnostic held up. **All five root causes survived adversarial scrutiny** (one qualified). The two fixes already shipped (R0, R1) were independently verified as REAL, not cosmetic. The reaudit also found **one live public leak the first pass missed** (now fixed) and named 5 system-level gaps the organism-only diagnostic didn't cover. Two honesty corrections to doc 2170's numbers are recorded below.

## RE-MEASUREMENT (vs doc 2170) - two honest corrections

| Metric | Doc 2170 | Re-audit | Verdict |
|---|---|---|---|
| receipts | 14, 1 tool, latest 07-28 | 14, 1 tool, latest 07-28 | MATCHES |
| effect_intents | 0 | 0 | MATCHES |
| agent_runs | 14 | 14 | MATCHES |
| memory files | 377 | 377 | MATCHES |
| board open | 345 | 346 | MATCHES |
| board completed 7d | 21 | 133 | **CORRECTION**: a 91-task bulk close landed 07-28 AFTER the diagnostic snapshot. Not fabrication - the diagnostic was a point-in-time read. |
| board synthetic dues | "52% fiction" | 152/1367 = 11% of ALL tasks; 52% of the RANKED/decision-relevant subset (283) | **CORRECTION**: "52% of the board" overstated. It is 52% of the *ranked* set, ~11% overall. The Cortex point still holds - the items it ranks on are 52% synthetic - but the whole board is not 52% fiction. |
| PRs merged 7d | 145 | 223 | Velocity INCREASED (+54%). The "acts fast" half of the diagnosis is even stronger than stated. |

Net: doc 2170 is qualitatively sound and quantitatively a snapshot. The one framing to retract is "the board is 52% fiction" -> say "the *ranked* set the Cortex prioritizes on is 52% synthetic; the board overall is ~11%."

## ADVERSARIAL FIX VERIFICATION (independent skeptic tried to refute each)

| Fix | PR | Verdict | Evidence |
|---|---|---|---|
| R0 relay holds-fix | #2773 | **REAL** | saveHubRelays now POSTs `rpc/relay_hub_merge {p_patch:{relays}}` (atomic merge) instead of the whole-object PATCH; holds survive a relay write. |
| R1 afferent digest | #2774 | **REAL** | new module queries real receipts columns, idempotent per-day key, emits receipt + Bonfire episode, loud-fail; closes Execution->Receipt->Memory for the daily digest. R1b (widen emission to all 19 loops) still pending. |
| R4 heart consumer | #2775 | REAL (post-audit) | wraps repo-improver-scout in executeWithLease, flag-gated OFF; verified 0 new type errors. |
| zabalgames scrub | #588 | REAL for public copy | Magnetiq/SongJam gone from HTML + rendered JSON; bonfire-graph.json knowingly left as historical graph (flagged in the PR, not falsely claimed clean). |

## ROOT-CAUSE SURVIVAL (all 5 CONFIRMED)

1. **Afferent loop unbuilt** - CONFIRMED. 14 receipts, one loop, no claims table. R1 partially fixes; R1b pending.
2. **Bloodstream destroys holds** - CONFIRMED. Whole-object PATCH; R0 fixes.
3. **Board ranked-set is synthetic** - QUALIFIED CONFIRMED (see the 52%-vs-11% correction). R2 (doc 2169) fixes the ranking axis.
4. **Memory index 88% orphaned** - CONFIRMED. 45/377 indexed, 43% dangling links, 1 write/7d. R3 + R1b pending.
5. **Heart inert** - CONFIRMED. Flag OFF, effect_intents=0. R4 gives it a first consumer (flag-gated).

## NEW FINDINGS (beyond the organism internals)

- **LIVE LEAK (now FIXED, PR #2776):** `community.config.ts` still listed Magnetiq + SongJam in `partners[]`, rendered on `zaoos.com/ecosystem` - both retired brands shown as active partners (~4 months stale). The earlier scrub covered the zabalgames site + memory but not this ZAOOS config. Caught by the reaudit, fixed same session.
- **Security: CLEAN.** Last 20 ZAOOS commits scanned - no private keys, sk-ant-, ghp_, PEM blocks, no committed .env. `.env` is gitignored + 600.
- **48 public repos** across bettercallzaal + ZAODEVZ. ~13 are stale (60+ days, several with blank descriptions: ZAO101, ZAOmemberz, ZAOpoker, Zuke, farscout). No auto-check on stale public repos - triage candidate.

## FIVE SYSTEM-LEVEL GAPS the organism-only diagnostic did not cover

1. **Graduated-app ownership** - COC Concertz / Sparkz / Zoostr have own repos but ZAOOS still owns shared deps (ICM boxes, zao-brand). No "graduation checklist" / dependency lock.
2. **Public-repo staleness** - ~13 aged/undescribed public repos; no quarterly health scan or CI gate.
3. **ICM box freshness** - boxes are "upstream truth" (icm-grounding.md) but no audit that they are current vs the surfaces they describe.
4. **VPS disk + cost** - operator scripts live, but no persistent fleet-health/cost metric surface after the 07-31 disk fix.
5. **Test-coverage gate** - typecheck passes, vitest exists, but no per-directory coverage floor or per-branch run data.

## UPDATED REPAIR STATUS

| Repair | State |
|---|---|
| R0 relay holds-fix | PR #2773 (verified REAL) - awaiting gated merge+deploy |
| R1 afferent digest (keystone) | PR #2774 (verified REAL) - awaiting gated merge+deploy |
| R4 heart first consumer | PR #2775 (verified) - awaiting merge; enable via `ZOE_REPO_IMPROVER_LEASES` |
| Config leak fix | PR #2776 (reaudit finding) - awaiting gated merge |
| R2 daily-note capture | SPEC PR #2771 - blocked on Zaal's approve-to-build |
| R3 memory index rebuild | not started - lowest coherence-impact of the five |
| R1b widen receipt emission | follow-up - so the digest covers all 19 loops, not just repo-improver |

## Conclusion

The organism diagnosis is verified: the organism acts far faster than it records that it acted, and the afferent loop (Execution->Receipt->Claim->Memory) is the keystone break. The reaudit changed nothing about the direction - it tightened two numbers, confirmed the fixes are real, caught one missed public leak (fixed), and widened the lens to 5 system-level gaps. Nothing here is deployed; every fix is a PR behind Zaal's gate.
